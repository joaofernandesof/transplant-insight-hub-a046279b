import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Kommo API helper
class KommoAPI {
  private baseUrl: string;
  private token: string;

  constructor(subdomain: string, token: string) {
    this.baseUrl = `https://${subdomain}.kommo.com/api/v4`;
    this.token = token;
  }

  private async request(endpoint: string, params?: Record<string, string>) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Kommo API ${endpoint} failed [${res.status}]: ${text}`);
    }

    const data = await res.json();
    return data;
  }

  // Paginated fetch - Kommo uses _embedded and _links
  private async fetchAll(endpoint: string, embeddedKey: string, params?: Record<string, string>) {
    let results: any[] = [];
    let page = 1;
    const limit = "250";

    while (true) {
      const data = await this.request(endpoint, { ...params, limit, page: String(page) });
      const items = data?._embedded?.[embeddedKey] || [];
      results = results.concat(items);

      if (!data?._links?.next || items.length < 250) break;
      page++;
    }

    return results;
  }

  async getPipelines() {
    const data = await this.request("/leads/pipelines");
    return data?._embedded?.pipelines || [];
  }

  async getUsers() {
    return this.fetchAll("/users", "users");
  }

  async getLeads(updatedAfter?: number) {
    const params: Record<string, string> = {};
    if (updatedAfter) {
      params["filter[updated_at][from]"] = String(updatedAfter);
    }
    return this.fetchAll("/leads", "leads", params);
  }

  async getContacts(updatedAfter?: number) {
    const params: Record<string, string> = {};
    if (updatedAfter) {
      params["filter[updated_at][from]"] = String(updatedAfter);
    }
    return this.fetchAll("/contacts", "contacts", params);
  }

  async getTasks(updatedAfter?: number) {
    const params: Record<string, string> = {};
    if (updatedAfter) {
      params["filter[updated_at][from]"] = String(updatedAfter);
    }
    return this.fetchAll("/tasks", "tasks", params);
  }

  async getCustomFields(entityType: string) {
    const data = await this.request(`/${entityType}/custom_fields`);
    return data?._embedded?.custom_fields || [];
  }

  async getLossReasons() {
    try {
      const data = await this.request("/leads/loss_reasons");
      return data?._embedded?.loss_reasons || [];
    } catch {
      return [];
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const kommoToken = Deno.env.get("KOMMO_API_TOKEN");
    const kommoSubdomain = Deno.env.get("KOMMO_SUBDOMAIN");

    if (!kommoToken || !kommoSubdomain) {
      return new Response(
        JSON.stringify({ error: "Kommo credentials not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate user
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Parse body for sync options
    let syncType = "full";
    let entities: string[] = [];
    try {
      const body = await req.json();
      syncType = body.syncType || "full";
      entities = body.entities || [];
    } catch {
      // default full sync
    }

    // Use service role for writes
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const kommo = new KommoAPI(kommoSubdomain, kommoToken);

    // Create sync log
    const { data: syncLog } = await supabase
      .from("kommo_sync_logs")
      .insert({
        sync_type: syncType,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    const syncLogId = syncLog?.id;
    const recordsSynced: Record<string, number> = {};

    try {
      const shouldSync = (entity: string) =>
        syncType === "full" || entities.includes(entity);

      // 1. Pipelines & Stages
      if (shouldSync("pipelines")) {
        const pipelines = await kommo.getPipelines();
        for (const p of pipelines) {
          await supabase.from("kommo_pipelines").upsert(
            {
              kommo_id: p.id,
              name: p.name,
              sort: p.sort || 0,
              is_main: p.is_main || false,
              is_active: true,
              raw_data: p,
              synced_at: new Date().toISOString(),
            },
            { onConflict: "kommo_id" }
          );

          // Stages
          const statuses = p._embedded?.statuses || [];
          for (const s of statuses) {
            const closeType =
              s.id === 142 ? "won" : s.id === 143 ? "lost" : null;
            await supabase.from("kommo_pipeline_stages").upsert(
              {
                kommo_id: s.id,
                pipeline_kommo_id: p.id,
                name: s.name,
                sort: s.sort || 0,
                color: s.color,
                is_closed: closeType !== null,
                close_type: closeType,
                raw_data: s,
                synced_at: new Date().toISOString(),
              },
              { onConflict: "kommo_id" }
            );
          }
        }
        recordsSynced.pipelines = pipelines.length;
      }

      // 2. Users
      if (shouldSync("users")) {
        const users = await kommo.getUsers();
        for (const u of users) {
          await supabase.from("kommo_users").upsert(
            {
              kommo_id: u.id,
              name: u.name,
              email: u.email,
              role: u.rights?.is_admin ? "admin" : "user",
              is_active: true,
              raw_data: u,
              synced_at: new Date().toISOString(),
            },
            { onConflict: "kommo_id" }
          );
        }
        recordsSynced.users = users.length;
      }

      // 3. Leads
      if (shouldSync("leads")) {
        const leads = await kommo.getLeads();
        for (const l of leads) {
          const tags = l._embedded?.tags?.map((t: any) => t.name) || [];
          const lossReason =
            l._embedded?.loss_reason?.[0]?.name || null;

          // Extract source from custom fields or embedded
          let source = null;
          let sourceName = null;
          if (l._embedded?.source) {
            source = l._embedded.source.type;
            sourceName = l._embedded.source.name;
          }

          // Extract UTMs from custom fields
          const customFields: Record<string, any> = {};
          let utmSource = null, utmMedium = null, utmCampaign = null, utmContent = null, utmTerm = null;

          if (l.custom_fields_values) {
            for (const cf of l.custom_fields_values) {
              customFields[cf.field_id] = {
                name: cf.field_name,
                values: cf.values,
              };
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

          await supabase.from("kommo_leads").upsert(
            {
              kommo_id: l.id,
              name: l.name,
              price: l.price || 0,
              pipeline_kommo_id: l.pipeline_id,
              stage_kommo_id: l.status_id,
              responsible_user_kommo_id: l.responsible_user_id,
              status_id: l.status_id,
              loss_reason: lossReason,
              source,
              source_name: sourceName,
              tags,
              is_won: isWon,
              is_lost: isLost,
              closed_at: isWon || isLost ? new Date(l.closed_at * 1000).toISOString() : null,
              created_at_kommo: new Date(l.created_at * 1000).toISOString(),
              updated_at_kommo: new Date(l.updated_at * 1000).toISOString(),
              custom_fields: customFields,
              utm_source: utmSource,
              utm_medium: utmMedium,
              utm_campaign: utmCampaign,
              utm_content: utmContent,
              utm_term: utmTerm,
              raw_data: l,
              synced_at: new Date().toISOString(),
            },
            { onConflict: "kommo_id" }
          );

          // Lead-Contact relationships
          const contacts = l._embedded?.contacts || [];
          for (const c of contacts) {
            await supabase.from("kommo_lead_contacts").upsert(
              {
                lead_kommo_id: l.id,
                contact_kommo_id: c.id,
                is_main: c.is_main || false,
              },
              { onConflict: "lead_kommo_id,contact_kommo_id" }
            );
          }
        }
        recordsSynced.leads = leads.length;
      }

      // 4. Contacts
      if (shouldSync("contacts")) {
        const contacts = await kommo.getContacts();
        for (const c of contacts) {
          const tags = c._embedded?.tags?.map((t: any) => t.name) || [];
          let email = null, phone = null;
          const customFields: Record<string, any> = {};

          if (c.custom_fields_values) {
            for (const cf of c.custom_fields_values) {
              customFields[cf.field_id] = {
                name: cf.field_name,
                values: cf.values,
              };
              if (cf.field_code === "EMAIL") email = cf.values?.[0]?.value;
              if (cf.field_code === "PHONE") phone = cf.values?.[0]?.value;
            }
          }

          await supabase.from("kommo_contacts").upsert(
            {
              kommo_id: c.id,
              name: c.name,
              first_name: c.first_name,
              last_name: c.last_name,
              email,
              phone,
              company: c._embedded?.companies?.[0]?.name || null,
              responsible_user_kommo_id: c.responsible_user_id,
              tags,
              custom_fields: customFields,
              raw_data: c,
              synced_at: new Date().toISOString(),
            },
            { onConflict: "kommo_id" }
          );
        }
        recordsSynced.contacts = contacts.length;
      }

      // 5. Tasks
      if (shouldSync("tasks")) {
        const tasks = await kommo.getTasks();
        for (const t of tasks) {
          await supabase.from("kommo_tasks").upsert(
            {
              kommo_id: t.id,
              lead_kommo_id: t.entity_id || null,
              responsible_user_kommo_id: t.responsible_user_id,
              task_type: t.task_type_id ? String(t.task_type_id) : null,
              text: t.text,
              is_completed: t.is_completed || false,
              result_text: t.result?.text || null,
              duration: t.duration || null,
              complete_till: t.complete_till
                ? new Date(t.complete_till * 1000).toISOString()
                : null,
              completed_at: t.is_completed && t.updated_at
                ? new Date(t.updated_at * 1000).toISOString()
                : null,
              created_at_kommo: new Date(t.created_at * 1000).toISOString(),
              raw_data: t,
              synced_at: new Date().toISOString(),
            },
            { onConflict: "kommo_id" }
          );
        }
        recordsSynced.tasks = tasks.length;
      }

      // 6. Custom Fields
      if (shouldSync("custom_fields")) {
        for (const entityType of ["leads", "contacts", "companies"]) {
          const fields = await kommo.getCustomFields(entityType);
          for (const f of fields) {
            await supabase.from("kommo_custom_fields").upsert(
              {
                kommo_id: f.id,
                entity_type: entityType,
                name: f.name,
                field_type: f.type,
                enums: f.enums || null,
                is_active: true,
                synced_at: new Date().toISOString(),
              },
              { onConflict: "kommo_id,entity_type" }
            );
          }
          recordsSynced[`custom_fields_${entityType}`] = fields.length;
        }
      }

      // 7. Loss Reasons
      if (shouldSync("loss_reasons")) {
        const reasons = await kommo.getLossReasons();
        for (const r of reasons) {
          await supabase.from("kommo_loss_reasons").upsert(
            {
              kommo_id: r.id,
              name: r.name,
              sort: r.sort || 0,
              synced_at: new Date().toISOString(),
            },
            { onConflict: "kommo_id" }
          );
        }
        recordsSynced.loss_reasons = reasons.length;
      }

      // Update sync log - success
      const durationMs = Date.now() - startTime;
      await supabase
        .from("kommo_sync_logs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          records_synced: recordsSynced,
          duration_ms: durationMs,
        })
        .eq("id", syncLogId);

      // Update sync config
      await supabase
        .from("kommo_sync_config")
        .upsert(
          {
            subdomain: kommoSubdomain,
            is_active: true,
            last_sync_at: new Date().toISOString(),
            last_sync_status: "success",
            last_sync_error: null,
            created_by: userId,
          },
          { onConflict: "subdomain" }
        )
        .select();

      // If no config exists with subdomain conflict, insert fresh
      const { data: existingConfig } = await supabase
        .from("kommo_sync_config")
        .select("id")
        .eq("subdomain", kommoSubdomain)
        .maybeSingle();

      if (!existingConfig) {
        await supabase.from("kommo_sync_config").insert({
          subdomain: kommoSubdomain,
          is_active: true,
          last_sync_at: new Date().toISOString(),
          last_sync_status: "success",
          created_by: userId,
        });
      } else {
        await supabase
          .from("kommo_sync_config")
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: "success",
            last_sync_error: null,
          })
          .eq("id", existingConfig.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          syncType,
          recordsSynced,
          durationMs,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (syncError: any) {
      // Update sync log - failure
      await supabase
        .from("kommo_sync_logs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: syncError.message,
          duration_ms: Date.now() - startTime,
        })
        .eq("id", syncLogId);

      throw syncError;
    }
  } catch (error: any) {
    console.error("Kommo sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Sync failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
