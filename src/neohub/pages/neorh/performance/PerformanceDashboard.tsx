import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, AlertTriangle, Award, Users, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GradeDistribution { A: number; B: number; C: number; D: number; pending: number; }

const IDEAL = { A: 15, B: 65, C: 15, D: 5 };
const GRADE_COLORS: Record<string, string> = {
  A: 'bg-emerald-500', B: 'bg-blue-500', C: 'bg-amber-500', D: 'bg-red-500',
};
const GRADE_TEXT: Record<string, string> = {
  A: 'text-emerald-600 dark:text-emerald-400',
  B: 'text-blue-600 dark:text-blue-400',
  C: 'text-amber-600 dark:text-amber-400',
  D: 'text-red-600 dark:text-red-400',
};
const GRADE_LABELS: Record<string, string> = {
  A: 'Alta Performance', B: 'Boa Performance', C: 'Performance Baixa', D: 'Performance Crítica',
};

export default function PerformanceDashboard() {
  const navigate = useNavigate();
  const [dist, setDist] = useState<GradeDistribution>({ A: 0, B: 0, C: 0, D: 0, pending: 0 });
  const [totalColabs, setTotalColabs] = useState(0);
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cyclesRes, colabsRes, alertsRes] = await Promise.all([
        supabase.from('rh_performance_cycles').select('*').order('created_at', { ascending: false }).limit(1),
        supabase.from('rh_colaboradores').select('id').eq('status', 'ativo'),
        supabase.from('rh_performance_alerts').select('*').eq('is_read', false).order('created_at', { ascending: false }).limit(10),
      ]);

      const cycle = cyclesRes.data?.[0];
      setActiveCycle(cycle);
      setTotalColabs(colabsRes.data?.length || 0);
      setAlerts(alertsRes.data || []);

      if (cycle) {
        const { data: evals } = await supabase
          .from('rh_performance_evaluations')
          .select('grade, final_score, colaborador_id, status')
          .eq('cycle_id', cycle.id);

        const d: GradeDistribution = { A: 0, B: 0, C: 0, D: 0, pending: 0 };
        const completedEvals = (evals || []).filter(e => e.status === 'completed');
        completedEvals.forEach(e => {
          if (e.grade && ['A', 'B', 'C', 'D'].includes(e.grade)) d[e.grade as keyof typeof d]++;
          else d.pending++;
        });
        d.pending += (evals || []).filter(e => e.status === 'pending').length;
        setDist(d);

        // Top performers
        const sorted = completedEvals
          .filter(e => e.final_score != null)
          .sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
          .slice(0, 5);

        if (sorted.length > 0) {
          const ids = sorted.map(s => s.colaborador_id);
          const { data: colabs } = await supabase
            .from('rh_colaboradores')
            .select('id, nome, cargo_id')
            .in('id', ids);

          const colabMap = new Map((colabs || []).map(c => [c.id, c]));
          setTopPerformers(sorted.map(s => ({
            ...s,
            nome: colabMap.get(s.colaborador_id)?.nome || 'N/A',
          })));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const totalEvaluated = dist.A + dist.B + dist.C + dist.D;
  const pctA = totalEvaluated ? Math.round((dist.A / totalEvaluated) * 100) : 0;
  const pctCD = totalEvaluated ? Math.round(((dist.C + dist.D) / totalEvaluated) * 100) : 0;

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestão de Performance</h1>
        <p className="text-muted-foreground">Painel de controle de desempenho dos colaboradores</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/neorh/performance/cycles')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Target className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Ciclo Ativo</p>
                <p className="text-lg font-bold">{activeCycle?.name || 'Nenhum'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"><Award className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Nível A</p>
                <p className="text-lg font-bold">{pctA}% <span className="text-xs text-muted-foreground">(ideal: {IDEAL.A}%)</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Nível C + D</p>
                <p className="text-lg font-bold">{pctCD}% <span className="text-xs text-muted-foreground">(ideal: {IDEAL.C + IDEAL.D}%)</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Users className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Colaboradores Ativos</p>
                <p className="text-lg font-bold">{totalColabs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Distribuição por Nível</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(['A', 'B', 'C', 'D'] as const).map(grade => {
              const count = dist[grade];
              const pct = totalEvaluated ? Math.round((count / totalEvaluated) * 100) : 0;
              return (
                <div key={grade} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={`font-semibold ${GRADE_TEXT[grade]}`}>
                      {grade} — {GRADE_LABELS[grade]}
                    </span>
                    <span className="text-muted-foreground">{count} ({pct}%) <span className="text-xs">ideal: {IDEAL[grade]}%</span></span>
                  </div>
                  <div className="flex gap-1 items-center">
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${GRADE_COLORS[grade]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {totalEvaluated === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma avaliação concluída neste ciclo</p>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Top Performance</CardTitle></CardHeader>
          <CardContent>
            {topPerformers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma avaliação concluída</p>
            ) : (
              <div className="space-y-3">
                {topPerformers.map((p, i) => (
                  <div key={p.colaborador_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium">{p.nome}</p>
                    </div>
                    <Badge variant={p.grade === 'A' ? 'default' : 'secondary'} className={p.grade === 'A' ? 'bg-emerald-500' : ''}>
                      {p.grade} — {p.final_score?.toFixed(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Alertas Recentes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <Badge variant={a.grade === 'D' ? 'destructive' : 'secondary'}>{a.grade}</Badge>
                  <span className="text-sm">{a.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Ciclos de Avaliação', route: '/neorh/performance/cycles', icon: Target },
          { label: 'Avaliações', route: '/neorh/performance/evaluations', icon: BarChart3 },
          { label: 'Ranking', route: '/neorh/performance/ranking', icon: TrendingUp },
          { label: 'KPIs por Cargo', route: '/neorh/performance/kpis', icon: Award },
        ].map(item => (
          <Card key={item.route} className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all" onClick={() => navigate(item.route)}>
            <CardContent className="p-4 flex items-center gap-3">
              <item.icon className="h-5 w-5 text-primary" />
              <span className="font-medium">{item.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
