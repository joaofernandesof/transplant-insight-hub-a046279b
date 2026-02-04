import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Avivar AI Agent v4 - Multi-Agent Hybrid Routing
 * 
 * Features:
 * - Multiple specialized agents per account (Commercial, Pre-op, Post-op, etc.)
 * - Hybrid routing: base by Kanban stage + full knowledge base access
 * - Tool-calling for agendas, products, and appointments
 * - Each agent has access to ALL knowledge, products, and agendas
 */

interface AgentRequest {
  conversationId: string;
  messageContent: string;
  leadPhone: string;
  leadName?: string;
  userId: string;
}

interface Product {
  product_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number | null;
  promotional_price: number | null;
  stock_quantity: number;
  is_active: boolean;
}

interface Agenda {
  agenda_id: string;
  agenda_name: string;
  professional_name: string;
  city: string;
  address: string;
}

interface RoutedAgent {
  agent_id: string;
  agent_name: string;
  personality: string | null;
  ai_identity: string | null;
  ai_instructions: string | null;
  ai_restrictions: string | null;
  ai_objective: string | null;
  tone_of_voice: string | null;
  company_name: string | null;
  professional_name: string | null;
  fluxo_atendimento: Record<string, unknown> | null;
  services: unknown[];
  target_kanbans: string[] | null;
  target_stages: string[] | null;
}

interface KanbanColumnInfo {
  kanban_name: string;
  column_name: string;
  column_key: string; // slug-like key for the tool
  ai_instruction: string | null;
  order_index: number;
}

// deno-lint-ignore no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

// ============================================
// TOOL DEFINITIONS - Extended with products
// ============================================

