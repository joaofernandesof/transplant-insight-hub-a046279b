import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, Users, Clock, CheckCircle2, 
  AlertTriangle, TrendingUp, Activity 
} from 'lucide-react';
import { useCleaningRoutine, useCleaningInspection } from '../hooks';
import { STATUS_COLORS, STATUS_LABELS, RISK_LEVEL_BADGES } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonitoringTabProps {
  branchId: string;
}

export function MonitoringTab({ branchId }: MonitoringTabProps) {
  const { routine, executions, stats, isLoading } = useCleaningRoutine(branchId);
  const { pendingInspections } = useCleaningInspection(branchId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!routine) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Selecione uma unidade para visualizar o monitoramento.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calcular métricas
  const avgDuration = executions
    .filter(e => e.started_at && e.finished_at)
    .reduce((acc, e) => {
      const duration = (new Date(e.finished_at!).getTime() - new Date(e.started_at!).getTime()) / 60000;
      return acc + duration;
    }, 0) / (executions.filter(e => e.started_at && e.finished_at).length || 1);

  const rejectionRate = stats?.total 
    ? Math.round(((stats.reprovado + stats.corrigido) / stats.total) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.percentComplete || 0}%</p>
                <p className="text-xs text-muted-foreground">Concluído</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingInspections.length}</p>
                <p className="text-xs text-muted-foreground">Aguardando Fiscal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(avgDuration)} min</p>
                <p className="text-xs text-muted-foreground">Tempo Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${rejectionRate > 20 ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'}`}>
                <AlertTriangle className={`h-5 w-5 ${rejectionRate > 20 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectionRate}%</p>
                <p className="text-xs text-muted-foreground">Taxa Reprovação</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline de execuções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Timeline de Execuções
          </CardTitle>
          <CardDescription>
            Status em tempo real de cada ambiente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress bars por status */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Pendentes</span>
                  <span>{stats?.pendente || 0}</span>
                </div>
                <Progress 
                  value={stats?.total ? ((stats.pendente / stats.total) * 100) : 0} 
                  className="h-2 bg-gray-200"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Em Execução</span>
                  <span>{stats?.em_execucao || 0}</span>
                </div>
                <Progress 
                  value={stats?.total ? ((stats.em_execucao / stats.total) * 100) : 0} 
                  className="h-2 bg-blue-200"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Aguardando Fiscalização</span>
                  <span>{stats?.aguardando_fiscalizacao || 0}</span>
                </div>
                <Progress 
                  value={stats?.total ? ((stats.aguardando_fiscalizacao / stats.total) * 100) : 0} 
                  className="h-2 bg-yellow-200"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Aprovados</span>
                  <span>{stats?.aprovado || 0}</span>
                </div>
                <Progress 
                  value={stats?.total ? ((stats.aprovado / stats.total) * 100) : 0} 
                  className="h-2 bg-green-200"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Ambiente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Ambiente</th>
                  <th className="text-left py-2">Risco</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Início</th>
                  <th className="text-left py-2">Término</th>
                  <th className="text-left py-2">Duração</th>
                  <th className="text-right py-2">Reprovações</th>
                </tr>
              </thead>
              <tbody>
                {executions.map(exec => {
                  const duration = exec.started_at && exec.finished_at
                    ? Math.round((new Date(exec.finished_at).getTime() - new Date(exec.started_at).getTime()) / 60000)
                    : null;

                  return (
                    <tr key={exec.id} className="border-b">
                      <td className="py-2 font-medium">{exec.environment?.name}</td>
                      <td className="py-2">
                        <Badge 
                          variant="outline"
                          className="text-xs"
                        >
                          {RISK_LEVEL_BADGES[exec.environment?.sanitary_risk_level || 'nao_critico'].label}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Badge 
                          className={`text-xs ${STATUS_COLORS[exec.status]} text-white`}
                        >
                          {STATUS_LABELS[exec.status]}
                        </Badge>
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {exec.started_at ? format(new Date(exec.started_at), "HH:mm") : '-'}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {exec.finished_at ? format(new Date(exec.finished_at), "HH:mm") : '-'}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {duration ? `${duration} min` : '-'}
                      </td>
                      <td className="py-2 text-right">
                        {exec.correction_count > 0 ? (
                          <Badge variant="destructive">{exec.correction_count}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
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
