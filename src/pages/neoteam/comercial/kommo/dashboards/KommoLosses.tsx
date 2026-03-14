// KommoLosses - Dashboard de Perdas
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { Badge } from '@/components/ui/badge';
import { MOCK_LOSS_REASONS, MOCK_PIPELINES, MOCK_USERS } from '../types';

export default function KommoLosses() {
  const totalLosses = MOCK_LOSS_REASONS.reduce((a, l) => a + l.count, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total de Perdas" value={totalLosses} change={34} changeLabel="aumento" />
        <KPICard label="Taxa de Perda" value="13.1%" change={4.2} />
        <KPICard label="Principal Motivo" value="Preço alto" />
        <KPICard label="Valor Perdido" value="R$ 480k" change={22} />
      </div>

      {/* Motivos de Perda */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Motivos de Perda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_LOSS_REASONS.map(l => (
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

      {/* Perdas por Funil */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Perdas por Funil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MOCK_PIPELINES.map(p => {
              const lossRate = (100 - p.conversionRate).toFixed(1);
              return (
                <div key={p.id} className="p-3 rounded-lg bg-muted/30 space-y-1">
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className="text-lg font-bold">{lossRate}%</p>
                  <p className="text-[11px] text-muted-foreground">de perda acumulada</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Perdas por Usuário */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Perdas por Responsável</CardTitle>
        </CardHeader>
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
                {MOCK_USERS.filter(u => u.leadsLost > 0).sort((a, b) => b.leadsLost - a.leadsLost).map(u => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{u.name}</td>
                    <td className="py-2"><Badge variant="outline" className="text-xs">{u.role}</Badge></td>
                    <td className="py-2 text-right">{u.leadsReceived}</td>
                    <td className="py-2 text-right font-medium">{u.leadsLost}</td>
                    <td className="py-2 text-right">
                      <Badge variant="destructive" className="text-xs">
                        {((u.leadsLost / u.leadsReceived) * 100).toFixed(1)}%
                      </Badge>
                    </td>
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
