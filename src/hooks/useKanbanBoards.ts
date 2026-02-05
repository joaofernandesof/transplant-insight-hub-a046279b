 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 
 export interface KanbanBoard {
   id: string;
   user_id: string;
   name: string;
   description: string | null;
   icon: string | null;
   color: string | null;
   order_index: number | null;
   is_active: boolean | null;
   created_at: string;
   updated_at: string;
 }
 
 export interface KanbanColumn {
   id: string;
   kanban_id: string;
   name: string;
   color: string | null;
   order_index: number;
   ai_instruction: string | null;
   created_at: string;
   updated_at: string;
 }
 
 export function useKanbanBoards() {
   const { user } = useAuth();
 
   const { data: boards = [], isLoading: isLoadingBoards } = useQuery({
     queryKey: ['kanban-boards', user?.id],
     queryFn: async () => {
       if (!user?.id) return [];
 
       const { data, error } = await supabase
         .from('avivar_kanbans')
         .select('*')
         .eq('user_id', user.id)
         .eq('is_active', true)
         .order('order_index', { ascending: true });
 
       if (error) throw error;
       return data as KanbanBoard[];
     },
     enabled: !!user?.id,
   });
 
   const { data: columns = [], isLoading: isLoadingColumns } = useQuery({
     queryKey: ['kanban-columns', user?.id],
     queryFn: async () => {
       if (!user?.id) return [];
 
       const { data, error } = await supabase
         .from('avivar_kanban_columns')
         .select('*, kanban:avivar_kanbans!inner(user_id)')
         .eq('kanban.user_id', user.id)
         .order('order_index', { ascending: true });
 
       if (error) throw error;
       return (data || []).map(({ kanban, ...col }) => col) as KanbanColumn[];
     },
     enabled: !!user?.id,
   });
 
   return {
     boards,
     columns,
     isLoading: isLoadingBoards || isLoadingColumns,
   };
 }