const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_agendas",
      description: "Lista todas as agendas/unidades disponíveis. Use quando o paciente perguntar onde atendemos, quais cidades, ou quando for agendar sem especificar unidade.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_knowledge_base",
      description: "Busca informações na base de conhecimento da clínica. Use para responder dúvidas sobre procedimentos, preços, cuidados pré/pós-operatório, etc.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Pergunta ou termo para buscar na base de conhecimento"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_products",
      description: "Lista produtos e serviços disponíveis na loja/catálogo. Use quando o paciente perguntar sobre produtos, preços de itens, ou o que está disponível para compra.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Categoria opcional para filtrar: 'produto', 'servico', 'pacote'. Se não especificado, lista todos."
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_available_slots",
      description: "Consulta horários disponíveis para agendamento em uma agenda/unidade específica. Use após o paciente escolher a cidade/unidade.",
      parameters: {
        type: "object",
        properties: {
          agenda_name: {
            type: "string",
            description: "Nome da unidade/agenda (ex: 'Juazeiro', 'São Paulo'). Case-insensitive."
          },
          date: {
            type: "string",
            description: "Data no formato YYYY-MM-DD. Se não especificada, busca para os próximos dias úteis."
          }
        },
        required: ["agenda_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_slot",
      description: "Verifica se um horário específico (data + hora) está disponível em uma agenda/unidade. Use SEMPRE quando o lead sugerir uma data/horário diferente dos oferecidos.",
      parameters: {
        type: "object",
        properties: {
          agenda_name: {
            type: "string",
            description: "Nome da unidade/agenda (ex: 'Juazeiro'). Case-insensitive."
          },
          date: {
            type: "string",
            description: "Data preferida do lead. Preferencialmente no formato YYYY-MM-DD (aceita também DD/MM ou DD/MM/YYYY)."
          },
          time: {
            type: "string",
            description: "Horário preferido do lead no formato HH:MM (ex: 09:30)."
          }
        },
        required: ["agenda_name", "date", "time"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_appointment",
      description: "Cria um agendamento na agenda/unidade específica. Use após confirmação de data, horário e unidade.",
      parameters: {
        type: "object",
        properties: {
          agenda_name: {
            type: "string",
            description: "Nome da unidade/agenda onde criar o agendamento (ex: 'Juazeiro')"
          },
          patient_name: {
            type: "string",
            description: "Nome completo do paciente"
          },
          date: {
            type: "string",
            description: "Data do agendamento no formato YYYY-MM-DD"
          },
          time: {
            type: "string",
            description: "Horário no formato HH:MM"
          },
          service_type: {
            type: "string",
            description: "Tipo de serviço: 'avaliacao' ou 'transplante'"
          },
          notes: {
            type: "string",
            description: "Observações adicionais (opcional)"
          }
        },
        required: ["agenda_name", "patient_name", "date", "time", "service_type"]
      }
    }
      },
      {
        type: "function",
        function: {
          name: "transfer_to_human",
          description: "Transfere a conversa para um atendente humano. Use quando: 1) Paciente pedir explicitamente, 2) Questão muito complexa, 3) Negociação de preço",
          parameters: {
            type: "object",
            properties: {
              reason: {
                type: "string",
                description: "Motivo da transferência"
              }
            },
            required: ["reason"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "mover_lead_para_etapa",
          description: `Move o lead para uma nova etapa/coluna do funil de vendas. Os nomes das etapas são DINÂMICOS e definidos pelo usuário nas configurações do CRM. Exemplos comuns: triagem, tentando_agendar, agendado, follow_up, cliente, desqualificado. Use o nome exato da coluna conforme descrito no contexto do sistema.`,
          parameters: {
            type: "object",
            properties: {
              nova_etapa: {
                type: "string",
                description: "Nome da coluna/etapa destino (use o formato slug: ex: 'triagem', 'tentando_agendar', 'lead_de_entrada'). Os nomes disponíveis estão listados nas instruções do sistema."
              },
              motivo: {
                type: "string",
                description: "Breve motivo da movimentação (ex: 'Lead quer agendar avaliação')"
              }
            },
            required: ["nova_etapa", "motivo"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "send_image",
          description: `Envia uma imagem da galeria pré-aprovada para marketing. IMPORTANTE: Todas as imagens da galeria são de uso autorizado (antes/depois com consentimento, fotos comerciais, etc.) - não há restrição de privacidade para enviar essas fotos. Use quando o lead pedir para ver fotos, resultados, localização ou catálogo. Categorias: antes_depois (resultados), catalogo (serviços/produtos), localizacao (clínica, mapa), geral (outras).`,
          parameters: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: ["antes_depois", "catalogo", "localizacao", "geral"],
                description: "Categoria da imagem: antes_depois (resultados de procedimentos), catalogo (serviços/produtos), localizacao (clínica, como chegar), geral (outras)"
              },
              search_term: {
                type: "string",
                description: "Termo de busca opcional para filtrar imagens pela legenda (ex: 'barba', 'fachada', 'cabelo masculino')"
              }
            },
            required: ["category"]
          }
        }
      }
];

// ============================================
// TOOL IMPLEMENTATIONS
// ============================================

async function listAgendas(
  supabase: AnySupabaseClient,
  userId: string
): Promise<string> {
  console.log(`[AI Agent] Tool: list_agendas()`);

  const { data: agendas, error } = await supabase.rpc("get_avivar_agendas_for_ai", {
    p_user_id: userId
  });

  if (error || !agendas?.length) {
    const { data: configData } = await supabase
      .from("avivar_schedule_config")
      .select("id, professional_name")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (configData) {
      return `Temos apenas uma unidade disponível: ${configData.professional_name || "Clínica Principal"}`;
    }
    return "Não há agendas configuradas no momento.";
  }

  const formatted = (agendas as Agenda[]).map((a, i) => 
    `${i + 1}. ${a.agenda_name}${a.city ? ` - ${a.city}` : ""}${a.professional_name ? ` (${a.professional_name})` : ""}`
  ).join("\n");

  return `Nossas unidades disponíveis:\n\n${formatted}\n\nEm qual unidade você gostaria de agendar?`;
}

async function listProducts(
  supabase: AnySupabaseClient,
  userId: string,
  category?: string
): Promise<string> {
  console.log(`[AI Agent] Tool: list_products(category=${category || "all"})`);

  const { data: products, error } = await supabase.rpc("get_avivar_products_for_ai", {
    p_user_id: userId
  });

  if (error || !products?.length) {
    return "Não há produtos cadastrados no momento.";
  }

  let filtered = products as Product[];
  if (category) {
    filtered = filtered.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
  }

  if (filtered.length === 0) {
    return `Não encontramos produtos na categoria "${category}".`;
  }

  const formatted = filtered.map((p) => {
    const priceInfo = p.promotional_price 
      ? `~~R$ ${p.price?.toFixed(2)}~~ **R$ ${p.promotional_price.toFixed(2)}** (promoção!)`
      : p.price 
        ? `R$ ${p.price.toFixed(2)}`
        : "Consulte";
    
    const stockInfo = p.stock_quantity > 0 
      ? `✅ ${p.stock_quantity} em estoque`
      : "⚠️ Sob consulta";
    
    return `• **${p.name}**${p.description ? ` - ${p.description}` : ""}\n  💰 ${priceInfo} | ${stockInfo}`;
  }).join("\n\n");

  return `Nossos produtos disponíveis:\n\n${formatted}`;
}

async function searchKnowledgeBase(
  supabase: AnySupabaseClient,
  userId: string,
  _agentId: string | null, // Ignoramos agentId - acesso à base completa
  query: string
): Promise<string> {
  console.log(`[AI Agent] Tool: search_knowledge_base("${query.substring(0, 50)}...") - FULL ACCESS`);

  const queryTerms = query.toLowerCase().split(" ").filter(t => t.length > 2);
  const allKnowledge: Array<{ content: string; source: string }> = [];

  // SOURCE 1: avivar_knowledge_documents + chunks (tabela de documentos)
  const { data: documents } = await supabase
    .from("avivar_knowledge_documents")
    .select("id, name")
    .eq("user_id", userId);

  if (documents?.length) {
    console.log(`[AI Agent] Found ${documents.length} documents in avivar_knowledge_documents`);
    const docIds = documents.map((d: { id: string }) => d.id);

    const { data: chunks } = await supabase
      .from("avivar_knowledge_chunks")
      .select("content")
      .in("document_id", docIds)
      .limit(20);

    if (chunks?.length) {
      chunks.forEach((c: { content: string }) => {
        allKnowledge.push({ content: c.content, source: "documents" });
      });
    }
  }

  // SOURCE 2: knowledge_files JSONB field in avivar_agents (inline files from wizard)
  const { data: agents } = await supabase
    .from("avivar_agents")
    .select("id, name, knowledge_files")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (agents?.length) {
    for (const agent of agents) {
      if (agent.knowledge_files && Array.isArray(agent.knowledge_files)) {
        console.log(`[AI Agent] Found ${agent.knowledge_files.length} inline files in agent "${agent.name}"`);
        for (const file of agent.knowledge_files) {
          if (file.content && typeof file.content === "string") {
            // Split large content into chunks of ~500 chars for better relevance scoring
            const content = file.content;
            const chunkSize = 500;
            for (let i = 0; i < content.length; i += chunkSize) {
              allKnowledge.push({ 
                content: content.substring(i, i + chunkSize), 
                source: `agent:${agent.name}` 
              });
            }
          }
        }
      }
    }
  }

  if (allKnowledge.length === 0) {
    console.log("[AI Agent] No knowledge found in any source");
    return "Nenhuma informação encontrada na base de conhecimento.";
  }

  console.log(`[AI Agent] Total knowledge chunks to search: ${allKnowledge.length}`);

  // Score and rank all knowledge by relevance
  const scoredKnowledge = allKnowledge.map((k) => {
    const contentLower = k.content.toLowerCase();
    // More granular scoring - count occurrences, not just presence
    let score = 0;
    for (const term of queryTerms) {
      const matches = (contentLower.match(new RegExp(term, "gi")) || []).length;
      score += matches * (term.length > 5 ? 2 : 1); // Longer terms get more weight
    }
    return { ...k, score };
  }).filter(k => k.score > 0) // Only include chunks with at least one match
    .sort((a, b) => b.score - a.score);

  if (scoredKnowledge.length === 0) {
    console.log(`[AI Agent] No relevant knowledge found for query terms: ${queryTerms.join(", ")}`);
    return "Nenhuma informação específica encontrada para esta consulta.";
  }

  const topChunks = scoredKnowledge.slice(0, 5);
  console.log(`[AI Agent] Returning ${topChunks.length} relevant chunks (top score: ${topChunks[0]?.score})`);
  
  return topChunks.map((c) => c.content).join("\n\n---\n\n");
}

type ResolvedAgendaInfo = {
  agendaId: string | null;
  agendaInfo: { id: string; name: string; city: string | null; professional_name: string | null; address?: string | null } | null;
};

function normalizeTimeHHMM(raw: string): string | null {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;

  // Accept HH:MM or HH:MM:SS
  const match = trimmed.match(/^(\d{1,2})\s*[:h]\s*(\d{2})(?::\d{2})?$/i);
  if (!match) return null;

  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function normalizeDateISO(raw: string, now = new Date()): string | null {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // DD/MM or DD/MM/YYYY
  const m = trimmed.match(/^(\d{2})\/(\d{2})(?:\/(\d{4}))?$/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = m[3] ? Number(m[3]) : now.getFullYear();
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 2100) return null;
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return iso;
  }

  return null;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

async function resolveAgenda(
  supabase: AnySupabaseClient,
  userId: string,
  agendaName: string
): Promise<ResolvedAgendaInfo> {
  const { data: agendas } = await supabase
    .from("avivar_agendas")
    .select("id, name, city, professional_name, address")
    .eq("user_id", userId)
    .eq("is_active", true)
    .ilike("name", `%${agendaName}%`);

  let agendaInfo = agendas?.[0] || null;

  if (!agendaInfo) {
    const { data: byCity } = await supabase
      .from("avivar_agendas")
      .select("id, name, city, professional_name, address")
      .eq("user_id", userId)
      .eq("is_active", true)
      .ilike("city", `%${agendaName}%`);
    agendaInfo = byCity?.[0] || null;
  }

  return {
    agendaId: agendaInfo?.id || null,
    agendaInfo,
  };
}

async function getAvailableSlots(
  supabase: AnySupabaseClient,
  userId: string,
  agendaName: string,
  dateStr?: string
): Promise<string> {
  console.log(`[AI Agent] Tool: get_available_slots(agenda="${agendaName}", date=${dateStr || "próximos dias"})`);

  const { agendaId, agendaInfo } = await resolveAgenda(supabase, userId, agendaName);

  const dates: string[] = [];
  if (dateStr) {
    dates.push(dateStr);
  } else {
    const today = new Date();
    let count = 0;
    let d = new Date(today);
    while (count < 3) {
      d.setDate(d.getDate() + 1);
      const dow = d.getDay();
      if (dow !== 0) {
        dates.push(d.toISOString().split("T")[0]);
        count++;
      }
    }
  }

  const results: string[] = [];
  
  for (const date of dates) {
    const { data: slots, error } = await supabase.rpc("get_available_slots_flexible", {
      p_user_id: userId,
      p_agenda_id: agendaId,
      p_date: date,
      p_duration_minutes: 30
    });

    if (error) {
      console.error("[AI Agent] Error getting slots:", error);
      continue;
    }

    const available = (slots || []).filter((s: { is_available: boolean }) => s.is_available);
    
    if (available.length > 0) {
      const dateObj = new Date(date + "T12:00:00");
      const dayName = dateObj.toLocaleDateString("pt-BR", { weekday: "long" });
      const dateFormatted = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      
      // TÉCNICA "OU/OU": Mostrar apenas 2 horários para facilitar decisão do lead
      // Internamente guardamos todos os slots disponíveis para validação posterior
      const allTimes = available.map((s: { slot_start: string }) => 
        s.slot_start.substring(0, 5)
      );
      
      // Escolher 2 horários estratégicos: um pela manhã e um à tarde se possível
      const morningSlots = allTimes.filter((t: string) => parseInt(t.split(":")[0]) < 12);
      const afternoonSlots = allTimes.filter((t: string) => parseInt(t.split(":")[0]) >= 12);
      
      let selectedTimes: string[] = [];
      if (morningSlots.length > 0 && afternoonSlots.length > 0) {
        // Um slot de manhã e um à tarde
        selectedTimes = [morningSlots[0], afternoonSlots[0]];
      } else {
        // Apenas 2 primeiros slots disponíveis
        selectedTimes = allTimes.slice(0, 2);
      }
      
      results.push(`📅 ${dayName} (${dateFormatted}): ${selectedTimes.join(" ou ")}`);
    }
  }

  if (results.length === 0) {
    return `Não há horários disponíveis para os próximos dias${agendaInfo ? ` em ${agendaInfo.name}` : ""}. Por favor, entre em contato para verificar outras opções.`;
  }

  const header = agendaInfo 
    ? `Horários disponíveis em **${agendaInfo.name}**${agendaInfo.city ? ` (${agendaInfo.city})` : ""}:`
    : "Horários disponíveis:";

  // Limitar a 2 datas para técnica "ou/ou"
  const limitedResults = results.slice(0, 2);

  return `${header}\n\n${limitedResults.join("\n")}\n\nQual desses horários fica melhor para você?`;
}

async function checkSlot(
  supabase: AnySupabaseClient,
  userId: string,
  agendaName: string,
  rawDate: string,
  rawTime: string
): Promise<string> {
  const normalizedTime = normalizeTimeHHMM(rawTime);
  const normalizedDate = normalizeDateISO(rawDate);

  console.log(
    `[AI Agent] Tool: check_slot(agenda="${agendaName}", date=${rawDate}=>${normalizedDate || "invalid"}, time=${rawTime}=>${normalizedTime || "invalid"})`
  );

  if (!normalizedDate) {
    return "Não entendi a data. Você pode me dizer no formato 09/02 ou 2026-02-09?";
  }
  if (!normalizedTime) {
    return "Não entendi o horário. Você pode me dizer no formato 09:30?";
  }

  const { agendaId } = await resolveAgenda(supabase, userId, agendaName);

  const { data: slots, error } = await supabase.rpc("get_available_slots_flexible", {
    p_user_id: userId,
    p_agenda_id: agendaId,
    p_date: normalizedDate,
    p_duration_minutes: 30,
  });

  if (error) {
    console.error("[AI Agent] Error checking slot:", error);
    return "Não consegui verificar a agenda agora. Qual outra data e horário você prefere?";
  }

  const allTimes = (slots || [])
    .map((s: { slot_start: string }) => s.slot_start.substring(0, 5))
    .filter(Boolean)
    .sort((a: string, b: string) => timeToMinutes(a) - timeToMinutes(b));

  const availableTimes = (slots || [])
    .filter((s: { is_available: boolean }) => s.is_available)
    .map((s: { slot_start: string }) => s.slot_start.substring(0, 5))
    .filter(Boolean)
    .sort((a: string, b: string) => timeToMinutes(a) - timeToMinutes(b));

  const dateObj = new Date(normalizedDate + "T12:00:00");
  const dayName = dateObj.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateFormatted = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  if (availableTimes.includes(normalizedTime)) {
    return `Sim, ${dayName} (${dateFormatted}) às ${normalizedTime} está disponível. Posso confirmar o agendamento?`;
  }

  if (availableTimes.length === 0) {
    return `Para ${dayName} (${dateFormatted}) não encontrei horários disponíveis. Qual outra data e horário ficaria melhor pra você?`;
  }

  const target = timeToMinutes(normalizedTime);
  const suggestions = availableTimes
    .map((t: string) => ({ t, diff: Math.abs(timeToMinutes(t) - target) }))
    .sort((a: { t: string; diff: number }, b: { t: string; diff: number }) => a.diff - b.diff)
    .slice(0, 2)
    .map((x: { t: string }) => x.t);

  const suggestionText = suggestions.length === 1
    ? suggestions[0]
    : `${suggestions[0]} ou ${suggestions[1]}`;

  // Diferenciar: (1) horário existe na grade mas está ocupado/bloqueado vs (2) horário fora do expediente/turno
  const existsInGrid = allTimes.includes(normalizedTime);
  if (!existsInGrid) {
    // Tentar explicar que é fora do horário configurado, sem afirmar que está "ocupado"
    try {
      const dow = new Date(normalizedDate + "T12:00:00").getDay();
      // Buscar o schedule_config da agenda (fallback para o mais recente do user)
      let configId: string | null = null;
      if (agendaId) {
        const { data: byAgenda } = await supabase
          .from("avivar_schedule_config")
          .select("id")
          .eq("agenda_id", agendaId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        configId = byAgenda?.id || null;
      }
      if (!configId) {
        const { data: byUser } = await supabase
          .from("avivar_schedule_config")
          .select("id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        configId = byUser?.id || null;
      }

      let periodsText: string | null = null;
      if (configId) {
        const { data: periods } = await supabase
          .from("avivar_schedule_hours")
          .select("start_time, end_time")
          .eq("schedule_config_id", configId)
          .eq("day_of_week", dow)
          .eq("is_enabled", true)
          .order("start_time");

        if (periods?.length) {
          periodsText = periods
            .map((p: { start_time: string; end_time: string }) => `${p.start_time.substring(0, 5)}–${p.end_time.substring(0, 5)}`)
            .join(" e ");
        }
      }

      if (periodsText) {
        return `Nesse dia a agenda não atende às ${normalizedTime} (atendimento: ${periodsText}). Tenho ${suggestionText}. Qual fica melhor para você?`;
      }
    } catch (e) {
      console.error("[AI Agent] Error building periods text:", e);
    }

    return `Nesse dia a agenda não atende às ${normalizedTime}. Tenho ${suggestionText}. Qual fica melhor para você?`;
  }

  return `Esse horário já está reservado. Para ${dayName} (${dateFormatted}) tenho ${suggestionText}. Qual fica melhor para você?`;
}

async function createAppointment(
  supabase: AnySupabaseClient,
  userId: string,
  leadId: string | null,
  conversationId: string,
  agendaName: string,
  patientName: string,
  patientPhone: string,
  date: string,
  time: string,
  serviceType: string,
  notes?: string
): Promise<string> {
  console.log(`[AI Agent] Tool: create_appointment(agenda="${agendaName}", ${patientName}, ${date} ${time})`);

  const { agendaId, agendaInfo } = await resolveAgenda(supabase, userId, agendaName);

  const normalizedDate = normalizeDateISO(date);
  const normalizedTime = normalizeTimeHHMM(time);
  if (!normalizedDate || !normalizedTime) {
    return "Não consegui entender a data/horário para agendar. Você pode confirmar no formato 2026-02-09 às 09:30?";
  }

  const [hours, minutes] = normalizedTime.split(":").map(Number);
  const endHours = Math.floor((hours * 60 + minutes + 30) / 60);
  const endMinutes = (hours * 60 + minutes + 30) % 60;
  const endTime = `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;

  const { data: slots } = await supabase.rpc("get_available_slots_flexible", {
    p_user_id: userId,
    p_agenda_id: agendaId,
    p_date: normalizedDate,
    p_duration_minutes: 30
  });

  const slotAvailable = (slots || []).some((s: { slot_start: string; is_available: boolean }) => 
    s.slot_start.substring(0, 5) === normalizedTime && s.is_available
  );

  if (!slotAvailable) {
    return `❌ Infelizmente o horário ${normalizedTime} do dia ${normalizedDate} não está mais disponível. Por favor, escolha outro horário.`;
  }

  const { data: appointment, error } = await supabase
    .from("avivar_appointments")
    .insert({
      user_id: userId,
      agenda_id: agendaId,
      lead_id: leadId,
      conversation_id: conversationId,
      patient_name: patientName,
      patient_phone: patientPhone,
      appointment_date: normalizedDate,
      start_time: normalizedTime + ":00",
      end_time: endTime + ":00",
      service_type: serviceType === "avaliacao" ? "Avaliação Capilar" : "Transplante Capilar",
      location: agendaInfo?.city || null,
      professional_name: agendaInfo?.professional_name || null,
      notes: notes || null,
      status: "scheduled",
      created_by: "ai"
    })
    .select()
    .single();

  if (error) {
    console.error("[AI Agent] Error creating appointment:", error);
    return "❌ Ocorreu um erro ao criar o agendamento. Por favor, tente novamente ou entre em contato conosco.";
  }

  const dateObj = new Date(normalizedDate + "T12:00:00");
  const dayName = dateObj.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateFormatted = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const locationInfo = agendaInfo?.city 
    ? `\n📍 Local: ${agendaInfo.name}${agendaInfo.address ? ` - ${agendaInfo.address}` : ""}`
    : "";

  return `✅ Agendamento confirmado!

📅 Data: ${dayName}, ${dateFormatted}
⏰ Horário: ${normalizedTime}
👤 Paciente: ${patientName}
📋 Tipo: ${serviceType === "avaliacao" ? "Avaliação Capilar" : "Transplante Capilar"}${locationInfo}

Você receberá uma confirmação por WhatsApp. Aguardamos você!`;
}

async function transferToHuman(
  supabase: AnySupabaseClient,
  conversationId: string,
  reason: string
): Promise<string> {
  console.log(`[AI Agent] Tool: transfer_to_human("${reason}")`);

  await supabase
    .from("crm_conversations")
    .update({ 
      ai_enabled: false,
      status: "pending"
    })
    .eq("id", conversationId);

  return `Vou transferir você para um de nossos especialistas. Motivo: ${reason}. Aguarde um momento, por favor! 🙂`;
}

// Legacy fallback map - used only if dynamic column search fails
const STAGE_TO_COLUMN_MAP: Record<string, string> = {
  "triagem": "Triagem",
  "tentando_agendar": "Tentando Agendar",
  "agendado": "Agendado",
  "reagendamento": "Reagendamento",
  "follow_up": "Follow Up",
  "cliente": "Cliente",
  "desqualificado": "Desqualificados",
  // Added more variants for flexibility
  "lead_de_entrada": "Lead de Entrada",
  "onboarding": "Onboarding",
  "contrato_assinado": "Contrato Assinado"
};

async function moverLeadParaEtapa(
  supabase: AnySupabaseClient,
  leadPhone: string,
  novaEtapa: string,
  motivo: string
): Promise<string> {
  console.log(`[AI Agent] Tool: mover_lead_para_etapa(etapa="${novaEtapa}", motivo="${motivo}")`);

  // Find the lead by phone
  const { data: lead, error: leadError } = await supabase
    .from("avivar_kanban_leads")
    .select("id, kanban_id, column_id, name")
    .eq("phone", leadPhone)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (leadError || !lead) {
    console.error("[AI Agent] Lead not found:", leadError);
    return "Lead não encontrado no Kanban.";
  }

  // Try to find the target column by dynamic name/slug matching
  // First: try exact match with the slug (column_key format: "lead_de_entrada")
  let { data: targetColumn, error: columnError } = await supabase
    .from("avivar_kanban_columns")
    .select("id, name")
    .eq("kanban_id", lead.kanban_id)
    .ilike("name", novaEtapa.replace(/_/g, " ")) // Convert slug back to name
    .maybeSingle();

  // Second: try partial match with the original column name
  if (!targetColumn) {
    const fallbackName = STAGE_TO_COLUMN_MAP[novaEtapa];
    if (fallbackName) {
      const { data: fallbackColumn } = await supabase
        .from("avivar_kanban_columns")
        .select("id, name")
        .eq("kanban_id", lead.kanban_id)
        .ilike("name", `%${fallbackName}%`)
        .maybeSingle();
      targetColumn = fallbackColumn;
    }
  }

  // Third: try searching in ALL kanbans of this user for the column name
  if (!targetColumn) {
    console.log(`[AI Agent] Column not found in current kanban, searching all kanbans...`);
    
    // Get user_id from lead
    const { data: leadData } = await supabase
      .from("avivar_kanban_leads")
      .select("user_id")
      .eq("id", lead.id)
      .single();

    if (leadData?.user_id) {
      // Get all kanbans for this user
      const { data: allKanbans } = await supabase
        .from("avivar_kanbans")
        .select("id")
        .eq("user_id", leadData.user_id)
        .eq("is_active", true);

      if (allKanbans?.length) {
        const kanbanIds = allKanbans.map(k => k.id);
        
        // Search for column across all kanbans
        const { data: crossColumn } = await supabase
          .from("avivar_kanban_columns")
          .select("id, name, kanban_id")
          .in("kanban_id", kanbanIds)
          .ilike("name", `%${novaEtapa.replace(/_/g, " ")}%`)
          .limit(1)
          .maybeSingle();

        if (crossColumn) {
          targetColumn = crossColumn;
          // Update lead's kanban_id if moving to different kanban
          if (crossColumn.kanban_id !== lead.kanban_id) {
            console.log(`[AI Agent] Moving lead to different Kanban: ${crossColumn.kanban_id}`);
            await supabase
              .from("avivar_kanban_leads")
              .update({ kanban_id: crossColumn.kanban_id })
              .eq("id", lead.id);
          }
        }
      }
    }
  }

  if (columnError || !targetColumn) {
    console.error(`[AI Agent] Column "${novaEtapa}" not found anywhere`);
    return `Coluna "${novaEtapa}" não encontrada no funil. Verifique o nome exato da coluna.`;
  }

  // Move the lead to the new column
  const { error: updateError } = await supabase
    .from("avivar_kanban_leads")
    .update({ 
      column_id: targetColumn.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", lead.id);

  if (updateError) {
    console.error("[AI Agent] Error moving lead:", updateError);
    return "Erro ao mover lead.";
  }

  console.log(`[AI Agent] ✅ Lead "${lead.name}" moved to "${targetColumn.name}" - Reason: ${motivo}`);
  return `Lead movido para "${targetColumn.name}".`;
}

// ============================================
// SEND IMAGE TOOL
// ============================================

interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  category: string;
}

interface ImageGallery {
  before_after: GalleryImage[];
  catalog: GalleryImage[];
  location: GalleryImage[];
  general: GalleryImage[];
}

async function sendImage(
  supabase: AnySupabaseClient,
  userId: string,
  agentId: string | null,
  conversationId: string,
  leadPhone: string,
  category: string,
  searchTerm?: string
): Promise<{ success: boolean; message: string; imageUrl?: string }> {
  console.log(`[AI Agent] Tool: send_image(category="${category}", search="${searchTerm || ''}")`);

  // Map category from tool to gallery key
  const categoryMap: Record<string, keyof ImageGallery> = {
    "antes_depois": "before_after",
    "before_after": "before_after",
    "catalogo": "catalog",
    "catalog": "catalog",
    "localizacao": "location",
    "location": "location",
    "geral": "general",
    "general": "general"
  };

  const galleryKey = categoryMap[category.toLowerCase()] || "general";

  // Get the agent's image gallery
  let gallery: ImageGallery | null = null;

  if (agentId) {
    const { data: agent } = await supabase
      .from("avivar_agents")
      .select("image_gallery, before_after_images")
      .eq("id", agentId)
      .single();

    if (agent?.image_gallery) {
      gallery = agent.image_gallery as ImageGallery;
    } else if (agent?.before_after_images && Array.isArray(agent.before_after_images)) {
      // Fallback to legacy before_after_images
      gallery = {
        before_after: agent.before_after_images.map((url: string, i: number) => ({
          id: `legacy_${i}`,
          url,
          caption: "",
          category: "before_after"
        })),
        catalog: [],
        location: [],
        general: []
      };
    }
  }

  // If no agent gallery, try to get from any agent of this user
  if (!gallery) {
    const { data: agents } = await supabase
      .from("avivar_agents")
      .select("image_gallery, before_after_images")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1);

    if (agents?.[0]?.image_gallery) {
      gallery = agents[0].image_gallery as ImageGallery;
    } else if (agents?.[0]?.before_after_images && Array.isArray(agents[0].before_after_images)) {
      gallery = {
        before_after: agents[0].before_after_images.map((url: string, i: number) => ({
          id: `legacy_${i}`,
          url,
          caption: "",
          category: "before_after"
        })),
        catalog: [],
        location: [],
        general: []
      };
    }
  }

  if (!gallery) {
    console.log("[AI Agent] No image gallery found");
    return { success: false, message: "Ainda não temos imagens configuradas nesta categoria." };
  }

  const images = gallery[galleryKey] || [];
  
  if (images.length === 0) {
    console.log(`[AI Agent] No images in category ${galleryKey}`);
    return { success: false, message: `Não temos imagens na categoria "${category}" ainda.` };
  }

  // Synonym map for expanding search terms (Portuguese)
  const SYNONYMS: Record<string, string[]> = {
    // Location/building terms
    "frente": ["fachada", "entrada", "exterior", "predio", "prédio"],
    "fachada": ["frente", "entrada", "exterior", "predio", "prédio"],
    "entrada": ["fachada", "frente", "porta", "recepção", "recepcao"],
    "clinica": ["consultório", "consultorio", "clínica", "unidade", "estabelecimento"],
    "consultorio": ["clínica", "clinica", "consultório"],
    // Hair transplant terms
    "cabelo": ["capilar", "couro cabeludo", "calvície", "calvicie"],
    "capilar": ["cabelo", "calvície", "calvicie"],
    "barba": ["bigode", "cavanhaque", "pelos faciais", "facial"],
    "sobrancelha": ["sombrancelha", "supercílio"],
    // Gender terms
    "homem": ["masculino", "masc", "homen"],
    "masculino": ["homem", "masc", "homen"],
    "mulher": ["feminino", "fem", "feminina"],
    "feminino": ["mulher", "fem", "feminina"],
    // Procedure terms
    "antes": ["anterior", "pré", "pre"],
    "depois": ["posterior", "pós", "pos", "resultado"],
    "resultado": ["depois", "final", "pós", "pos"],
    // Facility terms
    "estacionamento": ["garagem", "vaga", "parking"],
    "recepção": ["recepcao", "entrada", "atendimento", "sala de espera"],
    "sala": ["ambiente", "espaço", "espaco", "local"],
  };

  // Expand search term with synonyms
  const expandSearchTerms = (term: string): string[] => {
    const termLower = term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const terms = [termLower];
    
    // Add synonyms for each word in the term
    const words = termLower.split(/\s+/);
    for (const word of words) {
      const synonyms = SYNONYMS[word];
      if (synonyms) {
        for (const syn of synonyms) {
          // Add the term with the word replaced by synonym
          terms.push(termLower.replace(word, syn));
          terms.push(syn); // Also add just the synonym
        }
      }
    }
    
    return [...new Set(terms)]; // Remove duplicates
  };

  // Filter by search term if provided
  let selectedImage: GalleryImage;
  
  if (searchTerm) {
    const searchTerms = expandSearchTerms(searchTerm);
    console.log(`[AI Agent] Expanded search terms: ${searchTerms.join(", ")}`);
    
    const matching = images.filter((img: GalleryImage) => {
      const captionLower = img.caption?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
      return searchTerms.some(term => captionLower.includes(term));
    });
    
    if (matching.length > 0) {
      // Pick random from matching
      selectedImage = matching[Math.floor(Math.random() * matching.length)];
      console.log(`[AI Agent] Found ${matching.length} matching image(s)`);
    } else {
      // CRITICAL: Do NOT send a random image if no match found
      console.log(`[AI Agent] No images matching "${searchTerm}" (expanded: ${searchTerms.join(", ")}) in category ${galleryKey}`);
      return { 
        success: false, 
        message: `Não encontrei fotos com as características "${searchTerm}" na galeria. Pergunte ao paciente se deseja ver outros tipos de resultados que temos disponíveis.` 
      };
    }
  } else {
    // No search term - pick random image from category
    selectedImage = images[Math.floor(Math.random() * images.length)];
  }

  console.log(`[AI Agent] Selected image: ${selectedImage.url.substring(0, 50)}...`);

  // Get user's connected WhatsApp instance (UazAPI provisioning)
  // NOTE: This project uses avivar_uazapi_instances for connected WhatsApp accounts.
  // avivar_whatsapp_sessions is a legacy table and is not used for sending.
  const uazapiUrl = Deno.env.get("UAZAPI_URL") || "";
  let uazapiToken = Deno.env.get("UAZAPI_TOKEN") || "";

  const { data: uazapiInstance, error: uazapiInstanceError } = await supabase
    .from("avivar_uazapi_instances")
    .select("instance_token, status")
    .eq("user_id", userId)
    .eq("status", "connected")
    .limit(1)
    .maybeSingle();

  if (uazapiInstanceError) {
    console.error("[AI Agent] Error fetching UazAPI instance:", uazapiInstanceError);
  }
  if (uazapiInstance?.instance_token) {
    uazapiToken = uazapiInstance.instance_token;
  }

  if (!uazapiUrl || !uazapiToken) {
    console.log("[AI Agent] UazAPI not configured/connected; returning URL only");
    return {
      success: false,
      message: `Não consegui enviar a imagem agora porque o WhatsApp não está conectado. Link: ${selectedImage.url}`,
      imageUrl: selectedImage.url,
    };
  }

  // Send image via UazAPI
  try {
    let phone = leadPhone.replace(/\D/g, "");
    if (!phone.startsWith("55") && phone.length <= 11) {
      phone = `55${phone}`;
    }

    const apiUrl = `${uazapiUrl}/send/media`;
    console.log(`[AI Agent] Sending image to ${phone} via ${apiUrl}`);
    console.log(`[AI Agent] Image URL: ${selectedImage.url}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": uazapiToken,
      },
      body: JSON.stringify({
        number: phone,
        type: "image",
        file: selectedImage.url,
        text: " ", // Caption is for internal AI filtering only - never send to lead
      }),
    });

    const responseText = await response.text();
    console.log(`[AI Agent] UazAPI response (${response.status}): ${responseText}`);

    if (!response.ok) {
      console.error("[AI Agent] Failed to send image, attempting link fallback:", responseText);

      // Fallback: send the URL as a text message, so the lead receives something.
      try {
        const fallbackRes = await fetch(`${uazapiUrl}/send/text`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": uazapiToken,
          },
          body: JSON.stringify({
            number: phone,
            text: selectedImage.url, // Only send URL, caption is for internal AI filtering only
          }),
        });
        const fallbackText = await fallbackRes.text();
        console.log(`[AI Agent] Fallback /send/text (${fallbackRes.status}): ${fallbackText}`);
      } catch (fallbackErr) {
        console.error("[AI Agent] Fallback /send/text failed:", fallbackErr);
      }

      return {
        success: false,
        message: `Não consegui enviar a imagem como mídia. Enviei o link para o paciente: ${selectedImage.url}`,
        imageUrl: selectedImage.url,
      };
    }

    // Save message to CRM (best-effort)
    await supabase.from("crm_messages").insert({
      conversation_id: conversationId,
      direction: "outbound",
      content: selectedImage.caption || "[Imagem enviada]",
      media_url: selectedImage.url,
      media_type: "image",
      sent_at: new Date().toISOString(),
      is_ai_generated: true,
    });

    console.log("[AI Agent] ✅ Image sent successfully");
    return {
      success: true,
      message: "Imagem enviada com sucesso! Aguarde a resposta do paciente.",
      imageUrl: selectedImage.url,
    };
  } catch (error) {
    console.error("[AI Agent] Error sending image:", error);
    return {
      success: false,
      message: `Não consegui enviar a imagem agora. Link: ${selectedImage.url}`,
      imageUrl: selectedImage.url,
    };
  }
}

