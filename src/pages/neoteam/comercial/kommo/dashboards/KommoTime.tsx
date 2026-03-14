// KommoTime - Dashboard de Atendimento e Tempo
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { Badge } from '@/components/ui/badge';
import { MOCK_PIPELINES, MOCK_USERS } from '../types';
import { Clock, Zap, AlertTriangle } from 'lucide-react';

export default function KommoTime() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Tempo 1º Atendimento" value="23 min" change={-15} changeLabel="melhorou" icon={<Zap className="h-4 w-4" />} />
        <KPICard label="Tempo Médio Fechamento" value="12.4 dias" change={-8.5} icon={<Clock className="h-4 w-4" />} />
        <KPICard label="Tempo Médio Perda" value="18.2 dias" change={5.3} />
        <KPICard label="SLA Atendimento" value="85%" change={-3} icon={<AlertTriangle className="h-4 w-4" />} />
      </div>

      {/* Tempo por Etapa por Funil */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Tempo Médio por Etapa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {MOCK_PIPELINES.slice(0, 3).map(p => (
            <div key={p.id} className="space-y-2">
              <h4 className="text-sm font-semibold">{p.name}</h4>
              <div className="space-y-2">
                {p.stages.map(stage => {
                  const slaOk = stage.avgDays <= 3;
                  return (
                    <div key={stage.id} className="flex items-center gap-3">
                      <span className="text-xs w-32 truncate">{stage.name}</span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${slaOk ? 'bg-primary' : 'bg-destructive/70'}`}
                          style={{ width: `${Math.min(stage.avgDays * 10, 100)}%` }}
                        />
                      </div>
                      <Badge variant={slaOk ? 'secondary' : 'destructive'} className="text-xs w-16 justify-center">
                        {stage.avgDays}d
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tempo por Responsável */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Velocidade por Responsável</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground text-xs">
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">Função</th>
                  <th className="pb-2 font-medium text-right">Tempo Resp.</th>
                  <th className="pb-2 font-medium text-right">Tempo Fech.</th>
                  <th className="pb-2 font-medium text-right">SLA</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_USERS.sort((a, b) => a.avgResponseTime - b.avgResponseTime).map(u => {
                  const slaOk = u.avgResponseTime <= 15;
                  return (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{u.name}</td>
                      <td className="py-2"><Badge variant="outline" className="text-xs">{u.role}</Badge></td>
                      <td className="py-2 text-right">{u.avgResponseTime}min</td>
                      <td className="py-2 text-right">{u.avgCloseTime > 0 ? `${u.avgCloseTime}d` : '-'}</td>
                      <td className="py-2 text-right">
                        <Badge variant={slaOk ? 'default' : 'destructive'} className="text-xs">
                          {slaOk ? 'OK' : 'Atrasado'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
