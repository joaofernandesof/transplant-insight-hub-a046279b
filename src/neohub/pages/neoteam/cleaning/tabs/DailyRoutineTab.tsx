import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Play, Lock, AlertCircle, CheckCircle2, 
  Clock, ArrowRight, Sparkles 
} from 'lucide-react';
import { useCleaningRoutine, useCleaningExecution } from '../hooks';
import { ChecklistExecutor } from '../components/ChecklistExecutor';
import { 
  RISK_LEVEL_BADGES, 
  STATUS_LABELS, 
  CleaningEnvironmentExecutionWithDetails 
} from '../types';

interface DailyRoutineTabProps {
  branchId: string;
}

export function DailyRoutineTab({ branchId }: DailyRoutineTabProps) {
  const { 
    routine, 
    executions, 
    stats, 
    nextAvailableExecution,
    currentExecution,
    isLoading,
    startExecution,
    finishCleaning,
  } = useCleaningRoutine(branchId);

  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);

  // Se estiver executando um ambiente, mostrar o executor
  const executionToShow = activeExecutionId 
    ? executions.find(e => e.id === activeExecutionId) 
    : currentExecution;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!routine) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma rotina encontrada</h3>
          <p className="text-muted-foreground">
            Selecione uma unidade para visualizar a rotina do dia.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Se há uma execução ativa, mostrar o executor
  if (executionToShow && (executionToShow.status === 'em_execucao' || executionToShow.status === 'corrigido')) {
    return (
      <ChecklistExecutor 
        execution={executionToShow}
        onBack={() => setActiveExecutionId(null)}
        onFinish={() => {
          finishCleaning.mutate(executionToShow.id);
          setActiveExecutionId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Progresso geral */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-500" />
            Progresso da Rotina
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{stats?.aprovado || 0} de {stats?.total || 0} ambientes concluídos</span>
              <span className="font-semibold">{stats?.percentComplete || 0}%</span>
            </div>
            <Progress value={stats?.percentComplete || 0} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Próximo ambiente ou em correção */}
      {nextAvailableExecution && (
        <Card className="border-2 border-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {nextAvailableExecution.status === 'reprovado' || nextAvailableExecution.status === 'corrigido'
                  ? '⚠️ Ambiente para Correção'
                  : '📋 Próximo Ambiente'
                }
              </CardTitle>
              <Badge {...RISK_LEVEL_BADGES[nextAvailableExecution.environment?.sanitary_risk_level || 'nao_critico']}>
                {RISK_LEVEL_BADGES[nextAvailableExecution.environment?.sanitary_risk_level || 'nao_critico'].label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">{nextAvailableExecution.environment?.name}</h3>
                {nextAvailableExecution.environment?.description && (
                  <p className="text-muted-foreground text-sm">
                    {nextAvailableExecution.environment.description}
                  </p>
                )}
              </div>

              {nextAvailableExecution.rejection_notes && (
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                    Motivo da reprovação:
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {nextAvailableExecution.rejection_notes}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <span>Checklist: </span>
                  <span className="font-medium">
                    {nextAvailableExecution.checklist?.items?.length || 0} itens
                  </span>
                </div>
                <Button 
                  onClick={() => {
                    startExecution.mutate(nextAvailableExecution.id);
                    setActiveExecutionId(nextAvailableExecution.id);
                  }}
                  disabled={startExecution.isPending}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  {nextAvailableExecution.status === 'reprovado' ? 'Corrigir' : 'Iniciar Limpeza'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fila de ambientes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fila de Ambientes</CardTitle>
          <CardDescription>
            Ordem de execução baseada no risco sanitário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {executions.map((execution, index) => (
              <EnvironmentQueueItem 
                key={execution.id}
                execution={execution}
                position={index + 1}
                isNext={execution.id === nextAvailableExecution?.id}
                isCurrent={execution.id === currentExecution?.id}
              />
            ))}

            {executions.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhum ambiente cadastrado para esta unidade.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface EnvironmentQueueItemProps {
  execution: CleaningEnvironmentExecutionWithDetails;
  position: number;
  isNext: boolean;
  isCurrent: boolean;
}

function EnvironmentQueueItem({ execution, position, isNext, isCurrent }: EnvironmentQueueItemProps) {
  const statusIcons: Record<string, React.ReactNode> = {
    pendente: <Clock className="h-4 w-4 text-gray-400" />,
    em_execucao: <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />,
    finalizado_limpeza: <Clock className="h-4 w-4 text-cyan-500" />,
    aguardando_fiscalizacao: <Clock className="h-4 w-4 text-yellow-500" />,
    reprovado: <AlertCircle className="h-4 w-4 text-red-500" />,
    corrigido: <AlertCircle className="h-4 w-4 text-orange-500" />,
    aprovado: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  };

  const isLocked = execution.status === 'pendente' && !isNext;

  return (
    <div 
      className={`
        flex items-center gap-3 p-3 rounded-lg border transition-all
        ${isNext ? 'border-primary bg-primary/5' : ''}
        ${isCurrent ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''}
        ${execution.status === 'aprovado' ? 'opacity-60' : ''}
        ${isLocked ? 'opacity-50' : ''}
      `}
    >
      {/* Posição */}
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
        {position}
      </div>

      {/* Status icon */}
      <div className="flex-shrink-0">
        {isLocked ? <Lock className="h-4 w-4 text-gray-400" /> : statusIcons[execution.status]}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{execution.environment?.name}</span>
          <Badge 
            variant="outline" 
            className="text-xs"
            {...RISK_LEVEL_BADGES[execution.environment?.sanitary_risk_level || 'nao_critico']}
          >
            {RISK_LEVEL_BADGES[execution.environment?.sanitary_risk_level || 'nao_critico'].label}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {STATUS_LABELS[execution.status]}
          {execution.correction_count > 0 && (
            <span className="text-red-500 ml-2">
              ({execution.correction_count}x reprovado)
            </span>
          )}
        </div>
      </div>

      {/* Ação */}
      {isNext && (
        <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
      )}
    </div>
  );
}
