import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Business rules
const MIN_LESSON_PRICE = 90; // R$90 minimum
const MAX_LESSON_PRICE = 500; // R$500 maximum
const MAX_DURATION = 5; // 5 hours max

// Input validation schema
const LessonCheckoutSchema = z.object({
  instructorId: z.string().uuid("ID do instrutor inválido"),
  instructorName: z.string().min(1, "Nome do instrutor é obrigatório").max(100, "Nome muito longo"),
  lessonPrice: z.number().min(MIN_LESSON_PRICE, `Preço mínimo é R$${MIN_LESSON_PRICE}`).max(MAX_LESSON_PRICE, `Preço máximo é R$${MAX_LESSON_PRICE}`),
  lessonDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  lessonTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:MM"),
  duration: z.number().int().min(1, "Duração mínima é 1 hora").max(MAX_DURATION, `Duração máxima é ${MAX_DURATION} horas`).default(1),
  carId: z.string().uuid("ID do carro inválido").optional().nullable(),
});

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-LESSON-CHECKOUT] ${step}${detailsStr}`);
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
    const validationResult = LessonCheckoutSchema.safeParse(rawInput);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => e.message).join(", ");
      logStep("Validation failed", { errors: errorMessages });
      throw new Error(`Dados inválidos: ${errorMessages}`);
    }

    const { 
      instructorId,
      instructorName, 
      lessonPrice, 
      lessonDate,
      lessonTime,
      duration,
      carId,
    } = validationResult.data;

    const totalAmount = lessonPrice * duration;
    logStep("Lesson details", { instructorId, instructorName, totalAmount, duration });

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

    // Create checkout session with dynamic pricing
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Aula de Direção - ${instructorName}`,
              description: `${duration}h de aula em ${lessonDate} às ${lessonTime}`,
            },
            unit_amount: Math.round(totalAmount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/app/student?payment=success`,
      cancel_url: `${origin}/app/student?payment=canceled`,
      metadata: {
        booking_type: "lesson",
        student_id: user.id,
        instructor_id: instructorId,
        lesson_date: lessonDate,
        lesson_time: lessonTime,
        duration: duration.toString(),
        total_price: totalAmount.toString(),
        car_id: carId || "",
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
