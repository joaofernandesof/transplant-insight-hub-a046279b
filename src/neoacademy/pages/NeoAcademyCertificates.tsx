import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Award, CheckCircle, Clock, Download, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function NeoAcademyCertificates() {
  const { user } = useUnifiedAuth();

  // Fetch enrollments with course data
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['neoacademy-certificates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('neoacademy_enrollments')
        .select('*, neoacademy_courses(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('enrolled_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  const completed = enrollments?.filter(e => e.completed_at) || [];
  const inProgress = enrollments?.filter(e => !e.completed_at) || [];
  const totalHours = completed.reduce((sum, e) => {
    const course = e.neoacademy_courses as any;
    return sum + (course?.total_duration_minutes || 0);
  }, 0);
  const totalHoursFormatted = Math.round(totalHours / 60);

  const stats = [
    { icon: CheckCircle, label: 'Concluídos', value: completed.length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { icon: Clock, label: 'Em Andamento', value: inProgress.length, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { icon: Award, label: 'Horas Certificadas', value: `${totalHoursFormatted}h`, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  ];

  const allCourses = [...completed, ...inProgress];

  return (
    <div className="min-h-screen pb-12">
      <div className="px-6 pt-6 space-y-6">
        {/* Title */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Award className="h-5 w-5 text-violet-400" />
            <h1 className="text-xl font-bold text-white">Meus Certificados</h1>
          </div>
          <p className="text-sm text-zinc-400">Acompanhe seu progresso e baixe seus certificados</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map(stat => (
            <div key={stat.label} className={cn("p-4 rounded-xl border text-center", stat.bg)}>
              <stat.icon className={cn("h-6 w-6 mx-auto mb-2", stat.color)} />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-zinc-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Course list */}
        <div className="space-y-3">
          {allCourses.length === 0 && (
            <div className="text-center py-16 text-zinc-500">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Nenhum curso encontrado</p>
              <p className="text-sm">Matricule-se em cursos para acompanhar seus certificados aqui.</p>
            </div>
          )}

          {allCourses.map(enrollment => {
            const course = enrollment.neoacademy_courses as any;
            if (!course) return null;

            const isCompleted = !!enrollment.completed_at;
            const progress = enrollment.progress_percent || 0;
            const durationHours = Math.round((course.total_duration_minutes || 0) / 60);

            return (
              <div
                key={enrollment.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-all",
                  isCompleted
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-[#14141f] border-white/5"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                  isCompleted ? "bg-emerald-500/20" : "bg-zinc-800"
                )}>
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6 text-emerald-400" />
                  ) : progress > 0 ? (
                    <Clock className="h-6 w-6 text-amber-400" />
                  ) : (
                    <Lock className="h-6 w-6 text-zinc-600" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={cn(
                      "font-semibold text-sm truncate",
                      isCompleted ? "text-white" : "text-zinc-300"
                    )}>
                      {course.title}
                    </h3>
                    {course.category && (
                      <span className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0",
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-violet-500/20 text-violet-300"
                      )}>
                        {course.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mb-2">
                    ⏱ {Math.round(progress * durationHours / 100)}h / {durationHours}h
                  </p>
                  <Progress
                    value={progress}
                    className="h-1.5 bg-zinc-800"
                  />
                  <p className="text-[10px] text-zinc-600 text-right mt-1">{Math.round(progress)}%</p>
                </div>

                {/* Action */}
                <div className="shrink-0">
                  {isCompleted ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Certificado
                    </Button>
                  ) : progress > 0 ? (
                    <Button
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-black"
                    >
                      Continuar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-zinc-500"
                    >
                      Inscrever-se
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
