// KommoOverview - Dashboard Executivo com dados reais
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { AlertCard } from '../components/AlertCard';
import { Badge } from '@/components/ui/badge';
import { useKommoLeads, useKommoPipelines, useKommoStages, useKommoUsers, useKommoTasks, useKommoStats } from '../hooks/useKommoData';
import { Users, DollarSign, TrendingUp, Star, Clock, XCircle, Loader2 } from 'lucide-react';
import { MOCK_ALERTS } from '../types';
import { useMemo } from 'react';

export default function KommoOverview() {
  const { data: leads = [], isLoading: loadingLeads } = useKommoLeads();
  const { data: pipelines = [], isLoading: loadingPipelines } = useKommoPipelines();
  const { data: users = [], isLoading: loadingUsers } = useKommoUsers();
  const { data: tasks = [] } = useKommoTasks();
  const stats = useKommoStats();

  const isLoading = loadingLeads || loadingPipelines;
  const hasData = leads.length > 0;

  // Compute source-based stats from leads
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

  // User performance from leads
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

  // Alerts from real data
  const realAlerts = useMemo(() => {
    const alerts: typeof MOCK_ALERTS = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const staleLeads = leads.filter(l => !l.is_won && !l.is_lost && l.updated_at_kommo && new Date(l.updated_at_kommo) < sevenDaysAgo);
    if (staleLeads.length > 0) {
      alerts.push({ id: 'a1', type: 'danger', title: `${staleLeads.length} leads sem atividade há mais de 7 dias`, description: 'Leads parados precisam de atenção imediata.' });
    }

    const noResponsible = leads.filter(l => !l.is_won && !l.is_lost && !l.responsible_user_kommo_id);
    if (noResponsible.length > 0) {
      alerts.push({ id: 'a2', type: 'warning', title: `${noResponsible.length} leads sem responsável`, description: 'Leads sem atribuição nas etapas iniciais.' });
    }

    const overdueTasks = tasks.filter(t => !t.is_completed && t.complete_till && new Date(t.complete_till) < now);
    if (overdueTasks.length > 0) {
      alerts.push({ id: 'a3', type: 'warning', title: `${overdueTasks.length} tarefas vencidas`, description: 'Tarefas atrasadas impactam a produtividade.' });
    }

    return alerts.length > 0 ? alerts : MOCK_ALERTS.slice(0, 4);
  }, [leads, tasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hasData && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700">
          📊 Exibindo dados de demonstração. Sincronize com o Kommo na aba Configurações para ver dados reais.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Leads no Período" value={hasData ? stats.totalLeads.toLocaleString() : '1.195'} icon={<Users className="h-4 w-4" />} />
        <KPICard label="Negócios Ganhos" value={hasData ? stats.wonLeads : 43} icon={<Star className="h-4 w-4" />} />
        <KPICard label="Receita Gerada" value={hasData ? `R$ ${(stats.totalRevenue / 1000).toFixed(0)}k` : 'R$ 847k'} icon={<DollarSign className="h-4 w-4" />} />
        <KPICard label="Taxa de Conversão" value={hasData ? `${stats.conversionRate.toFixed(1)}%` : '8.4%'} icon={<TrendingUp className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Ticket Médio" value={hasData ? `R$ ${(stats.avgTicket / 1000).toFixed(1)}k` : 'R$ 15.7k'} />
        <KPICard label="Leads Perdidos" value={hasData ? stats.lostLeads : 160} />
        <KPICard label="Em Aberto" value={hasData ? stats.openLeads : 892} />
        <KPICard label="Tarefas Atrasadas" value={hasData ? stats.overdueTasks : 60} />
      </div>

      {/* Alertas */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Alertas de Atenção</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {realAlerts.slice(0, 4).map(a => <AlertCard key={a.id} alert={a} />)}
        </div>
      </div>

      {/* Performance Ranking + Sources */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(hasData ? userPerformance : [
              { name: 'Beatriz Rocha', won: 22, revenue: 385000 },
              { name: 'Ana Silva', won: 18, revenue: 270000 },
              { name: 'Gustavo Almeida', won: 12, revenue: 192000 },
            ]).map((user, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.won} ganhos</p>
                </div>
                <span className="text-sm font-semibold shrink-0">R$ {(user.revenue / 1000).toFixed(0)}k</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Melhores Origens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(hasData ? sourceStats.slice(0, 4) : [
                { name: 'Indicação', conversionRate: 35.6, leads: 149, revenue: 477000 },
                { name: 'Evento Presencial', conversionRate: 25, leads: 32, revenue: 80000 },
                { name: 'WhatsApp Orgânico', conversionRate: 15.8, leads: 95, revenue: 127500 },
                { name: 'Site / Landing Page', conversionRate: 7.5, leads: 120, revenue: 67500 },
              ]).map(s => (
                <div key={s.name} className="p-3 rounded-lg bg-muted/30 space-y-1">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <p className="text-lg font-bold">{s.conversionRate.toFixed(1)}%</p>
                  <p className="text-[11px] text-muted-foreground">{s.leads} leads · R$ {(s.revenue / 1000).toFixed(0)}k</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
