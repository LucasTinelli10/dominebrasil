import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Business rules
const INSTANT_WITHDRAWAL_FEE = 3; // R$ 3,00

// Input validation schema
const WithdrawalSchema = z.object({
  amount: z.number().positive("Valor deve ser positivo"),
  pixKey: z.string().min(1, "Chave PIX é obrigatória"),
  type: z.enum(["standard", "instant"]).default("standard"),
});

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REQUEST-WITHDRAWAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("Usuário não autenticado");
    logStep("User authenticated", { userId: user.id });

    // Parse and validate input
    const rawInput = await req.json();
    const validationResult = WithdrawalSchema.safeParse(rawInput);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => e.message).join(", ");
      logStep("Validation failed", { errors: errorMessages });
      throw new Error(`Dados inválidos: ${errorMessages}`);
    }

    const { amount, pixKey, type } = validationResult.data;

    // Get user's current balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("balance, pix_key")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      logStep("Failed to fetch profile", { error: profileError?.message });
      throw new Error("Perfil não encontrado");
    }

    const currentBalance = Number(profile.balance) || 0;
    logStep("Current balance", { currentBalance, requestedAmount: amount });

    // Calculate fee and net amount
    const fee = type === "instant" ? INSTANT_WITHDRAWAL_FEE : 0;
    const netAmount = amount - fee;

    // Validate balance
    if (amount > currentBalance) {
      throw new Error("Saldo insuficiente para este saque");
    }

    if (netAmount <= 0) {
      throw new Error("O valor líquido deve ser maior que zero");
    }

    logStep("Withdrawal details", { amount, fee, netAmount, type });

    // Create withdrawal record
    const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
      .from("withdrawals")
      .insert({
        instructor_id: user.id,
        amount,
        fee,
        net_amount: netAmount,
        pix_key: pixKey,
        type,
        status: type === "instant" ? "processing" : "pending",
      })
      .select()
      .single();

    if (withdrawalError) {
      logStep("Failed to create withdrawal", { error: withdrawalError.message });
      throw new Error("Erro ao criar solicitação de saque");
    }

    logStep("Withdrawal created", { withdrawalId: withdrawal.id });

    // Update user's balance
    const newBalance = currentBalance - amount;
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        balance: newBalance,
        total_withdrawn: (profile as any).total_withdrawn ? Number((profile as any).total_withdrawn) + netAmount : netAmount,
        pix_key: pixKey, // Save PIX key for future withdrawals
      })
      .eq("id", user.id);

    if (updateError) {
      logStep("Failed to update balance", { error: updateError.message });
      // Rollback withdrawal
      await supabaseAdmin.from("withdrawals").delete().eq("id", withdrawal.id);
      throw new Error("Erro ao atualizar saldo");
    }

    logStep("Balance updated", { newBalance });

    // Create transaction records
    const transactions = [
      {
        user_id: user.id,
        type: "withdrawal",
        amount: netAmount,
        status: "completed",
        description: `Saque ${type === "instant" ? "instantâneo" : "padrão"} via PIX`,
        reference_id: withdrawal.id,
      },
    ];

    // Add fee transaction if instant
    if (fee > 0) {
      transactions.push({
        user_id: user.id,
        type: "withdrawal_fee",
        amount: fee,
        status: "completed",
        description: "Taxa de saque instantâneo",
        reference_id: withdrawal.id,
      });
    }

    const { error: transactionError } = await supabaseAdmin
      .from("transactions")
      .insert(transactions);

    if (transactionError) {
      logStep("Failed to create transactions", { error: transactionError.message });
      // Non-critical, don't rollback
    }

    logStep("Withdrawal completed successfully", { withdrawalId: withdrawal.id, netAmount });

    return new Response(
      JSON.stringify({
        success: true,
        message: type === "instant" 
          ? "Saque instantâneo processado! O valor será enviado em instantes."
          : "Saque solicitado! O valor será enviado na próxima quarta-feira.",
        withdrawal: {
          id: withdrawal.id,
          amount,
          fee,
          netAmount,
          type,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
