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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const leadData: LeadData = await req.json();
    
    // Validate required fields
    if (!leadData.name || !leadData.phone) {
      return new Response(
        JSON.stringify({ error: "Name and phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Receiving new lead:", leadData.name, leadData.phone);

    // Insert lead into database
    const { data: lead, error: insertError } = await supabase
      .from("leads")
      .insert({
        name: leadData.name,
        phone: leadData.phone,
        email: leadData.email || null,
        city: leadData.city || null,
        state: leadData.state || null,
        source: leadData.source || "landing_page",
        utm_source: leadData.utm_source || null,
        utm_medium: leadData.utm_medium || null,
        utm_campaign: leadData.utm_campaign || null,
        interest_level: leadData.interest_level || "warm",
        status: "new",
        available_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting lead:", insertError);
      throw insertError;
    }

    console.log("Lead inserted:", lead.id);

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
