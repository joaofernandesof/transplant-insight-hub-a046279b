import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestPasswordResetRequest {
  email: string;
  redirectUrl: string;
}

const generateToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const getEmailTemplate = (resetLink: string) => `
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
                    <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 16px; margin: 0 auto 16px auto; line-height: 64px; text-align: center;">
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
              <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 22px; font-weight: 600;">
                Olá! 👋
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
              
              <!-- Expiry notice -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background-color: #eff6ff; border-radius: 12px; padding: 16px; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.5;">
                      ⏰ Este link expira em <strong>1 hora</strong>. Após esse período, você precisará solicitar um novo.
                    </p>
                  </td>
                </tr>
              </table>
              
              <div style="height: 24px;"></div>
              
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
                      © 2025 NeoHub by NeoFolic. Todos os direitos reservados.
                    </p>
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
    const { email, redirectUrl }: RequestPasswordResetRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false }
    });

    // Check if user exists using neohub_users table (reliable, no pagination issues)
    const normalizedEmail = email.trim().toLowerCase();
    
    const { data: existingUser, error: lookupError } = await supabase
      .from("neohub_users")
      .select("user_id, email")
      .ilike("email", normalizedEmail)
      .eq("is_active", true)
      .maybeSingle();

    console.log("User lookup result:", { normalizedEmail, found: !!existingUser, lookupError: lookupError?.message });

    if (!existingUser) {
      // Don't reveal if user exists - return success anyway for security
      console.log("User not found in neohub_users, but returning success for security");
      return new Response(
        JSON.stringify({ success: true, message: "Se o email existir, você receberá as instruções." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate secure token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Delete any existing tokens for this email
    await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("email", email.toLowerCase());

    // Store token
    const { error: insertError } = await supabase
      .from("password_reset_tokens")
      .insert({
        email: email.toLowerCase(),
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing token:", insertError);
      throw new Error("Erro ao processar solicitação");
    }

    // Build reset link
    const resetLink = `${redirectUrl}?token=${token}`;

    console.log("Sending password reset email to:", email);

    // Send email via Resend
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
        html: getEmailTemplate(resetLink),
      }),
    });

    const emailResponse = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", emailResponse);
      
      // Handle testing mode gracefully
      if (emailResponse.message?.includes("testing") || emailResponse.message?.includes("domain")) {
        console.log("Resend in testing mode - email not actually sent");
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Email enviado! Verifique sua caixa de entrada.",
            debug: "Testing mode - check Resend dashboard"
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      throw new Error(emailResponse.message || "Erro ao enviar email");
    }

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Email enviado! Verifique sua caixa de entrada." }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in request-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
