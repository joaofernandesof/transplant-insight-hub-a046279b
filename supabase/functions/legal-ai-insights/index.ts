import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metrics, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um consultor de negócios especializado em análise de dados educacionais e comerciais para uma empresa de cursos médicos.

Analise os dados do módulo jurídico fornecidos e retorne insights estruturados em JSON.

REGRAS IMPORTANTES:
- Seja direto e acionável
- Use números e percentuais quando disponíveis
- Priorize oportunidades comerciais claras
- Identifique riscos e alertas
- Sugira ações específicas com prazos

O JSON de resposta DEVE seguir exatamente esta estrutura:
{
  "resumoExecutivo": "Parágrafo resumindo a situação geral em 2-3 frases",
  "diagnosticoJuridico": {
    "nivelRisco": "alto" | "medio" | "baixo",
    "percentualInseguros": number,
    "principaisDores": ["dor1", "dor2", "dor3"]
  },
  "analiseInstrutora": {
    "nota": number,
    "pontoForte": "string",
    "melhoria": "string",
    "comparativoTurma": "string"
  },
  "oportunidadesComerciais": {
    "potencialTotal": number,
    "leadsQuentes": number,
    "urgenciaMedia": "string",
    "abordagemSugerida": "string"
  },
  "acoesSugeridas": [
    {"acao": "string", "responsavel": "string", "prazo": "string", "prioridade": 1-3}
  ],
  "alertas": ["alerta1", "alerta2"]
}`;

    const userPrompt = `Contexto: ${context}

Dados do Módulo Jurídico:
${JSON.stringify(metrics, null, 2)}

Analise esses dados e retorne os insights em JSON conforme a estrutura solicitada.`;

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
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Taxa de requisições excedida. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response (handle markdown code blocks)
    let insights;
    try {
      // Remove markdown code blocks if present
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      insights = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    return new Response(
      JSON.stringify({ insights, rawContent: content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("legal-ai-insights error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: true 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
