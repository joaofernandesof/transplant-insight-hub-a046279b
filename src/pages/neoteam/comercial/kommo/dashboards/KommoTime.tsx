// KommoTime - Dashboard de Atendimento e Tempo com dados filtrados
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { Badge } from '@/components/ui/badge';
import { useKommoPipelines, useKommoStages, useKommoUsers } from '../hooks/useKommoData';
import { useFilteredLeads } from '../hooks/useFilteredKommoData';
import { Clock, Zap, AlertTriangle, Loader2 } from 'lucide-react';
import { useMemo } from 'react';

export default function KommoTime() {
  const { data: leads = [], isLoading } = useFilteredLeads();
  const { data: pipelines = [] } = useKommoPipelines();
  const { data: allStages = [] } = useKommoStages();
  const { data: users = [] } = useKommoUsers();

  const hasData = leads.length > 0;

  // Avg close time for won leads
  const avgCloseTime = useMemo(() => {
    const wonLeads = leads.filter(l => l.is_won && l.created_at_kommo && l.closed_at);
    if (wonLeads.length === 0) return 0;
    const totalDays = wonLeads.reduce((sum, l) => {
      const created = new Date(l.created_at_kommo!).getTime();
      const closed = new Date(l.closed_at!).getTime();
      return sum + (closed - created) / (1000 * 60 * 60 * 24);
    }, 0);
    return totalDays / wonLeads.length;
  }, [leads]);

  // Avg loss time
  const avgLossTime = useMemo(() => {
    const lostLeads = leads.filter(l => l.is_lost && l.created_at_kommo && l.closed_at);
    if (lostLeads.length === 0) return 0;
    const totalDays = lostLeads.reduce((sum, l) => {
      const created = new Date(l.created_at_kommo!).getTime();
      const closed = new Date(l.closed_at!).getTime();
      return sum + (closed - created) / (1000 * 60 * 60 * 24);
    }, 0);
    return totalDays / lostLeads.length;
  }, [leads]);

  // Stage time (top pipelines by volume)
  const stageData = useMemo(() => {
    const topPipelines = pipelines
      .map((pipeline) => ({
        ...pipeline,
        leadCount: leads.filter((lead) => lead.pipeline_kommo_id === pipeline.kommo_id).length,
      }))
      .filter((pipeline) => pipeline.leadCount > 0)
      .sort((a, b) => b.leadCount - a.leadCount)
      .slice(0, 3);

    return topPipelines.map(p => {
      const stages = allStages
        .filter(s => s.pipeline_kommo_id === p.kommo_id && !s.is_closed)
        .sort((a, b) => a.sort - b.sort);
      return {
        name: p.name,
        stages: stages.map(s => ({
          name: s.name,
          count: leads.filter(l => l.stage_kommo_id === s.kommo_id).length,
        })),
      };
    });
  }, [pipelines, allStages, leads]);

  // User speed (based on leads data)
  const userSpeed = useMemo(() => {
    return users.map(u => {
      const uLeads = leads.filter(l => l.responsible_user_kommo_id === u.kommo_id);
      const wonLeads = uLeads.filter(l => l.is_won && l.created_at_kommo && l.closed_at);
      const avgClose = wonLeads.length > 0
        ? wonLeads.reduce((sum, l) => sum + (new Date(l.closed_at!).getTime() - new Date(l.created_at_kommo!).getTime()) / (1000 * 60 * 60 * 24), 0) / wonLeads.length
        : 0;
      return { name: u.name, role: u.role || 'user', avgClose: avgClose.toFixed(1), totalLeads: uLeads.length };
    }).filter(u => u.totalLeads > 0).sort((a, b) => Number(a.avgClose) - Number(b.avgClose));
  }, [leads, users]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!hasData) {
    return <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">Sincronize com o Kommo para ver dados de tempo.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Tempo Médio Fechamento" value={`${avgCloseTime.toFixed(1)} dias`} icon={<Clock className="h-4 w-4" />} />
        <KPICard label="Tempo Médio Perda" value={`${avgLossTime.toFixed(1)} dias`} />
        <KPICard label="Leads em Aberto" value={leads.filter(l => !l.is_won && !l.is_lost).length} icon={<Zap className="h-4 w-4" />} />
        <KPICard label="Mais Rápido" value={userSpeed[0]?.name || '-'} icon={<AlertTriangle className="h-4 w-4" />} />
      </div>

      {/* Stage distribution */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Distribuição por Etapa</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {stageData.map(p => (
            <div key={p.name} className="space-y-2">
              <h4 className="text-sm font-semibold">{p.name}</h4>
              <div className="space-y-2">
                {p.stages.map(stage => (
                  <div key={stage.name} className="flex items-center gap-3">
                    <span className="text-xs w-32 truncate">{stage.name}</span>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(stage.count * 2, 100)}%` }} />
                    </div>
                    <Badge variant="secondary" className="text-xs w-16 justify-center">{stage.count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* User speed */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Velocidade por Responsável</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground text-xs">
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">Função</th>
                  <th className="pb-2 font-medium text-right">Leads</th>
                  <th className="pb-2 font-medium text-right">Tempo Fech.</th>
                </tr>
              </thead>
              <tbody>
                {userSpeed.map(u => (
                  <tr key={u.name} className="border-b last:border-0">
                    <td className="py-2 font-medium">{u.name}</td>
                    <td className="py-2"><Badge variant="outline" className="text-xs">{u.role}</Badge></td>
                    <td className="py-2 text-right">{u.totalLeads}</td>
                    <td className="py-2 text-right">{Number(u.avgClose) > 0 ? `${u.avgClose}d` : '-'}</td>
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
