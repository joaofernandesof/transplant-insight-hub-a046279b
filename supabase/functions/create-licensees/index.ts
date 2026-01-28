import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_PASSWORD = "Licenciado2026!";

const LICENSEES = [
  { email: "gleyldes.leao@licenciado.neofolic.com", full_name: "Gleyldes Leão" },
  { email: "erika.coimbra@licenciado.neofolic.com", full_name: "Erika Alves Coimbra" },
  { email: "jean.romao@licenciado.neofolic.com", full_name: "Jean Carlos Romão de Sousa" },
  { email: "ana.pierazo@licenciado.neofolic.com", full_name: "Ana Flávia Pierazo Rodrigues" },
  { email: "eder.eiji@licenciado.neofolic.com", full_name: "Eder Eiji e Ednéia Gaspar" },
  { email: "regia.reis@licenciado.neofolic.com", full_name: "Regia Débora Cardoso da Silva Reis" },
  { email: "robister.oliveira@licenciado.neofolic.com", full_name: "Robister Moreno de Oliveira Mac Cornick" },
  { email: "paulo.neto@licenciado.neofolic.com", full_name: "Paulo Batista da Costa Neto" },
  { email: "joselio.sousa@licenciado.neofolic.com", full_name: "Joselio Alves Sousa" },
  { email: "livia.gomes@licenciado.neofolic.com", full_name: "Livia Alana Silva de Souza Gomes" },
  { email: "cintia.andrade@licenciado.neofolic.com", full_name: "Cintia de Andrade" },
  { email: "flavio.felipe@licenciado.neofolic.com", full_name: "Flávio Henrique e Felipe Teles Arruda" },
  { email: "andre.valente@licenciado.neofolic.com", full_name: "André Luis Chaves Valente" },
  { email: "marcia.dertkigil@licenciado.neofolic.com", full_name: "Marcia San Juan Dertkigil" },
  { email: "fabio.branaro@licenciado.neofolic.com", full_name: "Fabio Branaro" },
  { email: "deibson.lisboa@licenciado.neofolic.com", full_name: "Deibson Santos Lisboa" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const results = [];
    const errors = [];

    for (const licensee of LICENSEES) {
      try {
        // Check if user already exists in auth.users
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === licensee.email);

        let authUserId: string;

        if (existingUser) {
          console.log(`User ${licensee.email} already exists, skipping auth creation`);
          authUserId = existingUser.id;
        } else {
          // Create user in auth.users
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: licensee.email,
            password: DEFAULT_PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: licensee.full_name }
          });

          if (authError) {
            errors.push({ email: licensee.email, error: authError.message, step: 'auth' });
            continue;
          }

          authUserId = authData.user.id;
          console.log(`Created auth user for ${licensee.email}: ${authUserId}`);
        }

        // Check if neohub_users record exists
        const { data: existingNeoHub } = await supabaseAdmin
          .from('neohub_users')
          .select('id')
          .eq('user_id', authUserId)
          .single();

        let neoHubUserId: string;

        if (existingNeoHub) {
          neoHubUserId = existingNeoHub.id;
          console.log(`NeoHub user exists for ${licensee.email}`);
        } else {
          // Create neohub_users record
          const { data: neoHubData, error: neoHubError } = await supabaseAdmin
            .from('neohub_users')
            .insert({
              user_id: authUserId,
              email: licensee.email,
              full_name: licensee.full_name,
              is_active: true,
            })
            .select()
            .single();

          if (neoHubError) {
            errors.push({ email: licensee.email, error: neoHubError.message, step: 'neohub_users' });
            continue;
          }

          neoHubUserId = neoHubData.id;
          console.log(`Created NeoHub user for ${licensee.email}: ${neoHubUserId}`);
        }

        // Check if profile already exists
        const { data: existingProfile } = await supabaseAdmin
          .from('neohub_user_profiles')
          .select('id')
          .eq('neohub_user_id', neoHubUserId)
          .eq('profile', 'licenciado')
          .single();

        if (!existingProfile) {
          // Create licenciado profile
          const { error: profileError } = await supabaseAdmin
            .from('neohub_user_profiles')
            .insert({
              neohub_user_id: neoHubUserId,
              profile: 'licenciado',
              is_active: true,
            });

          if (profileError) {
            errors.push({ email: licensee.email, error: profileError.message, step: 'profile' });
            continue;
          }

          console.log(`Created licenciado profile for ${licensee.email}`);
        }

        results.push({
          email: licensee.email,
          full_name: licensee.full_name,
          password: DEFAULT_PASSWORD,
          status: 'success'
        });

      } catch (err) {
        errors.push({ email: licensee.email, error: String(err), step: 'unknown' });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        created: results.length,
        errors: errors.length,
        results,
        errors_detail: errors,
        default_password: DEFAULT_PASSWORD
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
