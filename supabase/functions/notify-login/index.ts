import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoginNotificationRequest {
  user_id: string;
  user_name: string;
  user_email: string;
  login_time: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { user_id, user_name, user_email, login_time }: LoginNotificationRequest = await req.json();
    
    console.log(`Processing login notification for user: ${user_name} (${user_email})`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all admin emails
    const { data: adminUsers, error: adminError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminError) {
      console.error("Error fetching admin users:", adminError);
    }

    const adminEmails: string[] = [];
    
    if (adminUsers && adminUsers.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("email")
        .in("user_id", adminUsers.map((u) => u.user_id));

      if (!profilesError && profiles) {
        adminEmails.push(...profiles.map((p) => p.email).filter(Boolean));
      }
    }

    // Add the fixed admin email if configured
    if (adminEmail) {
      adminEmails.push(adminEmail);
    }

    // Remove duplicates
    const uniqueEmails = [...new Set(adminEmails)];

    if (uniqueEmails.length === 0) {
      console.log("No admin emails to notify");
      return new Response(
        JSON.stringify({ success: true, message: "No admins to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending login notification to ${uniqueEmails.length} admins`);
    
    const formattedTime = new Date(login_time).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">ByNeofolic Portal</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
          <h2 style="color: #1e293b; margin-top: 0;">🔐 Novo Login Detectado</h2>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="margin: 8px 0;"><strong>Licenciado:</strong> ${user_name}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${user_email}</p>
            <p style="margin: 8px 0;"><strong>Horário:</strong> ${formattedTime}</p>
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 20px; text-align: center;">
            Esta é uma notificação automática do Portal ByNeofolic.
          </p>
        </div>
      </div>
    `;

    // Send email using Resend API directly via fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ByNeofolic <noreply@neofolic.com.br>",
        to: uniqueEmails,
        subject: `🔐 Login: ${user_name} acessou o portal`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Error sending email:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailsSent: uniqueEmails.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-login function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