// ============================================
// PROCESS TOOL CALLS
// ============================================

async function processToolCall(
  supabase: AnySupabaseClient,
  userId: string,
  _agentId: string | null,
  leadId: string | null,
  conversationId: string,
  patientPhone: string,
  toolName: string,
  toolArgs: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case "list_agendas":
      return await listAgendas(supabase, userId);
    
    case "list_products":
      return await listProducts(supabase, userId, toolArgs.category as string | undefined);
    
    case "search_knowledge_base":
      return await searchKnowledgeBase(supabase, userId, null, toolArgs.query as string);
    
    case "get_available_slots":
      return await getAvailableSlots(
        supabase, 
        userId, 
        toolArgs.agenda_name as string,
        toolArgs.date as string | undefined
      );

    case "check_slot":
      return await checkSlot(
        supabase,
        userId,
        toolArgs.agenda_name as string,
        toolArgs.date as string,
        toolArgs.time as string
      );
    
    case "create_appointment":
      return await createAppointment(
        supabase,
        userId,
        leadId,
        conversationId,
        toolArgs.agenda_name as string,
        toolArgs.patient_name as string,
        patientPhone,
        toolArgs.date as string,
        toolArgs.time as string,
        toolArgs.service_type as string,
        toolArgs.notes as string | undefined
      );
    
    case "transfer_to_human":
      return await transferToHuman(supabase, conversationId, toolArgs.reason as string);
    
    case "mover_lead_para_etapa":
      return await moverLeadParaEtapa(
        supabase,
        patientPhone,
        toolArgs.nova_etapa as string,
        toolArgs.motivo as string
      );
    
    case "send_image": {
      const result = await sendImage(
        supabase,
        userId,
        _agentId,
        conversationId,
        patientPhone,
        toolArgs.category as string,
        toolArgs.search_term as string | undefined
      );
      return result.message;
    }
    
    default:
      return "Ferramenta não reconhecida.";
  }
}

