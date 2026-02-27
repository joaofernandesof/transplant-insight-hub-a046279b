import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MobileTestUser {
  email: string;
  password: string;
  fullName: string;
  profile: "aluno" | "licenciado";
  description: string;
}

// Usuários de teste específicos para submissão às lojas
const mobileTestUsers: MobileTestUser[] = [
  {
    email: "appstore.reviewer@neofolic.com.br",
    password: "ReviewerApp2026!",
    fullName: "Apple Reviewer",
    profile: "aluno",
    description: "Conta de teste para revisão da App Store (Academy)"
  },
  {
    email: "playstore.reviewer@neofolic.com.br",
    password: "ReviewerPlay2026!",
    fullName: "Google Reviewer",
    profile: "aluno",
    description: "Conta de teste para revisão do Google Play (Academy)"
  },
  {
    email: "appstore.reviewer.licensee@neofolic.com.br",
    password: "ReviewerLicensee2026!",
    fullName: "Store Reviewer Licensee",
    profile: "licenciado",
    description: "Conta de teste para revisão das lojas (HotLeads)"
  }
];

async function createOrUpdateUser(supabaseAdmin: any, user: MobileTestUser) {
  let userId: string;

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
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find((u: any) => u.email === user.email);
      if (!existingUser) throw new Error("Usuário existe mas não foi encontrado");
      userId = existingUser.id;
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

  return userId;
}

async function ensureNeoHubUser(supabaseAdmin: any, userId: string, user: MobileTestUser) {
  const { data: existingNeoUser } = await supabaseAdmin
    .from("neohub_users")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existingNeoUser) {
    await supabaseAdmin
      .from("neohub_users")
      .update({ full_name: user.fullName, is_active: true })
      .eq("id", existingNeoUser.id);
    return existingNeoUser.id;
  }

  const { data: newNeoUser, error } = await supabaseAdmin
    .from("neohub_users")
    .insert({ user_id: userId, email: user.email, full_name: user.fullName, is_active: true })
    .select()
    .single();

  if (error) throw error;
  return newNeoUser.id;
}

async function ensureProfile(supabaseAdmin: any, neoUserId: string, profile: string) {
  const { data: existing } = await supabaseAdmin
    .from("neohub_user_profiles")
    .select("id")
    .eq("neohub_user_id", neoUserId)
    .eq("profile", profile)
    .single();

  if (existing) {
    await supabaseAdmin
      .from("neohub_user_profiles")
      .update({ is_active: true })
      .eq("id", existing.id);
    return;
  }

  const { error } = await supabaseAdmin
    .from("neohub_user_profiles")
    .insert({ neohub_user_id: neoUserId, profile, is_active: true });

  if (error) throw error;
}

async function enrollInTestClass(supabaseAdmin: any, userId: string) {
  const { data: testClass } = await supabaseAdmin
    .from("course_classes")
    .select("id")
    .eq("status", "active")
    .limit(1)
    .single();

  if (testClass) {
    await supabaseAdmin
      .from("class_enrollments")
      .upsert(
        { user_id: userId, class_id: testClass.id, status: "active" },
        { onConflict: "user_id,class_id" }
      );
  }
}

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
        const userId = await createOrUpdateUser(supabaseAdmin, user);
        const neoUserId = await ensureNeoHubUser(supabaseAdmin, userId, user);
        await ensureProfile(supabaseAdmin, neoUserId, user.profile);

        // Alunos: matricular em turma de teste
        if (user.profile === "aluno") {
          await enrollInTestClass(supabaseAdmin, userId);
        }

        const accessibleModules = user.profile === "aluno"
          ? ["Cursos", "Materiais", "Provas", "Certificados", "Perfil"]
          : ["HotLeads", "Dashboard Licenciado", "Materiais", "Indicações", "Perfil"];

        results.push({
          email: user.email,
          status: "success",
          message: user.description,
          credentials: {
            email: user.email,
            password: user.password,
            portal: user.profile === "aluno" ? "Academy (/academy)" : "NeoLicense (/neolicense) + HotLeads (/hotleads)",
            accessibleModules
          }
        });
      } catch (userError) {
        const errorMessage = userError instanceof Error ? userError.message : "Erro desconhecido";
        results.push({ email: user.email, status: "error", message: errorMessage });
      }
    }

    const storeSubmissionInfo = {
      appStore: {
        aluno: {
          email: mobileTestUsers[0].email,
          password: mobileTestUsers[0].password,
          instructions: "Faça login e navegue pelo módulo Academy para testar cursos e materiais."
        },
        licenciado: {
          email: mobileTestUsers[2].email,
          password: mobileTestUsers[2].password,
          instructions: "Faça login, acesse NeoLicense e navegue pelo HotLeads para visualizar leads e dashboard."
        }
      },
      playStore: {
        aluno: {
          email: mobileTestUsers[1].email,
          password: mobileTestUsers[1].password,
          instructions: "Faça login e navegue pelo módulo Academy para testar cursos e materiais."
        },
        licenciado: {
          email: mobileTestUsers[2].email,
          password: mobileTestUsers[2].password,
          instructions: "Faça login, acesse NeoLicense e navegue pelo HotLeads para visualizar leads e dashboard."
        }
      }
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "Usuários de teste mobile configurados!",
        results,
        storeSubmissionInfo,
        notes: [
          "Usuários 'aluno' têm acesso ao módulo Academy",
          "Usuário 'licenciado' tem acesso ao NeoLicense e HotLeads",
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
