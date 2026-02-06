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
      .select("id, name, phone");

    if (error) {
      console.error("[hotleads-ingest] DB insert error:", error);
      return new Response(
        JSON.stringify({ error: "Database insert failed", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[hotleads-ingest] Inserted ${data.length} leads from n8n`);

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
