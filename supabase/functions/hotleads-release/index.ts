import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const N8N_WEBHOOK_URL = "https://n8n-n8n-start.bym1io.easypanel.host/webhook/lead";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await userClient.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "release";
    const mode = body.mode || "manual_admin";

    if (action === "release") {
      // Call the atomic RPC
      const { data, error } = await supabase.rpc("release_random_queued_lead", {
        p_mode: mode,
      });

      if (error) {
        console.error("RPC error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Process webhook outbox in background
      if (data?.success) {
        // Fire webhook (non-blocking)
        EdgeRuntime.waitUntil(processWebhookOutbox(supabase));

        // Calculate next release time with jitter
        const releaseInfo = await calculateNextRelease(supabase);
        
        return new Response(JSON.stringify({ ...data, next_release_at: releaseInfo.next_release_at }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_info") {
      const { data, error } = await supabase.rpc("get_lead_release_info");
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "schedule_next") {
      const info = await calculateNextRelease(supabase);
      return new Response(JSON.stringify(info), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function calculateNextRelease(supabase: any) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  
  // Get current daily info
  const { data: daily } = await supabase
    .from("lead_release_daily")
    .select("*")
    .eq("release_date", today.toISOString().split("T")[0])
    .single();

  const released = daily?.released_count || 0;
  const target = daily?.target_count || 50;
  const remaining = Math.max(0, target - released);

  if (remaining <= 0) {
    return { next_release_at: null, remaining: 0 };
  }

  // Distribute remaining releases across remaining hours with jitter
  const msRemaining = endOfDay.getTime() - now.getTime();
  const intervalMs = msRemaining / remaining;
  // Add random jitter: 30%-70% of interval
  const jitter = intervalMs * (0.3 + Math.random() * 0.4);
  const nextReleaseAt = new Date(now.getTime() + jitter);

  // Update the daily record
  await supabase
    .from("lead_release_daily")
    .upsert({
      release_date: today.toISOString().split("T")[0],
      released_count: released,
      target_count: target,
      next_release_at: nextReleaseAt.toISOString(),
    }, { onConflict: "release_date" });

  return { next_release_at: nextReleaseAt.toISOString(), remaining };
}

async function processWebhookOutbox(supabase: any) {
  try {
    const { data: pending } = await supabase
      .from("lead_webhook_outbox")
      .select("*")
      .eq("status", "pending")
      .lt("attempts", 3)
      .order("created_at", { ascending: true })
      .limit(10);

    if (!pending?.length) return;

    for (const entry of pending) {
      try {
        const webhookUrl = entry.webhook_url || N8N_WEBHOOK_URL;
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry.payload),
        });

        if (response.ok) {
          await supabase
            .from("lead_webhook_outbox")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
              attempts: entry.attempts + 1,
              last_attempt_at: new Date().toISOString(),
            })
            .eq("id", entry.id);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (err) {
        await supabase
          .from("lead_webhook_outbox")
          .update({
            attempts: entry.attempts + 1,
            last_attempt_at: new Date().toISOString(),
            error_message: err.message,
            status: entry.attempts + 1 >= entry.max_attempts ? "failed" : "pending",
          })
          .eq("id", entry.id);
      }
    }
  } catch (err) {
    console.error("Webhook outbox processing error:", err);
  }
}
