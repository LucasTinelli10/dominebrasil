import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Gateway fee percentages (must match frontend)
const GATEWAY_FEES: Record<string, number> = {
  pix: 0,
  debit: 1.99,
  credit: 4.98,
};

const CheckoutSchema = z.object({
  bookingId: z.string().uuid("ID do agendamento inválido"),
  paymentMethod: z.enum(["pix", "debit", "credit"]),
});

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-MP-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: authData } = await supabaseClient.auth.getUser(token);
    const user = authData.user;
    if (!user) throw new Error("Usuário não autenticado");
    logStep("User authenticated", { userId: user.id });

    // Validate input
    const rawInput = await req.json();
    const validation = CheckoutSchema.safeParse(rawInput);
    if (!validation.success) {
      throw new Error(`Dados inválidos: ${validation.error.errors.map(e => e.message).join(", ")}`);
    }

    const { bookingId, paymentMethod } = validation.data;

    // Fetch booking with admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select(`
        id, date, time_slot, total_price, student_id, instructor_id, notes,
        instructor:profiles!bookings_instructor_id_fkey(full_name)
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Agendamento não encontrado");
    }

    // Verify student owns this booking
    if (booking.student_id !== user.id) {
      throw new Error("Você não tem permissão para pagar este agendamento");
    }

    const subtotal = Number(booking.total_price);
    const feePercentage = GATEWAY_FEES[paymentMethod] || 0;
    const gatewayFee = Math.round((subtotal * feePercentage / 100) * 100) / 100;
    const totalAmount = subtotal + gatewayFee;
    const instructorName = (booking.instructor as any)?.full_name || "Instrutor";

    // Parse lesson type from notes
    const lessonType = booking.notes?.includes("perder_medo") ? "Perder o Medo" : "1ª CNH";

    // Get instructor price_per_hour to calculate duration
    const { data: instrDetails } = await supabaseAdmin
      .from("instructors_details")
      .select("price_per_hour")
      .eq("profile_id", booking.instructor_id)
      .single();

    const pricePerHour = Number(instrDetails?.price_per_hour) || subtotal;
    const duration = pricePerHour > 0 ? Math.round(subtotal / pricePerHour) : 1;

    // Fetch student profile for payer info
    const { data: studentProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, cpf")
      .eq("id", user.id)
      .single();

    logStep("Calculated amounts", { subtotal, gatewayFee, totalAmount, paymentMethod, duration });

    // Map payment method to MP excluded types
    const excludedPaymentMethods: { id: string }[] = [];
    if (paymentMethod === "pix") {
      excludedPaymentMethods.push(
        { id: "credit_card" },
        { id: "debit_card" },
        { id: "ticket" }
      );
    } else if (paymentMethod === "debit") {
      excludedPaymentMethods.push(
        { id: "credit_card" },
        { id: "ticket" }
      );
    } else if (paymentMethod === "credit") {
      excludedPaymentMethods.push(
        { id: "debit_card" },
        { id: "ticket" }
      );
    }

    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");

    const origin = "https://dominebrasil.lovable.app";

    // Create Mercado Pago preference
    const preferenceBody = {
      items: [
        {
          title: `Aula Prática com ${instructorName} (${lessonType})`,
          description: `${duration}h de aula em ${booking.date} às ${booking.time_slot}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: totalAmount,
        },
      ],
      payer: {
        email: user.email,
        first_name: studentProfile?.full_name?.split(" ")[0] || "",
        last_name: studentProfile?.full_name?.split(" ").slice(1).join(" ") || "",
        identification: studentProfile?.cpf ? {
          type: "CPF",
          number: studentProfile.cpf.replace(/\D/g, ""),
        } : undefined,
      },
      payment_methods: {
        excluded_payment_types: excludedPaymentMethods,
      },
      back_urls: {
        success: `${origin}/app/student/payment-success`,
        failure: `${origin}/app/student/checkout/${bookingId}?payment=failed`,
        pending: `${origin}/app/student/checkout/${bookingId}?payment=pending`,
      },
      auto_return: "approved",
      external_reference: bookingId,
      metadata: {
        booking_id: bookingId,
        student_id: user.id,
        instructor_id: booking.instructor_id,
        subtotal: subtotal.toString(),
        gateway_fee: gatewayFee.toString(),
        total_amount: totalAmount.toString(),
        payment_method: paymentMethod,
        lesson_date: booking.date,
        lesson_time: booking.time_slot,
        duration: duration.toString(),
      },
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
    };

    logStep("Creating MP preference", { items: preferenceBody.items });

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify(preferenceBody),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      logStep("MP error response", mpData);
      throw new Error(`Erro do Mercado Pago: ${mpData.message || JSON.stringify(mpData)}`);
    }

    logStep("MP preference created", { id: mpData.id, init_point: mpData.init_point });

    return new Response(
      JSON.stringify({ init_point: mpData.init_point, preference_id: mpData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
