// KommoSources - Dashboard de Origens e Canais
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { Badge } from '@/components/ui/badge';
import { MOCK_SOURCES } from '../types';

export default function KommoSources() {
  const totalLeads = MOCK_SOURCES.reduce((a, s) => a + s.leads, 0);
  const totalRevenue = MOCK_SOURCES.reduce((a, s) => a + s.revenue, 0);
  const bestSource = MOCK_SOURCES.sort((a, b) => b.conversionRate - a.conversionRate)[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Origens Ativas" value={MOCK_SOURCES.length} />
        <KPICard label="Total de Leads" value={totalLeads} change={10.2} />
        <KPICard label="Receita Total" value={`R$ ${(totalRevenue / 1000).toFixed(0)}k`} />
        <KPICard label="Melhor Origem" value={bestSource.name} />
      </div>

      {/* Volume por Origem */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Volume e Conversão por Origem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_SOURCES.sort((a, b) => b.leads - a.leads).map(s => {
              const leadsPct = (s.leads / totalLeads) * 100;
              return (
                <div key={s.name} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={s.conversionRate > 15 ? 'default' : 'outline'} className="text-xs">{s.conversionRate}% conv</Badge>
                      <span className="text-muted-foreground">{s.leads} leads</span>
                    </div>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary/70 rounded-l-full" style={{ width: `${leadsPct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{s.converted} convertidos</span>
                    <span>R$ {(s.revenue / 1000).toFixed(0)}k receita</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comparativo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Comparativo: Volume vs Conversão</CardTitle>
        </CardHeader>
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
                {MOCK_SOURCES.sort((a, b) => b.revenue - a.revenue).map(s => (
                  <tr key={s.name} className="border-b last:border-0">
                    <td className="py-2 font-medium">{s.name}</td>
                    <td className="py-2 text-right">{s.leads}</td>
                    <td className="py-2 text-right text-muted-foreground">{((s.leads / totalLeads) * 100).toFixed(1)}%</td>
                    <td className="py-2 text-right">{s.converted}</td>
                    <td className="py-2 text-right"><Badge variant="secondary" className="text-xs">{s.conversionRate}%</Badge></td>
                    <td className="py-2 text-right font-semibold">R$ {(s.revenue / 1000).toFixed(0)}k</td>
                    <td className="py-2 text-right">{s.converted > 0 ? `R$ ${(s.revenue / s.converted / 1000).toFixed(1)}k` : '-'}</td>
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
