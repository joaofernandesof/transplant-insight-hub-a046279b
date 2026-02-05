import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, Clock, CheckCircle2, AlertCircle, 
  Sparkles 
} from 'lucide-react';
import { useCleaningExecution } from '../hooks';
import { 
  CleaningEnvironmentExecutionWithDetails,
  ITEM_CATEGORY_LABELS,
  RISK_LEVEL_BADGES
} from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChecklistExecutorProps {
  execution: CleaningEnvironmentExecutionWithDetails;
  onBack: () => void;
  onFinish: () => void;
}

export function ChecklistExecutor({ execution, onBack, onFinish }: ChecklistExecutorProps) {
  const { 
    items, 
    itemsByCategory, 
    completedCount, 
    totalCount, 
    percentComplete,
    allCompleted,
    toggleItem,
    createExecutionItems,
  } = useCleaningExecution(execution.id);

  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer
  useEffect(() => {
    if (!execution.started_at) return;

    const startTime = new Date(execution.started_at).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      setElapsedTime(Math.floor((now - startTime) / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [execution.started_at]);

  // Criar itens de execução se não existirem
  useEffect(() => {
    if (items.length === 0 && execution.checklist_id) {
      createExecutionItems.mutate({
        executionId: execution.id,
        checklistId: execution.checklist_id,
      });
    }
  }, [items.length, execution.id, execution.checklist_id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            
            <div className="flex items-center gap-4">
              <Badge {...RISK_LEVEL_BADGES[execution.environment?.sanitary_risk_level || 'nao_critico']}>
                {RISK_LEVEL_BADGES[execution.environment?.sanitary_risk_level || 'nao_critico'].label}
              </Badge>
              <div className="flex items-center gap-2 text-lg font-mono">
                <Clock className="h-5 w-5 text-muted-foreground" />
                {formatTime(elapsedTime)}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-500" />
              {execution.environment?.name}
            </h1>
            {execution.environment?.description && (
              <p className="text-muted-foreground text-sm mt-1">
                {execution.environment.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {completedCount} de {totalCount} itens concluídos
            </span>
            <span className="text-sm font-bold">{percentComplete}%</span>
          </div>
          <Progress value={percentComplete} className="h-3" />
        </CardContent>
      </Card>

      {/* Aviso de reprovação anterior */}
      {execution.rejection_notes && (
        <Card className="border-red-300 dark:border-red-700">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">
                  Correção necessária
                </p>
                <p className="text-sm text-muted-foreground">
                  {execution.rejection_notes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checklist por categoria */}
      {Object.entries(ITEM_CATEGORY_LABELS).map(([category, label]) => {
        const categoryItems = itemsByCategory[category] || [];
        if (categoryItems.length === 0) return null;

        return (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categoryItems.map(item => (
                <div 
                  key={item.id}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer
                    ${item.is_completed ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : ''}
                    ${item.is_rejected ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' : ''}
                    hover:bg-muted/50
                  `}
                  onClick={() => toggleItem.mutate({ itemId: item.id, completed: !item.is_completed })}
                >
                  <Checkbox
                    checked={item.is_completed}
                    onCheckedChange={(checked) => toggleItem.mutate({ itemId: item.id, completed: !!checked })}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className={item.is_completed ? 'line-through text-muted-foreground' : ''}>
                      {item.checklist_item?.description || ''}
                    </p>
                    {item.is_completed && item.completed_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Concluído às {format(new Date(item.completed_at), "HH:mm", { locale: ptBR })}
                      </p>
                    )}
                    {item.is_rejected && item.rejection_note && (
                      <p className="text-xs text-red-500 mt-1">
                        ⚠️ {item.rejection_note}
                      </p>
                    )}
                  </div>
                  {item.checklist_item?.is_critical && (
                    <Badge variant="destructive" className="text-xs">Crítico</Badge>
                  )}
                  {item.is_completed && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Botão de finalizar */}
      <Card>
        <CardContent className="p-4">
          <Button
            onClick={onFinish}
            disabled={!allCompleted}
            className="w-full h-12 text-lg gap-2"
            size="lg"
          >
            <CheckCircle2 className="h-5 w-5" />
            {allCompleted ? 'Finalizar Limpeza' : `${totalCount - completedCount} item(ns) pendente(s)`}
          </Button>
          {!allCompleted && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Complete todos os itens para finalizar
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
