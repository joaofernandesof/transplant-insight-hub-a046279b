// KommoTasks - Dashboard de Tarefas e Produtividade
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { Badge } from '@/components/ui/badge';
import { MOCK_USERS } from '../types';
import { ListTodo, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const MOCK_TASK_SUMMARY = {
  total: 1160,
  completed: 980,
  pending: 120,
  overdue: 60,
  completionRate: 84.5,
};

export default function KommoTasks() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Tarefas Criadas" value={MOCK_TASK_SUMMARY.total} change={5.2} icon={<ListTodo className="h-4 w-4" />} />
        <KPICard label="Concluídas" value={MOCK_TASK_SUMMARY.completed} icon={<CheckCircle className="h-4 w-4" />} />
        <KPICard label="Atrasadas" value={MOCK_TASK_SUMMARY.overdue} change={12} icon={<AlertCircle className="h-4 w-4" />} />
        <KPICard label="Taxa Conclusão" value={`${MOCK_TASK_SUMMARY.completionRate}%`} change={-2.3} icon={<Clock className="h-4 w-4" />} />
      </div>

      {/* Tarefas por Usuário */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Produtividade por Responsável</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground text-xs">
                  <th className="pb-2 font-medium">Nome</th>
                  <th className="pb-2 font-medium">Função</th>
                  <th className="pb-2 font-medium text-right">Concluídas</th>
                  <th className="pb-2 font-medium text-right">Pendentes</th>
                  <th className="pb-2 font-medium text-right">Taxa</th>
                  <th className="pb-2 font-medium text-right">Correlação Conv.</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_USERS.sort((a, b) => b.tasksCompleted - a.tasksCompleted).map(u => {
                  const rate = ((u.tasksCompleted / (u.tasksCompleted + u.tasksPending)) * 100).toFixed(1);
                  return (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{u.name}</td>
                      <td className="py-2"><Badge variant="outline" className="text-xs">{u.role}</Badge></td>
                      <td className="py-2 text-right font-medium">{u.tasksCompleted}</td>
                      <td className="py-2 text-right text-muted-foreground">{u.tasksPending}</td>
                      <td className="py-2 text-right">
                        <Badge variant={Number(rate) > 90 ? 'default' : 'secondary'} className="text-xs">{rate}%</Badge>
                      </td>
                      <td className="py-2 text-right text-muted-foreground">
                        {u.conversionRate > 0 ? `${u.conversionRate}% conv` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tarefas Atrasadas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Tarefas Atrasadas — Detalhes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_USERS.filter(u => u.tasksPending > 10).sort((a, b) => b.tasksPending - a.tasksPending).map(u => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.role} · {u.team}</p>
                </div>
                <Badge variant="destructive" className="text-xs">{u.tasksPending} pendentes</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
