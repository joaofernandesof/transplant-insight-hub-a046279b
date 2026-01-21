import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MetricAlert {
  id: string;
  metric_key: string;
  metric_name: string;
  threshold_value: number;
  comparison_operator: string;
  severity: string;
  is_active: boolean;
  email_recipients: string[];
  last_triggered_at: string | null;
  cooldown_minutes: number;
}

interface MetricPayload {
  metrics: Record<string, number>;
}

function shouldTrigger(value: number, threshold: number, operator: string): boolean {
  switch (operator) {
    case 'gt': return value > threshold;
    case 'lt': return value < threshold;
    case 'gte': return value >= threshold;
    case 'lte': return value <= threshold;
    case 'eq': return value === threshold;
    default: return false;
  }
}

function getOperatorLabel(operator: string): string {
  switch (operator) {
    case 'gt': return 'maior que';
    case 'lt': return 'menor que';
    case 'gte': return 'maior ou igual a';
    case 'lte': return 'menor ou igual a';
    case 'eq': return 'igual a';
    default: return operator;
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'warning': return '#f59e0b';
    case 'info': return '#3b82f6';
    default: return '#6b7280';
  }
}

function getSeverityLabel(severity: string): string {
  switch (severity) {
    case 'critical': return '🚨 CRÍTICO';
    case 'warning': return '⚠️ ATENÇÃO';
    case 'info': return 'ℹ️ INFORMAÇÃO';
    default: return severity;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { metrics }: MetricPayload = await req.json();

    // Fetch active alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('metric_alerts')
      .select('*')
      .eq('is_active', true);

    if (alertsError) throw alertsError;

    const triggeredAlerts: Array<{
      alert: MetricAlert;
      value: number;
    }> = [];

    const now = new Date();

    for (const alert of alerts as MetricAlert[]) {
      const value = metrics[alert.metric_key];
      if (value === undefined) continue;

      // Check if alert should trigger
      if (!shouldTrigger(value, alert.threshold_value, alert.comparison_operator)) {
        continue;
      }

      // Check cooldown
      if (alert.last_triggered_at) {
        const lastTriggered = new Date(alert.last_triggered_at);
        const minutesSinceLast = (now.getTime() - lastTriggered.getTime()) / 60000;
        if (minutesSinceLast < alert.cooldown_minutes) {
          continue;
        }
      }

      triggeredAlerts.push({ alert, value });

      // Record in history
      await supabase.from('alert_history').insert({
        alert_id: alert.id,
        metric_key: alert.metric_key,
        metric_value: value,
        threshold_value: alert.threshold_value,
        severity: alert.severity,
        emails_sent_to: alert.email_recipients,
      });

      // Update last triggered
      await supabase
        .from('metric_alerts')
        .update({ last_triggered_at: now.toISOString() })
        .eq('id', alert.id);

      // Record metric in history for trends
      await supabase.from('metric_history').insert({
        metric_key: alert.metric_key,
        metric_value: value,
        metadata: { triggered_alert: true, severity: alert.severity },
      });
    }

    // Send emails for triggered alerts using Resend via fetch
    for (const { alert, value } of triggeredAlerts) {
      if (alert.email_recipients.length === 0) continue;

      const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");
      const recipients = alert.email_recipients.length > 0 
        ? alert.email_recipients 
        : (adminEmail ? [adminEmail] : []);

      if (recipients.length === 0) continue;

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) continue;

      try {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: ${getSeverityColor(alert.severity)}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">${getSeverityLabel(alert.severity)}</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
              <h2 style="margin-top: 0; color: #1e293b;">${alert.metric_name}</h2>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Valor Atual:</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${value}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Limite Configurado:</td>
                    <td style="padding: 8px 0;">${getOperatorLabel(alert.comparison_operator)} ${alert.threshold_value}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Horário:</td>
                    <td style="padding: 8px 0;">${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
                Este alerta foi configurado para disparar quando <strong>${alert.metric_name}</strong> 
                for <strong>${getOperatorLabel(alert.comparison_operator)} ${alert.threshold_value}</strong>.
              </p>
            </div>
            
            <div style="background: #1e293b; color: #94a3b8; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; text-align: center;">
              NeoHub - Sistema de Monitoramento
            </div>
          </div>
        `;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "NeoHub Alertas <onboarding@resend.dev>",
            to: recipients,
            subject: `${getSeverityLabel(alert.severity)} - ${alert.metric_name}`,
            html: emailHtml,
          }),
        });
      } catch (emailError) {
        console.error(`Failed to send email for alert ${alert.id}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        alertsChecked: alerts?.length || 0,
        alertsTriggered: triggeredAlerts.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in check-metric-alerts:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
