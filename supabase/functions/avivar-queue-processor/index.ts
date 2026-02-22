import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Avivar Queue Processor - n8n Queue Mode for AI processing
 * 
 * This worker picks jobs from avivar_ai_queue using SELECT FOR UPDATE SKIP LOCKED,
 * processes them (calling AI agent), and marks them complete/failed.
 * 
 * Triggered by pg_cron every 10 seconds or on-demand via HTTP.
 * 
 * Architecture:
 * - Uses PostgreSQL as the message broker (like BullMQ/Redis in n8n)
 * - Atomic job claiming via avivar_queue_pick_job() 
 * - Exponential backoff retries via avivar_queue_fail_job()
 * - Stall detection recovers stuck jobs automatically
 * - Configurable concurrency (jobs per poll cycle)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// How many jobs to pick per invocation
const CONCURRENCY = 3;

// Generate a unique worker ID for this invocation
const WORKER_ID = `worker-${crypto.randomUUID().substring(0, 8)}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Parse optional params
    let jobTypes = ["ai_response"];
    let maxJobs = CONCURRENCY;
    
    try {
      const body = await req.json();
      if (body.job_types) jobTypes = body.job_types;
      if (body.max_jobs) maxJobs = Math.min(body.max_jobs, 10); // Cap at 10
    } catch {
      // No body or invalid JSON - use defaults
    }

    console.log(`[Queue] ${WORKER_ID} polling for ${maxJobs} jobs of types: ${jobTypes.join(", ")}`);

    // Pick jobs atomically
    const { data: jobs, error: pickError } = await supabase
      .rpc("avivar_queue_pick_job", {
        p_worker_id: WORKER_ID,
        p_job_types: jobTypes,
        p_max_jobs: maxJobs,
      });

    if (pickError) {
      console.error(`[Queue] Error picking jobs:`, pickError);
      return new Response(JSON.stringify({ success: false, error: pickError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!jobs || jobs.length === 0) {
      console.log(`[Queue] ${WORKER_ID} no jobs available`);
      return new Response(JSON.stringify({ 
        success: true, 
        worker_id: WORKER_ID,
        jobs_processed: 0,
        duration_ms: Date.now() - startTime 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Queue] ${WORKER_ID} picked ${jobs.length} jobs: ${jobs.map((j: any) => j.id.substring(0, 8)).join(", ")}`);

    // Process jobs concurrently
    const results = await Promise.allSettled(
      jobs.map((job: any) => processJob(supabase, supabaseUrl, supabaseServiceKey, job))
    );

    const summary = {
      success: true,
      worker_id: WORKER_ID,
      jobs_processed: jobs.length,
      completed: results.filter(r => r.status === "fulfilled" && (r as any).value === "completed").length,
      failed: results.filter(r => r.status === "rejected" || (r.status === "fulfilled" && (r as any).value !== "completed")).length,
      duration_ms: Date.now() - startTime,
    };

    console.log(`[Queue] ${WORKER_ID} finished: ${JSON.stringify(summary)}`);

    // Fire-and-forget: log execution
    supabase.from("edge_function_logs").insert({
      function_name: "avivar-queue-processor",
      execution_time_ms: summary.duration_ms,
      status: summary.failed > 0 ? "error" : "success",
      metadata: { worker_id: WORKER_ID, jobs_processed: summary.jobs_processed, completed: summary.completed, failed: summary.failed },
    }).then(() => {}).catch(e => console.error("[Log] insert error:", e));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Queue] ${WORKER_ID} fatal error:`, error);

    // Fire-and-forget: log error
    supabase.from("edge_function_logs").insert({
      function_name: "avivar-queue-processor",
      execution_time_ms: duration,
      status: "error",
      error_message: (error as Error).message?.substring(0, 500),
    }).then(() => {}).catch(() => {});

    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processJob(
  supabase: any,
  supabaseUrl: string,
  supabaseServiceKey: string,
  job: any
): Promise<string> {
  const jobId = job.id;
  const jobShort = jobId.substring(0, 8);
  const jobStart = Date.now();

  console.log(`[Queue] Processing job ${jobShort} (type: ${job.job_type}, attempt: ${job.attempts}, priority: ${job.priority})`);

  try {
    switch (job.job_type) {
      case "ai_response":
        await processAiResponseJob(supabase, supabaseUrl, supabaseServiceKey, job);
        break;
      
      case "followup":
        await processFollowupJob(supabase, supabaseUrl, supabaseServiceKey, job);
        break;

      default:
        throw new Error(`Unknown job type: ${job.job_type}`);
    }

    // Mark as completed
    const { data: completed } = await supabase.rpc("avivar_queue_complete_job", {
      p_job_id: jobId,
      p_worker_id: WORKER_ID,
      p_result: { duration_ms: Date.now() - jobStart },
    });

    console.log(`[Queue] ✅ Job ${jobShort} completed in ${Date.now() - jobStart}ms`);
    return "completed";

  } catch (error) {
    const errorMsg = (error as Error).message || String(error);
    console.error(`[Queue] ❌ Job ${jobShort} error: ${errorMsg}`);

    // Mark as failed (will auto-retry if attempts < max_attempts)
    const { data: newStatus } = await supabase.rpc("avivar_queue_fail_job", {
      p_job_id: jobId,
      p_worker_id: WORKER_ID,
      p_error: errorMsg.substring(0, 500),
    });

    console.log(`[Queue] Job ${jobShort} → ${newStatus} (attempt ${job.attempts}/${job.max_attempts})`);
    return newStatus || "failed";
  }
}

// ============================================================
// JOB HANDLERS
// ============================================================

async function processAiResponseJob(
  supabase: any,
  supabaseUrl: string,
  supabaseServiceKey: string,
  job: any
) {
  const { conversationId, messageContent, leadPhone, leadName, userId, batchedMessages } = job.payload;

  if (!conversationId || !leadPhone || !userId) {
    throw new Error("Missing required payload fields: conversationId, leadPhone, userId");
  }

  // Call AI agent
  const aiResponse = await fetch(`${supabaseUrl}/functions/v1/avivar-ai-agent`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supabaseServiceKey}`,
      apikey: supabaseServiceKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversationId,
      messageContent,
      leadPhone,
      leadName,
      userId,
      batchedMessages,
    }),
  });

  const aiText = await aiResponse.text();
  let aiResult: any;
  try {
    aiResult = JSON.parse(aiText);
  } catch {
    aiResult = { success: false, error: aiText };
  }

  if (!aiResponse.ok || !aiResult?.success) {
    throw new Error(`AI Agent failed: ${aiResult?.error || `status ${aiResponse.status}`}`);
  }

  // Schedule follow-up after successful AI response
  try {
    await scheduleFollowup(supabase, conversationId, userId, leadName, leadPhone);
  } catch (followupError) {
    console.error(`[Queue] Follow-up scheduling error (non-fatal):`, followupError);
  }
}

