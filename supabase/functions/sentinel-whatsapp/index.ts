import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppConfig {
  instance_url: string;
  api_token: string;
  phone_number: string;
}

interface AlertPayload {
  systemName: string;
  severity: 'high' | 'medium' | 'low';
  type: string;
  message: string;
}

// Send WhatsApp message via Uazapi
async function sendUazapiMessage(
  config: WhatsAppConfig,
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${config.instance_url}/message/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.api_token}`,
      },
      body: JSON.stringify({
        number: phone.replace(/\D/g, ''),
        message: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }

    return { success: true };
  } catch (error: unknown) {
    const errorObj = error as Error;
    return { success: false, error: errorObj.message };
  }
}

// Format alert message
function formatAlertMessage(alert: AlertPayload): string {
  const severityEmoji = {
    high: '🔴',
    medium: '🟡',
    low: '🔵',
  };

  const typeLabels: Record<string, string> = {
    downtime: 'Sistema Fora do Ar',
    ssl: 'Certificado SSL',
    webhook_fail: 'Webhook Falhou',
    slow_response: 'Resposta Lenta',
    error: 'Erro Detectado',
  };

  return `${severityEmoji[alert.severity]} *ALERTA SYSTEM SENTINEL*

📍 *Sistema:* ${alert.systemName}
⚠️ *Tipo:* ${typeLabels[alert.type] || alert.type}
📊 *Severidade:* ${alert.severity.toUpperCase()}

💬 ${alert.message}

🕐 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}

_Responda "OK" para confirmar recebimento._`;
}

// Format test message
function formatTestMessage(): string {
  return `✅ *TESTE SYSTEM SENTINEL*

Esta é uma mensagem de teste para verificar a integração do WhatsApp.

Se você recebeu esta mensagem, a configuração está funcionando corretamente! 🎉

🕐 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
}

// Format daily summary
function formatDailySummary(stats: {
  healthySystems: number;
  warningSystems: number;
  criticalSystems: number;
  totalAlerts: number;
  avgUptime: number;
}): string {
  const statusEmoji = stats.criticalSystems > 0 ? '🔴' : stats.warningSystems > 0 ? '🟡' : '🟢';
  
  return `${statusEmoji} *RESUMO DIÁRIO - SYSTEM SENTINEL*

📊 *Status Geral:*
✅ Sistemas OK: ${stats.healthySystems}
⚠️ Com Atenção: ${stats.warningSystems}
🔴 Críticos: ${stats.criticalSystems}

📈 *Métricas:*
• Alertas (24h): ${stats.totalAlerts}
• Uptime Médio: ${stats.avgUptime.toFixed(1)}%

🕐 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}

_Relatório automático - System Sentinel_`;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, alert, stats } = body;

    // Get WhatsApp config
    const { data: config, error: configError } = await supabase
      .from('sentinel_whatsapp_config')
      .select('*')
      .limit(1)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ success: false, error: 'WhatsApp não configurado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get recipients
    const { data: recipients } = await supabase
      .from('sentinel_alert_recipients')
      .select('*')
      .eq('is_active', true)
      .eq('receive_whatsapp', true);

    const phones = recipients?.map(r => r.phone).filter(Boolean) || [];
    if (phones.length === 0) {
      phones.push(config.phone_number);
    }

    let message: string;
    let results: Array<{ phone: string; success: boolean; error?: string }> = [];

    switch (action) {
      case 'test':
        message = formatTestMessage();
        // Only send to main phone for test
        const testResult = await sendUazapiMessage(config, config.phone_number, message);
        results.push({ phone: config.phone_number, ...testResult });
        
        // Update last_test_at
        await supabase
          .from('sentinel_whatsapp_config')
          .update({ last_test_at: new Date().toISOString(), is_connected: testResult.success })
          .eq('id', config.id);
        break;

      case 'alert':
        if (!alert) {
          return new Response(
            JSON.stringify({ success: false, error: 'Dados do alerta ausentes' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if should notify based on severity
        const shouldNotify = 
          (alert.severity === 'high' && config.notify_high) ||
          (alert.severity === 'medium' && config.notify_medium) ||
          (alert.severity === 'low' && config.notify_low);

        if (!shouldNotify) {
          return new Response(
            JSON.stringify({ success: true, message: 'Notificação desabilitada para esta severidade' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        message = formatAlertMessage(alert);
        
        // Filter recipients by severity
        const filteredRecipients = recipients?.filter(r => 
          r.severity_filter?.includes(alert.severity)
        ) || [];
        const targetPhones = filteredRecipients.length > 0 
          ? filteredRecipients.map(r => r.phone).filter(Boolean)
          : [config.phone_number];

        // Send to all recipients
        for (const phone of targetPhones as string[]) {
          const result = await sendUazapiMessage(config, phone, message);
          results.push({ phone, ...result });
        }
        break;

      case 'daily-summary':
        if (!stats) {
          return new Response(
            JSON.stringify({ success: false, error: 'Estatísticas ausentes' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!config.notify_daily_summary) {
          return new Response(
            JSON.stringify({ success: true, message: 'Resumo diário desabilitado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        message = formatDailySummary(stats);
        
        // Send to all active recipients
        for (const phone of phones as string[]) {
          const result = await sendUazapiMessage(config, phone, message);
          results.push({ phone, ...result });
        }
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Ação inválida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const allSuccess = results.every(r => r.success);
    
    return new Response(
      JSON.stringify({ 
        success: allSuccess, 
        results,
        message: allSuccess ? 'Mensagens enviadas com sucesso' : 'Algumas mensagens falharam'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorObj = error as Error;
    console.error('Sentinel WhatsApp Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorObj.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
