import React from 'react';
import { RefreshCw, CheckCircle2, XCircle, Database, Users, GitCompare, FileText, ListTodo, Tag, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { SyncProgress } from '../hooks/useSyncProgress';

const STEP_ICONS: Record<string, React.ElementType> = {
  'Funis e Etapas': GitCompare,
  'Usuários': Users,
  'Leads': Database,
  'Contatos': Users,
  'Tarefas': ListTodo,
  'Campos Personalizados': FileText,
  'Motivos de Perda': Tag,
};

const STEP_LABELS = [
  'Funis e Etapas',
  'Usuários',
  'Leads',
  'Contatos',
  'Tarefas',
  'Campos Personalizados',
  'Motivos de Perda',
];

interface KommoSyncProgressBarProps {
  isSyncing: boolean;
  progress: SyncProgress | null;
  recordsSynced: Record<string, number>;
  status: string;
  errorMessage?: string | null;
  durationMs?: number | null;
}

export default function KommoSyncProgressBar({
  isSyncing,
  progress,
  recordsSynced,
  status,
  errorMessage,
  durationMs,
}: KommoSyncProgressBarProps) {
  const percent = progress?.percent ?? 0;
  const currentStep = progress?.current_step ?? 0;
  const totalSteps = progress?.total_steps ?? 7;
  const currentEntity = progress?.current_entity ?? '';
  const totalRecords = Object.values(recordsSynced || {}).reduce((a, b) => a + (b || 0), 0);

  const isComplete = status === 'completed';
  const isFailed = status === 'failed';

  if (!isSyncing && !isComplete && !isFailed) return null;

  return (
    <div className={`rounded-xl border p-4 space-y-3 transition-all duration-500 ${
      isFailed 
        ? 'bg-destructive/5 border-destructive/20' 
        : isComplete 
          ? 'bg-emerald-500/5 border-emerald-500/20' 
          : 'bg-primary/5 border-primary/20'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isFailed ? (
            <XCircle className="h-5 w-5 text-destructive" />
          ) : isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <RefreshCw className="h-5 w-5 text-primary animate-spin" />
          )}
          <span className="font-semibold text-sm">
            {isFailed ? 'Sincronização falhou' : isComplete ? 'Sincronização concluída!' : 'Sincronizando com o Kommo...'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {totalRecords > 0 && (
            <span className="font-mono bg-muted/50 px-2 py-0.5 rounded">
              {totalRecords} registros
            </span>
          )}
          {durationMs && isComplete && (
            <span className="font-mono bg-muted/50 px-2 py-0.5 rounded">
              {(durationMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {!isFailed && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {isComplete ? 'Todos os dados sincronizados' : currentEntity}
            </span>
            <span className="font-mono font-semibold text-primary">
              {percent}%
            </span>
          </div>
          <Progress 
            value={percent} 
            className="h-2.5"
          />
        </div>
      )}

      {/* Step indicators */}
      <div className="flex gap-1">
        {STEP_LABELS.map((label, idx) => {
          const Icon = STEP_ICONS[label] || Database;
          const isDone = currentStep > idx;
          const isCurrent = currentStep === idx && isSyncing;

          return (
            <div
              key={label}
              className={`flex-1 flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all duration-300 ${
                isDone
                  ? 'bg-emerald-500/10'
                  : isCurrent
                    ? 'bg-primary/10 scale-105'
                    : 'bg-muted/30'
              }`}
              title={`${label}${recordsSynced[label.toLowerCase()] ? `: ${recordsSynced[label.toLowerCase()]}` : ''}`}
            >
              <Icon className={`h-3.5 w-3.5 ${
                isDone
                  ? 'text-emerald-500'
                  : isCurrent
                    ? 'text-primary animate-pulse'
                    : 'text-muted-foreground/40'
              }`} />
              <span className={`text-[9px] leading-tight text-center ${
                isDone ? 'text-emerald-600 font-medium' : isCurrent ? 'text-primary font-medium' : 'text-muted-foreground/50'
              }`}>
                {label.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error message */}
      {isFailed && errorMessage && (
        <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 rounded-lg p-2">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Records summary on completion */}
      {isComplete && totalRecords > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(recordsSynced).map(([key, count]) => (
            <span key={key} className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
              {key}: {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
