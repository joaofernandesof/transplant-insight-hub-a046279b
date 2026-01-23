import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapping from spreadsheet course names to database course IDs
const COURSE_MAPPING: Record<string, string> = {
  "FORMAÇÃO 360": "173debf6-6d98-4496-9dfb-bd57ec8fc4e3",
  "FORMACAO 360": "173debf6-6d98-4496-9dfb-bd57ec8fc4e3",
  "INSTRUMENTADOR": "951019f8-ffa3-47a6-8849-dd2a6be4a441",
  "FELLOWSHIP": "9b0ba968-3a24-47d2-9244-cb1bdeec316f",
  "LICENÇA": "173debf6-6d98-4496-9dfb-bd57ec8fc4e3",
  "LICENCA": "173debf6-6d98-4496-9dfb-bd57ec8fc4e3",
  "MONITOR": "173debf6-6d98-4496-9dfb-bd57ec8fc4e3",
};

// Default class for each course
const CLASS_MAPPING: Record<string, string> = {
  "173debf6-6d98-4496-9dfb-bd57ec8fc4e3": "287a83b9-a329-4f6c-b0c3-5ecc868c27c3", // Formação 360º - Turma 01/2025
  "951019f8-ffa3-47a6-8849-dd2a6be4a441": "f933cdac-70ff-4140-96cd-aa2108bc8617", // Instrumentador de Elite - Turma 01/2026
  "9b0ba968-3a24-47d2-9244-cb1bdeec316f": "0be2609e-7da5-4c3a-a56e-6b442d04c37f", // Fellowship Avançado - Turma 01/2026
};

