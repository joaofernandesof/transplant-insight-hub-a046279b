import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserToCreate {
  email: string;
  password: string;
  full_name: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const usersToCreate: UserToCreate[] = [
      { 
        email: "caroline.parahyba@cpgadvocacia.com.br", 
        password: "Cpg2026@",
        full_name: "Dra. Caroline Parahyba"
      },
      { 
        email: "larissa.guerreiro@cpgadvocacia.com.br", 
        password: "Cpg2026@",
        full_name: "Dra. Larissa Guerreiro"
      },
      { 
        email: "isabele.cartaxo@cpgadvocacia.com.br", 
        password: "Cpg2026@",
        full_name: "Isabele Cartaxo"
      },
    ];

    const results = [];

    for (const user of usersToCreate) {
      console.log(`Creating user: ${user.email}`);
      
      // 1. Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.full_name }
      });

      if (authError) {
        console.error(`Error creating auth user ${user.email}:`, authError);
        results.push({ email: user.email, status: "error", error: authError.message });
        continue;
      }

      const userId = authData.user.id;
      console.log(`Auth user created: ${userId}`);

      // 2. Create neohub_users entry
      const { data: neohubUser, error: neohubError } = await supabaseAdmin
        .from("neohub_users")
        .insert({
          user_id: userId,
          email: user.email,
          full_name: user.full_name,
          is_active: true,
        })
        .select()
        .single();

      if (neohubError) {
        console.error(`Error creating neohub_user for ${user.email}:`, neohubError);
        results.push({ email: user.email, status: "partial", error: neohubError.message });
        continue;
      }

      console.log(`NeoHub user created: ${neohubUser.id}`);

      // 3. Assign IPROMED profile (using 'ipromed' profile enum value)
      // First, check if there's an 'ipromed' value in the enum, otherwise use a suitable one
      const { error: profileError } = await supabaseAdmin
        .from("neohub_user_profiles")
        .insert({
          neohub_user_id: neohubUser.id,
          profile: "ipromed",
          is_active: true,
        });

      if (profileError) {
        console.error(`Error assigning profile for ${user.email}:`, profileError);
        // Try with 'licenciado' as fallback if 'ipromed' doesn't exist
        const { error: fallbackError } = await supabaseAdmin
          .from("neohub_user_profiles")
          .insert({
            neohub_user_id: neohubUser.id,
            profile: "licenciado",
            is_active: true,
          });
        
        if (fallbackError) {
          results.push({ email: user.email, status: "partial", error: "Profile assignment failed" });
          continue;
        }
      }

      results.push({ email: user.email, status: "success", userId });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
