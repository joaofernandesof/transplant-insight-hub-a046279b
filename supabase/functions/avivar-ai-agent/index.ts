import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Avivar AI Agent
 * Processa mensagens recebidas com IA e responde automaticamente via WhatsApp
 * Usa Lovable AI Gateway com a base de conhecimento existente (RAG)
 */

interface AgentRequest {
  conversationId: string;
  messageContent: string;
  leadPhone: string;
  leadName?: string;
  userId: string;
}

interface KnowledgeDocument {
  id: string;
  name: string;
}

interface KnowledgeChunk {
  content: string;
}

interface AgentPrompt {
  prompt_content: string;
}

interface CrmMessage {
  direction: string;
  content: string | null;
  sent_at: string;
}

// deno-lint-ignore no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

// Busca chunks relevantes da base de conhecimento
async function searchKnowledgeBase(
  supabase: AnySupabaseClient,
  userId: string,
  query: string,
  limit = 5
): Promise<string[]> {
  console.log(`[AI Agent] Searching knowledge base for user ${userId}: "${query.substring(0, 50)}..."`);

  // Busca documentos do usuário
  const { data: documents, error: docError } = await supabase
    .from("avivar_knowledge_documents")
    .select("id, name")
    .eq("user_id", userId);

  if (docError || !documents?.length) {
    console.log("[AI Agent] No knowledge documents found");
    return [];
  }

  const docs = documents as KnowledgeDocument[];
  const docIds = docs.map((d) => d.id);

  // Busca chunks dos documentos - busca simples por texto
  // Em produção, usaríamos embeddings para busca semântica
  const { data: chunks, error: chunkError } = await supabase
    .from("avivar_knowledge_chunks")
    .select("content")
    .in("document_id", docIds)
    .limit(limit);

  if (chunkError || !chunks?.length) {
    console.log("[AI Agent] No knowledge chunks found");
    return [];
  }

  const chunkData = chunks as KnowledgeChunk[];
  console.log(`[AI Agent] Found ${chunkData.length} knowledge chunks`);
  return chunkData.map((c) => c.content);
}

// Busca configuração do agente
async function getAgentConfig(
  supabase: AnySupabaseClient,
  userId: string
): Promise<Record<string, unknown> | null> {
  const { data: config, error } = await supabase
    .from("avivar_agent_configs")
    .select("*")
    .eq("user_id", userId)
    .eq("is_approved", true)
    .maybeSingle();

  if (error) {
    console.error("[AI Agent] Error fetching agent config:", error);
    return null;
  }

  return config as Record<string, unknown> | null;
}

// Busca prompt ativo do agente
async function getAgentPrompt(
  supabase: AnySupabaseClient,
  configId: string
): Promise<string | null> {
  const { data: prompt, error } = await supabase
    .from("avivar_agent_prompts")
    .select("prompt_content")
    .eq("agent_config_id", configId)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[AI Agent] Error fetching agent prompt:", error);
    return null;
  }

  const promptData = prompt as AgentPrompt | null;
  return promptData?.prompt_content || null;
}

// Busca histórico recente da conversa
async function getConversationHistory(
  supabase: AnySupabaseClient,
  conversationId: string,
  limit = 10
): Promise<Array<{ role: string; content: string }>> {
  const { data: messages, error } = await supabase
    .from("crm_messages")
    .select("direction, content, sent_at")
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (error || !messages?.length) {
    return [];
  }

  const msgData = messages as CrmMessage[];

  // Inverter para ordem cronológica e mapear para formato OpenAI
  return msgData
    .reverse()
    .filter((m) => m.content)
    .map((m) => ({
      role: m.direction === "inbound" ? "user" : "assistant",
      content: m.content!,
    }));
}

// Gera resposta usando Lovable AI
async function generateAIResponse(
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  knowledgeContext: string[]
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY não configurada");
  }

  // Construir contexto com base de conhecimento
  let contextSection = "";
  if (knowledgeContext.length > 0) {
    contextSection = `\n\n## Base de Conhecimento\nUse estas informações para responder:\n${knowledgeContext.join("\n\n---\n\n")}`;
  }

  const fullSystemPrompt = systemPrompt + contextSection;

  console.log("[AI Agent] Calling Lovable AI Gateway...");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: fullSystemPrompt },
        ...conversationHistory,
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[AI Agent] Lovable AI error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded - tente novamente em alguns segundos");
    }
    if (response.status === 402) {
      throw new Error("Créditos de IA esgotados - adicione créditos na sua conta Lovable");
    }
    throw new Error(`Erro na API de IA: ${response.status}`);
  }

  const data = await response.json();
  const aiMessage = data.choices?.[0]?.message?.content;

  if (!aiMessage) {
    throw new Error("Resposta vazia da IA");
  }

  console.log(`[AI Agent] Generated response: "${aiMessage.substring(0, 100)}..."`);
  return aiMessage;
}

