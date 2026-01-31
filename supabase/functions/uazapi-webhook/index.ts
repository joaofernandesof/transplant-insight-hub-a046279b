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
  message?: UazAPIMessage["message"];
  messageTimestamp?: number | string;
}

// Extract phone number from JID
function extractPhone(jid: string): string {
  if (!jid) return "";
  // Remove @s.whatsapp.net, @g.us, etc.
  const phone = jid.split("@")[0];
  // Remove any suffix like :0, :1
  return phone.split(":")[0];
}

// Check if JID is a group
function isGroup(jid: string): boolean {
  return jid?.includes("@g.us") || false;
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
    const event = payload.event || "messages.upsert";

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
            message: payload.message,
            messageTimestamp: payload.messageTimestamp,
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

          const phone = extractPhone(msg.key.remoteJid);
          const isGroupChat = isGroup(msg.key.remoteJid);
          const { content, mediaType, mediaUrl } = extractMessageContent(msg.message);

          // Skip if no content
          if (!content && !mediaUrl) {
            console.log("[UazAPI Webhook] Skipping message without content");
            continue;
          }

          const timestamp = msg.messageTimestamp
            ? new Date(typeof msg.messageTimestamp === "string"
                ? parseInt(msg.messageTimestamp) * 1000
                : msg.messageTimestamp * 1000
              ).toISOString()
            : new Date().toISOString();

          console.log(`[UazAPI Webhook] Message: ${msg.key.fromMe ? "OUT" : "IN"} | Phone: ${phone} | Content: ${content?.substring(0, 50)}...`);

          // Find the user/clinic that owns this WhatsApp session
          // For now, we'll use a default user_id - in production, you'd map this via the instance
          // or phone number to the correct user/clinic

          // Get the WhatsApp session that matches this instance/phone
          const { data: sessions, error: sessionError } = await supabase
            .from("avivar_whatsapp_sessions")
            .select("id, user_id, phone_number")
            .eq("status", "connected")
            .limit(10);

          if (sessionError) {
            console.error("[UazAPI Webhook] Error fetching sessions:", sessionError);
            continue;
          }

          // Find matching session by phone number (if connected)
          // Or use first available session for now
          const session = sessions?.find(s => s.phone_number?.includes(phone)) || sessions?.[0];

          if (!session) {
            console.log("[UazAPI Webhook] No active WhatsApp session found, skipping message");
            continue;
          }

          const userId = session.user_id;

          // 1. Store in avivar_whatsapp_messages (raw message storage)
          const { error: msgError } = await supabase
            .from("avivar_whatsapp_messages")
            .upsert({
              session_id: session.id,
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
            }, {
              onConflict: "message_id",
              ignoreDuplicates: true,
            });

          if (msgError) {
            console.error("[UazAPI Webhook] Error storing WhatsApp message:", msgError);
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

          // 3. Insert message into avivar_mensagens
          const { error: mensagemError } = await supabase
            .from("avivar_mensagens")
            .insert({
              conversa_id: conversaId,
              numero: phone,
              nome_contato: msg.pushName || null,
              mensagem: content,
              direcao: msg.key.fromMe ? "saida" : "entrada",
              data_hora: timestamp,
              tipo_mensagem: mediaType || "texto",
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
            // Mark WhatsApp message as synced
            await supabase
              .from("avivar_whatsapp_messages")
              .update({ synced_to_crm: true })
              .eq("message_id", msg.key.id);
          }

          // 4. Update contact in avivar_whatsapp_contacts
          if (!msg.key.fromMe) {
            await supabase
              .from("avivar_whatsapp_contacts")
              .upsert({
                session_id: session.id,
                user_id: userId,
                jid: msg.key.remoteJid,
                phone,
                name: null,
                push_name: msg.pushName || null,
                last_message_at: timestamp,
                unread_count: 1, // Will be managed by CRM
              }, {
                onConflict: "session_id,jid",
              });
          }
        }
        break;
      }

      case "connection.update": {
        const state = payload.data?.state;
        console.log(`[UazAPI Webhook] Connection update: ${state}`);

        if (state === "open" || state === "connected") {
          // Find and update session status
          const instance = payload.instance;
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
          const instance = payload.instance;
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
