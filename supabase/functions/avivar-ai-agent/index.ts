import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// GOOGLE CALENDAR HELPERS
// ============================================

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const clientId = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Google Calendar credentials not configured");

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) throw new Error("Failed to refresh Google token");
  return await response.json();
}

async function getGoogleAccessToken(supabase: AnySupabaseClient, agendaId: string): Promise<string | null> {
  const { data: agenda } = await supabase
    .from("avivar_agendas")
    .select("google_access_token, google_refresh_token, google_token_expires_at, google_connected, google_calendar_id")
    .eq("id", agendaId)
    .single();

  if (!agenda?.google_connected || !agenda?.google_refresh_token || !agenda?.google_calendar_id) {
    return null;
  }

  const expiresAt = agenda.google_token_expires_at ? new Date(agenda.google_token_expires_at) : null;
  const now = new Date();

  if (agenda.google_access_token && expiresAt && expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return agenda.google_access_token;
  }

  try {
    const tokens = await refreshGoogleToken(agenda.google_refresh_token);
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    await supabase
      .from("avivar_agendas")
      .update({ google_access_token: tokens.access_token, google_token_expires_at: newExpiresAt })
      .eq("id", agendaId);
    return tokens.access_token;
  } catch (e) {
    console.error("[AI Agent] Failed to refresh Google token:", e);
    return null;
  }
}

// Google Calendar sync is ONE-WAY: CRM Avivar → Google Calendar only.
// The AI checks availability solely from CRM's own schedule (avivar_schedule_config/hours/blocks + avivar_appointments).
// Google Calendar events do NOT block CRM availability.

// Timezone offset map for Google Calendar ISO strings
const TZ_OFFSETS: Record<string, string> = {
  "America/Sao_Paulo": "-03:00",
  "America/Fortaleza": "-03:00",
  "America/Manaus": "-04:00",
  "America/Cuiaba": "-04:00",
};

// Helper: get timezone for an agenda via schedule_config
async function getTimezoneForAgenda(supabase: AnySupabaseClient, agendaId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from("avivar_schedule_config")
      .select("timezone")
      .eq("agenda_id", agendaId)
      .single();
    return data?.timezone || "America/Sao_Paulo";
  } catch {
    return "America/Sao_Paulo";
  }
}

async function createGoogleCalendarEvent(
  supabase: AnySupabaseClient,
  agendaId: string,
  summary: string,
  date: string,
  startTime: string,
  endTime: string,
  description?: string,
  location?: string,
  attendeeEmail?: string
): Promise<string | null> {
  try {
    const { data: agenda } = await supabase
      .from("avivar_agendas")
      .select("google_calendar_id")
      .eq("id", agendaId)
      .single();

    if (!agenda?.google_calendar_id) return null;

    const accessToken = await getGoogleAccessToken(supabase, agendaId);
    if (!accessToken) return null;

    const tz = await getTimezoneForAgenda(supabase, agendaId);
    const offset = TZ_OFFSETS[tz] || "-03:00";

    const event: Record<string, unknown> = {
      summary,
      description,
      location,
      start: { dateTime: `${date}T${startTime}:00${offset}`, timeZone: tz },
      end: { dateTime: `${date}T${endTime}:00${offset}`, timeZone: tz },
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    if (attendeeEmail) {
      event.attendees = [{ email: attendeeEmail }];
    }

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(agenda.google_calendar_id)}/events?conferenceDataVersion=1`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }
    );

    if (response.ok) {
      const created = await response.json();
      const meetLink = created.conferenceData?.entryPoints?.find((ep: { entryPointType: string }) => ep.entryPointType === "video")?.uri || created.hangoutLink || null;
      console.log("[AI Agent] Google Calendar event created successfully, id:", created.id, "meetLink:", meetLink);
      return JSON.stringify({ eventId: created.id || null, meetLink });
    } else {
      console.error("[AI Agent] Failed to create Google Calendar event:", response.status);
      return null;
    }
  } catch (e) {
    console.error("[AI Agent] Error creating Google Calendar event:", e);
    return null;
  }
}

async function updateGoogleCalendarEvent(
  supabase: AnySupabaseClient,
  agendaId: string,
  googleEventId: string,
  summary: string,
  date: string,
  startTime: string,
  endTime: string,
  description?: string,
  location?: string
): Promise<string | null> {
  try {
    const { data: agenda } = await supabase
      .from("avivar_agendas")
      .select("google_calendar_id")
      .eq("id", agendaId)
      .single();

    if (!agenda?.google_calendar_id) return null;

    const accessToken = await getGoogleAccessToken(supabase, agendaId);
    if (!accessToken) return null;

    const tz = await getTimezoneForAgenda(supabase, agendaId);
    const offset = TZ_OFFSETS[tz] || "-03:00";

    const event = {
      summary,
      description,
      location,
      start: { dateTime: `${date}T${startTime}:00${offset}`, timeZone: tz },
      end: { dateTime: `${date}T${endTime}:00${offset}`, timeZone: tz },
    };

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(agenda.google_calendar_id)}/events/${encodeURIComponent(googleEventId)}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }
    );

    if (response.ok) {
      const updated = await response.json();
      console.log("[AI Agent] Google Calendar event updated successfully, id:", updated.id);
      return updated.id || googleEventId;
    } else {
      console.error("[AI Agent] Failed to update Google Calendar event:", response.status);
      return null;
    }
  } catch (e) {
    console.error("[AI Agent] Error updating Google Calendar event:", e);
    return null;
  }
}

async function deleteGoogleCalendarEvent(
  supabase: AnySupabaseClient,
  agendaId: string,
  googleEventId: string
): Promise<void> {
  try {
    const { data: agenda } = await supabase
      .from("avivar_agendas")
      .select("google_calendar_id")
      .eq("id", agendaId)
      .single();

    if (!agenda?.google_calendar_id) return;

    const accessToken = await getGoogleAccessToken(supabase, agendaId);
    if (!accessToken) return;

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(agenda.google_calendar_id)}/events/${encodeURIComponent(googleEventId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (response.ok || response.status === 204) {
      console.log("[AI Agent] Google Calendar event deleted successfully");
    } else {
      console.error("[AI Agent] Failed to delete Google Calendar event:", response.status);
    }
  } catch (e) {
    console.error("[AI Agent] Error deleting Google Calendar event:", e);
  }
}

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
            description: "Nome EXATO da unidade/agenda retornada por list_agendas. NUNCA invente nomes - use apenas os listados. Case-insensitive."
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
            description: "Nome EXATO da unidade/agenda retornada por list_agendas. NUNCA invente nomes - use SEMPRE a mesma agenda da consulta anterior (get_available_slots). Case-insensitive."
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
          },
          patient_email: {
            type: "string",
            description: "Email do paciente/lead (opcional). Se o lead informou o email durante a conversa, inclua aqui para enviar convite do Google Calendar."
          }
        },
        required: ["agenda_name", "patient_name", "date", "time", "service_type"]
      }
    }
      },
      {
        type: "function",
        function: {
          name: "reschedule_appointment",
          description: "Reagenda um agendamento EXISTENTE do lead para uma nova data/horário. Use esta ferramenta (em vez de create_appointment) quando o lead JÁ TEM um agendamento ativo e quer mudar a data ou horário. Isso ATUALIZA o agendamento existente ao invés de criar um novo.",
          parameters: {
            type: "object",
            properties: {
              new_date: {
                type: "string",
                description: "Nova data no formato YYYY-MM-DD"
              },
              new_time: {
                type: "string",
                description: "Novo horário no formato HH:MM"
              },
              agenda_name: {
                type: "string",
                description: "Nome da unidade/agenda (opcional, só se mudar de unidade)"
              }
            },
            required: ["new_date", "new_time"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "cancel_appointment",
          description: "Cancela/remove o agendamento ativo do lead. Use quando o lead desistir, cancelar, ou informar que não vai mais comparecer. Remove o agendamento do CRM e do Google Calendar.",
          parameters: {
            type: "object",
            properties: {
              reason: {
                type: "string",
                description: "Motivo do cancelamento informado pelo lead"
              }
            },
            required: ["reason"]
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
      },
      {
        type: "function",
        function: {
          name: "send_video",
          description: `Envia um vídeo da galeria pré-aprovada para marketing. Use quando o lead pedir para ver vídeos de depoimentos, procedimentos, tour da clínica, explicações, etc. IMPORTANTE: Todos os vídeos são de uso autorizado.`,
          parameters: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: ["depoimentos", "procedimentos", "tour", "geral"],
                description: "Categoria do vídeo: depoimentos (testemunhos de pacientes), procedimentos (explicações/demos), tour (clínica), geral (outros)"
              },
              search_term: {
                type: "string",
                description: "Termo de busca opcional para filtrar vídeos pela legenda (ex: 'transplante', 'resultado', 'tour')"
              }
            },
            required: ["category"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "send_fluxo_media",
          description: `Envia uma mídia (áudio, imagem, vídeo ou documento) que foi anexada a um passo do fluxo de atendimento. Use AUTOMATICAMENTE quando o passo atual do fluxo tiver uma mídia anexada. O step_id corresponde ao ID do passo no fluxo configurado.`,
          parameters: {
            type: "object",
            properties: {
              step_id: {
                type: "string",
                description: "ID do passo do fluxo que contém a mídia (ex: 'saudacao', 'identificacao')"
              }
            },
            required: ["step_id"]
          }
        }
      },
      {
        type: "function",
        function: {
      name: "preencher_checklist",
          description: `Preenche campos do checklist/ficha do lead com informações coletadas na conversa. Use SEMPRE que o lead confirmar dados como: data, horário, procedimento, valor, nome completo, etc. Após criar agendamento com create_appointment, preencha automaticamente os campos de data/horário se existirem no checklist. NÃO preencha campos com dados inventados - apenas dados confirmados pelo lead na conversa.`,
          parameters: {
            type: "object",
            properties: {
              campos: {
                type: "object",
                description: "Objeto com field_key -> valor. Ex: { \"data_consulta\": \"2026-02-29\", \"procedimento\": \"Avaliação Capilar\" }"
              }
            },
            required: ["campos"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "set_lead_language",
          description: `Salva o idioma detectado do lead. Use na PRIMEIRA mensagem do lead para registrar o idioma em que ele está escrevendo. Exemplos: 'pt-BR' para português, 'en' para inglês, 'es' para espanhol, 'fr' para francês, etc. Use o código ISO 639-1 com região quando aplicável.`,
          parameters: {
            type: "object",
            properties: {
              language: {
                type: "string",
                description: "Código do idioma detectado (ex: 'pt-BR', 'en', 'es', 'fr', 'de', 'it', 'ja', 'zh')"
              }
            },
            required: ["language"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "propose_slot",
          description: "Valida um horário e retorna os detalhes formatados para apresentar ao lead. NÃO cria nenhum registro no banco — apenas verifica disponibilidade e formata a proposta. Use SEMPRE antes de create_appointment. Após chamar propose_slot, apresente os detalhes ao lead e pergunte 'Posso confirmar?'. Só use create_appointment quando o lead responder 'sim' na PRÓXIMA mensagem.",
          parameters: {
            type: "object",
            properties: {
              agenda_name: {
                type: "string",
                description: "Nome da unidade/agenda"
              },
              patient_name: {
                type: "string",
                description: "Nome completo do paciente"
              },
              date: {
                type: "string",
                description: "Data no formato YYYY-MM-DD"
              },
              time: {
                type: "string",
                description: "Horário no formato HH:MM"
              },
              service_type: {
                type: "string",
                description: "Tipo de serviço: 'avaliacao' ou 'transplante'"
              },
              patient_email: {
                type: "string",
                description: "Email do paciente/lead (opcional). Se o lead informou o email, inclua aqui."
              }
            },
            required: ["agenda_name", "patient_name", "date", "time", "service_type"]
          }
        }
      }
];

// ============================================
// TOOL IMPLEMENTATIONS
// ============================================

async function listAgendas(
  supabase: AnySupabaseClient,
  accountId: string
): Promise<string> {
  console.log(`[AI Agent] Tool: list_agendas() for account: ${accountId}`);

  const { data: agendas, error } = await supabase
    .from("avivar_agendas")
    .select("id, name, professional_name, city, address")
    .eq("account_id", accountId)
    .eq("is_active", true)
    .order("name");

  if (error || !agendas?.length) {
    const { data: configData } = await supabase
      .from("avivar_schedule_config")
      .select("id, professional_name")
      .eq("account_id", accountId)
      .limit(1)
      .maybeSingle();
    
    if (configData) {
      return `Temos apenas uma unidade disponível: ${configData.professional_name || "Clínica Principal"}`;
    }
    return "Não há agendas configuradas no momento.";
  }

  const formatted = agendas.map((a: any, i: number) => 
    `${i + 1}. ${a.name}${a.city ? ` - ${a.city}` : ""}${a.professional_name ? ` (${a.professional_name})` : ""}`
  ).join("\n");

  return `Nossas unidades disponíveis:\n\n${formatted}\n\nEm qual unidade você gostaria de agendar?`;
}

async function listProducts(
  supabase: AnySupabaseClient,
  accountId: string,
  category?: string
): Promise<string> {
  console.log(`[AI Agent] Tool: list_products(category=${category || "all"}) for account: ${accountId}`);

  const { data: products, error } = await supabase
    .from("avivar_products")
    .select("id, name, description, category, price, promotional_price, stock_quantity, is_active")
    .eq("account_id", accountId)
    .eq("is_active", true)
    .order("name");

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
  accountId: string,
  _agentId: string | null, // Ignoramos agentId - acesso à base completa
  query: string
): Promise<string> {
  console.log(`[AI Agent] Tool: search_knowledge_base("${query.substring(0, 50)}...") - FULL ACCESS for account: ${accountId}`);

  const queryTerms = query.toLowerCase().split(" ").filter(t => t.length > 2);
  const allKnowledge: Array<{ content: string; source: string }> = [];

  // SOURCE 1: avivar_knowledge_documents + chunks (tabela de documentos)
  const { data: documents } = await supabase
    .from("avivar_knowledge_documents")
    .select("id, name")
    .eq("account_id", accountId);

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
    .eq("account_id", accountId)
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

// Format time for display: "12:00" → "12h00"
function formatTimeDisplay(time: string): string {
  return time.replace(":", "h");
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
  accountId: string,
  agendaName: string
): Promise<ResolvedAgendaInfo> {
  const { data: agendas } = await supabase
    .from("avivar_agendas")
    .select("id, name, city, professional_name, address")
    .eq("account_id", accountId)
    .eq("is_active", true)
    .ilike("name", `%${agendaName}%`);

  let agendaInfo = agendas?.[0] || null;

  if (!agendaInfo) {
    const { data: byCity } = await supabase
      .from("avivar_agendas")
      .select("id, name, city, professional_name, address")
      .eq("account_id", accountId)
      .eq("is_active", true)
      .ilike("city", `%${agendaName}%`);
    agendaInfo = byCity?.[0] || null;
  }

  // Fallback: se não encontrou a agenda pelo nome/cidade, usar a primeira agenda ativa da conta
  if (!agendaInfo) {
    console.warn(`[AI Agent] Agenda "${agendaName}" not found. Falling back to first active agenda.`);
    const { data: fallback } = await supabase
      .from("avivar_agendas")
      .select("id, name, city, professional_name, address")
      .eq("account_id", accountId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1);
    agendaInfo = fallback?.[0] || null;
    if (agendaInfo) {
      console.log(`[AI Agent] Using fallback agenda: "${agendaInfo.name}" (${agendaInfo.city})`);
    }
  }

  return {
    agendaId: agendaInfo?.id || null,
    agendaInfo,
  };
}

async function resolveAgendaById(
  supabase: AnySupabaseClient,
  agendaId: string | null
): Promise<ResolvedAgendaInfo> {
  if (!agendaId) return { agendaId: null, agendaInfo: null };
  const { data } = await supabase
    .from("avivar_agendas")
    .select("id, name, city, professional_name, address")
    .eq("id", agendaId)
    .single();
  return { agendaId: data?.id || null, agendaInfo: data || null };
}

// Helper: get the configured timezone for an agenda (defaults to America/Sao_Paulo)
async function getAgendaTimezone(supabase: AnySupabaseClient, userId: string, agendaId: string | null): Promise<string> {
  try {
    let query = supabase.from("avivar_schedule_config").select("timezone").eq("user_id", userId);
    if (agendaId) {
      query = query.eq("agenda_id", agendaId);
    } else {
      query = query.is("agenda_id", null);
    }
    const { data } = await query.single();
    return data?.timezone || "America/Sao_Paulo";
  } catch {
    return "America/Sao_Paulo";
  }
}

async function getAvailableSlots(
  supabase: AnySupabaseClient,
  userId: string,
  agendaName: string,
  dateStr?: string
): Promise<string> {
  console.log(`[AI Agent] Tool: get_available_slots(agenda="${agendaName}", date=${dateStr || "próximos dias"})`);

  const { agendaId, agendaInfo } = await resolveAgenda(supabase, userId, agendaName);
  const tz = await getAgendaTimezone(supabase, userId, agendaId);

  const dates: string[] = [];
  if (dateStr) {
    dates.push(dateStr);
  } else {
    const nowLocal = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
    let count = 0;
    let d = new Date(nowLocal);
    while (count < 3) {
      d.setDate(d.getDate() + 1);
      const dow = d.getDay();
      if (dow !== 0) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        dates.push(`${yyyy}-${mm}-${dd}`);
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
    // Availability comes solely from CRM schedule (no Google Calendar filtering)
    let available = (slots || []).filter((s: { is_available: boolean }) => s.is_available);

    // CRITICAL: Filter out past time slots if the date is TODAY (using configured timezone)
    const nowLocal = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
    const todayStr = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, "0")}-${String(nowLocal.getDate()).padStart(2, "0")}`;
    if (date === todayStr) {
      const currentMinutes = nowLocal.getHours() * 60 + nowLocal.getMinutes();
      available = available.filter((s: { slot_start: string }) => {
        const [h, m] = s.slot_start.substring(0, 5).split(":").map(Number);
        return h * 60 + m > currentMinutes;
      });
    }
    
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
      
      results.push(`📅 ${dayName} (${dateFormatted}): ${selectedTimes.map(formatTimeDisplay).join(" ou ")}`);
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
  const tz = await getAgendaTimezone(supabase, userId, agendaId);

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

    // CRITICAL: Filter out past time slots if checking TODAY (using configured timezone)
    const nowLocal2 = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
    const todayStr2 = `${nowLocal2.getFullYear()}-${String(nowLocal2.getMonth() + 1).padStart(2, "0")}-${String(nowLocal2.getDate()).padStart(2, "0")}`;
    const isToday = normalizedDate === todayStr2;
    const currentMin = nowLocal2.getHours() * 60 + nowLocal2.getMinutes();

    const allTimes = (slots || [])
    .map((s: { slot_start: string }) => s.slot_start.substring(0, 5))
    .filter((t: string) => {
      if (!t) return false;
      if (!isToday) return true;
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m > currentMin;
    })
    .sort((a: string, b: string) => timeToMinutes(a) - timeToMinutes(b));

  const availableTimes = (slots || [])
    .filter((s: { is_available: boolean }) => s.is_available)
    .map((s: { slot_start: string }) => s.slot_start.substring(0, 5))
    .filter((t: string) => {
      if (!t) return false;
      if (!isToday) return true;
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m > currentMin;
    })
    .sort((a: string, b: string) => timeToMinutes(a) - timeToMinutes(b));

  const dateObj = new Date(normalizedDate + "T12:00:00");
  const dayName = dateObj.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateFormatted = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  if (availableTimes.includes(normalizedTime)) {
    return `Sim, ${dayName} (${dateFormatted}) às ${formatTimeDisplay(normalizedTime)} está disponível. Posso confirmar o agendamento?`;
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
    ? formatTimeDisplay(suggestions[0])
    : `${formatTimeDisplay(suggestions[0])} ou ${formatTimeDisplay(suggestions[1])}`;

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
        const { data: byAccount } = await supabase
          .from("avivar_schedule_config")
          .select("id")
          .eq("account_id", accountId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        configId = byAccount?.id || null;
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
            .map((p: { start_time: string; end_time: string }) => `${formatTimeDisplay(p.start_time.substring(0, 5))}–${formatTimeDisplay(p.end_time.substring(0, 5))}`)
            .join(" e ");
        }
      }

      if (periodsText) {
        return `Nesse dia a agenda não atende às ${formatTimeDisplay(normalizedTime)} (atendimento: ${periodsText}). Tenho ${suggestionText}. Qual fica melhor para você?`;
      }
    } catch (e) {
      console.error("[AI Agent] Error building periods text:", e);
    }

    return `Nesse dia a agenda não atende às ${formatTimeDisplay(normalizedTime)}. Tenho ${suggestionText}. Qual fica melhor para você?`;
  }

  return `Esse horário já está reservado. Para ${dayName} (${dateFormatted}) tenho ${suggestionText}. Qual fica melhor para você?`;
}

