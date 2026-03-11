import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, context } = await req.json();

    if (!transcript || transcript.trim().length < 30) {
      return new Response(
        JSON.stringify({ error: "Transcrição muito curta. Cole a transcrição completa da call." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é um analista de calls comerciais especializado em vendas consultivas para clínicas médicas e estéticas. Analise a transcrição da call e retorne uma avaliação detalhada.`;

    const userPrompt = `Analise a seguinte transcrição de call comercial e retorne a avaliação usando a função fornecida.

${context ? `Contexto adicional: ${context}\n` : ""}
TRANSCRIÇÃO:
${transcript}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "call_analysis",
              description: "Retorna a análise completa de uma call comercial",
              parameters: {
                type: "object",
                properties: {
                  resumo_executivo: { type: "string", description: "Resumo de 2-3 frases da call" },
                  scores: {
                    type: "object",
                    properties: {
                      rapport: { type: "number", description: "Nota 0-10 para construção de rapport" },
                      escuta_ativa: { type: "number", description: "Nota 0-10 para escuta ativa" },
                      identificacao_dor: { type: "number", description: "Nota 0-10 para identificação de dor/necessidade" },
                      apresentacao_solucao: { type: "number", description: "Nota 0-10 para apresentação da solução" },
                      contorno_objecoes: { type: "number", description: "Nota 0-10 para contorno de objeções" },
                      fechamento: { type: "number", description: "Nota 0-10 para técnica de fechamento" },
                      clareza_comunicacao: { type: "number", description: "Nota 0-10 para clareza na comunicação" },
                      nota_geral: { type: "number", description: "Nota geral 0-10 da call" },
                    },
                    required: ["rapport", "escuta_ativa", "identificacao_dor", "apresentacao_solucao", "contorno_objecoes", "fechamento", "clareza_comunicacao", "nota_geral"],
                  },
                  pontos_fortes: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de pontos fortes identificados",
                  },
                  pontos_melhoria: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de pontos a melhorar",
                  },
                  objecoes_identificadas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        objecao: { type: "string" },
                        como_lidou: { type: "string" },
                        sugestao: { type: "string" },
                      },
                      required: ["objecao", "como_lidou", "sugestao"],
                    },
                  },
                  temperatura_lead: {
                    type: "string",
                    enum: ["frio", "morno", "quente"],
                    description: "Temperatura do lead após a call",
                  },
                  proximos_passos: {
                    type: "array",
                    items: { type: "string" },
                    description: "Próximos passos recomendados",
                  },
                  script_whatsapp: {
                    type: "string",
                    description: "Mensagem de follow-up pronta para enviar via WhatsApp, personalizada com base na call. Deve ser natural, amigável e incluir referências específicas ao que foi discutido.",
                  },
                },
                required: ["resumo_executivo", "scores", "pontos_fortes", "pontos_melhoria", "objecoes_identificadas", "temperatura_lead", "proximos_passos", "script_whatsapp"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "call_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para análise de IA." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Resposta da IA não contém análise estruturada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
