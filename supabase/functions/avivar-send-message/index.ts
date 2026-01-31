import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendMessagePayload {
  conversationId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
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

    // User client for auth validation
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      console.error("[Avivar Send Message] Auth error:", claimsError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("[Avivar Send Message] User ID:", userId);

    // Admin client for DB operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Parse payload
    const payload: SendMessagePayload = await req.json();
    const { conversationId, content, mediaUrl, mediaType } = payload;

    if (!conversationId || !content) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing conversationId or content" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Avivar Send Message] Conversation:", conversationId, "Content:", content.substring(0, 50));

    // Get conversation with lead info
    const { data: conversation, error: convError } = await adminClient
      .from("crm_conversations")
      .select("id, lead_id, channel")
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

    // Get user's WhatsApp session to find UazAPI credentials
    const { data: session, error: sessionError } = await adminClient
      .from("avivar_whatsapp_sessions")
      .select("id, instance_id, phone_number")
      .eq("user_id", userId)
      .limit(1)
      .single();

    // Get UazAPI credentials from env
    const uazapiUrl = Deno.env.get("UAZAPI_URL");
    const uazapiToken = Deno.env.get("UAZAPI_TOKEN");

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

    // Format chatId for WhatsApp (UazAPI format)
    const chatId = `${phone}@s.whatsapp.net`;

    console.log("[Avivar Send Message] UazAPI URL:", uazapiUrl);
    console.log("[Avivar Send Message] ChatId:", chatId);

    // Send message via UazAPI - using the correct endpoint structure
    // UazAPI uses /sendText with chatid format
    const uazapiResponse = await fetch(`${uazapiUrl}/sendText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${uazapiToken}`,
      },
      body: JSON.stringify({
        chatid: chatId,
        text: content,
      }),
    });

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

    // Get user profile for sender name
    const { data: profile } = await adminClient
      .from("profiles")
      .select("name")
      .eq("user_id", userId)
      .single();

    const senderName = profile?.name || "Operador";

    // Save message to crm_messages
    const { data: savedMessage, error: saveError } = await adminClient
      .from("crm_messages")
      .insert({
        conversation_id: conversationId,
        direction: "outbound",
        content,
        media_url: mediaUrl || null,
        media_type: mediaType || null,
        sender_name: senderName,
        sent_at: new Date().toISOString(),
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
    if (session?.id) {
      const { data: avivarConversa } = await adminClient
        .from("avivar_conversas")
        .select("id")
        .eq("numero", phone)
        .limit(1)
        .single();

      if (avivarConversa) {
        await adminClient.from("avivar_mensagens").insert({
          conversa_id: avivarConversa.id,
          numero: phone,
          mensagem: content,
          direcao: "saida",
          data_hora: new Date().toISOString(),
          tipo_mensagem: "text",
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
