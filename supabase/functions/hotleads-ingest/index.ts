import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const N8N_WEBHOOK_URL = "https://n8n-n8n-start.bym1io.easypanel.host/webhook/lead";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    // Support single lead or array of leads
    const leadsInput = Array.isArray(body) ? body : body.leads ? body.leads : [body];

    if (!leadsInput.length) {
      return new Response(
        JSON.stringify({ error: "No leads provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    const validated: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < leadsInput.length; i++) {
      const lead = leadsInput[i];
      if (!lead.name || !lead.phone) {
        errors.push(`Lead ${i}: name and phone are required`);
        continue;
      }
      validated.push({
        name: String(lead.name).trim(),
        phone: String(lead.phone).trim(),
        email: lead.email ? String(lead.email).trim() : null,
        city: lead.city ? String(lead.city).trim() : null,
        state: lead.state ? String(lead.state).trim() : null,
        source: "n8n",
        status: "new",
        interest_level: lead.interest_level || "warm",
        release_status: "available",
        available_at: new Date().toISOString(),
      });
    }

    if (!validated.length) {
      return new Response(
        JSON.stringify({ error: "No valid leads", details: errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabaseAdmin
      .from("leads")
      .insert(validated)
      .select("id, name, phone, email, city, state, source");

    if (error) {
      console.error("[hotleads-ingest] DB insert error:", error);
      return new Response(
        JSON.stringify({ error: "Database insert failed", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[hotleads-ingest] Inserted ${data.length} leads from n8n`);

    // Insert webhook outbox entries for each lead and process them
    const outboxEntries = data.map((lead: any) => ({
      lead_id: lead.id,
      event_type: "lead.available",
      payload: {
        event: "lead.available",
        timestamp: new Date().toISOString(),
        mode: "n8n_ingest",
        lead: {
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          source: lead.source,
          city: lead.city,
          state: lead.state,
        },
      },
      webhook_url: N8N_WEBHOOK_URL,
      status: "pending",
      attempts: 0,
      max_attempts: 3,
    }));

    const { error: outboxError } = await supabaseAdmin
      .from("lead_webhook_outbox")
      .insert(outboxEntries);

    if (outboxError) {
      console.error("[hotleads-ingest] Outbox insert error:", outboxError);
      // Don't fail the request, leads were inserted successfully
    } else {
      console.log(`[hotleads-ingest] Queued ${outboxEntries.length} webhook(s)`);
      // Process webhooks in background
      EdgeRuntime.waitUntil(processWebhookOutbox(supabaseAdmin));
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: data.length,
        errors: errors.length ? errors : undefined,
        lead_ids: data.map((l: any) => l.id),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[hotleads-ingest] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processWebhookOutbox(supabase: any) {
  try {
    // Atomically claim pending webhooks to prevent duplicate processing
    const { data: claimed, error: claimError } = await supabase.rpc("claim_pending_webhooks", { p_limit: 10 });

    if (claimError) {
      console.error("[hotleads-ingest] Failed to claim webhooks:", claimError);
      return;
    }

    if (!claimed?.length) return;

    for (const entry of claimed) {
      try {
        const webhookUrl = entry.webhook_url || "https://n8n-n8n-start.bym1io.easypanel.host/webhook/lead";
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
    console.error("[hotleads-ingest] Webhook outbox error:", err);
  }
}
