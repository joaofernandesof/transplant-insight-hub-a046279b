import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  to: string;
  name: string;
  subject: string;
  message: string;
  templateId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    const { to, name, subject, message, templateId }: NotificationRequest = await req.json();

    console.log(`Sending notification to ${to} - Template: ${templateId || 'custom'}`);

    if (!to || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert plain text message to HTML with proper formatting
    const htmlMessage = message
      .split('\n')
      .map(line => {
        if (line.trim() === '') return '<br>';
        if (line.startsWith('•')) return `<li style="margin-left: 20px;">${line.substring(1).trim()}</li>`;
        return `<p style="margin: 0 0 8px 0;">${line}</p>`;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 24px; text-align: center; border-radius: 16px 16px 0 0;">
            <span style="font-size: 24px; font-weight: 800; color: white; letter-spacing: 2px;">🎓 IBRAMEC</span>
          </div>
          
          <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="color: #1e293b; font-size: 16px; line-height: 1.7;">
              ${htmlMessage}
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 24px;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} IBRAMEC - Instituto Brasileiro de Medicina Capilar
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "contato@ibramec.com";
    const fromAddress = `IBRAMEC <${fromEmail}>`;

    let emailResponse;
    
    try {
      emailResponse = await resend.emails.send({
        from: fromAddress,
        to: [to],
        subject: subject,
        html: htmlContent,
      });

      // Handle domain not verified error
      if (emailResponse.error?.message?.includes('domain is not verified')) {
        console.log("Domain not verified, retrying with resend.dev...");
        emailResponse = await resend.emails.send({
          from: "IBRAMEC <onboarding@resend.dev>",
          to: [to],
          subject: subject,
          html: htmlContent,
        });
      }
    } catch (sendError: any) {
      console.error("Send error:", sendError);
      return new Response(
        JSON.stringify({ error: sendError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (emailResponse.error) {
      console.error("Email error:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: emailResponse.error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Notification sent successfully to ${to} - ID: ${emailResponse.data?.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: emailResponse.data?.id,
        message: `Notification sent to ${to}`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-referral-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
