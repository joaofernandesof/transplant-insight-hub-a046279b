import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyPatientRequest {
  patient_name: string;
  patient_phone: string;
  room?: string;
  branch?: string;
  doctor_name?: string;
}

// Send WhatsApp message via Uazapi
async function sendWhatsAppMessage(
  instanceUrl: string,
  apiToken: string,
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Clean phone number - keep only digits
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Ensure Brazilian format (add 55 if not present)
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const response = await fetch(`${instanceUrl}/message/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        number: formattedPhone,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Uazapi error:', errorText);
      return { success: false, error: errorText };
    }

    return { success: true };
  } catch (error: unknown) {
    const errorObj = error as Error;
    console.error('WhatsApp send error:', errorObj);
    return { success: false, error: errorObj.message };
  }
}

// Format the patient called message
function formatPatientCalledMessage(data: NotifyPatientRequest): string {
  let message = `✅ *Olá ${data.patient_name}!*\n\n`;
  message += `Você foi chamado(a) para atendimento`;
  
  if (data.room) {
    message += ` na *${data.room}*`;
  }
  
  message += '.\n\n';
  
  if (data.doctor_name) {
    message += `👨‍⚕️ Médico(a): *${data.doctor_name}*\n`;
  }
  
  if (data.branch) {
    message += `📍 Unidade: *${data.branch}*\n`;
  }
  
  message += '\nPor favor, dirija-se ao local indicado.\n\n';
  message += '_Mensagem automática - NeoTeam_';
  
  return message;
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

    const body: NotifyPatientRequest = await req.json();

    // Validate required fields
    if (!body.patient_name || !body.patient_phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome e telefone do paciente são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get WhatsApp configuration from sentinel_whatsapp_config
    // This reuses the existing WhatsApp configuration from System Sentinel
    const { data: config, error: configError } = await supabase
      .from('sentinel_whatsapp_config')
      .select('*')
      .limit(1)
      .single();

    if (configError || !config) {
      console.log('No WhatsApp config found, checking for neoteam config...');
      
      // Try to get NeoTeam-specific config if sentinel config doesn't exist
      const { data: neoteamConfig } = await supabase
        .from('neoteam_settings')
        .select('whatsapp_instance_url, whatsapp_api_token')
        .limit(1)
        .single();
        
      if (!neoteamConfig?.whatsapp_instance_url || !neoteamConfig?.whatsapp_api_token) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'WhatsApp não configurado. Configure nas configurações do sistema.' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Use neoteam config
      const message = formatPatientCalledMessage(body);
      const result = await sendWhatsAppMessage(
        neoteamConfig.whatsapp_instance_url,
        neoteamConfig.whatsapp_api_token,
        body.patient_phone,
        message
      );
      
      // Log the notification
      await supabase.from('neoteam_whatsapp_logs').insert([{
        type: 'patient_called',
        patient_name: body.patient_name,
        patient_phone: body.patient_phone,
        message: message,
        success: result.success,
        error: result.error,
      }]);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use sentinel config
    const message = formatPatientCalledMessage(body);
    const result = await sendWhatsAppMessage(
      config.instance_url,
      config.api_token,
      body.patient_phone,
      message
    );

    // Log the notification (ignore errors)
    try {
      await supabase.from('neoteam_whatsapp_logs').insert([{
        type: 'patient_called',
        patient_name: body.patient_name,
        patient_phone: body.patient_phone,
        message: message,
        success: result.success,
        error: result.error,
      }]);
    } catch {
      console.log('Log insert failed');
    }

    return new Response(
      JSON.stringify({
        success: result.success,
        message: result.success ? 'Notificação enviada com sucesso' : 'Falha ao enviar notificação',
        error: result.error,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorObj = error as Error;
    console.error('Notify Patient Called Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorObj.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
