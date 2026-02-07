 /**
  * useAvivarTasks - Hook para gerenciar tarefas do Avivar
  * Busca tarefas de leads que pertencem ao usuário atual ou sua equipe
  */
 
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { isPast, isToday, startOfMonth } from 'date-fns';
 
interface LeadOption {
  id: string;
  name: string;
  phone: string | null;
  lead_code?: string;
}

async function fetchLeadsForTasks(userId: string): Promise<LeadOption[]> {
  // First get user's account_id
  const { data: accountId } = await supabase.rpc('get_user_avivar_account_id', { _user_id: userId });
  if (!accountId) return [];

  // Buscar leads do Kanban do Avivar filtrados por account_id
  const { data, error } = await supabase
    .from('avivar_kanban_leads')
    .select('id, name, phone, lead_code')
    .eq('account_id', accountId)
    .order('name');

  if (error) throw error;
  return ((data as any[]) || []).map((l: any) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    lead_code: l.lead_code,
  })) as LeadOption[];
}

 export interface AvivarTask {
   id: string;
   lead_id: string | null;
   title: string;
   description: string | null;
   due_at: string | null;
   completed_at: string | null;
   priority: 'low' | 'medium' | 'high';
   assigned_to: string | null;
   created_by: string | null;
   created_at: string;
   updated_at: string;
   // Joined data
   lead_name?: string;
   lead_phone?: string;
 }
 
 export interface CreateAvivarTaskData {
  lead_id?: string;
   title: string;
   description?: string;
   due_at?: string;
   priority?: 'low' | 'medium' | 'high';
   assigned_to?: string;
 }
 
 export interface AvivarTaskStats {
   pending: number;
   overdue: number;
   today: number;
   completedThisMonth: number;
 }
 
 export function useAvivarTasks() {
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   // Buscar tarefas do usuário/equipe
   const { data: tasks = [], isLoading } = useQuery({
     queryKey: ['avivar-tasks', user?.id],
     queryFn: async () => {
       if (!user?.id) return [];
 
       // Buscar tarefas com info do lead
       const { data, error } = await supabase
         .from('lead_tasks')
         .select(`
           *,
           leads (
             name,
             phone
           )
         `)
         .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
         .order('due_at', { ascending: true, nullsFirst: false });
 
       if (error) throw error;
       
       return (data || []).map((task: any) => ({
         ...task,
         lead_name: task.leads?.name,
         lead_phone: task.leads?.phone,
       })) as AvivarTask[];
     },
     enabled: !!user?.id,
   });
 
   // Buscar leads do usuário para seleção ao criar tarefa
  const { data: leads = [] } = useQuery({
    queryKey: ['avivar-leads-for-tasks', user?.id],
    queryFn: () => user?.id ? fetchLeadsForTasks(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
   });
 
   // Calcular stats
   const now = new Date();
   const monthStart = startOfMonth(now);
   
   const pendingTasks = tasks.filter(t => !t.completed_at);
   const overdueTasks = pendingTasks.filter(t => t.due_at && isPast(new Date(t.due_at)));
   const todayTasks = pendingTasks.filter(t => t.due_at && isToday(new Date(t.due_at)));
   const completedThisMonth = tasks.filter(t => 
     t.completed_at && new Date(t.completed_at) >= monthStart
   );
 
   const stats: AvivarTaskStats = {
     pending: pendingTasks.length,
     overdue: overdueTasks.length,
     today: todayTasks.length,
     completedThisMonth: completedThisMonth.length,
   };
 
   // Criar tarefa
   const createTask = useMutation({
   mutationFn: async (data: CreateAvivarTaskData) => {
      const insertData: any = {
        title: data.title,
        description: data.description,
        due_at: data.due_at,
        priority: data.priority || 'medium',
        assigned_to: data.assigned_to || user?.id,
        created_by: user?.id,
      };
      if (data.lead_id) insertData.lead_id = data.lead_id;

      const { data: newTask, error } = await supabase
         .from('lead_tasks')
         .insert(insertData)
         .select()
         .single();
 
       if (error) throw error;
       return newTask as AvivarTask;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['avivar-tasks'] });
       queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
       queryClient.invalidateQueries({ queryKey: ['conversation-tasks'] });
       toast.success('Tarefa criada com sucesso!');
     },
     onError: () => {
       toast.error('Erro ao criar tarefa');
     },
   });
 
   // Atualizar tarefa
   const updateTask = useMutation({
     mutationFn: async ({ id, ...data }: Partial<AvivarTask> & { id: string }) => {
       const { error } = await supabase
         .from('lead_tasks')
         .update({ ...data, updated_at: new Date().toISOString() })
         .eq('id', id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['avivar-tasks'] });
       queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
       queryClient.invalidateQueries({ queryKey: ['conversation-tasks'] });
       toast.success('Tarefa atualizada!');
     },
     onError: () => {
       toast.error('Erro ao atualizar tarefa');
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
       queryClient.invalidateQueries({ queryKey: ['avivar-tasks'] });
       queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
       queryClient.invalidateQueries({ queryKey: ['conversation-tasks'] });
       toast.success('Tarefa concluída!');
     },
     onError: () => {
       toast.error('Erro ao concluir tarefa');
     },
   });
 
   // Reabrir tarefa
   const reopenTask = useMutation({
     mutationFn: async (taskId: string) => {
       const { error } = await supabase
         .from('lead_tasks')
         .update({ completed_at: null })
         .eq('id', taskId);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['avivar-tasks'] });
       queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
       queryClient.invalidateQueries({ queryKey: ['conversation-tasks'] });
       toast.success('Tarefa reaberta!');
     },
     onError: () => {
       toast.error('Erro ao reabrir tarefa');
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
       queryClient.invalidateQueries({ queryKey: ['avivar-tasks'] });
       queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
       queryClient.invalidateQueries({ queryKey: ['conversation-tasks'] });
       toast.success('Tarefa removida');
     },
     onError: () => {
       toast.error('Erro ao remover tarefa');
     },
   });
 
   return {
     tasks,
     leads,
     pendingTasks,
     overdueTasks,
     todayTasks,
     completedThisMonth,
     stats,
     isLoading,
     createTask,
     updateTask,
     completeTask,
     reopenTask,
     deleteTask,
   };
 }