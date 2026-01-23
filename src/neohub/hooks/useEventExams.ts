import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClassExam {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  passing_score: number | null;
  available_from: string | null;
  available_until: string | null;
  is_active: boolean;
  class_id: string | null;
  question_count: number;
  attempt_count: number;
  pass_count: number;
}

export function useEventExams(classId: string | null) {
  const queryClient = useQueryClient();

  const { data: exams, isLoading } = useQuery({
    queryKey: ["event-exams", classId],
    queryFn: async (): Promise<ClassExam[]> => {
      if (!classId) return [];

      // Get exams linked to this class
      const { data: linkedExams, error } = await supabase
        .from("exams")
        .select(`
          id, title, description, duration_minutes, passing_score,
          available_from, available_until, is_active, class_id
        `)
        .eq("class_id", classId);

      if (error) throw error;

      // Get question counts and attempt stats
      const examIds = (linkedExams || []).map(e => e.id);
      
      const [questionsData, attemptsData] = await Promise.all([
        supabase
          .from("exam_questions")
          .select("exam_id")
          .in("exam_id", examIds),
        supabase
          .from("exam_attempts")
          .select("exam_id, status")
          .in("exam_id", examIds)
          .neq("status", "in_progress"),
      ]);

      const questionCounts = new Map<string, number>();
      (questionsData.data || []).forEach(q => {
        questionCounts.set(q.exam_id, (questionCounts.get(q.exam_id) || 0) + 1);
      });

      const attemptCounts = new Map<string, { total: number; passed: number }>();
      (attemptsData.data || []).forEach(a => {
        if (!attemptCounts.has(a.exam_id)) {
          attemptCounts.set(a.exam_id, { total: 0, passed: 0 });
        }
        attemptCounts.get(a.exam_id)!.total++;
        if (a.status === "passed") {
          attemptCounts.get(a.exam_id)!.passed++;
        }
      });

      return (linkedExams || []).map(exam => ({
        ...exam,
        question_count: questionCounts.get(exam.id) || 0,
        attempt_count: attemptCounts.get(exam.id)?.total || 0,
        pass_count: attemptCounts.get(exam.id)?.passed || 0,
      }));
    },
    enabled: !!classId,
  });

  const { data: availableExams } = useQuery({
    queryKey: ["available-exams-for-class", classId],
    queryFn: async () => {
      // Get all exams not linked to any class
      const { data, error } = await supabase
        .from("exams")
        .select("id, title, description")
        .is("class_id", null);

      if (error) throw error;
      return data || [];
    },
    enabled: !!classId,
  });

  const linkExam = useMutation({
    mutationFn: async (examId: string) => {
      const { error } = await supabase
        .from("exams")
        .update({ class_id: classId })
        .eq("id", examId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-exams", classId] });
      queryClient.invalidateQueries({ queryKey: ["available-exams-for-class", classId] });
      queryClient.invalidateQueries({ queryKey: ["class-details", classId] });
      toast.success("Prova vinculada!");
    },
  });

  const unlinkExam = useMutation({
    mutationFn: async (examId: string) => {
      const { error } = await supabase
        .from("exams")
        .update({ class_id: null })
        .eq("id", examId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-exams", classId] });
      queryClient.invalidateQueries({ queryKey: ["available-exams-for-class", classId] });
      queryClient.invalidateQueries({ queryKey: ["class-details", classId] });
      toast.success("Prova desvinculada!");
    },
  });

  const toggleExamActive = useMutation({
    mutationFn: async ({ examId, isActive }: { examId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("exams")
        .update({ is_active: isActive })
        .eq("id", examId);
      
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["event-exams", classId] });
      queryClient.invalidateQueries({ queryKey: ["class-details", classId] });
      toast.success(isActive ? "Prova ativada!" : "Prova desativada!");
    },
  });

  const resetAllAttempts = useMutation({
    mutationFn: async (examId: string) => {
      // Delete all attempts for this exam
      const { error } = await supabase
        .from("exam_attempts")
        .delete()
        .eq("exam_id", examId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-exams", classId] });
      toast.success("Todas as tentativas foram resetadas!");
    },
  });

  return {
    exams,
    availableExams,
    isLoading,
    linkExam,
    unlinkExam,
    toggleExamActive,
    resetAllAttempts,
  };
}
