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
  classId: string | null;
  userId: string;
  surveyType?: 'day1' | 'day2' | 'day3';
}

// Color coding based on response quality
// Vermelho (ruim), Laranja (médio), Azul (bom), Verde (ótimo)
const SCORE_COLORS = {
  great: { bg: '#10b981', text: '#ffffff', label: 'Ótimo' },   // Verde
  good: { bg: '#3b82f6', text: '#ffffff', label: 'Bom' },      // Azul
  medium: { bg: '#f59e0b', text: '#ffffff', label: 'Médio' },  // Laranja
  bad: { bg: '#ef4444', text: '#ffffff', label: 'Ruim' },      // Vermelho
  neutral: { bg: '#6b7280', text: '#ffffff', label: 'Neutro' },
};

// Score mappings for Day 1
const DAY1_SCORES: Record<string, Record<string, 'great' | 'good' | 'medium' | 'bad' | 'neutral'>> = {
  q1_satisfaction_level: { muito_satisfeito: 'great', satisfeito: 'good', neutro: 'medium', insatisfeito: 'bad', muito_insatisfeito: 'bad' },
  q13_organization: { excelente: 'great', boa: 'good', adequada: 'medium', ruim: 'bad', muito_ruim: 'bad' },
  q14_content_relevance: { excelente: 'great', boa: 'good', adequada: 'medium', ruim: 'bad', muito_ruim: 'bad' },
  q15_teacher_competence: { excelente: 'great', boa: 'good', adequada: 'medium', ruim: 'bad', muito_ruim: 'bad' },
  q16_material_quality: { excelente: 'great', boa: 'good', adequada: 'medium', ruim: 'bad', muito_ruim: 'bad' },
  q17_punctuality: { excelente: 'great', boa: 'good', adequada: 'medium', ruim: 'bad', muito_ruim: 'bad' },
  q18_infrastructure: { excelente: 'great', boa: 'good', adequada: 'medium', ruim: 'bad', muito_ruim: 'bad' },
  q19_support_team: { excelente: 'great', boa: 'good', adequada: 'medium', ruim: 'bad', muito_ruim: 'bad' },
  q20_coffee_break: { excelente: 'great', boa: 'good', adequada: 'medium', ruim: 'bad', muito_ruim: 'bad' },
  q24_hunger_level: { alta: 'great', moderada: 'good', baixa: 'medium', nenhuma: 'bad' },
  q25_urgency_level: { alta: 'great', moderada: 'good', baixa: 'medium', nenhuma: 'bad' },
  q26_investment_level: { alta: 'great', moderada: 'good', baixa: 'medium', nenhuma: 'bad' },
};

// Score mappings for Day 2
const DAY2_SCORES: Record<string, Record<string, 'great' | 'good' | 'medium' | 'bad' | 'neutral'>> = {
  q1_satisfaction_level: { muito_satisfeito: 'great', satisfeito: 'good', neutro: 'medium', insatisfeito: 'bad', muito_insatisfeito: 'bad' },
  q2_joao_expectations: { superou: 'great', atendeu: 'good', parcialmente: 'medium', nao_atendeu: 'bad' },
  q3_joao_clarity: { excelente: 'great', boa: 'good', adequada: 'medium', ruim: 'bad', muito_ruim: 'bad' },
  q4_joao_time: { ideal: 'great', adequado: 'good', curto: 'medium', muito_curto: 'bad', muito_longo: 'medium' },
  q7_larissa_expectations: { superou: 'great', atendeu: 'good', parcialmente: 'medium', nao_atendeu: 'bad' },
  q8_larissa_clarity: { excelente: 'great', boa: 'good', adequada: 'medium', ruim: 'bad', muito_ruim: 'bad' },
  q9_larissa_time: { ideal: 'great', adequado: 'good', curto: 'medium', muito_curto: 'bad', muito_longo: 'medium' },
  q12_avivar_current_process: { 'Tenho estrutura e quero ganhar escala e previsibilidade': 'great', 'Consigo organizar, mas sinto limites claros': 'good', 'Tenho organização básica, mas com falhas frequentes': 'medium', 'Tudo depende de pessoas e memória': 'bad' },
  q14_avivar_timing: { 'O quanto antes': 'great', 'Nos próximos meses': 'good', 'Quando tiver mais tempo': 'medium', 'Não é prioridade agora': 'neutral' },
  q15_license_path: { 'É totalmente viável para mim': 'great', 'É viável se o modelo fizer sentido': 'good', 'Seria viável apenas com muito planejamento': 'medium', 'Não é viável para mim hoje': 'neutral' },
  q17_license_timing: { 'Agora é o momento certo': 'great', 'Nos próximos meses': 'good', 'Talvez em um futuro distante': 'medium', 'Não penso nisso no momento': 'neutral' },
  q18_legal_feeling: { 'Tranquilo e seguro': 'great', 'Um pouco inseguro': 'good', 'Inseguro em alguns pontos': 'medium', 'Exposto a riscos que me preocupam': 'bad' },
  q20_legal_timing: { 'O quanto antes': 'great', 'Nos próximos meses': 'good', 'Quando o negócio estiver maior': 'medium', 'Não vejo isso como prioridade': 'neutral' },
};

