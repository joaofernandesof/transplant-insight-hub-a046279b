import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Users to delete (old @ipromed.com.br emails)
    const userIdsToDelete = [
      "2326d351-7f51-42f4-accc-dfd31db2a334", // larissa.guerreiro@ipromed.com.br
      "97ed0215-5e92-415f-a094-a5f45fbf2354", // caroline.parahyba@ipromed.com.br
      "f2e3c669-6103-4637-874a-97e4e8e582d9", // isabele.cartaxo@ipromed.com.br
    ];

    const results = [];

    for (const userId of userIdsToDelete) {
      console.log(`Deleting auth user: ${userId}`);
      
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) {
        console.error(`Error deleting user ${userId}:`, error);
        results.push({ userId, status: "error", error: error.message });
      } else {
        console.log(`User deleted: ${userId}`);
        results.push({ userId, status: "deleted" });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
