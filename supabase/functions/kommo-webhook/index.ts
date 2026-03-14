// ====================================
// Kommo Webhook Edge Function
// Receives real-time updates from Kommo
// ====================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("[Kommo Webhook] Received event:", JSON.stringify(body).slice(0, 500));

    // Kommo webhook payload structure:
    // leads[add/update/delete], contacts[add/update/delete], etc.
    const events: { entity: string; action: string; items: any[] }[] = [];

    for (const entityType of ["leads", "contacts", "tasks"]) {
      for (const action of ["add", "update", "delete", "status"]) {
        const key = `${entityType}[${action}]`;
        if (body[key]) {
          const items = Array.isArray(body[key]) ? body[key] : [body[key]];
          events.push({ entity: entityType, action, items });
        }
      }
    }

    if (events.length === 0) {
      // Could be account-level event, just log
      console.log("[Kommo Webhook] No actionable events found");
      return new Response(JSON.stringify({ ok: true, events: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const event of events) {
      for (const item of event.items) {
        try {
          if (event.entity === "leads") {
            const isWon = item.status_id === 142;
            const isLost = item.status_id === 143;

            if (event.action === "delete") {
              await supabase
                .from("kommo_leads")
                .delete()
                .eq("kommo_id", item.id);
            } else {
              await supabase.from("kommo_leads").upsert(
                {
                  kommo_id: item.id,
                  name: item.name || null,
                  price: item.price || 0,
                  pipeline_kommo_id: item.pipeline_id || null,
                  stage_kommo_id: item.status_id || null,
                  responsible_user_kommo_id: item.responsible_user_id || null,
                  status_id: item.status_id || null,
                  is_won: isWon,
                  is_lost: isLost,
                  closed_at:
                    isWon || isLost
                      ? item.closed_at
                        ? new Date(item.closed_at * 1000).toISOString()
                        : new Date().toISOString()
                      : null,
                  updated_at_kommo: item.updated_at
                    ? new Date(item.updated_at * 1000).toISOString()
                    : new Date().toISOString(),
                  synced_at: new Date().toISOString(),
                },
                { onConflict: "kommo_id" }
              );
            }
          }

          if (event.entity === "contacts") {
            if (event.action === "delete") {
              await supabase
                .from("kommo_contacts")
                .delete()
                .eq("kommo_id", item.id);
            } else {
              await supabase.from("kommo_contacts").upsert(
                {
                  kommo_id: item.id,
                  name: item.name || null,
                  synced_at: new Date().toISOString(),
                },
                { onConflict: "kommo_id" }
              );
            }
          }

          if (event.entity === "tasks") {
            if (event.action === "delete") {
              await supabase
                .from("kommo_tasks")
                .delete()
                .eq("kommo_id", item.id);
            } else {
              await supabase.from("kommo_tasks").upsert(
                {
                  kommo_id: item.id,
                  text: item.text || null,
                  is_completed: item.is_completed || false,
                  responsible_user_kommo_id: item.responsible_user_id || null,
                  synced_at: new Date().toISOString(),
                },
                { onConflict: "kommo_id" }
              );
            }
          }

          processed++;
        } catch (itemError: any) {
          console.error(
            `[Kommo Webhook] Error processing ${event.entity}/${event.action}:`,
            itemError.message
          );
        }
      }
    }

    // Log the webhook
    await supabase.from("kommo_sync_logs").insert({
      sync_type: "webhook",
      status: "completed",
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      records_synced: { webhook_events: processed },
      duration_ms: 0,
    });

    return new Response(
      JSON.stringify({ ok: true, events: processed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Kommo Webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
