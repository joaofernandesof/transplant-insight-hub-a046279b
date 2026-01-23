import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StudentData {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  cpf?: string;
  city?: string;
  state?: string;
  course?: string;
  classId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const student: StudentData = await req.json();

    if (!student.email || !student.fullName) {
      return new Response(
        JSON.stringify({ error: "Email and fullName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const password = student.password || "ibramec2026@";
    const email = student.email.toLowerCase().trim();

    console.log(`Creating student: ${student.fullName} (${email})`);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("neohub_users")
      .select("id, user_id")
      .eq("email", email)
      .maybeSingle();

    let userId: string;
    let authUserId: string;

    if (existingUser) {
      console.log("User already exists, using existing record");
      userId = existingUser.id;
      authUserId = existingUser.user_id;
    } else {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: student.fullName },
      });

      if (authError) {
        console.error("Auth error:", authError);
        return new Response(
          JSON.stringify({ error: `Failed to create auth user: ${authError.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      authUserId = authData.user.id;

      // Create neohub_users record
      const { data: newUser, error: userError } = await supabase
        .from("neohub_users")
        .insert({
          user_id: authUserId,
          full_name: student.fullName,
          email,
          phone: student.phone || null,
          cpf: student.cpf || null,
          city: student.city || null,
          state: student.state || null,
          role: "patient",
          is_active: true,
        })
        .select("id")
        .single();

      if (userError) {
        console.error("User insert error:", userError);
        return new Response(
          JSON.stringify({ error: `Failed to create user record: ${userError.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = newUser.id;

      // Assign aluno profile
      const alunoProfileId = "15ff5857-30b9-4862-a646-ffce72c200dc";
      await supabase
        .from("user_profile_assignments")
        .insert({
          user_id: userId,
          profile_id: alunoProfileId,
        });

      console.log(`Created new user: ${userId}`);
    }

    // Enroll in class if provided
    const classId = student.classId || "287a83b9-a329-4f6c-b0c3-5ecc868c27c3"; // Default: Formação 360 Jan 2026
    
    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from("class_enrollments")
      .select("id")
      .eq("user_id", authUserId)
      .eq("class_id", classId)
      .maybeSingle();

    if (!existingEnrollment) {
      const { error: enrollError } = await supabase
        .from("class_enrollments")
        .insert({
          user_id: authUserId,
          class_id: classId,
          status: "enrolled",
        });

      if (enrollError) {
        console.error("Enrollment error:", enrollError);
      } else {
        console.log(`Enrolled in class: ${classId}`);
      }
    } else {
      console.log("Already enrolled in class");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: existingUser ? "User already existed, checked enrollment" : "User created and enrolled successfully",
        userId,
        email,
        password: existingUser ? "(unchanged)" : password,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
