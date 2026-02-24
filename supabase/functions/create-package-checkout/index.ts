import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_FEES: Record<string, number> = {
  pix: 0,
  debit: 1.99,
  credit: 4.98,
};

const PackageCheckoutSchema = z.object({
  packageId: z.string().uuid("ID do pacote inválido"),
  paymentMethod: z.enum(["pix", "debit", "credit"]),
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

    // Auth
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

    // Validate input
    const rawInput = await req.json();
    const validation = PackageCheckoutSchema.safeParse(rawInput);
    if (!validation.success) {
      throw new Error(`Dados inválidos: ${validation.error.errors.map(e => e.message).join(", ")}`);
    }

    const { packageId, paymentMethod } = validation.data;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch package details
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from("instructor_packages")
      .select("*")
      .eq("id", packageId)
      .eq("active", true)
      .single();

    if (pkgError || !pkg) {
      logStep("Package not found", { error: pkgError?.message });
      throw new Error("Pacote não encontrado ou inativo");
    }

    // Fetch instructor name
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", pkg.instructor_id)
      .single();

    // Fetch student profile for payer info
    const { data: studentProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, cpf")
      .eq("id", user.id)
      .single();

    const instructorName = profileData?.full_name || "Instrutor";
    logStep("Package found", { name: pkg.name, price: pkg.price, instructorName });

    const subtotal = Number(pkg.price);
    const feePercentage = GATEWAY_FEES[paymentMethod] || 0;
    const gatewayFee = Math.round((subtotal * feePercentage / 100) * 100) / 100;
    const totalAmount = subtotal + gatewayFee;

    logStep("Calculated amounts", { subtotal, gatewayFee, totalAmount, paymentMethod });

    // Map payment method to MP excluded types
    const excludedPaymentMethods: { id: string }[] = [];
    if (paymentMethod === "pix") {
      excludedPaymentMethods.push({ id: "credit_card" }, { id: "debit_card" }, { id: "ticket" });
    } else if (paymentMethod === "debit") {
      excludedPaymentMethods.push({ id: "credit_card" }, { id: "ticket" });
    } else if (paymentMethod === "credit") {
      excludedPaymentMethods.push({ id: "debit_card" }, { id: "ticket" });
    }

    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");

    const origin = "https://dominebrasil.lovable.app";
    const examLabel = pkg.includes_exam ? " + Exame" : "";
    const description = `${pkg.lesson_count} aula(s) de 50min${examLabel} com ${instructorName}`;

    const preferenceBody = {
      items: [
        {
          title: `${pkg.name} — ${instructorName}`,
          description,
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
        failure: `${origin}/app/student/checkout/package/${packageId}?payment=failed`,
        pending: `${origin}/app/student/checkout/package/${packageId}?payment=pending`,
      },
      auto_return: "approved",
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
