import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LicenseeStats {
  user_id: string;
  name: string;
  email: string;
  clinic_name: string | null;
  total_leads: number;
  converted_leads: number;
  total_revenue: number;
  courses_completed: number;
  total_points: number;
  usage_time_hours: number;
  sessions_count: number;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const defaultAdminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "ti@neofolic.com.br";

    // Allow overriding admin email via request body
    let adminEmail = defaultAdminEmail;
    try {
      const body = await req.json();
      if (body?.test_email) {
        adminEmail = body.test_email;
        console.log(`Using override email: ${adminEmail}`);
      }
    } catch {
      // No body or invalid JSON, use default
    }

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

    console.log("Starting weekly report generation...");

    // Get all licensee user_ids (non-admins)
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminIds = new Set(adminRoles?.map((r) => r.user_id) || []);

    // Get all licensee profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, name, email, clinic_name, total_points");

    if (profilesError) throw profilesError;

    const licenseeProfiles = (profiles || []).filter((p) => !adminIds.has(p.user_id));

    console.log(`Processing ${licenseeProfiles.length} licensees`);

    // Get date range for this week
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    // Collect stats for each licensee
    const allStats: LicenseeStats[] = [];

    for (const profile of licenseeProfiles) {
      // Get leads
      const { data: leads } = await supabase
        .from("leads")
        .select("id, status, converted_value")
        .eq("claimed_by", profile.user_id);

      const totalLeads = leads?.length || 0;
      const convertedLeads = leads?.filter((l) => l.status === "converted").length || 0;
      const totalRevenue = leads?.reduce((acc, l) => acc + (l.converted_value || 0), 0) || 0;

      // Get completed courses
      const { data: enrollments } = await supabase
        .from("user_course_enrollments")
        .select("id")
        .eq("user_id", profile.user_id)
        .eq("status", "completed");

      const coursesCompleted = enrollments?.length || 0;

      // Get usage time
      const { data: sessions } = await supabase
        .from("user_sessions")
        .select("duration_seconds")
        .eq("user_id", profile.user_id)
        .gte("started_at", weekStart.toISOString());

      const totalSeconds = sessions?.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) || 0;
      const usageTimeHours = Math.round((totalSeconds / 3600) * 10) / 10;

      allStats.push({
        user_id: profile.user_id,
        name: profile.name,
        email: profile.email,
        clinic_name: profile.clinic_name,
        total_leads: totalLeads,
        converted_leads: convertedLeads,
        total_revenue: totalRevenue,
        courses_completed: coursesCompleted,
        total_points: profile.total_points || 0,
        usage_time_hours: usageTimeHours,
        sessions_count: sessions?.length || 0,
      });
    }

    // Generate and send individual reports
    let sentCount = 0;

    for (const stats of allStats) {
      const conversionRate = stats.total_leads > 0 
        ? Math.round((stats.converted_leads / stats.total_leads) * 100) 
        : 0;

      const reportDate = now.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const individualReportHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📊 Relatório Semanal</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Portal ByNeofolic</p>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #1e293b; font-size: 18px; margin-bottom: 5px;">
              Olá, <strong>${stats.name}</strong>! 👋
            </p>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 25px;">
              Aqui está seu resumo semanal até ${reportDate}
            </p>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px;">
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 20px; border-radius: 12px; border: 1px solid #bbf7d0;">
                <p style="color: #166534; font-size: 12px; margin: 0; text-transform: uppercase; font-weight: 600;">Leads Totais</p>
                <p style="color: #15803d; font-size: 28px; font-weight: bold; margin: 5px 0 0 0;">${stats.total_leads}</p>
              </div>
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 20px; border-radius: 12px; border: 1px solid #bfdbfe;">
                <p style="color: #1e40af; font-size: 12px; margin: 0; text-transform: uppercase; font-weight: 600;">Convertidos</p>
                <p style="color: #1d4ed8; font-size: 28px; font-weight: bold; margin: 5px 0 0 0;">${stats.converted_leads} <span style="font-size: 14px; font-weight: normal;">(${conversionRate}%)</span></p>
              </div>
              <div style="background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%); padding: 20px; border-radius: 12px; border: 1px solid #fde047;">
                <p style="color: #a16207; font-size: 12px; margin: 0; text-transform: uppercase; font-weight: 600;">Receita Total</p>
                <p style="color: #ca8a04; font-size: 28px; font-weight: bold; margin: 5px 0 0 0;">R$ ${stats.total_revenue.toLocaleString("pt-BR")}</p>
              </div>
              <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); padding: 20px; border-radius: 12px; border: 1px solid #e9d5ff;">
                <p style="color: #7c3aed; font-size: 12px; margin: 0; text-transform: uppercase; font-weight: 600;">Pontos</p>
                <p style="color: #7c3aed; font-size: 28px; font-weight: bold; margin: 5px 0 0 0;">${stats.total_points}</p>
              </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
              <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 16px;">📚 Treinamento & Engajamento</h3>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Cursos Concluídos</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1e293b;">${stats.courses_completed}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Tempo de Uso (semana)</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1e293b;">${stats.usage_time_hours}h</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Sessões</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1e293b;">${stats.sessions_count}</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 25px;">
              Continue assim! 🚀 Acesse o portal para ver mais detalhes.
            </p>
          </div>
        </div>
      `;

      try {
        // Send to licensee
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "ByNeofolic <onboarding@resend.dev>",
            to: [stats.email],
            subject: `📊 Seu Relatório Semanal - ${reportDate}`,
            html: individualReportHtml,
          }),
        });
        
        sentCount++;
        console.log(`Report sent to ${stats.email}`);
      } catch (emailError) {
        console.error(`Failed to send report to ${stats.email}:`, emailError);
      }
    }

    // Generate admin summary report
    const adminSummaryRows = allStats
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .map((s, index) => {
        const convRate = s.total_leads > 0 ? Math.round((s.converted_leads / s.total_leads) * 100) : 0;
        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${index + 1}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${s.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${s.clinic_name || "-"}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${s.total_leads}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${s.converted_leads} (${convRate}%)</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #16a34a;">R$ ${s.total_revenue.toLocaleString("pt-BR")}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${s.courses_completed}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${s.usage_time_hours}h</td>
          </tr>
        `;
      })
      .join("");

    const totalLeadsAll = allStats.reduce((acc, s) => acc + s.total_leads, 0);
    const totalConvertedAll = allStats.reduce((acc, s) => acc + s.converted_leads, 0);
    const totalRevenueAll = allStats.reduce((acc, s) => acc + s.total_revenue, 0);

    const adminReportHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📊 Relatório Consolidado Semanal</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Todos os Licenciados - ${now.toLocaleDateString("pt-BR")}</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
          
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
            <div style="background: #dcfce7; padding: 20px; border-radius: 12px; text-align: center;">
              <p style="color: #166534; font-size: 12px; margin: 0; font-weight: 600;">TOTAL LEADS</p>
              <p style="color: #15803d; font-size: 32px; font-weight: bold; margin: 5px 0 0 0;">${totalLeadsAll}</p>
            </div>
            <div style="background: #dbeafe; padding: 20px; border-radius: 12px; text-align: center;">
              <p style="color: #1e40af; font-size: 12px; margin: 0; font-weight: 600;">CONVERTIDOS</p>
              <p style="color: #1d4ed8; font-size: 32px; font-weight: bold; margin: 5px 0 0 0;">${totalConvertedAll}</p>
            </div>
            <div style="background: #fef9c3; padding: 20px; border-radius: 12px; text-align: center;">
              <p style="color: #a16207; font-size: 12px; margin: 0; font-weight: 600;">RECEITA TOTAL</p>
              <p style="color: #ca8a04; font-size: 32px; font-weight: bold; margin: 5px 0 0 0;">R$ ${totalRevenueAll.toLocaleString("pt-BR")}</p>
            </div>
          </div>
          
          <h3 style="color: #1e293b; margin: 0 0 15px 0;">Ranking de Licenciados</h3>
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-size: 13px;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 12px; text-align: left;">#</th>
                <th style="padding: 12px; text-align: left;">Nome</th>
                <th style="padding: 12px; text-align: left;">Clínica</th>
                <th style="padding: 12px; text-align: center;">Leads</th>
                <th style="padding: 12px; text-align: center;">Convertidos</th>
                <th style="padding: 12px; text-align: right;">Receita</th>
                <th style="padding: 12px; text-align: center;">Cursos</th>
                <th style="padding: 12px; text-align: center;">Uso</th>
              </tr>
            </thead>
            <tbody>
              ${adminSummaryRows}
            </tbody>
          </table>
          
          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 25px;">
            Relatório gerado automaticamente em ${now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
          </p>
        </div>
      </div>
    `;

    // Send admin summary
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ByNeofolic <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `📊 Relatório Consolidado Semanal - ${allStats.length} Licenciados`,
        html: adminReportHtml,
      }),
    });

    console.log(`Weekly reports completed. Sent to ${sentCount} licensees + admin summary`);

    return new Response(
      JSON.stringify({
        success: true,
        licenseeReportsSent: sentCount,
        adminReportSent: true,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-weekly-reports function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
