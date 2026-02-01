import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "ti@neofolic.com.br";

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log(`Checking for users inactive since: ${sevenDaysAgo.toISOString()}`);

    // Get all licensee user_ids (non-admins)
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminIds = new Set(adminRoles?.map((r) => r.user_id) || []);

    // Get profiles that haven't been seen in 7+ days
    const { data: inactiveProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, name, email, clinic_name, last_seen_at, created_at");

    if (profilesError) {
      throw profilesError;
    }

    // Filter to licensees only and check inactivity
    const inactiveUsers = (inactiveProfiles || []).filter((profile) => {
      // Skip admins
      if (adminIds.has(profile.user_id)) return false;

      // Check last_seen_at
      const lastSeen = profile.last_seen_at ? new Date(profile.last_seen_at) : null;
      
      // If never seen, check if account is older than 7 days
      if (!lastSeen) {
        const createdAt = new Date(profile.created_at);
        return createdAt < sevenDaysAgo;
      }

      return lastSeen < sevenDaysAgo;
    });

    if (inactiveUsers.length === 0) {
      console.log("No inactive users found");
      return new Response(
        JSON.stringify({ success: true, message: "No inactive users", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${inactiveUsers.length} inactive users`);

    // Build email content
    const userList = inactiveUsers.map((user) => {
      const lastSeen = user.last_seen_at
        ? new Date(user.last_seen_at).toLocaleDateString("pt-BR")
        : "Nunca acessou";
      
      // Calculate days inactive - use last_seen_at if available, otherwise use created_at
      const referenceDate = user.last_seen_at 
        ? new Date(user.last_seen_at) 
        : new Date(user.created_at);
      const daysInactive = Math.floor((Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${user.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${user.email}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${user.clinic_name || "-"}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${lastSeen}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #ef4444; font-weight: bold;">${daysInactive} dias</td>
        </tr>
      `;
    }).join("");

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Alerta de Inatividade</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="color: #1e293b; font-size: 16px; margin-bottom: 20px;">
            Os seguintes licenciados estão <strong>inativos há mais de 7 dias</strong>:
          </p>
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569;">Nome</th>
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569;">Email</th>
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569;">Clínica</th>
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569;">Último Acesso</th>
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569;">Dias Inativo</th>
              </tr>
            </thead>
            <tbody>
              ${userList}
            </tbody>
          </table>
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
            <strong>Total:</strong> ${inactiveUsers.length} licenciado(s) inativo(s)
          </p>
          <p style="color: #64748b; font-size: 12px; margin-top: 20px; text-align: center;">
            Relatório gerado automaticamente pelo Portal ByNeofolic em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
          </p>
        </div>
      </div>
    `;

    // Send email
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ByNeofolic <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `⚠️ Alerta: ${inactiveUsers.length} licenciado(s) inativo(s) há mais de 7 dias`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Error sending email:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("Inactivity alert email sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        inactiveCount: inactiveUsers.length,
        emailSent: true 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in check-inactive-users function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
