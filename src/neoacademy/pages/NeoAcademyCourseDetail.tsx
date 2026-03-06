import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { 
  ArrowLeft, Play, Clock, BookOpen, CheckCircle2, Lock,
  ChevronDown, ChevronRight, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function NeoAcademyCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const { data: course, isLoading } = useQuery({
    queryKey: ['neoacademy-course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('neoacademy_courses').select('*').eq('id', courseId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: modules } = useQuery({
    queryKey: ['neoacademy-modules', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('neoacademy_modules').select('*').eq('course_id', courseId!).eq('is_published', true).order('order_index');
      if (error) throw error;
      return data || [];
    },
    enabled: !!courseId,
  });

  const { data: lessons } = useQuery({
    queryKey: ['neoacademy-lessons', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('neoacademy_lessons').select('*').eq('course_id', courseId!).eq('is_published', true).order('order_index');
      if (error) throw error;
      return data || [];
    },
    enabled: !!courseId,
  });

  const { data: enrollment } = useQuery({
    queryKey: ['neoacademy-enrollment', courseId, user?.authUserId],
    queryFn: async () => {
      const { data } = await supabase.from('neoacademy_enrollments').select('*').eq('course_id', courseId!).eq('user_id', user!.authUserId!).maybeSingle();
      return data;
    },
    enabled: !!courseId && !!user?.authUserId,
  });

  const { data: progress } = useQuery({
    queryKey: ['neoacademy-progress', courseId, user?.authUserId],
    queryFn: async () => {
      const { data } = await supabase.from('neoacademy_lesson_progress').select('*').eq('course_id', courseId!).eq('user_id', user!.authUserId!);
      return data || [];
    },
    enabled: !!courseId && !!user?.authUserId,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user?.authUserId || !course) throw new Error('Not authenticated');
      const { error } = await supabase.from('neoacademy_enrollments').insert({ 
        account_id: course.account_id, 
        course_id: course.id, 
        user_id: user.authUserId 
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Matrícula realizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['neoacademy-enrollment'] });
      queryClient.invalidateQueries({ queryKey: ['neoacademy-enrollments'] });
    },
    onError: (err: any) => {
      console.error('Enrollment error:', err);
      if (!user?.id) {
        toast.error('Você precisa estar logado para se matricular');
      } else if (err?.code === '23505') {
        toast.error('Você já está matriculado neste curso');
        queryClient.invalidateQueries({ queryKey: ['neoacademy-enrollment'] });
      } else {
        toast.error('Erro ao matricular: ' + (err?.message || 'tente novamente'));
      }
    },
  });

  const toggleModule = (moduleId: string) => {
    const next = new Set(expandedModules);
    next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
    setExpandedModules(next);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!course) {
    return <div className="flex items-center justify-center h-screen text-zinc-400">Curso não encontrado</div>;
  }

  const completedLessonIds = new Set(progress?.filter(p => p.is_completed).map(p => p.lesson_id));
  const totalLessons = lessons?.length || 0;
  const completedCount = completedLessonIds.size;
  const progressPercent = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  return (
    <div className="min-h-screen pb-16">
      <div className="relative h-[300px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-[#1a1a2e] to-sky-900/60">
          {course.banner_url && (
            <img src={course.banner_url} alt={course.title} className="w-full h-full object-cover opacity-30" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
        
        <button
          onClick={() => navigate('/neoacademy')}
          className="absolute top-4 left-4 z-10 p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="absolute bottom-6 left-6 right-6">
          {course.category && (
            <span className="inline-block px-2 py-0.5 rounded bg-blue-500/80 text-xs font-bold uppercase text-white mb-2">
              {course.category}
            </span>
          )}
          <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
          <div className="flex items-center gap-4 text-sm text-zinc-300">
            <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {totalLessons} aulas</span>
            {course.total_duration_minutes && course.total_duration_minutes > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> {Math.floor(course.total_duration_minutes / 60)}h {course.total_duration_minutes % 60}min
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pt-6 max-w-4xl">
        {enrollment ? (
          <div className="mb-8 p-4 rounded-xl bg-[#14141f] border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-300">Seu progresso</span>
              <span className="text-sm font-bold text-blue-400">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-white/5" />
            <div className="mt-2 text-xs text-zinc-500">{completedCount} de {totalLessons} aulas concluídas</div>
          </div>
        ) : (
          <button
            onClick={() => enrollMutation.mutate()}
            disabled={enrollMutation.isPending}
            className="mb-8 w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-lg transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50"
          >
            {enrollMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Play className="h-5 w-5" fill="white" />
            )}
            Matricular-se Gratuitamente
          </button>
        )}

        {course.description && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-3">Sobre o curso</h2>
            <p className="text-zinc-400 leading-relaxed">{course.description}</p>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white mb-4">Conteúdo do Curso</h2>
          
          {modules?.map(mod => {
            const modLessons = lessons?.filter(l => l.module_id === mod.id) || [];
            const isExpanded = expandedModules.has(mod.id);
            const modCompleted = modLessons.filter(l => completedLessonIds.has(l.id)).length;

            return (
              <div key={mod.id} className="rounded-xl bg-[#14141f] border border-white/5 overflow-hidden">
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-zinc-400" /> : <ChevronRight className="h-4 w-4 text-zinc-400" />}
                    <span className="font-semibold text-white text-sm">{mod.title}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{modCompleted}/{modLessons.length} aulas</span>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/5">
                    {modLessons.map(lesson => {
                      const isCompleted = completedLessonIds.has(lesson.id);
                      const canAccess = enrollment || lesson.is_preview;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => canAccess && navigate(`/neoacademy/lesson/${lesson.id}`)}
                          disabled={!canAccess}
                          className={cn(
                            "w-full flex items-center gap-3 px-6 py-3 text-left transition-colors text-sm",
                            canAccess ? "hover:bg-white/5 cursor-pointer" : "opacity-50 cursor-not-allowed",
                            isCompleted && "text-emerald-400"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : canAccess ? (
                            <Play className="h-4 w-4 text-blue-400 shrink-0" />
                          ) : (
                            <Lock className="h-4 w-4 text-zinc-600 shrink-0" />
                          )}
                          <span className={cn("flex-1", isCompleted ? "text-zinc-300" : "text-zinc-400")}>
                            {lesson.title}
                          </span>
                          {lesson.video_duration_seconds && lesson.video_duration_seconds > 0 && (
                            <span className="text-xs text-zinc-600">
                              {Math.floor(lesson.video_duration_seconds / 60)}:{(lesson.video_duration_seconds % 60).toString().padStart(2, '0')}
                            </span>
                          )}
                          {lesson.is_preview && !enrollment && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">
                              Grátis
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