// ============================================
// AGENT ROUTING - HYBRID SYSTEM
// ============================================

async function getRoutedAgent(
  supabase: AnySupabaseClient,
  userId: string,
  leadStage: string,
  kanbanId: string | null
): Promise<RoutedAgent | null> {
  console.log(`[AI Agent] Routing for stage: ${leadStage}, kanban: ${kanbanId}`);

  // Call RPC with kanban_id for precise matching
  const { data: agents, error } = await supabase.rpc("get_agent_for_lead_stage", {
    p_user_id: userId,
    p_lead_stage: leadStage,
    p_kanban_id: kanbanId
  });

  if (error) {
    console.error("[AI Agent] Routing error:", error);
    return null;
  }

  if (agents && agents.length > 0) {
    const agent = agents[0] as RoutedAgent;
    console.log(`[AI Agent] Routed to: ${agent.agent_name} (${agent.agent_id})`);
    return agent;
  }

  // Fallback: get any active agent
  const { data: fallbackAgent } = await supabase
    .from("avivar_agents")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fallbackAgent) {
    console.log(`[AI Agent] Fallback to: ${fallbackAgent.name}`);
    return {
      agent_id: fallbackAgent.id,
      agent_name: fallbackAgent.name,
      personality: fallbackAgent.personality,
      ai_identity: fallbackAgent.ai_identity,
      ai_instructions: fallbackAgent.ai_instructions,
      ai_restrictions: fallbackAgent.ai_restrictions,
      ai_objective: fallbackAgent.ai_objective,
      tone_of_voice: fallbackAgent.tone_of_voice,
      company_name: fallbackAgent.company_name,
      professional_name: fallbackAgent.professional_name,
      fluxo_atendimento: fallbackAgent.fluxo_atendimento,
      services: fallbackAgent.services || [],
      target_kanbans: fallbackAgent.target_kanbans,
      target_stages: fallbackAgent.target_stages
    };
  }

  return null;
}

