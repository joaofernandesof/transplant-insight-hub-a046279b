import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referralId } = await req.json();

    if (!referralId) {
      throw new Error("referralId is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "contato@ibramec.com.br";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the referral details
    const { data: referral, error: referralError } = await supabase
      .from("student_referrals")
      .select("*")
      .eq("id", referralId)
      .single();

    if (referralError || !referral) {
      throw new Error("Referral not found");
    }

    // Get the referrer info from neohub_users
    const { data: referrer } = await supabase
      .from("neohub_users")
      .select("full_name, email, phone")
      .eq("user_id", referral.referrer_user_id)
      .maybeSingle();

    // Calculate commission value
    const commissionValue = referral.contract_value 
      ? (referral.contract_value * referral.commission_rate / 100)
      : null;

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    // Skip email if Resend is not configured
    if (!resendApiKey) {
      console.log("Resend not configured, skipping email notification");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "Resend not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    // Send email to admin
    const emailResult = await resend.emails.send({
      from: "NeoHub <notificacoes@ibramec.com.br>",
      to: [adminEmail],
      subject: `🎉 Solicitação de PIX - Comissão de Indicação`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">💰 Solicitação de PIX</h1>
          </div>
          
          <div style="padding: 20px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Nova solicitação de comissão!</h2>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h3 style="color: #059669; margin-top: 0;">👤 Indicador</h3>
              <p><strong>Nome:</strong> ${referrer?.full_name || 'N/A'}</p>
              <p><strong>Email:</strong> ${referrer?.email || 'N/A'}</p>
              <p><strong>Telefone:</strong> ${referrer?.phone || 'N/A'}</p>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h3 style="color: #3b82f6; margin-top: 0;">🎓 Indicado</h3>
              <p><strong>Nome:</strong> ${referral.referred_name}</p>
              <p><strong>Email:</strong> ${referral.referred_email}</p>
              <p><strong>Telefone:</strong> ${referral.referred_phone}</p>
              <p><strong>CRM:</strong> ${referral.referred_crm || 'Não possui'}</p>
            </div>
            
            <div style="background: #dcfce7; padding: 15px; border-radius: 8px; border: 2px solid #10b981;">
              <h3 style="color: #166534; margin-top: 0;">💵 Valores</h3>
              <p><strong>Valor do Contrato:</strong> ${referral.contract_value ? formatCurrency(referral.contract_value) : 'Não informado'}</p>
              <p><strong>Taxa de Comissão:</strong> ${referral.commission_rate}%</p>
              <p style="font-size: 1.2em;"><strong>Valor do PIX:</strong> <span style="color: #059669; font-weight: bold;">${commissionValue ? formatCurrency(commissionValue) : 'A calcular'}</span></p>
            </div>
            
            <p style="color: #6b7280; font-size: 0.9em; margin-top: 20px;">
              Acesse o painel administrativo para aprovar e liberar o pagamento.
            </p>
          </div>
          
          <div style="background: #1f2937; padding: 15px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 0.8em;">
              NeoHub - Sistema de Gestão IBRAMEC
            </p>
          </div>
        </div>
      `,
    });

    console.log("PIX request notification sent:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in notify-pix-request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
