import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { transcript, closer_name, lead_nome, produto, data_call, status_call, call_id, account_id } = await req.json();

    if (!transcript || transcript.trim().length < 30) {
      return new Response(
        JSON.stringify({ error: "Transcrição/resumo muito curto. Mínimo 30 caracteres." }),
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

    const systemPrompt = `Você é um especialista em análise de calls de vendas consultivas de alto ticket para clínicas médicas e estéticas.

Sua função é analisar transcrições, resumos ou anotações de calls comerciais e gerar um relatório claro, crítico e altamente detalhado.

Regras:
- Linguagem clara e direta
- Ser crítico com a atuação da closer
- Priorizar melhoria de performance
- Não inventar informações - se não há dados suficientes, indicar "Não identificado na call"
- Scores BANT de 1 a 10 cada
- Probabilidade de fechamento de 0 a 100`;

    const userPrompt = `Analise a seguinte call comercial:

CLOSER: ${closer_name || "Não informado"}
LEAD: ${lead_nome || "Não informado"}  
PRODUTO: ${produto || "Não informado"}
DATA: ${data_call || "Não informada"}
STATUS: ${status_call || "Não informado"}

TRANSCRIÇÃO/RESUMO:
${transcript}

Gere a análise completa usando a função fornecida. Inclua também o campo whatsapp_report com uma versão formatada para WhatsApp usando *negrito* com asteriscos e emojis.`;

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
              name: "call_analysis_report",
              description: "Retorna a análise completa de uma call comercial com scores BANT e relatório WhatsApp",
              parameters: {
                type: "object",
                properties: {
                  resumo_call: { type: "string", description: "Resumo executivo da call em 3-5 frases" },
                  perfil_lead: { type: "string", description: "Perfil comportamental e demográfico do lead" },
                  objecoes: { type: "string", description: "Principais objeções levantadas pelo lead, separadas por ponto e vírgula" },
                  pontos_fracos_closer: { type: "string", description: "Pontos fracos identificados na atuação da closer" },
                  pontos_fortes_closer: { type: "string", description: "Pontos fortes identificados na atuação da closer" },
                  bant_budget: { type: "integer", description: "Score Budget 1-10: capacidade financeira do lead" },
                  bant_authority: { type: "integer", description: "Score Authority 1-10: poder de decisão do lead" },
                  bant_need: { type: "integer", description: "Score Need 1-10: nível de necessidade do lead" },
                  bant_timeline: { type: "integer", description: "Score Timeline 1-10: urgência temporal do lead" },
                  classificacao_lead: { type: "string", enum: ["frio", "morno", "quente"], description: "Classificação de temperatura do lead" },
                  urgencia: { type: "string", enum: ["baixa", "media", "alta"], description: "Nível de urgência" },
                  dor_principal: { type: "string", description: "Principal dor/necessidade identificada" },
                  motivo_nao_fechamento: { type: "string", description: "Principal motivo do não fechamento (se aplicável)" },
                  estrategia_followup: { type: "string", description: "Estratégia recomendada de follow-up" },
                  acoes_realizadas: { type: "string", description: "Ações que a closer realizou durante a call" },
                  proximos_passos: { type: "string", description: "Próximos passos recomendados" },
                  conclusao: { type: "string", description: "Conclusão geral da análise" },
                  probabilidade_fechamento: { type: "integer", description: "Probabilidade de fechamento de 0 a 100%" },
                  whatsapp_report: { type: "string", description: "Relatório completo formatado para WhatsApp com *negrito*, emojis e leitura rápida no celular. Deve seguir o formato: 📊 *ANÁLISE DA CALL DE VENDAS*\\n\\n👤 *Closer:* ...\\n🎯 *Lead:* ...\\netc." },
                },
                required: [
                  "resumo_call", "perfil_lead", "objecoes", "pontos_fracos_closer", "pontos_fortes_closer",
                  "bant_budget", "bant_authority", "bant_need", "bant_timeline",
                  "classificacao_lead", "urgencia", "dor_principal", "motivo_nao_fechamento",
                  "estrategia_followup", "acoes_realizadas", "proximos_passos", "conclusao",
                  "probabilidade_fechamento", "whatsapp_report"
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "call_analysis_report" } },
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
      return new Response(JSON.stringify({ error: "IA não retornou análise estruturada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    
    // Calculate BANT total
    analysis.bant_total = (analysis.bant_budget || 0) + (analysis.bant_authority || 0) + (analysis.bant_need || 0) + (analysis.bant_timeline || 0);
    
    const processingTime = Date.now() - startTime;

    // Save to database if call_id provided
    if (call_id && account_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Insert analysis
      const { error: insertError } = await supabase.from("call_analysis").insert({
        call_id,
        account_id,
        ...analysis,
        ai_model: "google/gemini-2.5-flash",
        processing_time_ms: processingTime,
      });

      if (insertError) {
        console.error("Error saving analysis:", insertError);
      } else {
        // Update sales_call to mark as analyzed
        await supabase.from("sales_calls").update({ has_analysis: true }).eq("id", call_id);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      analysis,
      processing_time_ms: processingTime,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
