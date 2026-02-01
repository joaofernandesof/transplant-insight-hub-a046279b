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

async function getAvailableSlots(
  supabase: AnySupabaseClient,
  userId: string,
  agendaName: string,
  dateStr?: string
): Promise<string> {
  console.log(`[AI Agent] Tool: get_available_slots(agenda="${agendaName}", date=${dateStr || "próximos dias"})`);

  const { data: agendas } = await supabase
    .from("avivar_agendas")
    .select("id, name, city, professional_name")
    .eq("user_id", userId)
    .eq("is_active", true)
    .ilike("name", `%${agendaName}%`);

  let agendaInfo = agendas?.[0];
  let agendaId: string | null = agendaInfo?.id || null;

  if (!agendaInfo) {
    const { data: byCity } = await supabase
      .from("avivar_agendas")
      .select("id, name, city, professional_name")
      .eq("user_id", userId)
      .eq("is_active", true)
      .ilike("city", `%${agendaName}%`);
    
    agendaInfo = byCity?.[0];
    agendaId = agendaInfo?.id || null;
  }

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
      
      const timesToShow = available.slice(0, 2).map((s: { slot_start: string }) => 
        s.slot_start.substring(0, 5)
      );
      
      results.push(`📅 ${dayName} (${dateFormatted}): ${timesToShow.join(" ou ")}`);
    }
  }

  if (results.length === 0) {
    return `Não há horários disponíveis para os próximos dias${agendaInfo ? ` em ${agendaInfo.name}` : ""}. Por favor, entre em contato para verificar outras opções.`;
  }

  const header = agendaInfo 
    ? `Horários disponíveis em **${agendaInfo.name}**${agendaInfo.city ? ` (${agendaInfo.city})` : ""}:`
    : "Horários disponíveis:";

  return `${header}\n\n${results.join("\n")}\n\nQual horário você prefere?`;
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

  const { data: agendas } = await supabase
    .from("avivar_agendas")
    .select("id, name, city, professional_name, address")
    .eq("user_id", userId)
    .eq("is_active", true)
    .ilike("name", `%${agendaName}%`);

  let agendaInfo = agendas?.[0];
  let agendaId: string | null = agendaInfo?.id || null;

  if (!agendaInfo) {
    const { data: byCity } = await supabase
      .from("avivar_agendas")
      .select("id, name, city, professional_name, address")
      .eq("user_id", userId)
      .eq("is_active", true)
      .ilike("city", `%${agendaName}%`);
    
    agendaInfo = byCity?.[0];
    agendaId = agendaInfo?.id || null;
  }

  const [hours, minutes] = time.split(":").map(Number);
  const endHours = Math.floor((hours * 60 + minutes + 30) / 60);
  const endMinutes = (hours * 60 + minutes + 30) % 60;
  const endTime = `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;

  const { data: slots } = await supabase.rpc("get_available_slots_flexible", {
    p_user_id: userId,
    p_agenda_id: agendaId,
    p_date: date,
    p_duration_minutes: 30
  });

  const slotAvailable = (slots || []).some((s: { slot_start: string; is_available: boolean }) => 
    s.slot_start.substring(0, 5) === time && s.is_available
  );

  if (!slotAvailable) {
    return `❌ Infelizmente o horário ${time} do dia ${date} não está mais disponível. Por favor, escolha outro horário.`;
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
      appointment_date: date,
      start_time: time + ":00",
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

  const dateObj = new Date(date + "T12:00:00");
  const dayName = dateObj.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateFormatted = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const locationInfo = agendaInfo?.city 
    ? `\n📍 Local: ${agendaInfo.name}${agendaInfo.address ? ` - ${agendaInfo.address}` : ""}`
    : "";

  return `✅ Agendamento confirmado!

