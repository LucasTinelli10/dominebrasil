import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fixed rental price - Business rule
const CAR_RENTAL_PRICE_PER_HOUR = 50; // R$50/hour fixed
const MAX_RENTAL_DURATION = 8; // 8 hours max

// Input validation schema
const RentalCheckoutSchema = z.object({
  carId: z.string().uuid("ID do carro inválido"),
  carModel: z.string().min(1, "Modelo do carro é obrigatório").max(100, "Modelo muito longo"),
  rentalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  rentalTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:MM"),
  duration: z.number().int().min(1, "Duração mínima é 1 hora").max(MAX_RENTAL_DURATION, `Duração máxima é ${MAX_RENTAL_DURATION} horas`).default(1),
});

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-RENTAL-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { email: user.email });

    // Parse and validate input
    const rawInput = await req.json();
    const validationResult = RentalCheckoutSchema.safeParse(rawInput);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => e.message).join(", ");
      logStep("Validation failed", { errors: errorMessages });
      throw new Error(`Dados inválidos: ${errorMessages}`);
    }

    const { 
      carId,
      carModel, 
      rentalDate,
      rentalTime,
      duration,
    } = validationResult.data;

    const totalAmount = CAR_RENTAL_PRICE_PER_HOUR * duration;
    logStep("Rental details", { carModel, totalAmount, duration });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Create checkout session with fixed rental price
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Aluguel de Carro - ${carModel}`,
              description: `${duration}h de aluguel em ${rentalDate} às ${rentalTime}`,
            },
            unit_amount: Math.round(totalAmount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/app/instructor/cars?payment=success&car=${carId}`,
      cancel_url: `${origin}/app/instructor/cars?payment=canceled`,
      metadata: {
        booking_type: "car_rental",
        car_id: carId,
        instructor_id: user.id,
        rental_date: rentalDate,
        rental_time: rentalTime,
        duration: duration.toString(),
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
