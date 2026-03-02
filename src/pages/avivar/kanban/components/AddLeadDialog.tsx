/**
 * AddLeadDialog - Dialog for adding new leads to the kanban
 * Supports both kanban-specific (with kanbanId/columns) and standalone (dashboard) usage
 */

import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAccountSettings } from '@/hooks/useAccountSettings';
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
import { useKanbanBoards } from '@/hooks/useKanbanBoards';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import type { KanbanColumnData } from '../AvivarKanbanPage';

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kanbanId?: string;
  columns?: KanbanColumnData[];
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
  const { accountId } = useAvivarAccount();
  const { boards, columns: allColumns } = useKanbanBoards();
  const { duplicateSettings } = useAccountSettings();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'manual',
    notes: '',
    selectedKanbanId: '',
    columnId: '',
  });

  // Determine if we need kanban selector (standalone mode)
  const isStandalone = !kanbanId;

  // Auto-select kanban if only one exists in standalone mode
  useEffect(() => {
    if (isStandalone && boards.length === 1 && !formData.selectedKanbanId) {
      setFormData(prev => ({ ...prev, selectedKanbanId: boards[0].id }));
    }
  }, [isStandalone, boards, formData.selectedKanbanId]);

  const effectiveKanbanId = kanbanId || formData.selectedKanbanId;

  // Columns for the selected kanban
  const effectiveColumns = useMemo(() => {
    if (columns && columns.length > 0) return columns;
    if (!effectiveKanbanId) return [];
    return allColumns
      .filter(c => c.kanban_id === effectiveKanbanId)
      .map(c => ({ id: c.id, name: c.name, color: c.color || '', order_index: c.order_index }));
  }, [columns, effectiveKanbanId, allColumns]);

  const defaultColumnId = effectiveColumns[0]?.id || '';

  const createLead = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      if (!accountId) throw new Error('Conta não encontrada');

      const columnId = formData.columnId || defaultColumnId;
      if (!columnId) throw new Error('Selecione uma coluna');
      if (!effectiveKanbanId) throw new Error('Selecione um funil');

      // Check for duplicates based on settings
      if (duplicateSettings.enabled && (formData.phone || formData.email)) {
        const checkPhone = duplicateSettings.check_field !== 'email' ? formData.phone || null : null;
        const checkEmail = duplicateSettings.check_field !== 'phone' ? formData.email || null : null;

        if (checkPhone || checkEmail) {
          const { data: duplicate } = await supabase.rpc('check_duplicate_kanban_lead', {
            p_account_id: accountId,
            p_phone: checkPhone,
            p_email: checkEmail,
          });

          if (duplicate && duplicate.length > 0) {
            const dup = duplicate[0];
            const matchField = dup.phone === formData.phone ? `telefone (${dup.phone})` : `email (${dup.email})`;

            if (duplicateSettings.action === 'block') {
              throw new Error(`DUPLICATE:Já existe um lead "${dup.name}" com este ${matchField}`);
            }

            if (duplicateSettings.action === 'merge') {
              // Update empty fields of existing lead
              const updates: Record<string, string | null> = {};
              if (!dup.name && formData.name) updates.name = formData.name;
              if (!dup.phone && formData.phone) updates.phone = formData.phone;
              if (!dup.email && formData.email) updates.email = formData.email;
              
              // Always update notes if provided
              if (formData.notes) {
                updates.notes = formData.notes;
              }
              
              if (Object.keys(updates).length > 0) {
                await supabase
                  .from('avivar_kanban_leads')
                  .update({ ...updates, updated_at: new Date().toISOString() })
                  .eq('id', dup.id);
              }
              
              throw new Error(`MERGED:Lead "${dup.name}" atualizado com os novos dados (${matchField} já existia)`);
            }

            // allow_tagged: continue creating but add tag
            // Will be handled below by adding 'duplicado' tag
          }
        }
      }

      // Generate lead_code
      const { data: leadCode, error: codeError } = await supabase.rpc('generate_lead_code');
      if (codeError) throw codeError;

      // Check if we should tag as duplicate (allow_tagged mode)
      let tags: string[] | null = null;
      if (duplicateSettings.enabled && duplicateSettings.action === 'allow_tagged' && (formData.phone || formData.email)) {
        const checkPhone = duplicateSettings.check_field !== 'email' ? formData.phone || null : null;
        const checkEmail = duplicateSettings.check_field !== 'phone' ? formData.email || null : null;
        if (checkPhone || checkEmail) {
          const { data: dup } = await supabase.rpc('check_duplicate_kanban_lead', {
            p_account_id: accountId,
            p_phone: checkPhone,
            p_email: checkEmail,
          });
          if (dup && dup.length > 0) {
            tags = ['duplicado'];
          }
        }
      }

      const { data, error } = await supabase
        .from('avivar_kanban_leads')
        .insert([{
          kanban_id: effectiveKanbanId,
          column_id: columnId,
          user_id: user.id,
          account_id: accountId,
          lead_code: leadCode,
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          source: formData.source,
          notes: formData.notes || null,
          ...(tags ? { tags } : {}),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-kanban-leads'] });
      queryClient.invalidateQueries({ queryKey: ['avivar-dashboard-leads'] });
      toast.success('Lead adicionado com sucesso!');
      onOpenChange(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        source: 'manual',
        notes: '',
        selectedKanbanId: isStandalone && boards.length === 1 ? boards[0]?.id || '' : '',
        columnId: '',
      });
    },
    onError: (error: any) => {
      console.error('Error creating lead:', error);
      if (error?.message?.startsWith('MERGED:')) {
        toast.success(error.message.replace('MERGED:', ''));
        queryClient.invalidateQueries({ queryKey: ['avivar-kanban-leads'] });
        onOpenChange(false);
        setFormData({
          name: '', phone: '', email: '', source: 'manual', notes: '',
          selectedKanbanId: isStandalone && boards.length === 1 ? boards[0]?.id || '' : '',
          columnId: '',
        });
      } else if (error?.message?.startsWith('DUPLICATE:')) {
        toast.error(error.message.replace('DUPLICATE:', ''));
      } else {
        toast.error('Erro ao criar lead');
      }
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

            {/* Kanban selector - only in standalone mode */}
            {isStandalone && boards.length > 1 ? (
              <div className="space-y-2">
                <Label htmlFor="kanban">Funil</Label>
                <Select
                  value={formData.selectedKanbanId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, selectedKanbanId: value, columnId: '' }))}
                >
                  <SelectTrigger className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]">
                    <SelectValue placeholder="Selecione o funil..." />
                  </SelectTrigger>
                  <SelectContent>
                    {boards.map(board => (
                      <SelectItem key={board.id} value={board.id}>
                        {board.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
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
                    {effectiveColumns.map(col => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Column selector when kanban is selected in standalone with multiple boards */}
          {isStandalone && boards.length > 1 && formData.selectedKanbanId && (
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
                  {effectiveColumns.map(col => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
