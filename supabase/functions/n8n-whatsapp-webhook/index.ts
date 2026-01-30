import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface WhatsAppMessage {
  numero: string;
  mensagem?: string;
  direcao: "entrada" | "saida";
  nome_contato?: string;
  conversa_id?: string;
  data_hora?: string;
  tipo_mensagem?: string;
  url_arquivo?: string;
  user_id: string; // ID do usuário dono da conta Avivar
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate webhook secret (optional security layer)
    const webhookSecret = req.headers.get("x-webhook-secret");
    const expectedSecret = Deno.env.get("N8N_WEBHOOK_SECRET");
    
    if (expectedSecret && webhookSecret !== expectedSecret) {
      console.error("Invalid webhook secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Invalid webhook secret" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const payload: WhatsAppMessage = await req.json();
    console.log("Received webhook payload:", JSON.stringify(payload, null, 2));

    // Validate required fields
    if (!payload.numero || !payload.user_id) {
      return new Response(
        JSON.stringify({ 
          error: "Bad Request", 
          message: "Missing required fields: numero and user_id are required" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get or create conversation
    const { data: conversaId, error: conversaError } = await supabase.rpc(
      "get_or_create_avivar_conversa",
      {
        p_user_id: payload.user_id,
        p_numero: payload.numero,
        p_conversa_id: payload.conversa_id || null,
        p_nome_contato: payload.nome_contato || null,
      }
    );

    if (conversaError) {
      console.error("Error getting/creating conversa:", conversaError);
      return new Response(
        JSON.stringify({ error: "Database Error", message: conversaError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Conversa ID:", conversaId);

    // Insert message
    const { data: mensagem, error: mensagemError } = await supabase
      .from("avivar_mensagens")
      .insert({
        conversa_id: conversaId,
        numero: payload.numero,
        mensagem: payload.mensagem || "",
        direcao: payload.direcao || "entrada",
        nome_contato: payload.nome_contato,
        data_hora: payload.data_hora || new Date().toISOString(),
        tipo_mensagem: payload.tipo_mensagem || "text",
        url_arquivo: payload.url_arquivo,
        lida: payload.direcao === "saida", // Mensagens de saída já são lidas
      })
      .select()
      .single();

    if (mensagemError) {
      console.error("Error inserting message:", mensagemError);
      return new Response(
        JSON.stringify({ error: "Database Error", message: mensagemError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Message inserted successfully:", mensagem.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          conversa_id: conversaId,
          mensagem_id: mensagem.id,
          message: "Mensagem recebida e armazenada com sucesso",
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal Server Error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
