import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  appointment_id?: string;
  type: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule';
  channels?: ('email' | 'whatsapp')[];
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const data: NotificationRequest = await req.json();
    const channels = data.channels || ['email', 'whatsapp'];
    const results: { channel: string; success: boolean; error?: string }[] = [];

    // If specific appointment_id, send for that appointment
    // Otherwise, send reminders for upcoming appointments
    let appointments: any[] = [];

    if (data.appointment_id) {
      const { data: apt } = await supabaseAdmin
        .from("portal_appointments")
        .select(`
          *,
          patient:portal_patients!inner(
            id,
            portal_user:portal_users!inner(
              email,
              full_name,
              phone
            )
          ),
          doctor:neoteam_doctors(
            full_name
          )
        `)
        .eq("id", data.appointment_id)
        .single();
      
      if (apt) appointments = [apt];
    } else if (data.type === 'reminder') {
      // Get appointments for tomorrow that haven't been reminded
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const { data: apts } = await supabaseAdmin
        .from("portal_appointments")
        .select(`
          *,
          patient:portal_patients!inner(
            id,
            portal_user:portal_users!inner(
              email,
              full_name,
              phone
            )
          ),
          doctor:neoteam_doctors(
            full_name
          )
        `)
        .gte("scheduled_at", tomorrow.toISOString())
        .lt("scheduled_at", dayAfter.toISOString())
        .is("reminder_sent_at", null)
        .in("status", ["scheduled", "confirmed"]);

      appointments = apts || [];
    }

    // Get WhatsApp credentials from environment
    const whatsappCredentials = getWhatsAppCredentials();

    for (const apt of appointments) {
      const patientEmail = apt.patient?.portal_user?.email;
      const patientName = apt.patient?.portal_user?.full_name || 'Paciente';
      const patientPhone = apt.patient?.portal_user?.phone;
      const doctorName = apt.doctor?.full_name || 'Médico';
      const appointmentDate = new Date(apt.scheduled_at);
      
      const formattedDate = appointmentDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      const formattedTime = appointmentDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const messageTemplates = {
        confirmation: {
          title: 'Agendamento Confirmado',
          message: `Olá ${patientName.split(' ')[0]}! Seu agendamento foi confirmado para ${formattedDate} às ${formattedTime} com ${doctorName}.`
        },
        reminder: {
          title: 'Lembrete de Consulta',
          message: `Olá ${patientName.split(' ')[0]}! Lembramos que sua consulta está agendada para amanhã, ${formattedDate} às ${formattedTime} com ${doctorName}. Confirme sua presença!`
        },
        cancellation: {
          title: 'Agendamento Cancelado',
          message: `Olá ${patientName.split(' ')[0]}. Seu agendamento de ${formattedDate} às ${formattedTime} foi cancelado. Entre em contato para reagendar.`
        },
        reschedule: {
          title: 'Agendamento Remarcado',
          message: `Olá ${patientName.split(' ')[0]}! Seu agendamento foi remarcado para ${formattedDate} às ${formattedTime} com ${doctorName}.`
        }
      };

      const template = messageTemplates[data.type];

      // Send email
      if (channels.includes('email') && patientEmail && resendApiKey) {
        try {
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "NeoCare <noreply@neofolic.com.br>",
              to: [patientEmail],
              subject: `NeoCare - ${template.title}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">NeoCare</h1>
                  </div>
                  <div style="padding: 30px; background: #f9fafb;">
                    <h2 style="color: #1f2937;">${template.title}</h2>
                    <p style="color: #4b5563; font-size: 16px;">${template.message}</p>
                    
                    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                      <p style="margin: 5px 0;"><strong>📅 Data:</strong> ${formattedDate}</p>
                      <p style="margin: 5px 0;"><strong>⏰ Horário:</strong> ${formattedTime}</p>
                      <p style="margin: 5px 0;"><strong>👨‍⚕️ Profissional:</strong> ${doctorName}</p>
                      <p style="margin: 5px 0;"><strong>📋 Tipo:</strong> ${apt.appointment_type}</p>
                    </div>
                    
                    <a href="https://transplant-insight-hub.lovable.app/neocare/appointments" 
                       style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 10px;">
                      Ver Meus Agendamentos
                    </a>
                  </div>
                </div>
              `,
            }),
          });

          results.push({ 
            channel: 'email', 
            success: emailResponse.ok,
            error: emailResponse.ok ? undefined : await emailResponse.text()
          });
        } catch (e) {
          results.push({ channel: 'email', success: false, error: String(e) });
        }
      }

      // Send WhatsApp using environment credentials
      if (channels.includes('whatsapp') && patientPhone && whatsappCredentials) {
        try {
          const normalizedPhone = patientPhone.replace(/\D/g, '');
          const fullPhone = normalizedPhone.startsWith('55') ? normalizedPhone : `55${normalizedPhone}`;

          const whatsappResponse = await fetch(`${whatsappCredentials.instanceUrl}/message/sendText`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${whatsappCredentials.apiToken}`,
            },
            body: JSON.stringify({
              number: fullPhone,
              text: `*${template.title}* 🏥\n\n${template.message}\n\n📅 ${formattedDate}\n⏰ ${formattedTime}\n👨‍⚕️ ${doctorName}\n\nAcesse: https://transplant-insight-hub.lovable.app/neocare`,
            }),
          });

          results.push({ 
            channel: 'whatsapp', 
            success: whatsappResponse.ok,
            error: whatsappResponse.ok ? undefined : await whatsappResponse.text()
          });
        } catch (e) {
          results.push({ channel: 'whatsapp', success: false, error: String(e) });
        }
      }

      // Create notification record
      await supabaseAdmin
        .from("patient_notifications")
        .insert({
          patient_id: apt.patient.id,
          type: data.type === 'reminder' ? 'appointment_reminder' : 'appointment_confirmation',
          channel: channels.join(','),
          title: template.title,
          message: template.message,
          status: results.some(r => r.success) ? 'sent' : 'failed',
          sent_at: new Date().toISOString(),
          metadata: { appointment_id: apt.id, results }
        });

      // Update appointment reminder_sent_at
      if (data.type === 'reminder') {
        await supabaseAdmin
          .from("portal_appointments")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", apt.id);
      }

      // Update confirmed_at for confirmations
      if (data.type === 'confirmation') {
        await supabaseAdmin
          .from("portal_appointments")
          .update({ confirmed_at: new Date().toISOString() })
          .eq("id", apt.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        appointments_processed: appointments.length,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
