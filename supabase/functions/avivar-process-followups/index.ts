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
       // Atomically claim this execution to prevent race conditions
       const { data: claimed, error: claimError } = await supabase
         .from('avivar_followup_executions')
         .update({ status: 'processing' })
         .eq('id', executionId)
         .in('status', ['pending', 'scheduled'])
         .select(`
          *,
          rule:avivar_followup_rules(*),
          conversation:crm_conversations(
            id,
            lead:leads(id, name, phone, email, procedure_interest, language)
           )
         `);
       
       if (claimError) {
         console.error('Error claiming execution:', claimError);
         return new Response(
           JSON.stringify({ success: false, error: claimError.message }),
           { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
         );
     }
       
       executions = claimed || [];
       console.log(`[Followup] Claimed specific execution: ${executionId}, found: ${executions.length}`);
     } else {
       // Fetch IDs first, then atomically claim them one by one
       const { data: pendingIds, error: fetchError } = await supabase
         .from('avivar_followup_executions')
         .select('id')
         .in('status', ['pending', 'scheduled'])
         .lte('scheduled_for', new Date().toISOString())
         .order('scheduled_for', { ascending: true })
         .limit(10);
       
       if (fetchError) {
         console.error('Error fetching pending executions:', fetchError);
         return new Response(
           JSON.stringify({ success: false, error: fetchError.message }),
           { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
         );
       }
       
       // Atomically claim each execution to prevent race conditions
       for (const pending of pendingIds || []) {
         const { data: claimed, error: claimError } = await supabase
           .from('avivar_followup_executions')
           .update({ status: 'processing' })
           .eq('id', pending.id)
           .in('status', ['pending', 'scheduled']) // Only claim if still pending
           .select(`
             *,
             rule:avivar_followup_rules(*),
             conversation:crm_conversations(
               id,
               lead:leads(id, name, phone, email, procedure_interest)
             )
           `);
         
         if (!claimError && claimed && claimed.length > 0) {
           executions.push(claimed[0]);
         }
       }
       
       console.log(`[Followup] Claimed ${executions.length} executions out of ${pendingIds?.length || 0} pending`);
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

          console.log(`[Followup] Processing execution ${execution.id} for lead ${lead.name}`);
 
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

          // If AI generation is enabled, enhance the message ONLY if template is generic
          // If user provided a specific template, respect it and only do minor personalization
          const shouldUseAI = rule?.use_ai_generation && execution.ai_generated;
          
          if (shouldUseAI && finalMessage.length > 0) {
            try {
              // Check if the template is very short (user wants AI to generate more)
              // or if it's detailed (user wants exact message with variables replaced)
              const isShortTemplate = messageTemplate.length < 50;
              
              const aiPrompt = isShortTemplate
                ? `Você é um assistente de vendas profissional. Crie uma mensagem de follow-up natural e amigável baseada nesta ideia: "${finalMessage}". Contexto: ${rule.ai_context || 'Follow-up de vendas'}. Nome do lead: ${lead.name}. Mantenha curta (máximo 2 frases). NÃO use aspas na resposta.`
                : `Você é um assistente. O usuário configurou esta mensagem EXATA para follow-up: "${finalMessage}". Faça APENAS pequenas variações naturais mantendo a estrutura e intenção idênticas. Mude no máximo 1-2 palavras para parecer mais natural. NÃO mude o sentido. NÃO adicione informações. Responda APENAS com a mensagem final, sem aspas.`;
              
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
                      content: aiPrompt,
                    },
                    {
                      role: "user",
                      content: isShortTemplate 
                        ? `Gere a mensagem de follow-up agora.`
                        : `Retorne a mensagem com variação mínima.`,
                    },
                  ],
                  max_tokens: 150,
                  temperature: isShortTemplate ? 0.7 : 0.2, // Lower temperature for exact messages
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

          // Translate message if lead's language is not pt-BR
          const leadLanguage = lead.language || 'pt-BR';
          if (leadLanguage !== 'pt-BR' && finalMessage.length > 0) {
            try {
              console.log(`[Followup] Translating message to ${leadLanguage} for lead ${lead.name}`);
              const translateResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                      content: `Traduza a seguinte mensagem para o idioma "${leadLanguage}". Mantenha o tom, emojis e formatação. Responda APENAS com a tradução, sem explicações.`,
                    },
                    { role: "user", content: finalMessage },
                  ],
                  max_tokens: 300,
                  temperature: 0.1,
                }),
              });

              if (translateResponse.ok) {
                const translateData = await translateResponse.json();
                const translated = translateData.choices?.[0]?.message?.content;
                if (translated && translated.trim()) {
                  finalMessage = translated.trim().replace(/^["']|["']$/g, '');
                  console.log(`[Followup] Message translated successfully to ${leadLanguage}`);
                }
              }
            } catch (translateError) {
              console.error('[Followup] Translation error, sending in Portuguese:', translateError);
              // Fallback: send in Portuguese (current behavior)
            }
          }
 
        // Send the message via WhatsApp
        // Check if rule has media attachments
        const hasAudio = rule?.audio_url && rule?.audio_type;
        const hasImage = rule?.image_url;
        const hasVideo = rule?.video_url;
        const hasDocument = rule?.document_url;
        const hasMedia = hasAudio || hasImage || hasVideo || hasDocument;
        
        let sendResponse;
        
        // IMPORTANT: If there's BOTH text AND media, send them as SEPARATE messages
        // First send the text, then send the media
        if (hasMedia && finalMessage && finalMessage.trim().length > 0) {
          // Step 1: Send text message FIRST (separately)
          console.log(`[Followup] Sending text message first: "${finalMessage.substring(0, 50)}..."`);
          const textResponse = await supabase.functions.invoke('avivar-send-message', {
            body: {
              conversationId: conversation.id,
              content: finalMessage,
            },
          });
          
          if (textResponse.error || !textResponse.data?.success) {
            console.error('[Followup] Failed to send text message:', textResponse.error);
          } else {
            console.log('[Followup] Text message sent successfully');
          }
          
          // Small delay to ensure messages arrive in order
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Step 2: Send media message (WITHOUT the text content)
          if (hasAudio) {
            console.log(`[Followup] Sending audio message: ${rule.audio_type}`);
            sendResponse = await supabase.functions.invoke('avivar-send-message', {
              body: {
                conversationId: conversation.id,
                mediaType: 'audio',
                mediaUrl: rule.audio_url,
                audioType: rule.audio_type,
                audioForward: rule.audio_forward || false,
              },
            });
          } else if (hasImage) {
            console.log(`[Followup] Sending image message`);
            sendResponse = await supabase.functions.invoke('avivar-send-message', {
              body: {
                conversationId: conversation.id,
                mediaType: 'image',
                mediaUrl: rule.image_url,
                caption: rule.image_caption || undefined,
              },
            });
          } else if (hasVideo) {
            console.log(`[Followup] Sending video message`);
            sendResponse = await supabase.functions.invoke('avivar-send-message', {
              body: {
                conversationId: conversation.id,
                mediaType: 'video',
                mediaUrl: rule.video_url,
                caption: rule.video_caption || undefined,
              },
            });
          } else if (hasDocument) {
            console.log(`[Followup] Sending document message`);
            sendResponse = await supabase.functions.invoke('avivar-send-message', {
              body: {
                conversationId: conversation.id,
                mediaType: 'document',
                mediaUrl: rule.document_url,
                documentName: rule.document_name || undefined,
              },
            });
          }
        } else if (hasAudio) {
          // Only audio, no text
          sendResponse = await supabase.functions.invoke('avivar-send-message', {
            body: {
              conversationId: conversation.id,
              mediaType: 'audio',
              mediaUrl: rule.audio_url,
              audioType: rule.audio_type,
              audioForward: rule.audio_forward || false,
            },
          });
        } else if (hasImage) {
          // Only image (with optional caption)
          sendResponse = await supabase.functions.invoke('avivar-send-message', {
            body: {
              conversationId: conversation.id,
              mediaType: 'image',
              mediaUrl: rule.image_url,
              caption: rule.image_caption || undefined,
            },
          });
        } else if (hasVideo) {
          // Only video (with optional caption)
          sendResponse = await supabase.functions.invoke('avivar-send-message', {
            body: {
              conversationId: conversation.id,
              mediaType: 'video',
              mediaUrl: rule.video_url,
              caption: rule.video_caption || undefined,
            },
          });
        } else if (hasDocument) {
          // Only document
          sendResponse = await supabase.functions.invoke('avivar-send-message', {
            body: {
              conversationId: conversation.id,
              mediaType: 'document',
              mediaUrl: rule.document_url,
              documentName: rule.document_name || undefined,
            },
          });
        } else {
          // Text only
          sendResponse = await supabase.functions.invoke('avivar-send-message', {
            body: {
              conversationId: conversation.id,
              content: finalMessage,
            },
          });
        }

        // Check if sendResponse is defined and has success
        if (!sendResponse || sendResponse.error || !sendResponse.data?.success) {
          // Mark as failed
          await supabase
            .from('avivar_followup_executions')
            .update({
              status: 'failed',
              error_message: sendResponse?.error?.message || sendResponse?.data?.error || 'Falha ao enviar',
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

          results.push({ id: execution.id, status: 'failed', error: sendResponse?.error?.message });
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

              const { error: nextInsertError } = await supabase.from('avivar_followup_executions').insert({
                account_id: execution.account_id,
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
                channel: 'whatsapp',
              });

              if (nextInsertError) {
                console.error(`[Followup] Error scheduling next follow-up (attempt ${execution.attempt_number + 1}):`, nextInsertError);
              } else {
                console.log(`[Followup] Scheduled next follow-up (attempt ${execution.attempt_number + 1}) for ${nextScheduledFor.toISOString()}`);
              }
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