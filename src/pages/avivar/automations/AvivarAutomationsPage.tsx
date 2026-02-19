/**
 * AvivarAutomationsPage - Digital Funnel Automations (Kommo-style)
 * Unified pipeline grid with per-column automation cards
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Zap, ChevronRight, Play, Pause,
  Trash2, Edit, MoreHorizontal, History, Bot, Tag,
  MessageSquare, ArrowRight, UserCheck, ListTodo, StickyNote,
  Webhook, Plug, UserPlus, Contact, Clock, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  useAvivarAutomations,
  useAvivarAutomationExecutions,
  TRIGGER_CATEGORIES,
  ACTION_TYPES,
  type AvivarAutomation,
  type AvivarAutomationAction,
} from '@/hooks/useAvivarAutomations';
import type { KanbanColumnData } from '../kanban/AvivarKanbanPage';

// =============================================
// Action icon resolver
// =============================================
const getActionIcon = (type: string) => {
  switch (type) {
    case 'change_stage': return ArrowRight;
    case 'change_responsible': return UserCheck;
    case 'create_task': return ListTodo;
    case 'send_message': return MessageSquare;
    case 'trigger_chatbot': return Bot;
    case 'add_tag': case 'remove_tag': return Tag;
    case 'create_note': return StickyNote;
    case 'dispatch_webhook': return Webhook;
    case 'execute_integration': return Plug;
    case 'create_lead': return UserPlus;
    case 'create_contact': return Contact;
    default: return Zap;
  }
};

const getTriggerLabel = (triggerType: string) => {
  for (const cat of TRIGGER_CATEGORIES) {
    const found = cat.triggers.find(t => t.value === triggerType);
    if (found) return found.label;
  }
  return triggerType;
};

// =============================================
// Main Page
// =============================================
export default function AvivarAutomationsPage() {
  const { kanbanId } = useParams<{ kanbanId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pipeline');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<AvivarAutomation | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch kanban info
  const { data: kanban } = useQuery({
    queryKey: ['avivar-kanban', kanbanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avivar_kanbans')
        .select('*')
        .eq('id', kanbanId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!kanbanId,
  });

  // Fetch columns
  const { data: columns = [] } = useQuery({
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

  const {
    automations, actionsByAutomation, isLoading,
    createAutomation, updateAutomation, deleteAutomation, toggleAutomation,
  } = useAvivarAutomations(kanbanId);

  // Group automations by column (all automations belong to a column now)
  const automationsByColumn = useMemo(() => {
    const map: Record<string, AvivarAutomation[]> = {};
    columns.forEach(c => { map[c.id] = []; });
    automations.forEach(a => {
      if (a.column_id && map[a.column_id]) {
        map[a.column_id].push(a);
      }
    });
    return map;
  }, [automations, columns]);

  const filteredAutomations = useMemo(() => {
    if (!searchQuery.trim()) return automations;
    const q = searchQuery.toLowerCase();
    return automations.filter(a =>
      a.name.toLowerCase().includes(q) ||
      getTriggerLabel(a.trigger_type).toLowerCase().includes(q)
    );
  }, [automations, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--avivar-background))]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[hsl(var(--avivar-background))] border-b border-[hsl(var(--avivar-border))]">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost" size="icon"
              onClick={() => navigate(`/avivar/kanban/${kanbanId}`)}
              className="hover:bg-[hsl(var(--avivar-primary)/0.1)]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[hsl(var(--avivar-foreground))]">
                  Automações
                </h1>
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  {kanban?.name || 'Carregando...'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {automations.length} automação{automations.length !== 1 ? 'ões' : ''}
            </Badge>
            <Button
              onClick={() => { setEditingAutomation(null); setSelectedColumnId(null); setIsCreateOpen(true); }}
              className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Automação
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
          <TabsList className="bg-[hsl(var(--avivar-card))]">
            <TabsTrigger value="pipeline">Funil Digital</TabsTrigger>
            <TabsTrigger value="list">Todas as Automações</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'pipeline' && (
          <PipelineView
            columns={columns}
            automationsByColumn={automationsByColumn}
            actionsByAutomation={actionsByAutomation}
            onAddAutomation={(columnId) => {
              setEditingAutomation(null);
              setSelectedColumnId(columnId);
              setIsCreateOpen(true);
            }}
            onEditAutomation={(a) => {
              setEditingAutomation(a);
              setIsCreateOpen(true);
            }}
            onToggle={(id, active) => toggleAutomation.mutate({ id, is_active: active })}
            onDelete={(id) => deleteAutomation.mutate(id)}
          />
        )}
        {activeTab === 'list' && (
          <ListView
            automations={filteredAutomations}
            actionsByAutomation={actionsByAutomation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onEditAutomation={(a) => {
              setEditingAutomation(a);
              setIsCreateOpen(true);
            }}
            onToggle={(id, active) => toggleAutomation.mutate({ id, is_active: active })}
            onDelete={(id) => deleteAutomation.mutate(id)}
          />
        )}
        {activeTab === 'history' && (
          <HistoryView />
        )}
      </div>

      {/* Create/Edit Dialog */}
      <AutomationDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        automation={editingAutomation}
        columns={columns}
        kanbanId={kanbanId || ''}
        preSelectedColumnId={selectedColumnId}
        onSave={(data) => {
          if (editingAutomation) {
            updateAutomation.mutate({ id: editingAutomation.id, ...data });
          } else {
            createAutomation.mutate(data as any);
          }
          setIsCreateOpen(false);
        }}
      />
    </div>
  );
}

