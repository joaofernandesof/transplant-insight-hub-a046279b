import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { event, lead_id, kanban_id, from_column_id, to_column_id, account_id } = await req.json();

    if (!event || !lead_id || !to_column_id) {
      return new Response(
        JSON.stringify({ error: "event, lead_id, and to_column_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Automations] Event: ${event}, Lead: ${lead_id}, To Column: ${to_column_id}`);

    // Fetch lead data
    const { data: lead } = await supabase
      .from("avivar_kanban_leads")
      .select("id, name, phone, email, kanban_id, column_id, account_id, contact_id, notes, tags, custom_fields")
      .eq("id", lead_id)
      .single();

    if (!lead) {
      console.warn("[Automations] Lead not found:", lead_id);
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const effectiveAccountId = account_id || lead.account_id;
    const effectiveKanbanId = kanban_id || lead.kanban_id;

    // Fetch column names for payload
    const columnIds = [from_column_id, to_column_id].filter(Boolean);
    const { data: columns } = await supabase
      .from("avivar_kanban_columns")
      .select("id, name")
      .in("id", columnIds);

    const columnMap: Record<string, string> = {};
    if (columns) {
      for (const col of columns) {
        columnMap[col.id] = col.name;
      }
    }

    // Fetch kanban name
    const { data: kanban } = await supabase
      .from("avivar_kanbans")
      .select("name")
      .eq("id", effectiveKanbanId)
      .single();

    // Fetch conversation_id for this lead (latest)
    let conversationId: string | null = null;
    if (lead.phone) {
      const { data: convoLead } = await supabase
        .from("leads")
        .select("crm_conversations(id)")
        .eq("phone", lead.phone)
        .limit(1)
        .maybeSingle();

      if (convoLead) {
        const convos = (convoLead as any).crm_conversations;
        if (convos && convos.length > 0) {
          conversationId = convos[0].id;
        }
      }
    }

    // Find active automations for this trigger + column
    const { data: automations, error: autoErr } = await supabase
      .from("avivar_automations")
      .select("*, avivar_automation_actions(*)")
      .eq("account_id", effectiveAccountId)
      .eq("is_active", true)
      .eq("trigger_type", event)
      .order("execution_order", { ascending: true });

    if (autoErr) {
      console.error("[Automations] Error fetching automations:", autoErr);
      throw autoErr;
    }

    // Filter automations that match this column
    const matchingAutomations = (automations || []).filter(auto => {
      // If automation has a specific column_id, it must match to_column_id
      if (auto.column_id && auto.column_id !== to_column_id) return false;
      // If automation has a specific kanban_id, it must match
      if (auto.kanban_id && auto.kanban_id !== effectiveKanbanId) return false;
      // Global automations (no column_id) always match
      return true;
    });

    if (matchingAutomations.length === 0) {
      console.log("[Automations] No matching automations found");
      return new Response(
        JSON.stringify({ executed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Automations] Found ${matchingAutomations.length} matching automation(s)`);

    const results = [];

    for (const automation of matchingAutomations) {
      // Check execute_once_per_lead
      if (automation.execute_once_per_lead) {
        const { data: existingExec } = await supabase
          .from("avivar_automation_executions")
          .select("id")
          .eq("automation_id", automation.id)
          .eq("lead_id", lead_id)
          .eq("status", "completed")
          .limit(1)
          .maybeSingle();

        if (existingExec) {
          console.log(`[Automations] Skipping ${automation.name} - already executed for this lead`);
          continue;
        }
      }

      // Check cooldown
      if (automation.cooldown_seconds && automation.cooldown_seconds > 0) {
        const cooldownCutoff = new Date(Date.now() - automation.cooldown_seconds * 1000).toISOString();
        const { data: recentExec } = await supabase
          .from("avivar_automation_executions")
          .select("id")
          .eq("automation_id", automation.id)
          .eq("lead_id", lead_id)
          .gte("created_at", cooldownCutoff)
          .limit(1)
          .maybeSingle();

        if (recentExec) {
          console.log(`[Automations] Skipping ${automation.name} - cooldown active`);
          continue;
        }
      }

      // Create execution record
      const { data: execution, error: execErr } = await supabase
        .from("avivar_automation_executions")
        .insert({
          automation_id: automation.id,
          account_id: effectiveAccountId,
          lead_id: lead_id,
          conversation_id: conversationId,
          trigger_event: event,
          trigger_data: {
            from_column_id,
            to_column_id,
            from_column_name: from_column_id ? columnMap[from_column_id] : null,
            to_column_name: columnMap[to_column_id] || null,
          },
          status: "running",
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (execErr || !execution) {
        console.error("[Automations] Error creating execution:", execErr);
        continue;
      }

      const actionsLog: any[] = [];
      let overallSuccess = true;

      // Execute actions sorted by order_index
      const actions = (automation.avivar_automation_actions || [])
        .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

      for (const action of actions) {
        const actionResult: any = { action_type: action.action_type, started_at: new Date().toISOString() };

        try {
          // Handle delay
          if (action.delay_seconds && action.delay_seconds > 0) {
            console.log(`[Automations] Waiting ${action.delay_seconds}s before action...`);
            await new Promise(r => setTimeout(r, Math.min(action.delay_seconds * 1000, 30000))); // Cap at 30s
          }

          if (action.action_type === "dispatch_webhook") {
            const config = action.action_config as { url?: string; method?: string; headers?: Record<string, string> };
            if (!config?.url) {
              throw new Error("Webhook URL not configured");
            }

            const webhookPayload = {
              event,
              triggered_at: new Date().toISOString(),
              automation: {
                id: automation.id,
                name: automation.name,
              },
              lead: {
                id: lead.id,
                name: lead.name,
                phone: lead.phone,
                email: lead.email,
                tags: lead.tags,
                notes: lead.notes,
                custom_fields: lead.custom_fields,
              },
              conversation_id: conversationId,
              column: {
                from: from_column_id ? { id: from_column_id, name: columnMap[from_column_id] } : null,
                to: { id: to_column_id, name: columnMap[to_column_id] || null },
              },
              kanban: {
                id: effectiveKanbanId,
                name: kanban?.name || null,
              },
              account_id: effectiveAccountId,
            };

            console.log(`[Automations] Dispatching webhook to ${config.url}`);

            const resp = await fetch(config.url, {
              method: config.method || "POST",
              headers: {
                "Content-Type": "application/json",
                ...(config.headers || {}),
              },
              body: JSON.stringify(webhookPayload),
            });

            actionResult.response_status = resp.status;
            actionResult.response_body = (await resp.text()).slice(0, 500);
            actionResult.success = resp.ok;

            if (!resp.ok) {
              console.warn(`[Automations] Webhook returned ${resp.status}`);
              overallSuccess = false;
            }
          } else if (action.action_type === "move_lead") {
            const config = action.action_config as { column_id?: string };
            if (config?.column_id) {
              await supabase
                .from("avivar_kanban_leads")
                .update({ column_id: config.column_id, updated_at: new Date().toISOString() })
                .eq("id", lead_id);
              actionResult.success = true;
            }
          } else if (action.action_type === "send_message") {
            // Future: integrate with messaging
            actionResult.success = true;
            actionResult.note = "send_message action not yet implemented";
          } else if (action.action_type === "send_notification") {
            const config = action.action_config as { title?: string; message?: string; sound?: boolean };
            const title = config?.title || "Notificação de Automação";
            const message = config?.message || `Automação "${automation.name}" foi disparada`;

            // Create notification
            const { data: notif, error: notifErr } = await supabase
              .from("notifications")
              .insert({
                title,
                message,
                type: "automation",
                created_by: null,
              })
              .select("id")
              .single();

            if (notifErr || !notif) {
              throw new Error("Failed to create notification: " + (notifErr?.message || "unknown"));
            }

            // Get account members
            const { data: members } = await supabase
              .from("avivar_account_members")
              .select("user_id")
              .eq("account_id", effectiveAccountId)
              .eq("is_active", true);

            if (members && members.length > 0) {
              const { error: recipErr } = await supabase
                .from("notification_recipients")
                .insert(
                  members.map((m: any) => ({
                    notification_id: notif.id,
                    user_id: m.user_id,
                  }))
                );
              if (recipErr) {
                console.warn("[Automations] Error creating notification recipients:", recipErr);
              }
            }

            actionResult.success = true;
            actionResult.notification_id = notif.id;
            actionResult.recipients_count = members?.length || 0;
          } else {
            actionResult.success = true;
            actionResult.note = `Unknown action type: ${action.action_type}`;
          }
        } catch (err) {
          actionResult.success = false;
          actionResult.error = err instanceof Error ? err.message : "Unknown error";
          overallSuccess = false;
          console.error(`[Automations] Action error:`, actionResult.error);
        }

        actionResult.completed_at = new Date().toISOString();
        actionsLog.push(actionResult);
      }

      // Update execution record
      await supabase
        .from("avivar_automation_executions")
        .update({
          status: overallSuccess ? "completed" : "failed",
          completed_at: new Date().toISOString(),
          actions_log: actionsLog,
          error_message: overallSuccess ? null : "One or more actions failed",
        })
        .eq("id", execution.id);

      results.push({
        automation_id: automation.id,
        automation_name: automation.name,
        success: overallSuccess,
        actions_count: actionsLog.length,
      });
    }

    console.log(`[Automations] Executed ${results.length} automation(s)`);

    return new Response(
      JSON.stringify({ executed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Automations] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
