import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Debounce Processor for Avivar AI Agent - QUEUE MODE
 *
 * This function handles the debounce logic for grouping multiple messages,
 * then ENQUEUES the job into avivar_ai_queue instead of calling AI directly.
 * The avivar-queue-processor picks and processes the jobs.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHECK_INTERVAL_MS = 3000;
const MAX_RUNTIME_MS = 120000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitUntil(promise: Promise<unknown>) {
  const er = (globalThis as any).EdgeRuntime;
  if (er?.waitUntil) {
    er.waitUntil(promise);
  } else {
    promise.catch((e) => console.error("[Debounce] Background error (no waitUntil):", e));
  }
}

addEventListener("beforeunload", (ev: any) => {
  console.log("[Debounce] shutdown due to:", ev?.detail?.reason);
});

type DebounceStartPayload = {
  conversationId: string;
  batchId: string;
  leadPhone: string;
  leadName?: string | null;
  userId: string;
  initialPendingUntil?: string | null;
};

async function processDebounceBatch(payload: DebounceStartPayload) {
  const { conversationId, batchId, leadPhone, leadName, userId } = payload;
  const safeLeadName = (leadName || "").trim() || `WhatsApp ${leadPhone}`;

  try {
    console.log(`[Debounce] Starting processor for batch ${batchId}, conversation ${conversationId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const maxIterations = Math.ceil(MAX_RUNTIME_MS / CHECK_INTERVAL_MS);
    let iteration = 0;

    while (iteration < maxIterations) {
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

      if (checkConv?.pending_batch_id !== batchId) {
        console.log(`[Debounce] Batch ${batchId} superseded by ${checkConv?.pending_batch_id}, exiting`);
        return;
      }

      if (!checkConv?.pending_batch_id) {
        console.log(`[Debounce] Batch ${batchId} already processed, exiting`);
        return;
      }

      const checkPendingUntil = checkConv?.pending_until ? new Date(checkConv.pending_until) : null;
      const now = new Date();

      if (checkPendingUntil && checkPendingUntil > now) {
        const msRemaining = checkPendingUntil.getTime() - now.getTime();
        const waitMs = Math.max(250, Math.min(CHECK_INTERVAL_MS, msRemaining));
        console.log(`[Debounce] Batch ${batchId} extended until ${checkPendingUntil.toISOString()}, waiting ${waitMs}ms...`);
        await sleep(waitMs);
        continue;
      }

      console.log(`[Debounce] Batch ${batchId} ready to process`);

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

      // Transcribe audio messages
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
                apikey: supabaseServiceKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ audioUrl: msg.media_url, language: "pt" }),
            });

            const transcribeText = await transcribeResponse.text();
            let transcribeResult: any = null;
            try { transcribeResult = JSON.parse(transcribeText); } catch { transcribeResult = { success: false, error: transcribeText }; }

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

      console.log(`[Debounce] Processing ${newMessages.length} batched messages (${audioTranscribed} audio) for conversation ${conversationId}`);

      // Clear batch BEFORE enqueuing
      await supabase
        .from("crm_conversations")
        .update({ pending_batch_id: null, pending_until: null })
        .eq("id", conversationId);

      // ============================================================
      // QUEUE MODE: Enqueue job instead of calling AI directly
      // ============================================================
      
      // Resolve account_id for multi-tenant isolation
      let accountId: string | null = null;
      const { data: convData } = await supabase
        .from("crm_conversations")
        .select("account_id")
        .eq("id", conversationId)
        .single();
      accountId = convData?.account_id || null;

      // If no account_id on conversation, resolve from user
      if (!accountId) {
        const { data: memberInfo } = await supabase
          .from("avivar_account_members")
          .select("account_id")
          .eq("user_id", userId)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();
        accountId = memberInfo?.account_id || null;
      }

      // Determine priority based on context
      let priority = 5; // default
      
      // Higher priority for conversations with more messages (engaged leads)
      if (newMessages.length >= 3) priority = 3;
      
      // Highest priority for audio messages (user put effort into recording)
      if (audioTranscribed > 0) priority = 2;

      // Check if AI is still enabled before enqueuing
      const { data: convAiCheck } = await supabase
        .from("crm_conversations")
        .select("ai_enabled")
        .eq("id", conversationId)
        .single();

      if (convAiCheck?.ai_enabled === false) {
        console.log(`[Debounce] AI disabled for conversation ${conversationId}, skipping queue`);
        // Clear batch state
        await supabase
          .from("crm_conversations")
          .update({ pending_batch_id: null, pending_until: null })
          .eq("id", conversationId);
        return new Response(JSON.stringify({ success: true, skipped: true, reason: "ai_disabled" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if a job already exists for this conversation (prevent duplicates)
      const { data: existingJob } = await supabase
        .from("avivar_ai_queue")
        .select("id")
        .eq("conversation_id", conversationId)
        .in("status", ["waiting", "active"])
        .limit(1)
        .maybeSingle();

      if (existingJob) {
        console.log(`[Debounce] ⚠️ Job already exists for conversation ${conversationId} (${existingJob.id}), skipping duplicate`);
        // Clear batch state
        await supabase
          .from("crm_conversations")
          .update({ pending_batch_id: null, pending_until: null })
          .eq("id", conversationId);
        return new Response(JSON.stringify({ success: true, skipped: true, reason: "duplicate_job" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: queuedJob, error: queueError } = await supabase
        .from("avivar_ai_queue")
        .insert({
          account_id: accountId,
          conversation_id: conversationId,
          user_id: userId,
          job_type: "ai_response",
          priority,
          payload: {
            conversationId,
            messageContent: combinedContent,
            leadPhone,
            leadName: safeLeadName,
            userId,
            batchedMessages: newMessages.length,
            audioTranscribed,
          },
        })
        .select("id")
        .single();

      if (queueError) {
        console.error(`[Debounce] ❌ Failed to enqueue job:`, queueError);
        // NO FALLBACK: Better to skip than to risk duplicate/giant messages
        console.error(`[Debounce] ⚠️ AI will NOT respond this time to prevent duplicates`);
        await supabase
          .from("crm_conversations")
          .update({ pending_batch_id: null, pending_until: null })
          .eq("id", conversationId);
        return new Response(JSON.stringify({ success: false, error: "queue_insert_failed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      console.log(`[Debounce] 📋 Job enqueued: ${queuedJob.id} (priority: ${priority})`);

      // Trigger queue processor immediately (non-blocking)
      fetch(`${supabaseUrl}/functions/v1/avivar-queue-processor`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ max_jobs: 3 }),
      }).catch(err => {
        console.error(`[Debounce] Non-critical: queue trigger failed:`, err);
      });

      return;
    }

    // Max iterations reached - cleanup
    console.log(`[Debounce] Batch ${batchId} exceeded max iterations, giving up`);
    await supabase
      .from("crm_conversations")
      .update({ pending_batch_id: null, pending_until: null })
      .eq("id", conversationId);

  } catch (error) {
    console.error("[Debounce] Background error:", error);
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
}

// Fallback: direct AI call if queue is unavailable
async function callAiDirectly(
  supabaseUrl: string,
  supabaseServiceKey: string,
  payload: any
) {
  const maxRetries = 2;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Debounce] Direct AI call (attempt ${attempt}/${maxRetries})...`);
      const aiResponse = await fetch(`${supabaseUrl}/functions/v1/avivar-ai-agent`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const aiText = await aiResponse.text();
      let aiResult: any;
      try { aiResult = JSON.parse(aiText); } catch { aiResult = { success: false, error: aiText }; }

      if (aiResponse.ok && aiResult?.success) {
        console.log(`[Debounce] ✅ Direct AI call succeeded (attempt ${attempt})`);
        return;
      }
      console.error(`[Debounce] Direct AI call failed (attempt ${attempt}): ${aiResult?.error}`);
    } catch (err) {
      console.error(`[Debounce] Direct AI error (attempt ${attempt}):`, err);
    }
    if (attempt < maxRetries) await sleep(3000);
  }
  console.error(`[Debounce] ❌ Direct AI fallback failed after ${maxRetries} attempts`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const startedAt = Date.now();
    const payload = (await req.json()) as DebounceStartPayload;

    const { conversationId, batchId, leadPhone, userId } = payload;

    if (!conversationId || !batchId || !leadPhone || !userId) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Debounce] ACK start for batch ${batchId}, conversation ${conversationId}`);

    waitUntil(processDebounceBatch(payload));

    return new Response(
      JSON.stringify({
        success: true,
        status: "started",
        mode: "queue",
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
