import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    if (!mpAccessToken) {
      return new Response(
        JSON.stringify({ error: "Mercado Pago access token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: isAdmin } = await supabaseAdmin.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { withdrawal_id } = await req.json();
    if (!withdrawal_id) {
      return new Response(JSON.stringify({ error: "withdrawal_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch withdrawal
    const { data: withdrawal, error: wErr } = await supabaseAdmin
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawal_id)
      .in("status", ["pending", "processing"])
      .single();

    if (wErr || !withdrawal) {
      return new Response(
        JSON.stringify({ error: "Withdrawal not found or already processed" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get instructor PIX key from withdrawal record
    const pixKey = withdrawal.pix_key;
    if (!pixKey) {
      return new Response(JSON.stringify({ error: "PIX key not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Mercado Pago PIX Transfer API
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": withdrawal_id,
      },
      body: JSON.stringify({
        transaction_amount: Number(withdrawal.net_amount),
        description: `Saque Domine - ${withdrawal_id.substring(0, 8)}`,
        payment_method_id: "pix",
        payer: {
          email: "pagamentos@domine.com.br",
        },
        point_of_interaction: {
          type: "PIX_TRANSFER",
          transaction_data: {
            pix_key: pixKey,
          },
        },
      }),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok || mpData.status === "rejected") {
      console.error("Mercado Pago error:", JSON.stringify(mpData));

      // Mark as failed and refund balance
      await supabaseAdmin
        .from("withdrawals")
        .update({ status: "failed", processed_at: new Date().toISOString() })
        .eq("id", withdrawal_id);

      // Refund balance
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("balance")
        .eq("id", withdrawal.instructor_id)
        .single();

      await supabaseAdmin
        .from("profiles")
        .update({ balance: Number(profile?.balance || 0) + Number(withdrawal.amount) })
        .eq("id", withdrawal.instructor_id);

      return new Response(
        JSON.stringify({
          error: "Payment failed",
          details: mpData.message || mpData.cause?.[0]?.description || "Unknown error",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Success - update withdrawal status
    await supabaseAdmin
      .from("withdrawals")
      .update({
        status: "paid",
        processed_at: new Date().toISOString(),
      })
      .eq("id", withdrawal_id);

    // Update total_withdrawn on profile
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("total_withdrawn")
      .eq("id", withdrawal.instructor_id)
      .single();

    await supabaseAdmin
      .from("profiles")
      .update({
        total_withdrawn: Number(profileData?.total_withdrawn || 0) + Number(withdrawal.net_amount),
      })
      .eq("id", withdrawal.instructor_id);

    return new Response(
      JSON.stringify({
        success: true,
        mp_payment_id: mpData.id,
        status: mpData.status,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
