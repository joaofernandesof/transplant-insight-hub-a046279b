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

const DEBOUNCE_DELAY_MS = 5000; // 30 seconds

// Schedule a follow-up execution for a conversation
async function scheduleFollowupForConversation(
  supabase: any,
  conversationId: string,
  userId: string,
  leadName: string,
  leadPhone: string
): Promise<void> {
  // Check if there's already a scheduled/pending follow-up for this conversation
  const { data: existingFollowup } = await supabase
    .from("avivar_followup_executions")
    .select("id")
    .eq("conversation_id", conversationId)
    .in("status", ["scheduled", "pending"])
    .limit(1)
    .maybeSingle();

  if (existingFollowup) {
    console.log(`[Debounce] Follow-up already exists for conversation ${conversationId}, skipping`);
    return;
  }

  // Get the first active follow-up rule (attempt 1)
  const { data: rule, error: ruleError } = await supabase
    .from("avivar_followup_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .eq("attempt_number", 1)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (ruleError) {
    console.error(`[Debounce] Error fetching follow-up rule:`, ruleError);
    return;
  }

  if (!rule) {
    console.log(`[Debounce] No active follow-up rule found for user ${userId}`);
    return;
  }

  // Get the lead ID from the conversation
  const { data: conversation } = await supabase
    .from("crm_conversations")
    .select("lead_id")
    .eq("id", conversationId)
    .single();

  if (!conversation?.lead_id) {
    console.log(`[Debounce] No lead_id found for conversation ${conversationId}`);
    return;
  }

  // Calculate scheduled time based on rule delay
  const scheduledFor = new Date(Date.now() + rule.delay_minutes * 60 * 1000);

  // Create the follow-up execution
  const { error: insertError } = await supabase.from("avivar_followup_executions").insert({
    user_id: userId,
    rule_id: rule.id,
    conversation_id: conversationId,
    lead_id: conversation.lead_id,
    lead_name: leadName,
    lead_phone: leadPhone,
    attempt_number: 1,
    status: "scheduled",
    scheduled_for: scheduledFor.toISOString(),
    original_message: rule.message_template,
    ai_generated: rule.use_ai_generation,
    channel: "whatsapp",
  });

  if (insertError) {
    console.error(`[Debounce] Error creating follow-up execution:`, insertError);
    throw insertError;
  }

  console.log(`[Debounce] Created follow-up execution scheduled for ${scheduledFor.toISOString()}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // NOTE: This function must return quickly.
  // The actual debounce processing runs asynchronously so the caller (webhook) can finish.

  try {
    const { conversationId, batchId, leadPhone, leadName, userId } = await req.json();

    const startedAt = Date.now();
    console.log(`[Debounce] ACK start for batch ${batchId}, conversation ${conversationId}`);

    // Fire-and-forget processing (do NOT await)
    (async () => {
      const startTime = Date.now();

      try {
        console.log(`[Debounce] Starting processor for batch ${batchId}, conversation ${conversationId}`);

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Keep checking until we can process
        // IMPORTANT: Edge runtimes have execution limits, so we cap iterations.
        const maxIterations = 20; // 20 x 5s = ~100s with current DEBOUNCE_DELAY_MS
        let iteration = 0;

        while (iteration < maxIterations) {
          await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_DELAY_MS));
          iteration++;

          console.log(`[Debounce] Iteration ${iteration}: Checking batch ${batchId}`);

          const { data: checkConv, error: checkError } = await supabase
            .from("crm_conversations")
            .select("pending_batch_id, pending_until")
            .eq("id", conversationId)
            .single();

          if (checkError) {
            console.error(`[Debounce] Error checking conversation:`, checkError);
            break;
          }

          // If batch ID changed, another process took over
          if (checkConv?.pending_batch_id !== batchId) {
            console.log(`[Debounce] Batch ${batchId} superseded by ${checkConv?.pending_batch_id}, exiting`);
            return;
          }

          // If no pending batch, already processed
          if (!checkConv?.pending_batch_id) {
            console.log(`[Debounce] Batch ${batchId} already processed, exiting`);
            return;
          }

          // Check if pending_until has been reached (not extended recently)
          const checkPendingUntil = checkConv?.pending_until ? new Date(checkConv.pending_until) : null;
          const now = new Date();

          if (checkPendingUntil && checkPendingUntil > now) {
            console.log(`[Debounce] Batch ${batchId} extended until ${checkPendingUntil.toISOString()}, waiting...`);
            continue;
          }

          console.log(`[Debounce] Batch ${batchId} ready to process after ~${iteration * (DEBOUNCE_DELAY_MS / 1000)}s`);

          // Fetch all messages for this conversation
          const { data: allMessages, error: msgError } = await supabase
            .from("crm_messages")
            .select("content, sent_at, direction, media_type, media_url")
            .eq("conversation_id", conversationId)
            .order("sent_at", { ascending: true });

          if (msgError) {
            console.error(`[Debounce] Error fetching messages:`, msgError);
            break;
          }

          const outboundMessages = allMessages?.filter((m: any) => m.direction === "outbound") || [];
          const lastOutboundTime =
            outboundMessages.length > 0
              ? new Date(outboundMessages[outboundMessages.length - 1].sent_at)
              : new Date(0);

          const newMessages =
            allMessages?.filter((m: any) => m.direction === "inbound" && new Date(m.sent_at) > lastOutboundTime) || [];

          if (newMessages.length === 0) {
            console.log(`[Debounce] No new messages to process for batch ${batchId}`);
            await supabase
              .from("crm_conversations")
              .update({ pending_batch_id: null, pending_until: null })
              .eq("id", conversationId);
            return;
          }

          const processedContents: string[] = [];
          let audioTranscribed = 0;

          for (const msg of newMessages) {
            if (msg.media_type === "audio" && msg.media_url) {
              console.log(`[Debounce] 🎤 Found audio message, transcribing...`);
              try {
                const transcribeResponse = await fetch(`${supabaseUrl}/functions/v1/avivar-transcribe-audio`, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${supabaseServiceKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    audioUrl: msg.media_url,
                    language: "pt",
                  }),
                });

                const transcribeText = await transcribeResponse.text();
                let transcribeResult: any = null;
                try {
                  transcribeResult = JSON.parse(transcribeText);
                } catch {
                  transcribeResult = { success: false, error: transcribeText };
                }

                if (transcribeResult.success && transcribeResult.transcription) {
                  console.log(`[Debounce] ✅ Audio transcribed: "${String(transcribeResult.transcription).substring(0, 50)}..."`);
                  processedContents.push(`[Áudio transcrito]: ${transcribeResult.transcription}`);
                  audioTranscribed++;

                  await supabase
                    .from("crm_messages")
                    .update({ content: `[Áudio transcrito]: ${transcribeResult.transcription}` })
                    .eq("conversation_id", conversationId)
                    .eq("media_url", msg.media_url)
                    .eq("direction", "inbound");
                } else {
                  console.log(`[Debounce] ⚠️ Audio transcription failed: ${transcribeResult.error}`);
                  processedContents.push("[Mensagem de áudio - não foi possível transcrever]");
                }
              } catch (transcribeError) {
                console.error(`[Debounce] Error transcribing audio:`, transcribeError);
                processedContents.push("[Mensagem de áudio - erro na transcrição]");
              }
            } else if (msg.content) {
              processedContents.push(msg.content);
            }
          }

          const combinedContent = processedContents.filter(Boolean).join("\n\n");

          console.log(
            `[Debounce] Processing ${newMessages.length} batched messages (${audioTranscribed} audio transcribed) for conversation ${conversationId}`,
          );
          console.log(`[Debounce] Combined content: ${combinedContent.substring(0, 200)}...`);

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

            const aiText = await aiResponse.text();
            let aiResult: any = null;
            try {
              aiResult = JSON.parse(aiText);
            } catch {
              aiResult = { success: false, error: aiText };
            }

            const duration = Date.now() - startTime;

            if (aiResponse.ok && aiResult?.success) {
              console.log(`[Debounce] 🤖 AI Agent responded successfully in ${duration}ms`);

              try {
                await scheduleFollowupForConversation(supabase, conversationId, userId, leadName, leadPhone);
                console.log(`[Debounce] 📅 Follow-up scheduled for conversation ${conversationId}`);
              } catch (followupError) {
                console.error(`[Debounce] Error scheduling follow-up:`, followupError);
              }

              return;
            }

            console.error(
              `[Debounce] AI Agent call failed: status=${aiResponse.status} body=${String(aiResult?.error || aiText).substring(0, 500)}`,
            );
            return;
          } catch (aiError) {
            console.error("[Debounce] AI Agent error:", aiError);
            return;
          }
        }

        console.log(`[Debounce] Batch ${batchId} exceeded max iterations, giving up`);

        // Clear the batch to prevent orphaned batches
        await supabase
          .from("crm_conversations")
          .update({ pending_batch_id: null, pending_until: null })
          .eq("id", conversationId);

        console.log(`[Debounce] Cleared batch ${batchId} after giving up`);
      } catch (error) {
        console.error("[Debounce] Background error:", error);

        // Best-effort cleanup
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          await supabase
            .from("crm_conversations")
            .update({ pending_batch_id: null, pending_until: null })
            .eq("id", conversationId)
            .eq("pending_batch_id", batchId);
        } catch (cleanupError) {
          console.error("[Debounce] Cleanup error:", cleanupError);
        }
      }
    })();

    return new Response(
      JSON.stringify({
        success: true,
        status: "started",
        conversationId,
        batchId,
        ack_ms: Date.now() - startedAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[Debounce] Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
