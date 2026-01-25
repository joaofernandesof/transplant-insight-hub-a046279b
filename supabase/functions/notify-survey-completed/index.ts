import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  surveyId: string;
  classId: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { surveyId, classId, userId }: NotifyRequest = await req.json();

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get student info
    const { data: student } = await supabase
      .from("neohub_users")
      .select("full_name, email")
      .eq("user_id", userId)
      .single();

    // Get class info
    const { data: classInfo } = await supabase
      .from("course_classes")
      .select("name, code")
      .eq("id", classId)
      .single();

    // Get survey summary (key responses)
    const { data: survey } = await supabase
      .from("day1_satisfaction_surveys")
      .select("q1_satisfaction_level, q24_hunger_level, q25_urgency_level, completed_at")
      .eq("id", surveyId)
      .single();

    const studentName = student?.full_name || "Aluno";
    const studentEmail = student?.email || "N/A";
    const className = classInfo?.name || classInfo?.code || "Turma";
    const completedAt = survey?.completed_at 
      ? new Date(survey.completed_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
      : new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    // Determine lead priority based on responses
    const hungerLevel = survey?.q24_hunger_level || "";
    const urgencyLevel = survey?.q25_urgency_level || "";
    
    const isHotLead = hungerLevel.toLowerCase().includes("alta") || 
                      urgencyLevel.toLowerCase().includes("alta");
    
    const priorityBadge = isHotLead 
      ? '<span style="background:#dc2626;color:white;padding:4px 12px;border-radius:4px;font-weight:bold;">🔥 LEAD PRIORITÁRIO</span>'
      : '<span style="background:#059669;color:white;padding:4px 12px;border-radius:4px;">✓ Pesquisa Concluída</span>';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📋 Nova Pesquisa Respondida</h1>
          </div>
          
          <div style="padding: 24px;">
            <div style="margin-bottom: 20px; text-align: center;">
              ${priorityBadge}
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 140px;">Aluno:</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${studentName}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">E-mail:</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${studentEmail}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Turma:</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${className}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Concluído em:</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${completedAt}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Satisfação:</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${survey?.q1_satisfaction_level || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Nível de Fome:</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${hungerLevel || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: bold;">Urgência:</td>
                <td style="padding: 12px;">${urgencyLevel || "N/A"}</td>
              </tr>
            </table>
            
            <div style="margin-top: 24px; padding: 16px; background: #f0fdf4; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #166534; font-size: 14px;">
                Acesse o painel administrativo para ver todas as respostas detalhadas.
              </p>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #6b7280;">
            IBRAMEC - Sistema de Pesquisas
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "IBRAMEC <notificacoes@ibramec.com>",
      to: ["joao.fernandes@neofolic.com.br", "adm@neofolic.com.br"],
      subject: `${isHotLead ? "🔥 " : ""}Pesquisa Dia 1 - ${studentName} (${className})`,
      html: emailHtml,
    });

    console.log("Survey notification email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending survey notification:", error);
    
    // Don't fail the whole flow if email fails
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
