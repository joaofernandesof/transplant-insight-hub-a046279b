/**
 * useFlowComments - Hook para gerenciamento de comentários
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FlowTaskComment } from "@/types/flow";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

export function useFlowComments(taskId?: string) {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();

  // Buscar comentários da tarefa
  const commentsQuery = useQuery({
    queryKey: ['flow-comments', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      
      const { data, error } = await supabase
        .from('flow_task_comments')
        .select(`
          *,
          author:neohub_users!flow_task_comments_author_id_fkey(id, full_name, email, avatar_url)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as FlowTaskComment[];
    },
    enabled: !!taskId,
  });

  // Adicionar comentário
  const addMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!taskId || !user?.id) throw new Error("Tarefa ou usuário não definido");

      const { data, error } = await supabase
        .from('flow_task_comments')
        .insert({
          task_id: taskId,
          author_id: user.id,
          content,
        })
        .select(`
          *,
          author:neohub_users!flow_task_comments_author_id_fkey(id, full_name, email, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-comments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['flow-task', taskId] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao adicionar comentário", { description: error.message });
    },
  });

  // Deletar comentário
  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('flow_task_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-comments', taskId] });
      toast.success("Comentário excluído");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir comentário", { description: error.message });
    },
  });

  return {
    comments: commentsQuery.data || [],
    isLoading: commentsQuery.isLoading,
    addComment: addMutation.mutate,
    deleteComment: deleteMutation.mutate,
    isAdding: addMutation.isPending,
  };
}
