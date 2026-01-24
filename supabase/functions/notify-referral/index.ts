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

    console.log("Processing referral notification:", referral.name, referral.type);

    const isStudentReferral = referral.type === 'student_referral';
    const subject = isStudentReferral 
      ? `🎓 Nova Indicação Formação 360: ${referral.name}`
      : `📋 Novo Lead de Indicação: ${referral.name}`;

    const htmlContent = `
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

    // Try with verified domain first, fallback to resend.dev for testing
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
    
    try {
      const emailResponse = await resend.emails.send({
        from: `IBRAMEC <${fromEmail}>`,
        to: [adminEmail],
        subject: subject,
        html: htmlContent,
      });

      // Check if there was an error in the response
      if (emailResponse.error) {
        // Handle domain not verified error gracefully
        if (emailResponse.error.message?.includes('domain is not verified')) {
          console.log("Email domain not verified, trying with resend.dev...");
          
          // Retry with resend.dev test domain
          const retryResponse = await resend.emails.send({
            from: "IBRAMEC <onboarding@resend.dev>",
            to: [adminEmail],
            subject: subject,
            html: htmlContent,
          });

          if (retryResponse.error) {
            console.error("Retry also failed:", retryResponse.error);
            return new Response(
              JSON.stringify({ success: false, error: retryResponse.error.message }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          console.log("Email sent successfully with resend.dev:", retryResponse.data?.id);
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Notification sent (via resend.dev)",
              email_id: retryResponse.data?.id 
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        throw new Error(emailResponse.error.message);
      }

      console.log("Email sent successfully:", emailResponse.data?.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Notification sent",
          email_id: emailResponse.data?.id 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (emailError: any) {
      console.error("Email error:", emailError);
      throw emailError;
    }

  } catch (error: any) {
    console.error("Error in notify-referral:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
