import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ErrorAlertRequest {
  errorCode: string;
  errorMessage: string;
  context?: string;
  originalError?: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  pageUrl: string;
  userAgent?: string;
  reportedByUser?: boolean;
}

// Error explanations and solutions database
const ERROR_SOLUTIONS: Record<string, { explanation: string; solutions: string[] }> = {
  SVY: {
    explanation: "Erro relacionado a pesquisas de satisfação (Survey). Pode ocorrer durante inicialização, salvamento ou envio de respostas.",
    solutions: [
      "Verificar se o usuário está autenticado corretamente",
      "Checar políticas RLS na tabela de pesquisas",
      "Confirmar que a turma (class_id) existe e está ativa",
      "Verificar conexão com o banco de dados"
    ]
  },
  AUTH: {
    explanation: "Erro de autenticação. A sessão pode ter expirado ou o usuário não tem permissão.",
    solutions: [
      "Solicitar que o usuário faça login novamente",
      "Verificar configurações de sessão no Supabase",
      "Checar se o token JWT não expirou",
      "Verificar permissões do usuário"
    ]
  },
  DB: {
    explanation: "Erro de banco de dados. Pode ser problema de conexão, RLS ou query inválida.",
    solutions: [
      "Verificar políticas RLS nas tabelas envolvidas",
      "Checar se as colunas existem na tabela",
      "Verificar se o usuário tem permissão para a operação",
      "Analisar logs do Postgres no Supabase Dashboard"
    ]
  },
  NET: {
    explanation: "Erro de rede ou API. Falha na comunicação com serviços externos.",
    solutions: [
      "Verificar conectividade do usuário",
      "Checar se a edge function está deployed",
      "Verificar secrets e API keys configuradas",
      "Analisar logs da edge function"
    ]
  },
  UPL: {
    explanation: "Erro de upload de arquivo. Problema ao enviar imagem ou documento.",
    solutions: [
      "Verificar tamanho máximo do arquivo (limite de 50MB)",
      "Checar se o bucket de storage existe",
      "Verificar políticas de storage do bucket",
      "Confirmar formato de arquivo suportado"
    ]
  },
  GAL: {
    explanation: "Erro de galeria de fotos. Problema ao carregar ou exibir imagens.",
    solutions: [
      "Verificar se a galeria existe e está ativa",
      "Checar permissões de acesso à galeria",
      "Verificar se as URLs das imagens são válidas",
      "Confirmar que o requisito de desbloqueio foi atendido"
    ]
  },
  ERR: {
    explanation: "Erro geral do sistema. Problema não categorizado.",
    solutions: [
      "Analisar a mensagem de erro original",
      "Verificar console do navegador para mais detalhes",
      "Checar logs do sistema",
      "Contatar suporte técnico se persistir"
    ]
  }
};

function getErrorSolutions(errorCode: string): { explanation: string; solutions: string[] } {
  const prefix = errorCode.split('-')[0];
  return ERROR_SOLUTIONS[prefix] || ERROR_SOLUTIONS.ERR;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ErrorAlertRequest = await req.json();
    
    const { explanation, solutions } = getErrorSolutions(data.errorCode);
    
    const solutionsList = solutions.map(s => `<li>${s}</li>`).join('');
    
    const reportBadge = data.reportedByUser 
      ? '<div style="background: #059669; color: white; padding: 8px 16px; border-radius: 4px; display: inline-block; margin-bottom: 15px; font-weight: bold;">👆 REPORTADO PELO USUÁRIO</div>'
      : '<div style="background: #6b7280; color: white; padding: 8px 16px; border-radius: 4px; display: inline-block; margin-bottom: 15px;">🔄 Alerta Automático</div>';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .error-code { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .error-code h3 { color: #dc2626; margin: 0 0 10px 0; }
          .info-box { background: white; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .info-box h4 { color: #374151; margin: 0 0 10px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
          .info-row { display: flex; margin: 8px 0; }
          .info-label { font-weight: bold; width: 120px; color: #6b7280; }
          .info-value { flex: 1; }
          .solutions { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .solutions h4 { color: #059669; margin: 0 0 10px 0; }
          .solutions ul { margin: 0; padding-left: 20px; }
          .solutions li { margin: 5px 0; }
          .technical { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 12px; white-space: pre-wrap; word-break: break-all; }
          .footer { background: #374151; color: #9ca3af; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
          .user-reported { background: #059669; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header ${data.reportedByUser ? 'user-reported' : ''}">
            <h1>🚨 ${data.reportedByUser ? 'Erro Reportado' : 'Alerta de Erro'} - NeoHub</h1>
          </div>
          
          <div class="content">
            ${reportBadge}
            
            <div class="error-code">
              <h3>Código do Erro: ${data.errorCode}</h3>
              <p style="margin: 0; font-size: 16px;">${data.errorMessage}</p>
            </div>
            
            <div class="info-box">
              <h4>👤 Informações do Usuário</h4>
              <div class="info-row">
                <span class="info-label">Nome:</span>
                <span class="info-value">${data.userName || 'Não identificado'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${data.userEmail || 'Não disponível'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">ID:</span>
                <span class="info-value">${data.userId || 'Não autenticado'}</span>
              </div>
            </div>
            
            <div class="info-box">
              <h4>🌐 Contexto</h4>
              <div class="info-row">
                <span class="info-label">Página:</span>
                <span class="info-value"><a href="${data.pageUrl}">${data.pageUrl}</a></span>
              </div>
              <div class="info-row">
                <span class="info-label">Horário:</span>
                <span class="info-value">${new Date(data.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Contexto:</span>
                <span class="info-value">${data.context || 'N/A'}</span>
              </div>
            </div>
            
            <div class="info-box">
              <h4>🔍 Explicação</h4>
              <p style="margin: 0;">${explanation}</p>
            </div>
            
            <div class="solutions">
              <h4>💡 Possíveis Soluções</h4>
              <ul>${solutionsList}</ul>
            </div>
            
            ${data.originalError ? `
            <div class="info-box">
              <h4>🔧 Detalhes Técnicos</h4>
              <div class="technical">${data.originalError}</div>
            </div>
            ` : ''}
            
            ${data.userAgent ? `
            <div class="info-box">
              <h4>📱 Dispositivo</h4>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">${data.userAgent}</p>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>Este é um alerta automático do sistema NeoHub.</p>
            <p>Para mais detalhes, acesse o Supabase Dashboard.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "NeoHub Alerts <alertas@neofolic.com.br>",
      to: ["ti@neofolic.com.br"],
      subject: `🚨 [${data.errorCode}] ${data.errorMessage.substring(0, 50)}`,
      html: emailHtml,
    });

    console.log("Error alert email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: (emailResponse as any).id || 'sent' }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending alert email:", error);
    
    // Don't fail silently - log but don't block the user
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 200, // Return 200 to not affect user experience
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
