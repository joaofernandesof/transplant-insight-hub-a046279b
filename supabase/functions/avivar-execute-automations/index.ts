import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Replace template variables like {{nome}}, {{telefone}}, {{email}}, {{etapa}}, {{empresa}}
function replaceVariables(
  text: string,
  lead: Record<string, any>,
  columnMap: Record<string, string>,
  toColumnId: string
): string {
  const firstName = lead.name ? lead.name.split(" ")[0] : "";
  return text
    .replace(/\{\{nome\}\}/gi, lead.name || "")
    .replace(/\{\{primeiro_nome\}\}/gi, firstName)
    .replace(/\{\{telefone\}\}/gi, lead.phone || "")
    .replace(/\{\{email\}\}/gi, lead.email || "")
    .replace(/\{\{etapa\}\}/gi, columnMap[toColumnId] || "")
    .replace(/\{\{empresa\}\}/gi, (lead.custom_fields as any)?.empresa || "")
    .replace(/\{\{procedimento\}\}/gi, (lead.custom_fields as any)?.procedimento || "");
}


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
      .select("id, name, phone, email, kanban_id, column_id, account_id, contact_id, notes, tags, custom_fields, responsible_id")
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
          } else if (action.action_type === "move_lead" || action.action_type === "change_stage") {
            const config = action.action_config as { column_id?: string; target_column_id?: string };
            const targetCol = config?.target_column_id || config?.column_id;
            if (targetCol) {
              const { error: moveErr } = await supabase
                .from("avivar_kanban_leads")
                .update({ column_id: targetCol, updated_at: new Date().toISOString() })
                .eq("id", lead_id);
              if (moveErr) throw new Error("Failed to move lead: " + moveErr.message);
              actionResult.success = true;
              actionResult.moved_to = targetCol;
            } else {
              throw new Error("No target column configured");
            }
          } else if (action.action_type === "send_message") {
            const config = action.action_config as { message?: string };
            if (!config?.message || !lead.phone) {
              throw new Error(!config?.message ? "No message configured" : "Lead has no phone");
            }

            const msg = replaceVariables(config.message, lead, columnMap, to_column_id);

            // Get UazAPI instance for this account
            const uazapiUrl = Deno.env.get("UAZAPI_URL");
            let uazapiToken: string | undefined;

            const { data: uazapiInstance } = await supabase
              .from("avivar_uazapi_instances")
              .select("instance_token")
              .eq("account_id", effectiveAccountId)
              .eq("status", "connected")
              .limit(1)
              .maybeSingle();

            if (uazapiInstance?.instance_token) {
              uazapiToken = uazapiInstance.instance_token;
            } else {
              uazapiToken = Deno.env.get("UAZAPI_TOKEN") || undefined;
            }

            if (!uazapiUrl || !uazapiToken) {
              throw new Error("WhatsApp not configured for this account");
            }

            let phone = lead.phone.replace(/\D/g, "");
            if (!phone.startsWith("55") && phone.length <= 11) phone = "55" + phone;

            const resp = await fetch(`${uazapiUrl}/send/text`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "token": uazapiToken },
              body: JSON.stringify({ number: phone, text: msg }),
            });

            actionResult.response_status = resp.status;
            actionResult.success = resp.ok;
            if (!resp.ok) {
              const errText = await resp.text();
              throw new Error(`WhatsApp send failed (${resp.status}): ${errText.slice(0, 200)}`);
            }
          } else if (action.action_type === "create_task") {
            const config = action.action_config as { title?: string; description?: string };
            const title = replaceVariables(config?.title || "Tarefa automática", lead, columnMap, to_column_id);
            const description = config?.description ? replaceVariables(config.description, lead, columnMap, to_column_id) : null;

            const { error: taskErr } = await supabase.from("lead_tasks").insert({
              lead_id: lead_id,
              user_id: lead.account_id,
              title,
              description,
              due_at: new Date().toISOString(),
              priority: "medium",
            });
            if (taskErr) throw new Error("Failed to create task: " + taskErr.message);
            actionResult.success = true;
          } else if (action.action_type === "add_tag") {
            const config = action.action_config as { tag?: string };
            if (!config?.tag) throw new Error("No tag configured");
            const currentTags: string[] = lead.tags || [];
            if (!currentTags.includes(config.tag)) {
              const { error: tagErr } = await supabase
                .from("avivar_kanban_leads")
                .update({ tags: [...currentTags, config.tag], updated_at: new Date().toISOString() })
                .eq("id", lead_id);
              if (tagErr) throw new Error("Failed to add tag: " + tagErr.message);
            }
            actionResult.success = true;
          } else if (action.action_type === "remove_tag") {
            const config = action.action_config as { tag?: string };
            if (!config?.tag) throw new Error("No tag configured");
            const currentTags: string[] = lead.tags || [];
            const { error: tagErr } = await supabase
              .from("avivar_kanban_leads")
              .update({ tags: currentTags.filter((t: string) => t !== config.tag), updated_at: new Date().toISOString() })
              .eq("id", lead_id);
            if (tagErr) throw new Error("Failed to remove tag: " + tagErr.message);
            actionResult.success = true;
          } else if (action.action_type === "create_note") {
            const config = action.action_config as { content?: string };
            if (!config?.content) throw new Error("No note content configured");
            const noteContent = replaceVariables(config.content, lead, columnMap, to_column_id);

            // Insert as internal CRM message if conversation exists
            if (conversationId) {
              const { error: noteErr } = await supabase.from("crm_messages").insert({
                conversation_id: conversationId,
                content: noteContent,
                sender_type: "internal",
                is_internal_note: true,
              });
              if (noteErr) throw new Error("Failed to create note: " + noteErr.message);
            } else {
              // Append to lead notes
              const currentNotes = lead.notes || "";
              const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
              const newNotes = currentNotes
                ? `${currentNotes}\n\n[${timestamp}] ${noteContent}`
                : `[${timestamp}] ${noteContent}`;
              const { error: noteErr } = await supabase
                .from("avivar_kanban_leads")
                .update({ notes: newNotes, updated_at: new Date().toISOString() })
                .eq("id", lead_id);
              if (noteErr) throw new Error("Failed to create note: " + noteErr.message);
            }
            actionResult.success = true;
          } else if (action.action_type === "change_field") {
            const config = action.action_config as { field_name?: string; field_value?: string };
            if (!config?.field_name) throw new Error("No field name configured");
            const fieldValue = replaceVariables(config.field_value || "", lead, columnMap, to_column_id);

            // Check if it's a direct lead field
            const directFields = ["name", "email", "phone", "source", "notes"];
            if (directFields.includes(config.field_name)) {
              const { error: fieldErr } = await supabase
                .from("avivar_kanban_leads")
                .update({ [config.field_name]: fieldValue, updated_at: new Date().toISOString() })
                .eq("id", lead_id);
              if (fieldErr) throw new Error("Failed to update field: " + fieldErr.message);
            } else {
              // Custom field in JSONB
              const customFields = (lead.custom_fields as Record<string, any>) || {};
              customFields[config.field_name] = fieldValue;
              const { error: fieldErr } = await supabase
                .from("avivar_kanban_leads")
                .update({ custom_fields: customFields, updated_at: new Date().toISOString() })
                .eq("id", lead_id);
              if (fieldErr) throw new Error("Failed to update custom field: " + fieldErr.message);
            }
            actionResult.success = true;
          } else if (action.action_type === "change_responsible") {
            const config = action.action_config as { responsible_id?: string };
            if (!config?.responsible_id) throw new Error("No responsible ID configured");
            const { error: respErr } = await supabase
              .from("avivar_kanban_leads")
              .update({ responsible_id: config.responsible_id, updated_at: new Date().toISOString() })
              .eq("id", lead_id);
            if (respErr) throw new Error("Failed to change responsible: " + respErr.message);
            actionResult.success = true;
          } else if (action.action_type === "send_notification") {
            const config = action.action_config as { title?: string; message?: string; sound?: boolean };
            const title = replaceVariables(config?.title || "Notificação de Automação", lead, columnMap, to_column_id);
            const message = replaceVariables(config?.message || `Automação "${automation.name}" foi disparada`, lead, columnMap, to_column_id);

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
