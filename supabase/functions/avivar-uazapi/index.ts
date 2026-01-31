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

  console.log(`Creating UazAPI instance: ${instanceName} for user: ${userId}`);

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

  // Save instance to database
  const { data: instanceData, error: dbError } = await supabase
    .from("avivar_uazapi_instances")
    .upsert({
      user_id: userId,
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
    // If 404, instance might have been deleted on UazAPI side
    if (response.status === 404) {
      await supabase
        .from("avivar_uazapi_instances")
        .update({ status: "disconnected", error_message: "Instance not found" })
        .eq("user_id", userId);
    }
    throw new Error(`Failed to check status: ${response.status}`);
  }

  const data = await response.json();
  console.log("UazAPI status response:", JSON.stringify(data, null, 2));

  // Update instance
  const status = data.connected ? "connected" : "disconnected";
  const updates: any = {
    status,
    error_message: null,
  };

  if (data.connected && data.instance) {
    updates.profile_name = data.instance.profileName || null;
    updates.profile_picture_url = data.instance.profilePicUrl || null;
    updates.is_business = data.instance.isBusiness || false;
    updates.platform = data.instance.plataform || null;
    updates.last_sync_at = new Date().toISOString();
  }

  const { data: updatedInstance, error: updateError } = await supabase
    .from("avivar_uazapi_instances")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError) {
    console.error("Database update error:", updateError);
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