// Score mappings for Day 3
const DAY3_SCORES: Record<string, Record<string, 'great' | 'good' | 'medium' | 'bad' | 'neutral'>> = {
  q1_satisfaction_level: { muito_satisfeito: 'great', satisfeito: 'good', neutro: 'medium', insatisfeito: 'bad', muito_insatisfeito: 'bad' },
  q2_promise_met: { muito_acima: 'great', acima: 'good', dentro: 'medium', abaixo: 'bad', muito_abaixo: 'bad' },
  q3_technical_foundations: { excelentes: 'great', bons: 'good', adequados: 'medium', fracos: 'bad', muito_fracos: 'bad' },
  q4_practical_load: { excelente: 'great', boa: 'good', adequada: 'medium', insuficiente: 'bad', muito_insuficiente: 'bad' },
  q5_theory_practice_balance: { equilibrado: 'great', mais_pratica: 'good', mais_teoria: 'medium', muito_pratico: 'medium', muito_teorico: 'bad' },
  q6_execution_clarity: { total: 'great', boa: 'good', razoavel: 'medium', pouca: 'bad', nenhuma: 'bad' },
  q7_confidence_level: { alta: 'great', boa: 'good', moderada: 'medium', baixa: 'bad', nenhuma: 'bad' },
  q8_management_classes: { essenciais: 'great', muito_relevantes: 'good', relevantes: 'medium', pouco_relevantes: 'bad', nada_relevantes: 'bad' },
  q9_legal_security: { muita: 'great', boa: 'good', razoavel: 'medium', pouca: 'bad', nenhuma: 'bad' },
  q10_organization: { excelente: 'great', boa: 'good', regular: 'medium', ruim: 'bad', muito_ruim: 'bad' },
  q11_support_quality: { excelente: 'great', bom: 'good', adequado: 'medium', fraco: 'bad', muito_fraco: 'bad' },
};

// Question labels
const DAY1_LABELS: Record<string, string> = {
  q1_satisfaction_level: "Satisfação Geral",
  q2_first_time_course: "Primeira vez no curso?",
  q3_hygor_expectations: "Hygor - Expectativas",
  q4_hygor_clarity: "Hygor - Clareza",
  q5_hygor_time: "Hygor - Tempo",
  q6_hygor_liked_most: "Hygor - O que mais gostou",
  q7_hygor_improve: "Hygor - O que melhorar",
  q8_patrick_expectations: "Patrick - Expectativas",
  q9_patrick_clarity: "Patrick - Clareza",
  q10_patrick_time: "Patrick - Tempo",
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
  q29_monitor_name: "Monitor acompanhado",
  q30_monitor_technical: "Monitor - Técnico",
  q31_monitor_interest: "Monitor - Interesse",
  q32_monitor_engagement: "Monitor - Engajamento",
  q33_monitor_posture: "Monitor - Postura",
  q34_monitor_communication: "Monitor - Comunicação",
  q35_monitor_contribution: "Monitor - Contribuição",
  q36_monitor_strength: "Monitor - Ponto forte",
  q37_monitor_improve: "Monitor - Melhorar",
};

