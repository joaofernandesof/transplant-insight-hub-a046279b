import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, Search, GraduationCap, TrendingUp, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NeoAcademyAdminStudents() {
  const [search, setSearch] = useState('');

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['neoacademy-admin-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoacademy_enrollments')
        .select('*, course:neoacademy_courses(title, category)')
        .order('enrolled_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: userPoints } = useQuery({
    queryKey: ['neoacademy-all-points'],
    queryFn: async () => {
      const { data } = await supabase.from('neoacademy_user_points').select('*');
      const map: Record<string, any> = {};
      data?.forEach(p => { map[p.user_id] = p; });
      return map;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const userMap: Record<string, { enrollments: any[]; userId: string }> = {};
  enrollments?.forEach((e: any) => {
    if (!userMap[e.user_id]) userMap[e.user_id] = { enrollments: [], userId: e.user_id };
    userMap[e.user_id].enrollments.push(e);
  });
  const students = Object.values(userMap);

  const uniqueStudents = students.length;
  const avgProgress = enrollments?.length
    ? Math.round(enrollments.reduce((s: number, e: any) => s + Number(e.progress_percent || 0), 0) / enrollments.length)
    : 0;

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-blue-400" />
          <h1 className="text-lg font-bold text-white">Alunos</h1>
        </div>
      </header>

      <div className="px-6 pt-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#14141f] border border-white/5">
            <Users className="h-5 w-5 text-blue-400 mb-2" />
            <div className="text-2xl font-bold text-white">{uniqueStudents}</div>
            <div className="text-xs text-zinc-500">Alunos Únicos</div>
          </div>
          <div className="p-4 rounded-xl bg-[#14141f] border border-white/5">
            <GraduationCap className="h-5 w-5 text-emerald-400 mb-2" />
            <div className="text-2xl font-bold text-white">{enrollments?.length || 0}</div>
            <div className="text-xs text-zinc-500">Matrículas</div>
          </div>
          <div className="p-4 rounded-xl bg-[#14141f] border border-white/5">
            <TrendingUp className="h-5 w-5 text-amber-400 mb-2" />
            <div className="text-2xl font-bold text-white">{avgProgress}%</div>
            <div className="text-xs text-zinc-500">Progresso Médio</div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar aluno..."
            className="pl-10 bg-[#14141f] border-white/5 text-white"
          />
        </div>

        <div className="space-y-3">
          {students.map((student) => {
            const points = userPoints?.[student.userId];
            const totalEnrolled = student.enrollments.length;
            const completed = student.enrollments.filter((e: any) => e.completed_at).length;
            const avgProg = Math.round(student.enrollments.reduce((s: number, e: any) => s + Number(e.progress_percent || 0), 0) / totalEnrolled);
            const lastAccess = student.enrollments[0]?.last_accessed_at || student.enrollments[0]?.enrolled_at;

            return (
              <div key={student.userId} className="p-4 rounded-xl bg-[#14141f] border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {student.userId.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">Aluno {student.userId.slice(0, 8)}</p>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-0.5">
                      <span>{totalEnrolled} cursos</span>
                      <span>{completed} concluídos</span>
                      {points && <span className="text-amber-400">{points.total_points} pts</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Progress value={avgProg} className="h-1.5 w-20 bg-white/5" />
                    <p className="text-[10px] text-zinc-600 mt-1">{avgProg}% médio</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-zinc-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {lastAccess ? formatDistanceToNow(new Date(lastAccess), { addSuffix: true, locale: ptBR }) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {student.enrollments.map((e: any) => (
                    <span
                      key={e.id}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                        e.completed_at
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {e.course?.title || 'Curso'}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
