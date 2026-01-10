import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MIN_LESSON_PRICE = 90;
const MAX_LESSON_PRICE = 10000;

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-PAYMENT-LINK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const resend = new Resend(resendApiKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { bookingId } = await req.json();
    logStep("Request data", { bookingId });

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select(`
        id, date, time_slot, total_price, notes,
        student:profiles!bookings_student_id_fkey(id, full_name),
        instructor:profiles!bookings_instructor_id_fkey(id, full_name)
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      logStep("Booking not found", { error: bookingError?.message });
      throw new Error("Agendamento não encontrado");
    }

    const studentId = (booking.student as any).id;
    const studentName = (booking.student as any).full_name || "Aluno";
    const instructorId = (booking.instructor as any).id;
    const instructorName = (booking.instructor as any).full_name || "Instrutor";

    logStep("Booking data", { studentId, studentName, instructorId, instructorName });

    // Get student email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(studentId);
    
    if (authError || !authData?.user?.email) {
      logStep("Error fetching student email", { error: authError?.message });
      throw new Error("Email do aluno não encontrado");
    }

    const studentEmail = authData.user.email;
    logStep("Student email", { studentEmail });

    // Get instructor price
    const { data: instructorDetails, error: instructorError } = await supabaseAdmin
      .from("instructors_details")
      .select("price_per_hour")
      .eq("profile_id", instructorId)
      .single();

    if (instructorError || !instructorDetails) {
      logStep("Error fetching instructor details", { error: instructorError?.message });
      throw new Error("Detalhes do instrutor não encontrados");
    }

    const lessonPrice = Number(instructorDetails.price_per_hour);
    if (lessonPrice < MIN_LESSON_PRICE || lessonPrice > MAX_LESSON_PRICE) {
      throw new Error(`Preço fora do limite permitido`);
    }

    // Parse lesson type from notes if available
    const lessonType = booking.notes?.includes("perder_medo") ? "perder_medo" : "primeira_cnh";
    const lessonTypeLabel = lessonType === "primeira_cnh" ? "1ª CNH" : "Perder o Medo";

    // Create Stripe checkout session
    const customers = await stripe.customers.list({ email: studentEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = "https://dominebrasil.com.br";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : studentEmail,
      payment_method_types: ["card", "boleto", "pix"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Aula Prática com ${instructorName} (${lessonTypeLabel})`,
              description: `1h de aula em ${booking.date} às ${booking.time_slot}`,
            },
            unit_amount: Math.round(lessonPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/app/student/lessons?payment=success`,
      cancel_url: `${origin}/app/student/lessons?payment=canceled`,
      metadata: {
        booking_type: "lesson",
        booking_id: bookingId,
        student_id: studentId,
        instructor_id: instructorId,
        lesson_date: booking.date,
        lesson_time: booking.time_slot,
        duration: "1",
        total_price: lessonPrice.toString(),
        lesson_type: lessonType,
      },
    });

    logStep("Stripe session created", { sessionId: session.id, url: session.url });

    // Format date
    const formattedDate = new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Send email to student
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "DomineBrasil <noreply@dominebrasil.com.br>",
      to: [studentEmail],
      subject: `✅ ${instructorName} aceitou sua solicitação! Pague agora para confirmar`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .info-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e; }
            .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
            .label { color: #666; }
            .value { font-weight: 600; color: #22c55e; }
            .price { font-size: 28px; color: #22c55e; font-weight: 700; text-align: center; margin: 20px 0; }
            .cta-button { display: inline-block; background: #22c55e; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; margin-top: 20px; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🎉 Solicitação Aceita!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">O instrutor confirmou sua aula</p>
          </div>
          <div class="content">
            <p>Olá, <strong>${studentName}</strong>!</p>
            <p>Ótima notícia! O instrutor <strong>${instructorName}</strong> aceitou sua solicitação de aula.</p>
            
            <div class="info-card">
              <h3 style="margin-top: 0; color: #22c55e;">📋 Detalhes da Aula</h3>
              <div class="info-row">
                <span class="label">👨‍🏫 Instrutor</span>
                <span class="value">${instructorName}</span>
              </div>
              <div class="info-row">
                <span class="label">🎯 Objetivo</span>
                <span class="value">${lessonTypeLabel}</span>
              </div>
              <div class="info-row">
                <span class="label">📅 Data</span>
                <span class="value">${formattedDate}</span>
              </div>
              <div class="info-row">
                <span class="label">⏰ Horário</span>
                <span class="value">${booking.time_slot}</span>
              </div>
            </div>
            
            <div class="price">
              R$ ${lessonPrice.toFixed(2)}
            </div>
            
            <div style="text-align: center;">
              <a href="${session.url}" class="cta-button">
                💳 Pagar Agora
              </a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Atenção:</strong> Efetue o pagamento para garantir sua vaga. Após o pagamento, você terá acesso ao chat para conversar diretamente com o instrutor.
            </div>
            
            <div class="footer">
              <p>© 2025 DomineBrasil - Sua habilitação sem estresse</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      logStep("Error sending email", { error: emailError });
      throw new Error("Erro ao enviar email");
    }

    logStep("Email sent successfully", { emailId: emailData?.id });

    // Update booking notes with payment link info
    await supabaseAdmin
      .from("bookings")
      .update({ 
        notes: `Aguardando pagamento. Tipo: ${lessonType}. Session: ${session.id}`,
        status: "pending"
      })
      .eq("id", bookingId);

    return new Response(JSON.stringify({ success: true, checkoutUrl: session.url }), {
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
