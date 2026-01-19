import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotifyEventRequest {
  event_type: 'new_lead' | 'lead_claimed' | 'lead_scheduled' | 'lead_sold' | 'lead_discarded';
  lead_name: string;
  lead_phone: string;
  lead_state?: string;
  lead_city?: string;
  procedure_interest?: string;
  licensee_name?: string;
  scheduled_at?: string;
  converted_value?: number;
  procedures_sold?: string[];
  discard_reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotifyEventRequest = await req.json();
    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "admin@byneofolic.com";
    
    let subject = "";
    let htmlContent = "";
    
    const leadLocation = [data.lead_city, data.lead_state].filter(Boolean).join(", ") || "Não informado";
    const procedureLabel = data.procedure_interest || "Não especificado";
    
    switch (data.event_type) {
      case 'new_lead':
        subject = `🔥 Novo Lead: ${data.lead_name}`;
        htmlContent = `
          <h1>Novo Lead Recebido!</h1>
          <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Nome:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.lead_name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Telefone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.lead_phone}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Localização:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${leadLocation}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Interesse:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${procedureLabel}</td></tr>
          </table>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">Acesse o painel HotLeads para visualizar todos os detalhes.</p>
        `;
        break;
        
      case 'lead_claimed':
        subject = `📱 Lead Captado: ${data.lead_name} → ${data.licensee_name}`;
        htmlContent = `
          <h1>Lead Captado por Licenciado</h1>
          <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Lead:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.lead_name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Licenciado:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.licensee_name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Localização:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${leadLocation}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Interesse:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${procedureLabel}</td></tr>
          </table>
        `;
        break;
        
      case 'lead_scheduled':
        subject = `📅 Consulta Agendada: ${data.lead_name}`;
        const scheduledDate = data.scheduled_at ? new Date(data.scheduled_at).toLocaleDateString('pt-BR', { 
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
        }) : "Data não informada";
        htmlContent = `
          <h1>Consulta Agendada!</h1>
          <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Lead:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.lead_name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Licenciado:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.licensee_name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Data/Hora:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${scheduledDate}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Procedimento:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${procedureLabel}</td></tr>
          </table>
        `;
        break;
        
      case 'lead_sold':
        subject = `💰 Venda Realizada: R$ ${(data.converted_value || 0).toLocaleString('pt-BR')}`;
        const procedures = data.procedures_sold?.join(", ") || "Não especificado";
        htmlContent = `
          <h1 style="color: #22c55e;">Venda Realizada!</h1>
          <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Lead:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.lead_name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Licenciado:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.licensee_name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Valor:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #22c55e; font-weight: bold;">R$ ${(data.converted_value || 0).toLocaleString('pt-BR')}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Procedimentos:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${procedures}</td></tr>
          </table>
        `;
        break;
        
      case 'lead_discarded':
        subject = `❌ Lead Descartado: ${data.lead_name}`;
        htmlContent = `
          <h1 style="color: #ef4444;">Lead Descartado</h1>
          <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Lead:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.lead_name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Licenciado:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.licensee_name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Motivo:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.discard_reason || "Não informado"}</td></tr>
          </table>
        `;
        break;
        
      default:
        return new Response(JSON.stringify({ error: "Invalid event type" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    const emailResponse = await resend.emails.send({
      from: "ByNeofolic <notificacoes@byneofolic.com>",
      to: [adminEmail],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${htmlContent}
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">Esta é uma notificação automática do sistema HotLeads.</p>
        </div>
      `,
    });

    console.log("HotLead event notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-hotlead-event:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
