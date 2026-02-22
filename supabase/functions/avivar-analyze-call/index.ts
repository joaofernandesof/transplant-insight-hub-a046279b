import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * avivar-analyze-call
 * Analyzes call transcripts using SPIN Selling methodology via Lovable AI
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um analista comercial expert em SPIN Selling e vendas consultivas para clínicas de saúde e estética.

Analise a transcrição da ligação comercial e retorne uma análise completa usando a função fornecida.

## Metodologia SPIN Selling
- **Situação (S)**: Perguntas sobre o contexto atual do lead
- **Problema (P)**: Identificação de dores e dificuldades
- **Implicação (I)**: Consequências de não resolver o problema
- **Necessidade de solução (N)**: Benefícios da solução proposta

## Sua análise deve:
1. Identificar cada pergunta/resposta SPIN na transcrição
2. Detectar objeções reais e classificá-las
3. Identificar a dor dominante e gatilho emocional
4. Avaliar urgência e probabilidade de fechamento (0-100)
5. Classificar temperatura: cold, warm, hot
6. Gerar estratégia de follow-up personalizada
7. Sugerir mensagem de WhatsApp para reengajamento
8. Recomendar próxima ação e timing ideal
9. Extrair informações-chave (interesse, valor discutido, barreiras)
10. Sugerir perguntas que faltaram ser feitas

