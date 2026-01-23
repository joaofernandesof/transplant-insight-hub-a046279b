import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StudentCredential {
  name: string;
  email: string;
  password: string;
}

interface SendCredentialsRequest {
  students: StudentCredential[];
  testEmail?: string; // If provided, send all to this email instead
}

const generateEmailHtml = (student: StudentCredential) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f0fdf4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header with Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px; border-radius: 16px 16px 0 0;">
        <img src="https://transplant-insight-hub.lovable.app/lovable-uploads/logo-formacao-360-white.png" alt="Formação 360°" style="max-width: 280px; height: auto; margin-bottom: 12px;" />
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px; font-weight: 500;">Turma Janeiro 2026</p>
      </div>
    </div>
    
    <!-- Content -->
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <p style="color: #1e293b; font-size: 18px; margin: 0 0 16px;">
        Olá <strong>${student.name.split(' ')[0]}</strong>,
      </p>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        Seja bem-vindo(a) à <strong>Formação 360°</strong>! Seus dados de acesso para a plataforma estão prontos:
      </p>
      
      <!-- Credentials Box -->
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 24px; border-radius: 12px; border: 1px solid #a7f3d0; margin: 24px 0;">
        <div style="margin-bottom: 16px;">
          <span style="color: #047857; font-size: 14px; display: block; margin-bottom: 4px;">📧 Email de acesso</span>
          <span style="color: #1e293b; font-size: 18px; font-weight: 600;">${student.email}</span>
        </div>
        <div>
          <span style="color: #047857; font-size: 14px; display: block; margin-bottom: 4px;">🔑 Senha</span>
          <span style="color: #1e293b; font-size: 18px; font-weight: 600; font-family: monospace; background: #fef3c7; padding: 4px 8px; border-radius: 4px;">${student.password}</span>
        </div>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://transplant-insight-hub.lovable.app/academy" 
           style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
          Acessar Plataforma →
        </a>
      </div>
      
      <!-- Info -->
      <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <p style="color: #92400e; margin: 0; font-size: 14px;">
          <strong>⚠️ Importante:</strong> Recomendamos alterar sua senha após o primeiro acesso por segurança.
        </p>
      </div>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 24px 0 0;">
        Qualquer dúvida, entre em contato conosco.
      </p>
      
      <p style="color: #1e293b; margin: 24px 0 0;">
        Atenciosamente,<br>
        <strong>Equipe IBRAMEC</strong>
      </p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #6b7280; font-size: 12px; margin: 0;">
        © 2026 IBRAMEC - Instituto Brasileiro de Micropigmentação Capilar
      </p>
      <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0;">
        Este é um email automático, por favor não responda.
      </p>
    </div>
    
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { students, testEmail }: SendCredentialsRequest = await req.json();
    
    if (!students || students.length === 0) {
      return new Response(
        JSON.stringify({ error: "No students provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { email: string; status: string; error?: string }[] = [];

    for (const student of students) {
      try {
        const targetEmail = testEmail || student.email;
        
        const emailResponse = await resend.emails.send({
          from: "Formação 360° - IBRAMEC <formacao@ibramec.com>",
          to: [targetEmail],
          subject: `🎓 Seus dados de acesso - Formação 360° Turma 01/2026${testEmail ? ` (TESTE: ${student.name})` : ''}`,
          html: generateEmailHtml(student),
        });

        console.log(`Email sent to ${targetEmail}:`, emailResponse);
        results.push({ email: targetEmail, status: "sent" });
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (emailError: any) {
        console.error(`Error sending to ${student.email}:`, emailError);
        results.push({ 
          email: testEmail || student.email, 
          status: "error", 
          error: emailError.message 
        });
      }
    }

    const sent = results.filter(r => r.status === "sent").length;
    const errors = results.filter(r => r.status === "error").length;

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `${sent} email(s) enviado(s), ${errors} erro(s)`,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-student-credentials:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
