import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[NOTIFY-LESSON-REQUEST] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { bookingId, studentName, instructorId, lessonDate, lessonTime, lessonType } = await req.json();
    logStep("Request data", { bookingId, studentName, instructorId, lessonDate, lessonTime, lessonType });

    // Get instructor profile and email
    const { data: instructorProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", instructorId)
      .single();

    if (profileError) {
      logStep("Error fetching instructor profile", { error: profileError.message });
      throw new Error("Instrutor não encontrado");
    }

    // Get instructor email from auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(instructorId);
    
    if (authError || !authData?.user?.email) {
      logStep("Error fetching instructor email", { error: authError?.message });
      throw new Error("Email do instrutor não encontrado");
    }

    const instructorEmail = authData.user.email;
    const instructorName = instructorProfile.full_name || "Instrutor";

    logStep("Instructor data", { instructorEmail, instructorName });

    const lessonTypeLabel = lessonType === "primeira_cnh" ? "1ª CNH" : "Perder o Medo";
    const formattedDate = new Date(lessonDate + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Send email to instructor - use onboarding domain as fallback if custom domain not verified
    const fromEmail = "DomineBrasil <onboarding@resend.dev>";
    
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: [instructorEmail],
        subject: `🚗 Nova solicitação de aula de ${studentName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
              .info-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0d9488; }
              .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
              .label { color: #666; }
              .value { font-weight: 600; color: #0d9488; }
              .cta-button { display: inline-block; background: #0d9488; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">📚 Nova Solicitação de Aula</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Um aluno quer agendar uma aula com você!</p>
            </div>
            <div class="content">
              <p>Olá, <strong>${instructorName}</strong>!</p>
              <p>O aluno <strong>${studentName}</strong> enviou uma solicitação de aula prática.</p>
              
              <div class="info-card">
                <h3 style="margin-top: 0; color: #0d9488;">📋 Detalhes da Solicitação</h3>
                <div class="info-row">
                  <span class="label">👤 Aluno</span>
                  <span class="value">${studentName}</span>
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
                  <span class="value">${lessonTime}</span>
                </div>
              </div>
              
              <p style="text-align: center;">
                <strong>Acesse o app para aceitar ou recusar esta solicitação.</strong>
              </p>
              
              <div style="text-align: center;">
                <a href="https://dominebrasil.lovable.app/app/instructor/requests" class="cta-button">
                  Ver Solicitações
                </a>
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
        logStep("Email send failed (non-blocking)", { error: emailError });
      } else {
        logStep("Email sent successfully", { emailId: emailData?.id });
      }
    } catch (emailErr) {
      logStep("Email exception (non-blocking)", { error: String(emailErr) });
    }

    // Always return success - booking was already created, email is secondary
    return new Response(JSON.stringify({ success: true }), {
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
