import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth check (optional for service-level calls)
    const authHeader = req.headers.get("Authorization");
    if (authHeader && !authHeader.includes(serviceKey)) {
      const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (authErr || !user) throw new Error("Usuário não autenticado");
    }

    const { account_id, call_ids, limit: batchLimit } = await req.json();
    const maxBatch = batchLimit || 3;
    if (!account_id) throw new Error("account_id obrigatório");

    // Get calls that need rescoring
    let query = supabase
      .from("call_analysis")
      .select("id, call_id")
      .eq("account_id", account_id)
      .is("closer_primeiro_impacto", null)
      .limit(maxBatch);

    if (call_ids?.length) {
      query = query.in("call_id", call_ids);
    }

    const { data: analyses, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;
    if (!analyses?.length) {
      return new Response(JSON.stringify({ success: true, processed: 0, message: "Nenhuma análise para re-processar" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callIds = analyses.map(a => a.call_id);
    const { data: calls } = await supabase
      .from("sales_calls")
      .select("id, lead_nome, closer_name, produto, data_call, status_call, transcricao, resumo_manual")
      .in("id", callIds);

    if (!calls?.length) throw new Error("Nenhuma call encontrada");

    let processed = 0;
    let errors = 0;
    const results: any[] = [];

    for (const call of calls) {
      const content = call.transcricao || call.resumo_manual;
      if (!content || content.trim().length < 20) {
        results.push({ call_id: call.id, lead: call.lead_nome, status: "skipped", reason: "conteúdo insuficiente" });
        continue;
      }

      try {
        const systemPrompt = `Você é um especialista em análise de calls de vendas consultivas de alto ticket.
Avalie a performance do closer/vendedor em 7 dimensões com notas de 1 a 10.
Se o conteúdo for um resumo curto (não transcrição completa), dê notas baseadas no que pode ser inferido.
Se não há informação suficiente para uma dimensão específica, dê nota 5 (neutro).`;

        const userPrompt = `Analise esta call e dê notas de 1-10 para cada dimensão do closer:

CLOSER: ${call.closer_name || "Não informado"}
LEAD: ${call.lead_nome}
PRODUTO: ${call.produto || "Não informado"}
STATUS: ${call.status_call}

CONTEÚDO:
${content.slice(0, 15000)}

Avalie usando a função fornecida.`;

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            tools: [{
              type: "function",
              function: {
                name: "closer_scores",
                description: "Retorna as notas de performance do closer em 7 dimensões",
                parameters: {
                  type: "object",
                  properties: {
                    closer_primeiro_impacto: { type: "integer", description: "Score 1-10: abertura, rapport, tom inicial" },
                    closer_exploracao_spin: { type: "integer", description: "Score 1-10: uso de perguntas SPIN" },
                    closer_conexao_emocional: { type: "integer", description: "Score 1-10: empatia, escuta ativa" },
                    closer_clareza_pitch: { type: "integer", description: "Score 1-10: clareza na apresentação" },
                    closer_gatilhos_mentais: { type: "integer", description: "Score 1-10: escassez, urgência, prova social" },
                    closer_gestao_fala: { type: "integer", description: "Score 1-10: controle do tempo, assertividade" },
                    closer_fechamento: { type: "integer", description: "Score 1-10: técnica de fechamento" },
                  },
                  required: ["closer_primeiro_impacto", "closer_exploracao_spin", "closer_conexao_emocional", "closer_clareza_pitch", "closer_gatilhos_mentais", "closer_gestao_fala", "closer_fechamento"],
                  additionalProperties: false,
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "closer_scores" } },
          }),
        });

        if (!aiResp.ok) {
          const errText = await aiResp.text();
          console.error(`AI error for ${call.lead_nome}:`, aiResp.status, errText);
          results.push({ call_id: call.id, lead: call.lead_nome, status: "error", reason: `AI ${aiResp.status}` });
          errors++;
          // Wait before retrying next to avoid rate limits
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }

        const aiResult = await aiResp.json();
        const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall?.function?.arguments) {
          results.push({ call_id: call.id, lead: call.lead_nome, status: "error", reason: "No structured output" });
          errors++;
          continue;
        }

        const scores = JSON.parse(toolCall.function.arguments);
        const score_total = (scores.closer_primeiro_impacto || 0) +
          (scores.closer_exploracao_spin || 0) + (scores.closer_conexao_emocional || 0) +
          (scores.closer_clareza_pitch || 0) + (scores.closer_gatilhos_mentais || 0) +
          (scores.closer_gestao_fala || 0) + (scores.closer_fechamento || 0);

        // Find the analysis record for this call
        const analysisRecord = analyses.find(a => a.call_id === call.id);
        if (analysisRecord) {
          const { error: updateErr } = await supabase
            .from("call_analysis")
            .update({
              ...scores,
              closer_score_total: score_total,
            })
            .eq("id", analysisRecord.id);

          if (updateErr) {
            console.error("Update error:", updateErr);
            results.push({ call_id: call.id, lead: call.lead_nome, status: "error", reason: updateErr.message });
            errors++;
          } else {
            processed++;
            results.push({ call_id: call.id, lead: call.lead_nome, status: "success", scores });
          }
        }

        // Small delay between calls to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));
      } catch (callErr: any) {
        console.error(`Error processing ${call.lead_nome}:`, callErr);
        results.push({ call_id: call.id, lead: call.lead_nome, status: "error", reason: callErr.message });
        errors++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed,
      errors,
      total: calls.length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Batch rescore error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
