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
  isAIGenerated?: boolean;
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
    const { conversationId, content, mediaUrl, mediaType, audioBase64, isAIGenerated } = payload;

    // Validate: need either content or audioBase64
    if (!conversationId || (!content && !audioBase64)) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing conversationId or content/audio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isAudioMessage = !!audioBase64;
    console.log("[Avivar Send Message] Conversation:", conversationId, isAudioMessage ? "Audio message" : `Content: ${content?.substring(0, 50)}`);

    // Get conversation with lead info and assigned_to (to find the user's instance)
    const { data: conversation, error: convError } = await adminClient
      .from("crm_conversations")
      .select("id, lead_id, channel, assigned_to")
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

    // Determine which user owns this conversation (for finding their instance)
    const ownerUserId = userId || conversation.assigned_to;
    
    // Try to find the user's UazAPI instance first (new provisioning flow)
    let uazapiUrl: string | undefined = undefined;
    let uazapiToken: string | undefined = undefined;

    if (ownerUserId) {
      const { data: uazapiInstance } = await adminClient
        .from("avivar_uazapi_instances")
        .select("id, instance_token")
        .eq("user_id", ownerUserId)
        .eq("status", "connected")
        .limit(1)
        .maybeSingle();

      if (uazapiInstance?.instance_token) {
        // User has their own instance - use its token
        uazapiUrl = Deno.env.get("UAZAPI_URL"); // Base URL is shared
        uazapiToken = uazapiInstance.instance_token;
        console.log("[Avivar Send Message] Using user's UazAPI instance");
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

    // Send message via UazAPI - different endpoints for text vs audio
    let uazapiResponse: Response;
    let messageContent = content || "";
    
    if (isAudioMessage && audioBase64) {
      // Send audio message: POST /send/audio (base64)
      console.log("[Avivar Send Message] Sending audio message via UazAPI");
      uazapiResponse = await fetch(`${uazapiUrl}/send/audio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": uazapiToken,
        },
        body: JSON.stringify({
          number: phone,
          audio: audioBase64, // Base64 encoded audio
          ptt: true, // Send as voice note (push-to-talk)
        }),
      });
      messageContent = "🎤 Mensagem de voz";
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

    // Get sender name from team members or profile
    let senderName = "Assistente IA";
    if (!isAIGenerated && userId) {
      // First try team members
      const { data: teamMember } = await adminClient
        .from("avivar_team_members")
        .select("name")
        .eq("member_user_id", userId)
        .limit(1)
        .maybeSingle();
      
      if (teamMember?.name) {
        senderName = teamMember.name;
      } else {
        // Fallback to profiles
        const { data: profile } = await adminClient
          .from("profiles")
          .select("name")
          .eq("user_id", userId)
          .single();
        senderName = profile?.name || "Operador";
      }
    }

    // Save message to crm_messages
    const { data: savedMessage, error: saveError } = await adminClient
      .from("crm_messages")
      .insert({
        conversation_id: conversationId,
        direction: "outbound",
        content: messageContent,
        media_url: isAudioMessage ? null : (mediaUrl || null), // For audio, UazAPI handles it
        media_type: isAudioMessage ? "audio" : (mediaType || null),
        sender_name: senderName,
        sender_user_id: isAIGenerated ? null : (userId || null),
        sent_at: new Date().toISOString(),
        is_ai_generated: isAIGenerated || false,
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

    // Also save to avivar_mensagens for legacy support
    if (ownerUserId) {
      const { data: avivarConversa } = await adminClient
        .from("avivar_conversas")
        .select("id")
        .eq("numero", phone)
        .limit(1)
        .maybeSingle();

      if (avivarConversa) {
        await adminClient.from("avivar_mensagens").insert({
          conversa_id: avivarConversa.id,
          numero: phone,
          mensagem: messageContent,
          direcao: "saida",
          data_hora: new Date().toISOString(),
          tipo_mensagem: isAudioMessage ? "audio" : "text",
          lida: true,
        });
      }
    }

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
