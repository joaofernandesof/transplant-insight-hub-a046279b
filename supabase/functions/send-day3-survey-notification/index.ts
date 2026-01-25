import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const QUESTION_LABELS: Record<string, string> = {
  q1_satisfaction_level: "Satisfação geral com o curso",
  q2_promise_met: "Curso correspondeu ao prometido",
  q3_technical_foundations: "Fundamentos técnicos e cirúrgicos",
  q4_practical_load: "Carga prática suficiente",
  q5_theory_practice_balance: "Equilíbrio teoria/prática",
  q6_execution_clarity: "Clareza para executar na prática",
  q7_confidence_level: "Confiança para aplicar",
  q8_management_classes: "Aulas de gestão e expansão",
  q9_legal_security: "Conteúdo jurídico trouxe segurança",
  q10_organization: "Organização e cronograma",
  q11_support_quality: "Suporte para dúvidas",
  q12_improvements: "O que precisa melhorar",
  q13_highlights: "O que mais acertamos",
  q14_best_technical_monitor: "Monitor com maior domínio técnico",
  q15_best_caring_monitor: "Monitor com mais atenção aos alunos",
  q16_monitor_comments: "Comentários sobre monitores",
};

const VALUE_LABELS: Record<string, Record<string, string>> = {
  q1_satisfaction_level: {
    muito_insatisfeito: "😡 Muito insatisfeito",
    insatisfeito: "😕 Insatisfeito",
    neutro: "😐 Neutro",
    satisfeito: "🙂 Satisfeito",
    muito_satisfeito: "🤩 Muito satisfeito",
  },
  q2_promise_met: {
    muito_abaixo: "❌ Muito abaixo do prometido",
    abaixo: "⚠️ Abaixo do prometido",
    dentro: "✅ Dentro do prometido",
    acima: "✨ Acima do prometido",
    muito_acima: "🔥 Muito acima do prometido",
  },
  q3_technical_foundations: {
    muito_fracos: "❌ Muito fracos",
    fracos: "⚠️ Fracos",
    adequados: "✅ Adequados",
    bons: "👍 Bons",
    excelentes: "🧠 Excelentes",
  },
  q4_practical_load: {
    muito_insuficiente: "🟥 Muito insuficiente",
    insuficiente: "🟧 Insuficiente",
    adequada: "🟨 Adequada",
    boa: "🟩 Boa",
    excelente: "🟦 Excelente",
  },
  q5_theory_practice_balance: {
    muito_teorico: "📚 Muito teórico",
    mais_teoria: "📘 Mais teoria do que prática",
    equilibrado: "⚖️ Bem equilibrado",
    mais_pratica: "🛠️ Mais prática do que teoria",
    muito_pratico: "🧪 Muito prático, faltou teoria",
  },
  q6_execution_clarity: {
    nenhuma: "🚫 Nenhuma clareza",
    pouca: "😕 Pouca clareza",
    razoavel: "🤔 Razoável",
    boa: "🙂 Boa clareza",
    total: "🔍 Total clareza",
  },
  q7_confidence_level: {
    nenhuma: "😬 Nenhuma",
    baixa: "😟 Baixa",
    moderada: "😐 Moderada",
    boa: "🙂 Boa",
    alta: "💪 Alta",
  },
  q8_management_classes: {
    nada_relevantes: "❌ Nada relevantes",
    pouco_relevantes: "⚠️ Pouco relevantes",
    relevantes: "✅ Relevantes",
    muito_relevantes: "💡 Muito relevantes",
    essenciais: "🚀 Essenciais",
  },
  q9_legal_security: {
    nenhuma: "🚫 Nenhuma",
    pouca: "⚠️ Pouca",
    razoavel: "😐 Razoável",
    boa: "🙂 Boa",
    muita: "🔐 Muita",
  },
  q10_organization: {
    muito_ruim: "❌ Muito ruim",
    ruim: "⚠️ Ruim",
    regular: "😐 Regular",
    boa: "🙂 Boa",
    excelente: "🏆 Excelente",
  },
  q11_support_quality: {
    muito_fraco: "😩 Muito fraco",
    fraco: "😕 Fraco",
    adequado: "😐 Adequado",
    bom: "🙂 Bom",
    excelente: "👏 Excelente",
  },
  q14_best_technical_monitor: {
    elenilton: "👨‍⚕️ Dr. Elenilton",
    patrick: "👨‍⚕️ Dr. Patrick",
    eder: "👨‍⚕️ Dr. Eder",
    gleyldes: "👩‍⚕️ Dra. Gleyldes",
  },
  q15_best_caring_monitor: {
    elenilton: "👨‍⚕️ Dr. Elenilton",
    patrick: "👨‍⚕️ Dr. Patrick",
    eder: "👨‍⚕️ Dr. Eder",
    gleyldes: "👩‍⚕️ Dra. Gleyldes",
  },
};

function formatValue(key: string, value: string | null): string {
  if (!value) return "—";
  if (VALUE_LABELS[key]?.[value]) {
    return VALUE_LABELS[key][value];
  }
  return value;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { surveyId, userId } = await req.json();

    if (!surveyId || !userId) {
      throw new Error("Missing surveyId or userId");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get survey data
    const { data: survey, error: surveyError } = await supabase
      .from("day3_satisfaction_surveys")
      .select("*")
      .eq("id", surveyId)
      .single();

    if (surveyError || !survey) {
      throw new Error("Survey not found");
    }

    // Get user data
    const { data: userData } = await supabase
      .from("neohub_users")
      .select("full_name, email")
      .eq("user_id", userId)
      .single();

    const studentName = userData?.full_name || userData?.email || "Aluno";

    // Get class info if available
    let className = "";
    if (survey.class_id) {
      const { data: classData } = await supabase
        .from("course_classes")
        .select("name, code")
        .eq("id", survey.class_id)
        .single();
      className = classData ? `${classData.name} (${classData.code})` : "";
    }

    // Build HTML table
    const questionKeys = Object.keys(QUESTION_LABELS);
    const tableRows = questionKeys
      .map((key) => {
        const value = survey[key];
        if (value === null || value === undefined) return null;
        return `
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 500; background: #f9fafb;">${QUESTION_LABELS[key]}</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${formatValue(key, value)}</td>
          </tr>
        `;
      })
      .filter(Boolean)
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Pesquisa Final - Formação 360</title>
        </head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6; padding: 20px;">
          <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🏆 Pesquisa Final — Formação 360</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Nova resposta recebida</p>
            </div>
            
            <div style="padding: 24px;">
              <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 16px;"><strong>👤 Aluno:</strong> ${studentName}</p>
                ${className ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;"><strong>📚 Turma:</strong> ${className}</p>` : ""}
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;"><strong>📅 Data:</strong> ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
              </div>
              
              <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 16px;">📋 Respostas Completas</h2>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                  <tr>
                    <th style="padding: 12px; border: 1px solid #e5e7eb; background: #10b981; color: white; text-align: left;">Pergunta</th>
                    <th style="padding: 12px; border: 1px solid #e5e7eb; background: #10b981; color: white; text-align: left;">Resposta</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>
            
            <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                Academy IBRAMEC • Formação 360 • ${new Date().getFullYear()}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Academy IBRAMEC <noreply@neofolic.com.br>",
        to: ["adm@neofolic.com.br", "joao.fernandes@neofolic.com.br"],
        subject: `🏆 Pesquisa Final Dia 3 - ${studentName}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-day3-survey-notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