interface LeadStageInfo {
  stage: string;
  kanbanId: string | null;
}

async function getLeadStage(
  supabase: AnySupabaseClient, 
  conversationId: string,
  leadPhone: string
): Promise<LeadStageInfo> {
  // PRIMARY: Check avivar_kanban_leads by phone to get current Kanban position
  // This is the source of truth for multi-funnel routing
  const { data: kanbanLead } = await supabase
    .from("avivar_kanban_leads")
    .select(`
      id,
      kanban_id,
      column_id,
      kanban:avivar_kanbans(name),
      column:avivar_kanban_columns(name, order_index)
    `)
    .eq("phone", leadPhone)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (kanbanLead?.kanban && kanbanLead?.column) {
    // deno-lint-ignore no-explicit-any
    const kanbanName = (kanbanLead.kanban as any)?.name?.toLowerCase() || "";
    // deno-lint-ignore no-explicit-any
    const columnName = (kanbanLead.column as any)?.name?.toLowerCase() || "";
    // deno-lint-ignore no-explicit-any
    const columnIndex = (kanbanLead.column as any)?.order_index || 0;
    
    console.log(`[AI Agent] Lead position: ${kanbanName} > ${columnName} (index ${columnIndex})`);
    
    // Return kanban_id for precise agent routing
    const kanbanId = kanbanLead.kanban_id;
    
    // Map Kanban + Column to stage for agent routing (fallback stage)
    let stage = "qualificacao";
    if (kanbanName.includes("pós-venda") || kanbanName.includes("pos-venda") || kanbanName.includes("posvenda")) {
      stage = "pos_procedimento";
    } else if (kanbanName.includes("reativação") || kanbanName.includes("reativacao")) {
      stage = "inativo";
    } else if (columnIndex === 0) {
      stage = "novo_lead";
    } else if (columnIndex === 1) {
      stage = "qualificacao";
    } else if (columnIndex >= 4) {
      stage = "agendado";
    }
    
    return { stage, kanbanId };
  }

  // FALLBACK: Check old leads table
  const { data: conv } = await supabase
    .from("crm_conversations")
    .select("lead_id")
    .eq("id", conversationId)
    .single();

  if (!conv?.lead_id) return { stage: "novo_lead", kanbanId: null };

  const { data: lead } = await supabase
    .from("leads")
    .select("stage")
    .eq("id", conv.lead_id)
    .single();

  return { stage: lead?.stage || "novo_lead", kanbanId: null };
}

// Message content can be string or array for multimodal (images)
type MessageContent = string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;

