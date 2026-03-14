// KommoLeads - Dashboard de Leads
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { Badge } from '@/components/ui/badge';
import { MOCK_PIPELINES, MOCK_SOURCES } from '../types';
import { Users, UserX, UserCheck, Clock } from 'lucide-react';

export default function KommoLeads() {
  const totalLeads = MOCK_PIPELINES.reduce((a, p) => a + p.totalLeads, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total de Leads" value={totalLeads} change={12.4} icon={<Users className="h-4 w-4" />} />
        <KPICard label="Qualificados" value={152} change={8.1} icon={<UserCheck className="h-4 w-4" />} />
        <KPICard label="Sem Atividade (7d+)" value={23} change={-5} icon={<Clock className="h-4 w-4" />} />
        <KPICard label="Sem Responsável" value={8} icon={<UserX className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Idade Média (abertos)" value="14.2 dias" />
        <KPICard label="Tempo até 1º Contato" value="23 min" change={-15} changeLabel="melhorou" />
        <KPICard label="Leads Quentes" value={67} />
        <KPICard label="Leads Frios (30d+)" value={42} />
      </div>

      {/* Distribuição por Funil */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Distribuição por Funil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_PIPELINES.map(p => {
              const pct = ((p.totalLeads / totalLeads) * 100).toFixed(1);
              return (
                <div key={p.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground">{p.totalLeads} ({pct}%)</span>
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

      {/* Origens dos Leads */}
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
                {MOCK_SOURCES.sort((a, b) => b.leads - a.leads).map(s => (
                  <tr key={s.name} className="border-b last:border-0">
                    <td className="py-2 font-medium">{s.name}</td>
                    <td className="py-2 text-right">{s.leads}</td>
                    <td className="py-2 text-right">{s.converted}</td>
                    <td className="py-2 text-right">
                      <Badge variant={s.conversionRate > 15 ? 'default' : 'secondary'} className="text-xs">
                        {s.conversionRate}%
                      </Badge>
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
