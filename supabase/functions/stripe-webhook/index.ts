import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Metadata validation schemas
const LessonMetadataSchema = z.object({
  booking_type: z.literal("lesson"),
  student_id: z.string().uuid(),
  instructor_id: z.string().uuid(),
  lesson_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lesson_time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.string().regex(/^\d+$/),
  total_price: z.string().regex(/^\d+(\.\d+)?$/),
  car_id: z.string().optional(),
  lesson_type: z.string().optional(),
  booking_id: z.string().uuid().optional(),
});

const RentalMetadataSchema = z.object({
  booking_type: z.literal("car_rental"),
  car_id: z.string().uuid(),
  instructor_id: z.string().uuid(),
  rental_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rental_time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.string().regex(/^\d+$/),
});

const PackageMetadataSchema = z.object({
  booking_type: z.literal("package"),
  student_id: z.string().uuid(),
  instructor_id: z.string().uuid(),
  package_id: z.string().uuid(),
  package_name: z.string(),
  total_price: z.string().regex(/^\d+(\.\d+)?$/),
  lesson_count: z.string().regex(/^\d+$/),
  includes_exam: z.string(),
});

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    logStep("Webhook received", { hasSignature: !!signature });

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      logStep("ERROR: STRIPE_WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!signature) {
      logStep("ERROR: Missing stripe-signature header");
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        Stripe.createSubtleCryptoProvider()
      );
      logStep("Webhook signature verified successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logStep("ERROR: Webhook signature verification failed", { message });
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    
    logStep("Event type", { type: event.type });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = session.metadata;
      
      logStep("Checkout completed", { 
        sessionId: session.id, 
        metadata,
        paymentStatus: session.payment_status 
      });

      if (session.payment_status === "paid") {
        // ============ LESSON BOOKING ============
        if (metadata?.booking_type === "lesson") {
          const validationResult = LessonMetadataSchema.safeParse(metadata);
          if (!validationResult.success) {
            logStep("Invalid lesson metadata", { errors: validationResult.error.errors });
            throw new Error("Invalid lesson metadata in webhook");
          }
          
          const validatedMetadata = validationResult.data;
          
          let bookingId: string;
          const totalPrice = parseFloat(validatedMetadata.total_price);
          const duration = parseInt(validatedMetadata.duration);
          
          const PLATFORM_FEE_PERCENTAGE = 0.15;
          const CAR_RENTAL_PRICE_PER_HOUR = 50;
          
          const platformFee = totalPrice * PLATFORM_FEE_PERCENTAGE;
          const hasRentalCar = validatedMetadata.car_id && validatedMetadata.car_id.length > 0;
          const carRentalFee = hasRentalCar ? CAR_RENTAL_PRICE_PER_HOUR * duration : 0;
          const instructorNetProfit = totalPrice - platformFee - carRentalFee;
          
          logStep("Revenue split calculated", { totalPrice, platformFee, carRentalFee, instructorNetProfit, hasRentalCar });

          if (validatedMetadata.booking_id) {
            const { data: updatedBooking, error: updateError } = await supabaseAdmin
              .from("bookings")
              .update({ 
                status: "confirmed",
                notes: `Pagamento confirmado via Stripe. Session ID: ${session.id}`,
              })
              .eq("id", validatedMetadata.booking_id)
              .select()
              .single();

            if (updateError) {
              logStep("ERROR updating booking", { error: updateError.message });
              throw updateError;
            }

            bookingId = updatedBooking.id;
            logStep("Booking updated to confirmed", { bookingId });
          } else {
            const bookingData: any = {
              student_id: validatedMetadata.student_id,
              instructor_id: validatedMetadata.instructor_id,
              date: validatedMetadata.lesson_date,
              time_slot: validatedMetadata.lesson_time,
              total_price: totalPrice,
              status: "confirmed",
              notes: `Pagamento confirmado via Stripe. Session ID: ${session.id}`,
            };

            if (hasRentalCar) {
              const carIdValidation = z.string().uuid().safeParse(validatedMetadata.car_id);
              if (carIdValidation.success) {
                bookingData.car_id = carIdValidation.data;
              }
            }

            const { data: booking, error: bookingError } = await supabaseAdmin
              .from("bookings")
              .insert(bookingData)
              .select()
              .single();

            if (bookingError) {
              logStep("ERROR creating booking", { error: bookingError.message });
              throw bookingError;
            }

            bookingId = booking.id;
            logStep("Booking created successfully", { bookingId });
          }

          // Transactions
          await supabaseAdmin.from("transactions").insert({
            user_id: validatedMetadata.instructor_id,
            type: "lesson_income",
            amount: instructorNetProfit,
            status: "completed",
            description: `Aula em ${validatedMetadata.lesson_date} - Líquido após taxas`,
            reference_id: bookingId,
          });
          
          await supabaseAdmin.from("transactions").insert({
            user_id: validatedMetadata.instructor_id,
            type: "platform_fee",
            amount: platformFee,
            status: "completed",
            description: `Taxa da plataforma (15%)`,
            reference_id: bookingId,
          });
          
          if (carRentalFee > 0) {
            await supabaseAdmin.from("transactions").insert({
              user_id: validatedMetadata.instructor_id,
              type: "car_rental_fee",
              amount: carRentalFee,
              status: "completed",
              description: `Aluguel de veículo (${duration}h x R$50)`,
              reference_id: bookingId,
            });
          }
          
          // Update instructor pending balance
          const { data: instructorProfile } = await supabaseAdmin
            .from("profiles")
            .select("balance_pending")
            .eq("id", validatedMetadata.instructor_id)
            .single();
          
          const currentPending = Number(instructorProfile?.balance_pending) || 0;
          
          await supabaseAdmin
            .from("profiles")
            .update({ balance_pending: currentPending + instructorNetProfit })
            .eq("id", validatedMetadata.instructor_id);
          
          logStep("Instructor pending balance updated", { added: instructorNetProfit });

          // Confirmation message
          const confirmationMessage = `✅ Aula confirmada e paga!\n\n📅 Data: ${new Date(validatedMetadata.lesson_date + 'T00:00:00').toLocaleDateString('pt-BR')}\n⏰ Horário: ${validatedMetadata.lesson_time}\n💰 Valor: R$ ${totalPrice.toFixed(2)}\n\nAgora vocês podem conversar por aqui para combinar os detalhes. Nos vemos em breve!`;

          await supabaseAdmin.from("messages").insert({
            sender_id: validatedMetadata.instructor_id,
            receiver_id: validatedMetadata.student_id,
            content: confirmationMessage,
            booking_id: bookingId,
          });

          logStep("Lesson flow completed");

        // ============ CAR RENTAL ============
        } else if (metadata?.booking_type === "car_rental") {
          const validationResult = RentalMetadataSchema.safeParse(metadata);
          if (!validationResult.success) {
            logStep("Invalid rental metadata", { errors: validationResult.error.errors });
            throw new Error("Invalid rental metadata in webhook");
          }
          
          const validatedMetadata = validationResult.data;
          
          const rentalData = {
            instructor_id: validatedMetadata.instructor_id,
            car_id: validatedMetadata.car_id,
            date: validatedMetadata.rental_date,
            time_slot: validatedMetadata.rental_time,
            status: "confirmed",
          };

          const { data: rental, error: rentalError } = await supabaseAdmin
            .from("car_rentals")
            .insert(rentalData)
            .select()
            .single();

          if (rentalError) {
            logStep("ERROR creating rental", { error: rentalError.message });
            throw rentalError;
          }

          logStep("Car rental created successfully", { rentalId: rental.id });

        // ============ PACKAGE PURCHASE ============
        } else if (metadata?.booking_type === "package") {
          const validationResult = PackageMetadataSchema.safeParse(metadata);
          if (!validationResult.success) {
            logStep("Invalid package metadata", { errors: validationResult.error.errors });
            throw new Error("Invalid package metadata in webhook");
          }

          const vm = validationResult.data;
          const totalPrice = parseFloat(vm.total_price);
          const lessonCount = parseInt(vm.lesson_count);
          const includesExam = vm.includes_exam === "true";

          logStep("Processing package purchase", { packageId: vm.package_id, totalPrice, lessonCount, includesExam });

          // ====== SPLIT LOGIC ======
          const PLATFORM_FEE_PERCENTAGE = 0.15;
          const platformFee = totalPrice * PLATFORM_FEE_PERCENTAGE;

          // Determine if instructor owns a vehicle
          const { data: instrDetails } = await supabaseAdmin
            .from("instructors_details")
            .select("is_vehicle_owner")
            .eq("profile_id", vm.instructor_id)
            .single();

          const isVehicleOwner = instrDetails?.is_vehicle_owner ?? false;

          let carRentalFee = 0;
          if (!isVehicleOwner) {
            // Get car rental price per hour (from investor's car or default)
            const CAR_RENTAL_PRICE_PER_HOUR = 50; // Default R$50/hour
            let rentalHours = lessonCount; // 1 hour per lesson
            if (includesExam) {
              rentalHours += 4; // Exam blocks 4 hours
            }
            carRentalFee = rentalHours * CAR_RENTAL_PRICE_PER_HOUR;
          }
          // Scenario A: owner → only platform fee deducted
          // Scenario B: partner → platform fee + rental hours deducted

          const instructorNetProfit = totalPrice - platformFee - carRentalFee;

          logStep("Package split calculated", {
            isVehicleOwner,
            platformFee,
            carRentalFee,
            instructorNetProfit,
          });

          // Create transaction records
          await supabaseAdmin.from("transactions").insert({
            user_id: vm.instructor_id,
            type: "package_income",
            amount: instructorNetProfit,
            status: "completed",
            description: `Pacote "${vm.package_name}" — Líquido após taxas`,
          });

          await supabaseAdmin.from("transactions").insert({
            user_id: vm.instructor_id,
            type: "platform_fee",
            amount: platformFee,
            status: "completed",
            description: `Taxa Domine (15%) — Pacote "${vm.package_name}"`,
          });

          if (carRentalFee > 0) {
            const rentalHours = lessonCount + (includesExam ? 4 : 0);
            await supabaseAdmin.from("transactions").insert({
              user_id: vm.instructor_id,
              type: "car_rental_fee",
              amount: carRentalFee,
              status: "completed",
              description: `Aluguel de veículo (${rentalHours}h x R$50) — Pacote "${vm.package_name}"`,
            });
          }

          // Update instructor pending balance
          const { data: instructorProfile } = await supabaseAdmin
            .from("profiles")
            .select("balance_pending")
            .eq("id", vm.instructor_id)
            .single();

          const currentPending = Number(instructorProfile?.balance_pending) || 0;

          await supabaseAdmin
            .from("profiles")
            .update({ balance_pending: currentPending + instructorNetProfit })
            .eq("id", vm.instructor_id);

          logStep("Instructor pending balance updated", { added: instructorNetProfit });

          // Send confirmation message to student
          const examText = includesExam ? " + acompanhamento no exame" : "";
          const confirmationMessage = `✅ Pacote contratado!\n\n📦 ${vm.package_name}\n📚 ${lessonCount} aula(s)${examText}\n💰 Valor: R$ ${totalPrice.toFixed(2)}\n\nEntre em contato com seu instrutor para agendar as aulas!`;

          await supabaseAdmin.from("messages").insert({
            sender_id: vm.instructor_id,
            receiver_id: vm.student_id,
            content: confirmationMessage,
          });

          logStep("Package flow completed");
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
