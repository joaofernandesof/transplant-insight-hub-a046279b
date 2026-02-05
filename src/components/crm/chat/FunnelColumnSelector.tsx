/**
 * FunnelColumnSelector - Seletor cascata de Funil e Coluna
 * Permite transferir lead entre funis e colunas do Kanban
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, Loader2, Target, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Kanban {
  id: string;
  name: string;
  color: string | null;
}

interface Column {
  id: string;
  name: string;
  color: string | null;
  order_index: number;
}

interface FunnelColumnSelectorProps {
  phone: string | null | undefined;
  currentKanbanName?: string | null;
  currentColumnName?: string | null;
  onTransferred?: () => void;
}

export function FunnelColumnSelector({
  phone,
  currentKanbanName,
  currentColumnName,
  onTransferred,
}: FunnelColumnSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedKanban, setSelectedKanban] = useState<Kanban | null>(null);
  const queryClient = useQueryClient();

  // Fetch all kanbans
  const { data: kanbans = [], isLoading: loadingKanbans } = useQuery({
    queryKey: ['avivar-kanbans-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avivar_kanbans')
        .select('id, name, color')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as Kanban[];
    },
    enabled: open,
  });

  // Fetch columns for selected kanban
  const { data: columns = [], isLoading: loadingColumns } = useQuery({
    queryKey: ['avivar-kanban-columns', selectedKanban?.id],
    queryFn: async () => {
      if (!selectedKanban) return [];

      const { data, error } = await supabase
        .from('avivar_kanban_columns')
        .select('id, name, color, order_index')
        .eq('kanban_id', selectedKanban.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as Column[];
    },
    enabled: !!selectedKanban,
  });

  // Mutation to transfer lead
  const transferMutation = useMutation({
    mutationFn: async ({ kanbanId, columnId }: { kanbanId: string; columnId: string }) => {
      if (!phone) throw new Error('Telefone não encontrado');

      // First, check if lead already exists in this kanban
      const { data: existingLead, error: checkError } = await supabase
        .from('avivar_kanban_leads')
        .select('id')
        .eq('phone', phone)
        .eq('kanban_id', kanbanId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingLead) {
        // Update existing lead to new column
        const { error: updateError } = await supabase
          .from('avivar_kanban_leads')
          .update({ column_id: columnId, updated_at: new Date().toISOString() })
          .eq('id', existingLead.id);

        if (updateError) throw updateError;
      } else {
        // Get current lead data from any kanban
        const { data: currentLead, error: findError } = await supabase
          .from('avivar_kanban_leads')
          .select('*')
          .eq('phone', phone)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (findError) throw findError;

        if (currentLead) {
          // Create new lead in the target kanban/column
          const { error: insertError } = await supabase
            .from('avivar_kanban_leads')
            .insert([{
              user_id: currentLead.user_id,
              kanban_id: kanbanId,
              column_id: columnId,
              contact_id: currentLead.contact_id,
              name: currentLead.name,
              phone: currentLead.phone,
              email: currentLead.email,
              notes: currentLead.notes,
              source: currentLead.source,
              tags: currentLead.tags,
            }] as any);

          if (insertError) throw insertError;
        } else {
          throw new Error('Lead não encontrado');
        }
      }
    },
    onSuccess: () => {
      toast.success('Lead transferido com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['lead-kanban-info', phone] });
      queryClient.invalidateQueries({ queryKey: ['avivar-kanban-leads'] });
      setOpen(false);
      setSelectedKanban(null);
      onTransferred?.();
    },
    onError: (error) => {
      console.error('Error transferring lead:', error);
      toast.error('Erro ao transferir lead');
    },
  });

  const handleSelectKanban = (kanban: Kanban) => {
    setSelectedKanban(kanban);
  };

  const handleSelectColumn = (column: Column) => {
    if (!selectedKanban) return;
    transferMutation.mutate({ kanbanId: selectedKanban.id, columnId: column.id });
  };

  const handleBack = () => {
    setSelectedKanban(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedKanban(null);
    }
  };

  const hasCurrentLocation = currentKanbanName && currentColumnName;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center justify-between py-2.5 px-3 rounded-lg",
            "bg-[hsl(var(--avivar-muted)/0.5)] hover:bg-[hsl(var(--avivar-muted))]",
            "border border-[hsl(var(--avivar-border))]",
            "transition-colors duration-200 text-left group"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Target className="h-4 w-4 text-[hsl(var(--avivar-primary))] shrink-0" />
            {hasCurrentLocation ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-medium text-[hsl(var(--avivar-foreground))] truncate">
                  {currentKanbanName}
                </span>
                <ArrowRight className="h-3 w-3 text-[hsl(var(--avivar-muted-foreground))] shrink-0" />
                <span className="text-sm text-[hsl(var(--avivar-muted-foreground))] truncate">
                  {currentColumnName}
                </span>
              </div>
            ) : (
              <span className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                Selecionar funil...
              </span>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))] group-hover:text-[hsl(var(--avivar-foreground))] transition-colors shrink-0" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-64 p-0 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]"
        align="start"
        side="left"
      >
        {selectedKanban ? (
          // Column selection
          <div className="flex flex-col">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-2.5 border-b border-[hsl(var(--avivar-border))] hover:bg-[hsl(var(--avivar-muted)/0.5)] transition-colors"
            >
              <ChevronRight className="h-4 w-4 rotate-180 text-[hsl(var(--avivar-muted-foreground))]" />
              <span className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">
                {selectedKanban.name}
              </span>
            </button>

            {loadingColumns ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--avivar-primary))]" />
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {columns.map((column) => (
                  <button
                    key={column.id}
                    onClick={() => handleSelectColumn(column)}
                    disabled={transferMutation.isPending}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5",
                      "hover:bg-[hsl(var(--avivar-muted)/0.5)] transition-colors",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        column.color ? `bg-gradient-to-r ${column.color}` : "bg-[hsl(var(--avivar-muted-foreground))]"
                      )}
                    />
                    <span className="text-sm text-[hsl(var(--avivar-foreground))] truncate">
                      {column.name}
                    </span>
                    {transferMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin ml-auto text-[hsl(var(--avivar-primary))]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Kanban selection
          <div className="flex flex-col">
            <div className="px-3 py-2 border-b border-[hsl(var(--avivar-border))]">
              <span className="text-xs font-semibold text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wide">
                Transferir para
              </span>
            </div>

            {loadingKanbans ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--avivar-primary))]" />
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {kanbans.map((kanban) => (
                  <button
                    key={kanban.id}
                    onClick={() => handleSelectKanban(kanban)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[hsl(var(--avivar-muted)/0.5)] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full shrink-0",
                          kanban.color ? `bg-gradient-to-r ${kanban.color}` : "bg-[hsl(var(--avivar-primary))]"
                        )}
                      />
                      <span className="text-sm font-medium text-[hsl(var(--avivar-foreground))] truncate">
                        {kanban.name}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))] shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
