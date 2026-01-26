import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  classId?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { email, password, fullName, classId }: CreateUserRequest = await req.json();

    if (!email || !password || !fullName) {
      throw new Error("Missing required fields: email, password, fullName");
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: fullName },
    });

    if (authError) throw authError;
    const userId = authData.user.id;

    // 2. Create neohub_users entry
    const { data: neohubUser, error: neohubError } = await supabaseAdmin
      .from("neohub_users")
      .insert({
        user_id: userId,
        email,
        full_name: fullName,
        is_active: true,
      })
      .select()
      .single();

    if (neohubError) throw neohubError;

    // 3. Add aluno profile
    const { error: profileError } = await supabaseAdmin
      .from("neohub_user_profiles")
      .insert({
        neohub_user_id: neohubUser.id,
        profile: "aluno",
        is_active: true,
      });

    if (profileError) throw profileError;

    // 4. Enroll in class if provided
    if (classId) {
      const { error: enrollError } = await supabaseAdmin
        .from("class_enrollments")
        .insert({
          class_id: classId,
          user_id: userId,
          status: "confirmed",
        });

      if (enrollError) throw enrollError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId, 
        email,
        message: "User created and enrolled successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
