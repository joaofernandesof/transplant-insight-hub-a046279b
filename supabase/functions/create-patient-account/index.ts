import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatePatientRequest {
  email: string;
  full_name: string;
  phone: string;
  cpf?: string;
  birth_date?: string;
  send_credentials_via?: 'email' | 'whatsapp' | 'both';
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

    const data: CreatePatientRequest = await req.json();
    
    if (!data.email || !data.full_name || !data.phone) {
      return new Response(
        JSON.stringify({ error: "Email, nome e telefone são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate temporary password
    const tempPassword = `Neo${Math.random().toString(36).slice(-6)}!${Math.floor(Math.random() * 100)}`;

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: data.full_name }
    });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "Este email já está cadastrado no sistema" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw authError;
    }

    const userId = authData.user.id;

    // Create neohub_user
    const { data: neohubUser, error: neohubUserError } = await supabaseAdmin
      .from("neohub_users")
      .insert({
        user_id: userId,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        cpf: data.cpf,
        birth_date: data.birth_date,
      })
      .select()
      .single();

    if (neohubUserError) throw neohubUserError;

    // Assign patient profile
    const { data: patientProfile } = await supabaseAdmin
      .from("profile_definitions")
      .select("id")
      .eq("key", "paciente")
      .single();

    if (patientProfile) {
      await supabaseAdmin
        .from("user_profile_assignments")
        .insert({
          user_id: neohubUser.id,
          profile_id: patientProfile.id,
          is_active: true
        });
    }

    // Also create portal_user and portal_patient for compatibility
    const { data: portalUser, error: portalUserError } = await supabaseAdmin
      .from("portal_users")
      .insert({
        user_id: userId,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        cpf: data.cpf,
      })
      .select()
      .single();

    if (portalUserError) throw portalUserError;

    const { data: patient, error: patientError } = await supabaseAdmin
      .from("portal_patients")
      .insert({ portal_user_id: portalUser.id })
      .select()
      .single();

    if (patientError) throw patientError;

    // Send credentials via email if configured
    if (resendApiKey && (data.send_credentials_via === 'email' || data.send_credentials_via === 'both')) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "NeoCare <noreply@neofolic.com.br>",
            to: [data.email],
            subject: "Bem-vindo ao NeoCare - Suas Credenciais de Acesso",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0;">NeoCare</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Portal do Paciente</p>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                  <h2 style="color: #1f2937;">Olá, ${data.full_name.split(' ')[0]}!</h2>
                  <p style="color: #4b5563;">Sua conta no portal NeoCare foi criada com sucesso. Use as credenciais abaixo para acessar:</p>
                  
                  <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px;"><strong>Email:</strong> ${data.email}</p>
                    <p style="margin: 0;"><strong>Senha temporária:</strong> ${tempPassword}</p>
                  </div>
                  
                  <p style="color: #ef4444; font-size: 14px;">⚠️ Por segurança, recomendamos que você altere sua senha após o primeiro acesso.</p>
                  
                  <a href="https://transplant-insight-hub.lovable.app/login" 
                     style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px;">
                    Acessar Portal
                  </a>
                </div>
                <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                  <p>Este é um email automático. Não responda.</p>
                </div>
              </div>
            `,
          }),
        });

        if (!emailResponse.ok) {
          console.error("Failed to send email:", await emailResponse.text());
        }
      } catch (emailError) {
        console.error("Email sending error:", emailError);
      }
    }

    // Create welcome notification
    await supabaseAdmin
      .from("patient_notifications")
      .insert({
        patient_id: patient.id,
        type: 'welcome',
        channel: 'email',
        title: 'Bem-vindo ao NeoCare!',
        message: 'Sua conta foi criada com sucesso. Explore o portal para agendar consultas e acessar seus documentos.',
        status: 'sent',
        sent_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Paciente cadastrado com sucesso!",
        patient_id: patient.id,
        neohub_user_id: neohubUser.id,
        credentials_sent: data.send_credentials_via || 'none'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
