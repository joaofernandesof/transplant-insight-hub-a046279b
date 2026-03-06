import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { 
  ArrowLeft, Play, Clock, BookOpen, CheckCircle2, Lock,
  ChevronDown, ChevronRight, Loader2, Users, Star, FileText, Download, Award
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
      const { data, error } = await supabase.from('neoacademy_modules').select('*').eq('course_id', courseId!).order('order_index');
      if (error) throw error;
      return (data || []).filter((m: any) => m.is_published);
    },
    enabled: !!courseId,
  });

  const { data: lessons } = useQuery({
    queryKey: ['neoacademy-lessons', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('neoacademy_lessons').select('*').eq('course_id', courseId!).order('order_index');
      if (error) throw error;
      return (data || []).filter((l: any) => l.is_published);
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

  const { data: enrollmentCount } = useQuery({
    queryKey: ['neoacademy-enrollment-count', courseId],
    queryFn: async () => {
      const { count } = await supabase.from('neoacademy_enrollments').select('id', { count: 'exact', head: true }).eq('course_id', courseId!);
      return count || 0;
    },
    enabled: !!courseId,
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
        account_id: course.account_id, course_id: course.id, user_id: user.authUserId 
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Matrícula realizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['neoacademy-enrollment'] });
      queryClient.invalidateQueries({ queryKey: ['neoacademy-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['neoacademy-enrollment-count'] });
    },
    onError: (err: any) => {
      if (err?.code === '23505') {
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

  // Auto-expand all modules
  React.useEffect(() => {
    if (modules?.length && expandedModules.size === 0) {
      setExpandedModules(new Set(modules.map((m: any) => m.id)));
    }
  }, [modules]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div>;
  }
  if (!course) {
    return <div className="flex items-center justify-center h-screen text-zinc-400">Curso não encontrado</div>;
  }

  const completedLessonIds = new Set(progress?.filter(p => p.is_completed).map(p => p.lesson_id));
  const totalLessons = lessons?.length || 0;
  const completedCount = completedLessonIds.size;
  const progressPercent = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;
  const totalDuration = lessons?.reduce((acc, l) => acc + (l.video_duration_seconds || 0), 0) || 0;
  const totalMaterials = lessons?.reduce((acc, l) => acc + (Array.isArray(l.attachments) ? l.attachments.length : 0), 0) || 0;

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Banner */}
      <div className="relative h-[280px] lg:h-[320px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-[#1a1a2e] to-sky-900/60">
          {course.banner_url && (
            <img src={course.banner_url} alt={course.title} className="w-full h-full object-cover opacity-30" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
        
        <button onClick={() => navigate('/neoacademy')} className="absolute top-4 left-4 z-10 p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="absolute bottom-6 left-6 right-6">
          {course.category && (
            <span className="inline-block px-2.5 py-1 rounded bg-blue-500/80 text-xs font-bold uppercase text-white mb-3">
              {course.category}
            </span>
          )}
          <h1 className="text-2xl lg:text-4xl font-bold text-white mb-2">{course.title}</h1>
          {course.short_description && (
            <p className="text-sm lg:text-base text-zinc-300 max-w-2xl mb-3">{course.short_description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-300">
            <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-blue-400" /> {totalLessons} aulas</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-blue-400" /> {Math.floor(totalDuration / 3600)}h {Math.floor((totalDuration % 3600) / 60)}min</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-blue-400" /> {enrollmentCount} alunos</span>
            {totalMaterials > 0 && <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-blue-400" /> {totalMaterials} materiais</span>}
            {course.is_featured && <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-amber-400 fill-amber-400" /> Destaque</span>}
          </div>
        </div>
      </div>

      {/* Main Content - 2 column on desktop */}
      <div className="px-6 pt-6 max-w-7xl mx-auto lg:flex lg:gap-8">
        {/* Left column - Content */}
        <div className="flex-1 min-w-0">
          {/* Enroll / Progress */}
          {enrollment ? (
            <div className="mb-6 p-5 rounded-xl bg-[#14141f] border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-zinc-200">Seu progresso</span>
                <span className="text-lg font-bold text-blue-400">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2.5 bg-white/5" />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-zinc-500">{completedCount} de {totalLessons} aulas concluídas</span>
                {completedCount > 0 && totalLessons > 0 && completedCount === totalLessons && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold"><Award className="h-3.5 w-3.5" /> Curso concluído!</span>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
              className="mb-6 w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-lg transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50"
            >
              {enrollMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" fill="white" />}
              {course.access_type === 'paid' ? `Matricular-se por R$${course.price?.toFixed(2)}` : 'Matricular-se Gratuitamente'}
            </button>
          )}

          {/* Course Description */}
          {course.description && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-white mb-3">Sobre o curso</h2>
              <p className="text-zinc-400 leading-relaxed text-sm lg:text-base">{course.description}</p>
            </div>
          )}

          {/* Modules & Lessons */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Conteúdo do Curso</h2>
              <span className="text-xs text-zinc-500">{modules?.length || 0} módulos • {totalLessons} aulas</span>
            </div>
            
            {modules?.map((mod: any, mi: number) => {
              const modLessons = lessons?.filter((l: any) => l.module_id === mod.id) || [];
              const isExpanded = expandedModules.has(mod.id);
              const modCompleted = modLessons.filter((l: any) => completedLessonIds.has(l.id)).length;
              const modDuration = modLessons.reduce((acc: number, l: any) => acc + (l.video_duration_seconds || 0), 0);

              return (
                <div key={mod.id} className="rounded-xl bg-[#14141f] border border-white/5 overflow-hidden">
                  <button onClick={() => toggleModule(mod.id)} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-blue-400" /> : <ChevronRight className="h-4 w-4 text-zinc-400" />}
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-blue-400 font-bold uppercase">Módulo {mi + 1}</span>
                          {modCompleted === modLessons.length && modLessons.length > 0 && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                        </div>
                        <span className="font-semibold text-white text-sm">{mod.title}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-zinc-500 block">{modCompleted}/{modLessons.length} aulas</span>
                      {modDuration > 0 && <span className="text-[10px] text-zinc-600">{Math.floor(modDuration / 60)} min</span>}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-white/5">
                      {modLessons.map((lesson: any, li: number) => {
                        const isCompleted = completedLessonIds.has(lesson.id);
                        const canAccess = enrollment || lesson.is_preview;
                        const hasAttachments = Array.isArray(lesson.attachments) && lesson.attachments.length > 0;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => canAccess && navigate(`/neoacademy/lesson/${lesson.id}`)}
                            disabled={!canAccess}
                            className={cn(
                              "w-full flex items-center gap-3 px-6 py-3 text-left transition-colors text-sm border-b border-white/[0.02] last:border-0",
                              canAccess ? "hover:bg-white/[0.03] cursor-pointer" : "opacity-40 cursor-not-allowed"
                            )}
                          >
                            <span className="text-[10px] text-zinc-600 w-5 text-right shrink-0">{li + 1}</span>
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            ) : canAccess ? (
                              <Play className="h-4 w-4 text-blue-400 shrink-0" />
                            ) : (
                              <Lock className="h-4 w-4 text-zinc-600 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <span className={cn("block truncate", isCompleted ? "text-zinc-300" : "text-zinc-400")}>
                                {lesson.title}
                              </span>
                              {lesson.description && <span className="text-[10px] text-zinc-600 truncate block">{lesson.description}</span>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {hasAttachments && <FileText className="h-3 w-3 text-zinc-600" />}
                              {lesson.video_duration_seconds > 0 && (
                                <span className="text-[10px] text-zinc-600">
                                  {Math.floor(lesson.video_duration_seconds / 60)}:{(lesson.video_duration_seconds % 60).toString().padStart(2, '0')}
                                </span>
                              )}
                              {lesson.is_preview && !enrollment && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">Grátis</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {(!modules || modules.length === 0) && (
              <div className="text-center py-12 text-zinc-500">
                <BookOpen className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
                <p className="text-sm">Nenhum conteúdo disponível ainda.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar - Desktop only */}
        <div className="hidden lg:block w-[320px] shrink-0">
          <div className="sticky top-6 space-y-4">
            {/* Course stats card */}
            <div className="rounded-xl bg-[#14141f] border border-white/5 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white">Informações do curso</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" /> Total de aulas</span>
                  <span className="text-xs font-semibold text-white">{totalLessons}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Duração total</span>
                  <span className="text-xs font-semibold text-white">{Math.floor(totalDuration / 3600)}h {Math.floor((totalDuration % 3600) / 60)}min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Alunos matriculados</span>
                  <span className="text-xs font-semibold text-white">{enrollmentCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Materiais</span>
                  <span className="text-xs font-semibold text-white">{totalMaterials}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 flex items-center gap-2"><Award className="h-3.5 w-3.5" /> Módulos</span>
                  <span className="text-xs font-semibold text-white">{modules?.length || 0}</span>
                </div>
                <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Acesso</span>
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded",
                    course.access_type === 'free' ? "bg-emerald-500/10 text-emerald-400" :
                    course.access_type === 'paid' ? "bg-amber-500/10 text-amber-400" :
                    "bg-blue-500/10 text-blue-400"
                  )}>
                    {course.access_type === 'free' ? 'Gratuito' : course.access_type === 'paid' ? `R$${course.price?.toFixed(2)}` : 'Membros'}
                  </span>
                </div>
              </div>
            </div>

            {/* What you'll learn */}
            {modules && modules.length > 0 && (
              <div className="rounded-xl bg-[#14141f] border border-white/5 p-5">
                <h3 className="text-sm font-bold text-white mb-3">O que você vai aprender</h3>
                <ul className="space-y-2">
                  {modules.map((mod: any) => (
                    <li key={mod.id} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-zinc-400">{mod.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick enroll on sidebar */}
            {!enrollment && (
              <button
                onClick={() => enrollMutation.mutate()}
                disabled={enrollMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm transition-colors shadow-lg shadow-blue-500/25 disabled:opacity-50"
              >
                {enrollMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" fill="white" />}
                Matricular-se
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
