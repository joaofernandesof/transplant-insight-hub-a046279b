/**
 * AutomationEventBadge - Inline badge shown in the message timeline
 * when an automation executes (or fails) for a conversation.
 */

import { format } from 'date-fns';
import { Zap, AlertTriangle, CheckCircle2, Clock, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AvivarAutomationExecution } from '@/hooks/useAvivarAutomations';

interface AutomationEventBadgeProps {
  execution: AvivarAutomationExecution;
}

const statusConfig: Record<string, { icon: typeof Zap; label: string; colors: string }> = {
  completed: { icon: CheckCircle2, label: 'Executada', colors: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  failed: { icon: AlertTriangle, label: 'Falhou', colors: 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20' },
  running: { icon: Clock, label: 'Executando', colors: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20' },
  pending: { icon: Clock, label: 'Pendente', colors: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  skipped: { icon: SkipForward, label: 'Ignorada', colors: 'bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500/20' },
};

const triggerLabels: Record<string, string> = {
  'lead.created': 'Lead criado',
  'lead.moved_to': 'Lead movido',
  'message.received': 'Mensagem recebida',
  'message.sent': 'Mensagem enviada',
  'lead.tag_added': 'Tag adicionada',
  'lead.field_changed': 'Campo alterado',
};

export function AutomationEventBadge({ execution }: AutomationEventBadgeProps) {
  const config = statusConfig[execution.status] || statusConfig.skipped;
  const Icon = config.icon;
  const triggerLabel = triggerLabels[execution.trigger_event] || execution.trigger_event;

  // Parse action types from actions_log
  const actionSummary = Array.isArray(execution.actions_log)
    ? execution.actions_log
        .map((a: any) => {
          switch (a?.action_type) {
            case 'send_message': return 'Mensagem enviada';
            case 'change_stage': return 'Etapa alterada';
            case 'create_task': return 'Tarefa criada';
            case 'add_tag': return 'Tag adicionada';
            case 'create_note': return 'Nota criada';
            case 'dispatch_webhook': return 'Webhook disparado';
            case 'change_field': return 'Campo alterado';
            default: return a?.action_type;
          }
        })
        .filter(Boolean)
        .join(' • ')
    : null;

  return (
    <div className="flex items-center justify-center my-2">
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-medium max-w-[90%]',
          config.colors
        )}
      >
        <Icon className="h-3 w-3 flex-shrink-0" />
        <span className="flex-shrink-0">
          <Zap className="h-3 w-3 inline mr-0.5" />
          Automação {config.label}
        </span>
        <span className="opacity-70">•</span>
        <span className="truncate">{triggerLabel}</span>
        {actionSummary && (
          <>
            <span className="opacity-70">→</span>
            <span className="truncate">{actionSummary}</span>
          </>
        )}
        <span className="opacity-60 flex-shrink-0">
          {format(new Date(execution.created_at), 'HH:mm')}
        </span>
        {execution.error_message && (
          <span className="text-red-500 truncate ml-1" title={execution.error_message}>
            ({execution.error_message.substring(0, 40)})
          </span>
        )}
      </div>
    </div>
  );
}