async function createAppointment(
  supabase: AnySupabaseClient,
  accountId: string,
  userId: string,
  leadId: string | null,
  conversationId: string,
  agendaName: string,
  patientName: string,
  patientPhone: string,
  date: string,
  time: string,
  serviceType: string,
  notes?: string,
  patientEmail?: string
): Promise<string> {
  console.log(`[AI Agent] Tool: create_appointment(agenda="${agendaName}", ${patientName}, ${date} ${time})`);

  const { agendaId, agendaInfo } = await resolveAgenda(supabase, accountId, agendaName);

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
    return `Infelizmente o horário ${formatTimeDisplay(normalizedTime)} do dia ${normalizedDate} não está mais disponível. Por favor, escolha outro horário.`;
  }

  const { data: appointment, error } = await supabase
    .from("avivar_appointments")
    .insert({
      account_id: accountId,
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
      patient_email: patientEmail || null,
      status: "scheduled",
      created_by: "ai"
    })
    .select()
    .single();

  if (error) {
    console.error("[AI Agent] Error creating appointment:", error);
    return "❌ Ocorreu um erro ao criar o agendamento. Por favor, tente novamente ou entre em contato conosco.";
  }

  // Sync to Google Calendar and store event ID + meet link
  let meetLink: string | null = null;
  if (agendaId) {
    const serviceLabel = serviceType === "avaliacao" ? "Avaliação Capilar" : "Transplante Capilar";
    try {
      const googleResult = await createGoogleCalendarEvent(
        supabase, agendaId,
        `Avaliação com Especialista Capilar - Paciente ${patientName}`,
        normalizedDate, normalizedTime, endTime,
        `Paciente: ${patientName}\nTelefone: ${patientPhone}\n${notes || ""}`,
        agendaInfo?.address || agendaInfo?.city || undefined,
        patientEmail || undefined
      );
      if (googleResult && appointment?.id) {
        try {
          const parsed = JSON.parse(googleResult);
          const googleEventId = parsed.eventId;
          meetLink = parsed.meetLink;
          if (googleEventId) {
            await supabase
              .from("avivar_appointments")
              .update({ google_event_id: googleEventId })
              .eq("id", appointment.id);
            console.log(`[AI Agent] Stored google_event_id=${googleEventId}, meetLink=${meetLink} for appointment ${appointment.id}`);
          }
        } catch {
          // Legacy fallback: if result is just a string ID
          await supabase
            .from("avivar_appointments")
            .update({ google_event_id: googleResult })
            .eq("id", appointment.id);
        }
      }
    } catch (e) {
      console.error("[AI Agent] Google Calendar sync error:", e);
    }
  }

  // Fallback meet link if no Google Calendar
  if (!meetLink && appointment?.id) {
    meetLink = `https://meet.jit.si/avivar-${appointment.id}`;
  }

  // Auto-fill checklist fields after successful appointment creation
  try {
    const checklistCampos: Record<string, string> = {};
    // Map common checklist field keys to appointment data
    const dateFormatISO = normalizedDate; // YYYY-MM-DD
    const possibleDateKeys = ["data_e_hora", "data_hora", "data", "data_agendamento", "data_consulta"];
    const possibleTypeKeys = ["tipo_de_consulta", "tipo_consulta", "procedimento", "tipo"];
    
    // Find matching fields in lead's kanban checklist config
    const { data: leadKanban } = await supabase
      .from("avivar_kanban_leads")
      .select("id, kanban_id, custom_fields")
      .eq("phone", patientPhone)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (leadKanban) {
      const { data: checklistFields } = await supabase
        .from("avivar_column_checklists")
        .select("field_key, field_type, options")
        .eq("account_id", accountId);

      if (checklistFields && checklistFields.length > 0) {
        const fieldKeys = checklistFields.map(f => f.field_key.toLowerCase());
        
        // Auto-fill date/time
        for (const dk of possibleDateKeys) {
          if (fieldKeys.includes(dk)) {
            const matchField = checklistFields.find(f => f.field_key.toLowerCase() === dk);
            if (matchField) {
              checklistCampos[matchField.field_key] = matchField.field_type === "date" 
                ? dateFormatISO 
                : `${dateFormatISO} ${normalizedTime}`;
            }
            break;
          }
        }
        
        // Auto-fill consultation type - respect select options if available
        for (const tk of possibleTypeKeys) {
          if (fieldKeys.includes(tk)) {
            const matchField = checklistFields.find(f => f.field_key.toLowerCase() === tk);
            if (matchField) {
              if (matchField.field_type === "select" && matchField.options) {
                // For select fields, pick the first available option or match based on context
                const opts = matchField.options as string[];
                if (opts.length > 0) {
                  // Default to "PRESENCIAL" if available, otherwise first option
                  checklistCampos[matchField.field_key] = opts.includes("PRESENCIAL") ? "PRESENCIAL" : opts[0];
                }
              } else {
                checklistCampos[matchField.field_key] = serviceType === "avaliacao" ? "Avaliação Capilar" : "Transplante Capilar";
              }
            }
            break;
          }
        }

        // Auto-fill meet link
        const possibleLinkKeys = ["link_da_call", "link_meet", "link_videochamada", "link_call", "meet_link"];
        if (meetLink) {
          for (const lk of possibleLinkKeys) {
            if (fieldKeys.includes(lk)) {
              const matchField = checklistFields.find(f => f.field_key.toLowerCase() === lk);
              if (matchField) {
                checklistCampos[matchField.field_key] = meetLink;
              }
              break;
            }
          }
        }
      }

      if (Object.keys(checklistCampos).length > 0) {
        const existingFields = (leadKanban.custom_fields as Record<string, unknown>) || {};
        const mergedFields = { ...existingFields, ...checklistCampos };
        await supabase
          .from("avivar_kanban_leads")
          .update({ custom_fields: mergedFields, updated_at: new Date().toISOString() })
          .eq("id", leadKanban.id);
        console.log(`[AI Agent] ✅ Auto-filled checklist after appointment: ${Object.keys(checklistCampos).join(", ")}`);
      }
    }
  } catch (e) {
    console.error("[AI Agent] Error auto-filling checklist:", e);
  }

  const dateObj = new Date(normalizedDate + "T12:00:00");
  const dayName = dateObj.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateFormatted = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const locationInfo = agendaInfo?.city 
    ? `\n📍 Local: ${agendaInfo.name}${agendaInfo.address ? ` - ${agendaInfo.address}` : ""}`
    : "";

  return `✅ AGENDAMENTO CRIADO COM SUCESSO — NÃO RE-VERIFIQUE DISPONIBILIDADE!

📅 Data: ${dayName}, ${dateFormatted}
⏰ Horário: ${formatTimeDisplay(normalizedTime)}
👤 Paciente: ${patientName}
📋 Tipo: ${serviceType === "avaliacao" ? "Avaliação Capilar" : "Transplante Capilar"}${locationInfo}

INSTRUÇÃO INTERNA: O agendamento JÁ FOI SALVO no sistema. O horário ${formatTimeDisplay(normalizedTime)} agora aparecerá como OCUPADO porque foi reservado com sucesso. NÃO use check_slot nem get_available_slots — apenas confirme ao lead com os dados acima e mova para a etapa "agendado".`;
}