const DAY2_LABELS: Record<string, string> = {
  q1_satisfaction_level: "Satisfação Geral",
  q2_joao_expectations: "João - Expectativas",
  q3_joao_clarity: "João - Clareza",
  q4_joao_time: "João - Tempo",
  q5_joao_liked_most: "João - O que mais gostou",
  q6_joao_improve: "João - O que melhorar",
  q7_larissa_expectations: "Larissa - Expectativas",
  q8_larissa_clarity: "Larissa - Clareza",
  q9_larissa_time: "Larissa - Tempo",
  q10_larissa_liked_most: "Larissa - O que mais gostou",
  q11_larissa_improve: "Larissa - O que melhorar",
  q12_avivar_current_process: "IA Avivar - Processo atual",
  q13_avivar_opportunity_loss: "IA Avivar - Perda de oportunidades",
  q14_avivar_timing: "IA Avivar - Timing",
  q15_license_path: "Licença - Viabilidade R$ 80k",
  q16_license_pace: "Licença - Ritmo sem exposição",
  q17_license_timing: "Licença - Timing",
  q18_legal_feeling: "Jurídico - Sensação de segurança",
  q19_legal_influence: "Jurídico - Influência nas decisões",
  q20_legal_timing: "Jurídico - Timing",
  score_ia_avivar: "📊 Score IA Avivar",
  score_license: "📊 Score Licença",
  score_legal: "📊 Score Jurídico",
  score_total: "📊 Score Total",
  lead_classification: "🎯 Classificação do Lead",
};

const DAY3_LABELS: Record<string, string> = {
  q1_satisfaction_level: "Satisfação Geral",
  q2_promise_met: "Curso correspondeu ao prometido",
  q3_technical_foundations: "Fundamentos técnicos",
  q4_practical_load: "Carga prática",
  q5_theory_practice_balance: "Equilíbrio teoria/prática",
  q6_execution_clarity: "Clareza para executar",
  q7_confidence_level: "Nível de confiança",
  q8_management_classes: "Aulas de gestão",
  q9_legal_security: "Segurança jurídica",
  q10_organization: "Organização e cronograma",
  q11_support_quality: "Qualidade do suporte",
  q12_improvements: "O que melhorar",
  q13_highlights: "O que mais acertamos",
  q14_best_technical_monitor: "Monitor - Maior domínio técnico",
  q15_best_caring_monitor: "Monitor - Mais atenção",
  q16_monitor_comments: "Comentários sobre monitores",
};

