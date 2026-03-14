// ============================================
// Kommo Sync Edge Function - Batch + Progress
// ============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYNC_STEPS = [
  { key: "pipelines", label: "Funis e Etapas" },
  { key: "users", label: "Usuários" },
  { key: "leads", label: "Leads" },
  { key: "contacts", label: "Contatos" },
  { key: "tasks", label: "Tarefas" },
  { key: "custom_fields", label: "Campos Personalizados" },
  { key: "loss_reasons", label: "Motivos de Perda" },
];

class KommoAPI {
  private baseUrl: string;
  private token: string;

  constructor(subdomain: string, token: string) {
    this.baseUrl = `https://${subdomain}.kommo.com/api/v4`;
    this.token = token;
  }

  private async request(endpoint: string, params?: Record<string, string>) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Kommo API ${endpoint} [${res.status}]: ${text}`);
    }
    return await res.json();
  }

  private async fetchAll(endpoint: string, embeddedKey: string, params?: Record<string, string>) {
    let results: any[] = [];
    let page = 1;
    while (true) {
      const data = await this.request(endpoint, { ...params, limit: "250", page: String(page) });
      const items = data?._embedded?.[embeddedKey] || [];
      results = results.concat(items);
      if (!data?._links?.next || items.length < 250) break;
      page++;
    }
    return results;
  }

  async getPipelines() { return (await this.request("/leads/pipelines"))?._embedded?.pipelines || []; }
  async getUsers() { return this.fetchAll("/users", "users"); }
  async getLeads() { return this.fetchAll("/leads", "leads"); }
  async getContacts() { return this.fetchAll("/contacts", "contacts"); }
  async getTasks() { return this.fetchAll("/tasks", "tasks"); }
  async getCustomFields(entityType: string) { return (await this.request(`/${entityType}/custom_fields`))?._embedded?.custom_fields || []; }
  async getLossReasons() { try { return (await this.request("/leads/loss_reasons"))?._embedded?.loss_reasons || []; } catch { return []; } }
}

async function batchUpsert(supabase: any, table: string, rows: any[], onConflict: string, batchSize = 100) {
  if (rows.length === 0) return;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

async function updateProgress(supabase: any, syncLogId: string, stepIndex: number, entity: string, recordsSynced: Record<string, number>) {
  const totalSteps = SYNC_STEPS.length;
  const percent = Math.round(((stepIndex + 1) / totalSteps) * 100);
  await supabase.from("kommo_sync_logs").update({
    progress: { current_step: stepIndex + 1, total_steps: totalSteps, current_entity: entity, percent },
    records_synced: recordsSynced,
  }).eq("id", syncLogId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const kommoToken = Deno.env.get("KOMMO_API_TOKEN");
    const kommoSubdomain = Deno.env.get("KOMMO_SUBDOMAIN");

    if (!kommoToken || !kommoSubdomain) {
      return new Response(JSON.stringify({ error: "Kommo credentials not configured. Set KOMMO_API_TOKEN and KOMMO_SUBDOMAIN secrets." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Auth: validate user token if present, but allow service calls too
    const authHeader = req.headers.get("Authorization");
    let userId = "system";
    if (authHeader?.startsWith("Bearer ")) {
      const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
      const { data: userData } = await supabaseAuth.auth.getUser();
      if (userData?.user?.id) {
        userId = userData.user.id;
      }
    }

    let syncType = "full";
    let entities: string[] = [];
    try { const body = await req.json(); syncType = body.syncType || "full"; entities = body.entities || []; } catch {}

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const kommo = new KommoAPI(kommoSubdomain, kommoToken);
    const now = new Date().toISOString();

    const { data: syncLog } = await supabase
      .from("kommo_sync_logs")
      .insert({
        sync_type: syncType, status: "running", started_at: now,
        progress: { current_step: 0, total_steps: SYNC_STEPS.length, current_entity: "Iniciando...", percent: 0 },
      })
      .select().single();

    const syncLogId = syncLog?.id;
    const recordsSynced: Record<string, number> = {};
    const shouldSync = (entity: string) => syncType === "full" || entities.includes(entity);

    try {
      // 1. Pipelines & Stages
      if (shouldSync("pipelines")) {
        const pipelines = await kommo.getPipelines();
        const pipelineRows = pipelines.map((p: any) => ({ kommo_id: p.id, name: p.name, sort: p.sort || 0, is_main: p.is_main || false, is_active: true, raw_data: p, synced_at: now }));
        await batchUpsert(supabase, "kommo_pipelines", pipelineRows, "kommo_id");

        const stageMap = new Map<string, any>();
        for (const p of pipelines) {
          for (const s of (p._embedded?.statuses || [])) {
            const closeType = s.id === 142 ? "won" : s.id === 143 ? "lost" : null;
            // Use composite key to handle shared statuses (142/143) across pipelines
            const key = `${s.id}_${p.id}`;
            stageMap.set(key, { kommo_id: s.id, pipeline_kommo_id: p.id, name: s.name, sort: s.sort || 0, color: s.color || null, is_closed: closeType !== null, close_type: closeType, raw_data: s, synced_at: now });
          }
        }
        const stageRows = Array.from(stageMap.values());
        // Upsert stages one pipeline at a time to avoid ON CONFLICT issues with shared kommo_ids
        const pipelineGroups = new Map<number, any[]>();
        for (const row of stageRows) {
          const group = pipelineGroups.get(row.pipeline_kommo_id) || [];
          group.push(row);
          pipelineGroups.set(row.pipeline_kommo_id, group);
        }
        for (const [, group] of pipelineGroups) {
          await batchUpsert(supabase, "kommo_pipeline_stages", group, "kommo_id");
        }
        recordsSynced.pipelines = pipelines.length;
        recordsSynced.stages = stageRows.length;
      }
      await updateProgress(supabase, syncLogId, 0, "Funis e Etapas", recordsSynced);

      // 2. Users
      if (shouldSync("users")) {
        const users = await kommo.getUsers();
        const userRows = users.map((u: any) => ({ kommo_id: u.id, name: u.name, email: u.email || null, role: u.rights?.is_admin ? "admin" : "user", is_active: true, raw_data: u, synced_at: now }));
        await batchUpsert(supabase, "kommo_users", userRows, "kommo_id");
        recordsSynced.users = users.length;
      }
      await updateProgress(supabase, syncLogId, 1, "Usuários", recordsSynced);

      // 3. Leads
      if (shouldSync("leads")) {
        const leads = await kommo.getLeads();
        const leadRows: any[] = [];
        const leadContactRows: any[] = [];
        for (const l of leads) {
          const tags = l._embedded?.tags?.map((t: any) => t.name) || [];
          const lossReason = l._embedded?.loss_reason?.[0]?.name || null;
          let source = null, sourceName = null;
          if (l._embedded?.source) { source = l._embedded.source.type; sourceName = l._embedded.source.name; }
          const customFields: Record<string, any> = {};
          let utmSource = null, utmMedium = null, utmCampaign = null, utmContent = null, utmTerm = null;
          if (l.custom_fields_values) {
            for (const cf of l.custom_fields_values) {
              customFields[cf.field_id] = { name: cf.field_name, values: cf.values };
              const fname = cf.field_name?.toLowerCase() || "";
              const val = cf.values?.[0]?.value;
              if (fname.includes("utm_source")) utmSource = val;
              if (fname.includes("utm_medium")) utmMedium = val;
              if (fname.includes("utm_campaign")) utmCampaign = val;
              if (fname.includes("utm_content")) utmContent = val;
              if (fname.includes("utm_term")) utmTerm = val;
            }
          }
          const isWon = l.status_id === 142;
          const isLost = l.status_id === 143;
          leadRows.push({
            kommo_id: l.id, name: l.name || null, price: l.price || 0,
            pipeline_kommo_id: l.pipeline_id || null, stage_kommo_id: l.status_id || null,
            responsible_user_kommo_id: l.responsible_user_id || null, status_id: l.status_id || null,
            loss_reason: lossReason, source, source_name: sourceName, tags,
            is_won: isWon, is_lost: isLost,
            closed_at: (isWon || isLost) && l.closed_at ? new Date(l.closed_at * 1000).toISOString() : null,
            created_at_kommo: l.created_at ? new Date(l.created_at * 1000).toISOString() : null,
            updated_at_kommo: l.updated_at ? new Date(l.updated_at * 1000).toISOString() : null,
            custom_fields: customFields, utm_source: utmSource, utm_medium: utmMedium,
            utm_campaign: utmCampaign, utm_content: utmContent, utm_term: utmTerm,
            raw_data: l, synced_at: now,
          });
          for (const c of (l._embedded?.contacts || [])) {
            leadContactRows.push({ lead_kommo_id: l.id, contact_kommo_id: c.id, is_main: c.is_main || false });
          }
        }
        await batchUpsert(supabase, "kommo_leads", leadRows, "kommo_id");
        await batchUpsert(supabase, "kommo_lead_contacts", leadContactRows, "lead_kommo_id,contact_kommo_id");
        recordsSynced.leads = leads.length;
      }
      await updateProgress(supabase, syncLogId, 2, "Leads", recordsSynced);

      // 4. Contacts
      if (shouldSync("contacts")) {
        const contacts = await kommo.getContacts();
        const contactRows = contacts.map((c: any) => {
          const tags = c._embedded?.tags?.map((t: any) => t.name) || [];
          let email = null, phone = null;
          const customFields: Record<string, any> = {};
          if (c.custom_fields_values) {
            for (const cf of c.custom_fields_values) {
              customFields[cf.field_id] = { name: cf.field_name, values: cf.values };
              if (cf.field_code === "EMAIL") email = cf.values?.[0]?.value;
              if (cf.field_code === "PHONE") phone = cf.values?.[0]?.value;
            }
          }
          return { kommo_id: c.id, name: c.name || null, first_name: c.first_name || null, last_name: c.last_name || null, email, phone, company: c._embedded?.companies?.[0]?.name || null, responsible_user_kommo_id: c.responsible_user_id || null, tags, custom_fields: customFields, raw_data: c, synced_at: now };
        });
        await batchUpsert(supabase, "kommo_contacts", contactRows, "kommo_id");
        recordsSynced.contacts = contacts.length;
      }
      await updateProgress(supabase, syncLogId, 3, "Contatos", recordsSynced);

      // 5. Tasks
      if (shouldSync("tasks")) {
        const tasks = await kommo.getTasks();
        const taskRows = tasks.map((t: any) => ({
          kommo_id: t.id, lead_kommo_id: t.entity_id || null, responsible_user_kommo_id: t.responsible_user_id || null,
          task_type: t.task_type_id ? String(t.task_type_id) : null, text: t.text || null,
          is_completed: t.is_completed || false, result_text: t.result?.text || null, duration: t.duration || null,
          complete_till: t.complete_till ? new Date(t.complete_till * 1000).toISOString() : null,
          completed_at: t.is_completed && t.updated_at ? new Date(t.updated_at * 1000).toISOString() : null,
          created_at_kommo: t.created_at ? new Date(t.created_at * 1000).toISOString() : null,
          raw_data: t, synced_at: now,
        }));
        await batchUpsert(supabase, "kommo_tasks", taskRows, "kommo_id");
        recordsSynced.tasks = tasks.length;
      }
      await updateProgress(supabase, syncLogId, 4, "Tarefas", recordsSynced);

      // 6. Custom Fields
      if (shouldSync("custom_fields")) {
        for (const entityType of ["leads", "contacts", "companies"]) {
          const fields = await kommo.getCustomFields(entityType);
          const fieldRows = fields.map((f: any) => ({ kommo_id: f.id, entity_type: entityType, name: f.name, field_type: f.type, enums: f.enums || null, is_active: true, synced_at: now }));
          await batchUpsert(supabase, "kommo_custom_fields", fieldRows, "kommo_id,entity_type");
          recordsSynced[`custom_fields_${entityType}`] = fields.length;
        }
      }
      await updateProgress(supabase, syncLogId, 5, "Campos Personalizados", recordsSynced);

      // 7. Loss Reasons
      if (shouldSync("loss_reasons")) {
        const reasons = await kommo.getLossReasons();
        const reasonRows = reasons.map((r: any) => ({ kommo_id: r.id, name: r.name, sort: r.sort || 0, synced_at: now }));
        await batchUpsert(supabase, "kommo_loss_reasons", reasonRows, "kommo_id");
        recordsSynced.loss_reasons = reasons.length;
      }
      await updateProgress(supabase, syncLogId, 6, "Concluído!", recordsSynced);

      // Final update
      const durationMs = Date.now() - startTime;
      await supabase.from("kommo_sync_logs").update({
        status: "completed", completed_at: new Date().toISOString(),
        records_synced: recordsSynced, duration_ms: durationMs,
        progress: { current_step: 7, total_steps: 7, current_entity: "Concluído!", percent: 100 },
      }).eq("id", syncLogId);

      // Update sync config
      const { data: existingConfig } = await supabase.from("kommo_sync_config").select("id").eq("subdomain", kommoSubdomain).maybeSingle();
      if (existingConfig) {
        await supabase.from("kommo_sync_config").update({ last_sync_at: new Date().toISOString(), last_sync_status: "success", last_sync_error: null }).eq("id", existingConfig.id);
      } else {
        await supabase.from("kommo_sync_config").insert({ subdomain: kommoSubdomain, is_active: true, last_sync_at: new Date().toISOString(), last_sync_status: "success", created_by: userId });
      }

      console.log(`[kommo-sync] ✅ Done in ${durationMs}ms`, recordsSynced);
      return new Response(JSON.stringify({ success: true, syncType, recordsSynced, durationMs }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (syncError: any) {
      console.error("[kommo-sync] Error:", syncError.message);
      await supabase.from("kommo_sync_logs").update({
        status: "failed", completed_at: new Date().toISOString(),
        error_message: syncError.message, duration_ms: Date.now() - startTime,
        progress: { current_step: -1, total_steps: 7, current_entity: `Erro: ${syncError.message}`, percent: -1 },
      }).eq("id", syncLogId);
      throw syncError;
    }
  } catch (error: any) {
    console.error("[kommo-sync] Fatal:", error.message);
    return new Response(JSON.stringify({ error: error.message || "Sync failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