// ============================================
// PROPOSE SLOT - Validate & Format (NO DB write)
// ============================================

async function proposeSlot(
  supabase: AnySupabaseClient,
  accountId: string,
  userId: string,
  agendaName: string,
  patientName: string,
  date: string,
  time: string,
  serviceType: string
): Promise<string> {
  console.log(`[AI Agent] Tool: propose_slot(agenda="${agendaName}", ${patientName}, ${date} ${time})`);

  const { agendaId, agendaInfo } = await resolveAgenda(supabase, accountId, agendaName);

  const normalizedDate = normalizeDateISO(date);
  const normalizedTime = normalizeTimeHHMM(time);
  if (!normalizedDate || !normalizedTime) {
    return "Não consegui entender a data/horário. Você pode confirmar no formato 2026-02-09 às 09:30?";
  }

  // Check availability (NO INSERT)
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
    return `Infelizmente o horário ${formatTimeDisplay(normalizedTime)} do dia ${normalizedDate} não está mais disponível. Por favor, escolha outro horário.`;
  }

  const dateObj = new Date(normalizedDate + "T12:00:00");
  const dayName = dateObj.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateFormatted = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const locationInfo = agendaInfo?.city
    ? `\n📍 Local: ${agendaInfo.name}${agendaInfo.address ? ` - ${agendaInfo.address}` : ""}`
    : "";

  console.log(`[AI Agent] ✅ Slot validated (NO DB write): ${normalizedDate} ${normalizedTime}`);

  return `PROPOSTA_VALIDADA (SEM registro no banco)

📅 Data: ${dayName}, ${dateFormatted}
⏰ Horário: ${formatTimeDisplay(normalizedTime)}
👤 Paciente: ${patientName}
📋 Tipo: ${serviceType === "avaliacao" ? "Avaliação Capilar" : "Transplante Capilar"}${locationInfo}

INSTRUÇÃO INTERNA: O horário foi VALIDADO como disponível mas NADA foi salvo no banco. Agora APRESENTE os detalhes ao lead e PERGUNTE se pode confirmar. SOMENTE quando o lead confirmar (na PRÓXIMA mensagem), use create_appointment com os mesmos dados. NUNCA use create_appointment neste mesmo turno — AGUARDE a próxima mensagem do lead.`;
}

// ============================================
// RESCHEDULE APPOINTMENT - Updates existing
// ============================================

