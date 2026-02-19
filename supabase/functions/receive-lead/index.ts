import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

interface LeadData {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  interest_level?: string;
  procedure?: string;
  service_type?: string;
}

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10;

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);
  if (!entry || now >= entry.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) return true;
  entry.count++;
  return false;
}

function validatePhone(phone: string): { valid: boolean; sanitized: string } {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) {
    return { valid: false, sanitized: '' };
  }
  return { valid: true, sanitized: digits };
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function sanitizeString(str: string, maxLength: number): string {
  return str.trim().slice(0, maxLength).replace(/[<>]/g, '');
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('x-real-ip') || 'unknown';

  try {
    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authentication
    let tokenAccountId: string | null = null;
    let tokenTargetKanbanId: string | null = null;
    let tokenTargetColumnId: string | null = null;
    let tokenId: string | null = null;
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const slug = pathParts[pathParts.length - 1] !== 'receive-lead' ? pathParts[pathParts.length - 1] : null;
    const apiKey = req.headers.get('x-api-key') || url.searchParams.get('api_key');

    if (slug && slug.length > 0) {
      const { data: tokenData, error: tokenErr } = await supabase
        .rpc('validate_api_token_by_slug', { p_slug: slug });
      if (tokenErr || !tokenData || tokenData.length === 0) {
        return new Response(
          JSON.stringify({ error: "Invalid webhook URL" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      tokenAccountId = tokenData[0].account_id;
      tokenTargetKanbanId = tokenData[0].target_kanban_id || null;
      tokenTargetColumnId = tokenData[0].target_column_id || null;
      tokenId = tokenData[0].token_id;
      await supabase.from('avivar_api_tokens').update({ last_used_at: new Date().toISOString() } as any).eq('id', tokenId);
    } else if (apiKey) {
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const { data: tokenData, error: tokenErr } = await supabase
        .rpc('validate_api_token', { p_token_hash: tokenHash });
      if (tokenErr || !tokenData || tokenData.length === 0) {
        return new Response(
          JSON.stringify({ error: "Invalid API token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      tokenAccountId = tokenData[0].account_id;
      tokenTargetKanbanId = tokenData[0].target_kanban_id || null;
      tokenTargetColumnId = tokenData[0].target_column_id || null;
      tokenId = tokenData[0].token_id;
      await supabase.from('avivar_api_tokens').update({ last_used_at: new Date().toISOString() } as any).eq('id', tokenId);
    }

    // Parse input
    let inputData: LeadData;
    let rawBody: any = null;
    const contentType = req.headers.get('content-type') || '';

    try {
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const formText = await req.text();
        const params = new URLSearchParams(formText);
        rawBody = Object.fromEntries(params.entries());
        inputData = {
          name: params.get('name') || params.get('your-name') || params.get('field_name') || params.get('nome') || params.get('nome_completo') || params.get('full_name') || '',
          phone: params.get('phone') || params.get('your-phone') || params.get('tel') || params.get('field_phone') || params.get('whatsapp') || params.get('telefone') || params.get('celular') || '',
          email: params.get('email') || params.get('your-email') || params.get('field_email') || params.get('e-mail') || params.get('melhor_email') || undefined,
          city: params.get('city') || params.get('field_city') || params.get('cidade') || undefined,
          state: params.get('state') || params.get('field_state') || params.get('estado') || params.get('uf') || undefined,
          source: params.get('source') || 'wordpress',
          procedure: params.get('procedure') || params.get('procedimento') || params.get('qual_procedimento') || params.get('service') || params.get('servico') || undefined,
          utm_source: params.get('utm_source') || undefined,
          utm_medium: params.get('utm_medium') || undefined,
          utm_campaign: params.get('utm_campaign') || undefined,
        };
      } else if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        const entries: Record<string, string> = {};
        formData.forEach((v, k) => { entries[k] = String(v); });
        rawBody = entries;
        inputData = {
          name: (formData.get('name') || formData.get('your-name') || formData.get('nome') || formData.get('nome_completo') || '') as string,
          phone: (formData.get('phone') || formData.get('your-phone') || formData.get('tel') || formData.get('whatsapp') || formData.get('telefone') || formData.get('celular') || '') as string,
          email: (formData.get('email') || formData.get('your-email') || formData.get('e-mail') || formData.get('melhor_email') || undefined) as string | undefined,
          city: (formData.get('city') || formData.get('cidade') || undefined) as string | undefined,
          state: (formData.get('state') || formData.get('estado') || formData.get('uf') || undefined) as string | undefined,
          source: (formData.get('source') || 'wordpress') as string,
          procedure: (formData.get('procedure') || formData.get('procedimento') || formData.get('qual_procedimento') || formData.get('service') || formData.get('servico') || undefined) as string | undefined,
        };
      } else {
        rawBody = await req.json();
        inputData = {
          name: rawBody.name || rawBody.nome || rawBody.nome_completo || rawBody.full_name || '',
          phone: rawBody.phone || rawBody.whatsapp || rawBody.telefone || rawBody.celular || rawBody.tel || '',
          email: rawBody.email || rawBody['e-mail'] || rawBody.melhor_email || undefined,
          city: rawBody.city || rawBody.cidade || undefined,
          state: rawBody.state || rawBody.estado || rawBody.uf || undefined,
          source: rawBody.source || rawBody.origem || 'api',
          procedure: rawBody.procedure || rawBody.procedimento || rawBody.qual_procedimento || rawBody.service || rawBody.servico || rawBody.service_type || undefined,
          utm_source: rawBody.utm_source || undefined,
          utm_medium: rawBody.utm_medium || undefined,
          utm_campaign: rawBody.utm_campaign || undefined,
          interest_level: rawBody.interest_level || undefined,
        };
      }
    } catch {
      // Log failed parse
      if (tokenAccountId) {
        await supabase.from('avivar_webhook_request_logs').insert({
          account_id: tokenAccountId,
          token_id: tokenId,
          webhook_slug: slug,
          method: req.method,
          request_headers: Object.fromEntries(req.headers.entries()),
          request_body: null,
          response_status: 400,
          response_body: { error: "Invalid request body" },
          lead_action: 'error',
          ip_address: clientIp,
        } as any);
      }
      return new Response(
        JSON.stringify({ error: "Invalid request body. Send JSON, form-urlencoded, or multipart form data with at least 'name' and 'phone'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    if (!inputData.name || !inputData.phone) {
      if (tokenAccountId) {
        await supabase.from('avivar_webhook_request_logs').insert({
          account_id: tokenAccountId, token_id: tokenId, webhook_slug: slug,
          method: req.method, request_body: rawBody, response_status: 400,
          response_body: { error: "Name and phone are required" },
          lead_action: 'error', ip_address: clientIp,
        } as any);
      }
      return new Response(
        JSON.stringify({ error: "Name and phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitizedName = sanitizeString(inputData.name, 100);
    if (sanitizedName.length < 2) {
      return new Response(
        JSON.stringify({ error: "Name must be at least 2 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const phoneValidation = validatePhone(inputData.phone);
    if (!phoneValidation.valid) {
      return new Response(
        JSON.stringify({ error: "Invalid phone format. Must be 10-13 digits." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (inputData.email && !validateEmail(inputData.email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Receiving lead:", sanitizedName, "phone:", phoneValidation.sanitized);

    // ── Deduplication: check by phone first, then by email ──
    let existingLead: any = null;
    let leadAction: 'created' | 'updated' = 'created';

    // Check by phone
    const { data: phoneMatch } = await supabase
      .from("leads")
      .select("*")
      .eq("phone", phoneValidation.sanitized)
      .limit(1)
      .maybeSingle();

    if (phoneMatch) {
      existingLead = phoneMatch;
    } else if (inputData.email) {
      // Check by email
      const { data: emailMatch } = await supabase
        .from("leads")
        .select("*")
        .eq("email", inputData.email.trim().toLowerCase())
        .limit(1)
        .maybeSingle();
      if (emailMatch) {
        existingLead = emailMatch;
      }
    }

    let lead: any;

    if (existingLead) {
      // Update existing lead with new data (merge, don't overwrite nulls)
      leadAction = 'updated';
      const updateData: Record<string, any> = {};
      if (sanitizedName && sanitizedName !== existingLead.name) updateData.name = sanitizedName;
      if (inputData.email && !existingLead.email) updateData.email = inputData.email.trim().slice(0, 255);
      if (inputData.city && !existingLead.city) updateData.city = sanitizeString(inputData.city, 100);
      if (inputData.state && !existingLead.state) updateData.state = sanitizeString(inputData.state, 2).toUpperCase();
      if (inputData.procedure) updateData.notes = [existingLead.notes, `Procedimento: ${sanitizeString(inputData.procedure, 200)}`].filter(Boolean).join('\n');
      if (inputData.utm_source) updateData.utm_source = sanitizeString(inputData.utm_source, 100);
      if (inputData.utm_medium) updateData.utm_medium = sanitizeString(inputData.utm_medium, 100);
      if (inputData.utm_campaign) updateData.utm_campaign = sanitizeString(inputData.utm_campaign, 100);

      if (Object.keys(updateData).length > 0) {
        const { data: updated, error: updateErr } = await supabase
          .from("leads")
          .update(updateData)
          .eq("id", existingLead.id)
          .select()
          .single();
        if (updateErr) {
          console.error("Error updating lead:", updateErr);
          lead = existingLead;
        } else {
          lead = updated;
        }
      } else {
        lead = existingLead;
      }
      console.log("Lead deduplicated (updated):", lead.id);
    } else {
      // Create new lead
      const leadData: Record<string, any> = {
        name: sanitizedName,
        phone: phoneValidation.sanitized,
        email: inputData.email ? inputData.email.trim().slice(0, 255) : null,
        city: inputData.city ? sanitizeString(inputData.city, 100) : null,
        state: inputData.state ? sanitizeString(inputData.state, 2).toUpperCase() : null,
        source: inputData.source ? sanitizeString(inputData.source, 50) : "landing_page",
        utm_source: inputData.utm_source ? sanitizeString(inputData.utm_source, 100) : null,
        utm_medium: inputData.utm_medium ? sanitizeString(inputData.utm_medium, 100) : null,
        utm_campaign: inputData.utm_campaign ? sanitizeString(inputData.utm_campaign, 100) : null,
        interest_level: inputData.interest_level ? sanitizeString(inputData.interest_level, 20) : "warm",
        status: "new",
        available_at: new Date().toISOString(),
      };

      // Add procedure to notes
      if (inputData.procedure) {
        leadData.notes = `Procedimento: ${sanitizeString(inputData.procedure, 200)}`;
      }

      const { data: newLead, error: insertError } = await supabase
        .from("leads")
        .insert(leadData as any)
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting lead:", insertError);
        throw insertError;
      }
      lead = newLead;
      console.log("Lead created:", lead.id);
    }

    // Auto-create kanban lead if token has target funnel (only for new leads)
    if (tokenAccountId && tokenTargetKanbanId && tokenTargetColumnId && leadAction === 'created') {
      try {
        // Check if kanban lead already exists
        const { data: existingKanbanLead } = await supabase
          .from("avivar_kanban_leads")
          .select("id")
          .eq("account_id", tokenAccountId)
          .eq("kanban_id", tokenTargetKanbanId)
          .or(`phone.eq.${phoneValidation.sanitized},email.eq.${inputData.email || ''}`)
          .limit(1)
          .maybeSingle();

        if (!existingKanbanLead) {
          const { error: kanbanError } = await supabase
            .from("avivar_kanban_leads")
            .insert({
              account_id: tokenAccountId,
              kanban_id: tokenTargetKanbanId,
              column_id: tokenTargetColumnId,
              name: lead.name,
              phone: lead.phone,
              email: lead.email || null,
              lead_code: lead.lead_code,
              source: lead.source || 'api',
              notes: inputData.procedure ? `Procedimento: ${sanitizeString(inputData.procedure, 200)}` : null,
              user_id: (await supabase.from('avivar_accounts').select('owner_user_id').eq('id', tokenAccountId).single()).data?.owner_user_id,
            } as any);
          if (kanbanError) console.error("Error creating kanban lead:", kanbanError);
          else console.log("Kanban lead created in funnel:", tokenTargetKanbanId);
        }
      } catch (kanbanErr) {
        console.error("Error creating kanban lead:", kanbanErr);
      }
    }

    // Dispatch webhook event
    if (tokenAccountId) {
      try {
        const webhookPayload = {
          lead_id: lead.id,
          lead_code: lead.lead_code,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          city: lead.city,
          state: lead.state,
          source: lead.source,
          interest_level: lead.interest_level,
          procedure: inputData.procedure || null,
          action: leadAction,
          created_at: lead.created_at,
        };
        const dispatchResp = await fetch(
          `${supabaseUrl}/functions/v1/avivar-webhook-dispatch`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              event: leadAction === 'created' ? "lead.created" : "lead.updated",
              account_id: tokenAccountId,
              payload: webhookPayload,
            }),
          }
        );
        console.log("Webhook dispatch result:", await dispatchResp.json());
      } catch (whErr) {
        console.error("Error dispatching webhook:", whErr);
      }
    }

    // Notify lead arrival (for new leads)
    if (leadAction === 'created' && lead.state) {
      try {
        await fetch(
          `${supabaseUrl}/functions/v1/notify-lead-arrival`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
            body: JSON.stringify({ lead }),
          }
        );
      } catch (notifyError) {
        console.error("Error sending notifications:", notifyError);
      }
    }

    const responseBody = {
      success: true,
      message: leadAction === 'created' ? "Lead received successfully" : "Lead updated (deduplicated)",
      lead_id: lead.id,
      action: leadAction,
    };

    // Log the request
    if (tokenAccountId) {
      await supabase.from('avivar_webhook_request_logs').insert({
        account_id: tokenAccountId,
        token_id: tokenId,
        webhook_slug: slug,
        method: req.method,
        request_body: rawBody,
        response_status: leadAction === 'created' ? 201 : 200,
        response_body: responseBody,
        lead_id: lead.id,
        lead_action: leadAction,
        ip_address: clientIp,
      } as any);
    }

    return new Response(
      JSON.stringify(responseBody),
      { status: leadAction === 'created' ? 201 : 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in receive-lead:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
