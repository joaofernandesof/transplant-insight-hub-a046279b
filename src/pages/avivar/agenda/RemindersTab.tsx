import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Bell, Loader2 } from 'lucide-react';
import { useReminderRules } from '@/hooks/useReminderRules';
import { ReminderRuleCard } from './ReminderRuleCard';
import { ReminderRuleDialog } from './ReminderRuleDialog';
import type { ReminderRule, CreateReminderRuleInput } from '@/hooks/useReminderRules';

export function RemindersTab() {
  const { rules, isLoading, createRule, updateRule, toggleRule, deleteRule } = useReminderRules();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReminderRule | null>(null);

  const handleCreate = () => {
    setEditingRule(null);
    setDialogOpen(true);
  };

  const handleEdit = (rule: ReminderRule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleSave = (data: CreateReminderRuleInput) => {
    if (editingRule) {
      updateRule.mutate({ id: editingRule.id, ...data }, {
        onSuccess: () => setDialogOpen(false),
      });
    } else {
      createRule.mutate(data, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta regra de lembrete?')) {
      deleteRule.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--avivar-primary))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[hsl(var(--avivar-foreground))]">
            Regras de Lembretes
          </h2>
          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
            Configure mensagens automáticas enviadas antes de cada consulta agendada.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      {/* Rules list */}
      {rules.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="p-4 rounded-full bg-[hsl(var(--avivar-primary))]/10">
            <Bell className="h-10 w-10 text-[hsl(var(--avivar-primary))]" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-[hsl(var(--avivar-foreground))]">
              Nenhuma regra configurada
            </p>
            <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] max-w-sm">
              Crie regras de lembrete para enviar mensagens automáticas antes das consultas. Ex: 24h antes, 1h antes.
            </p>
          </div>
          <Button onClick={handleCreate} variant="outline"
            className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]">
            <Plus className="h-4 w-4 mr-2" />
            Criar primeira regra
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <ReminderRuleCard
              key={rule.id}
              rule={rule}
              onToggle={(id, active) => toggleRule.mutate({ id, is_active: active })}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ReminderRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editingRule}
        onSave={handleSave}
        isSaving={createRule.isPending || updateRule.isPending}
      />
    </div>
  );
}