async function rescheduleAppointment(
  supabase: AnySupabaseClient,
  accountId: string,
  userId: string,
  leadId: string | null,
  conversationId: string,
  patientPhone: string,
  newDate: string,
  newTime: string,
  agendaName?: string
): Promise<string> {
  console.log(`[AI Agent] Tool: reschedule_appointment(${patientPhone}, ${newDate} ${newTime})`);

  // Find the existing active appointment for this lead/phone
  let existingQuery = supabase
    .from("avivar_appointments")
    .select("*")
    .eq("account_id", accountId)
    .in("status", ["scheduled", "confirmed"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (leadId) {
    existingQuery = existingQuery.eq("lead_id", leadId);
  } else {
    existingQuery = existingQuery.eq("patient_phone", patientPhone);
  }

  const { data: existingAppts } = await existingQuery;
  const existing = existingAppts?.[0];

  if (!existing) {
    return "Não encontrei nenhum agendamento ativo para reagendar. Vamos criar um novo agendamento? Me informe a data e horário desejados.";
  }

  // Resolve agenda (use existing or new if specified)
  const targetAgendaId = agendaName 
    ? (await resolveAgenda(supabase, accountId, agendaName)).agendaId 
    : existing.agenda_id;

  const { agendaInfo } = agendaName 
    ? await resolveAgenda(supabase, accountId, agendaName) 
    : await resolveAgendaById(supabase, targetAgendaId);

  const normalizedDate = normalizeDateISO(newDate);
  const normalizedTime = normalizeTimeHHMM(newTime);
  if (!normalizedDate || !normalizedTime) {
    return "Não consegui entender a data/horário para reagendar. Você pode confirmar no formato 2026-02-09 às 09:30?";
  }

  const [hours, minutes] = normalizedTime.split(":").map(Number);
  const endHours = Math.floor((hours * 60 + minutes + 30) / 60);
  const endMinutes = (hours * 60 + minutes + 30) % 60;
  const endTime = `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;

  // Check availability
  const { data: slots } = await supabase.rpc("get_available_slots_flexible", {
    p_user_id: userId,
    p_agenda_id: targetAgendaId,
    p_date: normalizedDate,
    p_duration_minutes: 30
  });

  // The existing appointment's slot will show as occupied, so we need to allow it
  const slotAvailable = (slots || []).some((s: { slot_start: string; is_available: boolean }) => 
    s.slot_start.substring(0, 5) === normalizedTime && s.is_available
  );

  // Also check if the "occupied" slot is actually the same appointment being rescheduled
  const isSameSlot = existing.appointment_date === normalizedDate && 
    existing.start_time?.substring(0, 5) === normalizedTime;

  if (!slotAvailable && !isSameSlot) {
    return `Infelizmente o horário ${formatTimeDisplay(normalizedTime)} do dia ${normalizedDate} não está disponível. Por favor, escolha outro horário.`;
  }

  // UPDATE the existing appointment
  const { error } = await supabase
    .from("avivar_appointments")
    .update({
      appointment_date: normalizedDate,
      start_time: normalizedTime + ":00",
      end_time: endTime + ":00",
      agenda_id: targetAgendaId,
      location: agendaInfo?.city || existing.location,
      professional_name: agendaInfo?.professional_name || existing.professional_name,
      status: "scheduled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) {
    console.error("[AI Agent] Error rescheduling appointment:", error);
    return "❌ Ocorreu um erro ao reagendar. Por favor, tente novamente.";
  }

  // Update Google Calendar event (if exists) or create new one
  if (targetAgendaId) {
    const serviceLabel = existing.service_type || "Avaliação Capilar";
    const patientName = existing.patient_name;
    try {
      if (existing.google_event_id) {
        // UPDATE existing Google Calendar event
        await updateGoogleCalendarEvent(
          supabase, targetAgendaId, existing.google_event_id,
          `${serviceLabel} - ${patientName}`,
          normalizedDate, normalizedTime, endTime,
          `Paciente: ${patientName}\nTelefone: ${patientPhone}\nReagendado`,
          agendaInfo?.address || agendaInfo?.city || undefined
        );
        console.log(`[AI Agent] Google Calendar event ${existing.google_event_id} updated for reschedule`);
      } else {
        // No google event yet, create one
        const googleEventId = await createGoogleCalendarEvent(
          supabase, targetAgendaId,
          `${serviceLabel} - ${patientName}`,
          normalizedDate, normalizedTime, endTime,
          `Paciente: ${patientName}\nTelefone: ${patientPhone}\nReagendado`,
          agendaInfo?.address || agendaInfo?.city || undefined
        );
        if (googleEventId) {
          await supabase
            .from("avivar_appointments")
            .update({ google_event_id: googleEventId })
            .eq("id", existing.id);
        }
      }
    } catch (e) {
      console.error("[AI Agent] Google Calendar reschedule sync error:", e);
    }
  }

  const dateObj = new Date(normalizedDate + "T12:00:00");
  const dayName = dateObj.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateFormatted = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return `✅ Agendamento reagendado com sucesso!

📅 Nova data: ${dayName}, ${dateFormatted}
⏰ Novo horário: ${formatTimeDisplay(normalizedTime)}
👤 Paciente: ${existing.patient_name}
📋 Tipo: ${existing.service_type || "Avaliação Capilar"}

O agendamento anterior foi atualizado. Aguardamos você!`;
}

// ============================================
// CANCEL APPOINTMENT - Removes from CRM + Google
// ============================================

async function cancelAppointment(
  supabase: AnySupabaseClient,
  accountId: string,
  leadId: string | null,
  patientPhone: string,
  reason: string
): Promise<string> {
  console.log(`[AI Agent] Tool: cancel_appointment(${patientPhone}, reason: ${reason})`);

  // Find the existing active appointment
  let query = supabase
    .from("avivar_appointments")
    .select("*")
    .eq("account_id", accountId)
    .in("status", ["scheduled", "confirmed"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (leadId) {
    query = query.eq("lead_id", leadId);
  } else {
    query = query.eq("patient_phone", patientPhone);
  }

  const { data: appts } = await query;
  const existing = appts?.[0];

  if (!existing) {
    return "Não encontrei nenhum agendamento ativo para cancelar.";
  }

  // Delete from Google Calendar first
  if (existing.google_event_id && existing.agenda_id) {
    try {
      await deleteGoogleCalendarEvent(supabase, existing.agenda_id, existing.google_event_id);
      console.log(`[AI Agent] Google Calendar event ${existing.google_event_id} deleted`);
    } catch (e) {
      console.error("[AI Agent] Error deleting Google Calendar event:", e);
    }
  }

  // Update status to cancelled in CRM
  const { error } = await supabase
    .from("avivar_appointments")
    .update({
      status: "cancelled",
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) {
    console.error("[AI Agent] Error cancelling appointment:", error);
    return "❌ Ocorreu um erro ao cancelar o agendamento. Por favor, tente novamente.";
  }

  const dateObj = new Date(existing.appointment_date + "T12:00:00");
  const dateFormatted = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  console.log(`[AI Agent] Appointment ${existing.id} cancelled successfully`);

  return `✅ Agendamento cancelado com sucesso!

📅 Data: ${dateFormatted}
⏰ Horário: ${formatTimeDisplay(existing.start_time?.substring(0, 5) || "")}
👤 Paciente: ${existing.patient_name}
📋 Motivo: ${reason}

O agendamento foi removido do sistema e do calendário.`;
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
      // Get all kanbans for this account (via lead's account_id)
      const { data: leadAccountData } = await supabase
        .from("avivar_kanban_leads")
        .select("account_id")
        .eq("id", lead.id)
        .single();
      const leadAccountId = leadAccountData?.account_id || leadData.user_id;
      const { data: allKanbans } = await supabase
        .from("avivar_kanbans")
        .select("id")
        .eq("account_id", leadAccountId)
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
      .eq("account_id", userId)
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
    .eq("account_id", userId)
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

    // Save message to CRM (best-effort) - resolve account_id from conversation
    const { data: convData } = await supabase.from("crm_conversations").select("account_id").eq("id", conversationId).single();
    await supabase.from("crm_messages").insert({
      conversation_id: conversationId,
      direction: "outbound",
      content: selectedImage.caption || "[Imagem enviada]",
      media_url: selectedImage.url,
      media_type: "image",
      sent_at: new Date().toISOString(),
      is_ai_generated: true,
      account_id: convData?.account_id,
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
// SEND VIDEO TOOL
// ============================================

interface GalleryVideo {
  id: string;
  url: string;
  caption?: string;
  category: string;
}

interface VideoGallery {
  depoimentos: GalleryVideo[];
  procedimentos: GalleryVideo[];
  tour: GalleryVideo[];
  geral: GalleryVideo[];
}

async function sendVideo(
  supabase: AnySupabaseClient,
  userId: string,
  agentId: string | null,
  conversationId: string,
  leadPhone: string,
  category: string,
  searchTerm?: string
): Promise<{ success: boolean; message: string; videoUrl?: string }> {
  console.log(`[AI Agent] Tool: send_video(category="${category}", search="${searchTerm || ''}")`);

  // Map category from tool to gallery key
  const categoryMap: Record<string, keyof VideoGallery> = {
    "depoimentos": "depoimentos",
    "testimonials": "depoimentos",
    "procedimentos": "procedimentos",
    "procedures": "procedimentos",
    "tour": "tour",
    "geral": "geral",
    "general": "geral"
  };

  const galleryKey = categoryMap[category.toLowerCase()] || "geral";

  // Get the agent's video gallery (stored in a similar structure to image_gallery)
  let gallery: VideoGallery | null = null;

  if (agentId) {
    const { data: agent } = await supabase
      .from("avivar_agents")
      .select("video_gallery")
      .eq("id", agentId)
      .single();

    if (agent?.video_gallery) {
      gallery = agent.video_gallery as VideoGallery;
    }
  }

  // If no agent gallery, try to get from any agent of this user
  if (!gallery) {
    const { data: agents } = await supabase
      .from("avivar_agents")
      .select("video_gallery")
      .eq("account_id", userId)
      .eq("is_active", true)
      .limit(1);

    if (agents?.[0]?.video_gallery) {
      gallery = agents[0].video_gallery as VideoGallery;
    }
  }

  if (!gallery) {
    console.log("[AI Agent] No video gallery found");
    return { success: false, message: "Ainda não temos vídeos configurados nesta categoria." };
  }

  const videos = gallery[galleryKey] || [];
  
  if (videos.length === 0) {
    console.log(`[AI Agent] No videos in category ${galleryKey}`);
    return { success: false, message: `Não temos vídeos na categoria "${category}" ainda.` };
  }

  // Filter by search term if provided
  let selectedVideo: GalleryVideo;
  
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const matching = videos.filter((vid: GalleryVideo) => {
      const captionLower = vid.caption?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
      return captionLower.includes(searchLower);
    });
    
    if (matching.length > 0) {
      selectedVideo = matching[Math.floor(Math.random() * matching.length)];
      console.log(`[AI Agent] Found ${matching.length} matching video(s)`);
    } else {
      console.log(`[AI Agent] No videos matching "${searchTerm}" in category ${galleryKey}`);
      return { 
        success: false, 
        message: `Não encontrei vídeos com as características "${searchTerm}" na galeria. Pergunte ao paciente se deseja ver outros tipos de vídeos que temos disponíveis.` 
      };
    }
  } else {
    // No search term - pick random video from category
    selectedVideo = videos[Math.floor(Math.random() * videos.length)];
  }

  console.log(`[AI Agent] Selected video: ${selectedVideo.url.substring(0, 50)}...`);

  // Get user's connected WhatsApp instance
  const uazapiUrl = Deno.env.get("UAZAPI_URL") || "";
  let uazapiToken = Deno.env.get("UAZAPI_TOKEN") || "";

  const { data: uazapiInstance, error: uazapiInstanceError } = await supabase
    .from("avivar_uazapi_instances")
    .select("instance_token, status")
    .eq("account_id", userId)
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
      message: `Não consegui enviar o vídeo agora porque o WhatsApp não está conectado. Link: ${selectedVideo.url}`,
      videoUrl: selectedVideo.url,
    };
  }

  // Send video via UazAPI
  try {
    let phone = leadPhone.replace(/\D/g, "");
    if (!phone.startsWith("55") && phone.length <= 11) {
      phone = `55${phone}`;
    }

    const apiUrl = `${uazapiUrl}/send/media`;
    console.log(`[AI Agent] Sending video to ${phone} via ${apiUrl}`);
    console.log(`[AI Agent] Video URL: ${selectedVideo.url}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": uazapiToken,
      },
      body: JSON.stringify({
        number: phone,
        type: "video",
        file: selectedVideo.url,
        text: " ", // Caption is for internal AI filtering only
      }),
    });

    const responseText = await response.text();
    console.log(`[AI Agent] UazAPI response (${response.status}): ${responseText}`);

    if (!response.ok) {
      console.error("[AI Agent] Failed to send video, attempting link fallback:", responseText);

      // Fallback: send the URL as a text message
      try {
        const fallbackRes = await fetch(`${uazapiUrl}/send/text`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": uazapiToken,
          },
          body: JSON.stringify({
            number: phone,
            text: selectedVideo.url,
          }),
        });
        const fallbackText = await fallbackRes.text();
        console.log(`[AI Agent] Fallback /send/text (${fallbackRes.status}): ${fallbackText}`);
      } catch (fallbackErr) {
        console.error("[AI Agent] Fallback /send/text failed:", fallbackErr);
      }

      return {
        success: false,
        message: `Não consegui enviar o vídeo como mídia. Enviei o link para o paciente: ${selectedVideo.url}`,
        videoUrl: selectedVideo.url,
      };
    }

    // Save message to CRM (best-effort) - resolve account_id from conversation
    const { data: convData2 } = await supabase.from("crm_conversations").select("account_id").eq("id", conversationId).single();
    await supabase.from("crm_messages").insert({
      conversation_id: conversationId,
      direction: "outbound",
      content: selectedVideo.caption || "[Vídeo enviado]",
      media_url: selectedVideo.url,
      media_type: "video",
      sent_at: new Date().toISOString(),
      is_ai_generated: true,
      account_id: convData2?.account_id,
    });

    console.log("[AI Agent] ✅ Video sent successfully");
    return {
      success: true,
      message: "Vídeo enviado com sucesso! Aguarde a resposta do paciente.",
      videoUrl: selectedVideo.url,
    };
  } catch (error) {
    console.error("[AI Agent] Error sending video:", error);
    return {
      success: false,
      message: `Não consegui enviar o vídeo agora. Link: ${selectedVideo.url}`,
      videoUrl: selectedVideo.url,
    };
  }
}

