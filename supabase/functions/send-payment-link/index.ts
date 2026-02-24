import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

    const resend = new Resend(resendApiKey);

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
    const instructorName = (booking.instructor as any).full_name || "Instrutor";

    logStep("Booking data", { studentId, studentName, instructorName });

    // Get student email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(studentId);
    
    if (authError || !authData?.user?.email) {
      logStep("Error fetching student email", { error: authError?.message });
      throw new Error("Email do aluno não encontrado");
    }

    const studentEmail = authData.user.email;
    const totalPrice = Number(booking.total_price);

    // Parse lesson type from notes
    const lessonType = booking.notes?.includes("perder_medo") ? "perder_medo" : "primeira_cnh";
    const lessonTypeLabel = lessonType === "primeira_cnh" ? "1ª CNH" : "Perder o Medo";

    logStep("Preparing checkout link", { totalPrice, lessonType });

    // Build checkout URL that redirects to the in-app checkout page
    const origin = "https://dominebrasil.lovable.app";
    const checkoutUrl = `${origin}/app/student/checkout/${bookingId}`;

    // Format date
    const formattedDate = new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Send email to student with link to checkout page
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "DomineBrasil <onboarding@resend.dev>",
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
            .methods { background: white; padding: 15px; border-radius: 8px; margin-top: 15px; text-align: center; }
            .methods-title { font-weight: 600; margin-bottom: 8px; }
            .methods-list { display: flex; justify-content: center; gap: 20px; }
            .method-item { text-align: center; font-size: 13px; color: #666; }
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
              A partir de R$ ${totalPrice.toFixed(2)}
            </div>

            <div class="methods">
              <div class="methods-title">💳 Formas de pagamento disponíveis</div>
              <p style="font-size: 13px; color: #666; margin: 5px 0;">
                <strong>PIX:</strong> sem taxa adicional &nbsp;|&nbsp; 
                <strong>Débito:</strong> +1.99% &nbsp;|&nbsp; 
                <strong>Crédito:</strong> +4.98%
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="${checkoutUrl}" class="cta-button">
                💳 Escolher Pagamento
              </a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Atenção:</strong> Efetue o pagamento para garantir sua vaga. Você poderá escolher entre PIX, Débito ou Crédito na próxima tela.
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

    // Update booking notes
    await supabaseAdmin
      .from("bookings")
      .update({ 
        notes: `Aguardando pagamento via Mercado Pago. Tipo: ${lessonType}.`,
        status: "pending"
      })
      .eq("id", bookingId);

    return new Response(JSON.stringify({ success: true, checkoutUrl }), {
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
