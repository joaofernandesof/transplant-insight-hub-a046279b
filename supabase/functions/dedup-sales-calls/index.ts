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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Não autenticado");

    const { account_id } = await req.json();
    if (!account_id) throw new Error("account_id obrigatório");

    // Fetch all calls for this account
    const { data: allCalls, error: fetchError } = await supabase
      .from("sales_calls")
      .select("id, lead_nome, transcricao, data_call, has_analysis, created_at")
      .eq("account_id", account_id)
      .order("created_at", { ascending: true });

    if (fetchError) throw fetchError;
    if (!allCalls || allCalls.length === 0) {
      return new Response(JSON.stringify({ removed: 0, kept: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by lead_nome + transcricao hash to find duplicates
    // Two calls are duplicates if they have the same lead_nome AND the same transcricao content
    const seen = new Map<string, string>(); // key -> first call id
    const duplicateIds: string[] = [];

    for (const call of allCalls) {
      // Build dedup key: lead_nome + first 500 chars of transcricao (normalized)
      const transcContent = (call.transcricao || "").trim().slice(0, 500).toLowerCase().replace(/\s+/g, " ");
      const key = `${(call.lead_nome || "").trim().toLowerCase()}::${transcContent}`;

      if (seen.has(key)) {
        // This is a duplicate - mark for deletion
        duplicateIds.push(call.id);
      } else {
        seen.set(key, call.id);
      }
    }

    if (duplicateIds.length === 0) {
      return new Response(JSON.stringify({ removed: 0, kept: allCalls.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete analyses for duplicate calls first
    const { error: delAnalysisErr } = await supabase
      .from("call_analysis")
      .delete()
      .in("call_id", duplicateIds);

    if (delAnalysisErr) console.error("Error deleting analyses:", delAnalysisErr);

    // Delete duplicate calls
    const { error: delCallsErr } = await supabase
      .from("sales_calls")
      .delete()
      .in("id", duplicateIds);

    if (delCallsErr) throw delCallsErr;

    console.log(`[Dedup] Removed ${duplicateIds.length} duplicates, kept ${allCalls.length - duplicateIds.length}`);

    return new Response(JSON.stringify({
      success: true,
      removed: duplicateIds.length,
      kept: allCalls.length - duplicateIds.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Dedup error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