interface ConversationMessage {
  role: string;
  content: MessageContent;
}

async function getConversationHistory(
  supabase: AnySupabaseClient,
  conversationId: string,
  limit = 25
): Promise<ConversationMessage[]> {
  const { data: messages } = await supabase
    .from("crm_messages")
    .select("direction, content, media_url, media_type, sent_at")
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (!messages?.length) return [];

  return messages
    .reverse()
    .filter((m: { content: string | null }) => m.content)
    .map((m: { direction: string; content: string; media_url: string | null; media_type: string | null }) => {
      const role = m.direction === "inbound" ? "user" : "assistant";
      
      // If message has image media, format as multimodal content
      if (m.media_type === "image" && m.media_url && m.direction === "inbound") {
        console.log(`[AI Agent] Including image in context: ${m.media_url.substring(0, 50)}...`);
        return {
          role,
          content: [
            { type: "text" as const, text: m.content || "Imagem enviada pelo usuário:" },
            { type: "image_url" as const, image_url: { url: m.media_url } }
          ]
        };
      }
      
      // Regular text message
      return {
        role,
        content: m.content,
      };
    });
}

async function getLeadId(supabase: AnySupabaseClient, conversationId: string): Promise<string | null> {
  const { data } = await supabase
    .from("crm_conversations")
    .select("lead_id")
    .eq("id", conversationId)
    .single();

  return data?.lead_id || null;
}

// ============================================
// DYNAMIC KANBAN COLUMNS LOADER
// ============================================

async function getKanbanColumnsForUser(
  supabase: AnySupabaseClient,
  userId: string
): Promise<KanbanColumnInfo[]> {
  console.log(`[AI Agent] Loading Kanban columns for user: ${userId}`);

  const { data: kanbans, error } = await supabase
    .from("avivar_kanbans")
    .select(`
      id,
      name,
      order_index,
      columns:avivar_kanban_columns(
        id,
        name,
        ai_instruction,
        order_index
      )
    `)
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  if (error || !kanbans?.length) {
    console.log(`[AI Agent] No kanbans found for user`);
    return [];
  }

  const allColumns: KanbanColumnInfo[] = [];

  for (const kanban of kanbans) {
    const columns = (kanban.columns || []) as Array<{
      id: string;
      name: string;
      ai_instruction: string | null;
      order_index: number;
    }>;

    // Sort columns by order_index
    columns.sort((a, b) => a.order_index - b.order_index);

    for (const col of columns) {
      // Generate a slug-like key from column name
      const columnKey = col.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      allColumns.push({
        kanban_name: kanban.name,
        column_name: col.name,
        column_key: columnKey,
        ai_instruction: col.ai_instruction,
        order_index: col.order_index
      });
    }
  }

  console.log(`[AI Agent] Loaded ${allColumns.length} columns from ${kanbans.length} kanbans`);
  return allColumns;
}

function buildDynamicMovementInstructions(columns: KanbanColumnInfo[]): string {
  if (columns.length === 0) {
    return `MOVIMENTAÇÃO NO FUNIL:
Use mover_lead_para_etapa para mover leads entre as etapas padrão:
- triagem: Lead respondeu e demonstrou interesse inicial
- tentando_agendar: Lead quer agendar OU você usou get_available_slots
- agendado: Agendamento confirmado com create_appointment
- follow_up: Lead precisa de mais tempo
- desqualificado: Sem interesse`;
  }

  // Find column keys that match common patterns
  const findColumnKey = (patterns: string[]): string | null => {
    for (const col of columns) {
      const key = col.column_key.toLowerCase();
      const name = col.column_name.toLowerCase();
      for (const pattern of patterns) {
        if (key.includes(pattern) || name.includes(pattern)) {
          return col.column_key;
        }
      }
    }
    return null;
  };

  const tentandoAgendarKey = findColumnKey(["tentando_agendar", "tentandoagendar", "agendando", "negociando"]);
  const agendadoKey = findColumnKey(["agendado", "confirmado", "marcado"]);

  let instructions = `## MOVIMENTAÇÃO AUTOMÁTICA NO FUNIL (CRÍTICO!)

Você TEM QUE usar "mover_lead_para_etapa" para atualizar o funil. NÃO É OPCIONAL!

### GATILHOS DE MOVIMENTAÇÃO AUTOMÁTICA:

1. **IMEDIATAMENTE após usar get_available_slots** (consultar horários):
   → Mova para "${tentandoAgendarKey || "tentando_agendar"}" com motivo "Ofereceu horários disponíveis"

2. **IMEDIATAMENTE após usar create_appointment** (criar agendamento):
   → Mova para "${agendadoKey || "agendado"}" com motivo "Agendamento confirmado"

3. **Quando lead fornece nome/interesse inicial**:
   → Mova para "triagem" com motivo apropriado

4. **Quando lead desiste ou não tem perfil**:
   → Mova para "desqualificado" ou última coluna

### ESTRUTURA DO CRM DESTE CLIENTE:

`;

  // Group columns by kanban
  const kanbanGroups = new Map<string, KanbanColumnInfo[]>();
  for (const col of columns) {
    const group = kanbanGroups.get(col.kanban_name) || [];
    group.push(col);
    kanbanGroups.set(col.kanban_name, group);
  }

  // Build instruction text for each kanban
  for (const [kanbanName, cols] of kanbanGroups) {
    instructions += `**Funil: ${kanbanName}**\n`;
    
    for (const col of cols) {
      instructions += `- "${col.column_key}" (${col.column_name})`;
      if (col.ai_instruction) {
        instructions += `: ${col.ai_instruction}`;
      }
      instructions += `\n`;
    }
    instructions += `\n`;
  }

  instructions += `### IMPORTANTE - SEMPRE MOVA APÓS TOOL CALLS:
- Após get_available_slots → mova para "${tentandoAgendarKey || "tentando_agendar"}"
- Após create_appointment → mova para "${agendadoKey || "agendado"}"
- NUNCA deixe de mover o lead quando usar essas ferramentas!`;

  return instructions;
}

// ============================================
// BUILD SYSTEM PROMPT - HYBRID (stage-based agent + full access)
// ============================================

