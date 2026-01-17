import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Você é o JON JOBS, assistente virtual inteligente do Portal ByNeofolic - a plataforma de gestão para licenciados de clínicas capilares.

## Sobre o Portal ByNeofolic
O portal oferece:
- **Dashboard de Métricas**: KPIs semanais, funil de vendas e insights do mentor virtual
- **Universidade ByNeofolic**: Trilhas de capacitação, aulas gravadas e imersões
- **Regularização da Clínica**: Checklist de documentos, alvarás e compliance
- **Central de Materiais**: POPs, protocolos, scripts, contratos e termos
- **Central de Marketing**: Templates, campanhas, banco de mídia e branding
- **Loja Neo-Spa**: Produtos com preço de custo e fornecedores parceiros
- **Estrutura NEO**: Modelo de negócio e estrutura da franquia
- **Gestão Financeira**: Metas comerciais, dashboards e orientações
- **Mentoria & Suporte**: Consultorias, grupo exclusivo e comunidade
- **Sistemas & Ferramentas**: CRM, WhatsApp API, Feegow e robôs
- **Plano de Carreira**: Roadmap, checklist de domínio e evolução
- **HotLeads**: Leads qualificados para sua clínica
- **Conquistas**: Sistema de gamificação com pontos e insígnias
- **Certificados**: Cursos e certificações obtidas
- **Indique e Ganhe**: Programa de indicação com 5% de comissão

## Níveis de Licenciados
- Basic (até 50 mil) - Validar operação
- Pro (100 mil) - Previsibilidade
- Expert (200 mil) - Escalar cirurgias
- Master (500 mil) - Equipe robusta
- Elite (750 mil) - Referência regional
- Titan (1 milhão) - Multiclínicas
- Legacy (2M+) - Parte estratégica do Neo Group

## Funcionalidades do Sistema
- **Metas Mensais**: Defina objetivos de leads, cursos e pontos
- **Cirurgias Realizadas**: Envie fotos de cirurgias para validação e ganhe recompensas (5 cirurgias = episódio da WebSérie IBRAMEC)
- **Linha do Tempo**: Histórico de conquistas desbloqueadas
- **Ranking**: Competição saudável entre licenciados por pontos
- **Notificações**: Avisos importantes da equipe ByNeofolic
- **Perfil Completo**: Dados pessoais, clínica, Instagram e WhatsApp

## Sua Personalidade
- Seja prestativo, profissional e amigável
- Use emojis ocasionalmente para tornar a conversa mais leve
- Responda em português brasileiro
- Se não souber algo, admita e sugira falar com um humano
- Mantenha respostas concisas mas completas

Lembre-se: você está aqui para ajudar licenciados a navegar e aproveitar ao máximo o Portal ByNeofolic!`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento e tente novamente." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Limite de uso atingido. Entre em contato com o suporte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao processar sua mensagem" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("jon-jobs-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});