// KommoConversion - Dashboard de Conversão com dados filtrados
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { Badge } from '@/components/ui/badge';
import { useKommoPipelines, useKommoStages, useKommoUsers } from '../hooks/useKommoData';
import { useFilteredLeads } from '../hooks/useFilteredKommoData';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

export default function KommoConversion() {
  const { data: leads = [], isLoading } = useFilteredLeads();
  const { data: pipelines = [] } = useKommoPipelines();
  const { data: allStages = [] } = useKommoStages();
  const { data: users = [] } = useKommoUsers();

  const hasData = leads.length > 0;

  const overallConversion = hasData && leads.length > 0
    ? ((leads.filter(l => l.is_won).length / leads.length) * 100).toFixed(1)
    : '0';

  // Conversion by pipeline (only pipelines with leads)
  const pipelineConversion = useMemo(() => {
    return pipelines
      .map(p => {
        const pLeads = leads.filter(l => l.pipeline_kommo_id === p.kommo_id);
        const won = pLeads.filter(l => l.is_won).length;
        const rate = pLeads.length > 0 ? ((won / pLeads.length) * 100).toFixed(1) : '0';

        const stages = allStages
          .filter(s => s.pipeline_kommo_id === p.kommo_id && !s.is_closed)
          .sort((a, b) => a.sort - b.sort)
          .map(s => ({
            name: s.name,
            count: pLeads.filter(l => l.stage_kommo_id === s.kommo_id).length,
          }));

        return { name: p.name, rate, stages, total: pLeads.length };
      })
      .filter(p => p.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [pipelines, leads, allStages]);

  // Conversion by source
  const sourceConversion = useMemo(() => {
    const map = new Map<string, { leads: number; won: number }>();
    leads.forEach(l => {
      const src = l.source_name || l.source || 'Desconhecida';
      const e = map.get(src) || { leads: 0, won: 0 };
      e.leads++;
      if (l.is_won) e.won++;
      map.set(src, e);
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d, rate: d.leads > 0 ? ((d.won / d.leads) * 100).toFixed(1) : '0' }))
      .sort((a, b) => Number(b.rate) - Number(a.rate));
  }, [leads]);

  // Conversion by user
  const userConversion = useMemo(() => {
    const map = new Map<number, { name: string; leads: number; won: number }>();
    users.forEach(u => map.set(u.kommo_id, { name: u.name, leads: 0, won: 0 }));
    leads.forEach(l => {
      if (l.responsible_user_kommo_id && map.has(l.responsible_user_kommo_id)) {
        const u = map.get(l.responsible_user_kommo_id)!;
        u.leads++;
        if (l.is_won) u.won++;
      }
    });
    return Array.from(map.values())
      .filter(u => u.leads > 0)
      .map(u => ({ ...u, rate: ((u.won / u.leads) * 100).toFixed(1) }))
      .sort((a, b) => Number(b.rate) - Number(a.rate));
  }, [leads, users]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!hasData) {
    return <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">Sincronize com o Kommo para ver dados de conversão.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Conversão Geral" value={`${overallConversion}%`} />
        <KPICard label="Melhor Funil" value={pipelineConversion.sort((a, b) => Number(b.rate) - Number(a.rate))[0]?.name || '-'} />
        <KPICard label="Melhor Origem" value={sourceConversion[0]?.name || '-'} />
        <KPICard label="Melhor Responsável" value={userConversion[0]?.name || '-'} />
      </div>

      {/* By Pipeline */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Conversão por Funil</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pipelineConversion.map(p => (
              <div key={p.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{p.name}</span>
                  <Badge variant={Number(p.rate) > 20 ? 'default' : 'outline'}>{p.rate}%</Badge>
                </div>
                <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1">
                  {p.stages.map((stage, idx) => {
                    const prev = idx > 0 ? p.stages[idx - 1].count : null;
                    const rate = prev && prev > 0 ? ((stage.count / prev) * 100).toFixed(0) : '100';
                    return (
                      <div key={stage.name} className="flex items-center gap-1 shrink-0">
                        {idx > 0 && <span className="text-muted-foreground">→ {rate}% →</span>}
                        <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium">{stage.name} ({stage.count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* By Source */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Conversão por Origem</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sourceConversion.slice(0, 8).map(s => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-sm w-36 truncate font-medium">{s.name}</span>
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(Number(s.rate) * 2.5, 100)}%` }} />
                </div>
                <span className="text-sm font-semibold w-14 text-right">{s.rate}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* By User */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Conversão por Responsável</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userConversion.slice(0, 8).map(u => (
              <div key={u.name} className="flex items-center gap-3">
                <span className="text-sm w-36 truncate font-medium">{u.name}</span>
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(Number(u.rate) * 2, 100)}%` }} />
                </div>
                <span className="text-sm font-semibold w-14 text-right">{u.rate}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