function getScoreStyle(key: string, value: string, surveyType: string): string {
  let scores: Record<string, Record<string, 'great' | 'good' | 'medium' | 'bad' | 'neutral'>>;
  
  if (surveyType === 'day1') scores = DAY1_SCORES;
  else if (surveyType === 'day2') scores = DAY2_SCORES;
  else scores = DAY3_SCORES;
  
  const scoreMap = scores[key];
  if (!scoreMap) return '';
  
  const scoreLevel = scoreMap[value];
  if (!scoreLevel) return '';
  
  const color = SCORE_COLORS[scoreLevel];
  return `background-color: ${color.bg}; color: ${color.text}; padding: 4px 8px; border-radius: 4px; font-weight: 600;`;
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  
  // Format lead classification
  if (value === 'hot') return '🔥 HOT';
  if (value === 'warm') return '🌡️ WARM';
  if (value === 'cold') return '❄️ COLD';
  
  return String(value).replace(/_/g, ' ');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { surveyId, classId, userId, surveyType = 'day1' }: NotifyRequest = await req.json();

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
    let className = "";
    if (classId) {
      const { data: classInfo } = await supabase
        .from("course_classes")
        .select("name, code")
        .eq("id", classId)
        .single();
      className = classInfo ? `${classInfo.name}` : "";
    }

    // Get survey responses based on type
    const tableName = surveyType === 'day1' ? 'day1_satisfaction_surveys' 
      : surveyType === 'day2' ? 'day2_satisfaction_surveys' 
      : 'day3_satisfaction_surveys';
    
    const { data: survey } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", surveyId)
      .single();

    if (!survey) {
      throw new Error("Survey not found");
    }

    const studentName = student?.full_name || "Aluno";
    const studentEmail = student?.email || "N/A";
    const completedAt = survey?.completed_at 
      ? new Date(survey.completed_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
      : new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    // Get labels based on survey type
    const labels = surveyType === 'day1' ? DAY1_LABELS 
      : surveyType === 'day2' ? DAY2_LABELS 
      : DAY3_LABELS;

    // Day title
    const dayTitle = surveyType === 'day1' ? 'Dia 1' 
      : surveyType === 'day2' ? 'Dia 2' 
      : 'Final (Dia 3)';

    // Determine if hot lead (Day 2 only)
    let priorityBadge = '<span style="background:#059669;color:white;padding:6px 16px;border-radius:6px;font-weight:bold;">✓ Pesquisa Concluída</span>';
    
    if (surveyType === 'day2' && survey.lead_classification) {
      if (survey.lead_classification === 'hot') {
        priorityBadge = '<span style="background:#dc2626;color:white;padding:6px 16px;border-radius:6px;font-weight:bold;">🔥 LEAD HOT - Score: ' + survey.score_total + '/54</span>';
      } else if (survey.lead_classification === 'warm') {
        priorityBadge = '<span style="background:#f59e0b;color:white;padding:6px 16px;border-radius:6px;font-weight:bold;">🌡️ LEAD WARM - Score: ' + survey.score_total + '/54</span>';
      } else {
        priorityBadge = '<span style="background:#6b7280;color:white;padding:6px 16px;border-radius:6px;font-weight:bold;">❄️ LEAD COLD - Score: ' + survey.score_total + '/54</span>';
      }
    } else if (surveyType === 'day1') {
      const hungerLevel = survey?.q24_hunger_level || "";
      const urgencyLevel = survey?.q25_urgency_level || "";
      const isHotLead = hungerLevel.toLowerCase().includes("alta") || urgencyLevel.toLowerCase().includes("alta");
      if (isHotLead) {
        priorityBadge = '<span style="background:#dc2626;color:white;padding:6px 16px;border-radius:6px;font-weight:bold;">🔥 LEAD PRIORITÁRIO</span>';
      }
    }

    // Build questions/answers with colors
    const excludedFields = ['id', 'user_id', 'class_id', 'created_at', 'completed_at', 'is_completed', 'current_section', 'effective_time_seconds'];
    
    const allQuestionsHtml = Object.entries(survey || {})
      .filter(([key, value]) => {
        if (excludedFields.includes(key)) return false;
        if (value === null || value === undefined || value === "") return false;
        return true;
      })
      .sort(([keyA], [keyB]) => {
        // Sort by question number
        const numA = parseInt(keyA.match(/\d+/)?.[0] || '999');
        const numB = parseInt(keyB.match(/\d+/)?.[0] || '999');
        return numA - numB;
      })
      .map(([key, value]) => {
        const label = labels[key] || key.replace(/_/g, ' ').replace(/q\d+/g, '').trim() || key;
        const displayValue = formatValue(value);
        const scoreStyle = getScoreStyle(key, String(value), surveyType);
        
        // Special styling for scores
        let valueCell = `<td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">`;
        if (scoreStyle) {
          valueCell += `<span style="${scoreStyle}">${displayValue}</span>`;
        } else if (key.startsWith('score_') || key === 'lead_classification') {
          // Highlight scores
          const bgColor = key === 'lead_classification' 
            ? (value === 'hot' ? '#dc2626' : value === 'warm' ? '#f59e0b' : '#6b7280')
            : '#3b82f6';
          valueCell += `<span style="background: ${bgColor}; color: white; padding: 4px 10px; border-radius: 4px; font-weight: bold;">${displayValue}</span>`;
        } else {
          valueCell += displayValue;
        }
        valueCell += `</td>`;
        
        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 45%; background: #f9fafb; vertical-align: top;">${label}</td>
            ${valueCell}
          </tr>
        `;
      })
      .join("");
    
    const responsesSection = allQuestionsHtml 
      ? allQuestionsHtml 
      : '<tr><td colspan="2" style="padding: 20px; text-align: center; color: #6b7280;">Nenhuma resposta registrada</td></tr>';

    // Color legend
    const colorLegend = `
      <div style="margin: 16px 0; padding: 12px; background: #f9fafb; border-radius: 8px; text-align: center;">
        <span style="font-size: 12px; color: #6b7280; margin-right: 16px;">Legenda:</span>
        <span style="background: ${SCORE_COLORS.great.bg}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin: 0 4px;">Ótimo</span>
        <span style="background: ${SCORE_COLORS.good.bg}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin: 0 4px;">Bom</span>
        <span style="background: ${SCORE_COLORS.medium.bg}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin: 0 4px;">Médio</span>
        <span style="background: ${SCORE_COLORS.bad.bg}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin: 0 4px;">Ruim</span>
      </div>
    `;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 28px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 26px;">📋 Pesquisa ${dayTitle} Respondida</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Formação 360° IBRAMEC</p>
          </div>
          
          <div style="padding: 24px;">
            <div style="margin-bottom: 20px; text-align: center;">
              ${priorityBadge}
            </div>
            
            <!-- Header Info -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #f0fdf4; border-radius: 8px; overflow: hidden;">
              <tr>
                <td style="padding: 14px; border-bottom: 1px solid #d1fae5; font-weight: bold; width: 140px; color: #065f46;">👤 Aluno:</td>
                <td style="padding: 14px; border-bottom: 1px solid #d1fae5; font-weight: 600;">${studentName}</td>
              </tr>
              <tr>
                <td style="padding: 14px; border-bottom: 1px solid #d1fae5; font-weight: bold; color: #065f46;">📧 E-mail:</td>
                <td style="padding: 14px; border-bottom: 1px solid #d1fae5;"><a href="mailto:${studentEmail}" style="color: #059669;">${studentEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 14px; border-bottom: 1px solid #d1fae5; font-weight: bold; color: #065f46;">📚 Turma:</td>
                <td style="padding: 14px; border-bottom: 1px solid #d1fae5;">${className || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 14px; font-weight: bold; color: #065f46;">🕐 Concluído:</td>
                <td style="padding: 14px;">${completedAt}</td>
              </tr>
            </table>

            ${colorLegend}

            <!-- All Questions and Answers -->
            <h2 style="font-size: 18px; color: #059669; margin: 24px 0 16px; border-bottom: 2px solid #059669; padding-bottom: 8px;">📝 Respostas Completas</h2>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              ${responsesSection}
            </table>
          </div>
          
          <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
            IBRAMEC - Sistema de Pesquisas • Formação 360° • ${new Date().getFullYear()}
          </div>
        </div>
      </body>
      </html>
    `;

    const isHotLead = surveyType === 'day2' && survey.lead_classification === 'hot';
    const subjectPrefix = isHotLead ? "🔥 " : "";
    
    const emailResponse = await resend.emails.send({
      from: "IBRAMEC <notificacoes@ibramec.com>",
      to: ["joao.fernandes@neofolic.com.br", "adm@neofolic.com.br"],
      subject: `${subjectPrefix}Pesquisa ${dayTitle} - ${studentName} (${className || 'Formação 360°'})`,
      html: emailHtml,
    });

    console.log("Survey notification email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending survey notification:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
