import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, 
  Play, Loader2, FileText, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function NeoAcademyLesson() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['neoacademy-lesson', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoacademy_lessons')
        .select('*')
        .eq('id', lessonId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!lessonId,
  });

  // Get all lessons in same module for navigation
  const { data: siblingLessons } = useQuery({
    queryKey: ['neoacademy-sibling-lessons', lesson?.module_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('neoacademy_lessons')
        .select('id, title, order_index')
        .eq('module_id', lesson!.module_id)
        .eq('is_published', true)
        .order('order_index');
      return data || [];
    },
    enabled: !!lesson?.module_id,
  });

  const { data: progress } = useQuery({
    queryKey: ['neoacademy-lesson-progress', lessonId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('neoacademy_lesson_progress')
        .select('*')
        .eq('lesson_id', lessonId!)
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!lessonId && !!user?.id,
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !lesson) throw new Error('Missing data');
      
      const { error } = await supabase
        .from('neoacademy_lesson_progress')
        .upsert({
          account_id: lesson.account_id,
          lesson_id: lesson.id,
          course_id: lesson.course_id,
          user_id: user.id,
          is_completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'lesson_id,user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Aula concluída! 🎉');
      queryClient.invalidateQueries({ queryKey: ['neoacademy-lesson-progress'] });
      queryClient.invalidateQueries({ queryKey: ['neoacademy-progress'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!lesson) {
    return <div className="flex items-center justify-center h-screen text-zinc-400">Aula não encontrada</div>;
  }

  const currentIndex = siblingLessons?.findIndex(l => l.id === lessonId) ?? -1;
  const prevLesson = currentIndex > 0 ? siblingLessons?.[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && siblingLessons && currentIndex < siblingLessons.length - 1 
    ? siblingLessons[currentIndex + 1] : null;

  const isCompleted = progress?.is_completed;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(`/neoacademy/course/${lesson.course_id}`)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao curso
        </button>
        <div className="flex items-center gap-2">
          {!isCompleted && (
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              Marcar como concluída
            </button>
          )}
          {isCompleted && (
            <span className="flex items-center gap-1.5 px-4 py-2 text-emerald-400 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Concluída
            </span>
          )}
        </div>
      </header>

      {/* Video / Content */}
      <div className="flex-1">
        {lesson.lesson_type === 'video' && lesson.video_url ? (
          <div className="w-full aspect-video bg-black">
            <video
              src={lesson.video_url}
              controls
              autoPlay
              className="w-full h-full"
              controlsList="nodownload"
            />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-8">
            {lesson.lesson_type === 'text' && lesson.content && (
              <div className="prose prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
              </div>
            )}
            {lesson.lesson_type === 'pdf' && lesson.content && (
              <div className="flex flex-col items-center gap-4 py-12">
                <FileText className="h-16 w-16 text-violet-400" />
                <h3 className="text-xl font-bold text-white">{lesson.title}</h3>
                <a
                  href={lesson.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-semibold transition-colors"
                >
                  <Download className="h-5 w-5" />
                  Baixar PDF
                </a>
              </div>
            )}
          </div>
        )}

        {/* Lesson info */}
        <div className="max-w-3xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-white mb-3">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-zinc-400 leading-relaxed">{lesson.description}</p>
          )}

          {/* Attachments */}
          {lesson.attachments && Array.isArray(lesson.attachments) && (lesson.attachments as any[]).length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Material Complementar</h3>
              <div className="space-y-2">
                {(lesson.attachments as any[]).map((att: any, i: number) => (
                  <a
                    key={i}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg bg-[#14141f] border border-white/5 hover:bg-white/5 transition-colors text-sm text-zinc-300"
                  >
                    <Download className="h-4 w-4 text-violet-400" />
                    {att.name || `Arquivo ${i + 1}`}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <footer className="sticky bottom-0 bg-[#0d0d14] border-t border-white/5 px-6 py-3 flex items-center justify-between">
        {prevLesson ? (
          <button
            onClick={() => navigate(`/neoacademy/lesson/${prevLesson.id}`)}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="max-w-[200px] truncate">{prevLesson.title}</span>
          </button>
        ) : <div />}

        {nextLesson ? (
          <button
            onClick={() => navigate(`/neoacademy/lesson/${nextLesson.id}`)}
            className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium"
          >
            <span className="max-w-[200px] truncate">{nextLesson.title}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : <div />}
      </footer>
    </div>
  );
}