function buildHybridSystemPrompt(
  agent: RoutedAgent, 
  leadStage: string,
  dynamicMovementInstructions: string,
  fluxoInstructions: string
): string {
  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-BR", { 
    weekday: "long", 
    day: "2-digit", 
    month: "long", 
    year: "numeric" 
  });

  // Agent identity
  const identity = agent.ai_identity || agent.personality || 
    `Você é ${agent.agent_name}, assistente virtual da ${agent.company_name || "clínica"}.`;

  // Agent objective based on stage
  const objective = agent.ai_objective || getDefaultObjectiveForStage(leadStage);

  // Agent instructions
  const instructions = agent.ai_instructions || getDefaultInstructions();

  // Agent restrictions
  const restrictions = agent.ai_restrictions || "";

  // Tone of voice
  const toneMap: Record<string, string> = {
    "formal": "Use linguagem formal e profissional.",
    "cordial": "Seja cordial e acolhedor, mas profissional.",
    "casual": "Seja amigável e descontraído, usando linguagem informal."
  };
  const toneInstruction = toneMap[agent.tone_of_voice || "cordial"] || toneMap["cordial"];

  return `${identity}

<seu_objetivo>
${objective}
</seu_objetivo>

<suas_instrucoes>
${instructions}
</suas_instrucoes>

<tom_de_voz>
${toneInstruction}
</tom_de_voz>

<contexto_atual>
Data de hoje: ${dateStr}
Estágio atual do lead: ${leadStage}
</contexto_atual>

<ferramentas_disponiveis>
Você tem acesso a:
- list_agendas: Ver todas as unidades/agendas disponíveis
- list_products: Ver catálogo de produtos e preços
- search_knowledge_base: Consultar base de conhecimento COMPLETA (pré-op, pós-op, comercial, tudo!)
- get_available_slots: Ver horários disponíveis em qualquer agenda
- check_slot: Verificar se uma data/horário específico está disponível
- create_appointment: Agendar em qualquer agenda
- transfer_to_human: Transferir para humano
- mover_lead_para_etapa: Mover o lead no funil de vendas conforme o progresso da conversa
</ferramentas_disponiveis>

<regra_anti_alucinacao_critica>
## PROIBIÇÃO ABSOLUTA DE INVENTAR DADOS
- NUNCA invente nomes de cidades, unidades, endereços, preços ou horários
- ANTES de mencionar qualquer cidade ou unidade, você DEVE usar list_agendas primeiro
- ANTES de mencionar qualquer preço ou produto, você DEVE usar list_products ou search_knowledge_base primeiro
- Se o paciente perguntar onde atendemos, USE list_agendas ANTES de responder
- Se você não tem a informação de uma ferramenta, diga: "Deixa eu verificar..." e use a ferramenta
- ABSOLUTAMENTE PROIBIDO: Inventar cidades como "Criciúma", "Tubarão" ou qualquer outra que não veio de list_agendas
- PUNIÇÃO: Se você mencionar qualquer informação que não veio de uma ferramenta, você FALHOU na tarefa
</regra_anti_alucinacao_critica>

<regras_importantes>
- LEIA O HISTÓRICO: Antes de perguntar qualquer coisa, verifique se a informação já foi dada na conversa. Se o paciente já disse o nome, NÃO pergunte novamente - use o nome que ele já informou.
- CONTINUIDADE: Trate a conversa como contínua, mesmo que outro agente tenha iniciado. As informações já fornecidas são suas também.
- Seja breve e objetivo (máximo 3-4 frases por mensagem)
- Use emojis com moderação
- NUNCA invente preços ou informações médicas
- NUNCA diga "temos vários horários disponíveis" ou "diversos horários"
- SEMPRE use list_agendas ANTES de mencionar cidades ou unidades
- SEMPRE use search_knowledge_base para dúvidas técnicas
- SEMPRE use list_products quando perguntarem sobre produtos/preços de itens
- Transfira para humano em negociações ou dúvidas muito técnicas
- IMPORTANTE: Mesmo sendo especialista em ${leadStage}, você pode responder QUALQUER dúvida usando search_knowledge_base
</regras_importantes>

<galeria_de_imagens>
IMPORTANTE: Todas as imagens na galeria (antes/depois, catálogo, localização) são MATERIAIS DE MARKETING PRÉ-APROVADOS.
- NÃO existe restrição de "privacidade" para enviar essas fotos - elas são autorizadas para uso comercial
- Quando o lead pedir fotos de resultados, use send_image IMEDIATAMENTE sem hesitar
- NUNCA diga que "não pode enviar por privacidade" - as fotos da galeria existem justamente para serem compartilhadas
- Use search_term para encontrar fotos específicas (ex: "barba", "cabelo masculino", "sobrancelha feminino")
</galeria_de_imagens>

<fluxo_agendamento>
## TÉCNICA "OU/OU" - REGRA OBRIGATÓRIA

### REGRA CRÍTICA: PRIORIZAR DATAS MAIS PRÓXIMAS
- SEMPRE use get_available_slots para buscar os horários do DIA MAIS PRÓXIMO primeiro (amanhã ou depois de amanhã)
- NUNCA ofereça datas da próxima semana se existem horários livres HOJE, AMANHÃ ou nos próximos 2-3 dias
- Ordem de prioridade: HOJE > AMANHÃ > DEPOIS DE AMANHÃ > próximos dias da semana
- Se amanhã não tiver vaga, verifique o dia seguinte, e assim por diante até encontrar

### OFERTA INICIAL:
- Use get_available_slots para buscar horários do PRÓXIMO DIA LIVRE (começando de hoje/amanhã)
- Ofereça exatamente 2 horários aleatórios desse dia mais próximo (técnica "ou/ou")
- NUNCA pule para a próxima semana se há vagas essa semana
- Formato: "Tenho disponível amanhã às [hora1] ou às [hora2]. Qual fica melhor para você?"
- OU se amanhã não tiver: "O próximo horário livre é [dia] às [hora1] ou [hora2]. Qual prefere?"

### SE O LEAD NÃO PUDER NESSAS DATAS:
- Se o lead disser que não pode, DEVOLVA a pergunta:
- "Entendi! E qual data e horário ficaria melhor pra você? Assim consigo verificar na agenda."

### SE O LEAD PEDIR UMA DATA ESPECÍFICA (MAIS DISTANTE):
Se o lead sugerir UMA DATA E UM HORÁRIO específico (ex: "segunda da próxima semana às 09:30"):
1. Use check_slot para verificar disponibilidade
2. Se estiver LIVRE: "Ótimo! Esse horário está disponível. Posso confirmar?"
3. Se estiver OCUPADO: 
   - Busque o dia MAIS PRÓXIMO da data que ele pediu usando get_available_slots
   - Ofereça 2 alternativas: "Segunda não tenho horários, mas terça tenho às 09h ou 17h. Qual fica melhor?"

Se o lead sugerir apenas UMA DATA (sem horário), use get_available_slots com essa data e ofereça 2 horários (ou/ou).

### CONFIRMAÇÃO FINAL:
- Só use create_appointment após o lead CONFIRMAR explicitamente a data e horário
- Confirme: "Perfeito! Vou agendar sua avaliação para [data] às [horário] em [unidade]. Confirma?"
</fluxo_agendamento>

<movimentacao_funil>
${dynamicMovementInstructions}
</movimentacao_funil>

<formatacao_obrigatoria>
PROIBIDO: Nunca use asteriscos (*) para formatar texto. Não use **negrito** nem *itálico*.
PROIBIDO: Nunca use emojis nas suas respostas. Escreva apenas texto puro.
CORRETO: Escreva em texto simples, sem formatação especial e sem emojis.
Exemplo errado: "Olá! 😊 Tudo bem?"
Exemplo correto: "Olá! Tudo bem?"
</formatacao_obrigatoria>

${fluxoInstructions}

${restrictions ? `<restricoes>\n${restrictions}\n</restricoes>` : ""}`;
}

function getDefaultObjectiveForStage(stage: string): string {
  const objectives: Record<string, string> = {
    "novo_lead": "Qualificar o lead, entender suas necessidades e agendar uma consulta de avaliação.",
    "qualificacao": "Responder dúvidas, qualificar o interesse e agendar consulta.",
    "agendado": "Confirmar agendamento, enviar orientações pré-consulta.",
    "compareceu": "Acompanhar pós-consulta, responder dúvidas sobre proposta.",
    "pos_procedimento": "Orientar sobre cuidados pós-procedimento, acompanhar recuperação.",
    "acompanhamento": "Monitorar evolução, responder dúvidas de manutenção.",
    "inativo": "Reengajar o lead, entender motivo do afastamento, oferecer condições especiais."
  };
  return objectives[stage] || objectives["novo_lead"];
}

function getDefaultInstructions(): string {
  return `1. Qualifique o lead e entenda suas necessidades
2. Use search_knowledge_base para consultar informações sobre procedimentos, preços, cuidados
3. Use list_products para mostrar produtos disponíveis quando perguntarem
4. Use list_agendas para descobrir em qual unidade o paciente quer atender
5. Use get_available_slots e create_appointment para agendar consultas
6. Use transfer_to_human quando necessário (negociação, dúvidas muito técnicas)
7. SEMPRE use mover_lead_para_etapa após cada interação significativa para manter o funil atualizado`;
}

// Gera instruções do fluxo de atendimento baseado nos passos configurados
function buildFluxoInstructions(fluxo: Record<string, unknown> | null): string {
  if (!fluxo) return '';
  
  const passosCronologicos = (fluxo.passosCronologicos || []) as Array<{
    ordem: number;
    titulo: string;
    descricao: string;
    exemploMensagem?: string;
  }>;
  
  const passosExtras = (fluxo.passosExtras || []) as Array<{
    ordem: number;
    titulo: string;
    descricao: string;
    exemploMensagem?: string;
  }>;
  
  if (passosCronologicos.length === 0) return '';
  
  let instructions = `<fluxo_de_atendimento>
## PASSOS DO ATENDIMENTO (siga na ordem):

**IMPORTANTE sobre exemplos de mensagem:**
Os exemplos fornecidos são REFERÊNCIAS, não textos fixos. Você deve:
- Manter o mesmo sentido e contexto da mensagem
- Fazer pequenas variações naturais (sinônimos, expressões equivalentes)
- Adaptar levemente ao tom da conversa mantendo a essência
- NÃO copiar literalmente - humanize com variações sutis

`;
  
  for (const passo of passosCronologicos) {
    instructions += `### PASSO ${passo.ordem}: ${passo.titulo.toUpperCase()}
${passo.descricao}
${passo.exemploMensagem ? `📝 Mensagem base (adapte levemente): "${passo.exemploMensagem}"` : ''}

`;
  }
  
  if (passosExtras.length > 0) {
    instructions += `## PASSOS EXTRAS (quando necessário):

`;
    for (const passo of passosExtras) {
      instructions += `### ${passo.titulo.toUpperCase()}
${passo.descricao}
${passo.exemploMensagem ? `📝 Mensagem base (adapte levemente): "${passo.exemploMensagem}"` : ''}

`;
    }
  }
  
  instructions += `</fluxo_de_atendimento>`;
  return instructions;
}

// ============================================
// AI CALL WITH TOOLS
// ============================================

// Detect patterns that indicate lead is dropping out
const DESISTENCIA_PATTERNS = [
  /n[aã]o\s*(quero|vou|posso|tenho|preciso)\s*(mais)?/i,
  /desist[io]/i,
  /cancel[ao]/i,
  /esquece/i,
  /deixa\s*(pra\s*l[aá]|quieto)/i,
  /n[aã]o\s*tenho\s*interesse/i,
  /mudei\s*de\s*id[eé]ia/i,
  /n[aã]o\s*quero\s*mais/i,
  /j[aá]\s*desisti/i,
];

function detectDesistencia(message: string): boolean {
  const normalized = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return DESISTENCIA_PATTERNS.some(pattern => pattern.test(normalized));
}

