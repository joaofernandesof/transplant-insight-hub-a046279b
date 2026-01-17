import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadPayload {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  source?: string;
  created_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use service role to bypass RLS for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { lead } = await req.json() as { lead: LeadPayload };
    
    if (!lead) {
      console.log("No lead data provided");
      return new Response(
        JSON.stringify({ error: "Lead data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing lead notification for:", lead.name, "State:", lead.state);

    // If lead has no state, we can't notify anyone
    if (!lead.state) {
      console.log("Lead has no state, skipping notification");
      return new Response(
        JSON.stringify({ message: "Lead has no state, no notifications sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find all licensees from the same state
    const { data: matchingProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, name, state")
      .eq("state", lead.state);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Found ${matchingProfiles?.length || 0} licensees in state ${lead.state}`);

    if (!matchingProfiles || matchingProfiles.length === 0) {
      return new Response(
        JSON.stringify({ message: "No licensees found in this state" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter out admins - only notify licensees
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);
    const licenseeProfiles = matchingProfiles.filter(p => !adminUserIds.has(p.user_id));

    if (licenseeProfiles.length === 0) {
      console.log("No licensees to notify (all matching users are admins)");
      return new Response(
        JSON.stringify({ message: "No licensees to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the notification
    const notificationContent = `Novo lead disponível em ${lead.city || lead.state}! ${lead.name} está interessado em seus serviços. Você tem 1 hora de prioridade para capturar este lead.`;
    
    const { data: notification, error: notificationError } = await supabase
      .from("notifications")
      .insert({
        title: `🔥 Novo HotLead em ${lead.state}!`,
        content: notificationContent,
        content_html: `
          <div>
            <p><strong>Novo lead disponível!</strong></p>
            <p>📍 <strong>Localização:</strong> ${lead.city ? `${lead.city}, ` : ''}${lead.state}</p>
            <p>👤 <strong>Nome:</strong> ${lead.name}</p>
            <p>⏰ <strong>Prioridade:</strong> Você tem 1 hora para capturar este lead antes que fique disponível para outros licenciados.</p>
            <p style="margin-top: 16px;"><a href="/hotleads" style="background-color: #f97316; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none;">Ver Lead</a></p>
          </div>
        `,
      })
      .select()
      .single();

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      throw notificationError;
    }

    console.log("Created notification:", notification.id);

    // Create notification recipients for all matching licensees
    const recipients = licenseeProfiles.map(profile => ({
      notification_id: notification.id,
      user_id: profile.user_id,
      is_read: false,
    }));

    const { error: recipientsError } = await supabase
      .from("notification_recipients")
      .insert(recipients);

    if (recipientsError) {
      console.error("Error creating recipients:", recipientsError);
      throw recipientsError;
    }

    console.log(`Notified ${licenseeProfiles.length} licensees about lead in ${lead.state}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notified ${licenseeProfiles.length} licensees`,
        notification_id: notification.id,
        recipients_count: licenseeProfiles.length
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in notify-lead-arrival:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
