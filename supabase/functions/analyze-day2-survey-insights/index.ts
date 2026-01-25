import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Day2SurveyData {
  totalResponses: number;
  completedResponses: number;
  partialResponses: number;
  completionRate: number;
  
  // Scores
  avgScoreTotal: number;
  avgScoreIA: number;
  avgScoreLicense: number;
  avgScoreLegal: number;
  
  // Lead classification
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  
  // Instructor feedback
  instructorMetrics: {
    joao: { avgExpectations: number; avgClarity: number; avgTime: number; strengths: string[]; improvements: string[] };
    larissa: { avgExpectations: number; avgClarity: number; avgTime: number; strengths: string[]; improvements: string[] };
  };
  
  // BNT analysis per product
  iaAvivar: {
    currentProcess: Record<string, number>;
    opportunityLoss: Record<string, number>;
    timing: Record<string, number>;
  };
  license: {
    path: Record<string, number>;
    pace: Record<string, number>;
    timing: Record<string, number>;
  };
  legal: {
    feeling: Record<string, number>;
    influence: Record<string, number>;
    timing: Record<string, number>;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { surveyData, className } = await req.json() as { surveyData: Day2SurveyData; className: string };
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um especialista em análise de pesquisas de satisfação e qualificação de leads para cursos presenciais de formação médica (tricologia capilar).

Sua função é analisar os dados da pesquisa do DIA 2 e gerar insights acionáveis com foco em:
1. Qualidade do treinamento (instrutores João e Larissa)
2. Qualificação comercial dos leads (BNT: Budget, Need, Timing) para 3 produtos:
   - IA Avivar (sistema de automação para clínicas)
   - Licença ByNeofolic (R$ 80.000 - franquia de atuação)
   - Assessoria Jurídica

Responda SEMPRE em português brasileiro. Seja direto, prático e focado em ações concretas para o time comercial.

Estruture sua resposta em formato JSON:
{
  "resumoExecutivo": "Um parágrafo resumindo a situação geral dos leads do dia 2",
  "scoreGeral": 0-100,
  "pontosCriticos": [
    { "area": "nome da área", "problema": "descrição do problema", "urgencia": "alta|media|baixa", "impacto": "alto|medio|baixo" }
  ],
  "oportunidadesComerciais": {
    "iaAvivar": { 
      "potencial": "alto|medio|baixo",
      "leadsProntos": 0,
      "insight": "análise do potencial",
      "abordagem": "sugestão de abordagem comercial"
    },
    "licenca": { 
      "potencial": "alto|medio|baixo",
      "leadsProntos": 0,
      "insight": "análise do potencial para licença de R$ 80k",
      "abordagem": "sugestão de abordagem comercial"
    },
    "juridico": { 
      "potencial": "alto|medio|baixo",
      "leadsProntos": 0,
      "insight": "análise do potencial",
      "abordagem": "sugestão de abordagem comercial"
    }
  },
  "analiseInstrutores": {
    "joao": { "nota": 0-10, "pontoForte": "texto", "melhoria": "texto" },
    "larissa": { "nota": 0-10, "pontoForte": "texto", "melhoria": "texto" }
  },
  "acoesSugeridas": [
    { "acao": "descrição da ação", "responsavel": "comercial|instrutor|gestao", "prazo": "imediato|proximo_dia|fim_do_curso", "prioridade": 1 }
  ],
  "alertas": ["alertas importantes para o time"],
  "tendencias": ["tendências identificadas"]
}`;

    const userPrompt = `Analise os seguintes dados da pesquisa de satisfação do DIA 2 da turma "${className}":

## Métricas Gerais
- Total de respostas: ${surveyData.totalResponses}
- Concluídas: ${surveyData.completedResponses}
- Parciais: ${surveyData.partialResponses}
- Taxa de conclusão: ${surveyData.completionRate.toFixed(1)}%

## Scores Médios (máximo 54 pontos)
- Score Total Médio: ${surveyData.avgScoreTotal.toFixed(1)}/54
- IA Avivar: ${surveyData.avgScoreIA.toFixed(1)}/18
- Licença: ${surveyData.avgScoreLicense.toFixed(1)}/18
- Jurídico: ${surveyData.avgScoreLegal.toFixed(1)}/18

## Classificação dos Leads
- Hot Leads (≥40 pontos): ${surveyData.hotLeads}
- Warm Leads (25-39 pontos): ${surveyData.warmLeads}
- Cold Leads (<25 pontos): ${surveyData.coldLeads}

## Avaliação dos Instrutores do Dia 2

### João (Conteúdo Comercial)
- Expectativas: ${surveyData.instructorMetrics.joao.avgExpectations.toFixed(2)}/5
- Clareza: ${surveyData.instructorMetrics.joao.avgClarity.toFixed(2)}/5
- Tempo: ${surveyData.instructorMetrics.joao.avgTime.toFixed(2)}/5
- Pontos fortes: ${surveyData.instructorMetrics.joao.strengths.slice(0, 5).join('; ') || 'Nenhum informado'}
- Melhorias: ${surveyData.instructorMetrics.joao.improvements.slice(0, 5).join('; ') || 'Nenhuma informada'}

### Larissa (Conteúdo Técnico)
- Expectativas: ${surveyData.instructorMetrics.larissa.avgExpectations.toFixed(2)}/5
- Clareza: ${surveyData.instructorMetrics.larissa.avgClarity.toFixed(2)}/5
- Tempo: ${surveyData.instructorMetrics.larissa.avgTime.toFixed(2)}/5
- Pontos fortes: ${surveyData.instructorMetrics.larissa.strengths.slice(0, 5).join('; ') || 'Nenhum informado'}
- Melhorias: ${surveyData.instructorMetrics.larissa.improvements.slice(0, 5).join('; ') || 'Nenhuma informada'}

## Análise BNT - IA Avivar
- Processo atual: ${JSON.stringify(surveyData.iaAvivar.currentProcess)}
- Perda de oportunidades: ${JSON.stringify(surveyData.iaAvivar.opportunityLoss)}
- Timing: ${JSON.stringify(surveyData.iaAvivar.timing)}

## Análise BNT - Licença ByNeofolic (R$ 80.000)
- Viabilidade financeira: ${JSON.stringify(surveyData.license.path)}
- Nível de exposição/necessidade: ${JSON.stringify(surveyData.license.pace)}
- Timing: ${JSON.stringify(surveyData.license.timing)}

## Análise BNT - Assessoria Jurídica
- Sensação de segurança: ${JSON.stringify(surveyData.legal.feeling)}
- Influência nas decisões: ${JSON.stringify(surveyData.legal.influence)}
- Timing: ${JSON.stringify(surveyData.legal.timing)}

Por favor, gere insights acionáveis para a equipe comercial e de gestão aproveitar as oportunidades identificadas.`;

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
    
    let insights;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      insights = JSON.parse(jsonStr);
    } catch {
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