// Complete student course data from original spreadsheet
const STUDENT_COURSE_DATA: Record<string, string> = {
  "osmelpompa@yahoo.es": "FORMAÇÃO 360",
  "adaoenzoheitormari@gmail.com": "FORMAÇÃO 360",
  "dratathianabatavia@gmail.com": "FORMAÇÃO 360",
  "ilkagueiros@hotmail.com": "INSTRUMENTADOR",
  "dr.diegoam@gmail.com": "FORMAÇÃO 360",
  "contato@draliviaalana.com.br": "FORMAÇÃO 360",
  "arthur.decker@hotmail.com.br": "FORMAÇÃO 360",
  "sicoracath23@gmail.com": "FORMAÇÃO 360",
  "carlosrissato1@hotmail.com": "FORMAÇÃO 360",
  "frantanquella@gmail.com": "FORMAÇÃO 360",
  "gibranlealvieira@gmail.com": "FORMAÇÃO 360",
  "oncogama23@gmail.com": "FORMAÇÃO 360",
  "admon.monicacruz@gmail.com": "FORMAÇÃO 360",
  "paulob.costaneto@hotmail.com": "FORMAÇÃO 360",
  "mathiasbenitez5@gmail.com": "FORMAÇÃO 360",
  "mari_fkardoso@hotmail.com": "INSTRUMENTADOR",
  "nogueiramonicafabricia@gmail.com": "FORMAÇÃO 360",
  "fematavelli@hotmail.com": "FORMAÇÃO 360",
  "joselio0611@gmail.com": "FORMAÇÃO 360",
  "lablumalopes@gmail.com": "FORMAÇÃO 360",
  "dinizclaudiohenrique@gmail.com": "FELLOWSHIP",
  "gleleao@gmail.com": "LICENÇA",
  "erikaalvescoimbra@gmail.com": "LICENÇA",
  "alisson.jah@hotmail.com": "MONITOR",
  // Instrumentador students
  "samarapperdomo.sp@gmail.com": "INSTRUMENTADOR",
  "elisreginafisio@gmail.com": "INSTRUMENTADOR",
  "maianaoliveira1234@gmail.com": "INSTRUMENTADOR",
  "elanneribeiro91@gmail.com": "INSTRUMENTADOR",
  "ldefono@gmail.com": "INSTRUMENTADOR",
  "vanessamagda2018@gmail.com": "INSTRUMENTADOR",
  "cassialeitemed@gmail.com": "INSTRUMENTADOR",
  "dcarolinags151077@gmail.com": "INSTRUMENTADOR",
  "ludysminarr@hotmail.com": "INSTRUMENTADOR",
  "valeriasousa067@gmail.com": "INSTRUMENTADOR",
  "brunaventura15bv@gmail.com": "INSTRUMENTADOR",
  "thaisescobar5@gmail.com": "INSTRUMENTADOR",
  "danielanogueiragiannini@gmail.com": "INSTRUMENTADOR",
  "sarali.s@hotmail.com": "INSTRUMENTADOR",
  "july7912@icloud.com": "INSTRUMENTADOR",
  "marcelolima.mpl@gmail.com": "INSTRUMENTADOR",
  "samuel.matheus.levi@hotmail.com": "INSTRUMENTADOR",
  "grazianyribeiro3@gmail.com": "INSTRUMENTADOR",
  "michek_19@yahoo.com.br": "INSTRUMENTADOR",
  "kimberly_estetica@outlook.com": "INSTRUMENTADOR",
  "edneiagasparfonseca@gmail.com": "INSTRUMENTADOR",
  "ilkabetania@yahoo.com.br": "INSTRUMENTADOR",
  // Formação 360 students
  "drrobertoqvida@gmail.com": "FORMAÇÃO 360",
  "dr.pablocirurgia@gmail.com": "FORMAÇÃO 360",
  "elo7galvo@gmail.com": "FORMAÇÃO 360",
  "wesleymed11@outlook.com": "FORMAÇÃO 360",
  "gestaorobertopinheiro@gmail.com": "FORMAÇÃO 360",
  "naborplaza@hotmail.com": "FORMAÇÃO 360",
  "milena.braga@soufunorte.com.br": "FORMAÇÃO 360",
  "pachecolaurindo@hotmail.com": "FORMAÇÃO 360",
  "eduardoanchieta1@hotmail.com": "FORMAÇÃO 360",
  "isabelamirbas@yahoo.com.br": "FORMAÇÃO 360",
  "dr.eleniltonpinheiro@gmail.com": "FORMAÇÃO 360",
  "henriquepdiogo@hotmail.com": "FORMAÇÃO 360",
  "jessica_s_silva@hotmail.com": "FORMAÇÃO 360",
  "drmacyoidemberg@gmail.com": "FORMAÇÃO 360",
  "dradeliaalmeida@icloud.com": "FORMAÇÃO 360",
  "valcantud@gmail.com": "FORMAÇÃO 360",
  "mizianyjadna@gmail.com": "FORMAÇÃO 360",
  "ricardospfc_1@hormail.com": "FORMAÇÃO 360",
  "martha.guayanes@gmail.com": "FORMAÇÃO 360",
  "ricomendescarneiro@hotmail.com": "FORMAÇÃO 360",
  "claysonpsantos@gmail.com": "FORMAÇÃO 360",
  "drjoaohlemes@gmail.com": "FORMAÇÃO 360",
  "denildo2005@hotmail.com": "FORMAÇÃO 360",
  "juli_roos@yahoo.com.br": "FORMAÇÃO 360",
  "manuelchicote00@hotmail.com": "FORMAÇÃO 360",
  "lima.brenda06@hotmail.com": "FORMAÇÃO 360",
  "patrickdasilvapenaforte@gmail.com": "FORMAÇÃO 360",
  "napoleaoraposo10@gmail.com": "FORMAÇÃO 360",
  "erickbaldy@gmail.com": "FORMAÇÃO 360",
  "elvisbaldiviezoplaza@gmail.com": "FORMAÇÃO 360",
  "liviablatavanha@gmail.com": "FORMAÇÃO 360",
  "celsogomesc@gmail.com": "FORMAÇÃO 360",
  "henriquecs721@hotmail.com": "FORMAÇÃO 360",
  "ronzella08@gmail.com": "FORMAÇÃO 360",
  "glediatorocha@gmail.com": "FORMAÇÃO 360",
  "celcilene_ms@hotmail.com": "FORMAÇÃO 360",
  "maxdelilo@hotmail.com": "FORMAÇÃO 360",
  "drmaxwellpereira@gmail.com": "FORMAÇÃO 360",
  "maxmiller_fm@hotmail.com": "FORMAÇÃO 360",
  "rubiaaranha@hotmail.com": "FORMAÇÃO 360",
  "amandacb22@hotmail.com.br": "FORMAÇÃO 360",
  "assisf-12@hotmail.com": "FORMAÇÃO 360",
  "herculesdacruz@hotmail.com": "FORMAÇÃO 360",
  "debora.bessa.med@gmail.com": "FORMAÇÃO 360",
  "dr.rafaelalmeida21@gmail.com": "FORMAÇÃO 360",
  "drosmelppompa@gmail.com": "FORMAÇÃO 360",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const results: { email: string; name: string; status: string; course?: string; classId?: string; error?: string }[] = [];
    let enrolled = 0;
    let skipped = 0;
    let errors = 0;
    let noData = 0;

    // Fetch all students with 'aluno' profile
    const { data: students, error: studentsError } = await supabaseAdmin
      .from("neohub_users")
      .select(`
        id,
        user_id,
        email,
        full_name,
        neohub_user_profiles!inner (
          profile
        )
      `)
      .eq("neohub_user_profiles.profile", "aluno");

    if (studentsError) throw studentsError;

    // Get existing enrollments to avoid duplicates
    const { data: existingEnrollments } = await supabaseAdmin
      .from("class_enrollments")
      .select("user_id, class_id");

    const enrolledSet = new Set(
      (existingEnrollments || []).map(e => `${e.user_id}:${e.class_id}`)
    );

    console.log(`Processing ${students?.length || 0} students with 'aluno' profile`);

    // Process each student
    for (const student of (students || [])) {
      const email = (student.email || "").toLowerCase().trim();
      const userId = student.user_id;
      const fullName = student.full_name || email;

      // Look up course from spreadsheet data
      const courseName = STUDENT_COURSE_DATA[email];
      
      if (!courseName) {
        // Default to Formação 360 if no specific course data
        const defaultCourseId = "173debf6-6d98-4496-9dfb-bd57ec8fc4e3";
        const defaultClassId = CLASS_MAPPING[defaultCourseId];
        
        if (enrolledSet.has(`${userId}:${defaultClassId}`)) {
          results.push({ email, name: fullName, status: "skipped", error: "Já matriculado" });
          skipped++;
          continue;
        }

        const { error: enrollError } = await supabaseAdmin
          .from("class_enrollments")
          .insert({
            user_id: userId,
            class_id: defaultClassId,
            status: "enrolled",
            enrolled_at: new Date().toISOString()
          });

        if (enrollError) {
          results.push({ email, name: fullName, status: "error", error: enrollError.message });
          errors++;
        } else {
          results.push({ email, name: fullName, status: "enrolled", course: "FORMAÇÃO 360 (padrão)", classId: defaultClassId });
          enrolledSet.add(`${userId}:${defaultClassId}`);
          enrolled++;
        }
        continue;
      }

      // Get course ID from mapping
      const courseId = COURSE_MAPPING[courseName.toUpperCase()];
      if (!courseId) {
        results.push({ email, name: fullName, status: "error", error: `Curso não mapeado: ${courseName}` });
        errors++;
        continue;
      }

      // Get class ID from mapping
      const classId = CLASS_MAPPING[courseId];
      if (!classId) {
        results.push({ email, name: fullName, status: "error", error: `Turma não encontrada` });
        errors++;
        continue;
      }

      // Check if already enrolled
      if (enrolledSet.has(`${userId}:${classId}`)) {
        results.push({ email, name: fullName, status: "skipped", error: "Já matriculado nesta turma" });
        skipped++;
        continue;
      }

      // Create enrollment
      const { error: enrollError } = await supabaseAdmin
        .from("class_enrollments")
        .insert({
          user_id: userId,
          class_id: classId,
          status: "enrolled",
          enrolled_at: new Date().toISOString()
        });

      if (enrollError) {
        results.push({ email, name: fullName, status: "error", error: enrollError.message });
        errors++;
      } else {
        results.push({ email, name: fullName, status: "enrolled", course: courseName, classId });
        enrolledSet.add(`${userId}:${classId}`);
        enrolled++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: students?.length || 0,
          enrolled,
          skipped,
          errors,
          noData
        },
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in bulk enrollment:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
