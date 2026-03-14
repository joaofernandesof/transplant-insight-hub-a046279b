// KommoPerformance - Dashboard de Usuários e Performance
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { Badge } from '@/components/ui/badge';
import { MOCK_USERS } from '../types';
import { Trophy, Users, Clock, Target } from 'lucide-react';

export default function KommoPerformance() {
  const closers = MOCK_USERS.filter(u => u.role === 'Closer');
  const sdrs = MOCK_USERS.filter(u => u.role === 'SDR');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total Usuários" value={MOCK_USERS.length} icon={<Users className="h-4 w-4" />} />
        <KPICard label="Melhor Conversão" value={`${closers.sort((a, b) => b.conversionRate - a.conversionRate)[0]?.name}`} icon={<Trophy className="h-4 w-4" />} />
        <KPICard label="Resp. Mais Rápido" value={`${MOCK_USERS.sort((a, b) => a.avgResponseTime - b.avgResponseTime)[0]?.name}`} icon={<Clock className="h-4 w-4" />} />
        <KPICard label="Maior Receita" value={`R$ ${(closers.sort((a, b) => b.revenue - a.revenue)[0]?.revenue / 1000).toFixed(0)}k`} icon={<Target className="h-4 w-4" />} />
      </div>

      {/* Ranking Closers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Ranking — Closers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground text-xs">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">Equipe</th>
                  <th className="pb-2 font-medium text-right">Recebidos</th>
                  <th className="pb-2 font-medium text-right">Ganhos</th>
                  <th className="pb-2 font-medium text-right">Perdidos</th>
                  <th className="pb-2 font-medium text-right">Conv %</th>
                  <th className="pb-2 font-medium text-right">Receita</th>
                  <th className="pb-2 font-medium text-right">Tempo Resp.</th>
                  <th className="pb-2 font-medium text-right">Tempo Fech.</th>
                </tr>
              </thead>
              <tbody>
                {closers.sort((a, b) => b.revenue - a.revenue).map((u, idx) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2 font-bold text-muted-foreground">{idx + 1}</td>
                    <td className="py-2 font-medium">{u.name}</td>
                    <td className="py-2"><Badge variant="outline" className="text-xs">{u.team}</Badge></td>
                    <td className="py-2 text-right">{u.leadsReceived}</td>
                    <td className="py-2 text-right font-medium">{u.leadsConverted}</td>
                    <td className="py-2 text-right text-muted-foreground">{u.leadsLost}</td>
                    <td className="py-2 text-right">
                      <Badge variant={u.conversionRate > 25 ? 'default' : 'secondary'} className="text-xs">{u.conversionRate}%</Badge>
                    </td>
                    <td className="py-2 text-right font-semibold">R$ {(u.revenue / 1000).toFixed(0)}k</td>
                    <td className="py-2 text-right">{u.avgResponseTime}min</td>
                    <td className="py-2 text-right">{u.avgCloseTime}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ranking SDRs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Ranking — SDRs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground text-xs">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">Equipe</th>
                  <th className="pb-2 font-medium text-right">Leads Recebidos</th>
                  <th className="pb-2 font-medium text-right">Tarefas Feitas</th>
                  <th className="pb-2 font-medium text-right">Pendentes</th>
                  <th className="pb-2 font-medium text-right">Tempo Resp.</th>
                </tr>
              </thead>
              <tbody>
                {sdrs.sort((a, b) => b.tasksCompleted - a.tasksCompleted).map((u, idx) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2 font-bold text-muted-foreground">{idx + 1}</td>
                    <td className="py-2 font-medium">{u.name}</td>
                    <td className="py-2"><Badge variant="outline" className="text-xs">{u.team}</Badge></td>
                    <td className="py-2 text-right">{u.leadsReceived}</td>
                    <td className="py-2 text-right font-medium">{u.tasksCompleted}</td>
                    <td className="py-2 text-right text-muted-foreground">{u.tasksPending}</td>
                    <td className="py-2 text-right">{u.avgResponseTime}min</td>
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
