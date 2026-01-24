import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SurveyData {
  totalResponses: number;
  completionRate: number;
  npsScore: number;
  overallSatisfaction: number;
  instructorMetrics: {
    hygor: { avgExpectations: number; avgClarity: number; avgTime: number; strengths: string[]; improvements: string[] };
    patrick: { avgExpectations: number; avgClarity: number; avgTime: number; strengths: string[]; improvements: string[] };
  };
  infrastructure: {
    organization: number;
    contentRelevance: number;
    teacherCompetence: number;
    materialQuality: number;
    punctuality: number;
    infrastructure: number;
    supportTeam: number;
    coffeeBreak: number;
  };
  openFeedback: {
    likedMost: string[];
    suggestions: string[];
  };
  studentProfile: {
    hungerLevel: Record<string, number>;
    urgencyLevel: Record<string, number>;
    weeklyTime: Record<string, number>;
  };
  hotLeadsCount: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { surveyData, className } = await req.json() as { surveyData: SurveyData; className: string };
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build a detailed prompt with all survey data
    const systemPrompt = `Você é um especialista em análise de pesquisas de satisfação de cursos presenciais de formação médica. 
Sua função é analisar os dados da pesquisa e gerar insights acionáveis para a equipe de gestão melhorar a experiência nos próximos dias do curso.

Responda SEMPRE em português brasileiro. Seja direto, prático e focado em ações concretas.

Estruture sua resposta em formato JSON com a seguinte estrutura:
{
  "resumoExecutivo": "Um parágrafo resumindo a situação geral",
  "pontosCriticos": [
    { "area": "nome da área", "problema": "descrição do problema", "urgencia": "alta|media|baixa", "impacto": "alto|medio|baixo" }
  ],
  "acoesSugeridas": [
    { "acao": "descrição da ação", "responsavel": "quem deve executar", "prazo": "imediato|proximo_dia|fim_do_curso", "prioridade": 1 }
  ],
  "pontosFortes": ["lista de pontos fortes a manter"],
  "alertasHotLeads": "análise dos hot leads e como abordá-los",
  "analiseInfra": "análise detalhada da infraestrutura",
  "analiseProfessores": "análise comparativa dos instrutores com sugestões específicas",
  "tendencias": ["tendências identificadas nos feedbacks abertos"],
  "scoreGeral": 0-100
}`;

    const userPrompt = `Analise os seguintes dados da pesquisa de satisfação da turma "${className}":

## Métricas Gerais
- Total de respostas: ${surveyData.totalResponses}
- Taxa de conclusão: ${surveyData.completionRate}%
- NPS Score: ${surveyData.npsScore}
- Satisfação geral média: ${surveyData.overallSatisfaction.toFixed(2)}/5

## Avaliação dos Instrutores

### Dr. Hygor
- Expectativas: ${surveyData.instructorMetrics.hygor.avgExpectations.toFixed(2)}/5
- Clareza: ${surveyData.instructorMetrics.hygor.avgClarity.toFixed(2)}/5
- Tempo: ${surveyData.instructorMetrics.hygor.avgTime.toFixed(2)}/5
- Pontos fortes citados: ${surveyData.instructorMetrics.hygor.strengths.slice(0, 10).join('; ') || 'Nenhum'}
- Melhorias sugeridas: ${surveyData.instructorMetrics.hygor.improvements.slice(0, 10).join('; ') || 'Nenhuma'}

### Dr. Patrick
- Expectativas: ${surveyData.instructorMetrics.patrick.avgExpectations.toFixed(2)}/5
- Clareza: ${surveyData.instructorMetrics.patrick.avgClarity.toFixed(2)}/5
- Tempo: ${surveyData.instructorMetrics.patrick.avgTime.toFixed(2)}/5
- Pontos fortes citados: ${surveyData.instructorMetrics.patrick.strengths.slice(0, 10).join('; ') || 'Nenhum'}
- Melhorias sugeridas: ${surveyData.instructorMetrics.patrick.improvements.slice(0, 10).join('; ') || 'Nenhuma'}

## Infraestrutura (médias de 1 a 5)
- Organização: ${surveyData.infrastructure.organization.toFixed(2)}
- Relevância do conteúdo: ${surveyData.infrastructure.contentRelevance.toFixed(2)}
- Competência dos professores: ${surveyData.infrastructure.teacherCompetence.toFixed(2)}
- Qualidade do material: ${surveyData.infrastructure.materialQuality.toFixed(2)}
- Pontualidade: ${surveyData.infrastructure.punctuality.toFixed(2)}
- Infraestrutura física: ${surveyData.infrastructure.infrastructure.toFixed(2)}
- Equipe de apoio: ${surveyData.infrastructure.supportTeam.toFixed(2)}
- Coffee break: ${surveyData.infrastructure.coffeeBreak.toFixed(2)}

## Feedbacks Abertos
O que mais gostaram: ${surveyData.openFeedback.likedMost.slice(0, 15).join(' | ') || 'Sem respostas'}

Sugestões de melhoria: ${surveyData.openFeedback.suggestions.slice(0, 15).join(' | ') || 'Sem respostas'}

## Perfil dos Alunos
- Nível de "fome" (interesse em comprar): ${JSON.stringify(surveyData.studentProfile.hungerLevel)}
- Nível de urgência: ${JSON.stringify(surveyData.studentProfile.urgencyLevel)}
- Tempo disponível semanal: ${JSON.stringify(surveyData.studentProfile.weeklyTime)}

## Hot Leads
- Total de hot leads identificados: ${surveyData.hotLeadsCount}

Por favor, gere insights acionáveis para a gestão melhorar a experiência nos próximos dias do curso.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Entre em contato com o suporte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao gerar insights" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";
    
    // Try to parse JSON from the response
    let insights;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      insights = JSON.parse(jsonStr);
    } catch {
      // If parsing fails, return raw content
      insights = { rawContent: content };
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating insights:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