async function callAIWithTools(
  systemPrompt: string,
  messages: ConversationMessage[],
  tools: typeof TOOLS,
  maxRetries: number = 2
): Promise<{ content: string | null; toolCalls: Array<{ name: string; arguments: Record<string, unknown> }> }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY não configurada");
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      console.log(`[AI Agent] Retry attempt ${attempt + 1}/${maxRetries}...`);
      // Small delay between retries
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log("[AI Agent] Calling Lovable AI with tools...");

    try {
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
          tools,
          tool_choice: "auto",
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[AI Agent] AI error:", response.status, errorText);
        
        if (response.status === 429) {
          lastError = new Error("Rate limit exceeded");
          continue; // Retry on rate limit
        }
        if (response.status === 402) {
          throw new Error("Créditos de IA esgotados");
        }
        lastError = new Error(`Erro na API de IA: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      // Check if we got a valid response
      if (!choice?.message) {
        console.warn(`[AI Agent] Empty response from AI (attempt ${attempt + 1})`);
        lastError = new Error("Resposta vazia da IA");
        continue; // Retry on empty response
      }

      const toolCalls = choice.message?.tool_calls?.map((tc: { function: { name: string; arguments: string } }) => {
        try {
          return {
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments)
          };
        } catch (e) {
          console.error("[AI Agent] Failed to parse tool args:", e);
          return null;
        }
      }).filter(Boolean) || [];

      const content = choice.message?.content || null;

      // If we have neither content nor tool calls, retry
      if (!content && toolCalls.length === 0) {
        console.warn(`[AI Agent] AI returned no content and no tool calls (attempt ${attempt + 1})`);
        lastError = new Error("Resposta vazia da IA");
        continue;
      }

      return { content, toolCalls };
    } catch (e) {
      console.error(`[AI Agent] Call failed (attempt ${attempt + 1}):`, e);
      lastError = e as Error;
    }
  }

  // All retries failed
  throw lastError || new Error("Falha após múltiplas tentativas");
}

/**
 * Split message by double line breaks and send as separate messages
 * This creates a more natural WhatsApp conversation flow
 */
function splitMessageIntoParts(content: string): string[] {
  // Split by double line breaks (paragraph breaks)
  const parts = content
    .split(/\n\n+/)
    .map(part => part.trim())
    .filter(part => part.length > 0);
  
  // If no splits found, return original content
  if (parts.length === 0) {
    return [content.trim()];
  }
  
  return parts;
}

async function sendSingleMessage(
  supabaseUrl: string,
  supabaseKey: string,
  conversationId: string,
  content: string
): Promise<boolean> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/avivar-send-message`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId,
        content,
        isAIGenerated: true,
      }),
    });

    const result = await response.json();
    
    if (!result.success) {
      console.error("[AI Agent] Send failed:", result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[AI Agent] Send error:", error);
    return false;
  }
}

async function sendWhatsAppMessage(
  supabaseUrl: string,
  supabaseKey: string,
  conversationId: string,
  content: string
): Promise<boolean> {
  // Split message into parts by double line breaks
  const messageParts = splitMessageIntoParts(content);
  
  console.log(`[AI Agent] Sending ${messageParts.length} message(s): "${content.substring(0, 50)}..."`);

  let allSent = true;
  
  for (let i = 0; i < messageParts.length; i++) {
    const part = messageParts[i];
    console.log(`[AI Agent] Sending part ${i + 1}/${messageParts.length}: "${part.substring(0, 40)}..."`);
    
    const sent = await sendSingleMessage(supabaseUrl, supabaseKey, conversationId, part);
    
    if (!sent) {
      allSent = false;
    }
    
    // Small delay between messages to maintain order and feel natural
    if (i < messageParts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }

  console.log(`[AI Agent] ✅ ${messageParts.length} message(s) sent`);
  return allSent;
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`[AI Agent v4] Request received at ${new Date().toISOString()}`);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: AgentRequest = await req.json();
    const { conversationId, messageContent, leadPhone, userId } = body;

    if (!conversationId || !messageContent || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[AI Agent] Processing: "${messageContent.substring(0, 50)}..."`);

    // 1. Get lead stage and kanban for hybrid routing (based on Kanban position)
    const { stage: leadStage, kanbanId } = await getLeadStage(supabase, conversationId, leadPhone);
    console.log(`[AI Agent] Lead stage: ${leadStage}, kanban: ${kanbanId}`);

    // 2. Get routed agent based on kanban ID + stage (HYBRID ROUTING)
    const routedAgent = await getRoutedAgent(supabase, userId, leadStage, kanbanId);
    
    if (!routedAgent) {
      console.log("[AI Agent] No agent configured, skipping");
      return new Response(
        JSON.stringify({ success: false, error: "Agent not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[AI Agent] Using agent: ${routedAgent.agent_name} for stage ${leadStage}`);

    // 3. Load dynamic Kanban columns for this user
    const kanbanColumns = await getKanbanColumnsForUser(supabase, userId);
    const dynamicMovementInstructions = buildDynamicMovementInstructions(kanbanColumns);

    // 3.5 Build fluxo de atendimento instructions from agent config
    const fluxoInstructions = buildFluxoInstructions(routedAgent.fluxo_atendimento);

    // 4. Build hybrid system prompt (agent personality + dynamic Kanban structure + custom flow)
    const systemPrompt = buildHybridSystemPrompt(routedAgent, leadStage, dynamicMovementInstructions, fluxoInstructions);

    // 4. Get conversation history
    const conversationHistory = await getConversationHistory(supabase, conversationId);

    // 5. Get lead ID for appointment linking
    const leadId = await getLeadId(supabase, conversationId);

    // 5.5 CRITICAL: Detect desistência patterns BEFORE calling AI
    // This ensures we move to desqualificado even if AI fails
    const isDesistencia = detectDesistencia(messageContent);
    let desistenciaHandled = false;

    if (isDesistencia) {
      console.log(`[AI Agent] Detected DESISTÊNCIA in message: "${messageContent.substring(0, 50)}..."`);

      // Move lead to desqualificado immediately (don't wait for AI)
      const moveResult = await moverLeadParaEtapa(
        supabase,
        leadPhone,
        "desqualificado",
        "Lead desistiu durante atendimento"
      );
      console.log(`[AI Agent] Auto-move to desqualificado: ${moveResult}`);
      desistenciaHandled = true;
    }

    // 6. Call AI with tools
    let aiResult: { content: string | null; toolCalls: Array<{ name: string; arguments: Record<string, unknown> }> };
    
    try {
      aiResult = await callAIWithTools(systemPrompt, conversationHistory, TOOLS);
    } catch (aiError) {
      console.error("[AI Agent] AI call failed:", aiError);
      
      // If desistência was detected, provide a fallback response
      if (desistenciaHandled) {
        const fallbackResponse = "Entendo, sem problemas. Se mudar de ideia, estou à disposição. Obrigado pelo contato!";
        await sendWhatsAppMessage(supabaseUrl, supabaseServiceKey, conversationId, fallbackResponse);
        
        return new Response(
          JSON.stringify({
            success: true,
            response: fallbackResponse,
            sent: true,
            duration: Date.now() - startTime,
            agent: routedAgent.agent_name,
            stage: leadStage,
            toolsUsed: [],
            desistenciaHandled: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Re-throw if not desistência (let normal error handling take over)
      throw aiError;
    }

    // 7. Process tool calls if any
    let finalResponse = aiResult.content || "";

    if (aiResult.toolCalls.length > 0) {
      console.log(`[AI Agent] Processing ${aiResult.toolCalls.length} tool call(s)`);
      
      const toolResults: Array<{ role: string; name?: string; content: string }> = [];
      
      for (const toolCall of aiResult.toolCalls) {
        const result = await processToolCall(
          supabase,
          userId,
          routedAgent.agent_id,
          leadId,
          conversationId,
          leadPhone,
          toolCall.name,
          toolCall.arguments
        );
        
        console.log(`[AI Agent] Tool ${toolCall.name} result: ${result.substring(0, 100)}...`);
        
        toolResults.push({
          role: "tool",
          name: toolCall.name,
          content: result
        });
      }

      // Call AI again with tool results
      const followUpMessages = [
        ...conversationHistory,
        { role: "assistant", content: aiResult.content || "" },
        ...toolResults.map(tr => ({ role: "tool" as const, content: `[${tr.name}]: ${tr.content}` }))
      ];

      const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...followUpMessages.map(m => ({ role: m.role === "tool" ? "user" : m.role, content: m.content }))
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        finalResponse = followUpData.choices?.[0]?.message?.content || finalResponse;
      }
    }

    if (!finalResponse) {
      finalResponse = "Desculpe, não consegui processar sua mensagem. Pode repetir?";
    }

    // 8. Clean up any markdown formatting and emojis before sending
    finalResponse = finalResponse.replace(/\*+/g, "");
    // Remove emojis (Unicode ranges for common emoji characters)
    finalResponse = finalResponse.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu, "");
    // Clean up double spaces left by emoji removal
    finalResponse = finalResponse.replace(/  +/g, " ").trim();

    // 9. Send response via WhatsApp
    const sent = await sendWhatsAppMessage(supabaseUrl, supabaseServiceKey, conversationId, finalResponse);

    const duration = Date.now() - startTime;
    console.log(`[AI Agent] Completed in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        response: finalResponse,
        sent,
        duration,
        agent: routedAgent.agent_name,
        stage: leadStage,
        toolsUsed: aiResult.toolCalls.map(tc => tc.name)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[AI Agent] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
