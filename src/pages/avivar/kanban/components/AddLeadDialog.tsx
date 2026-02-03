/**
 * AddLeadDialog - Dialog for adding new leads to the kanban
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { KanbanColumnData } from '../AvivarKanbanPage';

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kanbanId: string;
  columns: KanbanColumnData[];
}

const leadSources = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google Ads' },
  { value: 'site', label: 'Site' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'manual', label: 'Manual' },
];

export function AddLeadDialog({ open, onOpenChange, kanbanId, columns }: AddLeadDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'manual',
    notes: '',
    columnId: '',
  });

  // Set default column to first one
  const defaultColumnId = columns[0]?.id || '';

  const createLead = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const columnId = formData.columnId || defaultColumnId;
      if (!columnId) throw new Error('Selecione uma coluna');

      const { data, error } = await supabase
        .from('avivar_kanban_leads')
        .insert({
          kanban_id: kanbanId,
          column_id: columnId,
          user_id: user.id,
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          source: formData.source,
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-kanban-leads', kanbanId] });
      toast.success('Lead adicionado com sucesso!');
      onOpenChange(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        source: 'manual',
        notes: '',
        columnId: '',
      });
    },
    onError: (error) => {
      console.error('Error creating lead:', error);
      toast.error('Erro ao criar lead');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    createLead.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--avivar-foreground))]">
            Adicionar Novo Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome do lead"
              className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(00) 00000-0000"
                className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
                className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Fonte</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
              >
                <SelectTrigger className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {leadSources.map(source => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="column">Coluna</Label>
              <Select
                value={formData.columnId || defaultColumnId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, columnId: value }))}
              >
                <SelectTrigger className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Anotações sobre o lead..."
              rows={3}
              className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[hsl(var(--avivar-border))]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createLead.isPending}
              className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
            >
              {createLead.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
