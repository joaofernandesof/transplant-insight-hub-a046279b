import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATUS_LABELS: Record<string, string> = {
  open: "📋 Aberto",
  in_progress: "🔧 Em Andamento",
  waiting: "⏳ Aguardando",
  resolved: "✅ Resolvido",
  closed: "🔒 Fechado",
};

const STATUS_COLORS: Record<string, string> = {
  open: "#ef4444",
  in_progress: "#3b82f6",
  waiting: "#f59e0b",
  resolved: "#22c55e",
  closed: "#6b7280",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "no_api_key" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const {
      ticket_number,
      title,
      requester_name,
      requester_email,
      old_status,
      new_status,
      assigned_name,
    } = await req.json();

    if (!requester_email) {
      console.log("No requester email, skipping");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "no_email" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const statusLabel = STATUS_LABELS[new_status] || new_status;
    const statusColor = STATUS_COLORS[new_status] || "#6b7280";
    const oldStatusLabel = STATUS_LABELS[old_status] || old_status;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${statusColor}; color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">${statusLabel}</h1>
          <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Chamado ${ticket_number}</p>
        </div>
        
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="color: #1e293b; font-size: 16px; margin-top: 0;">
            Olá${requester_name ? `, ${requester_name}` : ""}!
          </p>
          <p style="color: #475569; font-size: 14px;">
            Seu chamado teve uma atualização de status:
          </p>
          
          <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Chamado:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #1e293b; font-size: 14px;">${ticket_number}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Título:</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Status anterior:</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${oldStatusLabel}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Novo status:</td>
                <td style="padding: 8px 0; font-weight: bold; color: ${statusColor}; font-size: 14px;">${statusLabel}</td>
              </tr>
              ${assigned_name ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Responsável:</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${assigned_name}</td>
              </tr>` : ""}
            </table>
          </div>
          
          <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">
            Caso tenha dúvidas, entre em contato com a equipe de TI.
          </p>
        </div>
        
        <div style="background: #1e293b; color: #94a3b8; padding: 16px; border-radius: 0 0 12px 12px; font-size: 12px; text-align: center;">
          NeoTeam — Helpdesk de TI
        </div>
      </div>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NeoTeam TI <onboarding@resend.dev>",
        to: [requester_email],
        subject: `${statusLabel} — Chamado ${ticket_number}: ${title}`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend error:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log(`Email sent to ${requester_email} for ticket ${ticket_number}`);

    return new Response(
      JSON.stringify({ success: true, emailSent: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-ticket-status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
