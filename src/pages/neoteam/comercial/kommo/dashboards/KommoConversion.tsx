// KommoConversion - Dashboard de Conversão
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { MOCK_PIPELINES, MOCK_SOURCES, MOCK_USERS } from '../types';
import { Badge } from '@/components/ui/badge';

export default function KommoConversion() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Conversão Geral" value="8.4%" change={-2.1} />
        <KPICard label="Melhor Funil" value="Indicações" />
        <KPICard label="Melhor Origem" value="Indicação" />
        <KPICard label="Melhor Closer" value="Beatriz R." />
      </div>

      {/* Conversão por Funil */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Conversão por Funil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_PIPELINES.map(p => (
              <div key={p.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{p.name}</span>
                  <Badge variant={p.conversionRate > 20 ? 'default' : 'outline'}>{p.conversionRate}%</Badge>
                </div>
                {/* Stage-to-stage conversion */}
                <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1">
                  {p.stages.map((stage, idx) => {
                    const prev = idx > 0 ? p.stages[idx - 1].leads : null;
                    const rate = prev ? ((stage.leads / prev) * 100).toFixed(0) : '100';
                    return (
                      <div key={stage.id} className="flex items-center gap-1 shrink-0">
                        {idx > 0 && <span className="text-muted-foreground">→ {rate}% →</span>}
                        <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium">{stage.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversão por Origem */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Conversão por Origem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_SOURCES.sort((a, b) => b.conversionRate - a.conversionRate).map(s => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-sm w-36 truncate font-medium">{s.name}</span>
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(s.conversionRate * 2.5, 100)}%` }} />
                </div>
                <span className="text-sm font-semibold w-14 text-right">{s.conversionRate}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversão por Usuário */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Conversão por Responsável</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_USERS.filter(u => u.conversionRate > 0).sort((a, b) => b.conversionRate - a.conversionRate).map(u => (
              <div key={u.id} className="flex items-center gap-3">
                <span className="text-sm w-36 truncate font-medium">{u.name}</span>
                <Badge variant="outline" className="text-xs">{u.role}</Badge>
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(u.conversionRate * 2, 100)}%` }} />
                </div>
                <span className="text-sm font-semibold w-14 text-right">{u.conversionRate}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
