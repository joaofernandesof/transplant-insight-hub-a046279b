import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatePatientRequest {
  email?: string;
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
    // Validate JWT and admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = claims.claims.sub as string;

    // Allow admins OR any active NeoTeam member to create patients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: isAdmin } = await supabaseAuth.rpc("is_neohub_admin", { _user_id: callerUserId });
    
    // Check if user is a NeoTeam member
    const { data: isNeoteamMember } = await supabaseAdmin
      .from("neoteam_team_members")
      .select("id")
      .eq("user_id", callerUserId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!isAdmin && !isNeoteamMember) {
      return new Response(JSON.stringify({ error: "Forbidden - sem permissão para cadastrar pacientes" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const data: CreatePatientRequest = await req.json();
    
    if (!data.full_name || !data.phone) {
      return new Response(
        JSON.stringify({ error: "Nome e telefone são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let userId: string | null = null;
    let tempPassword: string | null = null;

    // Only create auth user if email is provided
    if (data.email) {
      // First, try to create the user. If it already exists, fetch by email.
      tempPassword = `Neo${Math.random().toString(36).slice(-6)}!${Math.floor(Math.random() * 100)}`;

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: data.full_name }
      });

      if (authError) {
        if (authError.message?.includes('already been registered') || (authError as any).code === 'email_exists') {
          // User already exists – find them by paginating through listUsers
          tempPassword = null;
          let page = 1;
          let found = false;
          while (!found) {
            const { data: pageData } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
            if (!pageData?.users?.length) break;
            const match = pageData.users.find((u: any) => u.email === data.email);
            if (match) {
              userId = match.id;
              found = true;
            }
            if (pageData.users.length < 1000) break;
            page++;
          }
          if (!found) {
            // Last resort: user exists but we can't find them
            console.error("User exists but could not be found via listUsers for email:", data.email);
          }
        } else {
          throw authError;
        }
      } else {
        userId = authData.user.id;
      }
    }

    let neohubUserId: string | null = null;
    let patientId: string | null = null;

    // Create neohub_user only if we have a userId (email was provided)
    if (userId) {
      // Check if neohub_user already exists
      const { data: existingNeohubUser } = await supabaseAdmin
        .from("neohub_users")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingNeohubUser) {
        neohubUserId = existingNeohubUser.id;
      } else {
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
        neohubUserId = neohubUser.id;

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
      }

      // Check if portal_user already exists
      const { data: existingPortalUser } = await supabaseAdmin
        .from("portal_users")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingPortalUser) {
        // Check if portal_patient exists
        const { data: existingPatient } = await supabaseAdmin
          .from("portal_patients")
          .select("id")
          .eq("portal_user_id", existingPortalUser.id)
          .maybeSingle();
        patientId = existingPatient?.id || null;
      } else {
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
        patientId = patient.id;

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
      }
    }

    // Check if clinic_patients record already exists (by email or CPF)
    const requestData = data as any;
    const clinicNotes: string[] = [];
    if (requestData.branch) clinicNotes.push(`Filial: ${requestData.branch}`);
    if (requestData.category) clinicNotes.push(`Categoria: ${requestData.category}`);
    if (requestData.service_type) clinicNotes.push(`Procedimento: ${requestData.service_type}`);
    if (requestData.seller) clinicNotes.push(`Vendedor: ${requestData.seller}`);
    if (requestData.consultant) clinicNotes.push(`Consultor: ${requestData.consultant}`);
    if (requestData.lead_source) clinicNotes.push(`Fonte: ${requestData.lead_source}`);
    if (requestData.notes) clinicNotes.push(requestData.notes);

    let clinicPatient: any = null;

    // Try to find existing clinic patient by email or CPF
    if (data.email) {
      const { data: existing } = await supabaseAdmin
        .from("clinic_patients")
        .select("*")
        .eq("email", data.email)
        .maybeSingle();
      clinicPatient = existing;
    }
    if (!clinicPatient && data.cpf) {
      const { data: existing } = await supabaseAdmin
        .from("clinic_patients")
        .select("*")
        .eq("cpf", data.cpf)
        .maybeSingle();
      clinicPatient = existing;
    }

    if (!clinicPatient) {
      const { data: newPatient, error: clinicError } = await supabaseAdmin
        .from("clinic_patients")
        .insert({
          full_name: data.full_name,
          email: data.email || null,
          phone: data.phone || null,
          cpf: data.cpf || null,
          notes: clinicNotes.length > 0 ? clinicNotes.join(' | ') : null,
          trichotomy_datetime: (data as any).trichotomy_datetime || null,
          grade: (data as any).grade ?? null,
          created_by: userId,
        })
        .select()
        .single();

      if (clinicError) throw clinicError;
      clinicPatient = newPatient;
    }

    // Send credentials via email if configured and email exists
    if (data.email && tempPassword && resendApiKey && (data.send_credentials_via === 'email' || data.send_credentials_via === 'both')) {
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Paciente cadastrado com sucesso!",
        patient_id: patientId,
        clinic_patient_id: clinicPatient.id,
        neohub_user_id: neohubUserId,
        credentials_sent: data.email ? (data.send_credentials_via || 'none') : 'none'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