// Send media attached to a fluxo de atendimento step
async function sendFluxoMedia(
  supabase: AnySupabaseClient,
  userId: string,
  agentId: string | null,
  conversationId: string,
  leadPhone: string,
  stepId: string
): Promise<{ success: boolean; message: string }> {
  console.log(`[AI Agent] Tool: send_fluxo_media(step_id="${stepId}")`);

  // Get agent's fluxo_atendimento
  let fluxo: Record<string, unknown> | null = null;
  if (agentId) {
    const { data: agent } = await supabase
      .from("avivar_agents")
      .select("fluxo_atendimento")
      .eq("id", agentId)
      .single();
    fluxo = agent?.fluxo_atendimento as Record<string, unknown> | null;
  }
  if (!fluxo) {
    const { data: agents } = await supabase
      .from("avivar_agents")
      .select("fluxo_atendimento")
      .eq("account_id", userId)
      .eq("is_active", true)
      .limit(1);
    fluxo = agents?.[0]?.fluxo_atendimento as Record<string, unknown> | null;
  }

  if (!fluxo) {
    return { success: false, message: "Fluxo de atendimento não configurado." };
  }

  // Find the step with matching id
  const allSteps = [
    ...((fluxo.passosCronologicos || []) as Array<Record<string, unknown>>),
    ...((fluxo.passosExtras || []) as Array<Record<string, unknown>>),
  ];
  
  const step = allSteps.find((s) => s.id === stepId);
  if (!step || (!step.media && !(step.mediaVariations as unknown[] || []).length)) {
    console.log(`[AI Agent] Step "${stepId}" not found or has no media`);
    return { success: false, message: `Passo "${stepId}" não possui mídia anexada.` };
  }

  // Select media: if mediaVariations exists, pick random; otherwise use legacy media
  const variations = (step.mediaVariations || []) as Array<{ type: string; url: string; name?: string; audio_type?: string; audio_forward?: boolean }>;
  let media: { type: string; url: string; name?: string; audio_type?: string; audio_forward?: boolean };
  
  if (variations.length > 0) {
    const randomIndex = Math.floor(Math.random() * variations.length);
    media = variations[randomIndex];
    console.log(`[AI Agent] Anti-spam rotation: selected variation ${randomIndex + 1}/${variations.length} for step "${stepId}"`);
  } else {
    media = step.media as { type: string; url: string; name?: string; audio_type?: string; audio_forward?: boolean };
  }
  console.log(`[AI Agent] Found media: type=${media.type}, url=${media.url?.substring(0, 60)}`);

  // Get UazAPI credentials
  const uazapiUrl = Deno.env.get("UAZAPI_URL") || "";
  let uazapiToken = Deno.env.get("UAZAPI_TOKEN") || "";

  const { data: uazapiInstance } = await supabase
    .from("avivar_uazapi_instances")
    .select("instance_token, status")
    .eq("account_id", userId)
    .eq("status", "connected")
    .limit(1)
    .maybeSingle();

  if (uazapiInstance?.instance_token) {
    uazapiToken = uazapiInstance.instance_token;
  }

  if (!uazapiUrl || !uazapiToken) {
    return { success: false, message: "WhatsApp não está conectado para enviar mídia." };
  }

  let phone = leadPhone.replace(/\D/g, "");
  if (!phone.startsWith("55") && phone.length <= 11) {
    phone = `55${phone}`;
  }

  try {
    const apiUrl = `${uazapiUrl}/send/media`;
    let mediaPayload: Record<string, unknown>;

    if (media.type === "audio") {
      const uazapiType = media.audio_type === "ptt" ? "ptt" : "audio";
      mediaPayload = {
        number: phone,
        type: uazapiType,
        file: media.url,
        text: " ",
      };
      if (media.audio_forward && media.audio_type === "audio") {
        mediaPayload.forward = true;
      }
    } else {
      // image, video, document
      const typeMap: Record<string, string> = { image: "image", video: "video", document: "document" };
      mediaPayload = {
        number: phone,
        type: typeMap[media.type] || media.type,
        file: media.url,
        text: " ",
      };
    }

    console.log(`[AI Agent] Sending fluxo media: ${JSON.stringify(mediaPayload).substring(0, 200)}`);
    
    let response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "token": uazapiToken },
      body: JSON.stringify(mediaPayload),
    });

    // Fallback for PTT audio
    if (!response.ok && media.type === "audio" && media.audio_type === "ptt") {
      mediaPayload.type = "myaudio";
      response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "token": uazapiToken },
        body: JSON.stringify(mediaPayload),
      });
    }

    const responseText = await response.text();
    console.log(`[AI Agent] Fluxo media send response (${response.status}): ${responseText}`);

    if (!response.ok) {
      return { success: false, message: `Erro ao enviar mídia do fluxo: ${response.status}` };
    }

    // Log the sent media in conversation
    const { data: convData } = await supabase
      .from("crm_conversations")
      .select("account_id")
      .eq("id", conversationId)
      .single();

    await supabase.from("crm_messages").insert({
      conversation_id: conversationId,
      direction: "outbound",
      content: media.type === "audio" ? "🎤 Áudio do fluxo" : `📎 ${media.name || media.type}`,
      media_url: media.url,
      media_type: media.type,
      sent_at: new Date().toISOString(),
      is_ai_generated: true,
      account_id: convData?.account_id,
    });

    console.log(`[AI Agent] ✅ Fluxo media sent successfully`);
    return { success: true, message: `Mídia do passo "${stepId}" enviada com sucesso!` };
  } catch (error) {
    console.error("[AI Agent] Error sending fluxo media:", error);
    return { success: false, message: `Erro ao enviar mídia: ${(error as Error).message}` };
  }
}

// ============================================
// CHECKLIST AUTO-FILL
// ============================================

interface ChecklistField {
  field_key: string;
  field_label: string;
  field_type: string;
  options: string[] | null;
}

async function loadChecklistFields(
  supabase: AnySupabaseClient,
  accountId: string,
  kanbanId: string | null
): Promise<ChecklistField[]> {
  if (!kanbanId) return [];

  // Get all column IDs for this kanban
  const { data: columns } = await supabase
    .from("avivar_kanban_columns")
    .select("id")
    .eq("kanban_id", kanbanId);

  if (!columns?.length) return [];

  const columnIds = columns.map((c: { id: string }) => c.id);

  // Load checklist fields from all columns of this kanban
  const { data: fields, error } = await supabase
    .from("avivar_column_checklists")
    .select("field_key, field_label, field_type, options")
    .in("column_id", columnIds)
    .order("order_index");

  if (error || !fields?.length) return [];

  // Deduplicate by field_key
  const unique = new Map<string, ChecklistField>();
  for (const f of fields) {
    if (!unique.has(f.field_key)) {
      unique.set(f.field_key, {
        field_key: f.field_key,
        field_label: f.field_label,
        field_type: f.field_type,
        options: f.options as string[] | null,
      });
    }
  }

  console.log(`[AI Agent] Loaded ${unique.size} checklist fields for kanban ${kanbanId}`);
  return Array.from(unique.values());
}

function buildChecklistPromptSection(fields: ChecklistField[]): string {
  if (fields.length === 0) return "";

  const fieldLines = fields.map(f => {
    let desc = `- ${f.field_key} (${f.field_type}): "${f.field_label}"`;
    if (f.options && Array.isArray(f.options) && f.options.length > 0) {
      desc += ` [opções: ${f.options.join("|")}]`;
    }
    return desc;
  }).join("\n");

  return `
<checklist_campos>
## PREENCHIMENTO AUTOMÁTICO DO CHECKLIST DO LEAD

Você pode preencher os seguintes campos do checklist do lead usando a ferramenta "preencher_checklist":

${fieldLines}

REGRAS OBRIGATÓRIAS:
1. Sempre que o lead confirmar um dado que corresponde a um campo acima, preencha IMEDIATAMENTE usando preencher_checklist
2. Após create_appointment bem-sucedido, preencha automaticamente os campos de data/horário/procedimento se existirem
3. NÃO preencha campos com dados inventados - apenas dados CONFIRMADOS pelo lead na conversa
4. NÃO pergunte informações que já foram preenchidas no checklist
5. Você pode preencher múltiplos campos de uma vez: preencher_checklist({ campos: { "campo1": "valor1", "campo2": "valor2" } })
6. Para campos do tipo "select", use EXATAMENTE uma das opções listadas
7. Para campos do tipo "date", use formato YYYY-MM-DD
8. Para campos do tipo "checkbox", use true ou false
</checklist_campos>
`;
}

async function preencherChecklist(
  supabase: AnySupabaseClient,
  leadPhone: string,
  campos: Record<string, unknown>
): Promise<string> {
  console.log(`[AI Agent] Tool: preencher_checklist(${JSON.stringify(campos)})`);

  if (!campos || Object.keys(campos).length === 0) {
    return "Nenhum campo fornecido para preencher.";
  }

  // Find the lead by phone
  const { data: lead, error: leadError } = await supabase
    .from("avivar_kanban_leads")
    .select("id, custom_fields")
    .eq("phone", leadPhone)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (leadError || !lead) {
    console.error("[AI Agent] Lead not found for checklist:", leadError);
    return "Lead não encontrado para preencher checklist.";
  }

  // Merge with existing custom_fields
  const existingFields = (lead.custom_fields as Record<string, unknown>) || {};
  const mergedFields = { ...existingFields, ...campos };

  // Save back
  const { error: updateError } = await supabase
    .from("avivar_kanban_leads")
    .update({
      custom_fields: mergedFields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", lead.id);

  if (updateError) {
    console.error("[AI Agent] Error updating checklist:", updateError);
    return "Erro ao preencher checklist.";
  }

  const fieldNames = Object.keys(campos).join(", ");
  console.log(`[AI Agent] ✅ Checklist updated: ${fieldNames}`);
  return `Checklist atualizado: ${fieldNames}`;
}

// ============================================
// PROCESS TOOL CALLS
// ============================================

async function processToolCall(
  supabase: AnySupabaseClient,
  accountId: string,
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
      return await listAgendas(supabase, accountId);
    
    case "list_products":
      return await listProducts(supabase, accountId, toolArgs.category as string | undefined);
    
    case "search_knowledge_base":
      return await searchKnowledgeBase(supabase, accountId, null, toolArgs.query as string);
    
    case "get_available_slots":
      return await getAvailableSlots(
        supabase, 
        accountId, 
        toolArgs.agenda_name as string,
        toolArgs.date as string | undefined
      );

    case "check_slot":
      return await checkSlot(
        supabase,
        accountId,
        toolArgs.agenda_name as string,
        toolArgs.date as string,
        toolArgs.time as string
      );
    
    case "create_appointment":
      return await createAppointment(
        supabase,
        accountId,
        userId,
        leadId,
        conversationId,
        toolArgs.agenda_name as string,
        toolArgs.patient_name as string,
        patientPhone,
        toolArgs.date as string,
        toolArgs.time as string,
        toolArgs.service_type as string,
        toolArgs.notes as string | undefined,
        toolArgs.patient_email as string | undefined
      );
    
    case "reschedule_appointment":
      return await rescheduleAppointment(
        supabase,
        accountId,
        userId,
        leadId,
        conversationId,
        patientPhone,
        toolArgs.new_date as string,
        toolArgs.new_time as string,
        toolArgs.agenda_name as string | undefined
      );

    case "cancel_appointment":
      return await cancelAppointment(
        supabase,
        accountId,
        leadId,
        patientPhone,
        toolArgs.reason as string
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
        accountId,
        _agentId,
        conversationId,
        patientPhone,
        toolArgs.category as string,
        toolArgs.search_term as string | undefined
      );
      return result.message;
    }
    
    case "send_video": {
      const result = await sendVideo(
        supabase,
        accountId,
        _agentId,
        conversationId,
        patientPhone,
        toolArgs.category as string,
        toolArgs.search_term as string | undefined
      );
      return result.message;
    }
    
    case "send_fluxo_media": {
      const result = await sendFluxoMedia(
        supabase,
        accountId,
        _agentId,
        conversationId,
        patientPhone,
        toolArgs.step_id as string
      );
      return result.message;
    }
    
    case "preencher_checklist":
      return await preencherChecklist(
        supabase,
        patientPhone,
        toolArgs.campos as Record<string, unknown>
      );
    
    case "set_lead_language": {
      const lang = toolArgs.language as string;
      if (leadId && lang) {
        const { error: langErr } = await supabase
          .from("leads")
          .update({ language: lang })
          .eq("id", leadId);
        if (langErr) {
          console.error("[AI Agent] Error setting lead language:", langErr);
          return `Erro ao salvar idioma: ${langErr.message}`;
        }
        console.log(`[AI Agent] Lead language set to: ${lang}`);
        return `Idioma do lead salvo como: ${lang}`;
      }
      return "Lead não encontrado para salvar idioma.";
    }
    
    case "propose_slot":
      return await proposeSlot(
        supabase,
        accountId,
        userId,
        toolArgs.agenda_name as string,
        toolArgs.patient_name as string,
        toolArgs.date as string,
        toolArgs.time as string,
        toolArgs.service_type as string
      );

    default:
      return "Ferramenta não reconhecida.";
  }
}

// ============================================
// AGENT ROUTING - HYBRID SYSTEM
// ============================================

