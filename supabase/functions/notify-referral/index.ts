import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReferralData {
  name: string;
  email: string;
  phone: string;
  referrer_name?: string;
  referral_code?: string;
  type: 'student_referral' | 'referral_lead';
  has_crm?: boolean;
  crm?: string;
  city?: string;
  state?: string;
  interest?: string;
}

async function sendEmail(resend: any, from: string, to: string, subject: string, html: string): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    console.log(`Sending email to: ${to} from: ${from}`);
    
    const emailResponse = await resend.emails.send({
      from: from,
      to: [to],
      subject: subject,
      html: html,
    });

    if (emailResponse.error) {
      // Handle domain not verified error - retry with resend.dev
      if (emailResponse.error.message?.includes('domain is not verified')) {
        console.log("Domain not verified, retrying with resend.dev...");
        
        const retryResponse = await resend.emails.send({
          from: "IBRAMEC <onboarding@resend.dev>",
          to: [to],
          subject: subject,
          html: html,
        });

        if (retryResponse.error) {
          console.error("Retry failed:", retryResponse.error);
          return { success: false, error: retryResponse.error.message };
        }

        console.log(`Email sent successfully to ${to} - ID: ${retryResponse.data?.id}`);
        return { success: true, id: retryResponse.data?.id };
      }
      
      return { success: false, error: emailResponse.error.message };
    }

    console.log(`Email sent successfully to ${to} - ID: ${emailResponse.data?.id}`);
    return { success: true, id: emailResponse.data?.id };
  } catch (error: any) {
    console.error(`Error sending email to ${to}:`, error);
    return { success: false, error: error.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "contato@ibramec.com.br";
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email notification");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "RESEND_API_KEY not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    const referral: ReferralData = await req.json();

    console.log("Processing referral notification:", referral.name, referral.type, "email:", referral.email);

    const isStudentReferral = referral.type === 'student_referral';
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
    const fromAddress = `IBRAMEC <${fromEmail}>`;

    // ============ EMAIL 1: Para o ADMIN ============
    const adminSubject = isStudentReferral 
      ? `🎓 Nova Indicação Formação 360: ${referral.name}`
      : `📋 Novo Lead de Indicação: ${referral.name}`;

    const adminHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            ${isStudentReferral ? '🎓 Nova Indicação Formação 360' : '📋 Novo Lead de Indicação'}
          </h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #374151; margin-top: 0;">Dados do Indicado</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 120px;">Nome:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${referral.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Email:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <a href="mailto:${referral.email}" style="color: #059669;">${referral.email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">WhatsApp:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <a href="https://wa.me/55${referral.phone.replace(/\D/g, '')}" style="color: #059669;">${referral.phone}</a>
              </td>
            </tr>
            ${isStudentReferral && referral.has_crm ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">CRM:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #059669;">${referral.crm || 'Sim, possui'}</td>
            </tr>
            ` : ''}
            ${!isStudentReferral && referral.city && referral.state ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Localização:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${referral.city}/${referral.state}</td>
            </tr>
            ` : ''}
            ${referral.interest ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Interesse:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${referral.interest}</td>
            </tr>
            ` : ''}
            ${referral.referrer_name ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Indicado por:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${referral.referrer_name}</td>
            </tr>
            ` : ''}
            ${referral.referral_code ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Código:</td>
              <td style="padding: 8px 0;">
                <span style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${referral.referral_code}</span>
              </td>
            </tr>
            ` : ''}
          </table>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="https://transplant-insight-hub.lovable.app/admin/referrals" 
               style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Ver no Painel Admin
            </a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>Este email foi enviado automaticamente pelo sistema NeoHub.</p>
          <p>© ${new Date().getFullYear()} IBRAMEC - Instituto Brasileiro de Medicina Capilar</p>
        </div>
      </body>
      </html>
    `;

    // ============ EMAIL 2: Para o INDICADO (pessoa que preencheu o formulário) ============
    const referredSubject = isStudentReferral 
      ? `🎓 Sua inscrição foi recebida - Formação 360° IBRAMEC`
      : `✅ Recebemos seu interesse - IBRAMEC`;

    const referredHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            ${isStudentReferral ? '🎓 Formação 360° IBRAMEC' : '✅ Recebemos seu interesse!'}
          </h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #374151; margin-top: 0;">Olá, ${referral.name}! 👋</h2>
          
          ${isStudentReferral ? `
          <p style="color: #4b5563; font-size: 16px;">
            Recebemos sua solicitação de desconto exclusivo para a <strong>Formação 360°</strong> em Transplante Capilar!
          </p>
          
          <div style="background: #dcfce7; border-left: 4px solid #10b981; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #166534; font-weight: 600;">
              🎁 Você tem direito a um desconto especial por ter sido indicado${referral.referrer_name ? ` por ${referral.referrer_name}` : ''}!
            </p>
          </div>
          
          <p style="color: #4b5563; font-size: 16px;">
            Nossa equipe entrará em contato em breve pelo WhatsApp <strong>${referral.phone}</strong> para passar todas as informações sobre o curso e condições especiais.
          </p>
          
          <h3 style="color: #374151; margin-top: 25px;">O que você vai aprender:</h3>
          <ul style="color: #4b5563;">
            <li>Técnicas avançadas de transplante capilar (FUE e FUT)</li>
            <li>Tricologia e diagnóstico capilar</li>
            <li>Prática intensiva em casos reais</li>
            <li>Gestão de clínica e marketing médico</li>
          </ul>
          ` : `
          <p style="color: #4b5563; font-size: 16px;">
            Recebemos seu interesse e nossa equipe entrará em contato em breve!
          </p>
          
          ${referral.referrer_name ? `
          <div style="background: #dcfce7; border-left: 4px solid #10b981; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #166534; font-weight: 600;">
              Você foi indicado por ${referral.referrer_name}!
            </p>
          </div>
          ` : ''}
          
          <p style="color: #4b5563; font-size: 16px;">
            Entraremos em contato pelo telefone <strong>${referral.phone}</strong> para entender melhor suas necessidades.
          </p>
          `}
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="https://wa.me/5521999999999" 
               style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              💬 Falar pelo WhatsApp
            </a>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>Se você não solicitou este contato, por favor ignore este email.</p>
          <p>© ${new Date().getFullYear()} IBRAMEC - Instituto Brasileiro de Medicina Capilar</p>
        </div>
      </body>
      </html>
    `;

    // Enviar ambos os emails
    const results = {
      admin: { success: false, id: null as string | null, error: null as string | null },
      referred: { success: false, id: null as string | null, error: null as string | null },
    };

    // Email para o admin
    const adminResult = await sendEmail(resend, fromAddress, adminEmail, adminSubject, adminHtmlContent);
    results.admin = { success: adminResult.success, id: adminResult.id || null, error: adminResult.error || null };

    // Email para a pessoa indicada (o email que foi preenchido no formulário)
    if (referral.email) {
      const referredResult = await sendEmail(resend, fromAddress, referral.email, referredSubject, referredHtmlContent);
      results.referred = { success: referredResult.success, id: referredResult.id || null, error: referredResult.error || null };
    } else {
      results.referred = { success: false, id: null, error: "No email provided for referred person" };
    }

    console.log("Email results:", JSON.stringify(results));

    // Retornar sucesso se pelo menos um email foi enviado
    const anySuccess = results.admin.success || results.referred.success;

    return new Response(
      JSON.stringify({ 
        success: anySuccess, 
        message: `Admin: ${results.admin.success ? 'sent' : 'failed'}, Referred: ${results.referred.success ? 'sent' : 'failed'}`,
        results: results
      }),
      { status: anySuccess ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in notify-referral:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
