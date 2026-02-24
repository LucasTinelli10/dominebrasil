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

const PackageCheckoutSchema = z.object({
  packageId: z.string().uuid("ID do pacote inválido"),
  paymentMethod: z.enum(["pix", "debit", "credit"]),
  cardToken: z.string().optional(),
  paymentMethodId: z.string().optional(),
  installments: z.number().optional(),
  issuerId: z.string().optional(),
});

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PACKAGE-CHECKOUT] ${step}${detailsStr}`);
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
    if (!user?.email) throw new Error("Usuário não autenticado");
    logStep("User authenticated", { email: user.email });

    const rawInput = await req.json();
    const validation = PackageCheckoutSchema.safeParse(rawInput);
    if (!validation.success) {
      throw new Error(`Dados inválidos: ${validation.error.errors.map(e => e.message).join(", ")}`);
    }

    const { packageId, paymentMethod, cardToken, paymentMethodId, installments, issuerId } = validation.data;

    if ((paymentMethod === "credit" || paymentMethod === "debit") && !cardToken) {
      throw new Error("Token do cartão é obrigatório para pagamentos com cartão");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from("instructor_packages")
      .select("*")
      .eq("id", packageId)
      .eq("active", true)
      .single();

    if (pkgError || !pkg) throw new Error("Pacote não encontrado ou inativo");

    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", pkg.instructor_id)
      .single();

    const { data: studentProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, cpf")
      .eq("id", user.id)
      .single();

    const instructorName = profileData?.full_name || "Instrutor";
    const subtotal = Number(pkg.price);
    const feePercentage = GATEWAY_FEES[paymentMethod] || 0;
    const gatewayFee = Math.round((subtotal * feePercentage / 100) * 100) / 100;
    const totalAmount = subtotal + gatewayFee;
    const cpfClean = studentProfile?.cpf?.replace(/\D/g, "") || "";

    logStep("Calculated amounts", { subtotal, gatewayFee, totalAmount, paymentMethod });

    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");

    const examLabel = pkg.includes_exam ? " + Exame" : "";
    const description = `${pkg.name} — ${pkg.lesson_count} aula(s)${examLabel} com ${instructorName}`;

    const paymentBody: any = {
      transaction_amount: totalAmount,
      description,
      payer: {
        email: user.email,
        first_name: studentProfile?.full_name?.split(" ")[0] || "",
        last_name: studentProfile?.full_name?.split(" ").slice(1).join(" ") || "",
        identification: cpfClean ? { type: "CPF", number: cpfClean } : undefined,
      },
      external_reference: `pkg_${packageId}_${user.id}`,
      metadata: {
        booking_type: "package",
        student_id: user.id,
        instructor_id: pkg.instructor_id,
        package_id: packageId,
        package_name: pkg.name,
        subtotal: subtotal.toString(),
        gateway_fee: gatewayFee.toString(),
        total_amount: totalAmount.toString(),
        payment_method: paymentMethod,
        lesson_count: pkg.lesson_count.toString(),
        includes_exam: pkg.includes_exam.toString(),
        use_own_car: pkg.use_own_car.toString(),
      },
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
    };

    if (paymentMethod === "pix") {
      paymentBody.payment_method_id = "pix";
    } else {
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
        "X-Idempotency-Key": `pkg_${packageId}_${user.id}_${Date.now()}`,
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
