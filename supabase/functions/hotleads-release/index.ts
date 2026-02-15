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

    const body = await req.json().catch(() => ({}));
    const action = body.action || "release";
    const mode = body.mode || "manual_admin";

    // Cron jobs skip user auth - they run with service role via pg_net
    const isCronMode = mode === "cron_auto";

    if (!isCronMode) {
      // Verify auth for manual/user-triggered actions
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
    }

    if (action === "release") {
      // For cron mode: use probabilistic release instead of fixed intervals
      if (isCronMode) {
        const shouldRelease = await shouldReleaseNow(supabase);
        if (!shouldRelease.release) {
          return new Response(JSON.stringify({ 
            skipped: true, 
            reason: shouldRelease.reason,
            next_check: "~1 min" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

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

    if (action === "get_default_interval") {
      const { data } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "hotleads_release_interval_seconds")
        .single();
      return new Response(JSON.stringify({ interval_seconds: data?.value ? Number(data.value) : 300 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "set_default_interval") {
      const seconds = body.seconds;
      if (!seconds || seconds < 5) {
        return new Response(JSON.stringify({ error: "Minimum 5 seconds" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await supabase
        .from("admin_settings")
        .upsert({ key: "hotleads_release_interval_seconds", value: String(seconds), updated_at: new Date().toISOString() }, { onConflict: "key" });
      return new Response(JSON.stringify({ success: true, interval_seconds: seconds }), {
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

// Helper: get current BRT date as YYYY-MM-DD string
function getBrtDate(): { dateStr: string; brtHour: number; brtMinutes: number } {
  const now = new Date();
  // Convert to BRT (UTC-3) using Intl
  const brtString = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  const brt = new Date(brtString);
  const year = brt.getFullYear();
  const month = String(brt.getMonth() + 1).padStart(2, "0");
  const day = String(brt.getDate()).padStart(2, "0");
  return {
    dateStr: `${year}-${month}-${day}`,
    brtHour: brt.getHours(),
    brtMinutes: brt.getMinutes(),
  };
}

// Probabilistic release: decides randomly whether to release NOW
// With 50 leads/day and 1440 minutes, probability per minute ≈ 50/1440 ≈ 3.5%
// We adjust based on remaining leads and remaining time in the day
async function shouldReleaseNow(supabase: any): Promise<{ release: boolean; reason: string }> {
  const { dateStr, brtHour, brtMinutes } = getBrtDate();

  // Active 24 hours - no time restriction

  const { data: daily } = await supabase
    .from("lead_release_daily")
    .select("*")
    .eq("release_date", dateStr)
    .single();

  const released = daily?.released_count || 0;
  const target = daily?.target_count || 50;
  const remaining = Math.max(0, target - released);

  if (remaining <= 0) {
    return { release: false, reason: "daily_quota_reached" };
  }

  // Calculate remaining minutes until midnight BRT
  const minutesLeft = Math.max(1, (24 - brtHour) * 60 - brtMinutes);

  // Probability = remaining leads / remaining minutes
  // This naturally increases urgency as the day progresses
  const probability = Math.min(0.95, remaining / minutesLeft);

  // Random dice roll
  const roll = Math.random();
  const shouldRelease = roll < probability;

  console.log(`[HotLeads Cron] brtDate=${dateStr} hour=${brtHour} released=${released}/${target} remaining=${remaining} minutesLeft=${minutesLeft} prob=${(probability*100).toFixed(1)}% roll=${roll.toFixed(3)} => ${shouldRelease ? 'RELEASE' : 'SKIP'}`);

  return { 
    release: shouldRelease, 
    reason: shouldRelease ? "probability_hit" : "probability_miss" 
  };
}

async function calculateNextRelease(supabase: any) {
  const now = new Date();
  const { dateStr, brtHour, brtMinutes } = getBrtDate();
  
  const { data: daily } = await supabase
    .from("lead_release_daily")
    .select("*")
    .eq("release_date", dateStr)
    .single();

  const released = daily?.released_count || 0;
  const target = daily?.target_count || 50;
  const remaining = Math.max(0, target - released);

  if (remaining <= 0) {
    return { next_release_at: null, remaining: 0 };
  }

  // Read default interval from admin_settings
  const { data: setting } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "hotleads_release_interval_seconds")
    .single();

  const defaultIntervalMs = (setting?.value ? Number(setting.value) : 300) * 1000;
  // Add random jitter: ±20% of interval
  const jitter = defaultIntervalMs * (0.8 + Math.random() * 0.4);
  const nextReleaseAt = new Date(now.getTime() + jitter);

  await supabase
    .from("lead_release_daily")
    .upsert({
      release_date: dateStr,
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
