import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface InstructorWithExpiry {
  profile_id: string;
  email: string;
  full_name: string;
  cnh_expiry_date: string | null;
  credential_expiry: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all instructors with document expiry dates
    const { data: instructors, error } = await supabase
      .from("instructors_details")
      .select(`
        profile_id,
        cnh_expiry_date,
        credential_expiry,
        profiles!instructors_details_profile_id_fkey(full_name)
      `)
      .not("profile_id", "is", null);

    if (error) throw error;

    const today = new Date();
    const notificationDays = [30, 15, 7]; // Days before expiry to send notifications
    const emailsSent: string[] = [];

    for (const instructor of instructors || []) {
      // Get instructor email from auth.users
      const { data: userData } = await supabase.auth.admin.getUserById(instructor.profile_id);
      if (!userData?.user?.email) continue;

      const email = userData.user.email;
      const fullName = (instructor.profiles as any)?.full_name || "Instrutor";

      // Check CNH expiry
      if (instructor.cnh_expiry_date) {
        const expiryDate = new Date(instructor.cnh_expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (notificationDays.includes(daysUntilExpiry)) {
          await sendExpiryEmail(email, fullName, "CNH", daysUntilExpiry, instructor.cnh_expiry_date);
          emailsSent.push(`CNH: ${email} (${daysUntilExpiry} dias)`);
        }
      }

      // Check Credential expiry
      if (instructor.credential_expiry) {
        const expiryDate = new Date(instructor.credential_expiry);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (notificationDays.includes(daysUntilExpiry)) {
          await sendExpiryEmail(email, fullName, "Credencial do DETRAN", daysUntilExpiry, instructor.credential_expiry);
          emailsSent.push(`Credencial: ${email} (${daysUntilExpiry} dias)`);
        }
      }
    }

    console.log("Document expiry check completed. Emails sent:", emailsSent.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: emailsSent.length,
        details: emailsSent 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error checking document expiry:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function sendExpiryEmail(
  email: string,
  fullName: string,
  documentType: string,
  daysUntilExpiry: number,
  expiryDate: string
) {
  const formattedDate = new Date(expiryDate).toLocaleDateString("pt-BR");
  
  const urgencyLevel = daysUntilExpiry <= 7 
    ? "🚨 URGENTE" 
    : daysUntilExpiry <= 15 
    ? "⚠️ ATENÇÃO" 
    : "📢 AVISO";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #14b8a6, #0d9488); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert-box { background: ${daysUntilExpiry <= 7 ? '#fef2f2' : daysUntilExpiry <= 15 ? '#fffbeb' : '#f0fdf4'}; 
                     border-left: 4px solid ${daysUntilExpiry <= 7 ? '#ef4444' : daysUntilExpiry <= 15 ? '#f59e0b' : '#22c55e'};
                     padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;">Domine Brasil</h1>
          <p style="margin:5px 0 0 0; opacity: 0.9;">Aviso de Documento</p>
        </div>
        <div class="content">
          <p>Olá, <strong>${fullName}</strong>!</p>
          
          <div class="alert-box">
            <p style="margin:0;"><strong>${urgencyLevel}</strong></p>
            <p style="margin:5px 0 0 0;">
              Seu documento <strong>${documentType}</strong> irá vencer em <strong>${daysUntilExpiry} dias</strong> 
              (${formattedDate}).
            </p>
          </div>
          
          <p>
            Para continuar utilizando a plataforma Domine Brasil sem interrupções, 
            é necessário que você atualize seu documento antes da data de vencimento.
          </p>
          
          ${daysUntilExpiry <= 7 ? `
            <p style="color: #ef4444;">
              <strong>⚠️ Atenção:</strong> Após o vencimento, você não poderá dar aulas 
              até que o documento seja atualizado.
            </p>
          ` : ''}
          
          <p>
            <a href="https://dominebrasil.com.br/onboarding" class="button">
              Atualizar Documento
            </a>
          </p>
          
          <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
            Dúvidas? Entre em contato conosco através do chat da plataforma.
          </p>
        </div>
        <div class="footer">
          <p>© 2024 Domine Brasil. Todos os direitos reservados.</p>
          <p>Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Domine Brasil <noreply@resend.dev>",
      to: [email],
      subject: `${urgencyLevel} - Seu documento ${documentType} vence em ${daysUntilExpiry} dias`,
      html: htmlContent,
    }),
  });

  const result = await emailResponse.json();
  console.log(`Email sent to ${email} for ${documentType} expiry:`, result);
  return result;
}

serve(handler);
