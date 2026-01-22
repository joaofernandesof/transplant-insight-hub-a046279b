import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Exam {
  id: string;
  course_id: string;
  class_id: string | null;
  title: string;
  description: string | null;
  duration_minutes: number;
  passing_score: number;
  max_attempts: number;
  is_active: boolean;
  show_results_immediately: boolean;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  points: number;
  order_index: number;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  user_id: string;
  started_at: string;
  submitted_at: string | null;
  score: number | null;
  status: 'in_progress' | 'submitted' | 'graded';
  earned_points: number | null;
  total_points: number | null;
}

export interface CourseClass {
  id: string;
  course_id: string;
  name: string;
  code: string;
  start_date: string;
  status: string;
}

export function useExams(courseId?: string) {
  return useQuery({
    queryKey: ['exams', courseId],
    queryFn: async () => {
      let query = supabase.from('exams').select('*').eq('is_active', true);
      if (courseId) query = query.eq('course_id', courseId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as Exam[];
    },
  });
}

// Type for student-facing questions (no correct_answer)
export interface ExamQuestionStudent {
  id: string;
  exam_id: string;
  question_text: string;
  options: string[];
  points: number;
  order_index: number;
}

export function useExamQuestions(examId: string) {
  return useQuery({
    queryKey: ['exam-questions', examId],
    queryFn: async () => {
      // Fetch exam settings first
      const { data: exam } = await supabase
        .from('exams')
        .select('shuffle_questions, shuffle_options')
        .eq('id', examId)
        .single();
      
      // Query directly using type assertion - use exam_questions but only select safe fields
      const { data, error } = await supabase
        .from('exam_questions' as any)
        .select('id, exam_id, question_text, question_type, options, points, order_index')
        .eq('exam_id', examId)
        .order('order_index');
      
      if (error) throw error;
      
      let questions = ((data as any[]) || []).map((q: any) => ({ 
        id: q.id,
        exam_id: q.exam_id,
        question_text: q.question_text,
        options: q.options as string[],
        points: q.points || 1,
        order_index: q.order_index
      })) as ExamQuestionStudent[];
      
      // Randomize questions if enabled
      if (exam?.shuffle_questions) {
        questions = shuffleArray(questions);
      }
      
      // Randomize options within each question if enabled
      if (exam?.shuffle_options) {
        questions = questions.map(q => ({
          ...q,
          options: shuffleArray([...q.options])
        }));
      }
      
      return questions;
    },
    enabled: !!examId,
  });
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function useExamAttempts(examId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['exam-attempts', examId, user?.id],
    queryFn: async () => {
      let query = supabase.from('exam_attempts').select('*');
      if (examId) query = query.eq('exam_id', examId);
      if (user?.id) query = query.eq('user_id', user.id);
      const { data, error } = await query.order('started_at', { ascending: false });
      if (error) throw error;
      return data as ExamAttempt[];
    },
    enabled: !!user?.id,
  });
}

export function useAllExamAttempts(examId?: string) {
  return useQuery({
    queryKey: ['all-exam-attempts', examId],
    queryFn: async () => {
      // First get all attempts
      let query = supabase.from('exam_attempts').select('*').eq('status', 'submitted');
      if (examId) query = query.eq('exam_id', examId);
      const { data: attempts, error } = await query.order('submitted_at', { ascending: false });
      if (error) throw error;
      
      // Then fetch profiles for each user
      if (!attempts || attempts.length === 0) return [];
      
      const userIds = [...new Set(attempts.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email, clinic_name')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return attempts.map(a => ({
        ...a,
        profiles: profileMap.get(a.user_id) || null
      }));
    },
  });
}

export function useCourseClasses(courseId?: string) {
  return useQuery({
    queryKey: ['course-classes', courseId],
    queryFn: async () => {
      let query = supabase.from('course_classes').select('*');
      if (courseId) query = query.eq('course_id', courseId);
      const { data, error } = await query.order('start_date', { ascending: false });
      if (error) throw error;
      return data as CourseClass[];
    },
  });
}

export function useStartExam() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ examId, classId }: { examId: string; classId?: string }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error('Não autenticado');

      const { data, error } = await supabase.from('exam_attempts').insert({
        exam_id: examId,
        user_id: session.session.user.id,
        class_id: classId || null,
        status: 'in_progress',
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-attempts'] });
    },
  });
}

export function useSubmitExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      attemptId, 
      answers 
    }: { 
      attemptId: string; 
      answers: { questionId: string; answer: string }[] 
    }) => {
      // Validate answers server-side using RPC
      let earnedPoints = 0;
      let totalPoints = 0;
      const answersData: { 
        attempt_id: string; 
        question_id: string; 
        selected_answer: string; 
        is_correct: boolean; 
        points_earned: number; 
      }[] = [];

      for (const a of answers) {
        const { data, error } = await supabase.rpc('validate_exam_answer', {
          p_question_id: a.questionId,
          p_selected_answer: a.answer,
          p_attempt_id: attemptId
        });
        
        if (error) throw error;
        
        const resultArray = data as { is_correct: boolean; points_earned: number; points_total: number }[] | null;
        const result = resultArray?.[0] || { is_correct: false, points_earned: 0, points_total: 1 };
        
        earnedPoints += result.points_earned;
        totalPoints += result.points_total;
        
        answersData.push({
          attempt_id: attemptId,
          question_id: a.questionId,
          selected_answer: a.answer,
          is_correct: result.is_correct,
          points_earned: result.points_earned,
        });
      }

      const { error: answersError } = await supabase.from('exam_answers').insert(answersData);
      if (answersError) throw answersError;

      const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

      // Update attempt
      const { data, error } = await supabase.from('exam_attempts').update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        score,
        total_points: totalPoints,
        earned_points: earnedPoints,
      }).eq('id', attemptId).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['all-exam-attempts'] });
    },
  });
}
