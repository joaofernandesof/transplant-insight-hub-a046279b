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

// Get WhatsApp credentials from environment variables
function getWhatsAppCredentials(): { instanceUrl: string; apiToken: string } | null {
  const instanceUrl = Deno.env.get("WHATSAPP_INSTANCE_URL");
  const apiToken = Deno.env.get("WHATSAPP_API_TOKEN");
  
  if (!instanceUrl || !apiToken) {
    return null;
  }
  
  return { instanceUrl, apiToken };
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

    // Get WhatsApp credentials from environment variables
    const credentials = getWhatsAppCredentials();
    
    if (!credentials) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'WhatsApp não configurado. Configure WHATSAPP_INSTANCE_URL e WHATSAPP_API_TOKEN nas variáveis de ambiente.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send message
    const message = formatPatientCalledMessage(body);
    const result = await sendWhatsAppMessage(
      credentials.instanceUrl,
      credentials.apiToken,
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
