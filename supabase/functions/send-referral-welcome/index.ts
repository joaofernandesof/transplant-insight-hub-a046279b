import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReferralWelcomeRequest {
  name: string;
  email: string;
  referral_code: string;
}

const generateEmailHtml = (data: ReferralWelcomeRequest) => {
  const referralLink = `https://transplant-insight-hub.lovable.app/formacao-360/indicacao/${data.referral_code}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🎁 Programa Indique e Ganhe</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Formação 360° - IBRAMEC</p>
      </div>
    </div>
    
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      
      <p style="color: #1e293b; font-size: 18px; margin: 0 0 16px;">Olá <strong>${data.name.split(' ')[0]}</strong>,</p>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        Agora que você faz parte da <strong>Formação 360°</strong>, queremos te apresentar nosso 
        <strong>Programa de Indicações</strong>! É uma ótima oportunidade de ganhar uma renda extra 
        enquanto ajuda outros profissionais a se capacitarem.
      </p>
      
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 24px; border-radius: 12px; border: 2px solid #f59e0b; margin: 24px 0;">
        <h3 style="color: #92400e; margin: 0 0 16px; font-size: 18px;">💰 Como Funciona</h3>
        <ul style="color: #78350f; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li><strong>5% de desconto</strong> para seu indicado na matrícula</li>
          <li><strong>5% de comissão</strong> para você via PIX quando a venda for concluída</li>
          <li>Sem limite de indicações!</li>
        </ul>
      </div>
      
      <div style="background: #f0fdf4; padding: 24px; border-radius: 12px; border: 1px solid #bbf7d0; margin: 24px 0;">
        <h3 style="color: #166534; margin: 0 0 12px; font-size: 16px;">🔗 Seu Link Exclusivo de Indicação</h3>
        <div style="background: white; padding: 12px 16px; border-radius: 8px; border: 1px solid #86efac; word-break: break-all;">
          <a href="${referralLink}" style="color: #059669; font-size: 14px; text-decoration: none; font-family: monospace;">
            ${referralLink}
          </a>
        </div>
        <p style="color: #166534; font-size: 13px; margin: 12px 0 0;">
          Compartilhe este link com amigos e colegas interessados na formação!
        </p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${referralLink}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
          Compartilhar Agora →
        </a>
      </div>
      
      <div style="background: #eff6ff; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <p style="color: #1e40af; margin: 0; font-size: 14px;">
          <strong>📊 Dica:</strong> Você pode acompanhar suas indicações e comissões diretamente 
          na plataforma, no menu <strong>"Indique e Ganhe"</strong>.
        </p>
      </div>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 24px 0 0;">
        Quanto mais pessoas você indicar, mais você ganha! 🚀
      </p>
      
      <p style="color: #1e293b; margin: 24px 0 0;">
        Atenciosamente,<br>
        <strong>Equipe IBRAMEC</strong>
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        © 2026 IBRAMEC - Instituto Brasileiro de Micropigmentação Capilar
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0;">
        Este é um email automático, por favor não responda.
      </p>
    </div>
  </div>
</body>
</html>
`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ReferralWelcomeRequest = await req.json();
    
    if (!data.name || !data.email || !data.referral_code) {
      return new Response(
        JSON.stringify({ error: "name, email and referral_code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending referral welcome email to ${data.email} with code ${data.referral_code}`);

    const emailResponse = await resend.emails.send({
      from: "Formação 360° - IBRAMEC <formacao@ibramec.com>",
      to: [data.email],
      subject: `🎁 Ganhe dinheiro indicando amigos - Programa Indique e Ganhe`,
      html: generateEmailHtml(data),
    });

    console.log("Referral welcome email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email enviado com sucesso",
        response: emailResponse 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-referral-welcome:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
