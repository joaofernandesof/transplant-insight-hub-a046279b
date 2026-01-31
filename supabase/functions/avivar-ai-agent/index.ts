import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Avivar AI Agent v3
 * Agente com Tool-Calling para Multi-Agendas:
 * - Listar agendas/unidades disponíveis
 * - Consultar base de conhecimento (RAG)
 * - Consultar horários disponíveis por agenda
 * - Criar agendamentos na agenda correta
 * - Transferir para humano
 */

interface AgentRequest {
  conversationId: string;
  messageContent: string;
  leadPhone: string;
  leadName?: string;
  userId: string;
}

interface Agenda {
  agenda_id: string;
  agenda_name: string;
  professional_name: string;
  city: string;
  address: string;
}

// deno-lint-ignore no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

// ============================================
// TOOL DEFINITIONS
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
      name: "get_available_slots",
      description: "Consulta horários disponíveis para agendamento em uma agenda específica. Use após o paciente escolher a cidade/unidade.",
      parameters: {
        type: "object",
        properties: {
          agenda_id: {
            type: "string",
            description: "ID da agenda (obtido de list_agendas). Se não tiver, liste as agendas primeiro."
          },
          date: {
            type: "string",
            description: "Data no formato YYYY-MM-DD. Se não especificada, busca para os próximos dias úteis."
          }
        },
        required: ["agenda_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_appointment",
      description: "Cria um agendamento na agenda específica. Use após confirmação de data, horário e unidade.",
      parameters: {
        type: "object",
        properties: {
          agenda_id: {
            type: "string",
            description: "ID da agenda onde criar o agendamento"
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
        required: ["agenda_id", "patient_name", "date", "time", "service_type"]
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
    // Fallback: buscar agenda antiga sem multi-agenda
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

async function searchKnowledgeBase(
  supabase: AnySupabaseClient,
  userId: string,
  query: string
): Promise<string> {
  console.log(`[AI Agent] Tool: search_knowledge_base("${query.substring(0, 50)}...")`);

  const { data: documents } = await supabase
    .from("avivar_knowledge_documents")
    .select("id")
    .eq("user_id", userId);

  if (!documents?.length) {
    return "Nenhuma informação encontrada na base de conhecimento.";
  }

  const docIds = documents.map((d: { id: string }) => d.id);

  const { data: chunks } = await supabase
    .from("avivar_knowledge_chunks")
    .select("content")
    .in("document_id", docIds)
    .limit(5);

  if (!chunks?.length) {
    return "Nenhuma informação encontrada para esta consulta.";
  }

  return chunks.map((c: { content: string }) => c.content).join("\n\n---\n\n");
}

async function getAvailableSlots(
  supabase: AnySupabaseClient,
  userId: string,
  agendaId: string,
  dateStr?: string
): Promise<string> {
  console.log(`[AI Agent] Tool: get_available_slots(agenda=${agendaId}, date=${dateStr || "próximos dias"})`);

  // Get agenda info
  const { data: agendaInfo } = await supabase
    .from("avivar_agendas")
    .select("name, city, professional_name")
    .eq("id", agendaId)
    .single();

  // Se não passou data, buscar para os próximos 3 dias úteis
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
      if (dow !== 0) { // Não é domingo
        dates.push(d.toISOString().split("T")[0]);
        count++;
      }
    }
  }

  const results: string[] = [];
  
  for (const date of dates) {
    const { data: slots, error } = await supabase.rpc("get_available_slots_by_agenda", {
      p_agenda_id: agendaId,
      p_date: date,
      p_duration_minutes: 30
    });

    if (error) {
      console.error("[AI Agent] Error getting slots:", error);
      // Fallback para função antiga
      const { data: oldSlots } = await supabase.rpc("get_available_slots", {
        p_user_id: userId,
        p_date: date,
        p_duration_minutes: 30
      });
      
      if (oldSlots) {
        const available = oldSlots.filter((s: { is_available: boolean }) => s.is_available);
        if (available.length > 0) {
          const dateObj = new Date(date + "T12:00:00");
          const dayName = dateObj.toLocaleDateString("pt-BR", { weekday: "long" });
          const dateFormatted = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
          const timesToShow = available.slice(0, 5).map((s: { slot_start: string }) => 
            s.slot_start.substring(0, 5)
          );
          results.push(`📅 ${dayName} (${dateFormatted}): ${timesToShow.join(", ")}${available.length > 5 ? " e mais..." : ""}`);
        }
      }
      continue;
    }

    const available = (slots || []).filter((s: { is_available: boolean }) => s.is_available);
    
    if (available.length > 0) {
      const dateObj = new Date(date + "T12:00:00");
      const dayName = dateObj.toLocaleDateString("pt-BR", { weekday: "long" });
      const dateFormatted = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      
      const timesToShow = available.slice(0, 5).map((s: { slot_start: string }) => 
        s.slot_start.substring(0, 5)
      );
      
      results.push(`📅 ${dayName} (${dateFormatted}): ${timesToShow.join(", ")}${available.length > 5 ? " e mais..." : ""}`);
    }
  }

  if (results.length === 0) {
    return "Não há horários disponíveis para os próximos dias nesta unidade. Por favor, entre em contato para verificar outras opções.";
  }

  const header = agendaInfo 
    ? `Horários disponíveis em ${agendaInfo.name}${agendaInfo.city ? ` (${agendaInfo.city})` : ""}:`
    : "Horários disponíveis:";

  return `${header}\n\n${results.join("\n")}`;
}

async function createAppointment(
  supabase: AnySupabaseClient,
  userId: string,
  leadId: string | null,
  conversationId: string,
  agendaId: string,
  patientName: string,
  patientPhone: string,
  date: string,
  time: string,
  serviceType: string,
  notes?: string
): Promise<string> {
  console.log(`[AI Agent] Tool: create_appointment(agenda=${agendaId}, ${patientName}, ${date} ${time})`);

  // Get agenda info
  const { data: agendaInfo } = await supabase
    .from("avivar_agendas")
    .select("name, city, professional_name, address")
    .eq("id", agendaId)
    .single();

  // Calcular horário de fim (30 min)
  const [hours, minutes] = time.split(":").map(Number);
  const endHours = Math.floor((hours * 60 + minutes + 30) / 60);
  const endMinutes = (hours * 60 + minutes + 30) % 60;
  const endTime = `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;

  // Verificar se o slot ainda está disponível
  const { data: slots } = await supabase.rpc("get_available_slots_by_agenda", {
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

  // Criar o agendamento com referência à agenda
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

  // Formatar data para exibição
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

  // Atualizar a conversa para desativar IA
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
  leadId: string | null,
  conversationId: string,
  patientPhone: string,
  toolName: string,
  toolArgs: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case "list_agendas":
      return await listAgendas(supabase, userId);
    
    case "search_knowledge_base":
      return await searchKnowledgeBase(supabase, userId, toolArgs.query as string);
    
    case "get_available_slots":
      return await getAvailableSlots(
        supabase, 
        userId, 
        toolArgs.agenda_id as string,
        toolArgs.date as string | undefined
      );
    
    case "create_appointment":
      return await createAppointment(
        supabase,
        userId,
        leadId,
        conversationId,
        toolArgs.agenda_id as string,
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
// MAIN AGENT LOGIC
// ============================================

async function getAgentConfig(supabase: AnySupabaseClient, userId: string) {
  const { data: config } = await supabase
    .from("avivar_agent_configs")
    .select("*")
    .eq("user_id", userId)
    .eq("is_approved", true)
    .maybeSingle();

  return config;
}

async function getAgentPrompt(supabase: AnySupabaseClient, configId: string): Promise<string | null> {
  const { data: prompt } = await supabase
    .from("avivar_agent_prompts")
    .select("prompt_content")
    .eq("agent_config_id", configId)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  return prompt?.prompt_content || null;
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

function buildSystemPrompt(config: Record<string, unknown>, customPrompt: string | null): string {
  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-BR", { 
    weekday: "long", 
    day: "2-digit", 
    month: "long", 
    year: "numeric" 
  });

  const basePrompt = customPrompt || `Você é ${config.attendant_name || "Ana"}, assistente virtual da ${config.company_name || "clínica"}.
Você trabalha com o ${config.professional_name || "Dr."}.

Seu objetivo é:
1. Qualificar o lead e entender suas necessidades
2. Responder dúvidas sobre procedimentos (use search_knowledge_base)
3. Descobrir em qual unidade o paciente quer atender (use list_agendas se tiver dúvida)
4. Agendar consultas de avaliação (use get_available_slots e create_appointment)
5. Transferir para humano quando necessário (use transfer_to_human)`;

  return `${basePrompt}

<contexto_atual>
Data de hoje: ${dateStr}
</contexto_atual>

<regras>
- Seja breve e objetivo (máximo 3-4 frases por mensagem)
- Use emojis com moderação
- NUNCA invente preços ou informações médicas
- Quando não souber algo, use search_knowledge_base
- Se tiver múltiplas unidades, pergunte onde o paciente prefere antes de mostrar horários
- Para agendar: 1) Descubra a unidade desejada 2) Pergunte o nome se não souber 3) Ofereça horários com get_available_slots
- Só crie agendamento com create_appointment após confirmação completa (unidade, data, horário, nome)
- Transfira para humano em negociações de preço ou dúvidas muito técnicas
</regras>`;
}

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

async function sendWhatsAppMessage(
  supabaseUrl: string,
  supabaseKey: string,
  conversationId: string,
  content: string
): Promise<boolean> {
  console.log(`[AI Agent] Sending message: "${content.substring(0, 50)}..."`);

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

    console.log("[AI Agent] ✅ Message sent");
    return true;
  } catch (error) {
    console.error("[AI Agent] Send error:", error);
    return false;
  }
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`[AI Agent] Request received at ${new Date().toISOString()}`);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: AgentRequest = await req.json();
    const { conversationId, messageContent, leadPhone, leadName, userId } = body;

    if (!conversationId || !messageContent || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[AI Agent] Processing: "${messageContent.substring(0, 50)}..."`);

    // 1. Get agent config
    const agentConfig = await getAgentConfig(supabase, userId);
    if (!agentConfig) {
      console.log("[AI Agent] No approved config, skipping");
      return new Response(
        JSON.stringify({ success: false, error: "Agent not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get custom prompt
    const customPrompt = await getAgentPrompt(supabase, agentConfig.id);
    const systemPrompt = buildSystemPrompt(agentConfig, customPrompt);

    // 3. Get conversation history
    const conversationHistory = await getConversationHistory(supabase, conversationId);

    // 4. Get lead ID for appointment linking
    const leadId = await getLeadId(supabase, conversationId);

    // 5. Call AI with tools
    let aiResult = await callAIWithTools(systemPrompt, conversationHistory, TOOLS);

    // 6. Process tool calls if any
    let finalResponse = aiResult.content || "";

    if (aiResult.toolCalls.length > 0) {
      console.log(`[AI Agent] Processing ${aiResult.toolCalls.length} tool call(s)`);
      
      const toolResults: Array<{ role: string; tool_call_id?: string; name?: string; content: string }> = [];
      
      for (const toolCall of aiResult.toolCalls) {
        const result = await processToolCall(
          supabase,
          userId,
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

      // Call AI again with tool results to get natural response
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

    // 7. Send response via WhatsApp
    const sent = await sendWhatsAppMessage(supabaseUrl, supabaseServiceKey, conversationId, finalResponse);

    const duration = Date.now() - startTime;
    console.log(`[AI Agent] Completed in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        response: finalResponse,
        sent,
        duration,
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
