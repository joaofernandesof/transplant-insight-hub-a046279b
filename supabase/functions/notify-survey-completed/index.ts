import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  surveyId: string;
  classId: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { surveyId, classId, userId }: NotifyRequest = await req.json();

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get student info
    const { data: student } = await supabase
      .from("neohub_users")
      .select("full_name, email")
      .eq("user_id", userId)
      .single();

    // Get class info
    const { data: classInfo } = await supabase
      .from("course_classes")
      .select("name, code")
      .eq("id", classId)
      .single();

    // Get ALL survey responses
    const { data: survey } = await supabase
      .from("day1_satisfaction_surveys")
      .select("*")
      .eq("id", surveyId)
      .single();

    const studentName = student?.full_name || "Aluno";
    const studentEmail = student?.email || "N/A";
    const className = classInfo?.name || classInfo?.code || "Turma";
    const completedAt = survey?.completed_at 
      ? new Date(survey.completed_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
      : new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    // Determine lead priority based on responses
    const hungerLevel = survey?.q24_hunger_level || "";
    const urgencyLevel = survey?.q25_urgency_level || "";
    
    const isHotLead = hungerLevel.toLowerCase().includes("alta") || 
                      urgencyLevel.toLowerCase().includes("alta");
    
    const priorityBadge = isHotLead 
      ? '<span style="background:#dc2626;color:white;padding:4px 12px;border-radius:4px;font-weight:bold;">🔥 LEAD PRIORITÁRIO</span>'
      : '<span style="background:#059669;color:white;padding:4px 12px;border-radius:4px;">✓ Pesquisa Concluída</span>';

    // Question labels mapping
    const questionLabels: Record<string, string> = {
      q1_satisfaction_level: "Nível de Satisfação Geral",
      q2_first_time_course: "Primeira vez no curso?",
      q3_hygor_expectations: "Hygor - Atendeu expectativas?",
      q4_hygor_clarity: "Hygor - Clareza",
      q5_hygor_time: "Hygor - Tempo adequado?",
      q6_hygor_liked_most: "Hygor - O que mais gostou",
      q7_hygor_improve: "Hygor - O que melhorar",
      q8_patrick_expectations: "Patrick - Atendeu expectativas?",
      q9_patrick_clarity: "Patrick - Clareza",
      q10_patrick_time: "Patrick - Tempo adequado?",
      q11_patrick_liked_most: "Patrick - O que mais gostou",
      q12_patrick_improve: "Patrick - O que melhorar",
      q13_organization: "Organização do evento",
      q14_content_relevance: "Relevância do conteúdo",
      q15_teacher_competence: "Competência dos professores",
      q16_material_quality: "Qualidade do material",
      q17_punctuality: "Pontualidade",
      q18_infrastructure: "Infraestrutura",
      q19_support_team: "Equipe de apoio",
      q20_coffee_break: "Coffee break",
      q21_liked_most_today: "O que mais gostou hoje",
      q22_suggestions: "Sugestões",
      q23_start_preference: "Preferência de horário",
      q24_hunger_level: "Nível de Fome (interesse)",
      q25_urgency_level: "Nível de Urgência",
      q26_investment_level: "Nível de Investimento",
      q27_weekly_time: "Tempo semanal disponível",
      q28_current_reality: "Realidade atual",
      q29_monitor_name: "Nome do monitor acompanhado",
      q30_monitor_technical: "Monitor - Conhecimento técnico",
      q31_monitor_interest: "Monitor - Interesse em ajudar",
      q32_monitor_engagement: "Monitor - Engajamento",
      q33_monitor_posture: "Monitor - Postura profissional",
      q34_monitor_communication: "Monitor - Comunicação",
      q35_monitor_contribution: "Monitor - Contribuição",
      q36_monitor_strength: "Monitor - Ponto forte",
      q37_monitor_improve: "Monitor - O que melhorar",
      q38_eder_technical: "Eder - Conhecimento técnico",
      q39_eder_interest: "Eder - Interesse",
      q40_eder_engagement: "Eder - Engajamento",
      q41_eder_posture: "Eder - Postura",
      q42_eder_communication: "Eder - Comunicação",
      q43_eder_contribution: "Eder - Contribuição",
      q44_eder_strength: "Eder - Ponto forte",
      q45_eder_improve: "Eder - O que melhorar",
      q46_patrick_m_technical: "Patrick M - Conhecimento técnico",
      q47_patrick_m_interest: "Patrick M - Interesse",
      q48_patrick_m_engagement: "Patrick M - Engajamento",
      q49_patrick_m_posture: "Patrick M - Postura",
      q50_patrick_m_communication: "Patrick M - Comunicação",
      q51_patrick_m_contribution: "Patrick M - Contribuição",
      q52_patrick_m_strength: "Patrick M - Ponto forte",
      q53_patrick_m_improve: "Patrick M - O que melhorar",
      q54_eder_m_technical: "Eder M - Conhecimento técnico",
      q55_eder_m_interest: "Eder M - Interesse",
      q56_eder_m_engagement: "Eder M - Engajamento",
      q57_eder_m_posture: "Eder M - Postura",
      q58_eder_m_communication: "Eder M - Comunicação",
      q59_eder_m_contribution: "Eder M - Contribuição",
      q60_eder_m_strength: "Eder M - Ponto forte",
      q61_eder_m_improve: "Eder M - O que melhorar",
      q62_gleyldes_technical: "Gleyldes - Conhecimento técnico",
      q63_gleyldes_interest: "Gleyldes - Interesse",
      q64_gleyldes_engagement: "Gleyldes - Engajamento",
      q65_gleyldes_posture: "Gleyldes - Postura",
      q66_gleyldes_communication: "Gleyldes - Comunicação",
      q67_gleyldes_contribution: "Gleyldes - Contribuição",
      q68_gleyldes_strength: "Gleyldes - Ponto forte",
      q69_gleyldes_improve: "Gleyldes - O que melhorar",
      q70_elenilton_technical: "Elenilton - Conhecimento técnico",
      q71_elenilton_interest: "Elenilton - Interesse",
      q72_elenilton_engagement: "Elenilton - Engajamento",
      q73_elenilton_posture: "Elenilton - Postura",
      q74_elenilton_communication: "Elenilton - Comunicação",
      q75_elenilton_contribution: "Elenilton - Contribuição",
      q76_elenilton_strength: "Elenilton - Ponto forte",
      q77_elenilton_improve: "Elenilton - O que melhorar",
    };

    // Build all questions/answers rows - include ALL fields from survey
    const excludedFields = ['id', 'user_id', 'class_id', 'created_at', 'completed_at', 'is_completed', 'current_section', 'effective_time_seconds'];
    
    const allQuestionsHtml = Object.entries(survey || {})
      .filter(([key, value]) => {
        // Exclude system fields
        if (excludedFields.includes(key)) return false;
        // Exclude null/undefined/empty values
        if (value === null || value === undefined || value === "") return false;
        return true;
      })
      .map(([key, value]) => {
        const label = questionLabels[key] || key.replace(/_/g, ' ').replace(/q\d+/g, '').trim() || key;
        const displayValue = typeof value === "boolean" ? (value ? "Sim" : "Não") : String(value);
        return `
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 45%; vertical-align: top;">${label}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${displayValue}</td>
          </tr>
        `;
      })
      .join("");
    
    // Fallback message if no responses
    const responsesSection = allQuestionsHtml 
      ? allQuestionsHtml 
      : '<tr><td colspan="2" style="padding: 20px; text-align: center; color: #6b7280;">Nenhuma resposta registrada</td></tr>';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📋 Nova Pesquisa Respondida</h1>
          </div>
          
          <div style="padding: 24px;">
            <div style="margin-bottom: 20px; text-align: center;">
              ${priorityBadge}
            </div>
            
            <!-- Header Info -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #f9fafb; border-radius: 8px;">
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 140px;">Aluno:</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${studentName}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">E-mail:</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${studentEmail}" style="color: #059669;">${studentEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Turma:</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${className}</td>
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: bold;">Concluído em:</td>
                <td style="padding: 12px;">${completedAt}</td>
              </tr>
            </table>

            <!-- All Questions and Answers -->
            <h2 style="font-size: 18px; color: #059669; margin: 24px 0 16px; border-bottom: 2px solid #059669; padding-bottom: 8px;">📝 Respostas Completas</h2>
            <table style="width: 100%; border-collapse: collapse;">
              ${responsesSection}
            </table>
          </div>
          
          <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #6b7280;">
            IBRAMEC - Sistema de Pesquisas
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "IBRAMEC <notificacoes@ibramec.com>",
      to: ["joao.fernandes@neofolic.com.br", "adm@neofolic.com.br"],
      subject: `${isHotLead ? "🔥 " : ""}Pesquisa Dia 1 - ${studentName} (${className})`,
      html: emailHtml,
    });

    console.log("Survey notification email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending survey notification:", error);
    
    // Don't fail the whole flow if email fails
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
