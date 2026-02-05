 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
import { useEffect, useRef } from 'react';
 
 export interface FollowupExecution {
   id: string;
   user_id: string;
   rule_id: string | null;
   conversation_id: string | null;
   lead_id: string | null;
   lead_name: string | null;
   lead_phone: string | null;
   attempt_number: number;
   status: 'scheduled' | 'pending' | 'sent' | 'delivered' | 'read' | 'responded' | 'failed' | 'cancelled' | 'skipped';
   scheduled_for: string;
   sent_at: string | null;
   delivered_at: string | null;
   read_at: string | null;
   responded_at: string | null;
   original_message: string | null;
   final_message: string | null;
   ai_generated: boolean;
   channel: string;
   error_message: string | null;
   skip_reason: string | null;
   created_at: string;
   updated_at: string;
 }
 
 export interface FollowupStats {
   total_scheduled: number;
   today_scheduled: number;
   tomorrow_scheduled: number;
   pending_now: number;
   success_rate: number | null;
   avg_response_time_minutes: number | null;
   by_status: {
     scheduled: number;
     pending: number;
     sent: number;
     delivered: number;
     read: number;
     responded: number;
     failed: number;
   };
 }
 
 export function useFollowupExecutions() {
   const { user } = useAuth();
   const queryClient = useQueryClient();
  const processorCalledRef = useRef(false);

  // Process pending followups on mount (acts as a "cron" when user visits the page)
  useEffect(() => {
    if (!user?.id || processorCalledRef.current) return;
    processorCalledRef.current = true;

    // Call the processor in background to handle any pending followups
    supabase.functions.invoke('avivar-process-followups', { body: {} })
      .then(({ data, error }) => {
        if (error) {
          console.error('[Followup] Processor error:', error);
        } else if (data?.processed > 0) {
          console.log(`[Followup] Processed ${data.processed} followup(s)`);
          queryClient.invalidateQueries({ queryKey: ['followup-executions'] });
          queryClient.invalidateQueries({ queryKey: ['followup-history'] });
          queryClient.invalidateQueries({ queryKey: ['followup-stats'] });
        }
      })
      .catch(err => console.error('[Followup] Processor call failed:', err));
  }, [user?.id, queryClient]);

  // Poll processor every 60 seconds while user is on the page
  useEffect(() => {
    if (!user?.id) return;

    const intervalId = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('avivar-process-followups', { body: {} });
        if (error) {
          console.error('[Followup] Polling processor error:', error);
          return;
        }
        if (data?.processed > 0) {
          console.log(`[Followup] Polled and processed ${data.processed} followup(s)`);
          queryClient.invalidateQueries({ queryKey: ['followup-executions'] });
          queryClient.invalidateQueries({ queryKey: ['followup-history'] });
          queryClient.invalidateQueries({ queryKey: ['followup-stats'] });
        }
      } catch (err) {
        console.error('[Followup] Polling error:', err);
      }
    }, 60000); // Every 60 seconds

    return () => clearInterval(intervalId);
  }, [user?.id, queryClient]);
 
   // Get scheduled/pending executions
   const { data: executions = [], isLoading: isLoadingExecutions } = useQuery({
     queryKey: ['followup-executions', user?.id],
     queryFn: async () => {
       if (!user?.id) return [];
 
       const { data, error } = await supabase
         .from('avivar_followup_executions')
         .select('*')
         .eq('user_id', user.id)
         .in('status', ['scheduled', 'pending'])
         .order('scheduled_for', { ascending: true })
         .limit(50);
 
       if (error) throw error;
       return data as FollowupExecution[];
     },
     enabled: !!user?.id,
   });
 
   // Get history (sent, responded, failed)
   const { data: history = [], isLoading: isLoadingHistory } = useQuery({
     queryKey: ['followup-history', user?.id],
     queryFn: async () => {
       if (!user?.id) return [];
 
       const { data, error } = await supabase
         .from('avivar_followup_executions')
         .select('*')
         .eq('user_id', user.id)
         .in('status', ['sent', 'delivered', 'read', 'responded', 'failed', 'skipped'])
         .order('sent_at', { ascending: false })
         .limit(50);
 
       if (error) throw error;
       return data as FollowupExecution[];
     },
     enabled: !!user?.id,
   });
 
   // Get stats using the database function
   const { data: stats, isLoading: isLoadingStats } = useQuery({
     queryKey: ['followup-stats', user?.id],
     queryFn: async () => {
       if (!user?.id) return null;
 
       const { data, error } = await supabase
         .rpc('get_followup_stats', { p_user_id: user.id });
 
       if (error) throw error;
       return data?.[0] as FollowupStats | null;
     },
     enabled: !!user?.id,
   });
 
   // Realtime subscription
   useEffect(() => {
     if (!user?.id) return;
 
     const channel = supabase
       .channel('followup-executions-realtime')
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'avivar_followup_executions',
           filter: `user_id=eq.${user.id}`,
         },
         () => {
           queryClient.invalidateQueries({ queryKey: ['followup-executions'] });
           queryClient.invalidateQueries({ queryKey: ['followup-history'] });
           queryClient.invalidateQueries({ queryKey: ['followup-stats'] });
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [user?.id, queryClient]);
 
   // Cancel a scheduled execution
   const cancelExecution = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('avivar_followup_executions')
         .update({ status: 'cancelled', skip_reason: 'Cancelado manualmente' })
         .eq('id', id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['followup-executions'] });
       queryClient.invalidateQueries({ queryKey: ['followup-stats'] });
       toast.success('Follow-up cancelado');
     },
     onError: () => {
       toast.error('Erro ao cancelar follow-up');
     },
   });
 
   // Send follow-up now (trigger immediately)
   const sendNow = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('avivar_followup_executions')
         .update({ status: 'pending', scheduled_for: new Date().toISOString() })
         .eq('id', id);
 
       if (error) throw error;
 
       // Trigger the edge function to process pending followups
       await supabase.functions.invoke('avivar-process-followups', {
         body: { executionId: id },
       });
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['followup-executions'] });
       toast.success('Follow-up enviado!');
     },
     onError: () => {
       toast.error('Erro ao enviar follow-up');
     },
   });
 
   // Reschedule execution
   const reschedule = useMutation({
     mutationFn: async ({ id, scheduled_for }: { id: string; scheduled_for: string }) => {
       const { error } = await supabase
         .from('avivar_followup_executions')
         .update({ scheduled_for, status: 'scheduled' })
         .eq('id', id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['followup-executions'] });
       toast.success('Follow-up reagendado!');
     },
     onError: () => {
       toast.error('Erro ao reagendar');
     },
   });
 
   return {
     executions,
     history,
     stats,
     isLoadingExecutions,
     isLoadingHistory,
     isLoadingStats,
     cancelExecution,
     sendNow,
     reschedule,
   };
 }