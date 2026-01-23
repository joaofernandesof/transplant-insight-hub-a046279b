import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetRequest {
  userEmails: string[];
  newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { userEmails, newPassword }: ResetRequest = await req.json();

    if (!userEmails || userEmails.length === 0) {
      return new Response(
        JSON.stringify({ error: "No user emails provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { email: string; status: string; error?: string }[] = [];

    for (const email of userEmails) {
      try {
        // First, get the user by email using getUserByEmail
        const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(
          email // This won't work, let's try listing with filter
        );
        
        // Try to get user via listUsers with proper pagination
        let user = null;
        let page = 1;
        const perPage = 1000;
        
        while (!user) {
          const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage,
          });
          
          if (listError) {
            console.error(`Error listing users page ${page}:`, listError);
            break;
          }
          
          user = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
          
          if (usersData.users.length < perPage) {
            break; // No more pages
          }
          page++;
        }
        
        if (!user) {
          console.log(`User not found: ${email}`);
          results.push({ email, status: "not_found" });
          continue;
        }

        // Update the user's password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { password: newPassword }
        );

        if (updateError) {
          console.error(`Error updating password for ${email}:`, updateError);
          results.push({ email, status: "error", error: updateError.message });
        } else {
          console.log(`Password updated for ${email}`);
          results.push({ email, status: "updated" });
        }

      } catch (err: any) {
        console.error(`Error processing ${email}:`, err);
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
