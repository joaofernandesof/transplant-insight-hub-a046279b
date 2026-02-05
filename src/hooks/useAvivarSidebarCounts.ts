 /**
  * useAvivarSidebarCounts - Hook para contadores dinâmicos da sidebar Avivar
  * Busca: chats sem resposta, tarefas atrasadas
  */
 
 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { isPast } from 'date-fns';
 
 export interface AvivarSidebarCounts {
   unreadChats: number;
   overdueTasks: number;
 }
 
 export function useAvivarSidebarCounts() {
   const { user } = useAuth();
 
   const { data: counts, isLoading } = useQuery({
     queryKey: ['avivar-sidebar-counts', user?.id],
     queryFn: async (): Promise<AvivarSidebarCounts> => {
       if (!user?.id) return { unreadChats: 0, overdueTasks: 0 };
 
      // Buscar conversas com mensagens não respondidas (unread_count > 0)
      // NOTE: crm_conversations não possui coluna user_id; a visibilidade deve ser controlada por RLS.
      const { data: conversations, error: convError } = await (supabase as any)
        .from('crm_conversations')
        .select('unread_count')
        .gt('unread_count', 0);
 
       if (convError) console.error('Erro ao buscar conversas:', convError);
 
       const unreadChats = conversations?.length || 0;
 
       // Buscar tarefas pendentes com data vencida
      const { data: tasks, error: tasksError } = await (supabase as any)
         .from('lead_tasks')
         .select('id, due_at, completed_at')
         .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
         .is('completed_at', null);
 
       if (tasksError) console.error('Erro ao buscar tarefas:', tasksError);
 
       const overdueTasks = (tasks || []).filter(t => 
         t.due_at && isPast(new Date(t.due_at))
       ).length;
 
       return { unreadChats, overdueTasks };
     },
     enabled: !!user?.id,
     refetchInterval: 30000, // Atualiza a cada 30 segundos
     staleTime: 10000,
   });
 
   return {
     counts: counts || { unreadChats: 0, overdueTasks: 0 },
     isLoading,
   };
 }