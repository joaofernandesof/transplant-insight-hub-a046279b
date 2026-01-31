import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-uazapi-token",
};

/**
 * UazAPI Webhook Handler
 * Recebe eventos de mensagens do WhatsApp via UazAPI e sincroniza com o CRM Avivar
 * 
 * Eventos suportados:
 * - messages.upsert: Nova mensagem recebida/enviada
 * - connection.update: Atualização de status da conexão
 * - contacts.update: Atualização de contatos
 */

interface UazAPIMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  pushName?: string;
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      url?: string;
      caption?: string;
      mimetype?: string;
    };
    audioMessage?: {
      url?: string;
      mimetype?: string;
    };
    videoMessage?: {
      url?: string;
      caption?: string;
      mimetype?: string;
    };
    documentMessage?: {
      url?: string;
      fileName?: string;
      mimetype?: string;
    };
  };
  messageTimestamp?: number | string;
  status?: number;
}

interface UazAPIPayload {
  event: string;
  instance?: string;
  instanceName?: string;
  data?: {
    key?: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: UazAPIMessage["message"];
    messageTimestamp?: number | string;
    status?: number;
    messages?: UazAPIMessage[];
    state?: string;
    contact?: {
      id: string;
      name: string;
      notify?: string;
      imgUrl?: string;
    };
  };
  // Formato alternativo (direto)
  messages?: UazAPIMessage[];
  key?: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  pushName?: string;
  message?: UazAPIMessage["message"] | UazAPINativeMessage;
  messageTimestamp?: number | string;
  // UazAPI native format fields
  EventType?: string;
  chat?: {
    wa_name?: string;
    name?: string;
    phone?: string;
    wa_chatid?: string;
  };
  owner?: string;
  token?: string;
}

// UazAPI native message format
interface UazAPINativeMessage {
  chatid: string;
  fromMe: boolean;
  id: string;
  messageid?: string;
  text?: string;
  content?: { text?: string };
  senderName?: string;
  messageTimestamp?: number;
  messageType?: string;
  mediaType?: string;
  isGroup?: boolean;
  groupName?: string;
}

// Extract phone number from JID
function extractPhone(jid: string): string {
  if (!jid) return "";
  // Remove @s.whatsapp.net, @g.us, etc.
  const phone = jid.split("@")[0];
  // Remove any suffix like :0, :1
  return phone.split(":")[0];
}

function normalizePhone(value: string): string {
  if (!value) return "";
  return value.replace(/\D/g, "");
}

// Check if JID is a group
function isGroup(jid: string): boolean {
  return jid?.includes("@g.us") || false;
}

function mapAvivarTipoMensagem(mediaType: string | null): string {
  // public.avivar_mensagens has a CHECK constraint allowing only these values
  const allowed = new Set(["text", "image", "audio", "video", "document", "sticker", "location"]);
  if (!mediaType) return "text";
  return allowed.has(mediaType) ? mediaType : "text";
}

function mapCrmMediaType(mediaType: string | null): string | null {
  // public.crm_messages has a CHECK constraint allowing only these values (or NULL)
  const allowed = new Set(["image", "video", "audio", "document"]);
  if (!mediaType) return null;
  return allowed.has(mediaType) ? mediaType : null;
}

