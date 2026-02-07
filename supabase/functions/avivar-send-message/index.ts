import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendMessagePayload {
  conversationId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  audioBase64?: string; // Base64 encoded audio for voice messages
  imageBase64?: string; // Base64 encoded image
  videoBase64?: string; // Base64 encoded video
  documentBase64?: string; // Base64 encoded document (PDF, DOC, etc.)
  documentName?: string; // Original filename for document
  caption?: string; // Caption for media messages
  isAIGenerated?: boolean;
  // New audio options for follow-up
  audioType?: 'ptt' | 'audio'; // Type of audio message (voice note vs file)
  audioForward?: boolean; // Mark audio as forwarded
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[Avivar Send Message] Request received");

    // Validate authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Check if this is an internal service call (using service role key)
    const token = authHeader.replace("Bearer ", "");
    const isServiceCall = token === serviceRoleKey;
    
    let userId: string | null = null;
    
    if (isServiceCall) {
      console.log("[Avivar Send Message] Internal service call detected");
    } else {
      // User client for auth validation
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      // Validate user
      const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims?.sub) {
        console.error("[Avivar Send Message] Auth error:", claimsError);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = claimsData.claims.sub;
      console.log("[Avivar Send Message] User ID:", userId);
    }

    // Admin client for DB operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Parse payload
    const payload: SendMessagePayload = await req.json();
    const { conversationId, content, mediaUrl, mediaType, audioBase64, imageBase64, videoBase64, documentBase64, documentName, caption, isAIGenerated, audioType, audioForward } = payload;

    // Check if we're sending audio via URL (for follow-ups)
    const isAudioUrlMessage = mediaType === 'audio' && mediaUrl && !audioBase64;
    // Check if we're sending image via URL (for follow-ups)
    const isImageUrlMessage = mediaType === 'image' && mediaUrl && !imageBase64;
    // Check if we're sending video via URL (for follow-ups)
    const isVideoUrlMessage = mediaType === 'video' && mediaUrl && !videoBase64;
    // Check if we're sending document via URL (for follow-ups)
    const isDocumentUrlMessage = mediaType === 'document' && mediaUrl && !documentBase64;

    // Validate: need either content, audioBase64, imageBase64, videoBase64, documentBase64, or mediaUrl for audio/image/video/document
    if (!conversationId || (!content && !audioBase64 && !imageBase64 && !videoBase64 && !documentBase64 && !isAudioUrlMessage && !isImageUrlMessage && !isVideoUrlMessage && !isDocumentUrlMessage)) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing conversationId or content/audio/image/video/document" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isAudioMessage = !!audioBase64;
    const isImageMessage = !!imageBase64;
    const isVideoMessage = !!videoBase64;
    const isDocumentMessage = !!documentBase64;
    const messageTypeLog = isDocumentUrlMessage ? "Document URL message" : isVideoUrlMessage ? "Video URL message" : isImageUrlMessage ? "Image URL message" : isAudioUrlMessage ? "Audio URL message" : isAudioMessage ? "Audio message" : isImageMessage ? "Image message" : isVideoMessage ? "Video message" : isDocumentMessage ? "Document message" : `Content: ${content?.substring(0, 50)}`;
    console.log("[Avivar Send Message] Conversation:", conversationId, messageTypeLog);

    // Get conversation with lead info and assigned_to (to find the user's instance)
    const { data: conversation, error: convError } = await adminClient
      .from("crm_conversations")
      .select("id, lead_id, channel, assigned_to, account_id")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      console.error("[Avivar Send Message] Conversation not found:", convError);
      return new Response(
        JSON.stringify({ success: false, error: "Conversation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get lead phone from leads table
    const { data: lead, error: leadError } = await adminClient
      .from("leads")
      .select("id, name, phone")
      .eq("id", conversation.lead_id)
      .single();

    if (leadError || !lead?.phone) {
      console.error("[Avivar Send Message] Lead not found or has no phone:", leadError);
      return new Response(
        JSON.stringify({ success: false, error: "Lead has no phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Avivar Send Message] Sending to:", lead.phone);

    // Determine which account should be used to send messages.
    // IMPORTANT: `crm_conversations.assigned_to` can be a team member (attendant),
    // but the WhatsApp instance belongs to the account owner (owner_user_id).
    // If we pick the wrong user_id here, we may send using the wrong UazAPI token/instance.
    let ownerUserId: string | null = userId || conversation.assigned_to;

    if (ownerUserId) {
      // Resolve the account owner via avivar_account_members
      const { data: memberAccount, error: memberError } = await adminClient
        .from("avivar_account_members")
        .select("account_id, avivar_accounts!inner(owner_user_id)")
        .eq("user_id", ownerUserId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (memberError) {
        console.warn("[Avivar Send Message] Could not resolve account owner:", memberError);
      }

      const resolvedOwner = (memberAccount as any)?.avivar_accounts?.owner_user_id;
      if (resolvedOwner && resolvedOwner !== ownerUserId) {
        console.log(
          "[Avivar Send Message] Resolved owner user id via account membership:",
          resolvedOwner
        );
        ownerUserId = resolvedOwner;
      }
    }
    
    // Try to find the user's UazAPI instance first (new provisioning flow)
    let uazapiUrl: string | undefined = undefined;
    let uazapiToken: string | undefined = undefined;

    if (ownerUserId) {
      const { data: uazapiInstance } = await adminClient
        .from("avivar_uazapi_instances")
        .select("id, instance_name, instance_token")
        .eq("user_id", ownerUserId)
        .eq("status", "connected")
        .limit(1)
        .maybeSingle();

      if (uazapiInstance?.instance_token) {
        // User has their own instance - use its token
        uazapiUrl = Deno.env.get("UAZAPI_URL"); // Base URL is shared
        uazapiToken = uazapiInstance.instance_token;
        console.log(
          "[Avivar Send Message] Using owner's UazAPI instance:",
          uazapiInstance.instance_name || uazapiInstance.id
        );
      }
    }

    // Fallback to global credentials (legacy or admin instances)
    if (!uazapiUrl || !uazapiToken) {
      uazapiUrl = Deno.env.get("UAZAPI_URL");
      uazapiToken = Deno.env.get("UAZAPI_TOKEN");
      console.log("[Avivar Send Message] Using global UazAPI credentials");
    }

    if (!uazapiUrl || !uazapiToken) {
      console.error("[Avivar Send Message] UazAPI credentials not configured");
      return new Response(
        JSON.stringify({ success: false, error: "WhatsApp integration not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number (remove non-digits, ensure country code)
    let phone = lead.phone.replace(/\D/g, "");
    if (!phone.startsWith("55") && phone.length <= 11) {
      phone = "55" + phone;
    }

    console.log("[Avivar Send Message] UazAPI URL:", uazapiUrl);
    console.log("[Avivar Send Message] Phone:", phone);

    // Helper function for logging API attempts
    const logAttempt = async (label: string, res: Response) => {
      const allow = res.headers.get("allow");
      let bodyPreview = "";
      try {
        const txt = await res.clone().text();
        bodyPreview = txt ? txt.slice(0, 200) : "";
      } catch {
        // ignore
      }
      console.log(
        `[Avivar Send Message] API attempt: ${label} | status=${res.status}${allow ? ` | allow=${allow}` : ""}${bodyPreview ? ` | body=${bodyPreview}` : ""}`
      );
    };

    // Send message via UazAPI - different endpoints for text vs media
    let uazapiResponse: Response;
    let messageContent = content || "";
    let savedMediaUrl: string | null = null;
    
    if (isAudioUrlMessage && mediaUrl) {
      // Send audio via URL (for follow-ups)
      console.log("[Avivar Send Message] Sending audio URL message via UazAPI, type:", audioType);
      
      // Determine the UazAPI type based on audioType
      // 'ptt' = push-to-talk (voice note bubble with avatar)
      // 'audio' = regular audio file (with mic icon)
      const uazapiType = audioType === 'ptt' ? 'ptt' : 'audio';
      
      const audioPayload: Record<string, unknown> = {
        number: phone,
        type: uazapiType,
        file: mediaUrl,
        text: content || " ",
      };
      
      // Add forward flag if needed
      if (audioForward && audioType === 'audio') {
        audioPayload.forward = true;
      }
      
      uazapiResponse = await fetch(`${uazapiUrl}/send/media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": uazapiToken,
        },
        body: JSON.stringify(audioPayload),
      });
      await logAttempt(`/send/media type=${uazapiType}`, uazapiResponse);
      
      // Fallback to other audio types if ptt fails
      if (!uazapiResponse.ok && audioType === 'ptt') {
        audioPayload.type = 'myaudio';
        uazapiResponse = await fetch(`${uazapiUrl}/send/media`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": uazapiToken,
          },
          body: JSON.stringify(audioPayload),
        });
        await logAttempt("/send/media type=myaudio", uazapiResponse);
      }
      
      savedMediaUrl = mediaUrl;
      messageContent = content || "🎤 Mensagem de voz";
    } else if (isImageUrlMessage && mediaUrl) {
      // Send image via URL (for follow-ups)
      console.log("[Avivar Send Message] Sending image URL message via UazAPI");
      
      uazapiResponse = await fetch(`${uazapiUrl}/send/media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": uazapiToken,
        },
        body: JSON.stringify({
          number: phone,
          type: "image",
          file: mediaUrl,
          text: caption || content || " ",
        }),
      });
      await logAttempt("/send/media type=image (URL)", uazapiResponse);
      
      savedMediaUrl = mediaUrl;
      messageContent = caption || content || "📷 Imagem";
    } else if (isVideoUrlMessage && mediaUrl) {
      // Send video via URL (for follow-ups)
      console.log("[Avivar Send Message] Sending video URL message via UazAPI");
      
      uazapiResponse = await fetch(`${uazapiUrl}/send/media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": uazapiToken,
        },
        body: JSON.stringify({
          number: phone,
          type: "video",
          file: mediaUrl,
          text: caption || content || " ",
        }),
      });
      await logAttempt("/send/media type=video (URL)", uazapiResponse);
      
      savedMediaUrl = mediaUrl;
      messageContent = caption || content || "🎬 Vídeo";
    } else if (isDocumentUrlMessage && mediaUrl) {
      // Send document via URL (for follow-ups)
      console.log("[Avivar Send Message] Sending document URL message via UazAPI");
      
      uazapiResponse = await fetch(`${uazapiUrl}/send/media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": uazapiToken,
        },
        body: JSON.stringify({
          number: phone,
          type: "document",
          file: mediaUrl,
          text: documentName || content || " ",
        }),
      });
      await logAttempt("/send/media type=document (URL)", uazapiResponse);
      
      savedMediaUrl = mediaUrl;
      messageContent = documentName || content || "📄 Documento";
    } else if (isAudioMessage && audioBase64) {
      // Send audio message
      console.log("[Avivar Send Message] Sending audio message via UazAPI");
      
      let audioData = audioBase64;
      if (!audioBase64.startsWith('data:')) {
        audioData = `data:audio/ogg;base64,${audioBase64}`;
      }
      const audioRawBase64 = audioData.includes(",") ? audioData.split(",")[1] : audioData;

      const sendAudioMedia = async (type: string) => {
        const res = await fetch(`${uazapiUrl}/send/media`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": uazapiToken,
          },
          body: JSON.stringify({
            number: phone,
            type,
            file: audioRawBase64,
            mimetype: "audio/ogg",
            text: " ",
          }),
        });
        await logAttempt(`/send/media type=${type}`, res);
        return res;
      };

      // Try voice-note types supported by the API docs (ptt, myaudio) then generic audio.
      uazapiResponse = await sendAudioMedia("ptt");
      if (!uazapiResponse.ok) uazapiResponse = await sendAudioMedia("myaudio");
      if (!uazapiResponse.ok) uazapiResponse = await sendAudioMedia("audio");
      
      messageContent = "🎤 Mensagem de voz";
    } else if (isImageMessage && imageBase64) {
      // Send image message
      console.log("[Avivar Send Message] Sending image message via UazAPI");
      
      // Extract raw base64 if it has data URI prefix
      const imageRawBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
      
      // Detect mimetype from data URI or default to jpeg
      let mimetype = "image/jpeg";
      let fileExtension = "jpg";
      if (imageBase64.startsWith("data:")) {
        const mimeMatch = imageBase64.match(/data:([^;]+);/);
        if (mimeMatch) {
          mimetype = mimeMatch[1];
          if (mimetype === "image/png") fileExtension = "png";
          else if (mimetype === "image/gif") fileExtension = "gif";
          else if (mimetype === "image/webp") fileExtension = "webp";
        }
      }

      // Upload image to Supabase Storage for preview
      try {
        const imageBuffer = Uint8Array.from(atob(imageRawBase64), c => c.charCodeAt(0));
        const fileName = `chat-images/${conversationId}/${Date.now()}.${fileExtension}`;
        
        const { data: uploadData, error: uploadError } = await adminClient.storage
          .from("avivar-media")
          .upload(fileName, imageBuffer, {
            contentType: mimetype,
            upsert: false,
          });
        
        if (!uploadError && uploadData) {
          const { data: publicUrl } = adminClient.storage
            .from("avivar-media")
            .getPublicUrl(fileName);
          savedMediaUrl = publicUrl.publicUrl;
          console.log("[Avivar Send Message] Image uploaded to storage:", savedMediaUrl);
        } else {
          console.error("[Avivar Send Message] Storage upload error:", uploadError);
        }
      } catch (storageErr) {
        console.error("[Avivar Send Message] Storage upload failed:", storageErr);
      }

      // Send image via /send/media with type: "image"
      uazapiResponse = await fetch(`${uazapiUrl}/send/media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": uazapiToken,
        },
        body: JSON.stringify({
          number: phone,
          type: "image",
          file: imageRawBase64,
          mimetype,
          text: caption || " ",
        }),
      });
      await logAttempt("/send/media type=image", uazapiResponse);
      
      messageContent = caption || "📷 Imagem";
    } else if (isVideoMessage && videoBase64) {
      // Send video message
      console.log("[Avivar Send Message] Sending video message via UazAPI");
      
      // Extract raw base64 if it has data URI prefix
      const videoRawBase64 = videoBase64.includes(",") ? videoBase64.split(",")[1] : videoBase64;
      
      // Detect mimetype from data URI or default to mp4
      let mimetype = "video/mp4";
      let fileExtension = "mp4";
      if (videoBase64.startsWith("data:")) {
        const mimeMatch = videoBase64.match(/data:([^;]+);/);
        if (mimeMatch) {
          mimetype = mimeMatch[1];
          if (mimetype === "video/webm") fileExtension = "webm";
          else if (mimetype === "video/quicktime") fileExtension = "mov";
          else if (mimetype === "video/x-msvideo") fileExtension = "avi";
        }
      }

      // Upload video to Supabase Storage for preview
      try {
        const videoBuffer = Uint8Array.from(atob(videoRawBase64), c => c.charCodeAt(0));
        const fileName = `chat-videos/${conversationId}/${Date.now()}.${fileExtension}`;
        
        const { data: uploadData, error: uploadError } = await adminClient.storage
          .from("avivar-media")
          .upload(fileName, videoBuffer, {
            contentType: mimetype,
            upsert: false,
          });
        
        if (!uploadError && uploadData) {
          const { data: publicUrl } = adminClient.storage
            .from("avivar-media")
            .getPublicUrl(fileName);
          savedMediaUrl = publicUrl.publicUrl;
          console.log("[Avivar Send Message] Video uploaded to storage:", savedMediaUrl);
        } else {
          console.error("[Avivar Send Message] Storage upload error:", uploadError);
        }
      } catch (storageErr) {
        console.error("[Avivar Send Message] Storage upload failed:", storageErr);
      }

      // Send video via /send/media with type: "video"
      uazapiResponse = await fetch(`${uazapiUrl}/send/media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": uazapiToken,
        },
        body: JSON.stringify({
          number: phone,
          type: "video",
          file: videoRawBase64,
          mimetype,
          text: caption || " ",
        }),
      });
      await logAttempt("/send/media type=video", uazapiResponse);
      
      messageContent = caption || "🎬 Vídeo";
    } else if (isDocumentMessage && documentBase64) {
      // Send document message
      console.log("[Avivar Send Message] Sending document message via UazAPI");
      
      // Extract raw base64 if it has data URI prefix
      const docRawBase64 = documentBase64.includes(",") ? documentBase64.split(",")[1] : documentBase64;
      
      // Detect mimetype from data URI or default to pdf
      let mimetype = "application/pdf";
      let fileExtension = "pdf";
      if (documentBase64.startsWith("data:")) {
        const mimeMatch = documentBase64.match(/data:([^;]+);/);
        if (mimeMatch) {
          mimetype = mimeMatch[1];
          if (mimetype === "application/pdf") fileExtension = "pdf";
          else if (mimetype === "application/msword") fileExtension = "doc";
          else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") fileExtension = "docx";
          else if (mimetype === "application/vnd.ms-excel") fileExtension = "xls";
          else if (mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") fileExtension = "xlsx";
          else if (mimetype === "text/plain") fileExtension = "txt";
          else if (mimetype === "application/zip") fileExtension = "zip";
        }
      }

      // Use original filename if provided, otherwise generate one
      const originalName = documentName || `documento_${Date.now()}.${fileExtension}`;
      const safeFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');

      // Upload document to Supabase Storage for preview
      try {
        const docBuffer = Uint8Array.from(atob(docRawBase64), c => c.charCodeAt(0));
        const fileName = `chat-documents/${conversationId}/${Date.now()}_${safeFileName}`;
        
        const { data: uploadData, error: uploadError } = await adminClient.storage
          .from("avivar-media")
          .upload(fileName, docBuffer, {
            contentType: mimetype,
            upsert: false,
          });
        
        if (!uploadError && uploadData) {
          const { data: publicUrl } = adminClient.storage
            .from("avivar-media")
            .getPublicUrl(fileName);
          savedMediaUrl = publicUrl.publicUrl;
          console.log("[Avivar Send Message] Document uploaded to storage:", savedMediaUrl);
        } else {
          console.error("[Avivar Send Message] Storage upload error:", uploadError);
        }
      } catch (storageErr) {
        console.error("[Avivar Send Message] Storage upload failed:", storageErr);
      }

      // Send document via /send/media with type: "document"
      uazapiResponse = await fetch(`${uazapiUrl}/send/media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": uazapiToken,
        },
        body: JSON.stringify({
          number: phone,
          type: "document",
          file: docRawBase64,
          mimetype,
          filename: originalName,
          text: caption || " ",
        }),
      });
      await logAttempt("/send/media type=document", uazapiResponse);
      
      messageContent = caption || `📄 ${originalName}`;
    } else {
      // Send text message: POST /send/text
      uazapiResponse = await fetch(`${uazapiUrl}/send/text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": uazapiToken,
        },
        body: JSON.stringify({
          number: phone,
          text: content,
        }),
      });
      await logAttempt("/send/text", uazapiResponse);
    }

    const uazapiResult = await uazapiResponse.text();
    console.log("[Avivar Send Message] UazAPI response:", uazapiResponse.status, uazapiResult);

    if (!uazapiResponse.ok) {
      console.error("[Avivar Send Message] UazAPI error:", uazapiResult);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send WhatsApp message", details: uazapiResult }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse UazAPI response to get message ID
    let messageId = "";
    try {
      const uazapiData = JSON.parse(uazapiResult);
      messageId = uazapiData.messageId || uazapiData.id || "";
    } catch {
      // Ignore parse errors
    }

    // Get sender name from account members or profile
    let senderName = "Assistente IA";
    if (!isAIGenerated && userId) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("name")
        .eq("user_id", userId)
        .single();
      senderName = profile?.name || "Operador";
    }

    // Determine media type for storage
    const finalMediaType = isAudioMessage ? "audio" : isImageMessage ? "image" : isVideoMessage ? "video" : isDocumentMessage ? "document" : (mediaType || null);
    const finalMediaUrl = savedMediaUrl || mediaUrl || null;

    // Save message to crm_messages
    const { data: savedMessage, error: saveError } = await adminClient
      .from("crm_messages")
      .insert({
        conversation_id: conversationId,
        direction: "outbound",
        content: messageContent,
        media_url: finalMediaUrl,
        media_type: finalMediaType,
        sender_name: senderName,
        sender_user_id: isAIGenerated ? null : (userId || null),
        sent_at: new Date().toISOString(),
        is_ai_generated: isAIGenerated || false,
        account_id: conversation.account_id,
      })
      .select()
      .single();

    if (saveError) {
      console.error("[Avivar Send Message] Error saving message:", saveError);
      // Message was sent, just failed to save - still return success
    }

    // Update conversation last_message_at
    await adminClient
      .from("crm_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        status: "pending",
      })
      .eq("id", conversationId);

    console.log("[Avivar Send Message] ✅ Message sent successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: savedMessage,
        uazapiMessageId: messageId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Avivar Send Message] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
