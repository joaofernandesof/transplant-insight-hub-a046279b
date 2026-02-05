/**
 * Componente para selecionar em quais colunas um campo é obrigatório
 * Exibe lista de Kanbans expansíveis com suas colunas
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  selectedColumnIds: string[];
  onSelectionChange: (columnIds: string[]) => void;
}

interface Kanban {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface Column {
  id: string;
  name: string;
  kanban_id: string;
  color: string | null;
}

export function KanbanColumnSelector({ selectedColumnIds, onSelectionChange }: Props) {
  const [expandedKanbans, setExpandedKanbans] = useState<Set<string>>(new Set());

  // Buscar todos os Kanbans do usuário
  const { data: kanbans = [], isLoading: loadingKanbans } = useQuery({
    queryKey: ['avivar-kanbans-for-selector'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avivar_kanbans')
        .select('id, name, icon, color')
        .order('order_index');
      
      if (error) throw error;
      return data as Kanban[];
    }
  });

  // Buscar todas as colunas
  const { data: columns = [], isLoading: loadingColumns } = useQuery({
    queryKey: ['avivar-columns-for-selector'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avivar_kanban_columns')
        .select('id, name, kanban_id, color')
        .order('order_index');
      
      if (error) throw error;
      return data as Column[];
    }
  });

  const isLoading = loadingKanbans || loadingColumns;

  // Agrupar colunas por kanban
  const columnsByKanban = columns.reduce((acc, col) => {
    if (!acc[col.kanban_id]) acc[col.kanban_id] = [];
    acc[col.kanban_id].push(col);
    return acc;
  }, {} as Record<string, Column[]>);

  // Toggle expansão de um kanban
  const toggleExpand = (kanbanId: string) => {
    setExpandedKanbans(prev => {
      const next = new Set(prev);
      if (next.has(kanbanId)) {
        next.delete(kanbanId);
      } else {
        next.add(kanbanId);
      }
      return next;
    });
  };

  // Verificar se todas as colunas de um kanban estão selecionadas
  const isKanbanFullySelected = (kanbanId: string) => {
    const kanbanCols = columnsByKanban[kanbanId] || [];
    if (kanbanCols.length === 0) return false;
    return kanbanCols.every(col => selectedColumnIds.includes(col.id));
  };

  // Verificar se pelo menos uma coluna de um kanban está selecionada
  const isKanbanPartiallySelected = (kanbanId: string) => {
    const kanbanCols = columnsByKanban[kanbanId] || [];
    const selectedCount = kanbanCols.filter(col => selectedColumnIds.includes(col.id)).length;
    return selectedCount > 0 && selectedCount < kanbanCols.length;
  };

  // Selecionar/desselecionar todas as colunas de um kanban
  const toggleKanban = (kanbanId: string) => {
    const kanbanCols = columnsByKanban[kanbanId] || [];
    const kanbanColIds = kanbanCols.map(col => col.id);
    
    if (isKanbanFullySelected(kanbanId)) {
      // Desselecionar todas
      onSelectionChange(selectedColumnIds.filter(id => !kanbanColIds.includes(id)));
    } else {
      // Selecionar todas
      const newSelection = [...selectedColumnIds];
      kanbanColIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      onSelectionChange(newSelection);
    }
  };

  // Selecionar/desselecionar uma coluna específica
  const toggleColumn = (columnId: string) => {
    if (selectedColumnIds.includes(columnId)) {
      onSelectionChange(selectedColumnIds.filter(id => id !== columnId));
    } else {
      onSelectionChange([...selectedColumnIds, columnId]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--avivar-primary))]" />
      </div>
    );
  }

  if (kanbans.length === 0) {
    return (
      <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] text-center py-2">
        Nenhum kanban encontrado
      </p>
    );
  }

  return (
    <ScrollArea className="max-h-[200px] border border-[hsl(var(--avivar-border))] rounded-md">
      <div className="p-2 space-y-1">
        {kanbans.map((kanban) => {
          const isExpanded = expandedKanbans.has(kanban.id);
          const kanbanCols = columnsByKanban[kanban.id] || [];
          const isFullySelected = isKanbanFullySelected(kanban.id);
          const isPartial = isKanbanPartiallySelected(kanban.id);

          return (
            <div key={kanban.id}>
              {/* Kanban Row */}
              <div 
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md hover:bg-[hsl(var(--avivar-muted)/0.3)] cursor-pointer transition-colors",
                  isExpanded && "bg-[hsl(var(--avivar-muted)/0.2)]"
                )}
              >
                <Checkbox
                  checked={isFullySelected}
                  ref={(el) => {
                    if (el && isPartial) {
                      el.dataset.state = 'indeterminate';
                    }
                  }}
                  onCheckedChange={() => toggleKanban(kanban.id)}
                  className="border-[hsl(var(--avivar-border))] data-[state=checked]:bg-[hsl(var(--avivar-primary))] data-[state=checked]:border-[hsl(var(--avivar-primary))]"
                />
                <button
                  type="button"
                  onClick={() => toggleExpand(kanban.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                  )}
                  {kanban.color && (
                    <div 
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: kanban.color }}
                    />
                  )}
                  <span className="text-sm text-[hsl(var(--avivar-foreground))] font-medium">
                    {kanban.name}
                  </span>
                  <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    ({kanbanCols.length} colunas)
                  </span>
                </button>
              </div>

              {/* Columns */}
              {isExpanded && kanbanCols.length > 0 && (
                <div className="ml-6 mt-1 border-l-2 border-[hsl(var(--avivar-border))] pl-3">
                  <ScrollArea className="max-h-[150px]">
                    <div className="space-y-1 pr-2">
                      {kanbanCols.map((column) => {
                        const isSelected = selectedColumnIds.includes(column.id);
                        
                        return (
                          <div
                            key={column.id}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-md hover:bg-[hsl(var(--avivar-muted)/0.3)] cursor-pointer transition-colors",
                              isSelected && "bg-[hsl(var(--avivar-primary)/0.1)]"
                            )}
                            onClick={() => toggleColumn(column.id)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleColumn(column.id)}
                              className="border-[hsl(var(--avivar-border))] data-[state=checked]:bg-[hsl(var(--avivar-primary))] data-[state=checked]:border-[hsl(var(--avivar-primary))]"
                            />
                            {column.color && (
                              <div 
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: column.color }}
                              />
                            )}
                            <span className="text-sm text-[hsl(var(--avivar-foreground))]">
                              {column.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