// Envia mensagem via WhatsApp usando a função existente
async function sendWhatsAppMessage(
  supabaseUrl: string,
  supabaseKey: string,
  conversationId: string,
  content: string
): Promise<boolean> {
  console.log(`[AI Agent] Sending WhatsApp message to conversation ${conversationId}`);

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
      console.error("[AI Agent] Failed to send message:", result.error);
      return false;
    }

    console.log("[AI Agent] ✅ Message sent successfully");
    return true;
  } catch (error) {
    console.error("[AI Agent] Error sending message:", error);
    return false;
  }
}

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

    console.log(`[AI Agent] Processing message from ${leadName || leadPhone}: "${messageContent.substring(0, 50)}..."`);

    // 1. Buscar configuração do agente
    const agentConfig = await getAgentConfig(supabase, userId);
    if (!agentConfig) {
      console.log("[AI Agent] No approved agent config found, skipping AI response");
      return new Response(
        JSON.stringify({ success: false, error: "Agent not configured or not approved" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Buscar prompt do agente
    const agentPrompt = await getAgentPrompt(supabase, agentConfig.id as string);
    const systemPrompt = agentPrompt || buildDefaultPrompt(agentConfig);

    // 3. Buscar base de conhecimento
    const knowledgeContext = await searchKnowledgeBase(supabase, userId, messageContent);

    // 4. Buscar histórico da conversa
    const conversationHistory = await getConversationHistory(supabase, conversationId);

    // 5. Gerar resposta da IA
    const aiResponse = await generateAIResponse(systemPrompt, conversationHistory, knowledgeContext);

    // 6. Enviar resposta via WhatsApp
    const sent = await sendWhatsAppMessage(supabaseUrl, supabaseServiceKey, conversationId, aiResponse);

    const duration = Date.now() - startTime;
    console.log(`[AI Agent] Completed in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        sent,
        duration,
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

// Constrói prompt padrão baseado na configuração do agente
function buildDefaultPrompt(config: Record<string, unknown>): string {
  const {
    company_name,
    professional_name,
    attendant_name,
    tone_of_voice,
    welcome_message,
    services,
    schedule,
    city,
    state,
  } = config;

  const servicesText = Array.isArray(services)
    ? services.map((s: { name: string }) => s.name).join(", ")
    : "transplante capilar, tratamentos capilares";

  const scheduleText =
    typeof schedule === "object" && schedule
      ? Object.entries(schedule as Record<string, { start: string; end: string }>)
          .filter(([, v]) => v?.start && v?.end)
          .map(([day, v]) => `${day}: ${v.start} às ${v.end}`)
          .join("; ")
      : "Segunda a Sexta, 8h às 18h";

  return `Você é ${attendant_name || "Ana"}, assistente virtual da ${company_name || "clínica"}.
Você trabalha com o Dr(a). ${professional_name || "profissional"}.

## Seu Papel
- Responder dúvidas sobre procedimentos e serviços
- Agendar consultas e avaliações
- Coletar informações básicas dos interessados
- Transferir para um humano quando necessário

## Serviços Oferecidos
${servicesText}

## Horário de Funcionamento
${scheduleText}

## Localização
${city ? `${city}${state ? `, ${state}` : ""}` : "Consulte nosso endereço"}

## Tom de Voz
${tone_of_voice || "Profissional, empático e acolhedor"}

## Regras Importantes
1. NUNCA invente informações sobre preços ou procedimentos específicos
2. Para dúvidas complexas, sugira falar com um especialista
3. Seja breve e objetivo nas respostas (máximo 3-4 frases)
4. Use emojis com moderação para deixar a conversa mais amigável
5. Sempre tente direcionar para um agendamento de avaliação

${welcome_message ? `## Mensagem de Boas-Vindas\n${welcome_message}` : ""}`;
}
