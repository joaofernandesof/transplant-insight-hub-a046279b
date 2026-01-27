import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MobileTestUser {
  email: string;
  password: string;
  fullName: string;
  profile: "aluno";
  description: string;
}

// Usuários de teste específicos para submissão às lojas
const mobileTestUsers: MobileTestUser[] = [
  {
    email: "appstore.reviewer@neofolic.com.br",
    password: "ReviewerApp2026!",
    fullName: "Apple Reviewer",
    profile: "aluno",
    description: "Conta de teste para revisão da App Store"
  },
  {
    email: "playstore.reviewer@neofolic.com.br",
    password: "ReviewerPlay2026!",
    fullName: "Google Reviewer",
    profile: "aluno",
    description: "Conta de teste para revisão do Google Play"
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

    const results: { email: string; status: string; message: string; credentials?: object }[] = [];

    for (const user of mobileTestUsers) {
      try {
        let userId: string;
        
        // Tentar criar usuário no Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { 
            full_name: user.fullName,
            is_mobile_test_user: true
          }
        });

        if (authError) {
          if (authError.message.includes("already been registered")) {
            // Usuário já existe - atualizar senha
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = existingUsers?.users?.find(u => u.email === user.email);
            
            if (!existingUser) {
              results.push({ 
                email: user.email, 
                status: "error", 
                message: "Usuário existe mas não foi encontrado" 
              });
              continue;
            }
            
            userId = existingUser.id;
            
            // Resetar senha para garantir acesso
            await supabaseAdmin.auth.admin.updateUserById(userId, { 
              password: user.password,
              email_confirm: true
            });
          } else {
            throw authError;
          }
        } else {
          userId = authData.user.id;
        }

        // Verificar/criar neohub_user
        const { data: existingNeoUser } = await supabaseAdmin
          .from("neohub_users")
          .select("id")
          .eq("user_id", userId)
          .single();

        let neoUserId: string;

        if (existingNeoUser) {
          neoUserId = existingNeoUser.id;
          
          // Atualizar dados
          await supabaseAdmin
            .from("neohub_users")
            .update({
              full_name: user.fullName,
              is_active: true
            })
            .eq("id", neoUserId);
        } else {
          // Criar neohub_user
          const { data: newNeoUser, error: neoUserError } = await supabaseAdmin
            .from("neohub_users")
            .insert({
              user_id: userId,
              email: user.email,
              full_name: user.fullName,
              is_active: true
            })
            .select()
            .single();

          if (neoUserError) throw neoUserError;
          neoUserId = newNeoUser.id;
        }

        // Verificar/criar perfil (aluno)
        const { data: existingProfile } = await supabaseAdmin
          .from("neohub_user_profiles")
          .select("id")
          .eq("neohub_user_id", neoUserId)
          .eq("profile", user.profile)
          .single();

        if (!existingProfile) {
          const { error: profileError } = await supabaseAdmin
            .from("neohub_user_profiles")
            .insert({
              neohub_user_id: neoUserId,
              profile: user.profile,
              is_active: true
            });

          if (profileError) throw profileError;
        } else {
          // Garantir que está ativo
          await supabaseAdmin
            .from("neohub_user_profiles")
            .update({ is_active: true })
            .eq("id", existingProfile.id);
        }

        // Criar uma matrícula de teste em alguma turma (se existir)
        const { data: testClass } = await supabaseAdmin
          .from("course_classes")
          .select("id")
          .eq("status", "active")
          .limit(1)
          .single();

        if (testClass) {
          const { error: enrollError } = await supabaseAdmin
            .from("class_enrollments")
            .upsert({
              user_id: userId,
              class_id: testClass.id,
              status: "active"
            }, {
              onConflict: "user_id,class_id"
            });
          
          if (enrollError) {
            console.log("Enrollment error (non-critical):", enrollError);
          }
        }

        results.push({ 
          email: user.email, 
          status: "success", 
          message: user.description,
          credentials: {
            email: user.email,
            password: user.password,
            portal: "Academy (/academy)",
            accessibleModules: ["Cursos", "Materiais", "Provas", "Certificados", "Perfil"]
          }
        });

      } catch (userError) {
        const errorMessage = userError instanceof Error ? userError.message : "Erro desconhecido";
        results.push({ 
          email: user.email, 
          status: "error", 
          message: errorMessage 
        });
      }
    }

    // Sumário para submissão às lojas
    const storeSubmissionInfo = {
      appStore: {
        email: mobileTestUsers[0].email,
        password: mobileTestUsers[0].password,
        instructions: "Faça login e navegue pelo módulo Academy para testar cursos e materiais."
      },
      playStore: {
        email: mobileTestUsers[1].email,
        password: mobileTestUsers[1].password,
        instructions: "Faça login e navegue pelo módulo Academy para testar cursos e materiais."
      }
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Usuários de teste mobile configurados!",
        results,
        storeSubmissionInfo,
        notes: [
          "Estes usuários têm acesso apenas ao módulo Academy",
          "Módulos sensíveis (NeoCare, NeoTeam, Prontuário) estão bloqueados",
          "Use estas credenciais no formulário de submissão das lojas"
        ]
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
