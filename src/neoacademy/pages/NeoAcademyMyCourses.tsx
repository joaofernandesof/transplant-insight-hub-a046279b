import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { CourseCard } from '../components/CourseCard';
import { Loader2, GraduationCap, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function NeoAcademyMyCourses() {
  const { user } = useUnifiedAuth();

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['neoacademy-my-courses', user?.authUserId],
    queryFn: async () => {
      if (!user?.authUserId) return [];
      const { data, error } = await supabase
        .from('neoacademy_enrollments')
        .select('*, course:neoacademy_courses(*)')
        .eq('user_id', user.authUserId)
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.authUserId,
  });

  const inProgress = enrollments?.filter(e => !e.completed_at) || [];
  const completed = enrollments?.filter(e => e.completed_at) || [];

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
          <GraduationCap className="h-5 w-5 text-blue-400" />
          <h1 className="text-lg font-bold text-white">Meus Cursos</h1>
        </div>
      </header>

      <div className="px-6 pt-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-[#14141f] border border-white/5">
            <BookOpen className="h-5 w-5 text-blue-400 mb-2" />
            <div className="text-2xl font-bold text-white">{enrollments?.length || 0}</div>
            <div className="text-xs text-zinc-500">Total Matriculado</div>
          </div>
          <div className="p-4 rounded-xl bg-[#14141f] border border-white/5">
            <Clock className="h-5 w-5 text-amber-400 mb-2" />
            <div className="text-2xl font-bold text-white">{inProgress.length}</div>
            <div className="text-xs text-zinc-500">Em Andamento</div>
          </div>
          <div className="p-4 rounded-xl bg-[#14141f] border border-white/5">
            <CheckCircle className="h-5 w-5 text-emerald-400 mb-2" />
            <div className="text-2xl font-bold text-white">{completed.length}</div>
            <div className="text-xs text-zinc-500">Concluídos</div>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-[#14141f] border border-white/5 mb-6">
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
              Todos ({enrollments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
              Em Andamento ({inProgress.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">
              Concluídos ({completed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <CourseGrid enrollments={enrollments || []} />
          </TabsContent>
          <TabsContent value="progress">
            <CourseGrid enrollments={inProgress} />
          </TabsContent>
          <TabsContent value="completed">
            <CourseGrid enrollments={completed} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CourseGrid({ enrollments }: { enrollments: any[] }) {
  if (enrollments.length === 0) {
    return (
      <div className="text-center py-16">
        <GraduationCap className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
        <p className="text-zinc-500">Nenhum curso encontrado nesta categoria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {enrollments.map((e: any) => (
        <CourseCard
          key={e.id}
          id={e.course?.id || e.course_id}
          title={e.course?.title || 'Curso'}
          thumbnail={e.course?.thumbnail_url}
          category={e.course?.category}
          totalLessons={e.course?.total_lessons}
          totalDuration={e.course?.total_duration_minutes}
          progress={Number(e.progress_percent) || 0}
        />
      ))}
    </div>
  );
}
