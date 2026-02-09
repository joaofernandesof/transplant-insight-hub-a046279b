import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Clock, MessageSquare, Edit2, Trash2, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReminderRule } from '@/hooks/useReminderRules';

interface ReminderRuleCardProps {
  rule: ReminderRule;
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (rule: ReminderRule) => void;
  onDelete: (id: string) => void;
}

export function ReminderRuleCard({ rule, onToggle, onEdit, onDelete }: ReminderRuleCardProps) {
  const getTimeLabel = () => {
    const v = rule.time_before_value;
    switch (rule.time_before_type) {
      case 'days': return `${v} dia${v > 1 ? 's' : ''} antes`;
      case 'hours': return `${v} hora${v > 1 ? 's' : ''} antes`;
      case 'minutes': return `${v} minuto${v > 1 ? 's' : ''} antes`;
    }
  };

  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all",
        rule.is_active
          ? "border-[hsl(var(--avivar-primary)/0.4)] bg-[hsl(var(--avivar-secondary))]"
          : "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-muted)/0.3)] opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            rule.is_active
              ? "bg-[hsl(var(--avivar-primary)/0.3)] text-[hsl(var(--avivar-primary))]"
              : "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]"
          )}>
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                {rule.name}
              </p>
              <Badge className="text-xs bg-blue-500/20 text-blue-500 border-blue-500/30">
                <Clock className="h-3 w-3 mr-1" />
                {getTimeLabel()}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={rule.is_active}
            onCheckedChange={(checked) => onToggle(rule.id, checked)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(rule)}
            className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(rule.id)}
            className="text-[hsl(var(--avivar-muted-foreground))] hover:text-red-500 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Message Preview */}
      <div className="mt-3 p-3 rounded-lg bg-[hsl(var(--avivar-muted)/0.5)] border border-[hsl(var(--avivar-border)/0.5)]">
        <p className="text-sm text-[hsl(var(--avivar-secondary-foreground))] flex items-start gap-2">
          <MessageSquare className="h-4 w-4 text-[hsl(var(--avivar-primary))] mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{rule.message_template || 'Sem mensagem configurada'}</span>
        </p>
      </div>
    </div>
  );
}
