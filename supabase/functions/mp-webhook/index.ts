import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_FEE_PERCENTAGE = 0.15; // 15%
const CAR_RENTAL_PRICE_PER_HOUR = 50; // R$50/hour

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[MP-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.json();
    logStep("Webhook received", { type: body.type, action: body.action });

    // MP sends different notification types; we only care about payment
    if (body.type !== "payment") {
      logStep("Ignoring non-payment notification", { type: body.type });
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      logStep("No payment ID in notification");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Fetch payment details from Mercado Pago
    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");

    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: { Authorization: `Bearer ${mpAccessToken}` },
      }
    );

    const payment = await paymentResponse.json();
    logStep("Payment fetched", {
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
    });

    if (payment.status !== "approved") {
      logStep("Payment not approved, skipping", { status: payment.status });
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const externalRef = payment.external_reference;
    if (!externalRef) {
      logStep("No external_reference in payment");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Determine if this is a package or a single booking payment
    const isPackage = externalRef.startsWith("pkg_");
    const bookingId = isPackage ? null : externalRef;

    // ======== PACKAGE PAYMENT ========
    if (isPackage) {
      const metadata = payment.metadata || {};
      const packageId = metadata.package_id;
      const studentId = metadata.student_id;
      const instructorId = metadata.instructor_id;
      const subtotal = parseFloat(metadata.subtotal || payment.transaction_amount?.toString() || "0");
      const gatewayFee = parseFloat(metadata.gateway_fee || "0");
      const paymentMethodUsed = metadata.payment_method || "pix";
      const lessonCount = parseInt(metadata.lesson_count || "1");
      const includesExam = metadata.includes_exam === "true";
      const useOwnCar = metadata.use_own_car === "true";

      logStep("Processing PACKAGE payment", { packageId, studentId, instructorId, subtotal });

      // Idempotency: check if transactions already exist for this external_reference
      const { data: existingTx } = await supabaseAdmin
        .from("transactions")
        .select("id")
        .eq("reference_id", packageId)
        .eq("type", "lesson_income")
        .eq("user_id", instructorId)
        .limit(1);

      if (existingTx && existingTx.length > 0) {
        logStep("Package already processed, idempotent skip", { packageId });
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Split logic on subtotal
      const platformFee = subtotal * PLATFORM_FEE_PERCENTAGE;
      const examHours = includesExam ? 4 : 0;
      const rentalHours = lessonCount + examHours;
      const carRentalFee = useOwnCar ? 0 : rentalHours * CAR_RENTAL_PRICE_PER_HOUR;
      const instructorNetProfit = subtotal - platformFee - carRentalFee;

      logStep("Package split calculated", { subtotal, platformFee, carRentalFee, instructorNetProfit });

      // Create transaction records
      await supabaseAdmin.from("transactions").insert({
        user_id: instructorId,
        type: "lesson_income",
        amount: instructorNetProfit,
        status: "completed",
        description: `Pacote "${metadata.package_name || 'Pacote'}" - ${lessonCount} aulas - Líquido`,
        reference_id: packageId,
      });

      await supabaseAdmin.from("transactions").insert({
        user_id: instructorId,
        type: "platform_fee",
        amount: platformFee,
        status: "completed",
        description: `Taxa da plataforma (15%) - Pacote`,
        reference_id: packageId,
      });

      if (carRentalFee > 0) {
        await supabaseAdmin.from("transactions").insert({
          user_id: instructorId,
          type: "car_rental_fee",
          amount: carRentalFee,
          status: "completed",
          description: `Aluguel de veículo pacote (${rentalHours}h x R$50)`,
          reference_id: packageId,
        });
      }

      if (gatewayFee > 0) {
        await supabaseAdmin.from("transactions").insert({
          user_id: studentId,
          type: "gateway_fee",
          amount: gatewayFee,
          status: "completed",
          description: `Taxa do gateway (${paymentMethodUsed}) - Pacote`,
          reference_id: packageId,
        });
      }

      // Update instructor pending balance
      const { data: instrProfile } = await supabaseAdmin
        .from("profiles")
        .select("balance_pending")
        .eq("id", instructorId)
        .single();

      const currentPending = Number(instrProfile?.balance_pending) || 0;
      await supabaseAdmin
        .from("profiles")
        .update({ balance_pending: currentPending + instructorNetProfit })
        .eq("id", instructorId);

      logStep("Package payment processed successfully", { packageId });

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ======== SINGLE BOOKING PAYMENT ========
    // Check if booking already processed
    const { data: existingBooking } = await supabaseAdmin
      .from("bookings")
      .select("id, status")
      .eq("id", bookingId!)
      .single();

    if (!existingBooking) {
      logStep("Booking not found", { bookingId });
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (existingBooking.status === "confirmed") {
      logStep("Booking already confirmed, idempotent skip", { bookingId });
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Extract metadata from preference (stored in payment.metadata)
    const metadata = payment.metadata || {};
    const subtotal = parseFloat(metadata.subtotal || payment.transaction_amount?.toString() || "0");
    const gatewayFee = parseFloat(metadata.gateway_fee || "0");
    const studentId = metadata.student_id;
    const instructorId = metadata.instructor_id;
    const duration = parseInt(metadata.duration || "1");
    const paymentMethodUsed = metadata.payment_method || "pix";

    logStep("Processing payment", {
      bookingId,
      subtotal,
      gatewayFee,
      studentId,
      instructorId,
      paymentMethodUsed,
    });

    // ===== SPLIT LOGIC: calculated on SUBTOTAL only =====
    const platformFee = subtotal * PLATFORM_FEE_PERCENTAGE;

    // Check if booking has a car_id (rental car)
    const { data: bookingFull } = await supabaseAdmin
      .from("bookings")
      .select("car_id, date, time_slot")
      .eq("id", bookingId!)
      .single();

    const hasRentalCar = bookingFull?.car_id && bookingFull.car_id.length > 0;
    const carRentalFee = hasRentalCar ? CAR_RENTAL_PRICE_PER_HOUR * duration : 0;
    const instructorNetProfit = subtotal - platformFee - carRentalFee;

    logStep("Split calculated on subtotal", {
      subtotal,
      platformFee,
      carRentalFee,
      instructorNetProfit,
      gatewayFeePaidByStudent: gatewayFee,
    });

    // Update booking to confirmed
    await supabaseAdmin
      .from("bookings")
      .update({
        status: "confirmed",
        notes: `Pagamento confirmado via Mercado Pago (${paymentMethodUsed.toUpperCase()}). Payment ID: ${paymentId}`,
      })
      .eq("id", bookingId!);

    logStep("Booking confirmed", { bookingId });

    // Create transaction records
    await supabaseAdmin.from("transactions").insert({
      user_id: instructorId,
      type: "lesson_income",
      amount: instructorNetProfit,
      status: "completed",
      description: `Aula em ${bookingFull?.date || "N/A"} - Líquido após taxas`,
      reference_id: bookingId,
    });

    await supabaseAdmin.from("transactions").insert({
      user_id: instructorId,
      type: "platform_fee",
      amount: platformFee,
      status: "completed",
      description: `Taxa da plataforma (15%) sobre subtotal`,
      reference_id: bookingId,
    });

    if (carRentalFee > 0) {
      await supabaseAdmin.from("transactions").insert({
        user_id: instructorId,
        type: "car_rental_fee",
        amount: carRentalFee,
        status: "completed",
        description: `Aluguel de veículo (${duration}h x R$50)`,
        reference_id: bookingId,
      });
    }

    if (gatewayFee > 0) {
      await supabaseAdmin.from("transactions").insert({
        user_id: studentId,
        type: "gateway_fee",
        amount: gatewayFee,
        status: "completed",
        description: `Taxa do gateway (${paymentMethodUsed}) - paga pelo aluno`,
        reference_id: bookingId,
      });
    }

    // Update instructor pending balance
    const { data: instructorProfile } = await supabaseAdmin
      .from("profiles")
      .select("balance_pending")
      .eq("id", instructorId)
      .single();

    const currentPending = Number(instructorProfile?.balance_pending) || 0;

    await supabaseAdmin
      .from("profiles")
      .update({ balance_pending: currentPending + instructorNetProfit })
      .eq("id", instructorId);

    logStep("Instructor pending balance updated", { added: instructorNetProfit });

    // Send confirmation message
    const formattedDate = bookingFull?.date
      ? new Date(bookingFull.date + "T00:00:00").toLocaleDateString("pt-BR")
      : "N/A";

    const confirmationMessage = `✅ Aula confirmada e paga!\n\n📅 Data: ${formattedDate}\n⏰ Horário: ${bookingFull?.time_slot || "N/A"}\n💰 Valor: R$ ${subtotal.toFixed(2)}\n💳 Pagamento: ${paymentMethodUsed.toUpperCase()}${gatewayFee > 0 ? `\n📊 Taxa do gateway: R$ ${gatewayFee.toFixed(2)} (paga pelo aluno)` : ""}\n\nAgora vocês podem conversar por aqui para combinar os detalhes!`;

    await supabaseAdmin.from("messages").insert({
      sender_id: instructorId,
      receiver_id: studentId,
      content: confirmationMessage,
      booking_id: bookingId,
    });

    logStep("MP webhook flow completed successfully");

    return new Response(JSON.stringify({ received: true }), {
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
