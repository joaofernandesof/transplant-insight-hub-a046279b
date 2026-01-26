import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoginNotificationRequest {
  userId: string;
  userName: string;
  userEmail: string;
  profiles: string[];
  isAdmin: boolean;
  loginTime: string;
  userAgent?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: LoginNotificationRequest = await req.json();
    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "admin@byneofolic.com";
    
    const { userName, userEmail, profiles, isAdmin, loginTime, userAgent } = data;
    
    // Format login time
    const loginDate = new Date(loginTime);
    const formattedTime = loginDate.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Profile badges
    const profileBadges = profiles.map(p => {
      const colors: Record<string, string> = {
        'administrador': '#ef4444',
        'licenciado': '#f59e0b',
        'colaborador': '#3b82f6',
        'medico': '#14b8a6',
        'aluno': '#10b981',
        'paciente': '#ec4899',
        'cliente_avivar': '#8b5cf6',
      };
      const color = colors[p] || '#6b7280';
      return `<span style="display:inline-block;padding:4px 12px;background:${color};color:white;border-radius:20px;font-size:12px;margin-right:4px;">${p}</span>`;
    }).join('');

    // Detect device from user agent
    let deviceInfo = 'Dispositivo desconhecido';
    if (userAgent) {
      if (userAgent.includes('Mobile')) deviceInfo = '📱 Mobile';
      else if (userAgent.includes('Tablet')) deviceInfo = '📱 Tablet';
      else deviceInfo = '💻 Desktop';
      
      if (userAgent.includes('Chrome')) deviceInfo += ' (Chrome)';
      else if (userAgent.includes('Firefox')) deviceInfo += ' (Firefox)';
      else if (userAgent.includes('Safari')) deviceInfo += ' (Safari)';
      else if (userAgent.includes('Edge')) deviceInfo += ' (Edge)';
    }

    const subject = `🔐 Login: ${userName} entrou no NeoHub`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
        <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;margin-top:20px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#10b981,#059669);padding:24px;text-align:center;">
            <h1 style="color:white;margin:0;font-size:24px;">🔐 Novo Login Detectado</h1>
          </div>
          
          <!-- Content -->
          <div style="padding:24px;">
            <div style="background:#f0fdf4;border-left:4px solid #10b981;padding:16px;margin-bottom:20px;border-radius:0 8px 8px 0;">
              <p style="margin:0;font-size:16px;color:#166534;">
                <strong>${userName}</strong> acabou de entrar no sistema.
              </p>
            </div>
            
            <!-- User Details -->
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;width:120px;">📧 Email</td>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:500;">${userEmail}</td>
              </tr>
              <tr>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">🏷️ Perfis</td>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;">${profileBadges}</td>
              </tr>
              <tr>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">⏰ Horário</td>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:500;">${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">🖥️ Dispositivo</td>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;">${deviceInfo}</td>
              </tr>
              <tr>
                <td style="padding:12px;color:#6b7280;">👤 Admin?</td>
                <td style="padding:12px;">
                  ${isAdmin 
                    ? '<span style="color:#ef4444;font-weight:bold;">✅ Sim</span>' 
                    : '<span style="color:#6b7280;">Não</span>'}
                </td>
              </tr>
            </table>
            
            <!-- CTA -->
            <div style="text-align:center;margin-top:24px;">
              <a href="https://neohub.byneofolic.com/admin/event-logs" 
                 style="display:inline-block;padding:12px 24px;background:#10b981;color:white;text-decoration:none;border-radius:8px;font-weight:500;">
                Ver Log de Eventos
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              NeoHub by NeoFolic • Sistema de Monitoramento
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`Sending login notification for ${userName} to ${adminEmail}`);

    const emailResponse = await resend.emails.send({
      from: "NeoHub <adm@ibramec.com>",
      to: [adminEmail],
      subject,
      html: htmlContent,
    });

    console.log("Email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (err) {
    const error = err as Error;
    console.error("Error sending login notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
