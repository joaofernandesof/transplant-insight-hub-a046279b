import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, BarChart3, Users, BookOpen, TrendingUp, DollarSign, Eye } from 'lucide-react';

export default function NeoAcademyAdminAnalytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['neoacademy-admin-analytics'],
    queryFn: async () => {
      const [courses, enrollments, lessons] = await Promise.all([
        supabase.from('neoacademy_courses').select('id, title, is_published, access_type, price', { count: 'exact' }),
        supabase.from('neoacademy_enrollments').select('id, course_id, progress_percent, completed_at, enrolled_at', { count: 'exact' }),
        supabase.from('neoacademy_lessons').select('id', { count: 'exact' }),
      ]);
      return {
        totalCourses: courses.count || 0,
        publishedCourses: courses.data?.filter(c => c.is_published).length || 0,
        totalEnrollments: enrollments.count || 0,
        completedEnrollments: enrollments.data?.filter(e => e.completed_at).length || 0,
        totalLessons: lessons.count || 0,
        avgProgress: enrollments.data?.length
          ? Math.round(enrollments.data.reduce((s, e) => s + Number(e.progress_percent || 0), 0) / enrollments.data.length)
          : 0,
        recentEnrollments: enrollments.data
          ?.filter(e => {
            const d = new Date(e.enrolled_at || '');
            const now = new Date();
            return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
          }).length || 0,
        courses: courses.data || [],
        enrollments: enrollments.data || [],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  const s = stats!;

  // Enrollments per course
  const courseCounts: Record<string, number> = {};
  s.enrollments.forEach((e: any) => {
    courseCounts[e.course_id] = (courseCounts[e.course_id] || 0) + 1;
  });

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-violet-400" />
          <h1 className="text-lg font-bold text-white">Analytics</h1>
        </div>
      </header>

      <div className="px-6 pt-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: BookOpen, label: 'Cursos Publicados', value: `${s.publishedCourses}/${s.totalCourses}`, color: 'violet' },
            { icon: Users, label: 'Total Matrículas', value: s.totalEnrollments, color: 'blue' },
            { icon: TrendingUp, label: 'Progresso Médio', value: `${s.avgProgress}%`, color: 'emerald' },
            { icon: Eye, label: 'Matrículas (7d)', value: s.recentEnrollments, color: 'amber' },
          ].map(kpi => (
            <div key={kpi.label} className="p-4 rounded-xl bg-[#14141f] border border-white/5">
              <kpi.icon className={`h-5 w-5 text-${kpi.color}-400 mb-2`} />
              <div className="text-2xl font-bold text-white">{kpi.value}</div>
              <div className="text-xs text-zinc-500">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Completion rate */}
        <div className="p-5 rounded-xl bg-[#14141f] border border-white/5">
          <h3 className="text-sm font-bold text-white mb-4">Taxa de Conclusão</h3>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full border-4 border-emerald-500/30 flex items-center justify-center relative">
              <span className="text-xl font-bold text-emerald-400">
                {s.totalEnrollments > 0 ? Math.round((s.completedEnrollments / s.totalEnrollments) * 100) : 0}%
              </span>
            </div>
            <div className="text-sm text-zinc-400">
              <p><span className="text-white font-semibold">{s.completedEnrollments}</span> de {s.totalEnrollments} matrículas concluídas</p>
              <p className="text-xs text-zinc-600 mt-1">{s.totalLessons} aulas disponíveis no total</p>
            </div>
          </div>
        </div>

        {/* Course popularity */}
        <div className="p-5 rounded-xl bg-[#14141f] border border-white/5">
          <h3 className="text-sm font-bold text-white mb-4">Popularidade por Curso</h3>
          <div className="space-y-3">
            {s.courses.map((course: any) => {
              const count = courseCounts[course.id] || 0;
              const maxCount = Math.max(...Object.values(courseCounts), 1);
              return (
                <div key={course.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{course.title}</p>
                    <p className="text-[10px] text-zinc-600">{count} matrículas</p>
                  </div>
                  <div className="w-32 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
