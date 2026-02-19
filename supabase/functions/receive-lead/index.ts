import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
}

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 leads per IP per hour

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);
  
  if (!entry || now >= entry.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  entry.count++;
  return false;
}

// Input validation helpers
function validatePhone(phone: string): { valid: boolean; sanitized: string } {
  const digits = phone.replace(/\D/g, '');
  // Brazilian phone: 10-11 digits (with area code)
  if (digits.length < 10 || digits.length > 11) {
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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Rate limiting by IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    if (isRateLimited(clientIp)) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // API Token authentication via X-API-Key header
    let tokenAccountId: string | null = null;
    let tokenTargetKanbanId: string | null = null;
    let tokenTargetColumnId: string | null = null;
    const apiKey = req.headers.get('x-api-key');
    if (apiKey) {
      // Hash the token to compare
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
      
      // Update last_used_at
      await supabase
        .from('avivar_api_tokens')
        .update({ last_used_at: new Date().toISOString() } as any)
        .eq('id', tokenData[0].token_id);
      
      console.log("Authenticated via API token for account:", tokenAccountId);
    }

    let inputData: LeadData;
    try {
      inputData = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid or empty JSON body. Send a JSON object with at least 'name' and 'phone'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate required fields
    if (!inputData.name || !inputData.phone) {
      return new Response(
        JSON.stringify({ error: "Name and phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and sanitize name
    const sanitizedName = sanitizeString(inputData.name, 100);
    if (sanitizedName.length < 2) {
      return new Response(
        JSON.stringify({ error: "Name must be at least 2 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone format
    const phoneValidation = validatePhone(inputData.phone);
    if (!phoneValidation.valid) {
      return new Response(
        JSON.stringify({ error: "Invalid phone format. Must be 10 or 11 digits." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email if provided
    if (inputData.email && !validateEmail(inputData.email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Receiving new lead:", sanitizedName);

    // Insert lead into database with sanitized data
    // Note: lead_code is auto-generated by database trigger
    const leadData = {
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

    const { data: lead, error: insertError } = await supabase
      .from("leads")
      .insert(leadData as any)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting lead:", insertError);
      throw insertError;
    }

    console.log("Lead inserted:", lead.id);

    // Dispatch webhook event 'lead.created' if authenticated via API token
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
          created_at: lead.created_at,
          link: `${supabaseUrl.replace('.supabase.co', '')}/crm/lead/${lead.id}`,
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
              event: "lead.created",
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

    // Call notify-lead-arrival function to send notifications
    if (lead.state) {
      try {
        const notifyResponse = await fetch(
          `${supabaseUrl}/functions/v1/notify-lead-arrival`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ lead }),
          }
        );
        
        const notifyResult = await notifyResponse.json();
        console.log("Notification result:", notifyResult);
      } catch (notifyError) {
        console.error("Error sending notifications:", notifyError);
        // Don't fail the request if notification fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Lead received successfully",
        lead_id: lead.id
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