Seja específico e actionable. Use português brasileiro.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  let _logStatus = "success";
  let _logError = "";
  let _logTokensIn = 0;
  let _logTokensOut = 0;
  let _logModel = "google/gemini-2.5-flash";
  let _logAccountId: string | null = null;
  let _logUserId: string | null = null;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { call_id, account_id } = await req.json();
    _logAccountId = account_id || null;

    if (!call_id || !account_id) {
      return new Response(
        JSON.stringify({ error: "call_id and account_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch call data
    const { data: call, error: callError } = await supabase
      .from("avivar_voice_calls")
      .select("*")
      .eq("id", call_id)
      .single();

    if (callError || !call) {
      return new Response(
        JSON.stringify({ error: "Call not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transcript = call.transcript || "";
    const transcriptJson = call.transcript_json || [];

    if (!transcript && transcriptJson.length === 0) {
      return new Response(
        JSON.stringify({ error: "No transcript available for analysis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build transcript text for analysis
    let transcriptText = transcript;
    if (!transcriptText && transcriptJson.length > 0) {
      transcriptText = transcriptJson
        .map((m: any) => `${m.role === "assistant" ? "Vendedor" : "Lead"}: ${m.content}`)
        .join("\n");
    }

    const userPrompt = `## Dados da Ligação
- Lead: ${call.lead_name || "Desconhecido"}
- Telefone: ${call.phone_number}
- Duração: ${call.duration_seconds || 0} segundos
- Direção: ${call.direction}
- Data: ${call.created_at}

## Transcrição Completa
${transcriptText}

${call.summary ? `## Resumo Existente\n${call.summary}` : ""}

Analise esta ligação comercial usando SPIN Selling.`;

    console.log(`[analyze-call] Analyzing call ${call_id}, transcript length: ${transcriptText.length}`);

    // Call Lovable AI with tool calling for structured output
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "submit_call_analysis",
                description: "Submit the complete SPIN Selling call analysis",
                parameters: {
                  type: "object",
                  properties: {
                    spin_situation: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          quote: { type: "string", description: "Trecho da transcrição" },
                          insight: { type: "string", description: "Insight extraído" },
                          quality: { type: "string", enum: ["excellent", "good", "weak"] },
                        },
                        required: ["quote", "insight", "quality"],
                      },
                    },
                    spin_problem: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          quote: { type: "string" },
                          insight: { type: "string" },
                          quality: { type: "string", enum: ["excellent", "good", "weak"] },
                        },
                        required: ["quote", "insight", "quality"],
                      },
                    },
                    spin_implication: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          quote: { type: "string" },
                          insight: { type: "string" },
                          quality: { type: "string", enum: ["excellent", "good", "weak"] },
                        },
                        required: ["quote", "insight", "quality"],
                      },
                    },
                    spin_need: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          quote: { type: "string" },
                          insight: { type: "string" },
                          quality: { type: "string", enum: ["excellent", "good", "weak"] },
                        },
                        required: ["quote", "insight", "quality"],
                      },
                    },
                    spin_score: { type: "number", description: "Score SPIN 0-100" },
                    spin_missing: {
                      type: "array",
                      items: { type: "string" },
                      description: "O que faltou explorar no SPIN",
                    },
                    spin_suggested_questions: {
                      type: "array",
                      items: { type: "string" },
                      description: "Perguntas sugeridas para próximas calls",
                    },
                    objections: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          text: { type: "string", description: "A objeção identificada" },
                          category: {
                            type: "string",
                            enum: ["price", "timing", "trust", "need", "competition", "other"],
                          },
                          severity: { type: "string", enum: ["low", "medium", "high"] },
                          suggested_response: { type: "string" },
                        },
                        required: ["text", "category", "severity", "suggested_response"],
                      },
                    },
                    dominant_pain: { type: "string" },
                    emotional_trigger: { type: "string" },
                    urgency_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
                    close_probability: { type: "number", description: "0-100" },
                    temperature: { type: "string", enum: ["cold", "warm", "hot"] },
                    interest_area: { type: "string" },
                    discussed_value: { type: "string" },
                    barriers: { type: "array", items: { type: "string" } },
                    keywords: { type: "array", items: { type: "string" } },
                    followup_script: { type: "string", description: "Roteiro para próxima abordagem" },
                    followup_whatsapp_message: { type: "string", description: "Mensagem sugerida para WhatsApp" },
                    followup_timing: { type: "string", description: "Timing ideal para retorno" },
                    followup_arguments: { type: "array", items: { type: "string" } },
                    next_action: { type: "string" },
                    executive_summary: { type: "string", description: "Resumo executivo da call" },
                    suggested_stage: { type: "string", description: "Etapa sugerida do funil" },
                  },
                  required: [
                    "spin_situation", "spin_problem", "spin_implication", "spin_need",
                    "spin_score", "objections", "dominant_pain", "close_probability",
                    "temperature", "executive_summary", "followup_script",
                    "followup_whatsapp_message", "next_action",
                  ],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "submit_call_analysis" } },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`[analyze-call] AI error: ${aiResponse.status} - ${errorText}`);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits insufficient" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    _logTokensIn = aiResult.usage?.prompt_tokens || 0;
    _logTokensOut = aiResult.usage?.completion_tokens || 0;
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.error("[analyze-call] No tool call in response");
      return new Response(
        JSON.stringify({ error: "AI did not return structured analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    const processingTime = Date.now() - startTime;

    // Get auth user from request
    const authHeader = req.headers.get("Authorization");
    let userId = call.user_id;
    _logUserId = userId;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }

    // Upsert analysis
    const { data: savedAnalysis, error: saveError } = await supabase
      .from("avivar_call_analyses")
      .upsert(
        {
          call_id,
          account_id,
          user_id: userId,
          spin_situation: analysis.spin_situation || [],
          spin_problem: analysis.spin_problem || [],
          spin_implication: analysis.spin_implication || [],
          spin_need: analysis.spin_need || [],
          spin_score: analysis.spin_score || 0,
          spin_missing: analysis.spin_missing || [],
          spin_suggested_questions: analysis.spin_suggested_questions || [],
          objections: analysis.objections || [],
          dominant_pain: analysis.dominant_pain,
          emotional_trigger: analysis.emotional_trigger,
          urgency_level: analysis.urgency_level || "medium",
          close_probability: analysis.close_probability || 0,
          temperature: analysis.temperature || "cold",
          interest_area: analysis.interest_area,
          discussed_value: analysis.discussed_value,
          barriers: analysis.barriers || [],
          keywords: analysis.keywords || [],
          followup_script: analysis.followup_script,
          followup_whatsapp_message: analysis.followup_whatsapp_message,
          followup_timing: analysis.followup_timing,
          followup_arguments: analysis.followup_arguments || [],
          next_action: analysis.next_action,
          executive_summary: analysis.executive_summary,
          suggested_stage: analysis.suggested_stage,
          ai_model: "google/gemini-2.5-flash",
          processing_time_ms: processingTime,
        },
        { onConflict: "call_id" }
      )
      .select()
      .single();

    if (saveError) {
      console.error("[analyze-call] Save error:", saveError);
      return new Response(
        JSON.stringify({ error: "Failed to save analysis", details: saveError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[analyze-call] ✅ Analysis complete in ${processingTime}ms, score: ${analysis.spin_score}, temp: ${analysis.temperature}`);

    return new Response(
      JSON.stringify({ success: true, analysis: savedAnalysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    _logStatus = "error";
    _logError = (error as Error).message;
    console.error("[analyze-call] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } finally {
    try {
      const _costs: Record<string, [number, number]> = { "google/gemini-3-flash-preview": [0.10, 0.40], "google/gemini-2.5-flash": [0.15, 0.60], "google/gemini-2.5-flash-lite": [0.02, 0.05], "google/gemini-2.5-pro": [1.25, 5.00] };
      const [cIn, cOut] = _costs[_logModel] || [0, 0];
      const _estCost = (_logTokensIn / 1e6) * cIn + (_logTokensOut / 1e6) * cOut;
      const _sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      _sb.from("edge_function_logs").insert({ function_name: "avivar-analyze-call", execution_time_ms: Date.now() - startTime, status: _logStatus, tokens_input: _logTokensIn, tokens_output: _logTokensOut, model_used: _logModel, estimated_cost_usd: _estCost, account_id: _logAccountId, user_id: _logUserId, error_message: _logError || null }).then(() => {});
    } catch {}
  }
});
