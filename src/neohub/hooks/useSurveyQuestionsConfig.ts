import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SurveyQuestionConfig {
  id: string;
  question_key: string;
  question_label: string;
  question_type: 'select' | 'text' | 'boolean' | 'scale';
  category: 'instructor' | 'monitor' | 'infrastructure' | 'profile' | 'general';
  options: string[] | null;
  order_index: number;
  is_visible: boolean;
  is_required: boolean;
  target_person: string | null;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  general: { label: 'Geral', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  instructor: { label: 'Professores', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  monitor: { label: 'Monitores', color: 'text-violet-700', bgColor: 'bg-violet-100' },
  infrastructure: { label: 'Infraestrutura', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  profile: { label: 'Perfil do Aluno', color: 'text-rose-700', bgColor: 'bg-rose-100' },
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  select: 'Múltipla escolha',
  text: 'Texto livre',
  boolean: 'Sim/Não',
  scale: 'Escala numérica',
};

export function useSurveyQuestionsConfig() {
  const queryClient = useQueryClient();

  const { data: questions, isLoading, error } = useQuery({
    queryKey: ['survey-questions-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('survey_questions_config')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as SurveyQuestionConfig[];
    },
  });

  const updateQuestion = useMutation({
    mutationFn: async (updates: Partial<SurveyQuestionConfig> & { id: string }) => {
      const { id, ...updateData } = updates;
      const { data, error } = await supabase
        .from('survey_questions_config')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-questions-config'] });
      toast.success('Pergunta atualizada!');
    },
    onError: (error) => {
      console.error('Error updating question:', error);
      toast.error('Erro ao atualizar pergunta');
    },
  });

  const reorderQuestions = useMutation({
    mutationFn: async (reorderedQuestions: { id: string; order_index: number }[]) => {
      const promises = reorderedQuestions.map(({ id, order_index }) =>
        supabase
          .from('survey_questions_config')
          .update({ order_index, updated_at: new Date().toISOString() })
          .eq('id', id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-questions-config'] });
      toast.success('Ordem atualizada!');
    },
    onError: (error) => {
      console.error('Error reordering questions:', error);
      toast.error('Erro ao reordenar perguntas');
    },
  });

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { data, error } = await supabase
        .from('survey_questions_config')
        .update({ is_visible, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['survey-questions-config'] });
      toast.success(data.is_visible ? 'Pergunta visível' : 'Pergunta oculta');
    },
    onError: (error) => {
      console.error('Error toggling visibility:', error);
      toast.error('Erro ao alterar visibilidade');
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('survey_questions_config')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-questions-config'] });
      toast.success('Pergunta excluída!');
    },
    onError: (error) => {
      console.error('Error deleting question:', error);
      toast.error('Erro ao excluir pergunta');
    },
  });

  const createQuestion = useMutation({
    mutationFn: async (newQuestion: Omit<SurveyQuestionConfig, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('survey_questions_config')
        .insert(newQuestion)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-questions-config'] });
      toast.success('Pergunta criada!');
    },
    onError: (error) => {
      console.error('Error creating question:', error);
      toast.error('Erro ao criar pergunta');
    },
  });

  return {
    questions: questions || [],
    isLoading,
    error,
    updateQuestion,
    reorderQuestions,
    toggleVisibility,
    deleteQuestion,
    createQuestion,
  };
}