async function getRoutedAgent(
  supabase: AnySupabaseClient,
  accountId: string,
  leadStage: string,
  kanbanId: string | null
): Promise<RoutedAgent | null> {
  console.log(`[AI Agent] Routing for stage: ${leadStage}, kanban: ${kanbanId}, account: ${accountId}`);

  // Query agents directly by account_id for multi-tenant safety
  let query = supabase
    .from("avivar_agents")
    .select("*")
    .eq("account_id", accountId)
    .eq("is_active", true);

  const { data: allAgents, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("[AI Agent] Routing error:", error);
    return null;
  }

  if (allAgents && allAgents.length > 0) {
    // Try to find agent matching kanban/stage
    let matchedAgent = null;
    
    if (kanbanId) {
      matchedAgent = allAgents.find((a: any) => a.target_kanbans?.includes(kanbanId));
    }
    if (!matchedAgent) {
      matchedAgent = allAgents.find((a: any) => a.target_stages?.includes(leadStage));
    }
    if (!matchedAgent) {
      matchedAgent = allAgents[0]; // Fallback to first active agent
    }

    const agent = matchedAgent;
    console.log(`[AI Agent] Routed to: ${agent.name} (${agent.id})`);
    return {
      agent_id: agent.id,
      agent_name: agent.name,
      personality: agent.personality,
      ai_identity: agent.ai_identity,
      ai_instructions: agent.ai_instructions,
      ai_restrictions: agent.ai_restrictions,
      ai_objective: agent.ai_objective,
      tone_of_voice: agent.tone_of_voice,
      company_name: agent.company_name,
      professional_name: agent.professional_name,
      fluxo_atendimento: agent.fluxo_atendimento,
      services: agent.services || [],
      target_kanbans: agent.target_kanbans,
      target_stages: agent.target_stages
    };
  }

  return null;

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
  accountId: string
): Promise<KanbanColumnInfo[]> {
  console.log(`[AI Agent] Loading Kanban columns for account: ${accountId}`);

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
    .eq("account_id", accountId)
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
- Após create_appointment (com ✅) → mova para "${agendadoKey || "agendado"}"
- NUNCA mova para "${agendadoKey || "agendado"}" após propose_slot — só após create_appointment!
- NUNCA deixe de mover o lead quando usar essas ferramentas!

### REGRA CRÍTICA PÓS-CONFIRMAÇÃO (PRIORIDADE MÁXIMA):
- Quando create_appointment retornar "✅" (sucesso), o agendamento JÁ ESTÁ 100% CONFIRMADO E SALVO no sistema.
- ABSOLUTAMENTE PROIBIDO usar check_slot, get_available_slots ou qualquer verificação de disponibilidade após uma confirmação bem-sucedida.
- O horário reservado VAI APARECER COMO OCUPADO — isso é CORRETO e ESPERADO, pois acabou de ser reservado pelo próprio lead.
- Sua ÚNICA ação após o ✅: confirmar ao lead com os detalhes (data, horário, local) e mover para "${agendadoKey || "agendado"}".
- Se você re-verificar disponibilidade e disser ao lead que o horário está ocupado, você COMETEU UM ERRO GRAVE.
- NUNCA diga "o horário acabou de ser preenchido" ou "não está mais disponível" após um create_appointment bem-sucedido.
- NUNCA pergunte "Posso confirmar o agendamento?" após create_appointment — o agendamento JÁ ESTÁ CONFIRMADO.
- Se o lead responder "sim" ou "confirma" após o agendamento já ter sido confirmado, apenas agradeça e reforce os detalhes — NÃO tente criar outro agendamento.

### REGRA CRÍTICA DE REAGENDAMENTO:
- Se o lead pedir para REMARCAR, MUDAR ou REAGENDAR um agendamento existente, use SEMPRE reschedule_appointment.
- NUNCA use create_appointment para reagendamento — isso cria duplicatas!
- reschedule_appointment ATUALIZA o agendamento existente (mesma entrada no banco e no Google Calendar)
- NUNCA crie um novo agendamento quando o lead já tem um ativo — sempre reagende!`;
  return instructions;
}

// ============================================
// BUILD SYSTEM PROMPT - HYBRID (stage-based agent + full access)
// ============================================

function buildHybridSystemPrompt(
  agent: RoutedAgent, 
  leadStage: string,
  dynamicMovementInstructions: string,
  fluxoInstructions: string,
  checklistInstructions: string = "",
  leadLanguage: string = "pt-BR"
): string {
  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-BR", { 
    weekday: "long", 
    day: "2-digit", 
    month: "long", 
    year: "numeric",
    timeZone: "America/Sao_Paulo"
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
- propose_slot: VALIDAR um horário (SEM criar registro no banco) — use SEMPRE antes de create_appointment
- create_appointment: Criar agendamento DEFINITIVO — use SOMENTE após o lead confirmar a proposta do propose_slot
- reschedule_appointment: Reagendar um agendamento existente (SEMPRE use quando o lead já tem agendamento ativo)
- cancel_appointment: Cancelar/remover agendamento ativo do lead (remove do CRM e do Google Calendar)
- transfer_to_human: Transferir para humano
- mover_lead_para_etapa: Mover o lead no funil de vendas conforme o progresso da conversa
- send_fluxo_media: Enviar mídia (áudio, imagem, vídeo, documento) anexada a um passo do fluxo
- send_image: Enviar imagem da galeria do agente
- send_video: Enviar vídeo da galeria do agente
- preencher_checklist: Preencher campos do checklist/ficha do lead com dados confirmados na conversa
- set_lead_language: Salvar o idioma detectado do lead (use na primeira mensagem)

<regra_critica_midia_fluxo>
## PROIBIÇÃO ABSOLUTA SOBRE MÍDIAS DO FLUXO
Quando um passo do fluxo tiver mídia anexada, você DEVE:
1. Chamar send_fluxo_media(step_id="...") como tool call
2. NÃO escrever NADA sobre a mídia no seu texto de resposta

Textos TERMINANTEMENTE PROIBIDOS na sua resposta:
- "Vídeo do fluxo"
- "Áudio do fluxo"  
- "Imagem do fluxo"
- "Documento do fluxo"
- "📎 ..."
- "Segue o vídeo/áudio/documento"
- "Vou enviar um vídeo/áudio"
- Qualquer menção ao arquivo, nome do arquivo, ou tipo de mídia

A mídia é enviada SILENCIOSAMENTE pela ferramenta. Sua resposta de texto deve ser APENAS a mensagem conversacional, como se a mídia não existisse.
Se você escrever qualquer texto mencionando a mídia, você FALHOU COMPLETAMENTE na tarefa.
</regra_critica_midia_fluxo>

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

### CONFIRMAÇÃO FINAL (FLUXO OBRIGATÓRIO DE 2 ETAPAS — SEM PRÉ-RESERVA):
1. Quando o lead aceitar um horário, use propose_slot para VALIDAR (SEM criar registro no banco)
2. Apresente os detalhes e pergunte: "Posso confirmar sua avaliação para [data] às [horário]?"
3. SOMENTE quando o lead disser "sim/confirma/pode marcar" na PRÓXIMA MENSAGEM → use create_appointment COM OS MESMOS DADOS da proposta
4. Se o lead disser "não" ou quiser outro horário → busque novo horário com get_available_slots (nada no banco para cancelar)
5. NUNCA use create_appointment diretamente sem propose_slot primeiro
6. NUNCA use propose_slot E create_appointment no MESMO turno — são SEMPRE em turnos separados
7. Após create_appointment retornar "✅", o agendamento está DEFINITIVAMENTE confirmado — apresente como fato consumado

### REGRA CRÍTICA — QUANDO O LEAD CONFIRMA:
- Se o lead responder "sim", "pode", "confirma", "ok" ou similar APÓS você ter apresentado detalhes de agendamento (Data/Horário/Local):
  → Você DEVE chamar create_appointment IMEDIATAMENTE com os dados da proposta
  → NÃO responda "confirmado" sem chamar a ferramenta — o agendamento NÃO EXISTE até create_appointment ser executado
  → NÃO use propose_slot novamente — a proposta já foi apresentada e aceita
  → Se responder sem chamar create_appointment, o agendamento NÃO será criado no sistema

### REAGENDAMENTO (REGRA CRÍTICA):
- Se o lead JÁ TEM um agendamento ativo (status scheduled ou confirmed) e pede para REMARCAR/REAGENDAR para outra data ou horário:
  - Use OBRIGATORIAMENTE reschedule_appointment (em vez de reserve_slot ou create_appointment)
  - reschedule_appointment ATUALIZA o agendamento existente (mesma entrada no banco e no Google Calendar)
  - NUNCA crie um novo agendamento quando o lead já tem um ativo — sempre reagende!

### CANCELAMENTO (REGRA CRÍTICA):
- Se o lead pedir para CANCELAR, DESMARCAR, ou informar que NÃO VAI MAIS (ex: "fechei com outra clínica", "não quero mais", "desisto"):
  - Use OBRIGATORIAMENTE cancel_appointment com o motivo informado
  - cancel_appointment CANCELA o agendamento no CRM e REMOVE do Google Calendar automaticamente
  - SEMPRE use cancel_appointment antes de se despedir — nunca apenas diga que vai cancelar sem executar a ferramenta!
  - Após cancelar, mova o lead para a etapa apropriada (ex: desqualificado, perdido, etc.)
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

FORMATO DE DATA: NUNCA use formato americano MM/DD/YYYY. Use DD/MM/AAAA ou por extenso natural no idioma do lead.
FORMATO DE HORÁRIO: Apresente horários de forma natural no idioma do lead. As ferramentas internas usam formato HH:mm mas você deve adaptar para o lead (ex: "14h30" em português, "2:30 PM" em inglês, "14:30" em espanhol).
</formatacao_obrigatoria>

<idioma_obrigatorio>
${leadLanguage === "pt-BR" ? `REGRA ABSOLUTA: Responda SEMPRE em Português Brasileiro (pt-BR).
- Se o lead escrever em outro idioma, detecte o idioma e use set_lead_language para salvar. Depois, responda no idioma do lead.` : `REGRA ABSOLUTA: O idioma preferido deste lead é "${leadLanguage}". Responda SEMPRE neste idioma.
- Todas as mensagens, confirmações de agendamento, orientações e despedidas DEVEM ser no idioma "${leadLanguage}".
- Se o lead mudar de idioma, use set_lead_language para atualizar e responda no novo idioma.`}
- Na PRIMEIRA mensagem de qualquer lead, detecte o idioma e use set_lead_language para registrar.
- Use internamente as ferramentas em português (nomes das ferramentas não mudam), mas responda ao lead no idioma dele.
</idioma_obrigatorio>

${fluxoInstructions}

${checklistInstructions}

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
    id?: string;
    ordem: number;
    titulo: string;
    descricao: string;
    exemploMensagem?: string;
    media?: { type: string; url: string; name?: string; audio_type?: string; audio_forward?: boolean };
    mediaVariations?: Array<{ type: string; url: string; name?: string; audio_type?: string; audio_forward?: boolean }>;
  }>;
  
  const passosExtras = (fluxo.passosExtras || []) as Array<{
    id?: string;
    ordem: number;
    titulo: string;
    descricao: string;
    exemploMensagem?: string;
    media?: { type: string; url: string; name?: string; audio_type?: string; audio_forward?: boolean };
  }>;
  
  if (passosCronologicos.length === 0) return '';
  
  // Collect all steps with media for the summary rule
  const hasMedia = (p: typeof passosCronologicos[0]) => p.media || (p.mediaVariations && p.mediaVariations.length > 0);
  const getMediaType = (p: typeof passosCronologicos[0]) => {
    if (p.mediaVariations && p.mediaVariations.length > 0) return `${p.mediaVariations[0].type} (${p.mediaVariations.length} variações)`;
    return p.media!.type;
  };

  const stepsWithMedia = passosCronologicos
    .filter(hasMedia)
    .map(p => `- Passo "${p.id}": send_fluxo_media(step_id="${p.id}") → ${getMediaType(p)}`)
    .join('\n');
  
  const extraStepsWithMedia = passosExtras
    .filter(hasMedia)
    .map(p => `- Passo "${p.id}": send_fluxo_media(step_id="${p.id}") → ${getMediaType(p)}`)
    .join('\n');
  
  const allMediaSteps = [stepsWithMedia, extraStepsWithMedia].filter(Boolean).join('\n');
  
  let instructions = `<fluxo_de_atendimento>
## PASSOS DO ATENDIMENTO (siga na ordem):

**🚫 REGRA CRÍTICA — UM PASSO POR VEZ:**
Você DEVE executar APENAS UM passo do fluxo por resposta. NUNCA avance múltiplos passos de uma só vez.
- Analise o histórico da conversa para determinar em qual passo o atendimento está
- Execute SOMENTE o próximo passo pendente
- AGUARDE a resposta do lead antes de avançar para o passo seguinte
- Se o passo atual tiver mídia, envie APENAS a mídia desse passo (nunca de outros passos)
- MÁXIMO 1 chamada de send_fluxo_media por resposta (NUNCA 2 ou mais)
- Exemplo: se o lead respondeu ao passo 2 (interesse), execute APENAS o passo 3 (qualificação). NÃO pule para o passo 4 ou 5
- PROIBIDO: Enviar mídia de um passo + texto de outro passo na mesma resposta
- Se o passo tem mídia E texto, envie ambos, mas APENAS do passo atual

**⚠️ REGRA ANTI-SPAM OBRIGATÓRIA — VARIAÇÃO DE MENSAGENS:**
Os exemplos fornecidos são REFERÊNCIAS DE INTENÇÃO, NUNCA textos para copiar. Para CADA mensagem que você enviar:
1. ENTENDA o objetivo/intenção do exemplo (ex: se apresentar, pedir nome, confirmar horário)
2. REESCREVA completamente usando suas próprias palavras, mantendo APENAS o objetivo
3. VARIE a estrutura da frase (comece de forma diferente a cada conversa)
4. USE sinônimos e expressões equivalentes (ex: "Olá" → "Oi", "E aí", "Hey"; "faço parte" → "sou da equipe", "trabalho com", "atuo junto")
5. MUDE a ordem das informações quando possível
6. ADAPTE ao tom da conversa em andamento
7. NUNCA repita a mesma frase em conversas diferentes — o WhatsApp detecta mensagens idênticas como SPAM

❌ PROIBIDO: Copiar o exemplo palavra por palavra
❌ PROIBIDO: Usar a mesma frase de abertura em todas as conversas
✅ OBRIGATÓRIO: Cada conversa deve ter uma versão única e natural da mensagem
✅ OBRIGATÓRIO: Manter INTACTOS todos os dados factuais — NUNCA altere, invente ou substitua:
   • Nomes (empresa, médico, atendente, paciente)
   • Endereços, cidades, estados
   • Datas, horários, duração de consulta
   • Preços, valores, formas de pagamento
   • CRM, Instagram, telefones, links
   • Nomes de procedimentos e serviços
   → Apenas VARIE as palavras ao redor desses dados, nunca os dados em si

**REGRA CRÍTICA DE SEPARAÇÃO DE MENSAGENS:**
Quando o exemplo de mensagem contiver o marcador "---", isso indica que a IA DEVE enviar como MENSAGENS SEPARADAS no WhatsApp.
- O texto ANTES do "---" deve ser uma mensagem
- O texto DEPOIS do "---" deve ser OUTRA mensagem separada
- Use exatamente uma linha vazia dupla (dois \\n\\n) no seu texto para separar as partes que devem ser enviadas como mensagens diferentes
- Exemplo: se o template diz "Olá! Eu sou a Ana.---Qual seu nome?", você deve responder com duas mensagens separadas por \\n\\n
- Cada "---" no template = um ponto de quebra obrigatório na sua resposta (use \\n\\n para separar)
- NUNCA junte em uma única mensagem o que o template separou com "---"

${allMediaSteps ? `## ⚠️ REGRA OBRIGATÓRIA DE MÍDIA (respeite a regra de UM PASSO POR VEZ)
Quando estiver no passo correspondente, inclua a tool call send_fluxo_media. Mas APENAS UMA por resposta — a do passo atual.
A mídia é enviada SILENCIOSAMENTE — NUNCA escreva "Vídeo do fluxo", "Áudio do fluxo", nome do arquivo ou qualquer referência à mídia no texto.
⚠️ MÁXIMO 1 send_fluxo_media POR RESPOSTA. Se você chamar 2 ou mais, você FALHOU na tarefa.
${allMediaSteps}
` : ''}
`;
  
  for (const passo of passosCronologicos) {
    const stepHasMedia = passo.media || (passo.mediaVariations && passo.mediaVariations.length > 0);
    const mediaName = passo.mediaVariations?.length ? passo.mediaVariations[0].type : (passo.media?.name || passo.media?.type || '');
    const mediaInstruction = stepHasMedia 
      ? `\n⚠️ **TOOL CALL OBRIGATÓRIA**: Inclua send_fluxo_media(step_id="${passo.id}") na sua resposta. PROIBIDO escrever "${mediaName}", "Vídeo do fluxo", "Áudio do fluxo" ou qualquer referência à mídia no texto.`
      : '';
    instructions += `### PASSO ${passo.ordem}: ${passo.titulo.toUpperCase()}
${passo.descricao}
${passo.exemploMensagem ? `📝 Referência de intenção (REESCREVA com suas palavras, NÃO copie): "${passo.exemploMensagem}"` : ''}${mediaInstruction}

`;
  }
  
  if (passosExtras.length > 0) {
    instructions += `## PASSOS EXTRAS (quando necessário):

`;
    for (const passo of passosExtras) {
      const extraHasMedia = passo.media || (passo.mediaVariations && passo.mediaVariations.length > 0);
      const mediaInstruction = extraHasMedia 
        ? `\n⚠️ **TOOL CALL OBRIGATÓRIA**: Inclua send_fluxo_media(step_id="${passo.id}") na sua resposta. PROIBIDO mencionar a mídia no texto.`
        : '';
      instructions += `### ${passo.titulo.toUpperCase()}
${passo.descricao}
${passo.exemploMensagem ? `📝 Referência de intenção (REESCREVA com suas palavras, NÃO copie): "${passo.exemploMensagem}"` : ''}${mediaInstruction}

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
  // First try splitting by double line breaks (paragraph breaks - AI should use this)
  let parts = content
    .split(/\n\n+/)
    .map(part => part.trim())
    .filter(part => part.length > 0);
  
  // If only 1 part found, also try splitting by "---" separator (user-defined splits)
  if (parts.length <= 1) {
    parts = content
      .split(/---+/)
      .map(part => part.trim())
      .filter(part => part.length > 0);
  }
  
  // If still no splits found, return original content
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

    // CRITICAL: Resolve account_id from conversation for multi-tenant isolation
    let accountId: string | null = null;
    const { data: convAccountData } = await supabase
      .from("crm_conversations")
      .select("account_id")
      .eq("id", conversationId)
      .single();
    accountId = convAccountData?.account_id || null;

    // Fallback: resolve from user's membership
    if (!accountId) {
      const { data: memberData } = await supabase
        .from("avivar_account_members")
        .select("account_id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      accountId = memberData?.account_id || null;
    }

    console.log(`[AI Agent] Resolved accountId: ${accountId} for userId: ${userId}`);

    // 1. Get lead stage and kanban for hybrid routing (based on Kanban position)
    const { stage: leadStage, kanbanId } = await getLeadStage(supabase, conversationId, leadPhone);
    console.log(`[AI Agent] Lead stage: ${leadStage}, kanban: ${kanbanId}`);

    // 2. Get routed agent based on kanban ID + stage (HYBRID ROUTING)
    let routedAgent = await getRoutedAgent(supabase, accountId || userId, leadStage, kanbanId);
    
    // If no agent configured, use a default fallback agent
    if (!routedAgent) {
      console.log("[AI Agent] No agent configured, using default fallback agent");
      routedAgent = {
        agent_id: "default-fallback",
        agent_name: "Assistente Virtual",
        personality: "cordial e profissional",
        ai_identity: "Você é um assistente virtual de atendimento. Seja cordial, profissional e ajude o cliente com suas dúvidas.",
        ai_instructions: "Responda de forma clara e objetiva. Pergunte como pode ajudar se não souber a intenção do cliente.",
        ai_restrictions: "Não forneça diagnósticos médicos. Não faça promessas que não pode cumprir.",
        ai_objective: "Ajudar o cliente com suas dúvidas e direcionar para o próximo passo.",
        tone_of_voice: "cordial",
        company_name: null,
        professional_name: null,
        fluxo_atendimento: null,
        services: [],
        target_kanbans: null,
        target_stages: null
      };
    }

    console.log(`[AI Agent] Using agent: ${routedAgent.agent_name} for stage ${leadStage}`);

    // 3. Load dynamic Kanban columns for this account
    const kanbanColumns = await getKanbanColumnsForUser(supabase, accountId || userId);
    const dynamicMovementInstructions = buildDynamicMovementInstructions(kanbanColumns);

    // 3.5 Build fluxo de atendimento instructions from agent config
    const fluxoInstructions = buildFluxoInstructions(routedAgent.fluxo_atendimento);

    // 3.6 Load checklist fields dynamically for this kanban
    const checklistFields = await loadChecklistFields(supabase, accountId || userId, kanbanId);
    const checklistInstructions = buildChecklistPromptSection(checklistFields);

    // 4.5 Get lead ID for appointment linking (needed before building prompt for language)
    const leadId = await getLeadId(supabase, conversationId);

    // 4.6 Load lead language preference
    let leadLanguage = "pt-BR";
    if (leadId) {
      const { data: leadLangData } = await supabase
        .from("leads")
        .select("language")
        .eq("id", leadId)
        .single();
      if (leadLangData?.language) {
        leadLanguage = leadLangData.language;
      }
    }
    console.log(`[AI Agent] Lead language: ${leadLanguage}`);

    // 4. Build hybrid system prompt (agent personality + dynamic Kanban structure + custom flow + checklist + language)
    const systemPrompt = buildHybridSystemPrompt(routedAgent, leadStage, dynamicMovementInstructions, fluxoInstructions, checklistInstructions, leadLanguage);

    // 4.7 Get conversation history
    const conversationHistory = await getConversationHistory(supabase, conversationId);

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

    // 5.8 CRITICAL: Check for recent confirmed appointment in this conversation
    let appointmentJustCreated = false;
    if (conversationId) {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      // Check for confirmed appointments (scheduled status)
      const { data: recentAppointment } = await supabase
        .from("avivar_appointments")
        .select("id, created_at, patient_name, start_time, appointment_date, status")
        .eq("conversation_id", conversationId)
        .gte("created_at", thirtyMinutesAgo)
        .eq("status", "scheduled")
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (recentAppointment && recentAppointment.length > 0) {
        appointmentJustCreated = true;
        console.log(`[AI Agent] 🔒 CROSS-INVOCATION GUARD: Recent confirmed appointment (${recentAppointment[0].id}) found. Blocking scheduling tools.`);
      }
    }

    // 5.9 CRITICAL: Detect pending slot proposal — lead may be confirming
    // If the AI previously asked "Posso confirmar?" and the lead responded affirmatively,
    // inject a strong instruction to call create_appointment immediately
    let pendingProposalDetected = false;
    const confirmPatterns = /^(sim|pode|confirma|confirmar|pode sim|pode marcar|ok|tá bom|ta bom|quero|vamos|bora|marca|por favor|claro|com certeza|isso|positivo|afirmativo|s|ss|sss|pode ser)\s*[!.?]*$/i;
    const lastUserMessage = messageContent.trim();
    
    if (!appointmentJustCreated && confirmPatterns.test(lastUserMessage)) {
      // Check if recent assistant messages contain a proposal
      const recentAssistantMessages = conversationHistory
        .filter(m => m.role === "assistant" && typeof m.content === "string")
        .slice(-5);
      
      const hasProposal = recentAssistantMessages.some(m => {
        const content = typeof m.content === "string" ? m.content : "";
        return (
          content.includes("Posso confirmar") ||
          content.includes("posso confirmar") ||
          content.includes("Confirmando os detalhes") ||
          content.includes("confirmar o agendamento") ||
          content.includes("confirmar sua avaliação") ||
          content.includes("confirmar sua consulta") ||
          (content.includes("Data:") && content.includes("Horário:"))
        );
      });
      
      if (hasProposal) {
        pendingProposalDetected = true;
        console.log(`[AI Agent] 📋 PENDING PROPOSAL DETECTED: Lead confirmed ("${lastUserMessage}") after a proposal was presented. Will instruct AI to call create_appointment.`);
      }
    }

    // 6. Call AI with tools (context-aware tool filtering)
    let effectiveSystemPrompt = systemPrompt;
    let effectiveTools = TOOLS;

    if (appointmentJustCreated) {
      // Confirmed appointment exists — block all scheduling tools
      effectiveSystemPrompt = systemPrompt + "\n\n⚠️ INSTRUÇÃO CRÍTICA: O agendamento ACABOU DE SER CONFIRMADO COM SUCESSO nesta conversa. O horário JÁ ESTÁ RESERVADO para este paciente. NÃO use check_slot, get_available_slots, propose_slot, create_appointment ou qualquer ferramenta de verificação/criação. Responda de forma amigável confirmando os detalhes.";
      effectiveTools = TOOLS.filter((t: { function: { name: string } }) => !["check_slot", "get_available_slots", "create_appointment", "propose_slot"].includes(t.function.name));
    } else if (pendingProposalDetected) {
      // Lead just confirmed a proposal — FORCE the AI to call create_appointment
      effectiveSystemPrompt = systemPrompt + `\n\n⚠️ INSTRUÇÃO CRÍTICA OBRIGATÓRIA: O lead ACABOU DE CONFIRMAR ("${lastUserMessage}") uma proposta de agendamento que você apresentou anteriormente. Você DEVE chamar a ferramenta create_appointment AGORA com os mesmos dados (data, horário, paciente, tipo de consulta) que foram apresentados na proposta. NÃO responda com texto de confirmação sem antes chamar create_appointment. NÃO use propose_slot novamente — a proposta já foi feita e aceita. Use create_appointment IMEDIATAMENTE.`;
      console.log(`[AI Agent] 🎯 Injected FORCE create_appointment instruction into system prompt`);
    }

    let aiResult: { content: string | null; toolCalls: Array<{ name: string; arguments: Record<string, unknown> }> };
    
    try {
      aiResult = await callAIWithTools(effectiveSystemPrompt, conversationHistory, effectiveTools);
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

    // 7. Process tool calls in a loop (supports sequential tool calls like list_agendas → get_available_slots)
    let finalResponse = aiResult.content || "";
    let currentToolCalls = aiResult.toolCalls;
    let accumulatedMessages = [...conversationHistory];
    const MAX_TOOL_ROUNDS = 5;
    let toolRound = 0;
    let fluxoMediaSentCount = 0; // Guard: max 1 send_fluxo_media per response
    let proposeSlotCalledThisTurn = false; // Guard: block create_appointment if propose_slot called same turn
    // appointmentJustCreated is already set above (section 5.8)

    while (currentToolCalls.length > 0 && toolRound < MAX_TOOL_ROUNDS) {
      toolRound++;
      
      // Filter out excess send_fluxo_media calls (max 1 per response)
      const filteredToolCalls = currentToolCalls.filter(tc => {
        if (tc.name === "send_fluxo_media") {
          if (fluxoMediaSentCount >= 1) {
            console.log(`[AI Agent] ⚠️ BLOCKED extra send_fluxo_media (already sent ${fluxoMediaSentCount}). Skipping step_id="${(tc.arguments as Record<string, unknown>).step_id}"`);
            return false;
          }
          fluxoMediaSentCount++;
        }
        // CRITICAL: Block slot re-checks after a successful booking to prevent false "unavailable" messages
        if (appointmentJustCreated && (tc.name === "check_slot" || tc.name === "get_available_slots")) {
          console.log(`[AI Agent] ⚠️ BLOCKED ${tc.name} after successful create_appointment — slot was just booked`);
          return false;
        }
        // CRITICAL: Block create_appointment if propose_slot was called in same turn
        if (proposeSlotCalledThisTurn && tc.name === "create_appointment") {
          console.log(`[AI Agent] ⚠️ BLOCKED create_appointment in same turn as propose_slot — must wait for lead confirmation`);
          return false;
        }
        // Track propose_slot calls
        if (tc.name === "propose_slot") {
          proposeSlotCalledThisTurn = true;
        }
        return true;
      });

      console.log(`[AI Agent] Processing ${filteredToolCalls.length} tool call(s) (round ${toolRound})${currentToolCalls.length !== filteredToolCalls.length ? ` [${currentToolCalls.length - filteredToolCalls.length} blocked]` : ''}`);
      
      const toolResults: Array<{ role: string; name?: string; content: string }> = [];
      
      for (const toolCall of filteredToolCalls) {
        const result = await processToolCall(
          supabase,
          accountId || userId,
          userId,
          routedAgent.agent_id,
          leadId,
          conversationId,
          leadPhone,
          toolCall.name,
          toolCall.arguments
        );
        
        console.log(`[AI Agent] Tool ${toolCall.name} result: ${result.substring(0, 100)}...`);
        
        // Mark that appointment was successfully created to prevent re-checking slots
        if ((toolCall.name === "create_appointment" || toolCall.name === "reschedule_appointment") && result.includes("✅")) {
          appointmentJustCreated = true;
          console.log(`[AI Agent] 🔒 Appointment confirmed/created/rescheduled — blocking future slot re-checks in this response`);
        }
        
        toolResults.push({
          role: "tool",
          name: toolCall.name,
          content: result
        });
      }

      // Build messages for the follow-up call
      const followUpMessages = [
        ...accumulatedMessages,
        { role: "assistant", content: finalResponse || "" },
        ...toolResults.map(tr => ({ role: "tool" as const, content: `[${tr.name}]: ${tr.content}` }))
      ];

      // Call AI again WITH tools so it can make further tool calls if needed (with retry for 429)
      let followUpResponse: Response | null = null;
      for (let retryAttempt = 0; retryAttempt < 3; retryAttempt++) {
        if (retryAttempt > 0) {
          const backoff = retryAttempt * 2000;
          console.log(`[AI Agent] Follow-up retry ${retryAttempt}/2 after ${backoff}ms...`);
          await new Promise(r => setTimeout(r, backoff));
        }
        followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: effectiveSystemPrompt },
              ...followUpMessages.map(m => ({ role: m.role === "tool" ? "user" : m.role, content: m.content }))
            ],
            tools: effectiveTools,
            tool_choice: "auto",
            max_tokens: 500,
            temperature: 0.7,
          }),
        });
        if (followUpResponse.ok || followUpResponse.status !== 429) break;
        console.warn(`[AI Agent] Follow-up got 429, retrying...`);
      }

      if (followUpResponse && followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        const followUpChoice = followUpData.choices?.[0];
        finalResponse = followUpChoice?.message?.content || finalResponse;

        // Check if AI wants to make more tool calls
        const newToolCalls = followUpChoice?.message?.tool_calls?.map((tc: { function: { name: string; arguments: string } }) => {
          try {
            return { name: tc.function.name, arguments: JSON.parse(tc.function.arguments) };
          } catch { return null; }
        }).filter(Boolean) || [];

        // Update accumulated messages for the next round
        accumulatedMessages = followUpMessages;
        currentToolCalls = newToolCalls;
      } else {
        console.error(`[AI Agent] Follow-up AI call failed: ${followUpResponse?.status}`);
        currentToolCalls = []; // Stop loop
      }
    }

    if (toolRound >= MAX_TOOL_ROUNDS && (!finalResponse || finalResponse.trim() === "")) {
      console.warn(`[AI Agent] Reached max tool rounds (${MAX_TOOL_ROUNDS}) without text response. Making final call WITHOUT tools...`);
      
      // Make one final AI call WITHOUT tools to force a text response
      try {
        const finalCallResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt + "\n\nIMPORTANTE: Responda ao cliente agora com uma mensagem de texto. NÃO chame nenhuma ferramenta. Use as informações que já foram coletadas para dar uma resposta útil." },
              ...accumulatedMessages.map(m => ({ role: m.role === "tool" ? "user" : m.role, content: m.content }))
            ],
            max_tokens: 500,
            temperature: 0.7,
          }),
        });
        
        if (finalCallResponse.ok) {
          const finalCallData = await finalCallResponse.json();
          const forcedContent = finalCallData.choices?.[0]?.message?.content;
          if (forcedContent && forcedContent.trim()) {
            finalResponse = forcedContent;
            console.log(`[AI Agent] Forced text response obtained: ${finalResponse.substring(0, 80)}...`);
          }
        }
      } catch (e) {
        console.error(`[AI Agent] Final forced call failed:`, e);
      }
    }

    if (!finalResponse || finalResponse.trim() === "") {
      finalResponse = "Desculpe, não consegui processar sua mensagem. Pode repetir?";
    }

    // 8. Clean up tool call artifacts, markdown formatting and emojis before sending
    // Remove any raw tool call strings the AI wrote in text (e.g. [send_fluxo_media(step_id="...")])
    finalResponse = finalResponse.replace(/INSTRUÇÃO INTERNA:.*$/gm, "");
    finalResponse = finalResponse.replace(/AGENDAMENTO CRIADO COM SUCESSO.*?!/g, "");
    finalResponse = finalResponse.replace(/NÃO RE-VERIFIQUE DISPONIBILIDADE!?/g, "");
    finalResponse = finalResponse.replace(/\[?\b(preencher_checklist|send_fluxo_media|send_image|send_video|mover_lead_para_etapa|transfer_to_human|get_available_slots|create_appointment|reschedule_appointment|cancel_appointment|list_agendas|search_knowledge_base|list_products|propose_slot)\s*\([^\)]*\)\]?/g, "");
    // Also remove bracket-style tool calls like [tool_name(...)]
    finalResponse = finalResponse.replace(/\[\w+\([^\]]*\)\]/g, "");
    // Remove bracket-colon-JSON format: [tool_name]: { ... }
    finalResponse = finalResponse.replace(/\[\w+\]\s*:\s*\{[^}]*\}/g, "");
    // Remove bracket tool name with any trailing content on same line: [tool_name]...
    finalResponse = finalResponse.replace(/\[(?:preencher_checklist|send_fluxo_media|send_image|send_video|mover_lead_para_etapa|transfer_to_human|get_available_slots|create_appointment|reschedule_appointment|cancel_appointment|list_agendas|search_knowledge_base|list_products|check_slot|propose_slot)\][^\n]*/g, "");

    // Layer 1: Remove JSON-style tool_calls blocks
    finalResponse = finalResponse.replace(
      /\{\s*"tool_calls"\s*:\s*\[[\s\S]*?\]\s*\}/g, ""
    );
    // Remove individual function call objects with "id": "call_..."
    finalResponse = finalResponse.replace(
      /\{\s*"id"\s*:\s*"call_[^"]*"[\s\S]*?"function"\s*:\s*\{[\s\S]*?\}\s*\}/g, ""
    );

    // Layer 2: Remove any JSON block containing known tool names
    const toolNames = [
      'preencher_checklist', 'send_fluxo_media', 'send_image', 'send_video',
      'mover_lead_para_etapa', 'transfer_to_human', 'get_available_slots',
      'create_appointment', 'reschedule_appointment', 'cancel_appointment',
      'list_agendas', 'search_knowledge_base', 'list_products', 'check_slot',
      'propose_slot'
    ];
    const toolPattern = toolNames.join('|');
    const jsonToolRegex = new RegExp(
      `\\{[^{}]*(?:${toolPattern})[^{}]*\\}`, 'g'
    );
    finalResponse = finalResponse.replace(jsonToolRegex, "");

    finalResponse = finalResponse.replace(/\*+/g, "");
    // Remove emojis (Unicode ranges for common emoji characters)
    finalResponse = finalResponse.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu, "");
    // Clean up double spaces and empty lines left by cleanup
    finalResponse = finalResponse.replace(/  +/g, " ").replace(/\n\s*\n\s*\n/g, "\n\n").trim();

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
