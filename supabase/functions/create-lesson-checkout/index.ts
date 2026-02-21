import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Business rules
const MIN_LESSON_PRICE = 90; // R$90 minimum (valor mínimo conforme regras de negócio)
const MAX_LESSON_PRICE = 10000; // R$10.000 maximum (até infinito)
const MAX_DURATION = 5; // 5 hours max

// Input validation schema - price is now fetched from DB, not from frontend
const LessonCheckoutSchema = z.object({
  instructorId: z.string().uuid("ID do instrutor inválido"),
  lessonDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  lessonTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:MM"),
  duration: z.number().int().min(1, "Duração mínima é 1 hora").max(MAX_DURATION, `Duração máxima é ${MAX_DURATION} horas`).default(1),
  carId: z.string().uuid("ID do carro inválido").optional().nullable(),
  lessonType: z.enum(["primeira_cnh", "perder_medo"]).default("primeira_cnh"),
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
      lessonDate,
      lessonTime,
      duration,
      carId,
      lessonType,
    } = validationResult.data;

    // Fetch instructor details from database (price and name)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get instructor name from profiles
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", instructorId)
      .single();

    if (profileError || !profileData) {
      logStep("Failed to fetch instructor profile", { error: profileError?.message });
      throw new Error("Instrutor não encontrado");
    }

    // Get instructor price from instructors_details
    const { data: instructorData, error: instructorError } = await supabaseAdmin
      .from("instructors_details")
      .select("price_per_hour")
      .eq("profile_id", instructorId)
      .single();

    if (instructorError || !instructorData) {
      logStep("Failed to fetch instructor details", { error: instructorError?.message });
      throw new Error("Detalhes do instrutor não encontrados");
    }

    const instructorName = profileData.full_name || "Instrutor";
    const lessonPrice = Number(instructorData.price_per_hour);

    // Validate price from database
    if (lessonPrice < MIN_LESSON_PRICE || lessonPrice > MAX_LESSON_PRICE) {
      logStep("Invalid price from database", { lessonPrice });
      throw new Error(`Preço do instrutor fora do limite permitido (R$${MIN_LESSON_PRICE} - R$${MAX_LESSON_PRICE})`);
    }

    const totalAmount = lessonPrice * duration;
    const lessonTypeLabel = lessonType === "primeira_cnh" ? "1ª CNH" : "Perder o Medo";
    logStep("Lesson details fetched from DB", { instructorId, instructorName, lessonPrice, totalAmount, duration, lessonType });

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

    // Create checkout session with dynamic pricing from database
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Aula Prática com ${instructorName} (${lessonTypeLabel})`,
              description: `${duration}h de aula em ${lessonDate} às ${lessonTime}`,
            },
            unit_amount: Math.round(totalAmount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/app/student/lessons?payment=success`,
      cancel_url: `${origin}/app/student/search?payment=canceled`,
      metadata: {
        booking_type: "lesson",
        student_id: user.id,
        instructor_id: instructorId,
        lesson_date: lessonDate,
        lesson_time: lessonTime,
        duration: duration.toString(),
        total_price: totalAmount.toString(),
        car_id: carId || "",
        lesson_type: lessonType,
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
