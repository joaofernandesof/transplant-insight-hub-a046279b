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
    // Validate JWT
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

    // Check if caller is admin
    const { data: isAdmin } = await supabaseAuth.rpc("is_neohub_admin", { _user_id: callerUserId });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden - admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, fullName } = await req.json();

    if (!email || !password || !fullName) {
      return new Response(JSON.stringify({ error: "email, password and fullName are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    return new Response(JSON.stringify({ success: true, userId, email, portals: allPortals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
