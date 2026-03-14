// KommoSources - Dashboard de Origens com dados filtrados
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { Badge } from '@/components/ui/badge';
import { useFilteredLeads } from '../hooks/useFilteredKommoData';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

export default function KommoSources() {
  const { data: leads = [], isLoading } = useKommoLeads();
  const hasData = leads.length > 0;

  const sourceData = useMemo(() => {
    const map = new Map<string, { leads: number; won: number; revenue: number }>();
    leads.forEach(l => {
      const src = l.source_name || l.source || 'Desconhecida';
      const e = map.get(src) || { leads: 0, won: 0, revenue: 0 };
      e.leads++;
      if (l.is_won) { e.won++; e.revenue += l.price || 0; }
      map.set(src, e);
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({
        name,
        ...d,
        conversionRate: d.leads > 0 ? ((d.won / d.leads) * 100) : 0,
        ticket: d.won > 0 ? d.revenue / d.won : 0,
      }))
      .sort((a, b) => b.leads - a.leads);
  }, [leads]);

  const totalLeads = sourceData.reduce((a, s) => a + s.leads, 0);
  const totalRevenue = sourceData.reduce((a, s) => a + s.revenue, 0);
  const best = sourceData.sort((a, b) => b.conversionRate - a.conversionRate)[0];

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!hasData) {
    return <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">Sincronize com o Kommo para ver dados de origens.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Origens Ativas" value={sourceData.length} />
        <KPICard label="Total de Leads" value={totalLeads} />
        <KPICard label="Receita Total" value={`R$ ${(totalRevenue / 1000).toFixed(0)}k`} />
        <KPICard label="Melhor Origem" value={best?.name || '-'} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Volume e Conversão por Origem</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sourceData.sort((a, b) => b.leads - a.leads).map(s => (
              <div key={s.name} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.conversionRate > 15 ? 'default' : 'outline'} className="text-xs">{s.conversionRate.toFixed(1)}% conv</Badge>
                    <span className="text-muted-foreground">{s.leads} leads</span>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary/70 rounded-l-full" style={{ width: `${totalLeads > 0 ? (s.leads / totalLeads) * 100 : 0}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{s.won} convertidos</span>
                  <span>R$ {(s.revenue / 1000).toFixed(0)}k receita</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Comparativo Detalhado</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground text-xs">
                  <th className="pb-2 font-medium">Origem</th>
                  <th className="pb-2 font-medium text-right">Leads</th>
                  <th className="pb-2 font-medium text-right">% Volume</th>
                  <th className="pb-2 font-medium text-right">Convertidos</th>
                  <th className="pb-2 font-medium text-right">Conv %</th>
                  <th className="pb-2 font-medium text-right">Receita</th>
                  <th className="pb-2 font-medium text-right">Ticket Médio</th>
                </tr>
              </thead>
              <tbody>
                {sourceData.sort((a, b) => b.revenue - a.revenue).map(s => (
                  <tr key={s.name} className="border-b last:border-0">
                    <td className="py-2 font-medium">{s.name}</td>
                    <td className="py-2 text-right">{s.leads}</td>
                    <td className="py-2 text-right text-muted-foreground">{totalLeads > 0 ? ((s.leads / totalLeads) * 100).toFixed(1) : 0}%</td>
                    <td className="py-2 text-right">{s.won}</td>
                    <td className="py-2 text-right"><Badge variant="secondary" className="text-xs">{s.conversionRate.toFixed(1)}%</Badge></td>
                    <td className="py-2 text-right font-semibold">R$ {(s.revenue / 1000).toFixed(0)}k</td>
                    <td className="py-2 text-right">{s.ticket > 0 ? `R$ ${(s.ticket / 1000).toFixed(1)}k` : '-'}</td>
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
