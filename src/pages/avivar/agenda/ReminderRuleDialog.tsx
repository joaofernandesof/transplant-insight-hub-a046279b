import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { ReminderRule, CreateReminderRuleInput } from '@/hooks/useReminderRules';

interface ReminderRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: ReminderRule | null;
  onSave: (data: CreateReminderRuleInput) => void;
  isSaving?: boolean;
}

const VARIABLES = [
  { key: '{{nome}}', label: 'Nome completo' },
  { key: '{{primeiro_nome}}', label: 'Primeiro nome' },
  { key: '{{data}}', label: 'Data da consulta' },
  { key: '{{hora}}', label: 'Horário' },
  { key: '{{procedimento}}', label: 'Procedimento' },
  { key: '{{profissional}}', label: 'Profissional' },
  { key: '{{local}}', label: 'Local' },
];

function calcMinutes(value: number, type: string): number {
  switch (type) {
    case 'days': return value * 1440;
    case 'hours': return value * 60;
    default: return value;
  }
}

export function ReminderRuleDialog({ open, onOpenChange, rule, onSave, isSaving }: ReminderRuleDialogProps) {
  const [name, setName] = useState('');
  const [timeValue, setTimeValue] = useState(24);
  const [timeType, setTimeType] = useState<'minutes' | 'hours' | 'days'>('hours');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setTimeValue(rule.time_before_value);
      setTimeType(rule.time_before_type);
      setMessage(rule.message_template);
    } else {
      setName('');
      setTimeValue(24);
      setTimeType('hours');
      setMessage('');
    }
  }, [rule, open]);

  const handleSave = () => {
    if (!name.trim() || !message.trim()) return;
    onSave({
      name: name.trim(),
      time_before_value: timeValue,
      time_before_type: timeType,
      time_before_minutes: calcMinutes(timeValue, timeType),
      message_template: message.trim(),
      is_active: true,
    });
  };

  const insertVariable = (key: string) => {
    setMessage(prev => prev + key);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--avivar-foreground))]">
            {rule ? 'Editar Lembrete' : 'Novo Lembrete'}
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--avivar-muted-foreground))]">
            Configure quando e qual mensagem enviar antes da consulta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nome */}
          <div className="space-y-2">
            <Label className="text-[hsl(var(--avivar-foreground))]">Nome do lembrete</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Lembrete 24h antes"
              className="bg-[hsl(var(--avivar-muted))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
            />
          </div>

          {/* Tempo antes */}
          <div className="space-y-2">
            <Label className="text-[hsl(var(--avivar-foreground))]">Enviar quanto tempo antes da consulta?</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                value={timeValue}
                onChange={e => setTimeValue(Number(e.target.value))}
                className="w-24 bg-[hsl(var(--avivar-muted))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
              />
              <Select value={timeType} onValueChange={(v: any) => setTimeType(v)}>
                <SelectTrigger className="w-32 bg-[hsl(var(--avivar-muted))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutos</SelectItem>
                  <SelectItem value="hours">Horas</SelectItem>
                  <SelectItem value="days">Dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label className="text-[hsl(var(--avivar-foreground))]">Mensagem</Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Olá {{primeiro_nome}}, sua consulta é amanhã às {{hora}}!"
              rows={4}
              className="bg-[hsl(var(--avivar-muted))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
            />
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map(v => (
                <Badge
                  key={v.key}
                  variant="outline"
                  className="cursor-pointer text-xs border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.1)] hover:text-[hsl(var(--avivar-primary))]"
                  onClick={() => insertVariable(v.key)}
                >
                  {v.key} — {v.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}
            className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))]">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !message.trim() || isSaving}
            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
          >
            {isSaving ? 'Salvando...' : rule ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
