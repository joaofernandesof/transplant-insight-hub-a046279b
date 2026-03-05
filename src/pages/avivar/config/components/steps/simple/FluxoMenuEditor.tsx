/**
 * FluxoMenuEditor - Editor de menu de opções com ramificação para passos do fluxo
 */

import React from 'react';
import { Plus, X, ArrowRight, MessageSquare, Users, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FluxoMenuOption, FluxoMenuAction, FluxoStep } from '../../../types';
import { KanbanColumn } from '@/hooks/useKanbanBoards';

interface FluxoMenuEditorProps {
  menuOptions: FluxoMenuOption[];
  onChange: (options: FluxoMenuOption[]) => void;
  allSteps: FluxoStep[]; // All steps (cronológicos + extras) for "go_to_step"
  currentStepId: string;
  kanbanColumns: KanbanColumn[];
}

const ACTION_LABELS: Record<FluxoMenuAction['type'], { label: string; icon: React.ReactNode }> = {
  go_to_step: { label: 'Ir para passo', icon: <ArrowRight className="h-3 w-3" /> },
  move_kanban: { label: 'Mover no Kanban', icon: <GitBranch className="h-3 w-3" /> },
  transfer_human: { label: 'Transferir para humano', icon: <Users className="h-3 w-3" /> },
  send_message: { label: 'Enviar mensagem', icon: <MessageSquare className="h-3 w-3" /> },
};

export function FluxoMenuEditor({
  menuOptions,
  onChange,
  allSteps,
  currentStepId,
  kanbanColumns,
}: FluxoMenuEditorProps) {
  const addOption = () => {
    const newOption: FluxoMenuOption = {
      id: `opt_${Date.now()}`,
      label: '',
      action: { type: 'go_to_step' },
    };
    onChange([...menuOptions, newOption]);
  };

  const removeOption = (optionId: string) => {
    onChange(menuOptions.filter(o => o.id !== optionId));
  };

  const updateOption = (optionId: string, updates: Partial<FluxoMenuOption>) => {
    onChange(menuOptions.map(o => o.id === optionId ? { ...o, ...updates } : o));
  };

  const updateAction = (optionId: string, actionUpdates: Partial<FluxoMenuAction>) => {
    onChange(menuOptions.map(o => {
      if (o.id !== optionId) return o;
      return { ...o, action: { ...o.action, ...actionUpdates } };
    }));
  };

  const availableSteps = allSteps.filter(s => s.id !== currentStepId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wider flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5" />
          Menu de Opções
        </label>
        <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={addOption}>
          <Plus className="h-3 w-3" /> Opção
        </Button>
      </div>

      {menuOptions.length === 0 && (
        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] text-center py-2">
          Adicione opções para criar um menu de escolha para o lead.
        </p>
      )}

      <div className="space-y-2">
        {menuOptions.map((option, idx) => (
          <div
            key={option.id}
            className="border border-[hsl(var(--avivar-border))] rounded-lg p-3 space-y-2 bg-[hsl(var(--avivar-muted)/0.3)]"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[hsl(var(--avivar-primary))] w-5 text-center">
                {idx + 1}.
              </span>
              <Input
                value={option.label}
                onChange={(e) => updateOption(option.id, { label: e.target.value })}
                placeholder="Ex: Agendar consulta"
                className="h-8 text-sm flex-1 !bg-[hsl(var(--avivar-card))] !text-[hsl(var(--avivar-foreground))] border-[hsl(var(--avivar-border))]"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => removeOption(option.id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex items-start gap-2 pl-7">
              <Select
                value={option.action.type}
                onValueChange={(value: FluxoMenuAction['type']) => {
                  updateAction(option.id, { type: value, targetStepId: undefined, targetColumnSlug: undefined, message: undefined });
                }}
              >
                <SelectTrigger className="h-8 text-xs w-[180px] !bg-[hsl(var(--avivar-card))] !text-[hsl(var(--avivar-foreground))] border-[hsl(var(--avivar-border))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTION_LABELS).map(([key, { label, icon }]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      <span className="flex items-center gap-1.5">{icon} {label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Action-specific fields */}
              {option.action.type === 'go_to_step' && (
                <Select
                  value={option.action.targetStepId || ''}
                  onValueChange={(value) => updateAction(option.id, { targetStepId: value })}
                >
                  <SelectTrigger className="h-8 text-xs flex-1 !bg-[hsl(var(--avivar-card))] !text-[hsl(var(--avivar-foreground))] border-[hsl(var(--avivar-border))]">
                    <SelectValue placeholder="Selecione o passo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSteps.map(step => (
                      <SelectItem key={step.id} value={step.id} className="text-xs">
                        Passo {step.ordem}: {step.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {option.action.type === 'move_kanban' && (
                <Select
                  value={option.action.targetColumnSlug || ''}
                  onValueChange={(value) => updateAction(option.id, { targetColumnSlug: value })}
                >
                  <SelectTrigger className="h-8 text-xs flex-1 !bg-[hsl(var(--avivar-card))] !text-[hsl(var(--avivar-foreground))] border-[hsl(var(--avivar-border))]">
                    <SelectValue placeholder="Selecione a coluna..." />
                  </SelectTrigger>
                  <SelectContent>
                    {kanbanColumns.map(col => (
                      <SelectItem key={col.id} value={col.name.toLowerCase().replace(/\s+/g, '_')} className="text-xs">
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {option.action.type === 'transfer_human' && (
                <span className="text-xs text-[hsl(var(--avivar-muted-foreground))] self-center">
                  A IA usará transfer_to_human automaticamente
                </span>
              )}
            </div>

            {option.action.type === 'send_message' && (
              <div className="pl-7">
                <Textarea
                  value={option.action.message || ''}
                  onChange={(e) => updateAction(option.id, { message: e.target.value })}
                  placeholder="Mensagem que a IA deve enviar..."
                  rows={2}
                  className="resize-none text-xs !bg-[hsl(var(--avivar-card))] !text-[hsl(var(--avivar-foreground))] border-[hsl(var(--avivar-border))]"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {menuOptions.length > 0 && (
        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] flex items-center gap-1">
          <ArrowRight className="h-3 w-3" />
          A IA apresentará essas opções numeradas e aguardará a escolha do lead.
        </p>
      )}
    </div>
  );
}
