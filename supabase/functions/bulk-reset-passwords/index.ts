import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserPasswordPair {
  email: string;
  password: string;
}

interface ResetRequest {
  userEmails?: string[];
  newPassword?: string;
  users?: UserPasswordPair[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT and admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = claims.claims.sub as string;

    const { data: isAdmin } = await supabaseAuth.rpc("is_neohub_admin", { _user_id: callerUserId });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden - admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body: ResetRequest = await req.json();

    let userList: UserPasswordPair[] = [];

    if (body.users && body.users.length > 0) {
      userList = body.users;
    } else if (body.userEmails && body.newPassword) {
      userList = body.userEmails.map(email => ({ email, password: body.newPassword! }));
    } else {
      return new Response(
        JSON.stringify({ error: "Provide either 'users' array or 'userEmails' + 'newPassword'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { email: string; status: string; error?: string }[] = [];

    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1, perPage: 1000,
    });

    if (listError) {
      throw new Error("Failed to list users: " + listError.message);
    }

    const emailToUser = new Map<string, string>();
    for (const u of usersData.users) {
      if (u.email) {
        emailToUser.set(u.email.toLowerCase(), u.id);
      }
    }

    for (const { email, password } of userList) {
      try {
        const userId = emailToUser.get(email.toLowerCase());
        if (!userId) {
          results.push({ email, status: "not_found" });
          continue;
        }
        if (password.length < 6) {
          results.push({ email, status: "error", error: "Password too short" });
          continue;
        }
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
        if (updateError) {
          results.push({ email, status: "error", error: updateError.message });
        } else {
          results.push({ email, status: "updated" });
        }
      } catch (err: any) {
        results.push({ email, status: "error", error: err.message });
      }
    }

    const updated = results.filter(r => r.status === "updated").length;
    const errors = results.filter(r => r.status === "error").length;
    const notFound = results.filter(r => r.status === "not_found").length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `${updated} senha(s) atualizada(s), ${errors} erro(s), ${notFound} não encontrado(s)`,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in bulk-reset-passwords:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
