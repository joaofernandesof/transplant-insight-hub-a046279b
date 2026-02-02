/**
 * AvivarKanbanPage - Página individual do Kanban com colunas customizáveis
 * Suporta drag-and-drop para reordenar colunas e leads
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  Plus, ArrowLeft, Loader2,
  Briefcase, HeartPulse, TrendingUp, Users, LayoutGrid as LayoutGridIcon,
  MoreHorizontal, Upload, Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SortableColumn } from './components/SortableColumn';
import { ColumnDialog } from './components/ColumnDialog';
import { KanbanColumn } from './components/KanbanColumn';
import { ViewModeToggle, ViewMode } from './components/ViewModeToggle';
import { LeadsListView } from './components/LeadsListView';
import { ImportLeadsDialog } from './components/ImportLeadsDialog';
import { ExportLeadsDialog } from './components/ExportLeadsDialog';
import { useKanbanLeads, KanbanLead } from './hooks/useKanbanLeads';
import { LeadCard } from './components/LeadCard';

export interface KanbanColumnData {
  id: string;
  kanban_id: string;
  name: string;
  color: string;
  order_index: number;
}

interface KanbanData {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
}

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'heart-pulse': return HeartPulse;
    case 'trending-up': return TrendingUp;
    case 'users': return Users;
    case 'layout-grid': return LayoutGridIcon;
    default: return Briefcase;
  }
};

export default function AvivarKanbanPage() {
  const { kanbanId } = useParams<{ kanbanId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumnData | null>(null);
  const [activeColumn, setActiveColumn] = useState<KanbanColumnData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<KanbanLead | null>(null);

  // Fetch leads for this kanban
  const { leadsByColumn, deleteLead, moveLead, isLoading: isLoadingLeads } = useKanbanLeads(kanbanId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch kanban details
  const { data: kanban, isLoading: isLoadingKanban } = useQuery({
    queryKey: ['avivar-kanban', kanbanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avivar_kanbans')
        .select('*')
        .eq('id', kanbanId)
        .single();
      
      if (error) throw error;
      return data as KanbanData;
    },
    enabled: !!kanbanId,
  });

  // Fetch columns
  const { data: columns = [], isLoading: isLoadingColumns } = useQuery({
    queryKey: ['avivar-kanban-columns', kanbanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avivar_kanban_columns')
        .select('*')
        .eq('kanban_id', kanbanId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as KanbanColumnData[];
    },
    enabled: !!kanbanId,
  });

  // Create column mutation
  const createColumn = useMutation({
    mutationFn: async (columnData: { name: string; color: string }) => {
      const { data, error } = await supabase
        .from('avivar_kanban_columns')
        .insert({
          kanban_id: kanbanId,
          name: columnData.name,
          color: columnData.color,
          order_index: columns.length,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-kanban-columns', kanbanId] });
      setIsColumnDialogOpen(false);
      toast.success('Coluna criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating column:', error);
      toast.error('Erro ao criar coluna');
    },
  });

  // Update column mutation
  const updateColumn = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KanbanColumnData> & { id: string }) => {
      const { error } = await supabase
        .from('avivar_kanban_columns')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-kanban-columns', kanbanId] });
      setEditingColumn(null);
      toast.success('Coluna atualizada!');
    },
    onError: (error) => {
      console.error('Error updating column:', error);
      toast.error('Erro ao atualizar coluna');
    },
  });

  // Delete column mutation
  const deleteColumn = useMutation({
    mutationFn: async (columnId: string) => {
      const { error } = await supabase
        .from('avivar_kanban_columns')
        .delete()
        .eq('id', columnId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-kanban-columns', kanbanId] });
      toast.success('Coluna excluída!');
    },
    onError: (error) => {
      console.error('Error deleting column:', error);
      toast.error('Erro ao excluir coluna');
    },
  });

  // Reorder columns mutation
  const reorderColumns = useMutation({
    mutationFn: async (reorderedColumns: { id: string; order_index: number }[]) => {
      const promises = reorderedColumns.map(({ id, order_index }) =>
        supabase
          .from('avivar_kanban_columns')
          .update({ order_index })
          .eq('id', id)
      );
      await Promise.all(promises);
    },
    onError: (error) => {
      console.error('Error reordering columns:', error);
      toast.error('Erro ao reordenar colunas');
      queryClient.invalidateQueries({ queryKey: ['avivar-kanban-columns', kanbanId] });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // Check if dragging a column or a lead
    const column = columns.find(c => c.id === active.id);
    if (column) {
      setActiveColumn(column);
      return;
    }
    // Check if it's a lead
    const leadData = active.data.current;
    if (leadData?.type === 'lead') {
      setActiveLead(leadData.lead);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveColumn(null);
    setActiveLead(null);

    if (!over) return;

    // Handle lead drop
    const activeData = active.data.current;
    const overData = over.data.current;
    
    if (activeData?.type === 'lead') {
      const targetColumnId = overData?.type === 'column' 
        ? overData.columnId 
        : (overData?.lead?.column_id || over.id.toString().replace('column-', ''));
      
      if (targetColumnId && targetColumnId !== activeData.lead.column_id) {
        moveLead({ leadId: active.id.toString(), columnId: targetColumnId });
      }
      return;
    }

    // Handle column reorder
    if (active.id === over.id) return;

    const oldIndex = columns.findIndex(c => c.id === active.id);
    const newIndex = columns.findIndex(c => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(columns, oldIndex, newIndex);
    
    // Optimistically update UI
    queryClient.setQueryData(['avivar-kanban-columns', kanbanId], reordered);

    // Persist to database
    const updates = reordered.map((col, idx) => ({ id: col.id, order_index: idx }));
    reorderColumns.mutate(updates);
  };

  const handleSaveColumn = (data: { name: string; color: string }) => {
    if (editingColumn) {
      updateColumn.mutate({ id: editingColumn.id, ...data });
    } else {
      createColumn.mutate(data);
    }
  };

  const Icon = kanban ? getIconComponent(kanban.icon) : Briefcase;
  const isLoading = isLoadingKanban || isLoadingColumns || isLoadingLeads;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--avivar-primary))]" />
      </div>
    );
  }

  if (!kanban) {
    return (
      <div className="p-6 text-center">
        <p className="text-[hsl(var(--avivar-muted-foreground))]">Kanban não encontrado</p>
        <Button onClick={() => navigate('/avivar/leads')} className="mt-4">
          Voltar para Leads
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--avivar-border))]">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/avivar/leads')}
            className="hover:bg-[hsl(var(--avivar-primary)/0.1)]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${kanban.color} flex items-center justify-center`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[hsl(var(--avivar-foreground))]">
                {kanban.name}
              </h1>
              {kanban.description && (
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  {kanban.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          
          {viewMode === 'kanban' && (
            <Button
              onClick={() => {
                setEditingColumn(null);
                setIsColumnDialogOpen(true);
              }}
              className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Coluna
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-[hsl(var(--avivar-primary)/0.1)]"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={() => setIsImportDialogOpen(true)}
                className="cursor-pointer"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Leads
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsExportDialogOpen(true)}
                className="cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Leads
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'kanban' ? (
        <div className="flex-1 overflow-hidden relative">
          <style>{`
            .kanban-scroll-container::-webkit-scrollbar {
              height: 12px;
              width: 8px;
            }
            .kanban-scroll-container::-webkit-scrollbar-track {
              background: rgba(139, 92, 246, 0.15);
              border-radius: 6px;
            }
            .kanban-scroll-container::-webkit-scrollbar-thumb {
              background: rgba(139, 92, 246, 0.5);
              border-radius: 6px;
            }
            .kanban-scroll-container::-webkit-scrollbar-thumb:hover {
              background: rgba(139, 92, 246, 0.7);
            }
            .kanban-scroll-container::-webkit-scrollbar-corner {
              background: transparent;
            }
          `}</style>
          <div 
            className="kanban-scroll-container absolute inset-0 overflow-x-auto overflow-y-auto p-4 pb-6"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(139, 92, 246, 0.5) rgba(139, 92, 246, 0.15)',
            }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={columns.map(c => c.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex gap-4 min-h-[500px] w-max">
                  {columns.map((column) => (
                    <SortableColumn
                      key={column.id}
                      column={column}
                       leads={leadsByColumn[column.id] ?? []}
                      onEdit={() => {
                        setEditingColumn(column);
                        setIsColumnDialogOpen(true);
                      }}
                      onDelete={() => deleteColumn.mutate(column.id)}
                       onDeleteLead={deleteLead}
                    />
                  ))}

                  {columns.length === 0 && (
                    <div className="flex-1 min-w-[300px] flex items-center justify-center border-2 border-dashed border-[hsl(var(--avivar-border))] rounded-xl">
                      <div className="text-center p-8">
                        <p className="text-[hsl(var(--avivar-muted-foreground))] mb-4">
                          Este kanban ainda não tem colunas
                        </p>
                        <Button
                          onClick={() => setIsColumnDialogOpen(true)}
                          className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Primeira Coluna
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeColumn && (
                  <div className="opacity-80">
                    <KanbanColumn column={activeColumn} isDragging />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      ) : (
        <LeadsListView columns={columns} />
      )}

      {/* Column Dialog */}
      <ColumnDialog
        open={isColumnDialogOpen}
        onOpenChange={setIsColumnDialogOpen}
        editingColumn={editingColumn}
        onSave={handleSaveColumn}
        isLoading={createColumn.isPending || updateColumn.isPending}
      />

      {/* Import Leads Dialog */}
      {kanbanId && (
        <ImportLeadsDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          kanbanId={kanbanId}
          columns={columns}
        />
      )}

      {/* Export Leads Dialog */}
      {kanbanId && kanban && (
        <ExportLeadsDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
          kanbanId={kanbanId}
          kanbanName={kanban.name}
          columns={columns}
        />
      )}
    </div>
  );
}
