import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

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

    // For now, we'll process without signature verification
    // In production, you should set up STRIPE_WEBHOOK_SECRET and verify
    const event = JSON.parse(body);
    
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
          // Create or update booking
          const bookingData = {
            student_id: metadata.student_id,
            instructor_id: metadata.instructor_id,
            date: metadata.lesson_date,
            time_slot: metadata.lesson_time,
            total_price: parseFloat(metadata.total_price || "0"),
            status: "confirmed",
            notes: `Pagamento confirmado via Stripe. Session ID: ${session.id}`,
          };

          if (metadata.car_id) {
            (bookingData as any).car_id = metadata.car_id;
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

          logStep("Booking created successfully", { bookingId: booking.id });

          // Get instructor info for the message
          const { data: instructorProfile } = await supabaseAdmin
            .from("profiles")
            .select("full_name")
            .eq("id", metadata.instructor_id)
            .single();

          // Create automatic confirmation message
          const confirmationMessage = `✅ Aula confirmada!\n\n📅 Data: ${new Date(metadata.lesson_date + 'T00:00:00').toLocaleDateString('pt-BR')}\n⏰ Horário: ${metadata.lesson_time}\n💰 Valor: R$ ${parseFloat(metadata.total_price).toFixed(2)}\n\nNos vemos em breve!`;

          await supabaseAdmin.from("messages").insert({
            sender_id: metadata.instructor_id,
            receiver_id: metadata.student_id,
            content: confirmationMessage,
            booking_id: booking.id,
          });

          logStep("Confirmation message sent");

        } else if (metadata?.booking_type === "car_rental") {
          // Create car rental record
          const rentalData = {
            instructor_id: metadata.instructor_id,
            car_id: metadata.car_id,
            date: metadata.rental_date,
            time_slot: metadata.rental_time,
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
