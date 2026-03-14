// KommoLosses - Dashboard de Perdas com dados filtrados
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { Badge } from '@/components/ui/badge';
import { useKommoPipelines, useKommoUsers } from '../hooks/useKommoData';
import { useFilteredLeads } from '../hooks/useFilteredKommoData';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

export default function KommoLosses() {
  const { data: leads = [], isLoading } = useKommoLeads();
  const { data: pipelines = [] } = useKommoPipelines();
  const { data: users = [] } = useKommoUsers();

  const hasData = leads.length > 0;
  const lostLeads = leads.filter(l => l.is_lost);
  const lostValue = lostLeads.reduce((sum, l) => sum + (l.price || 0), 0);
  const lossRate = leads.length > 0 ? ((lostLeads.length / leads.length) * 100).toFixed(1) : '0';

  // Loss reasons
  const lossReasons = useMemo(() => {
    const map = new Map<string, number>();
    lostLeads.forEach(l => {
      const reason = l.loss_reason || 'Não informado';
      map.set(reason, (map.get(reason) || 0) + 1);
    });
    const total = lostLeads.length || 1;
    return Array.from(map.entries())
      .map(([reason, count]) => ({ reason, count, percentage: ((count / total) * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count);
  }, [lostLeads]);

  // Losses per pipeline
  const pipelineLosses = useMemo(() => {
    return pipelines.map(p => {
      const pLeads = leads.filter(l => l.pipeline_kommo_id === p.kommo_id);
      const pLost = pLeads.filter(l => l.is_lost);
      return {
        name: p.name,
        total: pLeads.length,
        lost: pLost.length,
        rate: pLeads.length > 0 ? ((pLost.length / pLeads.length) * 100).toFixed(1) : '0',
      };
    });
  }, [leads, pipelines]);

  // Losses per user
  const userLosses = useMemo(() => {
    return users.map(u => {
      const uLeads = leads.filter(l => l.responsible_user_kommo_id === u.kommo_id);
      const uLost = uLeads.filter(l => l.is_lost);
      return {
        name: u.name,
        role: u.role || 'user',
        received: uLeads.length,
        lost: uLost.length,
        rate: uLeads.length > 0 ? ((uLost.length / uLeads.length) * 100).toFixed(1) : '0',
      };
    }).filter(u => u.lost > 0).sort((a, b) => b.lost - a.lost);
  }, [leads, users]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!hasData) {
    return <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">Sincronize com o Kommo para ver dados de perdas.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total de Perdas" value={lostLeads.length} />
        <KPICard label="Taxa de Perda" value={`${lossRate}%`} />
        <KPICard label="Principal Motivo" value={lossReasons[0]?.reason || '-'} />
        <KPICard label="Valor Perdido" value={`R$ ${(lostValue / 1000).toFixed(0)}k`} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Motivos de Perda</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lossReasons.map(l => (
              <div key={l.reason} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{l.reason}</span>
                  <span className="text-muted-foreground">{l.count} ({l.percentage}%)</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-destructive/70 rounded-full" style={{ width: `${l.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Perdas por Funil</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {pipelineLosses.map(p => (
              <div key={p.name} className="p-3 rounded-lg bg-muted/30 space-y-1">
                <p className="text-xs font-medium truncate">{p.name}</p>
                <p className="text-lg font-bold">{p.rate}%</p>
                <p className="text-[11px] text-muted-foreground">{p.lost} de {p.total} leads</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Perdas por Responsável</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground text-xs">
                  <th className="pb-2 font-medium">Responsável</th>
                  <th className="pb-2 font-medium">Função</th>
                  <th className="pb-2 font-medium text-right">Recebidos</th>
                  <th className="pb-2 font-medium text-right">Perdidos</th>
                  <th className="pb-2 font-medium text-right">Taxa Perda</th>
                </tr>
              </thead>
              <tbody>
                {userLosses.map(u => (
                  <tr key={u.name} className="border-b last:border-0">
                    <td className="py-2 font-medium">{u.name}</td>
                    <td className="py-2"><Badge variant="outline" className="text-xs">{u.role}</Badge></td>
                    <td className="py-2 text-right">{u.received}</td>
                    <td className="py-2 text-right font-medium">{u.lost}</td>
                    <td className="py-2 text-right"><Badge variant="destructive" className="text-xs">{u.rate}%</Badge></td>
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
