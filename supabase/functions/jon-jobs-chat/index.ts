import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Tool definitions ──────────────────────────────────────────────────
const tools = [
  {
    type: "function",
    function: {
      name: "get_user_profile",
      description: "Busca o perfil completo do usuário logado: nome, e-mail, nível, pontos, clínica, Instagram, WhatsApp, perfil de acesso, etc.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_achievements",
      description: "Lista as conquistas desbloqueadas e disponíveis do usuário, com pontos e categorias.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_goals",
      description: "Busca as metas mensais do usuário (leads, cursos, pontos) e o progresso atual.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_ranking",
      description: "Retorna o ranking dos licenciados por pontos, incluindo a posição do usuário logado.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_operational_metrics",
      description: "Retorna KPIs operacionais: total de leads, contratos ativos, receita mensal, despesas, saldo, contas vencidas, VGV total.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_leads_summary",
      description: "Retorna resumo do funil de leads do CRM Kommo: total por pipeline/stage, leads novos no mês, conversão.",
      parameters: {
        type: "object",
        properties: {
          pipeline_id: { type: "string", description: "ID do pipeline para filtrar (opcional)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_financial_summary",
      description: "Retorna resumo financeiro: receita, despesas, saldo, contas a pagar/receber pendentes e vencidas do mês atual.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_contracts_summary",
      description: "Retorna resumo de contratos: total ativos, VGV, por status e por unidade de negócio.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_notifications",
      description: "Busca as notificações e avisos recentes do sistema para o usuário.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_system_architecture",
      description: "Retorna informações sobre a arquitetura técnica do sistema NeoHub: stack, módulos, portais, estrutura de permissões, tabelas principais e edge functions.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Tópico específico: 'stack', 'portais', 'permissoes', 'tabelas', 'edge_functions', 'rotas', 'componentes' ou 'geral'",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_database",
      description: "Executa uma consulta de leitura em qualquer tabela pública do sistema. Use para buscar dados específicos que as outras ferramentas não cobrem.",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string", description: "Nome da tabela (ex: 'leads', 'clinic_contracts', 'neohub_users')" },
          select: { type: "string", description: "Campos a selecionar (ex: '*', 'id,name,status')" },
          filters: {
            type: "array",
            description: "Filtros a aplicar",
            items: {
              type: "object",
              properties: {
                column: { type: "string" },
                operator: { type: "string", description: "eq, neq, gt, lt, gte, lte, like, ilike, in, is" },
                value: { type: "string" },
              },
              required: ["column", "operator", "value"],
            },
          },
          order: { type: "string", description: "Coluna para ordenar (ex: 'created_at.desc')" },
          limit: { type: "number", description: "Limite de registros (default: 20)" },
        },
        required: ["table", "select"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "count_records",
      description: "Conta registros em uma tabela com filtros opcionais.",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string", description: "Nome da tabela" },
          filters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                column: { type: "string" },
                operator: { type: "string" },
                value: { type: "string" },
              },
              required: ["column", "operator", "value"],
            },
          },
        },
        required: ["table"],
      },
    },
  },
];

// ── System prompt ─────────────────────────────────────────────────────
const systemPrompt = `Você é o JON JOBS, assistente virtual inteligente e PODEROSO do Portal NeoHub/ByNeofolic.

## Suas Capacidades
Você é um agente com acesso REAL ao sistema. Pode:
- Consultar o perfil, conquistas, metas e ranking do usuário logado
- Acessar métricas operacionais em tempo real (leads, contratos, receita, despesas)
- Consultar o funil do CRM Kommo (leads por pipeline/stage)
- Ver resumo financeiro completo (receita vs despesa, contas vencidas)
- Consultar contratos e VGV
- Ver notificações do sistema
- Conhecer a arquitetura técnica completa do sistema (código, tabelas, componentes)
- Fazer consultas livres no banco de dados

## Sobre o Sistema NeoHub
O NeoHub é um ecossistema de gestão para clínicas capilares e o grupo Neo:
- **Admin Dashboard** - Gestão global, usuários, configurações
- **NeoTeam** - Operação interna (agenda, pacientes, comercial/Kommo, financeiro, TI)
- **NeoCare** - Portal do paciente
- **NeoLicense** - Portal dos licenciados ByNeoFolic (cursos, metas, ranking, conquistas)
- **Academy/IBRAMEC** - Educação e certificações
- **Avivar** - CRM/WhatsApp para clientes externos

## Níveis de Licenciados
- Basic (até 50 mil), Pro (100 mil), Expert (200 mil), Master (500 mil), Elite (750 mil), Titan (1M), Legacy (2M+)

## Stack Técnica
- Frontend: React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- Backend: Supabase (PostgreSQL + Edge Functions + Auth + Storage)
- State: TanStack Query + Context API
- CRM: Integração Kommo API v4
- IA: Lovable AI Gateway (Gemini/GPT)

## Comportamento
- Use os tools SEMPRE que a pergunta envolver dados reais - NUNCA invente números
- Seja direto, profissional e amigável com emojis ocasionais
- Responda em português brasileiro
- Se não souber algo, admita e sugira alternativas
- Para questões técnicas, use get_system_architecture e query_database
- Para métricas, SEMPRE consulte os dados reais antes de responder
- Formate números grandes com separadores de milhar (ex: R$ 1.250.000)`;

