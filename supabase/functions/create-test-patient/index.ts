import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: "paciente@teste.com",
      password: "Paciente123!",
      email_confirm: true,
      user_metadata: { full_name: "Paciente Teste" }
    });

    if (authError) {
      // Check if user already exists
      if (authError.message.includes("already been registered")) {
        return new Response(
          JSON.stringify({ success: true, message: "Usuário já existe. Faça login com paciente@teste.com / Paciente123!" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw authError;
    }

    const userId = authData.user.id;

    // Create portal_user
    const { data: portalUser, error: portalUserError } = await supabaseAdmin
      .from("portal_users")
      .insert({
        user_id: userId,
        email: "paciente@teste.com",
        full_name: "Paciente Teste",
        phone: "(11) 99999-0000",
        cpf: "123.456.789-00"
      })
      .select()
      .single();

    if (portalUserError) throw portalUserError;

    // Create portal_patient
    const { error: patientError } = await supabaseAdmin
      .from("portal_patients")
      .insert({
        portal_user_id: portalUser.id,
        blood_type: "O+",
        health_insurance: "Particular"
      });

    if (patientError) throw patientError;

    // Assign patient role
    const { error: roleError } = await supabaseAdmin
      .from("portal_user_roles")
      .insert({
        portal_user_id: portalUser.id,
        role: "patient"
      });

    if (roleError) throw roleError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Conta de paciente criada com sucesso!",
        credentials: {
          email: "paciente@teste.com",
          password: "Paciente123!"
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
