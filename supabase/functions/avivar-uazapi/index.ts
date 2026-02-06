/**
 * avivar-uazapi - Edge Function para gerenciar instâncias UazAPI
 * Permite criar, conectar, verificar status e gerenciar instâncias de WhatsApp
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UAZAPI_URL = Deno.env.get("UAZAPI_URL") || "https://neofolic.uazapi.com";
const UAZAPI_ADMIN_TOKEN = Deno.env.get("UAZAPI_ADMIN_TOKEN");

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    switch (action) {
      case "create-instance":
        return await handleCreateInstance(req, supabase, userId);
      case "connect-instance":
        return await handleConnectInstance(req, supabase, userId);
      case "check-status":
        return await handleCheckStatus(req, supabase, userId);
      case "disconnect-instance":
        return await handleDisconnectInstance(req, supabase, userId);
      case "delete-instance":
        return await handleDeleteInstance(req, supabase, userId);
      case "setup-webhook":
        return await handleSetupWebhook(req, supabase, userId);
      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Internal error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Create a new UazAPI instance for the user
 */
async function handleCreateInstance(req: Request, supabase: any, userId: string) {
  if (!UAZAPI_ADMIN_TOKEN) {
    throw new Error("UAZAPI_ADMIN_TOKEN not configured");
  }

  const body = await req.json().catch(() => ({}));
  const instanceName = body.instanceName || `avivar-${userId.slice(0, 8)}`;

  // Resolve account_id for multi-tenant
  const { data: memberData, error: memberError } = await supabase
    .from("avivar_account_members")
    .select("account_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (memberError || !memberData?.account_id) {
    console.error("Could not resolve account_id for user:", userId, memberError);
    throw new Error("Could not resolve account for user");
  }

  const accountId = memberData.account_id;
  console.log(`Creating UazAPI instance: ${instanceName} for user: ${userId}, account: ${accountId}`);

  // Construct webhook URL
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const webhookUrl = `${supabaseUrl}/functions/v1/uazapi-webhook`;

  // Call UazAPI to create instance
  const response = await fetch(`${UAZAPI_URL}/instance/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "admintoken": UAZAPI_ADMIN_TOKEN,
    },
    body: JSON.stringify({
      name: instanceName,
      systemName: "avivar",
      adminField01: userId,
      fingerprintProfile: "chrome",
      browser: "chrome",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("UazAPI error:", response.status, errorText);
    throw new Error(`Failed to create instance: ${response.status}`);
  }

  const data = await response.json();
  console.log("UazAPI response:", JSON.stringify(data, null, 2));

  if (!data.instance?.id || !data.instance?.token) {
    throw new Error("Invalid response from UazAPI");
  }

  // Configure webhook using the correct POST /webhook endpoint
  console.log(`Configuring webhook: ${webhookUrl}`);
  
  const webhookPayload = {
    enabled: true,
    url: webhookUrl,
    events: ["messages", "connection", "messages_update"],
    excludeMessages: ["wasSentByApi", "isGroupYes"], // Avoid loops and ignore groups
    addUrlEvents: false,
    addUrlTypesMessages: false,
  };
  
  console.log("Webhook payload:", JSON.stringify(webhookPayload, null, 2));
  
  const webhookResponse = await fetch(`${UAZAPI_URL}/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "token": data.instance.token,
    },
    body: JSON.stringify(webhookPayload),
  });

  const webhookResult = await webhookResponse.text();
  console.log(`Webhook response: ${webhookResponse.status} - ${webhookResult}`);

  if (!webhookResponse.ok) {
    console.error("Failed to set webhook:", webhookResult);
    // Don't fail the whole operation, just log the error
  } else {
    console.log("Webhook configured successfully");
  }

  // Save instance to database
  const { data: instanceData, error: dbError } = await supabase
    .from("avivar_uazapi_instances")
    .upsert({
      user_id: userId,
      account_id: accountId,
      instance_id: data.instance.id,
      instance_name: instanceName,
      instance_token: data.instance.token,
      status: data.instance.status || "disconnected",
      phone_number: data.instance.profileName || null,
      profile_name: data.instance.profileName || null,
      profile_picture_url: data.instance.profilePicUrl || null,
      is_business: data.instance.isBusiness || false,
      platform: data.instance.plataform || null,
      qr_code: data.instance.qrcode || null,
      pair_code: data.instance.paircode || null,
    }, { onConflict: "user_id" })
    .select()
    .single();

  if (dbError) {
    console.error("Database error:", dbError);
    throw new Error("Failed to save instance");
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      instance: instanceData,
      message: "Instance created successfully"
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Connect an existing instance (get QR code or pair code)
 */
async function handleConnectInstance(req: Request, supabase: any, userId: string) {
  const body = await req.json().catch(() => ({}));
  const phone = body.phone; // Optional - if provided, get pair code instead of QR

  // Get user's instance
  const { data: instance, error: fetchError } = await supabase
    .from("avivar_uazapi_instances")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError || !instance) {
    throw new Error("Instance not found");
  }

  console.log(`Connecting instance: ${instance.instance_id} for user: ${userId}`);

  // Call UazAPI to connect
  const response = await fetch(`${UAZAPI_URL}/instance/connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "token": instance.instance_token,
    },
    body: JSON.stringify(phone ? { phone } : {}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("UazAPI connect error:", response.status, errorText);
    throw new Error(`Failed to connect: ${response.status}`);
  }

  const data = await response.json();
  console.log("UazAPI connect response:", JSON.stringify(data, null, 2));

  // Update instance in database
  const updates: any = {
    status: data.connected ? "connected" : "connecting",
    qr_code: data.instance?.qrcode || null,
    pair_code: data.instance?.paircode || null,
  };

  if (data.connected && data.instance) {
    updates.phone_number = data.jid?.replace("@s.whatsapp.net", "") || null;
    updates.profile_name = data.instance.profileName || null;
    updates.profile_picture_url = data.instance.profilePicUrl || null;
    updates.is_business = data.instance.isBusiness || false;
    updates.last_sync_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("avivar_uazapi_instances")
    .update(updates)
    .eq("user_id", userId);

  if (updateError) {
    console.error("Database update error:", updateError);
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      connected: data.connected || false,
      qrCode: data.instance?.qrcode || null,
      pairCode: data.instance?.paircode || null,
      phoneNumber: data.jid?.replace("@s.whatsapp.net", "") || null,
      profileName: data.instance?.profileName || null,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Check the status of the instance
 */
async function handleCheckStatus(req: Request, supabase: any, userId: string) {
  // Get user's instance
  const { data: instance, error: fetchError } = await supabase
    .from("avivar_uazapi_instances")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError || !instance) {
    throw new Error("Instance not found");
  }

  console.log(`Checking status for instance: ${instance.instance_id}`);

  // Call UazAPI to check status
  const response = await fetch(`${UAZAPI_URL}/instance/status`, {
    method: "GET",
    headers: {
      "token": instance.instance_token,
    },
  });

  if (!response.ok) {
    // If 401 or 404, instance might have been deleted or token is invalid
    if (response.status === 404 || response.status === 401) {
      console.log(`Instance invalid (${response.status}), marking as disconnected`);
      await supabase
        .from("avivar_uazapi_instances")
        .update({ 
          status: "disconnected", 
          error_message: response.status === 401 
            ? "Token inválido - recrie a instância" 
            : "Instância não encontrada" 
        })
        .eq("user_id", userId);
      
      // Return a structured response instead of throwing
      return new Response(
        JSON.stringify({ 
          success: true,
          instance: {
            ...instance,
            status: "disconnected",
            error_message: "Instância precisa ser recriada"
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    throw new Error(`Failed to check status: ${response.status}`);
  }

  const data = await response.json();
  console.log("UazAPI status response:", JSON.stringify(data, null, 2));

  // Check connection status - UazAPI returns status.connected or instance.status
  const isConnected = data.status?.connected === true || 
                      data.connected === true || 
                      data.instance?.status === "connected";
  
  const status = isConnected ? "connected" : "disconnected";
  const updates: any = {
    status,
    error_message: null,
  };

  // Extract phone number from owner or jid
  if (isConnected && data.instance) {
    const phoneNumber = data.instance.owner || 
                        data.status?.jid?.replace("@s.whatsapp.net", "").split(":")[0] || 
                        null;
    
    updates.phone_number = phoneNumber;
    updates.profile_name = data.instance.profileName || null;
    updates.profile_picture_url = data.instance.profilePicUrl || null;
    updates.is_business = data.instance.isBusiness || false;
    updates.platform = data.instance.plataform || null;
    updates.last_sync_at = new Date().toISOString();
    
    // Auto-configure webhook when first connected
    // Check if webhook needs to be configured (only do this once)
    const wasDisconnected = instance.status !== "connected";
    if (wasDisconnected) {
      console.log("Instance just connected, configuring webhook automatically...");
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const webhookUrl = `${supabaseUrl}/functions/v1/uazapi-webhook`;
        
        const webhookPayload = {
          enabled: true,
          url: webhookUrl,
          events: ["messages", "connection", "messages_update"],
          excludeMessages: ["wasSentByApi", "isGroupYes"],
          addUrlEvents: false,
          addUrlTypesMessages: false,
        };
        
        console.log("Auto-configuring webhook:", JSON.stringify(webhookPayload, null, 2));
        
        const webhookResponse = await fetch(`${UAZAPI_URL}/webhook`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": instance.instance_token,
          },
          body: JSON.stringify(webhookPayload),
        });
        
        const webhookResult = await webhookResponse.text();
        console.log(`Webhook auto-config response: ${webhookResponse.status} - ${webhookResult}`);
        
        if (webhookResponse.ok) {
          console.log("Webhook configured automatically on connection!");
        } else {
          console.error("Failed to auto-configure webhook:", webhookResult);
        }
      } catch (webhookError) {
        console.error("Error auto-configuring webhook:", webhookError);
      }
    }
  }

  console.log("Updating instance with:", JSON.stringify(updates, null, 2));

  const { data: updatedInstance, error: updateError } = await supabase
    .from("avivar_uazapi_instances")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError) {
    console.error("Database update error:", updateError);
  } else {
    console.log("Instance updated successfully:", updatedInstance?.status);
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      instance: updatedInstance || { ...instance, ...updates },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Disconnect the instance from WhatsApp
 */
async function handleDisconnectInstance(req: Request, supabase: any, userId: string) {
  // Get user's instance
  const { data: instance, error: fetchError } = await supabase
    .from("avivar_uazapi_instances")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError || !instance) {
    throw new Error("Instance not found");
  }

  console.log(`Disconnecting instance: ${instance.instance_id}`);

  // Call UazAPI to disconnect
  const response = await fetch(`${UAZAPI_URL}/instance/disconnect`, {
    method: "POST",
    headers: {
      "token": instance.instance_token,
    },
  });

  // Even if UazAPI fails, update local status
  const { error: updateError } = await supabase
    .from("avivar_uazapi_instances")
    .update({ 
      status: "disconnected",
      qr_code: null,
      pair_code: null,
    })
    .eq("user_id", userId);

  if (updateError) {
    console.error("Database update error:", updateError);
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      message: "Instance disconnected"
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Delete the instance completely
 */
async function handleDeleteInstance(req: Request, supabase: any, userId: string) {
  // Get user's instance
  const { data: instance, error: fetchError } = await supabase
    .from("avivar_uazapi_instances")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError || !instance) {
    throw new Error("Instance not found");
  }

  console.log(`Deleting instance: ${instance.instance_id}`);

  // Try to delete from UazAPI (optional - might fail if admin token not available)
  if (UAZAPI_ADMIN_TOKEN) {
    try {
      await fetch(`${UAZAPI_URL}/instance/delete/${instance.instance_id}`, {
        method: "DELETE",
        headers: {
          "admintoken": UAZAPI_ADMIN_TOKEN,
        },
      });
    } catch (e) {
      console.warn("Failed to delete from UazAPI:", e);
    }
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from("avivar_uazapi_instances")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    console.error("Database delete error:", deleteError);
    throw new Error("Failed to delete instance");
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      message: "Instance deleted"
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Setup webhook for an existing instance
 */
async function handleSetupWebhook(req: Request, supabase: any, userId: string) {
  // Get user's instance
  const { data: instance, error: fetchError } = await supabase
    .from("avivar_uazapi_instances")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError || !instance) {
    throw new Error("Instance not found");
  }

  console.log(`Setting up webhook for instance: ${instance.instance_id}`);

  // Configure webhook for this instance using POST /webhook endpoint
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const webhookUrl = `${supabaseUrl}/functions/v1/uazapi-webhook`;
  
  const webhookPayload = {
    enabled: true,
    url: webhookUrl,
    events: ["messages", "connection", "messages_update"],
    excludeMessages: ["wasSentByApi", "isGroupYes"], // Avoid loops and ignore groups
    addUrlEvents: false,
    addUrlTypesMessages: false,
  };
  
  console.log("Webhook payload:", JSON.stringify(webhookPayload, null, 2));
  
  const webhookResponse = await fetch(`${UAZAPI_URL}/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "token": instance.instance_token,
    },
    body: JSON.stringify(webhookPayload),
  });

  const webhookResult = await webhookResponse.text();
  console.log(`Webhook response: ${webhookResponse.status} - ${webhookResult}`);

  if (!webhookResponse.ok) {
    console.error("Failed to set webhook:", webhookResult);
    throw new Error(`Failed to configure webhook: ${webhookResponse.status} - ${webhookResult}`);
  }
  
  console.log("Webhook configured successfully");

  return new Response(
    JSON.stringify({ 
      success: true,
      webhookUrl: webhookUrl,
      message: "Webhook configurado com sucesso"
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
