import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_FEES: Record<string, number> = {
  pix: 0,
  debit: 1.99,
  credit: 4.98,
};

const CheckoutSchema = z.object({
  bookingId: z.string().uuid("ID do agendamento inválido"),
  paymentMethod: z.enum(["pix", "debit", "credit"]),
  // Card-specific fields (required for debit/credit)
  cardToken: z.string().optional(),
  paymentMethodId: z.string().optional(), // visa, master, etc.
  installments: z.number().optional(),
  issuerId: z.string().optional(),
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

    const rawInput = await req.json();
    const validation = CheckoutSchema.safeParse(rawInput);
    if (!validation.success) {
      throw new Error(`Dados inválidos: ${validation.error.errors.map(e => e.message).join(", ")}`);
    }

    const { bookingId, paymentMethod, cardToken, paymentMethodId, installments, issuerId } = validation.data;

    // Validate card fields for card payments
    if ((paymentMethod === "credit" || paymentMethod === "debit") && !cardToken) {
      throw new Error("Token do cartão é obrigatório para pagamentos com cartão");
    }

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

    if (bookingError || !booking) throw new Error("Agendamento não encontrado");
    if (booking.student_id !== user.id) throw new Error("Você não tem permissão para pagar este agendamento");

    const subtotal = Number(booking.total_price);
    const feePercentage = GATEWAY_FEES[paymentMethod] || 0;
    const gatewayFee = Math.round((subtotal * feePercentage / 100) * 100) / 100;
    const totalAmount = subtotal + gatewayFee;
    const instructorName = (booking.instructor as any)?.full_name || "Instrutor";

    // Fetch student profile
    const { data: studentProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, cpf")
      .eq("id", user.id)
      .single();

    // Get duration
    const { data: instrDetails } = await supabaseAdmin
      .from("instructors_details")
      .select("price_per_hour")
      .eq("profile_id", booking.instructor_id)
      .single();

    const pricePerHour = Number(instrDetails?.price_per_hour) || subtotal;
    const duration = pricePerHour > 0 ? Math.round(subtotal / pricePerHour) : 1;
    const lessonType = booking.notes?.includes("perder_medo") ? "Perder o Medo" : "1ª CNH";

    logStep("Calculated amounts", { subtotal, gatewayFee, totalAmount, paymentMethod, duration });

    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");

    const cpfClean = studentProfile?.cpf?.replace(/\D/g, "") || "";

    // Build payment body for Payments API (transparent checkout)
    const paymentBody: any = {
      transaction_amount: totalAmount,
      description: `Aula Prática com ${instructorName} (${lessonType}) - ${duration}h em ${booking.date} às ${booking.time_slot}`,
      payer: {
        email: user.email,
        first_name: studentProfile?.full_name?.split(" ")[0] || "",
        last_name: studentProfile?.full_name?.split(" ").slice(1).join(" ") || "",
        identification: cpfClean ? { type: "CPF", number: cpfClean } : undefined,
      },
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

    if (paymentMethod === "pix") {
      paymentBody.payment_method_id = "pix";
    } else {
      // Card payment (credit or debit)
      paymentBody.token = cardToken;
      paymentBody.installments = installments || 1;
      if (paymentMethodId) paymentBody.payment_method_id = paymentMethodId;
      if (issuerId) paymentBody.issuer_id = issuerId;
    }

    logStep("Creating MP payment", { payment_method: paymentMethod });

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpAccessToken}`,
        "X-Idempotency-Key": `booking_${bookingId}_${Date.now()}`,
      },
      body: JSON.stringify(paymentBody),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      logStep("MP error response", mpData);
      const errorMsg = mpData.message || mpData.cause?.[0]?.description || JSON.stringify(mpData);
      throw new Error(`Erro do Mercado Pago: ${errorMsg}`);
    }

    logStep("MP payment created", { id: mpData.id, status: mpData.status });

    // Build response based on payment method
    const response: any = {
      payment_id: mpData.id,
      status: mpData.status,
      status_detail: mpData.status_detail,
    };

    if (paymentMethod === "pix" && mpData.point_of_interaction?.transaction_data) {
      response.pix = {
        qr_code: mpData.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: mpData.point_of_interaction.transaction_data.qr_code_base64,
        ticket_url: mpData.point_of_interaction.transaction_data.ticket_url,
      };
    }

    return new Response(
      JSON.stringify(response),
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
