import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Debounce Processor for Avivar AI Agent
 * 
 * This function handles the 30-second debounce logic for grouping multiple
 * messages before sending to the AI agent. It's called by the webhook and
 * runs as a separate process that can wait independently.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEBOUNCE_DELAY_MS = 30000; // 30 seconds

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { 
      conversationId, 
      batchId, 
      leadPhone, 
      leadName, 
      userId,
      initialPendingUntil 
    } = await req.json();

    console.log(`[Debounce] Starting processor for batch ${batchId}, conversation ${conversationId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Keep checking until we can process
    const maxIterations = 20; // Max 10 minutes (20 x 30s)
    let iteration = 0;

    while (iteration < maxIterations) {
      // Wait 30 seconds
      await new Promise(resolve => setTimeout(resolve, DEBOUNCE_DELAY_MS));
      iteration++;

      console.log(`[Debounce] Iteration ${iteration}: Checking batch ${batchId}`);

      // Check current state
      const { data: checkConv, error: checkError } = await supabase
        .from("crm_conversations")
        .select("pending_batch_id, pending_until")
        .eq("id", conversationId)
        .single();

      if (checkError) {
        console.error(`[Debounce] Error checking conversation:`, checkError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to check conversation" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If batch ID changed, another process took over
      if (checkConv?.pending_batch_id !== batchId) {
        console.log(`[Debounce] Batch ${batchId} superseded by ${checkConv?.pending_batch_id}, exiting`);
        return new Response(
          JSON.stringify({ success: true, status: "superseded" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If no pending batch, already processed
      if (!checkConv?.pending_batch_id) {
        console.log(`[Debounce] Batch ${batchId} already processed, exiting`);
        return new Response(
          JSON.stringify({ success: true, status: "already_processed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if pending_until has been reached (not extended recently)
      const checkPendingUntil = checkConv?.pending_until ? new Date(checkConv.pending_until) : null;
      const now = new Date();

      if (checkPendingUntil && checkPendingUntil > now) {
        // Still waiting - pending_until was extended, wait another cycle
        console.log(`[Debounce] Batch ${batchId} extended until ${checkPendingUntil.toISOString()}, waiting...`);
        continue;
      }

      // Time to process!
      console.log(`[Debounce] Batch ${batchId} ready to process after ${iteration * 30}s`);

      // Fetch all inbound messages for this conversation
      const { data: allMessages, error: msgError } = await supabase
        .from("crm_messages")
        .select("content, sent_at, direction")
        .eq("conversation_id", conversationId)
        .order("sent_at", { ascending: true });

      if (msgError) {
        console.error(`[Debounce] Error fetching messages:`, msgError);
        break;
      }

      // Find the last outbound message timestamp to get only new messages
      const outboundMessages = allMessages?.filter(m => m.direction === "outbound") || [];
      const lastOutboundTime = outboundMessages.length > 0 
        ? new Date(outboundMessages[outboundMessages.length - 1].sent_at) 
        : new Date(0);

      // Filter inbound messages that came after the last outbound
      const newMessages = allMessages?.filter(m => 
        m.direction === "inbound" && new Date(m.sent_at) > lastOutboundTime
      ) || [];

      if (newMessages.length === 0) {
        console.log(`[Debounce] No new messages to process for batch ${batchId}`);
        await supabase
          .from("crm_conversations")
          .update({ pending_batch_id: null, pending_until: null })
          .eq("id", conversationId);
        
        return new Response(
          JSON.stringify({ success: true, status: "no_messages" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Combine all messages into one context
      const combinedContent = newMessages.map(m => m.content).filter(Boolean).join("\n\n");

      console.log(`[Debounce] Processing ${newMessages.length} batched messages for conversation ${conversationId}`);
      console.log(`[Debounce] Combined content: ${combinedContent.substring(0, 100)}...`);

      // Clear batch before calling AI (to prevent race conditions)
      await supabase
        .from("crm_conversations")
        .update({ pending_batch_id: null, pending_until: null })
        .eq("id", conversationId);

      // Call AI agent with combined content
      try {
        const aiResponse = await fetch(`${supabaseUrl}/functions/v1/avivar-ai-agent`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId,
            messageContent: combinedContent,
            leadPhone,
            leadName,
            userId,
            batchedMessages: newMessages.length,
          }),
        });

        const aiResult = await aiResponse.json();
        const duration = Date.now() - startTime;

        if (aiResult.success) {
          console.log(`[Debounce] 🤖 AI Agent responded successfully (${newMessages.length} messages batched) in ${duration}ms`);
          return new Response(
            JSON.stringify({ 
              success: true, 
              status: "processed",
              messagesProcessed: newMessages.length,
              duration 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          console.log(`[Debounce] AI Agent error: ${aiResult.error}`);
          return new Response(
            JSON.stringify({ success: false, error: aiResult.error }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (aiError) {
        console.error("[Debounce] AI Agent error:", aiError);
        return new Response(
          JSON.stringify({ success: false, error: "AI Agent call failed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`[Debounce] Batch ${batchId} exceeded max iterations, giving up`);
    
    // Clear the batch to prevent orphaned batches
    await supabase
      .from("crm_conversations")
      .update({ pending_batch_id: null, pending_until: null })
      .eq("id", conversationId);

    return new Response(
      JSON.stringify({ success: false, error: "Max iterations exceeded" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Debounce] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
