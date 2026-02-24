/**
 * Chips de progresso D-X para cada cirurgia
 * Cinza → pendente | Azul → ativa hoje | Verde → concluída | Vermelho → atrasada | Amarelo → problema
 */
import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TaskPhase {
  label: string;
  status: 'pending' | 'active' | 'completed' | 'overdue' | 'mixed';
  hasProblem: boolean;
  completedCount: number;
  totalCount: number;
}

interface SurgeryTaskChipsProps {
  tasks: Array<{
    phase_label: string;
    status: string;
    has_problem: boolean;
  }>;
  compact?: boolean;
}

const PHASE_ORDER = ['Venda', 'D-20', 'D-15', 'D-10', 'D-2', 'D-1', 'D0', 'D+1'];

export function SurgeryTaskChips({ tasks, compact = false }: SurgeryTaskChipsProps) {
  const phases = useMemo(() => {
    const map = new Map<string, TaskPhase>();
    
    for (const task of tasks) {
      if (!map.has(task.phase_label)) {
        map.set(task.phase_label, {
          label: task.phase_label,
          status: task.status as TaskPhase['status'],
          hasProblem: false,
          completedCount: 0,
          totalCount: 0,
        });
      }
      const phase = map.get(task.phase_label)!;
      phase.totalCount++;
      if (task.status === 'completed') phase.completedCount++;
      if (task.has_problem) phase.hasProblem = true;
      
      // Determine overall phase status
      if (task.status === 'overdue' && phase.status !== 'overdue') {
        phase.status = 'overdue';
      } else if (task.status === 'active' && phase.status === 'pending') {
        phase.status = 'active';
      }
    }
    
    // Check if all completed
    for (const phase of map.values()) {
      if (phase.completedCount === phase.totalCount) phase.status = 'completed';
      else if (phase.completedCount > 0) phase.status = 'mixed';
    }
    
    // Sort by PHASE_ORDER
    return PHASE_ORDER
      .filter(label => map.has(label))
      .map(label => map.get(label)!);
  }, [tasks]);

  if (phases.length === 0) return null;

  const getChipStyle = (phase: TaskPhase) => {
    if (phase.hasProblem) return 'bg-amber-400 text-amber-950 ring-amber-500/30';
    switch (phase.status) {
      case 'completed': return 'bg-emerald-500 text-white';
      case 'active': return 'bg-blue-500 text-white animate-pulse';
      case 'overdue': return 'bg-red-500 text-white';
      case 'mixed': return 'bg-emerald-200 text-emerald-800 ring-emerald-400/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (phase: TaskPhase) => {
    if (phase.hasProblem) return '⚠️ Problema';
    switch (phase.status) {
      case 'completed': return '✅ Concluído';
      case 'active': return '🔵 Ativo hoje';
      case 'overdue': return '🔴 Atrasado';
      case 'mixed': return `${phase.completedCount}/${phase.totalCount} feitas`;
      default: return '⬜ Pendente';
    }
  };

  return (
    <TooltipProvider>
      <div className={cn('flex gap-0.5 flex-wrap', compact && 'gap-px')}>
        {phases.map((phase) => (
          <Tooltip key={phase.label}>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-md font-bold ring-1 ring-inset transition-all cursor-default',
                  compact ? 'w-5 h-5 text-[9px]' : 'px-1.5 py-0.5 text-[10px]',
                  getChipStyle(phase)
                )}
              >
                {compact ? phase.label.replace('D-', '').replace('D+', '+').replace('Venda', 'V').replace('D0', '0') : phase.label}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p className="font-semibold">{phase.label}</p>
              <p>{getStatusLabel(phase)}</p>
              <p className="text-muted-foreground">{phase.completedCount}/{phase.totalCount} tarefas</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
