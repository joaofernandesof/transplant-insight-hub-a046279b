import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, BarChart3, Users, BookOpen, TrendingUp, Eye, Award, Clock, Layers, Target, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar
} from 'recharts';
import { format, subDays, eachDayOfInterval, startOfDay, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#f97316', '#6366f1', '#14b8a6', '#e11d48'];

export default function NeoAcademyAdminAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['neoacademy-admin-analytics-full'],
    queryFn: async () => {
      const [coursesRes, enrollmentsRes, lessonsRes, progressRes, modulesRes] = await Promise.all([
        supabase.from('neoacademy_courses').select('id, title, category, is_published, access_type, price, total_lessons, total_duration_minutes, created_at'),
        supabase.from('neoacademy_enrollments').select('id, course_id, user_id, progress_percent, completed_at, enrolled_at, last_accessed_at, is_active'),
        supabase.from('neoacademy_lessons').select('id, course_id, module_id, duration_minutes, order_index'),
        supabase.from('neoacademy_lesson_progress').select('id, lesson_id, course_id, user_id, is_completed, watch_time_seconds, completed_at, updated_at'),
        supabase.from('neoacademy_modules').select('id, course_id, title'),
      ]);
      return {
        courses: coursesRes.data || [],
        enrollments: enrollmentsRes.data || [],
        lessons: lessonsRes.data || [],
        progress: progressRes.data || [],
        modules: modulesRes.data || [],
      };
    },
  });

  const analytics = useMemo(() => {
    if (!data) return null;
    const { courses, enrollments, lessons, progress, modules } = data;
    const now = new Date();

    // Basic counts
    const publishedCourses = courses.filter(c => c.is_published).length;
    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter(e => e.is_active).length;
    const completedEnrollments = enrollments.filter(e => e.completed_at).length;
    const avgProgress = totalEnrollments > 0
      ? Math.round(enrollments.reduce((s, e) => s + Number(e.progress_percent || 0), 0) / totalEnrollments)
      : 0;

    // Recent enrollments (7d / 30d)
    const recent7d = enrollments.filter(e => e.enrolled_at && differenceInDays(now, parseISO(e.enrolled_at)) <= 7).length;
    const recent30d = enrollments.filter(e => e.enrolled_at && differenceInDays(now, parseISO(e.enrolled_at)) <= 30).length;
    const prev30d = enrollments.filter(e => {
      if (!e.enrolled_at) return false;
      const d = differenceInDays(now, parseISO(e.enrolled_at));
      return d > 30 && d <= 60;
    }).length;
    const growthRate = prev30d > 0 ? Math.round(((recent30d - prev30d) / prev30d) * 100) : recent30d > 0 ? 100 : 0;

    // Enrollment timeline (last 30 days)
    const last30 = eachDayOfInterval({ start: subDays(now, 29), end: now });
    const enrollmentTimeline = last30.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = enrollments.filter(e => e.enrolled_at && format(parseISO(e.enrolled_at), 'yyyy-MM-dd') === dayStr).length;
      return { date: format(day, 'dd/MM', { locale: ptBR }), matrículas: count };
    });

    // Course popularity
    const courseEnrollCounts: Record<string, number> = {};
    enrollments.forEach(e => {
      courseEnrollCounts[e.course_id] = (courseEnrollCounts[e.course_id] || 0) + 1;
    });
    const coursePopularity = courses
      .map(c => ({ name: c.title?.substring(0, 30) || 'Sem título', matrículas: courseEnrollCounts[c.id] || 0 }))
      .sort((a, b) => b.matrículas - a.matrículas)
      .slice(0, 10);

    // Category distribution
    const categoryMap: Record<string, number> = {};
    courses.forEach(c => {
      const cat = c.category || 'Sem categoria';
      categoryMap[cat] = (categoryMap[cat] || 0) + (courseEnrollCounts[c.id] || 0);
    });
    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Progress distribution (buckets)
    const progressBuckets = [
      { range: '0%', count: 0 },
      { range: '1-25%', count: 0 },
      { range: '26-50%', count: 0 },
      { range: '51-75%', count: 0 },
      { range: '76-99%', count: 0 },
      { range: '100%', count: 0 },
    ];
    enrollments.forEach(e => {
      const p = Number(e.progress_percent || 0);
      if (p === 0) progressBuckets[0].count++;
      else if (p <= 25) progressBuckets[1].count++;
      else if (p <= 50) progressBuckets[2].count++;
      else if (p <= 75) progressBuckets[3].count++;
      else if (p < 100) progressBuckets[4].count++;
      else progressBuckets[5].count++;
    });

    // Watch time
    const totalWatchSeconds = progress.reduce((s, p) => s + Number(p.watch_time_seconds || 0), 0);
    const totalWatchHours = Math.round(totalWatchSeconds / 3600);
    const lessonsCompleted = progress.filter(p => p.is_completed).length;

    // Access type distribution
    const accessTypes = courses.reduce((acc, c) => {
      const t = c.access_type || 'free';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const accessData = Object.entries(accessTypes).map(([name, value]) => ({
      name: name === 'free' ? 'Gratuito' : name === 'paid' ? 'Pago' : name === 'members' ? 'Membros' : name,
      value,
    }));

    // Completion rate per course (top 10 with enrollments)
    const completionPerCourse = courses
      .map(c => {
        const courseEnrolls = enrollments.filter(e => e.course_id === c.id);
        const completed = courseEnrolls.filter(e => e.completed_at).length;
        const total = courseEnrolls.length;
        return {
          name: c.title?.substring(0, 25) || 'Sem título',
          taxa: total > 0 ? Math.round((completed / total) * 100) : 0,
          total,
        };
      })
      .filter(c => c.total > 0)
      .sort((a, b) => b.taxa - a.taxa)
      .slice(0, 8);

    // Unique students
    const uniqueStudents = new Set(enrollments.map(e => e.user_id)).size;

    // Active last 7 days
    const activeStudents7d = new Set(
      enrollments.filter(e => e.last_accessed_at && differenceInDays(now, parseISO(e.last_accessed_at)) <= 7).map(e => e.user_id)
    ).size;

    // Lessons completed timeline (last 30 days)
    const lessonsTimeline = last30.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = progress.filter(p => p.completed_at && format(parseISO(p.completed_at), 'yyyy-MM-dd') === dayStr).length;
      return { date: format(day, 'dd/MM', { locale: ptBR }), aulas: count };
    });

    // Avg lessons per course
    const avgLessonsPerCourse = courses.length > 0 ? Math.round(lessons.length / courses.length) : 0;

    // Content hours
    const totalContentMinutes = courses.reduce((s, c) => s + Number(c.total_duration_minutes || 0), 0);

    // Engagement score (active 7d / total unique students)
    const engagementRate = uniqueStudents > 0 ? Math.round((activeStudents7d / uniqueStudents) * 100) : 0;

    return {
      publishedCourses, totalCourses: courses.length, totalEnrollments, activeEnrollments,
      completedEnrollments, avgProgress, recent7d, recent30d, growthRate,
      enrollmentTimeline, coursePopularity, categoryData, progressBuckets,
      totalWatchHours, lessonsCompleted, totalLessons: lessons.length,
      accessData, completionPerCourse, uniqueStudents, activeStudents7d,
      lessonsTimeline, avgLessonsPerCourse, totalContentMinutes, engagementRate,
      completionRate: totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0,
    };
  }, [data]);

  if (isLoading || !analytics) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const a = analytics;

  return (
    <div className="min-h-screen pb-12 bg-[#0a0a0f]">
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-blue-400" />
          <h1 className="text-lg font-bold text-white">Analytics</h1>
          <span className="text-xs text-zinc-600 ml-auto">Atualizado em tempo real</span>
        </div>
      </header>

      <div className="px-6 pt-6 space-y-6">

        {/* ── Widget 1: KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon={BookOpen} label="Cursos Publicados" value={`${a.publishedCourses}/${a.totalCourses}`} color="blue" />
          <KPICard icon={Users} label="Alunos Únicos" value={a.uniqueStudents} color="cyan" />
          <KPICard icon={Layers} label="Total Matrículas" value={a.totalEnrollments} color="purple" />
          <KPICard icon={Eye} label="Matrículas (7d)" value={a.recent7d} color="amber" trend={a.growthRate} />
        </div>

        {/* ── Widget 2: Secondary KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon={Target} label="Progresso Médio" value={`${a.avgProgress}%`} color="emerald" />
          <KPICard icon={Award} label="Taxa de Conclusão" value={`${a.completionRate}%`} color="green" />
          <KPICard icon={Clock} label="Horas Assistidas" value={`${a.totalWatchHours}h`} color="orange" />
          <KPICard icon={Zap} label="Engajamento (7d)" value={`${a.engagementRate}%`} color="pink" subtext={`${a.activeStudents7d} alunos ativos`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Widget 3: Enrollment Timeline ── */}
          <ChartCard title="Matrículas nos Últimos 30 Dias" subtitle={`${a.recent30d} novas matrículas`}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={a.enrollmentTimeline}>
                <defs>
                  <linearGradient id="gradEnroll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#14141f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: 12 }} />
                <Area type="monotone" dataKey="matrículas" stroke="#3b82f6" fill="url(#gradEnroll)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* ── Widget 4: Lessons Completed Timeline ── */}
          <ChartCard title="Aulas Concluídas (30 Dias)" subtitle={`${a.lessonsCompleted} aulas concluídas no total`}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={a.lessonsTimeline}>
                <defs>
                  <linearGradient id="gradLessons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#14141f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: 12 }} />
                <Area type="monotone" dataKey="aulas" stroke="#10b981" fill="url(#gradLessons)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* ── Widget 5: Course Popularity (Bar) ── */}
          <ChartCard title="Top 10 Cursos por Matrículas" subtitle="Popularidade">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={a.coursePopularity} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={false} tickLine={false} width={140} />
                <Tooltip contentStyle={{ backgroundColor: '#14141f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: 12 }} />
                <Bar dataKey="matrículas" radius={[0, 6, 6, 0]}>
                  {a.coursePopularity.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* ── Widget 6: Category Distribution (Pie) ── */}
          <ChartCard title="Distribuição por Categoria" subtitle="Matrículas por área">
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie data={a.categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                    {a.categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#14141f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {a.categoryData.slice(0, 6).map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-zinc-400 truncate flex-1">{cat.name}</span>
                    <span className="text-xs font-medium text-white">{cat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          {/* ── Widget 7: Progress Distribution ── */}
          <ChartCard title="Distribuição de Progresso" subtitle="Onde os alunos estão">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={a.progressBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#14141f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: 12 }} />
                <Bar dataKey="count" name="Alunos" radius={[6, 6, 0, 0]}>
                  {a.progressBuckets.map((_, i) => (
                    <Cell key={i} fill={['#ef4444', '#f97316', '#f59e0b', '#06b6d4', '#8b5cf6', '#10b981'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* ── Widget 8: Completion Rate per Course ── */}
          <ChartCard title="Taxa de Conclusão por Curso" subtitle="Cursos com matrículas">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={a.completionPerCourse} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={false} tickLine={false} width={130} />
                <Tooltip contentStyle={{ backgroundColor: '#14141f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: 12 }} formatter={(v: any) => `${v}%`} />
                <Bar dataKey="taxa" name="Conclusão %" radius={[0, 6, 6, 0]} fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Widget 9: Access Type Distribution ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Tipo de Acesso" subtitle="Cursos por modelo">
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={a.accessData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={3}>
                    {a.accessData.map((_, i) => (
                      <Cell key={i} fill={['#3b82f6', '#f59e0b', '#8b5cf6'][i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#14141f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: 12 }} />
                  <Legend formatter={(v) => <span className="text-xs text-zinc-400">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* ── Widget 10: Content Stats ── */}
          <ChartCard title="Conteúdo da Plataforma" subtitle="Visão geral do catálogo">
            <div className="grid grid-cols-2 gap-4 py-2">
              <StatBlock label="Total de Aulas" value={a.totalLessons} />
              <StatBlock label="Aulas / Curso" value={a.avgLessonsPerCourse} />
              <StatBlock label="Horas de Conteúdo" value={`${Math.round(a.totalContentMinutes / 60)}h`} />
              <StatBlock label="Cursos Publicados" value={a.publishedCourses} />
            </div>
          </ChartCard>

          {/* ── Widget 11: Insights ── */}
          <ChartCard title="Insights" subtitle="Observações automáticas">
            <div className="space-y-3 py-1">
              <InsightItem
                type={a.engagementRate >= 30 ? 'positive' : 'warning'}
                text={a.engagementRate >= 30
                  ? `Engajamento saudável: ${a.engagementRate}% dos alunos acessaram nos últimos 7 dias`
                  : `Engajamento baixo: apenas ${a.engagementRate}% dos alunos acessaram nos últimos 7 dias`
                }
              />
              <InsightItem
                type={a.completionRate >= 20 ? 'positive' : 'warning'}
                text={a.completionRate >= 20
                  ? `Taxa de conclusão de ${a.completionRate}% — acima da média do mercado`
                  : `Taxa de conclusão de ${a.completionRate}% — considere estratégias de reengajamento`
                }
              />
              <InsightItem
                type={a.growthRate > 0 ? 'positive' : 'neutral'}
                text={a.growthRate > 0
                  ? `Crescimento de ${a.growthRate}% em matrículas vs. mês anterior`
                  : 'Matrículas estáveis em relação ao mês anterior'
                }
              />
              <InsightItem
                type="neutral"
                text={`${a.progressBuckets[0].count} alunos com 0% de progresso — oportunidade de onboarding`}
              />
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function KPICard({ icon: Icon, label, value, color, trend, subtext }: {
  icon: any; label: string; value: string | number; color: string; trend?: number; subtext?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-[#14141f] border border-white/5 hover:border-white/10 transition-all">
      <Icon className={`h-5 w-5 text-${color}-400 mb-2`} />
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">{label}</span>
        {trend !== undefined && trend !== 0 && (
          <span className={`flex items-center gap-0.5 text-[10px] font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {subtext && <p className="text-[10px] text-zinc-600 mt-1">{subtext}</p>}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-xl bg-[#14141f] border border-white/5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        {subtitle && <p className="text-[10px] text-zinc-600 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center p-3 rounded-lg bg-white/[0.02] border border-white/5">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[10px] text-zinc-500 mt-0.5">{label}</div>
    </div>
  );
}

function InsightItem({ type, text }: { type: 'positive' | 'warning' | 'neutral'; text: string }) {
  const colors = {
    positive: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    neutral: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  };
  const icons = {
    positive: <TrendingUp className="h-3.5 w-3.5 shrink-0" />,
    warning: <Target className="h-3.5 w-3.5 shrink-0" />,
    neutral: <Zap className="h-3.5 w-3.5 shrink-0" />,
  };
  return (
    <div className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${colors[type]}`}>
      {icons[type]}
      <span>{text}</span>
    </div>
  );
}
