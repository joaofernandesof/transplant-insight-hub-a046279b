/**
 * ColumnDialog - Dialog para criar/editar colunas do Kanban
 * Instrução para IA é OBRIGATÓRIA
 * Inclui acesso rápido ao Checklist da coluna
 */

import { useState, useEffect } from 'react';
import { Loader2, Plus, Save, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { KanbanColumnData } from '../AvivarKanbanPage';

const colorOptions = [
  { value: 'from-gray-500 to-gray-600', label: 'Cinza', preview: 'bg-gray-500' },
  { value: 'from-blue-500 to-blue-600', label: 'Azul', preview: 'bg-blue-500' },
  { value: 'from-indigo-500 to-indigo-600', label: 'Índigo', preview: 'bg-indigo-500' },
  { value: 'from-purple-500 to-purple-600', label: 'Roxo', preview: 'bg-purple-500' },
  { value: 'from-pink-500 to-rose-600', label: 'Rosa', preview: 'bg-pink-500' },
  { value: 'from-red-500 to-red-600', label: 'Vermelho', preview: 'bg-red-500' },
  { value: 'from-orange-500 to-orange-600', label: 'Laranja', preview: 'bg-orange-500' },
  { value: 'from-amber-500 to-amber-600', label: 'Âmbar', preview: 'bg-amber-500' },
  { value: 'from-yellow-500 to-amber-600', label: 'Amarelo', preview: 'bg-yellow-500' },
  { value: 'from-emerald-500 to-green-600', label: 'Verde', preview: 'bg-emerald-500' },
  { value: 'from-teal-500 to-teal-600', label: 'Teal', preview: 'bg-teal-500' },
  { value: 'from-cyan-500 to-cyan-600', label: 'Ciano', preview: 'bg-cyan-500' },
];

interface ColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingColumn: KanbanColumnData | null;
  onSave: (data: { name: string; color: string; ai_instruction?: string }) => void;
  isLoading: boolean;
}

export function ColumnDialog({
  open,
  onOpenChange,
  editingColumn,
  onSave,
  isLoading,
}: ColumnDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('from-blue-500 to-blue-600');
  const [aiInstruction, setAiInstruction] = useState('');

  useEffect(() => {
    if (editingColumn) {
      setName(editingColumn.name);
      setColor(editingColumn.color);
      setAiInstruction(editingColumn.ai_instruction || '');
    } else {
      setName('');
      setColor('from-blue-500 to-blue-600');
      setAiInstruction('');
    }
  }, [editingColumn, open]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Digite um nome para a coluna');
      return;
    }
    if (!aiInstruction.trim()) {
      toast.error('A instrução da coluna é obrigatória para que a IA saiba como atuar');
      return;
    }
    onSave({ name: name.trim(), color, ai_instruction: aiInstruction.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--avivar-foreground))]">
            {editingColumn ? 'Editar Coluna' : 'Nova Coluna'}
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--avivar-muted-foreground))]">
            {editingColumn
              ? 'Atualize as informações da coluna'
              : 'Configure a nova coluna do kanban'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 1. Nome da Coluna */}
          <div className="space-y-2">
            <Label htmlFor="column-name" className="text-[hsl(var(--avivar-foreground))]">
              Nome da Coluna
            </Label>
            <Input
              id="column-name"
              placeholder="Ex: Em Negociação"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
            />
          </div>

          {/* 2. Instrução para IA - OBRIGATÓRIO */}
          <div className="space-y-2">
            <Label className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <Bot className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
              Instrução para IA
              <span className="text-red-500 text-xs">*obrigatório</span>
            </Label>
            <Textarea
              placeholder="Ex: Mova o lead para esta coluna quando ele cancelar ou remarcar o agendamento..."
              value={aiInstruction}
              onChange={(e) => setAiInstruction(e.target.value)}
              className={cn(
                "bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] min-h-[80px] text-sm",
                !aiInstruction.trim() && "border-amber-500/50"
              )}
            />
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
              A IA usará esta instrução para decidir automaticamente quando mover leads para esta coluna.
            </p>
          </div>

          {/* 3. Cor */}
          <div className="space-y-2">
            <Label className="text-[hsl(var(--avivar-foreground))]">Cor</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${opt.preview}`} />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. Preview */}
          <div className="space-y-2">
            <Label className="text-[hsl(var(--avivar-foreground))]">Preview</Label>
            <div className={`px-4 py-3 rounded-lg bg-gradient-to-r ${color} text-white`}>
              <span className="font-semibold text-sm">{name || 'Nome da Coluna'}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[hsl(var(--avivar-border))]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : editingColumn ? (
              <Save className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {editingColumn ? 'Salvar' : 'Criar Coluna'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
