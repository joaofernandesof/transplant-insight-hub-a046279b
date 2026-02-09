 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { useAvivarAccount } from '@/hooks/useAvivarAccount';
 import { toast } from 'sonner';
 
export interface FollowupRule {
  id: string;
  user_id: string;
  name: string;
  attempt_number: number;
  delay_minutes: number;
  delay_type: 'minutes' | 'hours' | 'days';
  message_template: string;
  urgency_level: 'soft' | 'medium' | 'urgent';
  use_ai_generation: boolean;
  ai_context: string | null;
  is_active: boolean;
  target_kanban_id: string | null;
  move_to_column_id: string | null;
  create_task_on_failure: boolean;
  max_attempts: number;
  respect_business_hours: boolean;
  business_hours_start: string;
  business_hours_end: string;
  excluded_days: number[];
  order_index: number;
  // Audio fields
  audio_url: string | null;
  audio_type: 'ptt' | 'audio' | null;
  audio_forward: boolean;
  // Image fields
  image_url: string | null;
  image_caption: string | null;
  // Video fields
  video_url: string | null;
  video_caption: string | null;
  // Document fields
  document_url: string | null;
  document_name: string | null;
  // Scope fields
  applicable_kanban_ids: string[] | null;
  applicable_column_ids: string[] | null;
  created_at: string;
  updated_at: string;
}
 
export interface CreateFollowupRuleInput {
  name?: string;
  attempt_number: number;
  delay_minutes: number;
  delay_type?: 'minutes' | 'hours' | 'days';
  message_template: string;
  urgency_level?: 'soft' | 'medium' | 'urgent';
  use_ai_generation?: boolean;
  ai_context?: string;
  is_active?: boolean;
  target_kanban_id?: string;
  move_to_column_id?: string;
  create_task_on_failure?: boolean;
  max_attempts?: number;
  respect_business_hours?: boolean;
  business_hours_start?: string;
  business_hours_end?: string;
  excluded_days?: number[];
  // Audio fields
  audio_url?: string | null;
  audio_type?: 'ptt' | 'audio' | null;
  audio_forward?: boolean;
  // Image fields
  image_url?: string | null;
  image_caption?: string | null;
  // Video fields
  video_url?: string | null;
  video_caption?: string | null;
  // Document fields
  document_url?: string | null;
  document_name?: string | null;
}
 
 export function useFollowupRules() {
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   const { data: rules = [], isLoading } = useQuery({
     queryKey: ['followup-rules', user?.id],
     queryFn: async () => {
       if (!user?.id) return [];
       
       const { data, error } = await supabase
         .from('avivar_followup_rules')
         .select('*')
         .eq('user_id', user.id)
         .order('attempt_number', { ascending: true });
 
       if (error) throw error;
       return data as FollowupRule[];
     },
     enabled: !!user?.id,
   });
 
    const createRule = useMutation({
      mutationFn: async (input: CreateFollowupRuleInput) => {
        if (!user?.id) throw new Error('Usuário não autenticado');
        const { accountId: acctId } = await supabase
          .from('avivar_account_members')
          .select('account_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()
          .then(r => ({ accountId: r.data?.account_id }));

        if (!acctId) throw new Error('Conta não encontrada');

        const { data, error } = await supabase
          .from('avivar_followup_rules')
          .insert({
            user_id: user.id,
            account_id: acctId,
            ...input,
          })
          .select()
          .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['followup-rules'] });
       toast.success('Regra de follow-up criada!');
     },
     onError: () => {
       toast.error('Erro ao criar regra');
     },
   });
 
   const updateRule = useMutation({
     mutationFn: async ({ id, ...updates }: Partial<FollowupRule> & { id: string }) => {
       const { data, error } = await supabase
         .from('avivar_followup_rules')
         .update(updates)
         .eq('id', id)
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['followup-rules'] });
       toast.success('Regra atualizada!');
     },
     onError: () => {
       toast.error('Erro ao atualizar regra');
     },
   });
 
   const toggleRule = useMutation({
     mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
       const { error } = await supabase
         .from('avivar_followup_rules')
         .update({ is_active })
         .eq('id', id);
 
       if (error) throw error;
     },
     onSuccess: (_, { is_active }) => {
       queryClient.invalidateQueries({ queryKey: ['followup-rules'] });
       toast.success(is_active ? 'Regra ativada!' : 'Regra desativada!');
     },
     onError: () => {
       toast.error('Erro ao alterar status da regra');
     },
   });
 
   const deleteRule = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('avivar_followup_rules')
         .delete()
         .eq('id', id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['followup-rules'] });
       toast.success('Regra excluída!');
     },
     onError: () => {
       toast.error('Erro ao excluir regra');
     },
   });
 
   return {
     rules,
     isLoading,
     createRule,
     updateRule,
     toggleRule,
     deleteRule,
   };
 }