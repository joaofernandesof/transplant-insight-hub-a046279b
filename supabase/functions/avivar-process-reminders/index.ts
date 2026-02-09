import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[Reminders] Starting reminder processing...");

    // 1. Fetch pending reminders that are due
    const { data: pendingIds, error: fetchError } = await supabase
      .from("avivar_appointment_reminders")
      .select("id")
      .eq("status", "scheduled")
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(20);

    if (fetchError) {
      console.error("[Reminders] Error fetching pending:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!pendingIds || pendingIds.length === 0) {
      console.log("[Reminders] No pending reminders to process");
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Reminders] Found ${pendingIds.length} reminders to process`);

    const results: any[] = [];

    for (const pending of pendingIds) {
      // Atomically claim
      const { data: claimed, error: claimError } = await supabase
        .from("avivar_appointment_reminders")
        .update({ status: "processing" })
        .eq("id", pending.id)
        .eq("status", "scheduled")
        .select(`
          *,
          appointment:avivar_appointments(
            id, status, patient_name, patient_phone, appointment_date, start_time,
            service_type, professional_name, location, lead_id, conversation_id
          )
        `);

      if (claimError || !claimed || claimed.length === 0) {
        continue;
      }

      const reminder = claimed[0];
      const appointment = reminder.appointment;

      try {
        // Check if appointment is still active
        if (!appointment || appointment.status === "cancelled" || appointment.status === "no_show") {
          await supabase
            .from("avivar_appointment_reminders")
            .update({ status: "skipped", updated_at: new Date().toISOString() })
            .eq("id", reminder.id);

          results.push({ id: reminder.id, status: "skipped", reason: "appointment_inactive" });
          console.log(`[Reminders] Skipped ${reminder.id}: appointment inactive`);
          continue;
        }

        // Get conversation_id (from reminder or appointment)
        const conversationId = reminder.conversation_id || appointment.conversation_id;

        if (!conversationId) {
          // No conversation, try to find one by lead or phone
          let convId: string | null = null;

          if (appointment.lead_id) {
            const { data: conv } = await supabase
              .from("crm_conversations")
              .select("id")
              .eq("lead_id", appointment.lead_id)
              .order("updated_at", { ascending: false })
              .limit(1)
              .single();
            convId = conv?.id || null;
          }

          if (!convId && appointment.patient_phone) {
            // Find by phone in leads table
            const { data: lead } = await supabase
              .from("leads")
              .select("id")
              .eq("phone", appointment.patient_phone)
              .limit(1)
              .single();

            if (lead?.id) {
              const { data: conv } = await supabase
                .from("crm_conversations")
                .select("id")
                .eq("lead_id", lead.id)
                .order("updated_at", { ascending: false })
                .limit(1)
                .single();
              convId = conv?.id || null;
            }
          }

          if (!convId) {
            await supabase
              .from("avivar_appointment_reminders")
              .update({
                status: "failed",
                error_message: "Conversa não encontrada para enviar lembrete",
                updated_at: new Date().toISOString(),
              })
              .eq("id", reminder.id);

            results.push({ id: reminder.id, status: "failed", reason: "no_conversation" });
            console.log(`[Reminders] Failed ${reminder.id}: no conversation found`);
            continue;
          }

          // Update reminder with found conversation_id
          await supabase
            .from("avivar_appointment_reminders")
            .update({ conversation_id: convId })
            .eq("id", reminder.id);

          // Use the found conversation
          const sendResponse = await supabase.functions.invoke("avivar-send-message", {
            body: { conversationId: convId, content: reminder.message },
          });

          if (sendResponse.error || !sendResponse.data?.success) {
            throw new Error(sendResponse.error?.message || sendResponse.data?.error || "Falha ao enviar");
          }
        } else {
          // Send using existing conversation
          const sendResponse = await supabase.functions.invoke("avivar-send-message", {
            body: { conversationId, content: reminder.message },
          });

          if (sendResponse.error || !sendResponse.data?.success) {
            throw new Error(sendResponse.error?.message || sendResponse.data?.error || "Falha ao enviar");
          }
        }

        // Mark as sent
        await supabase
          .from("avivar_appointment_reminders")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", reminder.id);

        results.push({ id: reminder.id, status: "sent" });
        console.log(`[Reminders] Sent ${reminder.id} for appointment ${appointment.id}`);
      } catch (err: any) {
        await supabase
          .from("avivar_appointment_reminders")
          .update({
            status: "failed",
            error_message: err.message || "Erro desconhecido",
            updated_at: new Date().toISOString(),
          })
          .eq("id", reminder.id);

        results.push({ id: reminder.id, status: "failed", error: err.message });
        console.error(`[Reminders] Error processing ${reminder.id}:`, err.message);
      }
    }

    console.log(`[Reminders] Processed ${results.length} reminders`);

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[Reminders] Fatal error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