📅 Data: ${dayName}, ${dateFormatted}
⏰ Horário: ${time}
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
  leadStage: string
): Promise<RoutedAgent | null> {
  console.log(`[AI Agent] Routing for stage: ${leadStage}`);

  const { data: agents, error } = await supabase.rpc("get_agent_for_lead_stage", {
    p_user_id: userId,
    p_lead_stage: leadStage
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

async function getLeadStage(supabase: AnySupabaseClient, conversationId: string): Promise<string> {
  // Get lead from conversation
  const { data: conv } = await supabase
    .from("crm_conversations")
    .select("lead_id")
    .eq("id", conversationId)
    .single();

  if (!conv?.lead_id) return "novo_lead";

  // Get lead stage from leads table
  const { data: lead } = await supabase
    .from("leads")
    .select("stage")
    .eq("id", conv.lead_id)
    .single();

  return lead?.stage || "novo_lead";
}

async function getConversationHistory(
  supabase: AnySupabaseClient,
  conversationId: string,
  limit = 10
): Promise<Array<{ role: string; content: string }>> {
  const { data: messages } = await supabase
    .from("crm_messages")
    .select("direction, content, sent_at")
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (!messages?.length) return [];

  return messages
    .reverse()
    .filter((m: { content: string | null }) => m.content)
    .map((m: { direction: string; content: string }) => ({
      role: m.direction === "inbound" ? "user" : "assistant",
      content: m.content,
    }));
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
// BUILD SYSTEM PROMPT - HYBRID (stage-based agent + full access)
// ============================================

function buildHybridSystemPrompt(agent: RoutedAgent, leadStage: string): string {
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
- create_appointment: Agendar em qualquer agenda
- transfer_to_human: Transferir para humano
</ferramentas_disponiveis>

<regras_importantes>
- Seja breve e objetivo (máximo 3-4 frases por mensagem)
- Use emojis com moderação
- NUNCA invente preços ou informações médicas
- SEMPRE use search_knowledge_base para dúvidas técnicas
- SEMPRE use list_products quando perguntarem sobre produtos/preços de itens
- Para agendar: 1) Descubra a unidade 2) Pergunte o nome 3) Ofereça 2 horários
- Transfira para humano em negociações ou dúvidas muito técnicas
- IMPORTANTE: Mesmo sendo especialista em ${leadStage}, você pode responder QUALQUER dúvida usando search_knowledge_base
</regras_importantes>

<formatacao_obrigatoria>
PROIBIDO: Nunca use asteriscos (*) para formatar texto. Não use **negrito** nem *itálico*.
PROIBIDO: Nunca use emojis nas suas respostas. Escreva apenas texto puro.
CORRETO: Escreva em texto simples, sem formatação especial e sem emojis.
Exemplo errado: "Olá! 😊 Tudo bem?"
Exemplo correto: "Olá! Tudo bem?"
</formatacao_obrigatoria>

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
6. Use transfer_to_human quando necessário (negociação, dúvidas muito técnicas)`;
}

// ============================================
// AI CALL WITH TOOLS
// ============================================

async function callAIWithTools(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  tools: typeof TOOLS
): Promise<{ content: string | null; toolCalls: Array<{ name: string; arguments: Record<string, unknown> }> }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY não configurada");
  }

  console.log("[AI Agent] Calling Lovable AI with tools...");

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
      throw new Error("Rate limit exceeded");
    }
    if (response.status === 402) {
      throw new Error("Créditos de IA esgotados");
    }
    throw new Error(`Erro na API de IA: ${response.status}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  if (!choice) {
    throw new Error("Resposta vazia da IA");
  }

  const toolCalls = choice.message?.tool_calls?.map((tc: { function: { name: string; arguments: string } }) => ({
    name: tc.function.name,
    arguments: JSON.parse(tc.function.arguments)
  })) || [];

  return {
    content: choice.message?.content || null,
    toolCalls
  };
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

    // 1. Get lead stage for hybrid routing
    const leadStage = await getLeadStage(supabase, conversationId);
    console.log(`[AI Agent] Lead stage: ${leadStage}`);

    // 2. Get routed agent based on stage (HYBRID ROUTING)
    const routedAgent = await getRoutedAgent(supabase, userId, leadStage);
    
    if (!routedAgent) {
      console.log("[AI Agent] No agent configured, skipping");
      return new Response(
        JSON.stringify({ success: false, error: "Agent not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[AI Agent] Using agent: ${routedAgent.agent_name} for stage ${leadStage}`);

    // 3. Build hybrid system prompt (agent personality + full access)
    const systemPrompt = buildHybridSystemPrompt(routedAgent, leadStage);

    // 4. Get conversation history
    const conversationHistory = await getConversationHistory(supabase, conversationId);

    // 5. Get lead ID for appointment linking
    const leadId = await getLeadId(supabase, conversationId);

    // 6. Call AI with tools
    let aiResult = await callAIWithTools(systemPrompt, conversationHistory, TOOLS);

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
