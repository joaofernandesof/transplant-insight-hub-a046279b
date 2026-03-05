import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Loader2, Play, Clock, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

export default function NeoAcademyContinue() {
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['neoacademy-continue', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('neoacademy_enrollments')
        .select('*, course:neoacademy_courses(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('completed_at', null)
        .order('last_accessed_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch lesson progress for each course
  const { data: lessonProgress } = useQuery({
    queryKey: ['neoacademy-lesson-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('neoacademy_lesson_progress')
        .select('*, lesson:neoacademy_lessons(*)')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-3">
          <Play className="h-5 w-5 text-blue-400" />
          <h1 className="text-lg font-bold text-white">Continuar Assistindo</h1>
        </div>
      </header>

      <div className="px-6 pt-6 space-y-4">
        {enrollments?.length === 0 ? (
          <div className="text-center py-16">
            <Play className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">Você não tem nenhum curso em andamento.</p>
            <button
              onClick={() => navigate('/neoacademy/catalog')}
              className="mt-4 px-6 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition"
            >
              Explorar Catálogo
            </button>
          </div>
        ) : (
          enrollments?.map((enrollment: any) => {
            const course = enrollment.course;
            const progress = Number(enrollment.progress_percent) || 0;
            const lastLesson = lessonProgress?.find((lp: any) => lp.course_id === course?.id);

            return (
              <button
                key={enrollment.id}
                onClick={() => navigate(`/neoacademy/course/${course?.id}`)}
                className="w-full flex gap-4 p-4 rounded-xl bg-[#14141f] border border-white/5 hover:border-blue-500/30 transition-all group text-left"
              >
                {/* Thumbnail */}
                <div className="w-40 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-blue-900/40 to-sky-900/40 shrink-0 relative">
                  {course?.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-blue-400/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/50">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <Play className="h-4 w-4 text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm truncate">{course?.title}</h3>
                  {course?.category && (
                    <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">{course.category}</span>
                  )}
                  {lastLesson?.lesson && (
                    <p className="text-xs text-zinc-500 mt-1 truncate">
                      Última aula: {lastLesson.lesson.title}
                    </p>
                  )}
                  <div className="mt-2">
                    <Progress value={progress} className="h-1.5 bg-white/5" />
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-zinc-500">{Math.round(progress)}% concluído</span>
                      <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course?.total_duration_minutes ? `${Math.round(course.total_duration_minutes * (1 - progress / 100))}min restantes` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