// =============================================
// Pipeline View - Unified horizontal funnel grid (Kommo-style)
// =============================================
function PipelineView({
  columns,
  automationsByColumn,
  actionsByAutomation,
  onAddAutomation,
  onEditAutomation,
  onToggle,
  onDelete,
}: {
  columns: KanbanColumnData[];
  automationsByColumn: Record<string, AvivarAutomation[]>;
  actionsByAutomation: Record<string, AvivarAutomationAction[]>;
  onAddAutomation: (columnId: string) => void;
  onEditAutomation: (a: AvivarAutomation) => void;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-3 pb-4 min-w-max">
        {columns.map((col, idx) => {
          const colAutomations = automationsByColumn[col.id] || [];
          return (
            <div
              key={col.id}
              className="w-[280px] flex-shrink-0 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] flex flex-col"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-[hsl(var(--avivar-border))] flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: col.color || '#8b5cf6' }}
                  />
                  <h4 className="font-medium text-sm text-[hsl(var(--avivar-foreground))] truncate">
                    {col.name}
                  </h4>
                  <Badge variant="outline" className="text-[10px] px-1.5 flex-shrink-0">
                    {colAutomations.length}
                  </Badge>
                </div>
                {idx < columns.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))] flex-shrink-0" />
                )}
              </div>

              {/* Automations List */}
              <div className="p-3 space-y-2 flex-1">
                {colAutomations.map(a => (
                  <AutomationCard
                    key={a.id}
                    automation={a}
                    actions={actionsByAutomation[a.id] || []}
                    onEdit={() => onEditAutomation(a)}
                    onToggle={(active) => onToggle(a.id, active)}
                    onDelete={() => onDelete(a.id)}
                  />
                ))}

                {/* Add Automation Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full border border-dashed border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-primary))] hover:border-[hsl(var(--avivar-primary))]"
                  onClick={() => onAddAutomation(col.id)}
                >
                  <Plus className="h-3 w-3 mr-1" /> Automação
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// =============================================
// Automation Card
// =============================================
function AutomationCard({
  automation,
  actions,
  onEdit,
  onToggle,
  onDelete,
}: {
  automation: AvivarAutomation;
  actions: AvivarAutomationAction[];
  onEdit: () => void;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
}) {
  // Find message preview if there's a send_message action
  const messageAction = actions.find(a => a.action_type === 'send_message');
  const messagePreview = messageAction?.action_config?.message as string | undefined;

  return (
    <div
      className={`rounded-lg border border-[hsl(var(--avivar-border))] p-3 transition-all hover:border-[hsl(var(--avivar-primary)/0.5)] cursor-pointer ${
        automation.is_active ? 'bg-[hsl(var(--avivar-background))]' : 'bg-[hsl(var(--avivar-muted)/0.3)] opacity-60'
      }`}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Zap className={`h-3.5 w-3.5 flex-shrink-0 ${automation.is_active ? 'text-orange-500' : 'text-[hsl(var(--avivar-muted-foreground))]'}`} />
            <span className="font-medium text-sm text-[hsl(var(--avivar-foreground))] truncate">
              {automation.name}
            </span>
          </div>
          <div className="flex items-center gap-1 mb-1 flex-wrap">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {getTriggerLabel(automation.trigger_type)}
            </Badge>
            {automation.delay_seconds > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                <Clock className="h-2.5 w-2.5 mr-0.5" />
                {automation.delay_seconds >= 3600
                  ? `${Math.floor(automation.delay_seconds / 3600)}h`
                  : automation.delay_seconds >= 60
                  ? `${Math.floor(automation.delay_seconds / 60)}min`
                  : `${automation.delay_seconds}s`}
              </Badge>
            )}
          </div>
          {/* Action badges */}
          {actions.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {actions.map(a => {
                const ActionIcon = getActionIcon(a.action_type);
                return (
                  <Badge key={a.id} variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                    <ActionIcon className="h-2.5 w-2.5" />
                    {ACTION_TYPES.find(t => t.value === a.action_type)?.label || a.action_type}
                  </Badge>
                );
              })}
            </div>
          )}
          {/* Message preview */}
          {messagePreview && (
            <p className="text-[11px] text-[hsl(var(--avivar-muted-foreground))] mt-1.5 line-clamp-2 italic">
              "{messagePreview}"
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={automation.is_active}
            onCheckedChange={onToggle}
            className="scale-75"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-3.5 w-3.5 mr-2" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// =============================================
// List View
// =============================================
function ListView({
  automations,
  actionsByAutomation,
  searchQuery,
  onSearchChange,
  onEditAutomation,
  onToggle,
  onDelete,
}: {
  automations: AvivarAutomation[];
  actionsByAutomation: Record<string, AvivarAutomationAction[]>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onEditAutomation: (a: AvivarAutomation) => void;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
        <Input
          placeholder="Buscar automações..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]"
        />
      </div>
      {automations.length === 0 ? (
        <div className="text-center py-12">
          <Zap className="h-12 w-12 text-[hsl(var(--avivar-muted-foreground))] mx-auto mb-4" />
          <p className="text-[hsl(var(--avivar-muted-foreground))]">Nenhuma automação encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {automations.map(a => (
            <AutomationCard
              key={a.id}
              automation={a}
              actions={actionsByAutomation[a.id] || []}
              onEdit={() => onEditAutomation(a)}
              onToggle={(active) => onToggle(a.id, active)}
              onDelete={() => onDelete(a.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================
// History View
// =============================================
function HistoryView() {
  const { data: executions = [], isLoading } = useAvivarAutomationExecutions();

  const statusColors: Record<string, string> = {
    completed: 'text-green-500 bg-green-500/10',
    failed: 'text-red-500 bg-red-500/10',
    running: 'text-blue-500 bg-blue-500/10',
    pending: 'text-yellow-500 bg-yellow-500/10',
    skipped: 'text-gray-500 bg-gray-500/10',
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-[hsl(var(--avivar-foreground))]">
        <History className="h-4 w-4 inline mr-2" />
        Histórico de Execuções
      </h3>
      {executions.length === 0 ? (
        <div className="text-center py-12">
          <History className="h-12 w-12 text-[hsl(var(--avivar-muted-foreground))] mx-auto mb-4" />
          <p className="text-[hsl(var(--avivar-muted-foreground))]">Nenhuma execução registrada ainda</p>
        </div>
      ) : (
        <div className="space-y-2">
          {executions.map(e => (
            <div key={e.id} className="rounded-lg border border-[hsl(var(--avivar-border))] p-3 bg-[hsl(var(--avivar-card))]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[e.status] || 'text-gray-500 bg-gray-500/10'}>
                    {e.status}
                  </Badge>
                  <span className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">
                    {e.trigger_event}
                  </span>
                </div>
                <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                  {new Date(e.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
              {e.error_message && (
                <p className="text-xs text-red-500 mt-1">{e.error_message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================
// Create/Edit Dialog - with message editor for send_message actions
// =============================================
function AutomationDialog({
  open,
  onOpenChange,
  automation,
  columns,
  kanbanId,
  preSelectedColumnId,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation: AvivarAutomation | null;
  columns: KanbanColumnData[];
  kanbanId: string;
  preSelectedColumnId: string | null;
  onSave: (data: any) => void;
}) {
  const isEditing = !!automation;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('');
  const [columnId, setColumnId] = useState<string>('');
  const [delaySeconds, setDelaySeconds] = useState(0);
  const [executeOnce, setExecuteOnce] = useState(false);
  const [actionsList, setActionsList] = useState<{ action_type: string; action_config: Record<string, any>; order_index: number; delay_seconds: number }[]>([]);

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      if (automation) {
        setName(automation.name);
        setDescription(automation.description || '');
        setTriggerType(automation.trigger_type);
        setColumnId(automation.column_id || '');
        setDelaySeconds(automation.delay_seconds);
        setExecuteOnce(automation.execute_once_per_lead);
        // TODO: load existing actions if editing
        setActionsList([]);
      } else {
        setName('');
        setDescription('');
        setTriggerType('');
        setColumnId(preSelectedColumnId || '');
        setDelaySeconds(0);
        setExecuteOnce(false);
        setActionsList([]);
      }
    }
    onOpenChange(isOpen);
  };

  const addAction = () => {
    setActionsList(prev => [...prev, {
      action_type: 'send_message',
      action_config: {},
      order_index: prev.length,
      delay_seconds: 0,
    }]);
  };

  const updateAction = (index: number, updates: Partial<typeof actionsList[0]>) => {
    setActionsList(prev => prev.map((a, i) => i === index ? { ...a, ...updates } : a));
  };

  const updateActionConfig = (index: number, key: string, value: any) => {
    setActionsList(prev => prev.map((a, i) =>
      i === index ? { ...a, action_config: { ...a.action_config, [key]: value } } : a
    ));
  };

  const removeAction = (index: number) => {
    setActionsList(prev => prev.filter((_, i) => i !== index).map((a, i) => ({ ...a, order_index: i })));
  };

  const handleSave = () => {
    if (!name.trim() || !triggerType) {
      toast.error('Preencha nome e gatilho');
      return;
    }
    if (!columnId) {
      toast.error('Selecione a etapa');
      return;
    }
    onSave({
      name,
      description: description || undefined,
      trigger_type: triggerType,
      kanban_id: kanbanId,
      column_id: columnId,
      is_global: false,
      delay_seconds: delaySeconds,
      execute_once_per_lead: executeOnce,
      actions: actionsList,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            {isEditing ? 'Editar Automação' : 'Nova Automação'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 pb-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>Nome da Automação *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Mover lead ao receber mensagem" />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o que esta automação faz..." rows={2} />
            </div>

            {/* Stage */}
            <div className="space-y-2">
              <Label>Etapa *</Label>
              <Select value={columnId} onValueChange={setColumnId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a etapa..." />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || '#8b5cf6' }} />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Trigger */}
            <div className="space-y-2">
              <Label>Gatilho (Quando executar?) *</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gatilho..." />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_CATEGORIES.map(cat => (
                    <SelectGroup key={cat.category}>
                      <SelectLabel>{cat.category}</SelectLabel>
                      {cat.triggers.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delay */}
            <div className="space-y-2">
              <Label>Atraso antes de executar (segundos)</Label>
              <Input
                type="number" min={0}
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Execute once */}
            <div className="flex items-center gap-3">
              <Switch checked={executeOnce} onCheckedChange={setExecuteOnce} />
              <span className="text-sm text-[hsl(var(--avivar-foreground))]">
                Executar apenas uma vez por lead
              </span>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Ações (O que fazer?)</Label>
                <Button variant="outline" size="sm" onClick={addAction}>
                  <Plus className="h-3 w-3 mr-1" /> Ação
                </Button>
              </div>
              {actionsList.length === 0 && (
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] text-center py-4 border border-dashed border-[hsl(var(--avivar-border))] rounded-lg">
                  Adicione pelo menos uma ação
                </p>
              )}
              <div className="space-y-3">
                {actionsList.map((action, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))] space-y-2">
                    {/* Action header */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[hsl(var(--avivar-muted-foreground))] font-mono w-6 text-center">
                        {idx + 1}
                      </span>
                      <Select
                        value={action.action_type}
                        onValueChange={(v) => updateAction(idx, { action_type: v, action_config: {} })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTION_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={0}
                        value={action.delay_seconds}
                        onChange={(e) => updateAction(idx, { delay_seconds: parseInt(e.target.value) || 0 })}
                        className="w-20"
                        placeholder="Delay (s)"
                      />
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => removeAction(idx)}
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Action-specific config */}
                    {action.action_type === 'send_message' && (
                      <div className="space-y-2 pl-8">
                        <Textarea
                          value={action.action_config.message || ''}
                          onChange={(e) => updateActionConfig(idx, 'message', e.target.value)}
                          placeholder="Digite a mensagem que será enviada ao lead... Variáveis: {{nome}}, {{primeiro_nome}}, {{procedimento}}"
                          rows={3}
                          className="text-sm"
                        />
                        <p className="text-[11px] text-[hsl(var(--avivar-muted-foreground))]">
                          Use variáveis como {'{{nome}}'}, {'{{primeiro_nome}}'}, {'{{procedimento}}'} para personalizar
                        </p>
                      </div>
                    )}

                    {action.action_type === 'change_stage' && (
                      <div className="pl-8">
                        <Select
                          value={action.action_config.target_column_id || ''}
                          onValueChange={(v) => updateActionConfig(idx, 'target_column_id', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Mover para etapa..." />
                          </SelectTrigger>
                          <SelectContent>
                            {columns.map(c => (
                              <SelectItem key={c.id} value={c.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || '#8b5cf6' }} />
                                  {c.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {action.action_type === 'add_tag' && (
                      <div className="pl-8">
                        <Input
                          value={action.action_config.tag || ''}
                          onChange={(e) => updateActionConfig(idx, 'tag', e.target.value)}
                          placeholder="Nome da tag..."
                        />
                      </div>
                    )}

                    {action.action_type === 'remove_tag' && (
                      <div className="pl-8">
                        <Input
                          value={action.action_config.tag || ''}
                          onChange={(e) => updateActionConfig(idx, 'tag', e.target.value)}
                          placeholder="Nome da tag para remover..."
                        />
                      </div>
                    )}

                    {action.action_type === 'create_task' && (
                      <div className="pl-8 space-y-2">
                        <Input
                          value={action.action_config.title || ''}
                          onChange={(e) => updateActionConfig(idx, 'title', e.target.value)}
                          placeholder="Título da tarefa..."
                        />
                        <Textarea
                          value={action.action_config.description || ''}
                          onChange={(e) => updateActionConfig(idx, 'description', e.target.value)}
                          placeholder="Descrição da tarefa..."
                          rows={2}
                        />
                      </div>
                    )}

                    {action.action_type === 'create_note' && (
                      <div className="pl-8">
                        <Textarea
                          value={action.action_config.content || ''}
                          onChange={(e) => updateActionConfig(idx, 'content', e.target.value)}
                          placeholder="Conteúdo da nota..."
                          rows={2}
                        />
                      </div>
                    )}

                    {action.action_type === 'dispatch_webhook' && (
                      <div className="pl-8 space-y-2">
                        <Input
                          value={action.action_config.url || ''}
                          onChange={(e) => updateActionConfig(idx, 'url', e.target.value)}
                          placeholder="https://..."
                        />
                        <Select
                          value={action.action_config.method || 'POST'}
                          onValueChange={(v) => updateActionConfig(idx, 'method', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSave}
            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
          >
            {isEditing ? 'Salvar' : 'Criar Automação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
