// KommoPerformance - Dashboard de Usuários com dados filtrados
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { Badge } from '@/components/ui/badge';
import { useKommoUsers } from '../hooks/useKommoData';
import { useFilteredLeads, useFilteredTasks } from '../hooks/useFilteredKommoData';
import { Trophy, Users, Clock, Target, Loader2 } from 'lucide-react';
import { useMemo } from 'react';

export default function KommoPerformance() {
  const { data: leads = [], isLoading } = useFilteredLeads();
  const { data: users = [] } = useKommoUsers();
  const { data: tasks = [] } = useFilteredTasks();

  const hasData = leads.length > 0 && users.length > 0;

  const userPerf = useMemo(() => {
    return users.map(u => {
      const userLeads = leads.filter(l => l.responsible_user_kommo_id === u.kommo_id);
      const won = userLeads.filter(l => l.is_won);
      const lost = userLeads.filter(l => l.is_lost);
      const revenue = won.reduce((sum, l) => sum + (l.price || 0), 0);
      const userTasks = tasks.filter(t => t.responsible_user_kommo_id === u.kommo_id);
      const completed = userTasks.filter(t => t.is_completed);
      const pending = userTasks.filter(t => !t.is_completed);

      return {
        id: u.kommo_id,
        name: u.name,
        role: u.role || 'user',
        leadsReceived: userLeads.length,
        won: won.length,
        lost: lost.length,
        conversionRate: userLeads.length > 0 ? ((won.length / userLeads.length) * 100).toFixed(1) : '0',
        revenue,
        tasksCompleted: completed.length,
        tasksPending: pending.length,
      };
    }).filter(u => u.leadsReceived > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [leads, users, tasks]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!hasData) {
    return <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">Sincronize com o Kommo para ver dados de performance.</div>;
  }

  const best = userPerf[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total Usuários" value={users.length} icon={<Users className="h-4 w-4" />} />
        <KPICard label="Melhor Conversão" value={userPerf.sort((a, b) => Number(b.conversionRate) - Number(a.conversionRate))[0]?.name || '-'} icon={<Trophy className="h-4 w-4" />} />
        <KPICard label="Mais Tarefas" value={userPerf.sort((a, b) => b.tasksCompleted - a.tasksCompleted)[0]?.name || '-'} icon={<Clock className="h-4 w-4" />} />
        <KPICard label="Maior Receita" value={best ? `R$ ${(best.revenue / 1000).toFixed(0)}k` : '-'} icon={<Target className="h-4 w-4" />} />
      </div>

      {/* Ranking geral */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Ranking de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground text-xs">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">Função</th>
                  <th className="pb-2 font-medium text-right">Recebidos</th>
                  <th className="pb-2 font-medium text-right">Ganhos</th>
                  <th className="pb-2 font-medium text-right">Perdidos</th>
                  <th className="pb-2 font-medium text-right">Conv %</th>
                  <th className="pb-2 font-medium text-right">Receita</th>
                  <th className="pb-2 font-medium text-right">Tarefas OK</th>
                  <th className="pb-2 font-medium text-right">Pendentes</th>
                </tr>
              </thead>
              <tbody>
                {userPerf.map((u, idx) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2 font-bold text-muted-foreground">{idx + 1}</td>
                    <td className="py-2 font-medium">{u.name}</td>
                    <td className="py-2"><Badge variant="outline" className="text-xs">{u.role}</Badge></td>
                    <td className="py-2 text-right">{u.leadsReceived}</td>
                    <td className="py-2 text-right font-medium">{u.won}</td>
                    <td className="py-2 text-right text-muted-foreground">{u.lost}</td>
                    <td className="py-2 text-right">
                      <Badge variant={Number(u.conversionRate) > 25 ? 'default' : 'secondary'} className="text-xs">{u.conversionRate}%</Badge>
                    </td>
                    <td className="py-2 text-right font-semibold">R$ {(u.revenue / 1000).toFixed(0)}k</td>
                    <td className="py-2 text-right">{u.tasksCompleted}</td>
                    <td className="py-2 text-right text-muted-foreground">{u.tasksPending}</td>
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