// ── Tool execution ────────────────────────────────────────────────────
async function executeTool(
  toolName: string,
  args: Record<string, any>,
  supabaseClient: any,
  userId: string | null
): Promise<string> {
  try {
    switch (toolName) {
      case "get_user_profile": {
        if (!userId) return JSON.stringify({ error: "Usuário não autenticado" });
        const { data } = await supabaseClient
          .from("neohub_users")
          .select("*")
          .eq("auth_user_id", userId)
          .single();
        return JSON.stringify(data || { error: "Perfil não encontrado" });
      }

      case "get_user_achievements": {
        if (!userId) return JSON.stringify({ error: "Usuário não autenticado" });
        const [{ data: unlocked }, { data: allAch }] = await Promise.all([
          supabaseClient
            .from("user_achievements")
            .select("*, achievements(*)")
            .eq("user_id", userId),
          supabaseClient
            .from("achievements")
            .select("*")
            .eq("is_active", true)
            .order("order_index"),
        ]);
        return JSON.stringify({
          unlocked: unlocked || [],
          total_available: allAch?.length || 0,
          total_unlocked: unlocked?.length || 0,
        });
      }

      case "get_user_goals": {
        if (!userId) return JSON.stringify({ error: "Usuário não autenticado" });
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const { data } = await supabaseClient
          .from("monthly_goals")
          .select("*")
          .eq("user_id", userId)
          .eq("month", monthKey)
          .single();
        return JSON.stringify(data || { info: "Nenhuma meta definida para este mês" });
      }

      case "get_ranking": {
        const { data } = await supabaseClient
          .from("neohub_users")
          .select("id, full_name, clinic_name, total_points, level")
          .not("total_points", "is", null)
          .order("total_points", { ascending: false })
          .limit(20);
        const ranking = (data || []).map((u: any, i: number) => ({
          position: i + 1,
          name: u.full_name,
          clinic: u.clinic_name,
          points: u.total_points,
          level: u.level,
          is_current_user: u.id === userId,
        }));
        return JSON.stringify(ranking);
      }

      case "get_operational_metrics": {
        const now = new Date();
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString().split("T")[0];
        const today = now.toISOString().split("T")[0];

        const [leads, contracts, payables, receivables] = await Promise.all([
          supabaseClient.from("leads").select("id", { count: "exact", head: true }),
          supabaseClient
            .from("clinic_contracts")
            .select("vgv, contract_status")
            .not("contract_status", "eq", "distrato"),
          supabaseClient
            .from("neoteam_accounts_payable")
            .select("amount, status, due_date")
            .gte("due_date", monthStart)
            .lte("due_date", monthEnd),
          supabaseClient
            .from("neoteam_accounts_receivable")
            .select("amount, status, due_date")
            .gte("due_date", monthStart)
            .lte("due_date", monthEnd),
        ]);

        const payData = payables.data || [];
        const recData = receivables.data || [];
        const contData = contracts.data || [];

        return JSON.stringify({
          total_leads: leads.count || 0,
          contracts_active: contData.length,
          vgv_total: contData.reduce((s: number, c: any) => s + Number(c.vgv || 0), 0),
          month_revenue: recData.filter((r: any) => r.status === "recebido").reduce((s: number, r: any) => s + Number(r.amount), 0),
          month_expenses: payData.filter((p: any) => p.status === "pago").reduce((s: number, p: any) => s + Number(p.amount), 0),
          overdue_count:
            payData.filter((p: any) => p.status === "pendente" && p.due_date < today).length +
            recData.filter((r: any) => r.status === "pendente" && r.due_date < today).length,
          pending_receivable: recData.filter((r: any) => r.status === "pendente").reduce((s: number, r: any) => s + Number(r.amount), 0),
          pending_payable: payData.filter((p: any) => p.status === "pendente").reduce((s: number, p: any) => s + Number(p.amount), 0),
        });
      }

      case "get_leads_summary": {
        const pipelineId = args.pipeline_id;
        let query = supabaseClient.from("leads").select("pipeline_id, stage_id, status_id, created_at");
        if (pipelineId) query = query.eq("pipeline_id", parseInt(pipelineId));

        const { data: leadsData, count } = await query.limit(1000);

        // Get pipeline and stage names
        const [{ data: pipelines }, { data: stages }] = await Promise.all([
          supabaseClient.from("kommo_pipelines").select("kommo_id, name"),
          supabaseClient.from("kommo_stages").select("kommo_id, name, pipeline_id"),
        ]);

        const pipelineMap = Object.fromEntries((pipelines || []).map((p: any) => [p.kommo_id, p.name]));
        const stageMap = Object.fromEntries((stages || []).map((s: any) => [s.kommo_id, s.name]));

        // Group by pipeline
        const byPipeline: Record<string, any> = {};
        for (const lead of leadsData || []) {
          const pName = pipelineMap[lead.pipeline_id] || `Pipeline ${lead.pipeline_id}`;
          if (!byPipeline[pName]) byPipeline[pName] = { total: 0, stages: {} };
          byPipeline[pName].total++;
          const sName = stageMap[lead.stage_id] || `Stage ${lead.stage_id}`;
          byPipeline[pName].stages[sName] = (byPipeline[pName].stages[sName] || 0) + 1;
        }

        // New leads this month
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const newThisMonth = (leadsData || []).filter(
          (l: any) => new Date(l.created_at) >= monthStart
        ).length;

        return JSON.stringify({
          total_leads: leadsData?.length || 0,
          new_this_month: newThisMonth,
          by_pipeline: byPipeline,
        });
      }

      case "get_financial_summary": {
        const now = new Date();
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
        const today = now.toISOString().split("T")[0];

        const [payables, receivables] = await Promise.all([
          supabaseClient
            .from("neoteam_accounts_payable")
            .select("amount, status, due_date, category, supplier")
            .gte("due_date", monthStart)
            .lte("due_date", monthEnd),
          supabaseClient
            .from("neoteam_accounts_receivable")
            .select("amount, status, due_date, category, client_name")
            .gte("due_date", monthStart)
            .lte("due_date", monthEnd),
        ]);

        const payData = payables.data || [];
        const recData = receivables.data || [];

        const revenue = recData.filter((r: any) => r.status === "recebido").reduce((s: number, r: any) => s + Number(r.amount), 0);
        const expenses = payData.filter((p: any) => p.status === "pago").reduce((s: number, p: any) => s + Number(p.amount), 0);

        // By category
        const expensesByCategory: Record<string, number> = {};
        payData.filter((p: any) => p.status === "pago").forEach((p: any) => {
          const cat = p.category || "Outros";
          expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Number(p.amount);
        });

        return JSON.stringify({
          revenue,
          expenses,
          balance: revenue - expenses,
          overdue_payable: payData.filter((p: any) => p.status === "pendente" && p.due_date < today).length,
          overdue_receivable: recData.filter((r: any) => r.status === "pendente" && r.due_date < today).length,
          pending_receivable: recData.filter((r: any) => r.status === "pendente").reduce((s: number, r: any) => s + Number(r.amount), 0),
          pending_payable: payData.filter((p: any) => p.status === "pendente").reduce((s: number, p: any) => s + Number(p.amount), 0),
          expenses_by_category: expensesByCategory,
        });
      }

      case "get_contracts_summary": {
        const { data } = await supabaseClient
          .from("clinic_contracts")
          .select("contract_status, business_unit, vgv, procedure_type, created_at")
          .not("contract_status", "eq", "distrato");

        const contracts = data || [];
        const byStatus: Record<string, number> = {};
        const byUnit: Record<string, { count: number; vgv: number }> = {};

        contracts.forEach((c: any) => {
          byStatus[c.contract_status || "unknown"] = (byStatus[c.contract_status || "unknown"] || 0) + 1;
          const unit = c.business_unit || "Não definido";
          if (!byUnit[unit]) byUnit[unit] = { count: 0, vgv: 0 };
          byUnit[unit].count++;
          byUnit[unit].vgv += Number(c.vgv || 0);
        });

        return JSON.stringify({
          total_active: contracts.length,
          total_vgv: contracts.reduce((s: number, c: any) => s + Number(c.vgv || 0), 0),
          by_status: byStatus,
          by_business_unit: byUnit,
        });
      }

      case "get_notifications": {
        const { data } = await supabaseClient
          .from("announcements")
          .select("title, description, link_url, starts_at, expires_at, priority")
          .eq("is_active", true)
          .order("priority", { ascending: false })
          .limit(10);
        return JSON.stringify(data || []);
      }

      case "get_system_architecture": {
        const topic = args.topic || "geral";
        const info: Record<string, any> = {
          geral: {
            name: "NeoHub",
            description: "Ecossistema de gestão para clínicas capilares e grupo Neo",
            stack: "React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Supabase",
            portais: ["Admin", "NeoTeam", "NeoCare", "NeoLicense", "Academy/IBRAMEC", "Avivar"],
          },
          stack: {
            frontend: "React 18 + TypeScript + Vite",
            styling: "Tailwind CSS + shadcn/ui + Radix UI",
            state: "TanStack Query (React Query) + Context API",
            routing: "React Router DOM v6",
            backend: "Supabase (PostgreSQL + Edge Functions + Auth + Storage)",
            charts: "Recharts",
            icons: "Lucide React",
            crm_integration: "Kommo API v4",
            ai: "Lovable AI Gateway (Gemini 3 Flash)",
          },
          portais: {
            admin: "Gestão global: usuários, configurações, logs, métricas, code assistant",
            neoteam: "Operação interna: agenda, pacientes, prontuários, comercial/Kommo, financeiro, patrimônio, TI, bots",
            neocare: "Portal do paciente: consultas, documentos, evolução",
            neolicense: "Licenciados ByNeoFolic: cursos, metas, ranking, conquistas, certificados, indicações",
            academy: "IBRAMEC: educação, cursos, certificações, trilhas de aprendizado",
            avivar: "CRM/WhatsApp: agentes IA, kanbans, automações, follow-ups, agendamentos, chamadas",
          },
          permissoes: {
            sistema: "RBAC via UnifiedAuthContext + neohub_user_module_overrides",
            rpc: "get_user_context() retorna permissões consolidadas",
            guard: "ModuleGuard e canAccessModule() protegem rotas",
            portais: "user_portal_roles + allowed_portals (legado) fundidos no contexto",
            overrides: "neohub_user_module_overrides permite granularidade por usuário",
          },
          tabelas: {
            usuarios: "neohub_users, user_portal_roles, neohub_user_module_overrides",
            crm: "leads, kommo_pipelines, kommo_stages, kommo_users, lead_tasks, lead_contacts",
            clinica: "clinic_patients, clinic_contracts, clinic_appointments",
            financeiro: "neoteam_accounts_payable, neoteam_accounts_receivable",
            gamificacao: "achievements, user_achievements, monthly_goals",
            avivar: "avivar_accounts, avivar_agents, avivar_kanbans, avivar_automations, crm_conversations",
            marketing: "campaign_costs, ads_integration_config",
            logs: "system_event_logs, ai_usage_logs, admin_audit_log",
          },
          edge_functions: {
            ai: "jon-jobs-chat (agente IA), code-assistant-chat (análise de código)",
            crm: "kommo-sync (sincronização CRM), kommo-webhook (webhooks)",
            ads: "sync-ads-sheets (custos de anúncios)",
            avivar: "avivar-ai-chat, avivar-execute-automations, avivar-send-followup",
            auth: "Autenticação via Supabase Auth",
          },
        };

        return JSON.stringify(info[topic] || info.geral);
      }

      case "query_database": {
        const { table, select, filters, order, limit } = args;
        let query = supabaseClient.from(table).select(select || "*");

        if (filters) {
          for (const f of filters) {
            switch (f.operator) {
              case "eq": query = query.eq(f.column, f.value); break;
              case "neq": query = query.neq(f.column, f.value); break;
              case "gt": query = query.gt(f.column, f.value); break;
              case "lt": query = query.lt(f.column, f.value); break;
              case "gte": query = query.gte(f.column, f.value); break;
              case "lte": query = query.lte(f.column, f.value); break;
              case "like": query = query.like(f.column, f.value); break;
              case "ilike": query = query.ilike(f.column, f.value); break;
              case "is": query = query.is(f.column, f.value === "null" ? null : f.value); break;
              case "in": query = query.in(f.column, JSON.parse(f.value)); break;
            }
          }
        }

        if (order) {
          const [col, dir] = order.split(".");
          query = query.order(col, { ascending: dir !== "desc" });
        }

        query = query.limit(limit || 20);

        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ count: data?.length || 0, data: data || [] });
      }

      case "count_records": {
        const { table, filters } = args;
        let query = supabaseClient.from(table).select("id", { count: "exact", head: true });

        if (filters) {
          for (const f of filters) {
            switch (f.operator) {
              case "eq": query = query.eq(f.column, f.value); break;
              case "neq": query = query.neq(f.column, f.value); break;
              case "gt": query = query.gt(f.column, f.value); break;
              case "lt": query = query.lt(f.column, f.value); break;
              case "gte": query = query.gte(f.column, f.value); break;
              case "lte": query = query.lte(f.column, f.value); break;
              case "like": query = query.like(f.column, f.value); break;
              case "ilike": query = query.ilike(f.column, f.value); break;
              case "is": query = query.is(f.column, f.value === "null" ? null : f.value); break;
            }
          }
        }

        const { count, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ count: count || 0 });
      }

      default:
        return JSON.stringify({ error: `Tool '${toolName}' não reconhecida` });
    }
  } catch (err) {
    return JSON.stringify({ error: err instanceof Error ? err.message : "Erro na execução" });
  }
}

