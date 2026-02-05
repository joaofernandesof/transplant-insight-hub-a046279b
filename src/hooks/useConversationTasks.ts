 /**
  * useConversationTasks - Hook para gerenciar tarefas de uma conversa/lead
  * Busca tarefas pendentes e permite criar, completar e deletar
  */
 
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 
 export interface ConversationTask {
   id: string;
   lead_id: string;
   title: string;
   description: string | null;
   due_at: string | null;
   completed_at: string | null;
   priority: 'low' | 'medium' | 'high';
   assigned_to: string | null;
   created_by: string | null;
   created_at: string;
   updated_at: string;
 }
 
 export interface CreateConversationTaskData {
   lead_id: string;
   title: string;
   due_at: string;
   assigned_to: string;
 }
 
export interface UpdateConversationTaskData {
  id: string;
  title: string;
  due_at: string;
  assigned_to: string;
}

 export function useConversationTasks(leadId?: string) {
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   // Buscar tarefas pendentes do lead
   const { data: tasks = [], isLoading } = useQuery({
     queryKey: ['conversation-tasks', leadId],
     queryFn: async () => {
       if (!leadId) return [];
       
       const { data, error } = await supabase
         .from('lead_tasks')
         .select('*')
         .eq('lead_id', leadId)
         .is('completed_at', null)
         .order('due_at', { ascending: true, nullsFirst: false });
 
       if (error) throw error;
       return data as ConversationTask[];
     },
     enabled: !!leadId,
   });
 
   // Criar nova tarefa
   const createTask = useMutation({
     mutationFn: async (data: CreateConversationTaskData) => {
       const { data: newTask, error } = await supabase
         .from('lead_tasks')
         .insert({
           lead_id: data.lead_id,
           title: data.title,
           due_at: data.due_at,
           assigned_to: data.assigned_to,
           priority: 'medium',
           created_by: user?.id,
         })
         .select()
         .single();
 
       if (error) throw error;
       return newTask as ConversationTask;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['conversation-tasks'] });
       toast.success('Tarefa criada. A gente te lembra.');
     },
     onError: () => {
       toast.error('Erro ao criar tarefa');
     },
   });
 
   // Completar tarefa
   const completeTask = useMutation({
     mutationFn: async (taskId: string) => {
       const { error } = await supabase
         .from('lead_tasks')
         .update({ completed_at: new Date().toISOString() })
         .eq('id', taskId);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['conversation-tasks'] });
       toast.success('Tarefa concluída!');
     },
     onError: () => {
       toast.error('Erro ao concluir tarefa');
     },
   });
 
  // Atualizar tarefa existente
  const updateTask = useMutation({
    mutationFn: async (data: UpdateConversationTaskData) => {
      const { data: updated, error } = await supabase
        .from('lead_tasks')
        .update({
          title: data.title,
          due_at: data.due_at,
          assigned_to: data.assigned_to,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return updated as ConversationTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-tasks'] });
      toast.success('Tarefa atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar tarefa');
    },
  });

   // Deletar tarefa
   const deleteTask = useMutation({
     mutationFn: async (taskId: string) => {
       const { error } = await supabase
         .from('lead_tasks')
         .delete()
         .eq('id', taskId);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['conversation-tasks'] });
       toast.success('Tarefa removida');
     },
     onError: () => {
       toast.error('Erro ao remover tarefa');
     },
   });
 
   return {
     tasks,
     isLoading,
     createTask,
    updateTask,
     completeTask,
     deleteTask,
   };
 }