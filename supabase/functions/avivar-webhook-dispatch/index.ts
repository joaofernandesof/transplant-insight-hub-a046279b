import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hmacSign(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const _logStart = Date.now();
  let _logStatus = "success";
  let _logError = "";
  let _logAccountId: string | null = null;

  try {
    const { event, account_id, payload } = await req.json();
    _logAccountId = account_id || null;

    if (!event || !account_id) {
      return new Response(
        JSON.stringify({ error: "event and account_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get active webhooks for this account that listen to this event
    const { data: webhooks, error: whErr } = await supabase
      .from("avivar_webhooks")
      .select("*")
      .eq("account_id", account_id)
      .eq("is_active", true)
      .contains("events", [event]);

    if (whErr) {
      console.error("Error fetching webhooks:", whErr);
      throw whErr;
    }

    if (!webhooks || webhooks.length === 0) {
      return new Response(
        JSON.stringify({ dispatched: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Webhook Dispatch] Dispatching '${event}' to ${webhooks.length} webhook(s)`);

    const results = [];

    for (const wh of webhooks) {
      const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });
      const headers: Record<string, string> = { "Content-Type": "application/json" };

      if (wh.secret) {
        headers["X-Webhook-Signature"] = await hmacSign(wh.secret, body);
      }

      let success = false;
      let responseStatus: number | null = null;
      let responseBody = "";

      // Retry up to 3 times
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const resp = await fetch(wh.url, { method: "POST", headers, body });
          responseStatus = resp.status;
          responseBody = await resp.text();
          success = resp.ok;
          if (success) break;
          console.warn(`[Webhook Dispatch] Attempt ${attempt + 1} failed for ${wh.url}: ${responseStatus}`);
        } catch (err) {
          responseBody = err instanceof Error ? err.message : "Network error";
          console.error(`[Webhook Dispatch] Attempt ${attempt + 1} error:`, responseBody);
        }
        // Wait before retry
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }

      // Log the result
      await supabase.from("avivar_webhook_logs").insert({
        webhook_id: wh.id,
        account_id: account_id,
        event,
        payload,
        response_status: responseStatus,
        response_body: responseBody?.slice(0, 1000),
        success,
      });

      // Update webhook stats
      await supabase
        .from("avivar_webhooks")
        .update({
          last_triggered_at: new Date().toISOString(),
          failure_count: success ? 0 : (wh.failure_count || 0) + 1,
        })
        .eq("id", wh.id);

      results.push({ webhook_id: wh.id, success, status: responseStatus });
    }

    return new Response(
      JSON.stringify({ dispatched: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    _logStatus = "error";
    _logError = error instanceof Error ? error.message : "Unknown error";
    console.error("[Webhook Dispatch] Error:", _logError);
    return new Response(
      JSON.stringify({ error: _logError }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } finally {
    try {
      const _sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      _sb.from("edge_function_logs").insert({ function_name: "avivar-webhook-dispatch", execution_time_ms: Date.now() - _logStart, status: _logStatus, account_id: _logAccountId, error_message: _logError || null }).then(() => {});
    } catch {}
  }
});
