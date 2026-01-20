import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetLink: string;
  userName?: string;
}

const getEmailTemplate = (resetLink: string, userName?: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperar Senha - NeoHub</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">
          
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #2C3E50 0%, #1a252f 100%); padding: 32px 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <!-- Logo placeholder with NeoHub icon -->
                    <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 16px; margin: 0 auto 16px auto; line-height: 64px;">
                      <span style="color: #ffffff; font-size: 28px; font-weight: bold;">N</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                      NeoHub
                    </h1>
                    <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.8); font-size: 14px;">
                      Ecossistema de Gestão Integrada
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Greeting -->
              <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 22px; font-weight: 600;">
                ${userName ? `Olá, ${userName}! 👋` : 'Olá! 👋'}
              </h2>
              
              <p style="margin: 0 0 24px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                Recebemos uma solicitação para redefinir a senha da sua conta no <strong style="color: #2C3E50;">NeoHub</strong>.
              </p>
              
              <!-- Info box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                      🔐 <strong>Dica de segurança:</strong> Escolha uma senha forte com pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 16px 48px; border-radius: 50px; box-shadow: 0 4px 14px 0 rgba(245, 158, 11, 0.39);">
                      Redefinir Minha Senha
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative link -->
              <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px; text-align: center;">
                Ou copie e cole este link no seu navegador:
              </p>
              <p style="margin: 0 0 32px 0; background-color: #f1f5f9; padding: 12px 16px; border-radius: 8px; word-break: break-all; font-size: 12px; color: #475569; font-family: monospace;">
                ${resetLink}
              </p>
              
              <!-- Warning -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background-color: #fef2f2; border-radius: 12px; padding: 16px; border-left: 4px solid #ef4444;">
                    <p style="margin: 0; color: #991b1b; font-size: 13px; line-height: 1.5;">
                      ⚠️ Se você não solicitou esta redefinição, ignore este e-mail. Sua senha permanecerá inalterada.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">
                      Este e-mail foi enviado automaticamente pelo sistema NeoHub.
                    </p>
                    <p style="margin: 0 0 16px 0; color: #94a3b8; font-size: 12px;">
                      © ${new Date().getFullYear()} NeoHub by NeoFolic. Todos os direitos reservados.
                    </p>
                    <!-- Portal badges -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 0 4px;">
                          <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 10px; font-weight: 600; padding: 4px 8px; border-radius: 4px;">Licença ByNeoFolic</span>
                        </td>
                        <td style="padding: 0 4px;">
                          <span style="display: inline-block; background-color: #d1fae5; color: #065f46; font-size: 10px; font-weight: 600; padding: 4px 8px; border-radius: 4px;">IBRAMEC</span>
                        </td>
                        <td style="padding: 0 4px;">
                          <span style="display: inline-block; background-color: #fce7f3; color: #9d174d; font-size: 10px; font-weight: 600; padding: 4px 8px; border-radius: 4px;">NeoCare</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetLink, userName }: PasswordResetRequest = await req.json();

    if (!email || !resetLink) {
      return new Response(
        JSON.stringify({ error: "Email e link de reset são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending password reset email to:", email);

    // Use fetch to call Resend API directly
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NeoHub <noreply@neofolic.com.br>",
        to: [email],
        subject: "🔐 Recuperar Senha - NeoHub",
        html: getEmailTemplate(resetLink, userName),
      }),
    });

    const emailResponse = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", emailResponse);
      
      // Handle testing mode gracefully
      if (emailResponse.message?.includes("testing") || emailResponse.message?.includes("domain")) {
        console.log("Resend in testing mode, skipping actual send");
        return new Response(
          JSON.stringify({ success: true, status: "skipped", message: "Email skipped (testing mode)" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending password reset email:", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
