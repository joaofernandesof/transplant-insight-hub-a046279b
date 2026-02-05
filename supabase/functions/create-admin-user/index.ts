import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { email, password, fullName } = await req.json();
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const userId = authData.user!.id;
  const allPortals = ['avivar','cpg','ibramec','colaborador','paciente','vision','neopay','licenciado','ipromed'];

  await supabaseAdmin.from('neohub_users').insert({ user_id: userId, email, full_name: fullName, is_active: true, allowed_portals: allPortals });
  await supabaseAdmin.from('profiles').upsert({ id: userId, email, name: fullName });

  const { data: nu } = await supabaseAdmin.from('neohub_users').select('id').eq('user_id', userId).single();
  if (nu) {
    const profiles = ['paciente','colaborador','aluno','licenciado','cliente_avivar','medico','ipromed'];
    for (const p of profiles) {
      await supabaseAdmin.from('neohub_user_profiles').insert({ neohub_user_id: nu.id, profile: p, is_active: true });
    }
  }

  return new Response(JSON.stringify({ success: true, userId, email, portals: allPortals }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