// Extract message content from UazAPI message format
function extractMessageContent(message: UazAPIMessage["message"]): {
  content: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
} {
  if (!message) {
    return { content: null, mediaType: null, mediaUrl: null };
  }

  // Text message
  if (message.conversation) {
    return { content: message.conversation, mediaType: null, mediaUrl: null };
  }

  // Extended text message (quoted, etc)
  if (message.extendedTextMessage?.text) {
    return { content: message.extendedTextMessage.text, mediaType: null, mediaUrl: null };
  }

  // Image message
  if (message.imageMessage) {
    return {
      content: message.imageMessage.caption || "[Imagem]",
      mediaType: "image",
      mediaUrl: message.imageMessage.url || null,
    };
  }

  // Audio message
  if (message.audioMessage) {
    return {
      content: "[Áudio]",
      mediaType: "audio",
      mediaUrl: message.audioMessage.url || null,
    };
  }

  // Video message
  if (message.videoMessage) {
    return {
      content: message.videoMessage.caption || "[Vídeo]",
      mediaType: "video",
      mediaUrl: message.videoMessage.url || null,
    };
  }

  // Document message
  if (message.documentMessage) {
    return {
      content: message.documentMessage.fileName || "[Documento]",
      mediaType: "document",
      mediaUrl: message.documentMessage.url || null,
    };
  }

  return { content: null, mediaType: null, mediaUrl: null };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`[UazAPI Webhook] Request received at ${new Date().toISOString()}`);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const uazapiToken = Deno.env.get("UAZAPI_TOKEN");

    // Validate webhook token (optional but recommended)
    const requestToken = req.headers.get("x-uazapi-token");
    if (uazapiToken && requestToken && requestToken !== uazapiToken) {
      console.error("[UazAPI Webhook] Invalid token");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const payload: UazAPIPayload = await req.json();
    console.log("[UazAPI Webhook] Payload:", JSON.stringify(payload, null, 2));

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine event type
    const event = payload.event || payload.EventType || "messages.upsert";

    // Instance identifier (UazAPI uses instanceName)
    const instanceName = payload.instanceName || payload.instance || null;

    // Handle different event types
    switch (event) {
      case "messages.upsert":
      case "message":
      case "messages": {
        // Handle messages - can come in different formats
        let messages: UazAPIMessage[] = [];

        // Format 1: payload.data.messages (array)
        if (payload.data?.messages) {
          messages = payload.data.messages;
        }
        // Format 2: payload.messages (array)
        else if (payload.messages) {
          messages = payload.messages;
        }
        // Format 3: Single message in payload.data
        else if (payload.data?.key) {
          messages = [{
            key: payload.data.key,
            pushName: payload.data.pushName,
            message: payload.data.message,
            messageTimestamp: payload.data.messageTimestamp,
            status: payload.data.status,
          }];
        }
        // Format 4: Single message directly in payload
        else if (payload.key) {
          messages = [{
            key: payload.key,
            pushName: payload.pushName,
            message: payload.message as UazAPIMessage["message"],
            messageTimestamp: payload.messageTimestamp,
          }];
        }
        // Format 5: UazAPI native format - single message in payload.message
        else if (payload.message && "chatid" in payload.message) {
          const msg = payload.message as UazAPINativeMessage;
          
          messages = [{
            key: {
              remoteJid: msg.chatid,
              fromMe: msg.fromMe,
              id: msg.messageid || msg.id,
            },
            pushName: msg.senderName || payload.chat?.wa_name || payload.chat?.name,
            message: {
              conversation: msg.text || msg.content?.text,
            },
            messageTimestamp: msg.messageTimestamp,
          }];
        }

        console.log(`[UazAPI Webhook] Processing ${messages.length} messages`);

        for (const msg of messages) {
          if (!msg.key?.remoteJid) {
            console.log("[UazAPI Webhook] Skipping message without remoteJid");
            continue;
          }

          // Skip status messages
          if (msg.key.remoteJid === "status@broadcast") {
            console.log("[UazAPI Webhook] Skipping status broadcast");
            continue;
          }

          const phone = normalizePhone(extractPhone(msg.key.remoteJid));
          const isGroupChat = isGroup(msg.key.remoteJid);
          const { content, mediaType, mediaUrl } = extractMessageContent(msg.message);

          // Skip if no content
          if (!content && !mediaUrl) {
            console.log("[UazAPI Webhook] Skipping message without content");
            continue;
          }

          // Parse timestamp - UazAPI sends in milliseconds (e.g., 1769828138000)
          // If the value is > 10 billion, it's already in ms. Otherwise, it's in seconds.
          let timestampMs: number;
          if (msg.messageTimestamp) {
            const rawTs = typeof msg.messageTimestamp === "string"
              ? parseInt(msg.messageTimestamp)
              : msg.messageTimestamp;
            // If > 10 billion, already in ms; else in seconds
            timestampMs = rawTs > 10000000000 ? rawTs : rawTs * 1000;
          } else {
            timestampMs = Date.now();
          }
          const timestamp = new Date(timestampMs).toISOString();

          console.log(`[UazAPI Webhook] Message: ${msg.key.fromMe ? "OUT" : "IN"} | Phone: ${phone} | Content: ${content?.substring(0, 50)}...`);

          // Find the user/clinic that owns this WhatsApp instance
          // Check both tables: avivar_uazapi_instances (new) and avivar_whatsapp_sessions (legacy)
          
          let userId: string | null = null;
          let sessionId: string | null = null;
          let isLegacySession = false; // Track if this is a legacy session (avivar_whatsapp_sessions)
          
          // Try 1: Check avivar_uazapi_instances (new provisioning flow)
          let uazapiQuery = supabase
            .from("avivar_uazapi_instances")
            .select("id, user_id, instance_id, instance_name, phone_number, status")
            .eq("status", "connected")
            .limit(1);

          if (instanceName) {
            uazapiQuery = uazapiQuery.or(`instance_name.eq.${instanceName},instance_id.eq.${instanceName}`);
          } else if (payload.owner) {
            uazapiQuery = uazapiQuery.eq("phone_number", payload.owner);
          }

          const { data: uazapiInstance, error: uazapiError } = await uazapiQuery.maybeSingle();

          if (uazapiError) {
            console.error("[UazAPI Webhook] Error fetching uazapi instance:", uazapiError);
          }

          if (uazapiInstance) {
            userId = uazapiInstance.user_id;
            sessionId = uazapiInstance.id;
            isLegacySession = false;
            console.log(`[UazAPI Webhook] Found UazAPI instance: ${uazapiInstance.instance_name} for user: ${userId}`);
          } else {
            // Try 2: Check avivar_whatsapp_sessions (legacy flow)
            let sessionQuery = supabase
              .from("avivar_whatsapp_sessions")
              .select("id, user_id, phone_number, phone_name, instance_id, status")
              .limit(1);

            if (instanceName) {
              sessionQuery = sessionQuery.eq("instance_id", instanceName);
            } else if (payload.owner) {
              sessionQuery = sessionQuery.eq("phone_number", payload.owner);
            }

            const { data: session, error: sessionError } = await sessionQuery.maybeSingle();

            if (sessionError) {
              console.error("[UazAPI Webhook] Error fetching session mapping:", sessionError);
            }

            if (session) {
              userId = session.user_id;
              sessionId = session.id;
              isLegacySession = true;
              console.log(`[UazAPI Webhook] Found legacy session: ${session.id} for user: ${userId}`);
            }
          }

          if (!userId) {
            console.log(
              `[UazAPI Webhook] No WhatsApp instance/session found for instance=${instanceName ?? "(none)"} owner=${payload.owner ?? "(none)"}. Skipping message.`
            );
            continue;
          }

          // 1. Store in avivar_whatsapp_messages (raw message storage)
          // IMPORTANT: Only insert if using legacy session (avivar_whatsapp_sessions)
          // because the FK constraint references avivar_whatsapp_sessions, not avivar_uazapi_instances
          const { data: existingMsg } = await supabase
            .from("avivar_whatsapp_messages")
            .select("id, synced_to_crm")
            .eq("message_id", msg.key.id)
            .maybeSingle();

          // If we already processed/synced this message, skip to avoid duplicates in CRM tables
          if (existingMsg?.synced_to_crm) {
            console.log(`[UazAPI Webhook] Message already synced, skipping: ${msg.key.id}`);
            continue;
          }

          // Only insert to avivar_whatsapp_messages for legacy sessions (FK constraint issue)
          if (!existingMsg && isLegacySession && sessionId) {
            const { error: msgError } = await supabase
              .from("avivar_whatsapp_messages")
              .insert({
                session_id: sessionId,
                user_id: userId,
                message_id: msg.key.id,
                remote_jid: msg.key.remoteJid,
                from_me: msg.key.fromMe,
                contact_name: msg.pushName || null,
                contact_phone: phone,
                content,
                media_type: mediaType,
                media_url: mediaUrl,
                timestamp,
                status: msg.key.fromMe ? "sent" : "received",
                is_group: isGroupChat,
                synced_to_crm: false,
              });

            if (msgError) {
              console.error("[UazAPI Webhook] Error storing WhatsApp message:", msgError);
            }
          }

          // 2. Sync to CRM (avivar_conversas + avivar_mensagens)
          // Get or create conversation using RPC
          const { data: conversaId, error: conversaError } = await supabase
            .rpc("get_or_create_avivar_conversa", {
              p_user_id: userId,
              p_numero: phone,
              p_conversa_id: msg.key.remoteJid,
              p_nome_contato: msg.pushName || null,
            });

          if (conversaError) {
            console.error("[UazAPI Webhook] Error getting/creating conversa:", conversaError);
            continue;
          }

          // 3. Check if message already exists in CRM to avoid duplicates
          const { data: existingCrmMsg } = await supabase
            .from("avivar_mensagens")
            .select("id")
            .eq("conversa_id", conversaId)
            .eq("metadata->>message_id", msg.key.id)
            .maybeSingle();

          if (!existingCrmMsg) {
            // 4. Insert message into avivar_mensagens
            const { error: mensagemError } = await supabase
              .from("avivar_mensagens")
              .insert({
                conversa_id: conversaId,
                numero: phone,
                nome_contato: msg.pushName || null,
                mensagem: content,
                direcao: msg.key.fromMe ? "saida" : "entrada",
                data_hora: timestamp,
                // Must match CHECK constraint on avivar_mensagens_tipo_mensagem_check
                tipo_mensagem: mapAvivarTipoMensagem(mediaType),
                url_arquivo: mediaUrl,
                lida: msg.key.fromMe, // Outgoing messages are already "read"
                metadata: {
                  message_id: msg.key.id,
                  remote_jid: msg.key.remoteJid,
                  is_group: isGroupChat,
                  source: "uazapi",
                },
              });

            if (mensagemError) {
              console.error("[UazAPI Webhook] Error storing CRM message:", mensagemError);
            } else {
              console.log(`[UazAPI Webhook] ✅ Message stored in CRM: ${msg.key.id}`);
            }
          } else {
            console.log(`[UazAPI Webhook] Message already exists in CRM: ${msg.key.id}`);
          }

          // 4b. Sync to Inbox tables (leads + crm_conversations + crm_messages)
          // NOTE: The /avivar/inbox UI reads from crm_conversations + crm_messages.
          // IMPORTANT: First check if a journey already exists with this phone to maintain consistency.
          let syncedToInbox = false;

          if (!isGroupChat) {
            const contactName = msg.pushName || `WhatsApp ${phone}`;

            // STEP 1: Check if a patient journey already exists with this phone (for this user)
            // This ensures we link the conversation to the existing journey instead of creating a new lead
            const { data: existingJourney } = await supabase
              .from("avivar_patient_journeys")
              .select("id, patient_name")
              .eq("user_id", userId)
              .eq("patient_phone", phone)
              .maybeSingle();

            // STEP 2: Find or create lead in "leads" table
            let leadId: string | null = null;
            const { data: existingLead, error: leadLookupError } = await supabase
              .from("leads")
              .select("id")
              .eq("phone", phone)
              .maybeSingle();

            if (leadLookupError) {
              console.error("[UazAPI Webhook] Error looking up lead:", leadLookupError);
            }

            if (existingLead?.id) {
              leadId = existingLead.id;
            } else {
              // Create lead with the same name as the journey if it exists
              const leadName = existingJourney?.patient_name || contactName;
              const { data: createdLead, error: leadCreateError } = await supabase
                .from("leads")
                .insert({
                  name: leadName,
                  phone,
                  source: "whatsapp",
                })
                .select("id")
                .single();

              if (leadCreateError) {
                console.error("[UazAPI Webhook] Error creating lead (leads):", leadCreateError);
              } else {
                leadId = createdLead.id;
                console.log(`[UazAPI Webhook] ✅ Lead created in leads: ${leadId} (${phone})`);
              }
            }

            if (leadId) {
              // Find or create conversation in CRM
              let crmConversationId: string | null = null;
              const { data: existingCrmConversation, error: crmConvLookupError } = await supabase
                .from("crm_conversations")
                .select("id, unread_count")
                .eq("lead_id", leadId)
                .eq("channel", "whatsapp")
                .maybeSingle();

              if (crmConvLookupError) {
                console.error("[UazAPI Webhook] Error looking up crm_conversation:", crmConvLookupError);
              }

              if (existingCrmConversation?.id) {
                crmConversationId = existingCrmConversation.id;

                // Update last_message_at and unread count
                const nextUnread = msg.key.fromMe
                  ? existingCrmConversation.unread_count
                  : (existingCrmConversation.unread_count ?? 0) + 1;

                const { error: crmConvUpdateError } = await supabase
                  .from("crm_conversations")
                  .update({
                    last_message_at: timestamp,
                    unread_count: nextUnread,
                    status: "pending",
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", crmConversationId);

                if (crmConvUpdateError) {
                  console.error("[UazAPI Webhook] Error updating crm_conversation:", crmConvUpdateError);
                }
              } else {
                const { data: createdConversation, error: crmConvCreateError } = await supabase
                  .from("crm_conversations")
                  .insert({
                    lead_id: leadId,
                    channel: "whatsapp",
                    status: "pending",
                    last_message_at: timestamp,
                    unread_count: msg.key.fromMe ? 0 : 1,
                    assigned_to: userId,
                  })
                  .select("id")
                  .single();

                if (crmConvCreateError) {
                  console.error("[UazAPI Webhook] Error creating crm_conversation:", crmConvCreateError);
                } else {
                  crmConversationId = createdConversation.id;
                  console.log(`[UazAPI Webhook] ✅ Conversation created in crm_conversations: ${crmConversationId}`);
                }
              }

              if (crmConversationId) {
                const { error: crmMessageError } = await supabase
                  .from("crm_messages")
                  .insert({
                    conversation_id: crmConversationId,
                    direction: msg.key.fromMe ? "outbound" : "inbound",
                    content,
                    media_url: mediaUrl,
                    media_type: mapCrmMediaType(mediaType),
                    sent_at: timestamp,
                    sender_name: msg.key.fromMe
                      ? "Operador"
                      : (msg.pushName || null),
                  });

              if (crmMessageError) {
                  console.error("[UazAPI Webhook] Error inserting crm_message:", crmMessageError);
                } else {
                  syncedToInbox = true;
                  console.log(`[UazAPI Webhook] ✅ Message stored in crm_messages: ${msg.key.id}`);

                  // 🤖 Trigger AI Agent for inbound messages
                  if (!msg.key.fromMe && content) {
                    try {
                      console.log(`[UazAPI Webhook] Triggering AI Agent for conversation ${crmConversationId}`);
                      
                      // Call AI agent asynchronously (fire and forget)
                      fetch(`${supabaseUrl}/functions/v1/avivar-ai-agent`, {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${supabaseServiceKey}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          conversationId: crmConversationId,
                          messageContent: content,
                          leadPhone: phone,
                          leadName: msg.pushName || null,
                          userId,
                        }),
                      }).then(async (aiResponse) => {
                        const aiResult = await aiResponse.json();
                        if (aiResult.success) {
                          console.log(`[UazAPI Webhook] 🤖 AI Agent responded successfully`);
                        } else {
                          console.log(`[UazAPI Webhook] AI Agent skipped: ${aiResult.error}`);
                        }
                      }).catch((aiError) => {
                        console.error("[UazAPI Webhook] AI Agent error:", aiError);
                      });
                    } catch (aiTriggerError) {
                      console.error("[UazAPI Webhook] Error triggering AI Agent:", aiTriggerError);
                    }
                  }
                }
              }
            }
          }

          // 5. Auto-create lead in avivar_patient_journeys if new contact (incoming message only)
          if (!msg.key.fromMe && !isGroupChat) {
            // Check if lead already exists for this phone
            const { data: existingLead } = await supabase
              .from("avivar_patient_journeys")
              .select("id")
              .eq("user_id", userId)
              .eq("patient_phone", phone)
              .maybeSingle();

            if (!existingLead) {
              // Create a new lead automatically
              const contactName = msg.pushName || `WhatsApp ${phone}`;
              const { error: leadError } = await supabase
                .from("avivar_patient_journeys")
                .insert({
                  user_id: userId,
                  patient_name: contactName,
                  patient_phone: phone,
                  // Leave enums omitted to use DB defaults (avoids invalid enum values)
                  lead_source: "whatsapp",
                  notes: `Lead criado automaticamente via WhatsApp em ${new Date().toLocaleDateString("pt-BR")}`,
                });

              if (leadError) {
                console.error("[UazAPI Webhook] Error creating lead:", leadError);
              } else {
                console.log(`[UazAPI Webhook] ✅ Auto-created lead for: ${contactName} (${phone})`);
              }
            }
          }

          // Mark raw WhatsApp message as synced when it reached the Inbox tables
          // (this prevents duplicate inserts if the webhook retries or receives the same payload again)
          if (syncedToInbox) {
            await supabase
              .from("avivar_whatsapp_messages")
              .update({ synced_to_crm: true })
              .eq("message_id", msg.key.id);
          }

          // 6. Update contact in avivar_whatsapp_contacts
          if (!msg.key.fromMe) {
            // Check if contact exists first
            const { data: existingContact } = await supabase
              .from("avivar_whatsapp_contacts")
              .select("id")
              .eq("session_id", sessionId!)
              .eq("jid", msg.key.remoteJid)
              .maybeSingle();

            if (existingContact) {
              await supabase
                .from("avivar_whatsapp_contacts")
                .update({
                  push_name: msg.pushName || undefined,
                  last_message_at: timestamp,
                })
                .eq("id", existingContact.id);
            } else {
              await supabase
                .from("avivar_whatsapp_contacts")
                .insert({
                  session_id: sessionId!,
                  user_id: userId,
                  jid: msg.key.remoteJid,
                  phone,
                  name: null,
                  push_name: msg.pushName || null,
                  last_message_at: timestamp,
                  unread_count: 1,
                });
            }
          }
        }
        break;
      }

      case "connection.update": {
        const state = payload.data?.state;
        console.log(`[UazAPI Webhook] Connection update: ${state}`);

        if (state === "open" || state === "connected") {
          // Find and update session status
          const instance = payload.instanceName || payload.instance;
          if (instance) {
            await supabase
              .from("avivar_whatsapp_sessions")
              .update({
                status: "connected",
                connected_at: new Date().toISOString(),
                error_message: null,
              })
              .eq("instance_id", instance);
          }
        } else if (state === "close" || state === "disconnected") {
          const instance = payload.instanceName || payload.instance;
          if (instance) {
            await supabase
              .from("avivar_whatsapp_sessions")
              .update({
                status: "disconnected",
                error_message: "Conexão encerrada",
              })
              .eq("instance_id", instance);
          }
        }
        break;
      }

      case "contacts.update": {
        const contact = payload.data?.contact;
        if (contact) {
          console.log(`[UazAPI Webhook] Contact update: ${contact.name}`);
          // Update contact info if needed
        }
        break;
      }

      default:
        console.log(`[UazAPI Webhook] Unknown event: ${event}`);
    }

    const duration = Date.now() - startTime;
    console.log(`[UazAPI Webhook] Completed in ${duration}ms`);

    return new Response(
      JSON.stringify({ success: true, duration }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[UazAPI Webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
