import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2,
  Play, Loader2, FileText, Download, List, X,
  BookOpen, Clock, ChevronDown, ChevronUp, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
}

function getYouTubeEmbedUrl(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0` : url;
}

export default function NeoAcademyLesson() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['neoacademy-lesson', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase.from('neoacademy_lessons').select('*').eq('id', lessonId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!lessonId,
  });

  const { data: course } = useQuery({
    queryKey: ['neoacademy-lesson-course', lesson?.course_id],
    queryFn: async () => {
      const { data } = await supabase.from('neoacademy_courses').select('id, title, banner_url').eq('id', lesson!.course_id).single();
      return data;
    },
    enabled: !!lesson?.course_id,
  });

  const { data: modules } = useQuery({
    queryKey: ['neoacademy-lesson-modules', lesson?.course_id],
    queryFn: async () => {
      const { data } = await supabase.from('neoacademy_modules').select('*').eq('course_id', lesson!.course_id).eq('is_published', true).order('order_index');
      return data || [];
    },
    enabled: !!lesson?.course_id,
  });

  const { data: allLessons } = useQuery({
    queryKey: ['neoacademy-lesson-all', lesson?.course_id],
    queryFn: async () => {
      const { data } = await supabase.from('neoacademy_lessons').select('id, title, order_index, module_id, video_duration_seconds, lesson_type, is_preview').eq('course_id', lesson!.course_id).eq('is_published', true).order('order_index');
      return data || [];
    },
    enabled: !!lesson?.course_id,
  });

  const { data: enrollment } = useQuery({
    queryKey: ['neoacademy-lesson-enrollment', lesson?.course_id, user?.authUserId],
    queryFn: async () => {
      const { data } = await supabase.from('neoacademy_enrollments').select('id').eq('course_id', lesson!.course_id).eq('user_id', user!.authUserId!).maybeSingle();
      return data;
    },
    enabled: !!lesson?.course_id && !!user?.authUserId,
  });

  const { data: allProgress } = useQuery({
    queryKey: ['neoacademy-lesson-all-progress', lesson?.course_id, user?.authUserId],
    queryFn: async () => {
      const { data } = await supabase.from('neoacademy_lesson_progress').select('lesson_id, is_completed').eq('course_id', lesson!.course_id).eq('user_id', user!.authUserId!);
      return data || [];
    },
    enabled: !!lesson?.course_id && !!user?.authUserId,
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.authUserId || !lesson) throw new Error('Missing data');
      const { error } = await supabase.from('neoacademy_lesson_progress').upsert({
        account_id: lesson.account_id,
        lesson_id: lesson.id,
        course_id: lesson.course_id,
        user_id: user.authUserId,
        is_completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'lesson_id,user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Aula concluída! 🎉');
      queryClient.invalidateQueries({ queryKey: ['neoacademy-lesson-all-progress'] });
      queryClient.invalidateQueries({ queryKey: ['neoacademy-progress'] });
      if (nextLesson) {
        setTimeout(() => navigate(`/neoacademy/lesson/${nextLesson.id}`), 1000);
      }
    },
  });

  React.useEffect(() => {
    if (lesson?.module_id) {
      setExpandedModules(prev => new Set([...prev, lesson.module_id]));
    }
  }, [lesson?.module_id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!lesson) {
    return <div className="flex items-center justify-center h-screen text-zinc-400 bg-[#0a0a0f]">Aula não encontrada</div>;
  }

  const completedSet = new Set(allProgress?.filter(p => p.is_completed).map(p => p.lesson_id));
  const isCompleted = completedSet.has(lesson.id);
  const flatLessons = allLessons || [];
  const currentIndex = flatLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;
  const totalLessons = flatLessons.length;
  const completedCount = flatLessons.filter(l => completedSet.has(l.id)).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const toggleModule = (id: string) => {
    const next = new Set(expandedModules);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedModules(next);
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0f]">
      <aside className={cn(
        "fixed inset-y-0 right-0 z-40 w-[360px] bg-[#0d0d14] border-l border-white/5 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white truncate flex-1">{course?.title || 'Curso'}</h3>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-zinc-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-xs text-zinc-500 font-medium">{progressPercent}%</span>
          </div>
          <p className="text-xs text-zinc-600 mt-1">{completedCount} de {totalLessons} aulas concluídas</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {modules?.map((mod, mi) => {
            const modLessons = flatLessons.filter(l => l.module_id === mod.id);
            const isExpanded = expandedModules.has(mod.id);
            const modCompleted = modLessons.filter(l => completedSet.has(l.id)).length;

            return (
              <div key={mod.id}>
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/[0.03]"
                >
                  <div className="flex items-center gap-2 text-left">
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 rounded px-1.5 py-0.5">
                      M{mi + 1}
                    </span>
                    <span className="text-xs font-semibold text-zinc-300 truncate">{mod.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600">{modCompleted}/{modLessons.length}</span>
                    {isExpanded ? <ChevronUp className="h-3 w-3 text-zinc-500" /> : <ChevronDown className="h-3 w-3 text-zinc-500" />}
                  </div>
                </button>

                {isExpanded && modLessons.map((l) => {
                  const isCurrent = l.id === lessonId;
                  const isDone = completedSet.has(l.id);
                  const canAccess = enrollment || l.is_preview;

                  return (
                    <button
                      key={l.id}
                      onClick={() => canAccess && navigate(`/neoacademy/lesson/${l.id}`)}
                      disabled={!canAccess}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-5 py-2.5 text-left transition-all text-xs",
                        isCurrent && "bg-blue-500/10 border-l-2 border-blue-500",
                        !isCurrent && canAccess && "hover:bg-white/5",
                        !canAccess && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <Play className="h-3.5 w-3.5 text-blue-400 shrink-0" fill="currentColor" />
                      ) : canAccess ? (
                        <Play className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-zinc-700 shrink-0" />
                      )}
                      <span className={cn(
                        "flex-1 truncate",
                        isCurrent ? "text-white font-medium" : isDone ? "text-zinc-400" : "text-zinc-500"
                      )}>
                        {l.title}
                      </span>
                      {l.video_duration_seconds && l.video_duration_seconds > 0 && (
                        <span className="text-[10px] text-zinc-700 shrink-0">
                          {Math.floor(l.video_duration_seconds / 60)}:{(l.video_duration_seconds % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(`/neoacademy/course/${lesson.course_id}`)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar ao curso</span>
          </button>

          <div className="flex-1 min-w-0 text-center">
            <p className="text-xs text-zinc-500 truncate">{course?.title}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isCompleted ? (
              <button
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
              >
                {completeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Concluir aula</span>
              </button>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Concluída
              </span>
            )}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1">
          {lesson.lesson_type === 'video' && lesson.video_url ? (
            <div className="w-full bg-black">
              <div className="max-w-[1200px] mx-auto">
                <div className="aspect-video">
                  {isYouTubeUrl(lesson.video_url) ? (
                    <iframe
                      key={lesson.id}
                      src={getYouTubeEmbedUrl(lesson.video_url)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video key={lesson.id} src={lesson.video_url} controls autoPlay className="w-full h-full" controlsList="nodownload" poster={course?.banner_url || undefined} />
                  )}
                </div>
              </div>
            </div>
          ) : lesson.lesson_type === 'text' && lesson.content ? (
            <div className="max-w-3xl mx-auto px-6 py-8">
              <div className="prose prose-invert prose-blue max-w-none prose-headings:text-white prose-p:text-zinc-400 prose-strong:text-zinc-200 prose-li:text-zinc-400 prose-blockquote:border-blue-500 prose-blockquote:text-zinc-300 prose-th:text-zinc-300 prose-td:text-zinc-400">
                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
              </div>
            </div>
          ) : lesson.lesson_type === 'pdf' && lesson.content ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <FileText className="h-16 w-16 text-blue-400" />
              <h3 className="text-xl font-bold text-white">{lesson.title}</h3>
              <a href={lesson.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-colors">
                <Download className="h-5 w-5" />
                Baixar PDF
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <Play className="h-12 w-12 mb-3 text-zinc-600" />
              <p className="text-sm">Conteúdo desta aula em breve</p>
            </div>
          )}

          <div className="max-w-3xl mx-auto px-6 py-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-xl font-bold text-white mb-1">{lesson.title}</h1>
                {lesson.video_duration_seconds && lesson.video_duration_seconds > 0 && (
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.floor(lesson.video_duration_seconds / 60)} min
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium uppercase text-[10px]">
                      {lesson.lesson_type === 'video' ? 'Vídeo' : lesson.lesson_type === 'text' ? 'Texto' : 'PDF'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {lesson.description && (
              <p className="text-sm text-zinc-400 leading-relaxed">{lesson.description}</p>
            )}

            {lesson.attachments && Array.isArray(lesson.attachments) && (lesson.attachments as any[]).length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">Material Complementar</h3>
                <div className="space-y-2">
                  {(lesson.attachments as any[]).map((att: any, i: number) => (
                    <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-lg bg-[#14141f] border border-white/5 hover:bg-white/5 transition-colors text-sm text-zinc-300">
                      <Download className="h-4 w-4 text-blue-400" />
                      {att.name || `Arquivo ${i + 1}`}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="sticky bottom-0 bg-[#0d0d14]/95 backdrop-blur-xl border-t border-white/5 px-4 py-3 flex items-center justify-between">
          {prevLesson ? (
            <button
              onClick={() => navigate(`/neoacademy/lesson/${prevLesson.id}`)}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="max-w-[180px] truncate hidden sm:inline">{prevLesson.title}</span>
              <span className="sm:hidden">Anterior</span>
            </button>
          ) : <div />}

          <span className="text-xs text-zinc-600">
            {currentIndex + 1} / {totalLessons}
          </span>

          {nextLesson ? (
            <button
              onClick={() => navigate(`/neoacademy/lesson/${nextLesson.id}`)}
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              <span className="max-w-[180px] truncate hidden sm:inline">{nextLesson.title}</span>
              <span className="sm:hidden">Próxima</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : !isCompleted ? (
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              <CheckCircle2 className="h-4 w-4" />
              Finalizar curso
            </button>
          ) : <div />}
        </footer>
      </div>
    </div>
  );
}
