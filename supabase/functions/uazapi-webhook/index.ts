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
    stickerMessage?: {
      url?: string;
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
  BaseUrl?: string; // UazAPI base URL for API calls
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
  content?: {
    text?: string;
    URL?: string;
    mimetype?: string;
    caption?: string;
    fileName?: string;
    // Media encryption fields
    mediaKey?: string;
    fileSHA256?: string;
    fileEncSHA256?: string;
    fileLength?: number;
    directPath?: string;
  };
  senderName?: string;
  messageTimestamp?: number;
  messageType?: string;
  mediaType?: string;
  isGroup?: boolean;
  groupName?: string;
  type?: string; // "media" | "text" etc
}

// Helper to download media via UazAPI /message/download endpoint
// Documentation: POST /message/download with { id, return_link: true, generate_mp3: true }
// Returns: { fileURL, mimetype, base64Data?, transcription? }
async function downloadMediaFromUazAPI(
  uazapiUrl: string,
  instanceToken: string,
  messageId: string,
  mediaType: string,
): Promise<{ fileURL: string | null; transcription: string | null }> {
  try {
    console.log(`[UazAPI Webhook] 📥 Downloading media via /message/download, messageId: ${messageId}`);

    // Prepare request body according to UazAPI documentation
    const requestBody: Record<string, unknown> = {
      id: messageId,
      return_link: true, // Get public URL
      return_base64: false, // We don't need base64 if we have URL
    };

    // For audio, request MP3 format (better browser compatibility)
    if (mediaType === "audio" || mediaType === "ptt") {
      requestBody.generate_mp3 = true;
    }

    console.log(`[UazAPI Webhook] Request body:`, JSON.stringify(requestBody));

    const downloadResponse = await fetch(`${uazapiUrl}/message/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: instanceToken,
      },
      body: JSON.stringify(requestBody),
    });

    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text();
      console.error(`[UazAPI Webhook] Download failed (${downloadResponse.status}): ${errorText}`);
      return { fileURL: null, transcription: null };
    }

    const data = await downloadResponse.json();
    console.log(`[UazAPI Webhook] Download response:`, JSON.stringify(data).substring(0, 500));

    // UazAPI returns: { fileURL, mimetype, base64Data?, transcription? }
    const fileURL = data.fileURL || data.fileUrl || data.url || null;
    const transcription = data.transcription || null;

    if (fileURL) {
      console.log(`[UazAPI Webhook] ✅ Media downloaded successfully: ${fileURL.substring(0, 80)}...`);
    } else {
      console.log(`[UazAPI Webhook] ⚠️ No fileURL in response`);
    }

    return { fileURL, transcription };
  } catch (error) {
    console.error("[UazAPI Webhook] Error downloading media:", error);
    return { fileURL: null, transcription: null };
  }
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

function mapCrmMediaType(mediaType: string | null): string | null {
  // public.crm_messages has a CHECK constraint allowing only these values (or NULL)
  const allowed = new Set(["image", "video", "audio", "document"]);
  if (!mediaType) return null;
  if (mediaType === "sticker") return "image"; // Stickers are WebP images
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

  // Sticker message - treat as image (WebP)
  if (message.stickerMessage) {
    return {
      content: "[Figurinha]",
      mediaType: "image",
      mediaUrl: message.stickerMessage.url || null,
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

    // Validate webhook token (optional - only validate if both are present)
    // UazAPI may not always send the token header, so we don't require it
    const requestToken = req.headers.get("x-uazapi-token");
    if (uazapiToken && requestToken && requestToken !== uazapiToken) {
      console.error("[UazAPI Webhook] Invalid token provided - rejecting request");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log headers for debugging webhook delivery issues
    console.log(
      `[UazAPI Webhook] Method: ${req.method}, Headers: token=${requestToken ? "present" : "absent"}, content-type=${req.headers.get("content-type")}`,
    );

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
          messages = [
            {
              key: payload.data.key,
              pushName: payload.data.pushName,
              message: payload.data.message,
              messageTimestamp: payload.data.messageTimestamp,
              status: payload.data.status,
            },
          ];
        }
        // Format 4: Single message directly in payload
        else if (payload.key) {
          messages = [
            {
              key: payload.key,
              pushName: payload.pushName,
              message: payload.message as UazAPIMessage["message"],
              messageTimestamp: payload.messageTimestamp,
            },
          ];
        }
        // Format 5: UazAPI native format - single message in payload.message
        else if (payload.message && "chatid" in payload.message) {
          const msg = payload.message as UazAPINativeMessage;

          // Determine message content based on type
          let messageContent: UazAPIMessage["message"] | undefined;
          let nativeMediaContent: UazAPINativeMessage["content"] | undefined;

          // Check if it's a media message (audio, image, video, document)
          if (msg.type === "media" || msg.mediaType) {
            const mediaType = msg.mediaType || "";
            const mediaUrl = msg.content?.URL || null;
            nativeMediaContent = msg.content; // Preserve for download later

            if (mediaType === "ptt" || mediaType === "audio" || msg.messageType === "AudioMessage") {
              // Audio/PTT message
              messageContent = {
                audioMessage: {
                  url: mediaUrl || undefined,
                  mimetype: msg.content?.mimetype,
                },
              };
              console.log(
                `[UazAPI Webhook] 🎤 Audio message detected, URL: ${mediaUrl?.substring(0, 50)}..., has mediaKey: ${!!msg.content?.mediaKey}`,
              );
            } else if (mediaType === "image" || msg.messageType === "ImageMessage") {
              // Image message
              messageContent = {
                imageMessage: {
                  url: mediaUrl || undefined,
                  caption: msg.content?.caption || msg.text,
                  mimetype: msg.content?.mimetype,
                },
              };
            } else if (mediaType === "video" || msg.messageType === "VideoMessage") {
              // Video message
              messageContent = {
                videoMessage: {
                  url: mediaUrl || undefined,
                  caption: msg.content?.caption || msg.text,
                  mimetype: msg.content?.mimetype,
                },
              };
            } else if (mediaType === "document" || msg.messageType === "DocumentMessage") {
              // Document message
              messageContent = {
                documentMessage: {
                  url: mediaUrl || undefined,
                  fileName: msg.content?.fileName,
                  mimetype: msg.content?.mimetype,
                },
              };
            } else if (mediaType === "sticker" || msg.messageType === "StickerMessage") {
              // Sticker message - treat as image
              messageContent = {
                stickerMessage: {
                  url: mediaUrl || undefined,
                  mimetype: msg.content?.mimetype || "image/webp",
                },
              };
              console.log(`[UazAPI Webhook] 🎭 Sticker detected, URL: ${mediaUrl?.substring(0, 50)}...`);
            } else {
              // Unknown media type, try to extract URL anyway
              console.log(`[UazAPI Webhook] Unknown media type: ${mediaType}, messageType: ${msg.messageType}`);
              if (mediaUrl) {
                messageContent = {
                  imageMessage: {
                    url: mediaUrl,
                    mimetype: msg.content?.mimetype,
                  },
                };
              }
            }
          } else {
            // Text message
            messageContent = {
              conversation: msg.text || msg.content?.text,
            };
          }

          // Store native media content for download processing
          const msgWithMedia = {
            key: {
              remoteJid: msg.chatid,
              fromMe: msg.fromMe,
              id: msg.messageid || msg.id,
            },
            pushName: msg.senderName || payload.chat?.wa_name || payload.chat?.name,
            message: messageContent,
            messageTimestamp: msg.messageTimestamp,
            _nativeMediaContent: nativeMediaContent, // Custom field for media download
            _nativeMediaType: msg.mediaType,
          } as UazAPIMessage & { _nativeMediaContent?: typeof nativeMediaContent; _nativeMediaType?: string };

          messages = [msgWithMedia];
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
          let { content, mediaType, mediaUrl } = extractMessageContent(msg.message);

          // Skip if no content
          if (!content && !mediaUrl) {
            console.log("[UazAPI Webhook] Skipping message without content");
            continue;
          }

          // Parse timestamp - UazAPI sends in milliseconds (e.g., 1769828138000)
          // If the value is > 10 billion, it's already in ms. Otherwise, it's in seconds.
          let timestampMs: number;
          if (msg.messageTimestamp) {
            const rawTs =
              typeof msg.messageTimestamp === "string" ? parseInt(msg.messageTimestamp) : msg.messageTimestamp;
            // If > 10 billion, already in ms; else in seconds
            timestampMs = rawTs > 10000000000 ? rawTs : rawTs * 1000;
          } else {
            timestampMs = Date.now();
          }
          const timestamp = new Date(timestampMs).toISOString();

          console.log(
            `[UazAPI Webhook] Message: ${msg.key.fromMe ? "OUT" : "IN"} | Phone: ${phone} | Content: ${content?.substring(0, 50)}... | MediaType: ${mediaType}`,
          );

          // 🎵 MEDIA DOWNLOAD: If this is a media message, download from UazAPI to get a playable URL
          // WhatsApp media URLs are encrypted and only accessible via UazAPI /message/download
          const baseUrl = payload.BaseUrl || `https://${instanceName?.split("-")[0] || "neofolic"}.uazapi.com`;
          const instanceToken = payload.token || Deno.env.get("UAZAPI_TOKEN") || "";

          if (
            mediaType &&
            (mediaType === "audio" || mediaType === "image" || mediaType === "video" || mediaType === "document")
          ) {
            console.log(`[UazAPI Webhook] 🎵 Media message detected (${mediaType}), downloading from UazAPI...`);

            const { fileURL, transcription } = await downloadMediaFromUazAPI(
              baseUrl,
              instanceToken,
              msg.key.id,
              mediaType,
            );

            if (fileURL) {
              mediaUrl = fileURL;
              console.log(`[UazAPI Webhook] ✅ Media URL updated to: ${fileURL.substring(0, 80)}...`);
            } else {
              console.log(`[UazAPI Webhook] ⚠️ Could not download media, keeping original URL`);
            }

            // If transcription was returned (for audio with OpenAI key configured in UazAPI)
            if (transcription && mediaType === "audio") {
              content = `[Áudio transcrito]: ${transcription}`;
              console.log(`[UazAPI Webhook] ✅ Got transcription from UazAPI: ${transcription.substring(0, 50)}...`);
            }
          }

          // Find the user/clinic that owns this WhatsApp instance
          let userId: string | null = null;
          let sessionId: string | null = null;
          let accountId: string | null = null;

          // Check avivar_uazapi_instances
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
            console.log(`[UazAPI Webhook] Found UazAPI instance: ${uazapiInstance.instance_name} for user: ${userId}`);
          }

          if (!userId) {
            console.log(
              `[UazAPI Webhook] No WhatsApp instance/session found for instance=${instanceName ?? "(none)"} owner=${payload.owner ?? "(none)"}. Skipping message.`,
            );
            continue;
          }

          // Resolve account_id for multi-tenant isolation
          const { data: accountData } = await supabase
            .from("avivar_account_members")
            .select("account_id")
            .eq("user_id", userId)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle();

          accountId = accountData?.account_id || null;

          if (!accountId) {
            console.error(`[UazAPI Webhook] ⚠️ No account_id found for user ${userId}. Multi-tenant insert will fail.`);
          } else {
            console.log(`[UazAPI Webhook] Resolved account_id: ${accountId}`);
          }

          // Sync to Inbox tables (leads + crm_conversations + crm_messages)
          // NOTE: The /avivar/inbox UI reads from crm_conversations + crm_messages.
          // IMPORTANT: First check if a journey already exists with this phone to maintain consistency.
          let syncedToInbox = false;

          if (!isGroupChat) {
            const contactName = msg.pushName || `WhatsApp ${phone}`;

            // STEP 1: Check if a patient journey already exists with this phone (for this account)
            // This ensures we link the conversation to the existing journey instead of creating a new lead
            const { data: existingJourney } = accountId ? await supabase
              .from("avivar_patient_journeys")
              .select("id, patient_name")
              .eq("account_id", accountId)
              .eq("patient_phone", phone)
              .maybeSingle() : { data: null };

            // STEP 2: Find or create lead in "leads" table (scoped to account)
            let leadId: string | null = null;
            
            // First try to find lead by phone AND account_id (multi-tenant correct)
            if (accountId) {
              const { data: accountLead } = await supabase
                .from("leads")
                .select("id")
                .eq("phone", phone)
                .eq("account_id", accountId)
                .maybeSingle();
              
              if (accountLead?.id) {
                leadId = accountLead.id;
              }
            }

            // If not found in this account, create a new lead for this account
            if (!leadId) {
              const leadName = existingJourney?.patient_name || contactName;
              const { data: createdLead, error: leadCreateError } = await supabase
                .from("leads")
                .insert({
                  account_id: accountId,
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
                    account_id: accountId,
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
                const { error: crmMessageError } = await supabase.from("crm_messages").insert({
                  account_id: accountId,
                  conversation_id: crmConversationId,
                  direction: msg.key.fromMe ? "outbound" : "inbound",
                  content,
                  media_url: mediaUrl,
                  media_type: mapCrmMediaType(mediaType),
                  sent_at: timestamp,
                  sender_name: msg.key.fromMe ? "Operador" : msg.pushName || null,
                });

                if (crmMessageError) {
                  console.error("[UazAPI Webhook] Error inserting crm_message:", crmMessageError);
                } else {
                  syncedToInbox = true;
                  console.log(`[UazAPI Webhook] ✅ Message stored in crm_messages: ${msg.key.id}`);

                  // Dispatch webhook for message events
                  const messageEvent = msg.key.fromMe ? "message.sent" : "message.received";
                  try {
                    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
                    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
                    await fetch(
                      `${supabaseUrl}/functions/v1/avivar-webhook-dispatch`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${supabaseServiceKey}`,
                        },
                        body: JSON.stringify({
                          event: messageEvent,
                          account_id: accountId,
                          payload: {
                            conversation_id: crmConversationId,
                            direction: msg.key.fromMe ? "outbound" : "inbound",
                            content: content?.slice(0, 500),
                            sender_name: msg.key.fromMe ? "Operador" : msg.pushName || null,
                            phone,
                            timestamp,
                          },
                        }),
                      }
                    );
                  } catch (whErr) {
                    console.error("[UazAPI Webhook] Message webhook dispatch error:", whErr);
                  }

                  // 🤖 Trigger AI Agent for inbound messages with 30s debounce
                  if (!msg.key.fromMe && content) {
                    // ⏹️ Cancel any scheduled follow-ups for this conversation (lead responded)
                    try {
                      const { data: cancelledFollowups, error: cancelError } = await supabase
                        .from("avivar_followup_executions")
                        .update({
                          status: "skipped",
                          skip_reason: "Lead respondeu antes do follow-up",
                        })
                        .eq("conversation_id", crmConversationId)
                        .in("status", ["scheduled", "pending"])
                        .select("id");

                      if (cancelError) {
                        console.error("[UazAPI Webhook] Error cancelling follow-ups:", cancelError);
                      } else if (cancelledFollowups && cancelledFollowups.length > 0) {
                        console.log(
                          `[UazAPI Webhook] ⏹️ Cancelled ${cancelledFollowups.length} follow-up(s) for conversation ${crmConversationId}`,
                        );
                      }
                    } catch (cancelFollowupError) {
                      console.error("[UazAPI Webhook] Error in follow-up cancellation:", cancelFollowupError);
                    }

                    try {
                      console.log(`[UazAPI Webhook] Checking debounce for conversation ${crmConversationId}`);

                      // Generate a new batch ID
                      const newBatchId = crypto.randomUUID();
                      const pendingUntil = new Date(Date.now() + 5000).toISOString(); // 30 seconds from now

                      // Check if there's already a pending batch for this conversation
                      const { data: currentConv } = await supabase
                        .from("crm_conversations")
                        .select("pending_batch_id, pending_until")
                        .eq("id", crmConversationId)
                        .single();

                      const now = new Date();
                      const existingPendingUntil = currentConv?.pending_until
                        ? new Date(currentConv.pending_until)
                        : null;

                      // A batch is only "active" if it exists AND its pending_until hasn't passed yet
                      // If pending_until has passed, the debounce processor has likely finished or failed
                      const hasPendingBatch =
                        currentConv?.pending_batch_id && existingPendingUntil && existingPendingUntil > now;

                      if (hasPendingBatch) {
                        // Extend the pending window - update pending_until
                        // The debounce processor will see the extension and wait
                        console.log(
                          `[UazAPI Webhook] Extending debounce window for batch ${currentConv.pending_batch_id}`,
                        );
                        await supabase
                          .from("crm_conversations")
                          .update({ pending_until: pendingUntil })
                          .eq("id", crmConversationId);
                      } else {
                        // Either no batch exists OR the old batch expired (processor finished/failed)
                        // In both cases, we need to start a fresh batch and processor
                        if (currentConv?.pending_batch_id && existingPendingUntil && existingPendingUntil <= now) {
                          console.log(
                            `[UazAPI Webhook] ⚠️ Old batch ${currentConv.pending_batch_id} expired at ${existingPendingUntil.toISOString()}, starting fresh`,
                          );
                        }
                        console.log(
                          `[UazAPI Webhook] Creating new debounce batch ${newBatchId}, will process at ${pendingUntil}`,
                        );

                        await supabase
                          .from("crm_conversations")
                          .update({
                            pending_batch_id: newBatchId,
                            pending_until: pendingUntil,
                          })
                          .eq("id", crmConversationId);

                        // Call the debounce processor as a separate edge function
                        // We *await* only the startup ACK (the processor returns immediately),
                        // ensuring the request is actually dispatched before this webhook finishes.
                        // Helper: call AI agent directly as fallback
                        const callAIDirectly = async () => {
                          console.log(`[UazAPI Webhook] 🔄 FALLBACK: Calling AI agent directly for conversation ${crmConversationId}`);
                          try {
                            const aiResp = await fetch(`${supabaseUrl}/functions/v1/avivar-ai-agent`, {
                              method: "POST",
                              headers: {
                                Authorization: `Bearer ${supabaseServiceKey}`,
                                apikey: supabaseServiceKey,
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                conversationId: crmConversationId,
                                messageContent: content,
                                leadPhone: phone,
                                leadName: msg.pushName || `WhatsApp ${phone}`,
                                userId,
                                batchedMessages: 1,
                              }),
                            });
                            const aiText = await aiResp.text();
                            console.log(`[UazAPI Webhook] 🔄 FALLBACK AI response: status=${aiResp.status} body=${aiText.substring(0, 200)}`);
                          } catch (fallbackErr) {
                            console.error(`[UazAPI Webhook] 🔄 FALLBACK AI also failed:`, fallbackErr);
                          }
                        };

                        try {
                          const startResp = await fetch(`${supabaseUrl}/functions/v1/avivar-debounce-processor`, {
                            method: "POST",
                            headers: {
                              Authorization: `Bearer ${supabaseServiceKey}`,
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              conversationId: crmConversationId,
                              batchId: newBatchId,
                              leadPhone: phone,
                              leadName: msg.pushName || null,
                              userId,
                              initialPendingUntil: pendingUntil,
                            }),
                          });

                          const startText = await startResp.text();
                          console.log(
                            `[UazAPI Webhook] Debounce processor start ACK: status=${startResp.status} body=${startText.substring(0, 500)}`,
                          );

                          if (!startResp.ok) {
                            console.error(`[UazAPI Webhook] ❌ Debounce processor failed (${startResp.status}), using fallback`);
                            // Clear the batch and call AI directly
                            await supabase
                              .from("crm_conversations")
                              .update({ pending_batch_id: null, pending_until: null })
                              .eq("id", crmConversationId);
                            await callAIDirectly();
                          }
                        } catch (err) {
                          console.error(`[UazAPI Webhook] ❌ Failed to start debounce processor:`, err);
                          // Clear the batch and call AI directly as fallback
                          await supabase
                            .from("crm_conversations")
                            .update({ pending_batch_id: null, pending_until: null })
                            .eq("id", crmConversationId);
                          await callAIDirectly();
                        }
                      }
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
            const { data: existingLead } = accountId ? await supabase
              .from("avivar_patient_journeys")
              .select("id")
              .eq("account_id", accountId)
              .eq("patient_phone", phone)
              .maybeSingle() : { data: null };

            if (!existingLead) {
              // Create a new lead automatically
              const contactName = msg.pushName || `WhatsApp ${phone}`;
              const { error: leadError } = await supabase.from("avivar_patient_journeys").insert({
                account_id: accountId,
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

          // 6. AUTO-CREATE CONTACT AND KANBAN LEAD (avivar_contacts + avivar_kanban_leads)
          // This populates the "Listas" (Contacts) and "Leads > Kanban" views
          if (!msg.key.fromMe && !isGroupChat) {
            const contactName = msg.pushName || null;

            // Step 6a: Get or create contact using RPC
            const { data: contactId, error: contactError } = await supabase.rpc("get_or_create_avivar_contact", {
              p_user_id: userId,
              p_phone: phone,
              p_name: contactName,
            });

            if (contactError) {
              console.error("[UazAPI Webhook] Error creating avivar_contact:", contactError);
            } else if (contactId) {
              console.log(`[UazAPI Webhook] ✅ Contact ensured: ${contactId} (${phone})`);

              // Step 6b: Check if this phone already has a lead in ANY kanban (not just by contact_id)
              // This prevents duplicate leads when the same phone exists in multiple kanbans
              const { data: existingKanbanLead } = await supabase
                .from("avivar_kanban_leads")
                .select("id, kanban_id, column_id")
                .eq("user_id", userId)
                .eq("phone", phone)
                .order("updated_at", { ascending: false })
                .limit(1)
                .maybeSingle();

              if (!existingKanbanLead) {
                // Step 6c: Find the user's first kanban (Comercial) and its first column (Lead de Entrada)
                const { data: firstKanban } = await supabase
                  .from("avivar_kanbans")
                  .select("id")
                  .eq("user_id", userId)
                  .eq("is_active", true)
                  .order("order_index", { ascending: true })
                  .limit(1)
                  .maybeSingle();

                if (firstKanban) {
                  const { data: firstColumn } = await supabase
                    .from("avivar_kanban_columns")
                    .select("id")
                    .eq("kanban_id", firstKanban.id)
                    .order("order_index", { ascending: true })
                    .limit(1)
                    .maybeSingle();

                  if (firstColumn) {
                    // Step 6d: Create the kanban lead
                    const { error: kanbanLeadError } = await supabase.from("avivar_kanban_leads").insert({
                      account_id: accountId,
                      user_id: userId,
                      kanban_id: firstKanban.id,
                      column_id: firstColumn.id,
                      contact_id: contactId,
                      name: contactName || `WhatsApp ${phone}`,
                      phone,
                      source: "whatsapp_auto",
                    });

                    if (kanbanLeadError) {
                      console.error("[UazAPI Webhook] Error creating kanban lead:", kanbanLeadError);
                    } else {
                      console.log(`[UazAPI Webhook] ✅ Kanban lead created for contact: ${contactId}`);
                      
                      // Dispatch webhook event 'lead.created'
                      try {
                        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
                        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
                        const webhookPayload = {
                          lead_id: contactId,
                          name: contactName || `WhatsApp ${phone}`,
                          phone,
                          source: "whatsapp_auto",
                          kanban_id: firstKanban.id,
                          column_id: firstColumn.id,
                          created_at: new Date().toISOString(),
                        };
                        await fetch(
                          `${supabaseUrl}/functions/v1/avivar-webhook-dispatch`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${supabaseServiceKey}`,
                            },
                            body: JSON.stringify({
                              event: "lead.created",
                              account_id: accountId,
                              payload: webhookPayload,
                            }),
                          }
                        );
                      } catch (whErr) {
                        console.error("[UazAPI Webhook] Webhook dispatch error:", whErr);
                      }
                    }
                  }
                }
              } else {
                console.log(`[UazAPI Webhook] Contact already has kanban lead: ${existingKanbanLead.id}`);
              }
            }
          }

          // Legacy tables removed - no longer syncing to avivar_whatsapp_messages or avivar_whatsapp_contacts
        }
        break;
      }

      case "connection.update": {
        const state = payload.data?.state;
        console.log(`[UazAPI Webhook] Connection update: ${state}`);

        if (state === "open" || state === "connected") {
          const instance = payload.instanceName || payload.instance;
          if (instance) {
            await supabase
              .from("avivar_uazapi_instances")
              .update({
                status: "connected",
                connected_at: new Date().toISOString(),
                error_message: null,
              })
              .or(`instance_name.eq.${instance},instance_id.eq.${instance}`);
          }
        } else if (state === "close" || state === "disconnected") {
          const instance = payload.instanceName || payload.instance;
          if (instance) {
            await supabase
              .from("avivar_uazapi_instances")
              .update({
                status: "disconnected",
                error_message: "Conexão encerrada",
              })
              .or(`instance_name.eq.${instance},instance_id.eq.${instance}`);
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

    return new Response(JSON.stringify({ success: true, duration }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[UazAPI Webhook] Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