// ── Main handler ──────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const _logStart = Date.now();
  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user from auth header
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const auth = req.headers.get("authorization");
      if (auth) {
        const { data: { user } } = await supabaseClient.auth.getUser(auth.replace("Bearer ", ""));
        userId = user?.id || null;
        userEmail = user?.email || null;
      }
    } catch {}

    // Build messages with system prompt
    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const aiHeaders = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    };

    // ── Tool-calling loop (non-streaming) ──
    let currentMessages = [...fullMessages];
    let maxIterations = 8; // Safety limit

    while (maxIterations-- > 0) {
      const toolResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: aiHeaders,
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: currentMessages,
          tools,
          stream: false,
        }),
      });

      if (!toolResponse.ok) {
        if (toolResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (toolResponse.status === 402) {
          return new Response(JSON.stringify({ error: "Limite de uso atingido." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errorText = await toolResponse.text();
        console.error("AI gateway error:", toolResponse.status, errorText);
        return new Response(JSON.stringify({ error: "Erro ao processar" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const completion = await toolResponse.json();
      const choice = completion.choices?.[0];
      const assistantMessage = choice?.message;

      if (!assistantMessage) break;

      // If the model wants to call tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        currentMessages.push(assistantMessage);

        // Execute all tool calls in parallel
        const toolResults = await Promise.all(
          assistantMessage.tool_calls.map(async (tc: any) => {
            const args = typeof tc.function.arguments === "string"
              ? JSON.parse(tc.function.arguments)
              : tc.function.arguments || {};
            const result = await executeTool(tc.function.name, args, supabaseClient, userId);
            return {
              role: "tool",
              tool_call_id: tc.id,
              content: result,
            };
          })
        );

        currentMessages.push(...toolResults);
        continue; // Loop again for the model to process tool results
      }

      // No more tool calls — the model has a final response
      // Now stream it for the frontend
      break;
    }

    // ── Final streaming response ──
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: aiHeaders,
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: currentMessages,
        stream: true,
        // No tools here — just generate the final answer
      }),
    });

    if (!streamResponse.ok) {
      const errorText = await streamResponse.text();
      console.error("Stream error:", streamResponse.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao gerar resposta" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fire-and-forget: log AI usage
    supabaseClient.from("ai_usage_logs").insert({
      user_id: userId,
      user_email: userEmail,
      portal: "NeoTeam",
      module: "Jon Jobs Agent",
      action: "agent_chat_stream",
      edge_function: "jon-jobs-chat",
      ai_model: "google/gemini-3-flash-preview",
      processing_time_ms: Date.now() - _logStart,
      status: "success",
    }).then(() => {}).catch(() => {});

    return new Response(streamResponse.body, {
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
