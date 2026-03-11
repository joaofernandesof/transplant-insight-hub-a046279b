import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Usuário não autenticado");

    const { rows, account_id } = await req.json();
    if (!rows || !Array.isArray(rows) || !account_id) {
      throw new Error("Dados inválidos: rows e account_id são obrigatórios");
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        // Check duplicate by lead_nome + data_call
        const { data: existing } = await supabase
          .from("sales_calls")
          .select("id")
          .eq("account_id", account_id)
          .eq("lead_nome", row.lead_nome)
          .eq("data_call", row.data_call)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // Map status
        let status_call = "followup";
        const resultado = (row.resultado || "").toUpperCase();
        if (resultado.includes("FECHADO")) status_call = "fechou";
        else if (resultado.includes("PERDIDO") || resultado.includes("NÃO FECHADO")) status_call = "perdido";

        // Build resumo_manual from available data
        const resumoParts = [];
        if (row.dor_principal) resumoParts.push(`Dor principal: ${row.dor_principal}`);
        if (row.objecao) resumoParts.push(`Objeção: ${row.objecao}`);
        if (row.motivo_nao_fechamento) resumoParts.push(`Motivo não fechamento: ${row.motivo_nao_fechamento}`);
        if (row.pontos_melhoria) resumoParts.push(`Pontos de melhoria: ${row.pontos_melhoria}`);
        if (row.followup) resumoParts.push(`Follow-up: ${row.followup}`);
        const resumo_manual = resumoParts.join("\n\n");

        // Insert sales_call
        const { data: callData, error: callError } = await supabase
          .from("sales_calls")
          .insert({
            account_id,
            closer_id: user.id,
            closer_name: row.vendedor || "Closer",
            lead_nome: row.lead_nome,
            produto: row.produto || null,
            data_call: row.data_call,
            status_call,
            resumo_manual: resumo_manual || null,
            fonte_call: "presencial",
            has_analysis: true,
          })
          .select("id")
          .single();

        if (callError) {
          console.error("Error inserting call:", callError);
          errors++;
          continue;
        }

        // Map classificacao
        let classificacao_lead = "morno";
        const classText = (row.classificacao || "").toLowerCase();
        if (classText.includes("quente") || classText.includes("qualificado")) classificacao_lead = "quente";
        else if (classText.includes("frio")) classificacao_lead = "frio";

        // Map urgencia
        const urgNum = parseInt(row.urgencia) || 5;
        let urgencia = "media";
        if (urgNum <= 3) urgencia = "baixa";
        else if (urgNum >= 7) urgencia = "alta";

        // BANT values
        const budget = parseInt(row.budget) || 0;
        const authority = parseInt(row.authority) || 0;
        const need = parseInt(row.need) || 0;
        const timeline = parseInt(row.timeline) || 0;
        const bant_total = parseInt(row.bant_total) || (budget + authority + need + timeline);

        // Probability based on classification and status
        let probabilidade = 50;
        if (status_call === "fechou") probabilidade = 100;
        else if (classificacao_lead === "quente") probabilidade = 70;
        else if (classificacao_lead === "frio") probabilidade = 20;

        // Insert call_analysis
        const { error: analysisError } = await supabase
          .from("call_analysis")
          .insert({
            call_id: callData.id,
            account_id,
            resumo_call: row.pontos_melhoria || null,
            dor_principal: row.dor_principal || null,
            objecoes: row.objecao || null,
            motivo_nao_fechamento: row.motivo_nao_fechamento || null,
            estrategia_followup: row.followup || null,
            pontos_fracos_closer: row.pontos_melhoria || null,
            bant_budget: budget,
            bant_authority: authority,
            bant_need: need,
            bant_timeline: timeline,
            bant_total: bant_total,
            classificacao_lead,
            urgencia,
            probabilidade_fechamento: probabilidade,
            ai_model: "imported-spreadsheet",
            conclusao: `Status: ${row.status_final || row.resultado}`,
          });

        if (analysisError) {
          console.error("Error inserting analysis:", analysisError);
        }

        imported++;
      } catch (rowErr) {
        console.error("Row error:", rowErr);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, imported, skipped, errors, total: rows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Import error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
