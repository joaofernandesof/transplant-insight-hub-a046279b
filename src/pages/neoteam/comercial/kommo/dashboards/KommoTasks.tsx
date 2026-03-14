// KommoTasks - Dashboard de Tarefas com dados reais
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { Badge } from '@/components/ui/badge';
import { useKommoTasks, useKommoUsers, useKommoLeads } from '../hooks/useKommoData';
import { ListTodo, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { useMemo } from 'react';

export default function KommoTasks() {
  const { data: tasks = [], isLoading } = useKommoTasks();
  const { data: users = [] } = useKommoUsers();
  const { data: leads = [] } = useKommoLeads();

  const hasData = tasks.length > 0;
  const now = new Date();

  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.is_completed);
    const overdue = tasks.filter(t => !t.is_completed && t.complete_till && new Date(t.complete_till) < now);
    const pending = tasks.filter(t => !t.is_completed);
    const rate = tasks.length > 0 ? ((completed.length / tasks.length) * 100).toFixed(1) : '0';
    return { total: tasks.length, completed: completed.length, overdue: overdue.length, pending: pending.length, rate };
  }, [tasks]);

  // Tasks per user
  const userTasks = useMemo(() => {
    return users.map(u => {
      const uTasks = tasks.filter(t => t.responsible_user_kommo_id === u.kommo_id);
      const completed = uTasks.filter(t => t.is_completed);
      const pending = uTasks.filter(t => !t.is_completed);
      const overdue = pending.filter(t => t.complete_till && new Date(t.complete_till) < now);
      const uLeads = leads.filter(l => l.responsible_user_kommo_id === u.kommo_id);
      const convRate = uLeads.length > 0 ? ((uLeads.filter(l => l.is_won).length / uLeads.length) * 100).toFixed(1) : '-';
      const rate = uTasks.length > 0 ? ((completed.length / uTasks.length) * 100).toFixed(1) : '0';
      return { name: u.name, role: u.role || 'user', completed: completed.length, pending: pending.length, overdue: overdue.length, rate, convRate };
    }).filter(u => u.completed > 0 || u.pending > 0).sort((a, b) => b.completed - a.completed);
  }, [tasks, users, leads]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!hasData) {
    return <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">Sincronize com o Kommo para ver dados de tarefas.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Tarefas Criadas" value={stats.total} icon={<ListTodo className="h-4 w-4" />} />
        <KPICard label="Concluídas" value={stats.completed} icon={<CheckCircle className="h-4 w-4" />} />
        <KPICard label="Atrasadas" value={stats.overdue} icon={<AlertCircle className="h-4 w-4" />} />
        <KPICard label="Taxa Conclusão" value={`${stats.rate}%`} icon={<Clock className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Produtividade por Responsável</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground text-xs">
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">Função</th>
                  <th className="pb-2 font-medium text-right">Concluídas</th>
                  <th className="pb-2 font-medium text-right">Pendentes</th>
                  <th className="pb-2 font-medium text-right">Atrasadas</th>
                  <th className="pb-2 font-medium text-right">Taxa</th>
                  <th className="pb-2 font-medium text-right">Conv. Leads</th>
                </tr>
              </thead>
              <tbody>
                {userTasks.map(u => (
                  <tr key={u.name} className="border-b last:border-0">
                    <td className="py-2 font-medium">{u.name}</td>
                    <td className="py-2"><Badge variant="outline" className="text-xs">{u.role}</Badge></td>
                    <td className="py-2 text-right font-medium">{u.completed}</td>
                    <td className="py-2 text-right text-muted-foreground">{u.pending}</td>
                    <td className="py-2 text-right">{u.overdue > 0 ? <Badge variant="destructive" className="text-xs">{u.overdue}</Badge> : '-'}</td>
                    <td className="py-2 text-right"><Badge variant={Number(u.rate) > 90 ? 'default' : 'secondary'} className="text-xs">{u.rate}%</Badge></td>
                    <td className="py-2 text-right text-muted-foreground">{u.convRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Responsáveis com Atraso</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userTasks.filter(u => u.overdue > 0).sort((a, b) => b.overdue - a.overdue).map(u => (
              <div key={u.name} className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.role}</p>
                </div>
                <Badge variant="destructive" className="text-xs">{u.overdue} atrasadas</Badge>
              </div>
            ))}
            {userTasks.filter(u => u.overdue > 0).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa atrasada 🎉</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
