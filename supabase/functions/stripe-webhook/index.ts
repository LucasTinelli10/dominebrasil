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
  booking_id: z.string().uuid().optional(), // For pre-existing bookings
});

const RentalMetadataSchema = z.object({
  booking_type: z.literal("car_rental"),
  car_id: z.string().uuid(),
  instructor_id: z.string().uuid(),
  rental_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rental_time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.string().regex(/^\d+$/),
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

    // Verify webhook signature for security
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
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
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
        // Check if this is a lesson booking or car rental
        if (metadata?.booking_type === "lesson") {
          // Validate lesson metadata
          const validationResult = LessonMetadataSchema.safeParse(metadata);
          if (!validationResult.success) {
            logStep("Invalid lesson metadata", { errors: validationResult.error.errors });
            throw new Error("Invalid lesson metadata in webhook");
          }
          
          const validatedMetadata = validationResult.data;
          
          let bookingId: string;
          const totalPrice = parseFloat(validatedMetadata.total_price);
          const duration = parseInt(validatedMetadata.duration);
          
          // ====== REVENUE SHARE LOGIC ======
          // 15% platform fee
          const PLATFORM_FEE_PERCENTAGE = 0.15;
          const CAR_RENTAL_PRICE_PER_HOUR = 50; // R$50/hour
          
          const platformFee = totalPrice * PLATFORM_FEE_PERCENTAGE;
          const hasRentalCar = validatedMetadata.car_id && validatedMetadata.car_id.length > 0;
          const carRentalFee = hasRentalCar ? CAR_RENTAL_PRICE_PER_HOUR * duration : 0;
          const instructorNetProfit = totalPrice - platformFee - carRentalFee;
          
          logStep("Revenue split calculated", { 
            totalPrice, 
            platformFee, 
            carRentalFee, 
            instructorNetProfit,
            hasRentalCar 
          });

          // Check if this is a pre-existing booking (from request flow)
          if (validatedMetadata.booking_id) {
            // Update existing booking to confirmed
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
            // Create new booking (direct payment flow - legacy)
            const bookingData: {
              student_id: string;
              instructor_id: string;
              date: string;
              time_slot: string;
              total_price: number;
              status: string;
              notes: string;
              car_id?: string;
            } = {
              student_id: validatedMetadata.student_id,
              instructor_id: validatedMetadata.instructor_id,
              date: validatedMetadata.lesson_date,
              time_slot: validatedMetadata.lesson_time,
              total_price: totalPrice,
              status: "confirmed",
              notes: `Pagamento confirmado via Stripe. Session ID: ${session.id}`,
            };

            // Only add car_id if it's a valid UUID
            if (hasRentalCar) {
              const carIdValidation = z.string().uuid().safeParse(validatedMetadata.car_id);
              if (carIdValidation.success) {
                bookingData.car_id = carIdValidation.data;
              }
            }

            logStep("Creating booking", bookingData);

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

          // ====== CREATE TRANSACTION RECORDS ======
          // 1. Instructor income (net profit goes to pending balance)
          await supabaseAdmin.from("transactions").insert({
            user_id: validatedMetadata.instructor_id,
            type: "lesson_income",
            amount: instructorNetProfit,
            status: "completed",
            description: `Aula em ${validatedMetadata.lesson_date} - Líquido após taxas`,
            reference_id: bookingId,
          });
          
          // 2. Platform fee transaction (for tracking)
          await supabaseAdmin.from("transactions").insert({
            user_id: validatedMetadata.instructor_id,
            type: "platform_fee",
            amount: platformFee,
            status: "completed",
            description: `Taxa da plataforma (15%)`,
            reference_id: bookingId,
          });
          
          // 3. Car rental fee if applicable
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
          
          logStep("Transactions created");
          
          // ====== UPDATE INSTRUCTOR BALANCE ======
          // Add net profit to pending balance (will be released later)
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
          
          logStep("Instructor pending balance updated", { 
            previousPending: currentPending, 
            added: instructorNetProfit,
            newPending: currentPending + instructorNetProfit 
          });

          // Create automatic confirmation message
          const confirmationMessage = `✅ Aula confirmada e paga!\n\n📅 Data: ${new Date(validatedMetadata.lesson_date + 'T00:00:00').toLocaleDateString('pt-BR')}\n⏰ Horário: ${validatedMetadata.lesson_time}\n💰 Valor: R$ ${totalPrice.toFixed(2)}\n\nAgora vocês podem conversar por aqui para combinar os detalhes. Nos vemos em breve!`;

          await supabaseAdmin.from("messages").insert({
            sender_id: validatedMetadata.instructor_id,
            receiver_id: validatedMetadata.student_id,
            content: confirmationMessage,
            booking_id: bookingId,
          });

          logStep("Confirmation message sent");

        } else if (metadata?.booking_type === "car_rental") {
          // Validate rental metadata
          const validationResult = RentalMetadataSchema.safeParse(metadata);
          if (!validationResult.success) {
            logStep("Invalid rental metadata", { errors: validationResult.error.errors });
            throw new Error("Invalid rental metadata in webhook");
          }
          
          const validatedMetadata = validationResult.data;
          
          // Create car rental record
          const rentalData = {
            instructor_id: validatedMetadata.instructor_id,
            car_id: validatedMetadata.car_id,
            date: validatedMetadata.rental_date,
            time_slot: validatedMetadata.rental_time,
            status: "confirmed",
          };

          logStep("Creating car rental", rentalData);

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
