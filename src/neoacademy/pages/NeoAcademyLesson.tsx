import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2,
  Play, Loader2, FileText, Download, List, X,
  BookOpen, Clock, ChevronDown, Lock, FolderOpen,
  MessageCircle
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
  const [activeTab, setActiveTab] = useState<'materials' | 'downloads' | 'comments'>('materials');

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
      const { data } = await supabase.from('neoacademy_courses').select('id, title, banner_url, created_by').eq('id', lesson!.course_id).single();
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

  const toggleModule = (id: string) => {
    const next = new Set(expandedModules);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedModules(next);
  };

  const hasAttachments = lesson.attachments && Array.isArray(lesson.attachments) && (lesson.attachments as any[]).length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2.5 rounded-xl bg-[#14141f] border border-white/10 text-zinc-400 hover:text-white shadow-lg"
      >
        <List className="h-5 w-5" />
      </button>

      <div className="flex flex-1">
        {/* Main content area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Video / Content Player */}
          <div className="w-full bg-black">
            {lesson.lesson_type === 'video' && lesson.video_url ? (
              <div className="max-w-[1100px] mx-auto">
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
                    <video
                      key={lesson.id}
                      src={lesson.video_url}
                      controls
                      autoPlay
                      className="w-full h-full"
                      controlsList="nodownload"
                      poster={course?.banner_url || undefined}
                    />
                  )}
                </div>
              </div>
            ) : lesson.lesson_type === 'text' && lesson.content ? (
              <div className="max-w-3xl mx-auto px-6 py-8 bg-[#0a0a0f]">
                <div className="prose prose-invert prose-blue max-w-none prose-headings:text-white prose-p:text-zinc-400 prose-strong:text-zinc-200">
                  <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                </div>
              </div>
            ) : lesson.lesson_type === 'pdf' && lesson.content ? (
              <div className="flex flex-col items-center gap-4 py-16 bg-[#0a0a0f]">
                <FileText className="h-16 w-16 text-blue-400" />
                <h3 className="text-xl font-bold text-white">{lesson.title}</h3>
                <a href={lesson.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-colors">
                  <Download className="h-5 w-5" />
                  Baixar PDF
                </a>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500 bg-[#0a0a0f]">
                <Play className="h-12 w-12 mb-3 text-zinc-600" />
                <p className="text-sm">Conteúdo desta aula em breve</p>
              </div>
            )}
          </div>

          {/* Below video: Title + Complete button */}
          <div className="max-w-[1100px] mx-auto w-full px-6 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-white leading-tight">{lesson.title}</h1>
                {lesson.video_duration_seconds && lesson.video_duration_seconds > 0 && (
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.floor(lesson.video_duration_seconds / 60)} min
                    </span>
                  </div>
                )}
              </div>

              {!isCompleted ? (
                <button
                  onClick={() => completeMutation.mutate()}
                  disabled={completeMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/50 text-emerald-400 text-sm font-medium hover:bg-emerald-500/10 transition-colors shrink-0"
                >
                  {completeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Concluir aula
                </button>
              ) : (
                <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                  Concluída
                </span>
              )}
            </div>

            {/* Tabs */}
            <div className="mt-6 border-b border-white/10">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab('materials')}
                  className={cn(
                    "flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors",
                    activeTab === 'materials'
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <BookOpen className="h-4 w-4" />
                  Leitura complementar
                </button>
                <button
                  onClick={() => setActiveTab('downloads')}
                  className={cn(
                    "flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors",
                    activeTab === 'downloads'
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Download className="h-4 w-4" />
                  Materiais
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={cn(
                    "flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors",
                    activeTab === 'comments'
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <MessageCircle className="h-4 w-4" />
                  Comentários e dúvidas
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="py-6">
              {activeTab === 'materials' ? (
                <div className="space-y-6">
                  {/* Description */}
                  {lesson.description && (
                    <p className="text-sm text-zinc-400 leading-relaxed">{lesson.description}</p>
                  )}

                  {/* Attachments */}
                  {hasAttachments && (
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-300 mb-3">Material de Apoio</h3>
                      <div className="space-y-2">
                        {(lesson.attachments as any[]).map((att: any, i: number) => (
                          <a
                            key={i}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg bg-[#14141f] border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-sm text-zinc-300"
                          >
                            <Download className="h-4 w-4 text-blue-400 shrink-0" />
                            {att.name || `Arquivo ${i + 1}`}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {!lesson.description && !hasAttachments && (
                    <p className="text-sm text-zinc-600">Nenhum material complementar para esta aula.</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">Comentários em breve.</p>
                </div>
              )}
            </div>

            {/* Navigation footer */}
            <div className="border-t border-white/5 py-4 flex items-center justify-between">
              {prevLesson ? (
                <button
                  onClick={() => navigate(`/neoacademy/lesson/${prevLesson.id}`)}
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="max-w-[200px] truncate hidden sm:inline">{prevLesson.title}</span>
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
                  <span className="max-w-[200px] truncate hidden sm:inline">{nextLesson.title}</span>
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
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR — Modules (card style like reference) */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={cn(
          "fixed inset-y-0 right-0 z-40 w-[320px] bg-[#0d0d14] border-l border-white/5 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 lg:w-[300px] xl:w-[340px]",
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        )}>
          {/* Sidebar header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <button
              onClick={() => navigate(`/neoacademy/course/${lesson.course_id}`)}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao curso
            </button>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-zinc-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modules list as cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {modules?.map((mod, mi) => {
              const modLessons = flatLessons.filter(l => l.module_id === mod.id);
              const isExpanded = expandedModules.has(mod.id);

              return (
                <div
                  key={mod.id}
                  className="rounded-xl border border-white/[0.06] bg-[#111118] overflow-hidden"
                >
                  {/* Module header card */}
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-3 text-left min-w-0">
                      <FolderOpen className="h-4 w-4 text-zinc-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                          Módulo: {mi + 1}
                        </p>
                        <p className="text-sm font-semibold text-zinc-200 truncate">
                          {mod.title}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-zinc-600 shrink-0 transition-transform",
                      isExpanded && "rotate-180"
                    )} />
                  </button>

                  {/* Expanded lessons */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.04] pb-1">
                      {modLessons.map((l) => {
                        const isCurrent = l.id === lessonId;
                        const isDone = completedSet.has(l.id);
                        const canAccess = enrollment || l.is_preview;

                        return (
                          <button
                            key={l.id}
                            onClick={() => canAccess && navigate(`/neoacademy/lesson/${l.id}`)}
                            disabled={!canAccess}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-all text-xs",
                              isCurrent && "bg-blue-500/10 border-l-2 border-blue-500",
                              !isCurrent && canAccess && "hover:bg-white/[0.03]",
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
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