async function processFollowupJob(
  supabase: any,
  supabaseUrl: string,
  supabaseServiceKey: string,
  job: any
) {
  // Delegate to existing follow-up processor
  const response = await fetch(`${supabaseUrl}/functions/v1/avivar-process-followups`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supabaseServiceKey}`,
      apikey: supabaseServiceKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(job.payload),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Follow-up processor failed: ${text.substring(0, 300)}`);
  }
}

// ============================================================
// FOLLOW-UP SCHEDULING (extracted from debounce-processor)
// ============================================================

async function scheduleFollowup(
  supabase: any,
  conversationId: string,
  userId: string,
  leadName: string,
  leadPhone: string
) {
  // Check if there's already a scheduled follow-up
  const { data: existing } = await supabase
    .from("avivar_followup_executions")
    .select("id")
    .eq("conversation_id", conversationId)
    .in("status", ["scheduled", "pending"])
    .limit(1)
    .maybeSingle();

  if (existing) return;

  // Resolve account_id
  const { data: memberInfo } = await supabase
    .from("avivar_account_members")
    .select("account_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const accountId = memberInfo?.account_id;

  // Find lead's kanban position
  const { data: kanbanLead } = await supabase
    .from("avivar_kanban_leads")
    .select("kanban_id, column_id")
    .eq("phone", leadPhone)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get applicable rule
  let ruleQuery = supabase
    .from("avivar_followup_rules")
    .select("*")
    .eq("is_active", true)
    .eq("attempt_number", 1)
    .order("order_index", { ascending: true });

  if (accountId) {
    ruleQuery = ruleQuery.eq("account_id", accountId);
  } else {
    ruleQuery = ruleQuery.eq("user_id", userId);
  }

  const { data: allRules } = await ruleQuery;

  const rule = (allRules || []).find((r: any) => {
    if (!r.applicable_kanban_ids || r.applicable_kanban_ids.length === 0) return true;
    if (!kanbanLead?.kanban_id || !r.applicable_kanban_ids.includes(kanbanLead.kanban_id)) return false;
    if (r.applicable_column_ids?.length > 0) {
      if (!kanbanLead?.column_id || !r.applicable_column_ids.includes(kanbanLead.column_id)) return false;
    }
    return true;
  });

  if (!rule) return;

  const { data: conversation } = await supabase
    .from("crm_conversations")
    .select("lead_id, account_id")
    .eq("id", conversationId)
    .single();

  if (!conversation?.lead_id) return;

  const scheduledFor = new Date(Date.now() + rule.delay_minutes * 60 * 1000);

  await supabase.from("avivar_followup_executions").insert({
    account_id: conversation.account_id,
    user_id: userId,
    rule_id: rule.id,
    conversation_id: conversationId,
    lead_id: conversation.lead_id,
    lead_name: leadName || `WhatsApp ${leadPhone}`,
    lead_phone: leadPhone,
    attempt_number: 1,
    status: "scheduled",
    scheduled_for: scheduledFor.toISOString(),
    original_message: rule.message_template,
    ai_generated: rule.use_ai_generation,
    channel: "whatsapp",
  });

  console.log(`[Queue] 📅 Follow-up scheduled for ${scheduledFor.toISOString()}`);
}
