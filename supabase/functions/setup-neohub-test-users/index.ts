import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestUser {
  email: string;
  password: string;
  fullName: string;
  profile: "paciente" | "colaborador" | "aluno" | "licenciado";
  phone?: string;
}

const testUsers: TestUser[] = [
  {
    email: "paciente@neofolic.com.br",
    password: "Paciente123@",
    fullName: "Maria Paciente",
    profile: "paciente",
    phone: "(11) 99999-1111"
  },
  {
    email: "colaborador@neofolic.com.br",
    password: "Colaborador123@",
    fullName: "João Colaborador",
    profile: "colaborador",
    phone: "(11) 99999-2222"
  },
  {
    email: "aluno@ibramec.com",
    password: "Aluno123@",
    fullName: "Ana Aluna",
    profile: "aluno",
    phone: "(11) 99999-3333"
  },
  {
    email: "licenciado@neofolic.com.br",
    password: "Licenciado123@",
    fullName: "Dr. Pedro Licenciado",
    profile: "licenciado",
    phone: "(11) 99999-4444"
  }
];

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

    const results: { email: string; status: string; message: string }[] = [];

    for (const user of testUsers) {
      try {
        // Try to create auth user
        let userId: string;
        
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: user.fullName }
        });

        if (authError) {
          if (authError.message.includes("already been registered")) {
            // Get existing user
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = existingUsers?.users?.find(u => u.email === user.email);
            
            if (!existingUser) {
              results.push({ email: user.email, status: "error", message: "User exists but not found" });
              continue;
            }
            
            userId = existingUser.id;
            
            // Update password
            await supabaseAdmin.auth.admin.updateUserById(userId, { password: user.password });
          } else {
            throw authError;
          }
        } else {
          userId = authData.user.id;
        }

        // Check if neohub_user exists
        const { data: existingNeoUser } = await supabaseAdmin
          .from("neohub_users")
          .select("id")
          .eq("user_id", userId)
          .single();

        let neoUserId: string;

        if (existingNeoUser) {
          neoUserId = existingNeoUser.id;
          
          // Update user info
          await supabaseAdmin
            .from("neohub_users")
            .update({
              full_name: user.fullName,
              phone: user.phone,
              is_active: true
            })
            .eq("id", neoUserId);
        } else {
          // Create neohub_user
          const { data: newNeoUser, error: neoUserError } = await supabaseAdmin
            .from("neohub_users")
            .insert({
              user_id: userId,
              email: user.email,
              full_name: user.fullName,
              phone: user.phone,
              is_active: true
            })
            .select()
            .single();

          if (neoUserError) throw neoUserError;
          neoUserId = newNeoUser.id;
        }

        // Check if profile exists
        const { data: existingProfile } = await supabaseAdmin
          .from("neohub_user_profiles")
          .select("id")
          .eq("neohub_user_id", neoUserId)
          .eq("profile", user.profile)
          .single();

        if (!existingProfile) {
          // Create profile
          const { error: profileError } = await supabaseAdmin
            .from("neohub_user_profiles")
            .insert({
              neohub_user_id: neoUserId,
              profile: user.profile,
              is_active: true
            });

          if (profileError) throw profileError;
        } else {
          // Ensure profile is active
          await supabaseAdmin
            .from("neohub_user_profiles")
            .update({ is_active: true })
            .eq("id", existingProfile.id);
        }

        results.push({ 
          email: user.email, 
          status: "success", 
          message: `Profile ${user.profile} configured` 
        });

      } catch (userError) {
        const errorMessage = userError instanceof Error ? userError.message : "Unknown error";
        results.push({ email: user.email, status: "error", message: errorMessage });
      }
    }

    const credentials = testUsers.map(u => ({
      perfil: u.profile.charAt(0).toUpperCase() + u.profile.slice(1),
      email: u.email,
      senha: u.password,
      portal: u.profile === "paciente" ? "NeoCare (/neocare)" :
              u.profile === "colaborador" ? "NeoTeam (/neoteam)" :
              u.profile === "aluno" ? "Academy (/academy)" :
              "NeoLicense (/neolicense)"
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Usuários de teste configurados!",
        results,
        credentials
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
