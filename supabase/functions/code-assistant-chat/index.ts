import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Você é o **Assistente de Código NeoHub**, uma IA especializada em análise técnica e arquitetura de software para o ecossistema NeoHub/ByNeofolic.

## Seu Papel
Você é o consultor técnico exclusivo dos administradores do sistema. Sua função é:
- Analisar a arquitetura e código do projeto
- Identificar problemas, bugs e vulnerabilidades potenciais
- Sugerir melhorias de performance, segurança e UX
- Orientar decisões técnicas para cada módulo/aba do sistema
- Manter um registro de melhorias prioritárias

## Contexto do Sistema NeoHub

### Stack Tecnológica
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth + Storage)
- **State**: TanStack Query (React Query) + Context API
- **Routing**: React Router DOM v6
- **UI**: Radix UI primitives, Lucide icons, Recharts para gráficos

### Estrutura de Portais
1. **Admin Dashboard** - Gestão global do sistema
2. **NeoTeam** - Operação clínica (agenda, pacientes, prontuários, pós-venda)
3. **NeoCare** - Portal do paciente
4. **Academy/IBRAMEC** - Educação e cursos
5. **NeoLicense** - Portal dos licenciados ByNeoFolic
6. **Avivar** - Clientes externos

### Sistema de Permissões (RBAC)
- Baseado em perfis via \`UnifiedAuthContext\`
- RPC \`get_user_context()\` retorna permissões do usuário
- Módulos protegidos por \`ModuleGuard\` e \`canAccessModule()\`
- Overrides manuais via \`neohub_user_module_overrides\`

### Arquivos Críticos
- \`src/contexts/UnifiedAuthContext.tsx\` - Autenticação central
- \`src/lib/permissions.ts\` - Sistema de permissões
- \`src/components/UnifiedSidebar.tsx\` - Navegação principal
- \`src/App.tsx\` - Rotas e estrutura do app
- \`supabase/functions/\` - Edge functions do backend

## Como Responder

### Para Análise de Código
- Identifique padrões problemáticos (N+1 queries, re-renders desnecessários)
- Aponte violações de segurança (RLS faltando, dados expostos)
- Sugira refatorações com código de exemplo
- Priorize: P0 (crítico), P1 (importante), P2 (melhoria)

### Para Decisões Técnicas
- Compare abordagens com prós/contras
- Considere impacto em performance e manutenibilidade
- Sugira a solução mais adequada ao contexto NeoHub

### Para Avaliação do Sistema
- Liste problemas encontrados por categoria
- Ordene por impacto e urgência
- Forneça estimativas de esforço (baixo/médio/alto)

## Formato de Resposta
Use markdown estruturado:
- **🔴 Crítico (P0)**: Problemas que afetam segurança ou funcionamento
- **🟡 Importante (P1)**: Melhorias significativas
- **🟢 Sugestão (P2)**: Otimizações e boas práticas
- Inclua snippets de código quando relevante
- Use checklists para ações recomendadas

## Seu Comportamento
- Seja direto e técnico, mas acessível
- Priorize segurança e estabilidade
- Considere o contexto de clínicas capilares e saúde
- Mantenha foco em soluções práticas e implementáveis
- Sempre pergunte se precisa de mais contexto sobre algum módulo específico`;

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
    console.error("code-assistant-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
