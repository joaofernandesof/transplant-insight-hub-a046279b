// KommoOverview - Dashboard Executivo visual com insights em cada widget
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { AlertCard } from '../components/AlertCard';
import { KommoBarChart, KommoPieChart, KommoAreaChart } from '../components/KommoCharts';
import { useFilteredLeads, useFilteredStats, useFilteredTasks } from '../hooks/useFilteredKommoData';
import { useKommoUsers, useKommoPipelines } from '../hooks/useKommoData';
import { useCheckAlerts } from '../hooks/useKommoAlerts';
import {
  Users, DollarSign, TrendingUp, Star, Loader2, Download,
  Trophy, AlertTriangle, Clock, Target, Zap, BarChart3, ArrowUpRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { KommoAlert } from '../types';
import { useMemo, useEffect } from 'react';
import { exportLeadsCSV } from '../utils/csvExport';

// Insight generation helpers
function revenueInsight(revenue: number, wonLeads: number): string {
  if (wonLeads === 0) return 'Nenhuma venda fechada ainda no período.';
  const avg = revenue / wonLeads;
  if (avg > 20000) return `Ticket alto! Média de R$ ${(avg / 1000).toFixed(0)}k por venda.`;
  if (avg > 10000) return `Ticket saudável de R$ ${(avg / 1000).toFixed(0)}k por venda.`;
  return `Ticket médio de R$ ${(avg / 1000).toFixed(0)}k — explore upsell.`;
}

function conversionInsight(rate: number): string {
  if (rate >= 20) return 'Conversão excelente! Acima da média de mercado.';
  if (rate >= 10) return 'Conversão boa. Pequenos ajustes podem elevar.';
  if (rate >= 5) return 'Conversão razoável — revise qualificação.';
  return 'Conversão baixa. Priorize qualidade dos leads.';
}

function lossInsight(lossRate: number, lostCount: number): string {
  if (lossRate > 30) return `⚠️ ${lostCount} perdidos — taxa acima de 30% é crítica.`;
  if (lossRate > 15) return `${lostCount} leads perdidos — monitore motivos.`;
  return `Apenas ${lostCount} perdidos — bom controle!`;
}

function taskInsight(overdue: number, total: number): string {
  if (total === 0) return 'Nenhuma tarefa registrada no período.';
  const rate = (overdue / total) * 100;
  if (rate > 30) return `${overdue} atrasadas (${rate.toFixed(0)}%) — ação urgente!`;
  if (rate > 10) return `${overdue} atrasadas — atenção aos prazos.`;
  if (overdue === 0) return 'Todas em dia! Equipe produtiva. 🎯';
  return `Apenas ${overdue} atrasada(s) — quase perfeito!`;
}

export default function KommoOverview() {
  const { data: leads, isLoading } = useFilteredLeads();
  const { data: tasks } = useFilteredTasks();
  const { data: users = [] } = useKommoUsers();
  const { data: pipelines = [] } = useKommoPipelines();
  const stats = useFilteredStats();
  const checkAlerts = useCheckAlerts();

  const hasData = leads.length > 0;

  // Check alerts when stats change
  useEffect(() => {
    if (hasData) {
      checkAlerts.mutate({
        stale_leads: leads.filter(l => !l.is_won && !l.is_lost && l.updated_at_kommo && new Date(l.updated_at_kommo) < new Date(Date.now() - 7 * 86400000)).length,
        loss_rate: stats.lossRate,
        overdue_tasks: stats.overdueTasks,
        conversion_rate: stats.conversionRate,
        open_leads: stats.openLeads,
      });
    }
  }, [hasData, stats.totalLeads]);

  // Source stats
  const sourceStats = useMemo(() => {
    const map = new Map<string, { leads: number; won: number; revenue: number }>();
    leads.forEach(l => {
      const src = l.source_name || l.source || 'Desconhecida';
      const entry = map.get(src) || { leads: 0, won: 0, revenue: 0 };
      entry.leads++;
      if (l.is_won) { entry.won++; entry.revenue += l.price || 0; }
      map.set(src, entry);
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d, conversionRate: d.leads > 0 ? (d.won / d.leads) * 100 : 0 }))
      .sort((a, b) => b.conversionRate - a.conversionRate);
  }, [leads]);

  // User performance
  const userPerformance = useMemo(() => {
    const map = new Map<number, { name: string; won: number; revenue: number; total: number }>();
    users.forEach(u => map.set(u.kommo_id, { name: u.name, won: 0, revenue: 0, total: 0 }));
    leads.forEach(l => {
      if (l.responsible_user_kommo_id && map.has(l.responsible_user_kommo_id)) {
        const u = map.get(l.responsible_user_kommo_id)!;
        u.total++;
        if (l.is_won) { u.won++; u.revenue += l.price || 0; }
      }
    });
    return Array.from(map.values())
      .filter(u => u.won > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [leads, users]);

  // Charts data (focus on pipelines with real volume)
  const pipelineChartData = useMemo(() => {
    return pipelines
      .map(p => {
        const pLeads = leads.filter(l => l.pipeline_kommo_id === p.kommo_id);
        return {
          name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
          Leads: pLeads.length,
          Ganhos: pLeads.filter(l => l.is_won).length,
        };
      })
      .filter(p => p.Leads > 0)
      .sort((a, b) => b.Leads - a.Leads)
      .slice(0, 12);
  }, [leads, pipelines]);

  const statusChartData = useMemo(() => [
    { name: 'Em Aberto', value: stats.openLeads },
    { name: 'Ganhos', value: stats.wonLeads },
    { name: 'Perdidos', value: stats.lostLeads },
  ], [stats]);

  // Best source insight
  const bestSource = sourceStats.length > 0 ? sourceStats[0] : null;
  const bestSourceInsight = bestSource
    ? `"${bestSource.name}" é a melhor origem — ${bestSource.conversionRate.toFixed(1)}% de conversão com ${bestSource.leads} leads.`
    : 'Sem dados de origem ainda.';

  // Best performer insight
  const bestPerformer = userPerformance.length > 0 ? userPerformance[0] : null;
  const performerInsight = bestPerformer
    ? `${bestPerformer.name} lidera com ${bestPerformer.won} vendas e R$ ${(bestPerformer.revenue / 1000).toFixed(0)}k gerados.`
    : 'Sem dados de performance ainda.';

  // Alerts - only real alerts
  const realAlerts = useMemo(() => {
    const alerts: KommoAlert[] = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const staleLeads = leads.filter(l => !l.is_won && !l.is_lost && l.updated_at_kommo && new Date(l.updated_at_kommo) < sevenDaysAgo);
    if (staleLeads.length > 0) alerts.push({ id: 'a1', type: 'danger', title: `${staleLeads.length} leads sem atividade há mais de 7 dias`, description: 'Leads parados precisam de atenção imediata.' });
    const noResp = leads.filter(l => !l.is_won && !l.is_lost && !l.responsible_user_kommo_id);
    if (noResp.length > 0) alerts.push({ id: 'a2', type: 'warning', title: `${noResp.length} leads sem responsável`, description: 'Leads sem atribuição nas etapas iniciais.' });
    const overdue = tasks.filter(t => !t.is_completed && t.complete_till && new Date(t.complete_till) < now);
    if (overdue.length > 0) alerts.push({ id: 'a3', type: 'warning', title: `${overdue.length} tarefas vencidas`, description: 'Tarefas atrasadas impactam a produtividade.' });
    return alerts;
  }, [leads, tasks]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
        <div>
          <h3 className="text-lg font-semibold">Nenhum dado sincronizado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Vá na aba <strong>Configurações</strong> e conecte sua conta Kommo para ver seus dados reais aqui.
          </p>
        </div>
      </div>
    );
  }

  const v = stats;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Row 1: 4 KPIs Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Leads no Período"
          value={v.totalLeads.toLocaleString()}
          icon={<Users className="h-3.5 w-3.5" />}
          color="blue"
          insight={`${v.openLeads} em aberto (${((v.openLeads / Math.max(v.totalLeads, 1)) * 100).toFixed(0)}% do total).`}
        />
        <KPICard
          label="Negócios Ganhos"
          value={v.wonLeads}
          icon={<Star className="h-3.5 w-3.5" />}
          color="emerald"
          insight={revenueInsight(v.totalRevenue, v.wonLeads)}
        />
        <KPICard
          label="Receita Gerada"
          value={`R$ ${(v.totalRevenue / 1000).toFixed(0)}k`}
          icon={<DollarSign className="h-3.5 w-3.5" />}
          color="violet"
          insight={`Ticket médio de R$ ${(v.avgTicket / 1000).toFixed(1)}k por venda.`}
        />
        <KPICard
          label="Taxa de Conversão"
          value={`${v.conversionRate.toFixed(1)}%`}
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          color="cyan"
          insight={conversionInsight(v.conversionRate)}
        />
      </div>

      {/* Row 2: 4 KPIs Secundários */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Ticket Médio"
          value={`R$ ${(v.avgTicket / 1000).toFixed(1)}k`}
          icon={<Target className="h-3.5 w-3.5" />}
          color="amber"
          insight={v.avgTicket > 15000 ? 'Acima de R$ 15k — excelente posicionamento!' : 'Abaixo de R$ 15k — explore pacotes premium.'}
        />
        <KPICard
          label="Leads Perdidos"
          value={v.lostLeads}
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          color="rose"
          insight={lossInsight(v.lossRate, v.lostLeads)}
        />
        <KPICard
          label="Em Aberto"
          value={v.openLeads}
          icon={<Clock className="h-3.5 w-3.5" />}
          color="orange"
          insight={v.openLeads > 500 ? 'Muitos leads em aberto — priorize follow-ups.' : 'Volume gerenciável de leads em andamento.'}
        />
        <KPICard
          label="Tarefas Atrasadas"
          value={v.overdueTasks}
          icon={<Zap className="h-3.5 w-3.5" />}
          color="pink"
          insight={taskInsight(v.overdueTasks, v.totalTasks)}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pipeline Chart */}
        <Card className="border-blue-200/40 dark:border-blue-800/30 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" /> Leads por Funil
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                💡 {pipelines.length > 0
                  ? `${pipelines.length} funis ativos — distribua esforços nos mais rentáveis.`
                  : 'Configure seus funis no Kommo.'}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => exportLeadsCSV(leads)}>
              <Download className="h-3 w-3" /> CSV
            </Button>
          </CardHeader>
          <CardContent>
            <KommoBarChart data={pipelineChartData} xKey="name" yKey="Leads" height={220} />
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-emerald-200/40 dark:border-emerald-800/30 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-500" /> Distribuição por Status
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              💡 {v.openLeads > v.wonLeads + v.lostLeads
                ? `${((v.openLeads / v.totalLeads) * 100).toFixed(0)}% em aberto — boa base de oportunidades.`
                : 'Maioria dos leads já finalizada — abasteça o funil.'}
            </p>
          </CardHeader>
          <CardContent>
            <KommoPieChart data={statusChartData} height={220} />
          </CardContent>
        </Card>
      </div>

      {/* Alerts section */}
      {realAlerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" /> Alertas Inteligentes
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            {realAlerts.slice(0, 4).map(a => <AlertCard key={a.id} alert={a} />)}
          </div>
        </div>
      )}

      {/* Performance + Sources Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Performance */}
        <Card className="border-violet-200/40 dark:border-violet-800/30 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-500 to-pink-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-violet-500" /> Ranking de Performance
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              💡 {performerInsight}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {userPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma venda registrada no período.</p>
            ) : (
              userPerformance.map((user, idx) => {
                const medals = ['🥇', '🥈', '🥉'];
                const convRate = user.total > 0 ? ((user.won / user.total) * 100).toFixed(0) : '0';
                const barWidth = (user.revenue / Math.max(userPerformance[0]?.revenue || 1, 1)) * 100;
                return (
                  <div key={idx} className="space-y-1 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{medals[idx] || `#${idx + 1}`}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{user.won} ganhos</span>
                          <span>·</span>
                          <span>{convRate}% conv</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-violet-600 dark:text-violet-400">R$ {(user.revenue / 1000).toFixed(0)}k</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-700"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Best Sources */}
        <Card className="border-amber-200/40 dark:border-amber-800/30 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-amber-500" /> Melhores Origens
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              💡 {bestSourceInsight}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {sourceStats.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center col-span-2">Sem dados de origem no período.</p>
              ) : (
                sourceStats.slice(0, 4).map((s, idx) => {
                  const colors = [
                    'from-amber-500/20 to-amber-500/5 border-amber-300/50 dark:border-amber-700/40',
                    'from-orange-500/20 to-orange-500/5 border-orange-300/50 dark:border-orange-700/40',
                    'from-cyan-500/20 to-cyan-500/5 border-cyan-300/50 dark:border-cyan-700/40',
                    'from-blue-500/20 to-blue-500/5 border-blue-300/50 dark:border-blue-700/40',
                  ];
                  const qualityLabel = s.conversionRate >= 20 ? '🔥 Top' : s.conversionRate >= 10 ? '✅ Boa' : '📊 Regular';
                  return (
                    <div key={s.name} className={`p-3 rounded-xl border bg-gradient-to-br ${colors[idx]} space-y-1.5 transition-all hover:shadow-sm`}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold truncate flex-1">{s.name}</p>
                        <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">{qualityLabel}</Badge>
                      </div>
                      <p className="text-2xl font-bold tracking-tight">{s.conversionRate.toFixed(1)}%</p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{s.leads} leads</span>
                        <span className="font-semibold">R$ {(s.revenue / 1000).toFixed(0)}k</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
