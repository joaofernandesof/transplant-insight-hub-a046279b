// KommoLeads - Dashboard de Leads com dados reais
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { Badge } from '@/components/ui/badge';
import { useKommoLeads, useKommoPipelines, useKommoStages } from '../hooks/useKommoData';
import { Users, UserX, UserCheck, Clock, Loader2 } from 'lucide-react';
import { useMemo } from 'react';

export default function KommoLeads() {
  const { data: leads = [], isLoading } = useKommoLeads();
  const { data: pipelines = [] } = useKommoPipelines();

  const hasData = leads.length > 0;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const stats = useMemo(() => {
    const openLeads = leads.filter(l => !l.is_won && !l.is_lost);
    const noActivity = openLeads.filter(l => l.updated_at_kommo && new Date(l.updated_at_kommo) < sevenDaysAgo);
    const cold = openLeads.filter(l => l.updated_at_kommo && new Date(l.updated_at_kommo) < thirtyDaysAgo);
    const noResponsible = openLeads.filter(l => !l.responsible_user_kommo_id);

    return {
      total: leads.length,
      open: openLeads.length,
      won: leads.filter(l => l.is_won).length,
      lost: leads.filter(l => l.is_lost).length,
      noActivity: noActivity.length,
      cold: cold.length,
      noResponsible: noResponsible.length,
    };
  }, [leads]);

  // Leads per pipeline
  const pipelineDistribution = useMemo(() => {
    return pipelines.map(p => ({
      name: p.name,
      count: leads.filter(l => l.pipeline_kommo_id === p.kommo_id).length,
    }));
  }, [leads, pipelines]);

  // Source stats
  const sourceStats = useMemo(() => {
    const map = new Map<string, { leads: number; won: number; revenue: number }>();
    leads.forEach(l => {
      const src = l.source_name || l.source || 'Desconhecida';
      const e = map.get(src) || { leads: 0, won: 0, revenue: 0 };
      e.leads++;
      if (l.is_won) { e.won++; e.revenue += l.price || 0; }
      map.set(src, e);
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d, conversionRate: d.leads > 0 ? ((d.won / d.leads) * 100).toFixed(1) : '0' }))
      .sort((a, b) => b.leads - a.leads);
  }, [leads]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!hasData) {
    return <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">Sincronize com o Kommo para ver dados de leads.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total de Leads" value={stats.total} icon={<Users className="h-4 w-4" />} />
        <KPICard label="Ganhos" value={stats.won} icon={<UserCheck className="h-4 w-4" />} />
        <KPICard label="Sem Atividade (7d+)" value={stats.noActivity} icon={<Clock className="h-4 w-4" />} />
        <KPICard label="Sem Responsável" value={stats.noResponsible} icon={<UserX className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Em Aberto" value={stats.open} />
        <KPICard label="Perdidos" value={stats.lost} />
        <KPICard label="Frios (30d+)" value={stats.cold} />
        <KPICard label="Taxa Conversão" value={`${stats.total > 0 ? ((stats.won / stats.total) * 100).toFixed(1) : 0}%`} />
      </div>

      {/* Distribuição por Funil */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Distribuição por Funil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pipelineDistribution.map(p => {
              const pct = stats.total > 0 ? ((p.count / stats.total) * 100).toFixed(1) : '0';
              return (
                <div key={p.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground">{p.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Origens */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Origem dos Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Origem</th>
                  <th className="pb-2 font-medium text-right">Leads</th>
                  <th className="pb-2 font-medium text-right">Convertidos</th>
                  <th className="pb-2 font-medium text-right">Conv %</th>
                  <th className="pb-2 font-medium text-right">Receita</th>
                </tr>
              </thead>
              <tbody>
                {sourceStats.slice(0, 10).map(s => (
                  <tr key={s.name} className="border-b last:border-0">
                    <td className="py-2 font-medium">{s.name}</td>
                    <td className="py-2 text-right">{s.leads}</td>
                    <td className="py-2 text-right">{s.won}</td>
                    <td className="py-2 text-right">
                      <Badge variant={Number(s.conversionRate) > 15 ? 'default' : 'secondary'} className="text-xs">{s.conversionRate}%</Badge>
                    </td>
                    <td className="py-2 text-right">R$ {(s.revenue / 1000).toFixed(0)}k</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
