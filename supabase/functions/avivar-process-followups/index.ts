 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 // Template variables replacement
 function replaceVariables(template: string, variables: Record<string, string>): string {
   let result = template;
   Object.entries(variables).forEach(([key, value]) => {
     result = result.replace(new RegExp(`{{${key}}}`, 'gi'), value || '');
   });
   // Clean up any remaining variables that weren't replaced
   result = result.replace(/{{[^}]+}}/g, '');
   return result.trim();
 }
 
 // Extract first name from full name
 function getFirstName(fullName: string | null): string {
   if (!fullName) return '';
   return fullName.split(' ')[0];
 }
 
 // Check if current time is within business hours
 function isWithinBusinessHours(
   startTime: string,
   endTime: string,
   excludedDays: number[]
 ): boolean {
   const now = new Date();
   const currentDay = now.getDay();
   
   // Check excluded days (0 = Sunday, 6 = Saturday)
   if (excludedDays.includes(currentDay)) {
     return false;
   }
   
   const currentTimeStr = now.toTimeString().slice(0, 5);
   return currentTimeStr >= startTime && currentTimeStr <= endTime;
 }
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response("ok", { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     const body = await req.json().catch(() => ({}));
     const { executionId } = body;
 
    let executions: any[] = [];
    
    // If specific execution requested, only process that one
    if (executionId) {
      const { data, error } = await supabase
        .from('avivar_followup_executions')
        .select(`
          *,
          rule:avivar_followup_rules(*),
          conversation:crm_conversations(
            id,
            lead:leads(id, name, phone, email, procedure_interest)
          )
        `)
        .eq('id', executionId)
        .single();
      
      if (error) {
        console.error('Error fetching execution:', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      
      executions = data ? [data] : [];
    } else {
      const { data, error } = await supabase
         .from('avivar_followup_executions')
         .select(`
           *,
           rule:avivar_followup_rules(*),
           conversation:crm_conversations(
             id,
             lead:leads(id, name, phone, email, procedure_interest)
           )
         `)
        .in('status', ['pending', 'scheduled'])
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(10);
      
      if (error) {
        console.error('Error fetching executions:', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      
      executions = data || [];
     }
 
     const results: any[] = [];
 
    for (const execution of executions) {
       if (!execution) continue;
 
       try {
         const rule = execution.rule;
         const conversation = execution.conversation;
         const lead = conversation?.lead;
 
         // Skip if no lead/conversation data
         if (!lead || !conversation) {
           await supabase
             .from('avivar_followup_executions')
             .update({
               status: 'skipped',
               skip_reason: 'Lead ou conversa não encontrados',
             })
             .eq('id', execution.id);
           
           results.push({ id: execution.id, status: 'skipped', reason: 'no_lead' });
           continue;
         }
 
         // Check business hours if rule requires
         if (rule?.respect_business_hours) {
           const isBusinessHours = isWithinBusinessHours(
             rule.business_hours_start || '08:00',
             rule.business_hours_end || '18:00',
             rule.excluded_days || [0, 6]
           );
 
           if (!isBusinessHours) {
             // Reschedule to next business hour
             const now = new Date();
             let nextTime = new Date(now);
             
             // If before business hours, schedule for today's start
             const startHour = parseInt(rule.business_hours_start?.split(':')[0] || '8');
             const endHour = parseInt(rule.business_hours_end?.split(':')[0] || '18');
             const currentHour = now.getHours();
             
             if (currentHour < startHour) {
               nextTime.setHours(startHour, 0, 0, 0);
             } else {
               // After business hours, schedule for next day
               nextTime.setDate(nextTime.getDate() + 1);
               nextTime.setHours(startHour, 0, 0, 0);
             }
             
             // Skip excluded days
             while ((rule.excluded_days || [0, 6]).includes(nextTime.getDay())) {
               nextTime.setDate(nextTime.getDate() + 1);
             }
 
             await supabase
               .from('avivar_followup_executions')
               .update({
                 scheduled_for: nextTime.toISOString(),
                 status: 'scheduled',
               })
               .eq('id', execution.id);
 
             results.push({ id: execution.id, status: 'rescheduled', next_time: nextTime.toISOString() });
             continue;
           }
         }
 
         // Check if lead has responded recently
         const { data: recentMessages } = await supabase
           .from('crm_messages')
           .select('id, direction, sent_at')
           .eq('conversation_id', conversation.id)
           .order('sent_at', { ascending: false })
           .limit(1);
 
         if (recentMessages?.[0]?.direction === 'inbound') {
           // Lead responded, skip follow-up
           await supabase
             .from('avivar_followup_executions')
             .update({
               status: 'skipped',
               skip_reason: 'Lead respondeu antes do follow-up',
             })
             .eq('id', execution.id);
 
           results.push({ id: execution.id, status: 'skipped', reason: 'lead_responded' });
           continue;
         }
 
         // Build message with variables
         const messageTemplate = execution.original_message || rule?.message_template || '';
         
         // Get agent info for variables
         const { data: agent } = await supabase
           .from('avivar_agents')
           .select('company_name, professional_name')
           .eq('user_id', execution.user_id)
           .eq('is_active', true)
           .limit(1)
           .single();
 
         const variables: Record<string, string> = {
           nome: lead.name || '',
           primeiro_nome: getFirstName(lead.name),
           procedimento: lead.procedure_interest || 'nossos procedimentos',
           empresa: agent?.company_name || '',
           profissional: agent?.professional_name || '',
           data_contato: new Date().toLocaleDateString('pt-BR'),
           horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
           dia_semana: new Date().toLocaleDateString('pt-BR', { weekday: 'long' }),
         };
 
         let finalMessage = replaceVariables(messageTemplate, variables);
 
         // If AI generation is enabled, enhance the message
         if (rule?.use_ai_generation && execution.ai_generated) {
           try {
             const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
               method: "POST",
               headers: {
                 Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
                 "Content-Type": "application/json",
               },
               body: JSON.stringify({
                 model: "google/gemini-3-flash-preview",
                 messages: [
                   {
                     role: "system",
                     content: `Você é um assistente de vendas profissional. Personalize esta mensagem de follow-up mantendo o mesmo tom e intenção, mas tornando-a mais natural e pessoal. Mantenha curta (máximo 2 frases). Contexto: ${rule.ai_context || 'Follow-up de vendas'}. Nome do lead: ${lead.name}. Procedimento de interesse: ${lead.procedure_interest || 'não especificado'}.`,
                   },
                   {
                     role: "user",
                     content: `Personalize esta mensagem: "${finalMessage}"`,
                   },
                 ],
                 max_tokens: 150,
               }),
             });
 
             if (aiResponse.ok) {
               const aiData = await aiResponse.json();
               const aiMessage = aiData.choices?.[0]?.message?.content;
               if (aiMessage) {
                 finalMessage = aiMessage.trim().replace(/^["']|["']$/g, '');
               }
             }
           } catch (aiError) {
             console.error('AI enhancement error:', aiError);
             // Continue with original message
           }
         }
 
         // Send the message via WhatsApp
         const sendResponse = await supabase.functions.invoke('avivar-send-message', {
           body: {
             conversationId: conversation.id,
             content: finalMessage,
           },
         });
 
         if (sendResponse.error || !sendResponse.data?.success) {
           // Mark as failed
           await supabase
             .from('avivar_followup_executions')
             .update({
               status: 'failed',
               error_message: sendResponse.error?.message || sendResponse.data?.error || 'Falha ao enviar',
               final_message: finalMessage,
             })
             .eq('id', execution.id);
 
           // Create task if configured
           if (rule?.create_task_on_failure) {
             await supabase.from('lead_tasks').insert({
               lead_id: lead.id,
               user_id: execution.user_id,
               title: `Follow-up falhou: ${lead.name}`,
               description: `A tentativa ${execution.attempt_number} de follow-up falhou. Verifique manualmente.`,
               due_at: new Date().toISOString(),
               priority: 'high',
             });
           }
 
           results.push({ id: execution.id, status: 'failed', error: sendResponse.error?.message });
           continue;
         }
 
         // Success - update execution
         await supabase
           .from('avivar_followup_executions')
           .update({
             status: 'sent',
             sent_at: new Date().toISOString(),
             final_message: finalMessage,
           })
           .eq('id', execution.id);
 
         // Move lead to column if configured
         if (rule?.move_to_column_id) {
           // Find kanban lead by phone
           const { data: kanbanLead } = await supabase
             .from('avivar_kanban_leads')
             .select('id')
             .eq('phone', lead.phone)
             .eq('user_id', execution.user_id)
             .limit(1)
             .single();
 
           if (kanbanLead) {
             await supabase
               .from('avivar_kanban_leads')
               .update({ column_id: rule.move_to_column_id })
               .eq('id', kanbanLead.id);
           }
         }
 
         // Schedule next follow-up if max attempts not reached
         if (rule && execution.attempt_number < (rule.max_attempts || 3)) {
           // Find next rule
           const { data: nextRule } = await supabase
             .from('avivar_followup_rules')
             .select('*')
             .eq('user_id', execution.user_id)
             .eq('is_active', true)
             .eq('attempt_number', execution.attempt_number + 1)
             .limit(1)
             .single();
 
           if (nextRule) {
             const nextScheduledFor = new Date(Date.now() + nextRule.delay_minutes * 60 * 1000);
 
             await supabase.from('avivar_followup_executions').insert({
               user_id: execution.user_id,
               rule_id: nextRule.id,
               conversation_id: conversation.id,
               lead_id: lead.id,
               lead_name: lead.name,
               lead_phone: lead.phone,
               attempt_number: execution.attempt_number + 1,
               scheduled_for: nextScheduledFor.toISOString(),
               original_message: nextRule.message_template,
               ai_generated: nextRule.use_ai_generation,
             });
           }
         }
 
         results.push({ id: execution.id, status: 'sent', message: finalMessage });
 
       } catch (execError) {
         console.error(`Error processing execution ${execution.id}:`, execError);
         
         await supabase
           .from('avivar_followup_executions')
           .update({
             status: 'failed',
             error_message: execError instanceof Error ? execError.message : 'Erro desconhecido',
           })
           .eq('id', execution.id);
 
         results.push({ id: execution.id, status: 'error', error: String(execError) });
       }
     }
 
     return new Response(
       JSON.stringify({ 
         success: true, 
         processed: results.length,
         results 
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
 
   } catch (error) {
     console.error('Process followups error:', error);
     return new Response(
       JSON.stringify({ 
         success: false, 
         error: error instanceof Error ? error.message : 'Erro desconhecido' 
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
     );
   }
 });