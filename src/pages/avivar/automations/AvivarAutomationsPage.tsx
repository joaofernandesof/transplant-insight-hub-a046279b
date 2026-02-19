/**
 * AvivarAutomationsPage - Digital Pipeline Automations (Kommo-style)
 * Horizontal pipeline with colorful trigger card grid per stage
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Zap, ChevronRight, Trash2, Edit, MoreHorizontal,
  History, Bot, Tag, MessageSquare, ArrowRight, UserCheck, ListTodo,
  StickyNote, Webhook, Plug, UserPlus, Contact, Clock, Search,
  Mail, Hash, CheckSquare, FileText, Pencil, FileX2, X,
  Settings2, Play, Pause,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
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
// Kommo-style Trigger Cards definitions
// =============================================
const TRIGGER_CARDS = [
  {
    id: 'salesbot',
    label: 'Salesbot',
    description: 'Bot de vendas automático',
    icon: Bot,
    color: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    triggerType: 'message.received',
    defaultAction: 'trigger_chatbot',
  },
  {
    id: 'add_task',
    label: 'Criar tarefa',
    description: 'Adicionar tarefa ao lead',
    icon: ListTodo,
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgLight: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    triggerType: 'lead.moved_to',
    defaultAction: 'create_task',
  },
  {
    id: 'create_lead',
    label: 'Criar lead',
    description: 'Criar um novo lead',
    icon: UserPlus,
    color: 'bg-violet-500',
    textColor: 'text-violet-700',
    bgLight: 'bg-violet-50 dark:bg-violet-950/30',
    borderColor: 'border-violet-200 dark:border-violet-800',
    triggerType: 'lead.moved_to',
    defaultAction: 'create_lead',
  },
  {
    id: 'send_message',
    label: 'Enviar mensagem',
    description: 'Enviar WhatsApp ao lead',
    icon: MessageSquare,
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgLight: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    triggerType: 'lead.moved_to',
    defaultAction: 'send_message',
  },
  {
    id: 'send_webhook',
    label: 'Enviar webhook',
    description: 'Disparar webhook externo',
    icon: Webhook,
    color: 'bg-slate-600',
    textColor: 'text-slate-700',
    bgLight: 'bg-slate-50 dark:bg-slate-950/30',
    borderColor: 'border-slate-200 dark:border-slate-800',
    triggerType: 'lead.moved_to',
    defaultAction: 'dispatch_webhook',
  },
  {
    id: 'change_stage',
    label: 'Alterar etapa',
    description: 'Mover lead para outra etapa',
    icon: ArrowRight,
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    triggerType: 'lead.moved_to',
    defaultAction: 'change_stage',
  },
  {
    id: 'add_tag',
    label: 'Adicionar tags',
    description: 'Adicionar tags ao lead',
    icon: Hash,
    color: 'bg-pink-500',
    textColor: 'text-pink-700',
    bgLight: 'bg-pink-50 dark:bg-pink-950/30',
    borderColor: 'border-pink-200 dark:border-pink-800',
    triggerType: 'lead.moved_to',
    defaultAction: 'add_tag',
  },
  {
    id: 'create_note',
    label: 'Criar nota',
    description: 'Adicionar nota ao lead',
    icon: StickyNote,
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgLight: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    triggerType: 'lead.moved_to',
    defaultAction: 'create_note',
  },
  {
    id: 'change_responsible',
    label: 'Alterar responsável',
    description: 'Mudar responsável do lead',
    icon: UserCheck,
    color: 'bg-teal-500',
    textColor: 'text-teal-700',
    bgLight: 'bg-teal-50 dark:bg-teal-950/30',
    borderColor: 'border-teal-200 dark:border-teal-800',
    triggerType: 'lead.moved_to',
    defaultAction: 'change_responsible',
  },
  {
    id: 'change_field',
    label: 'Alterar campo',
    description: 'Modificar campo do lead',
    icon: Pencil,
    color: 'bg-indigo-500',
    textColor: 'text-indigo-700',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/30',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    triggerType: 'lead.moved_to',
    defaultAction: 'change_field',
  },
  {
    id: 'create_contact',
    label: 'Criar contato',
    description: 'Criar contato vinculado',
    icon: Contact,
    color: 'bg-cyan-500',
    textColor: 'text-cyan-700',
    bgLight: 'bg-cyan-50 dark:bg-cyan-950/30',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    triggerType: 'lead.moved_to',
    defaultAction: 'create_contact',
  },
  {
    id: 'integration',
    label: 'Integração externa',
    description: 'Executar integração',
    icon: Plug,
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgLight: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    triggerType: 'lead.moved_to',
    defaultAction: 'execute_integration',
  },
];

const getTriggerCard = (automation: AvivarAutomation, actions: AvivarAutomationAction[]) => {
  // Match by first action type
  const firstAction = actions[0];
  if (firstAction) {
    const card = TRIGGER_CARDS.find(c => c.defaultAction === firstAction.action_type);
    if (card) return card;
  }
  // Fallback
  return TRIGGER_CARDS[0];
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
  const [triggerPickerColumn, setTriggerPickerColumn] = useState<string | null>(null);
  const [configDialog, setConfigDialog] = useState<{
    open: boolean;
    columnId: string;
    triggerCard: typeof TRIGGER_CARDS[0] | null;
    automation: AvivarAutomation | null;
  }>({ open: false, columnId: '', triggerCard: null, automation: null });
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleTriggerSelect = (columnId: string, card: typeof TRIGGER_CARDS[0]) => {
    setTriggerPickerColumn(null);
    setConfigDialog({
      open: true,
      columnId,
      triggerCard: card,
      automation: null,
    });
  };

  const handleEditAutomation = (a: AvivarAutomation) => {
    const card = getTriggerCard(a, actionsByAutomation[a.id] || []);
    setConfigDialog({
      open: true,
      columnId: a.column_id || '',
      triggerCard: card,
      automation: a,
    });
  };

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
                <h1 className="text-xl font-bold text-[hsl(var(--avivar-foreground))]">Automações</h1>
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">{kanban?.name || 'Carregando...'}</p>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">
            {automations.length} automação{automations.length !== 1 ? 'ões' : ''}
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
          <TabsList className="bg-[hsl(var(--avivar-card))]">
            <TabsTrigger value="pipeline">Funil Digital</TabsTrigger>
            <TabsTrigger value="list">Todas as Automações</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'pipeline' && (
          <PipelineView
            columns={columns}
            automationsByColumn={automationsByColumn}
            actionsByAutomation={actionsByAutomation}
            triggerPickerColumn={triggerPickerColumn}
            onOpenTriggerPicker={setTriggerPickerColumn}
            onSelectTrigger={handleTriggerSelect}
            onEditAutomation={handleEditAutomation}
            onToggle={(id, active) => toggleAutomation.mutate({ id, is_active: active })}
            onDelete={(id) => deleteAutomation.mutate(id)}
          />
        )}
        {activeTab === 'list' && (
          <div className="p-4 space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
              <Input
                placeholder="Buscar automações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]"
              />
            </div>
            {filteredAutomations.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="h-12 w-12 text-[hsl(var(--avivar-muted-foreground))] mx-auto mb-4" />
                <p className="text-[hsl(var(--avivar-muted-foreground))]">Nenhuma automação encontrada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAutomations.map(a => {
                  const card = getTriggerCard(a, actionsByAutomation[a.id] || []);
                  const actions = actionsByAutomation[a.id] || [];
                  return (
                    <div
                      key={a.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] hover:border-[hsl(var(--avivar-primary)/0.5)] cursor-pointer transition-all ${!a.is_active ? 'opacity-50' : ''}`}
                      onClick={() => handleEditAutomation(a)}
                    >
                      <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center flex-shrink-0`}>
                        <card.icon className="h-4.5 w-4.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[hsl(var(--avivar-foreground))] truncate">{a.name}</p>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">{card.label} · {getTriggerLabel(a.trigger_type)}</p>
                      </div>
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <Switch checked={a.is_active} onCheckedChange={(v) => toggleAutomation.mutate({ id: a.id, is_active: v })} className="scale-75" />
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => deleteAutomation.mutate(a.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {activeTab === 'history' && <HistoryView />}
      </div>

      {/* Trigger Config Dialog */}
      <TriggerConfigDialog
        open={configDialog.open}
        onOpenChange={(open) => setConfigDialog(prev => ({ ...prev, open }))}
        triggerCard={configDialog.triggerCard}
        automation={configDialog.automation}
        columnId={configDialog.columnId}
        columns={columns}
        kanbanId={kanbanId || ''}
        actionsByAutomation={actionsByAutomation}
        onSave={(data) => {
          if (configDialog.automation) {
            updateAutomation.mutate({ id: configDialog.automation.id, ...data });
          } else {
            createAutomation.mutate(data as any);
          }
          setConfigDialog(prev => ({ ...prev, open: false }));
        }}
      />
    </div>
  );
}

// =============================================
// Pipeline View - Kommo-style horizontal stages
// =============================================
function PipelineView({
  columns,
  automationsByColumn,
  actionsByAutomation,
  triggerPickerColumn,
  onOpenTriggerPicker,
  onSelectTrigger,
  onEditAutomation,
  onToggle,
  onDelete,
}: {
  columns: KanbanColumnData[];
  automationsByColumn: Record<string, AvivarAutomation[]>;
  actionsByAutomation: Record<string, AvivarAutomationAction[]>;
  triggerPickerColumn: string | null;
  onOpenTriggerPicker: (columnId: string | null) => void;
  onSelectTrigger: (columnId: string, card: typeof TRIGGER_CARDS[0]) => void;
  onEditAutomation: (a: AvivarAutomation) => void;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="p-4">
      <ScrollArea className="w-full">
        <div className="flex gap-0 min-w-max pb-4">
          {columns.map((col, idx) => {
            const colAutomations = automationsByColumn[col.id] || [];
            const isPickerOpen = triggerPickerColumn === col.id;

            return (
              <div key={col.id} className="flex flex-col items-stretch" style={{ minWidth: 220, maxWidth: 260 }}>
                {/* Stage Header - Kommo style colored bar */}
                <div
                  className="relative px-3 py-2.5 flex items-center justify-between"
                  style={{
                    backgroundColor: col.color || '#8b5cf6',
                    borderRadius: idx === 0 ? '8px 0 0 0' : idx === columns.length - 1 ? '0 8px 0 0' : '0',
                  }}
                >
                  <span className="font-semibold text-sm text-white truncate">{col.name}</span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-white/20 text-white border-0 ml-1.5"
                  >
                    {colAutomations.length}
                  </Badge>
                  {/* Arrow connector */}
                  {idx < columns.length - 1 && (
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                      <ChevronRight className="h-4 w-4 text-white/70" />
                    </div>
                  )}
                </div>

                {/* Automation Cards */}
                <div className="border-x border-b border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] flex-1 p-2 space-y-1.5"
                  style={{
                    borderRadius: idx === 0 ? '0 0 0 8px' : idx === columns.length - 1 ? '0 0 8px 0' : '0',
                  }}
                >
                  {colAutomations.map(a => {
                    const card = getTriggerCard(a, actionsByAutomation[a.id] || []);
                    const actions = actionsByAutomation[a.id] || [];
                    const messageAction = actions.find(act => act.action_type === 'send_message');
                    const messagePreview = messageAction?.action_config?.message as string | undefined;

                    return (
                      <div
                        key={a.id}
                        className={`group relative rounded-lg border ${card.borderColor} ${card.bgLight} p-2 cursor-pointer transition-all hover:shadow-md ${!a.is_active ? 'opacity-40' : ''}`}
                        onClick={() => onEditAutomation(a)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-md ${card.color} flex items-center justify-center flex-shrink-0`}>
                            <card.icon className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs text-[hsl(var(--avivar-foreground))] truncate leading-tight">
                              {a.name}
                            </p>
                            <p className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] leading-tight">
                              {card.label}
                            </p>
                          </div>
                          {/* Quick actions on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                            <Switch
                              checked={a.is_active}
                              onCheckedChange={(v) => onToggle(a.id, v)}
                              className="scale-[0.6]"
                            />
                            <Button variant="ghost" size="icon" className="h-5 w-5 text-red-400 hover:text-red-500" onClick={() => onDelete(a.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {/* Message preview */}
                        {messagePreview && (
                          <p className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] mt-1 line-clamp-2 pl-9 italic">
                            "{messagePreview}"
                          </p>
                        )}
                        {/* Delay indicator */}
                        {a.delay_seconds > 0 && (
                          <div className="flex items-center gap-0.5 pl-9 mt-0.5">
                            <Clock className="h-2.5 w-2.5 text-[hsl(var(--avivar-muted-foreground))]" />
                            <span className="text-[9px] text-[hsl(var(--avivar-muted-foreground))]">
                              {a.delay_seconds >= 3600
                                ? `${Math.floor(a.delay_seconds / 3600)}h`
                                : a.delay_seconds >= 60
                                ? `${Math.floor(a.delay_seconds / 60)}min`
                                : `${a.delay_seconds}s`}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Trigger Picker (Kommo-style grid) */}
                  {isPickerOpen ? (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between px-1">
                        <p className="text-[10px] font-semibold text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wider">
                          Selecione o gatilho
                        </p>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onOpenTriggerPicker(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {TRIGGER_CARDS.map(card => (
                          <button
                            key={card.id}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg border ${card.borderColor} ${card.bgLight} hover:shadow-md transition-all text-center cursor-pointer`}
                            onClick={() => onSelectTrigger(col.id, card)}
                          >
                            <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center`}>
                              <card.icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-[10px] font-medium text-[hsl(var(--avivar-foreground))] leading-tight">
                              {card.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button
                      className="w-full flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-primary))] hover:border-[hsl(var(--avivar-primary))] transition-colors text-xs"
                      onClick={() => onOpenTriggerPicker(col.id)}
                    >
                      <Plus className="h-3 w-3" /> Automação
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// =============================================
// Trigger Config Dialog
// =============================================
function TriggerConfigDialog({
  open,
  onOpenChange,
  triggerCard,
  automation,
  columnId,
  columns,
  kanbanId,
  actionsByAutomation,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerCard: typeof TRIGGER_CARDS[0] | null;
  automation: AvivarAutomation | null;
  columnId: string;
  columns: KanbanColumnData[];
  kanbanId: string;
  actionsByAutomation: Record<string, AvivarAutomationAction[]>;
  onSave: (data: any) => void;
}) {
  const isEditing = !!automation;
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(0);
  const [executeOnce, setExecuteOnce] = useState(false);
  const [actionConfig, setActionConfig] = useState<Record<string, any>>({});

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      if (automation) {
        setName(automation.name);
        setTriggerType(automation.trigger_type);
        setDelaySeconds(automation.delay_seconds);
        setExecuteOnce(automation.execute_once_per_lead);
        const existingActions = actionsByAutomation[automation.id] || [];
        setActionConfig(existingActions[0]?.action_config || {});
      } else if (triggerCard) {
        setName(triggerCard.label);
        setTriggerType(triggerCard.triggerType);
        setDelaySeconds(0);
        setExecuteOnce(false);
        setActionConfig({});
      }
    }
    onOpenChange(isOpen);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Preencha o nome');
      return;
    }
    const defaultAction = triggerCard?.defaultAction || 'send_message';
    onSave({
      name,
      trigger_type: triggerType,
      kanban_id: kanbanId,
      column_id: columnId,
      is_global: false,
      delay_seconds: delaySeconds,
      execute_once_per_lead: executeOnce,
      actions: [{
        action_type: defaultAction,
        action_config: actionConfig,
        order_index: 0,
        delay_seconds: 0,
      }],
    });
  };

  if (!triggerCard) return null;

  const columnName = columns.find(c => c.id === columnId)?.name || '';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${triggerCard.color} flex items-center justify-center`}>
              <triggerCard.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {isEditing ? 'Editar' : 'Configurar'} {triggerCard.label}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Etapa: {columnName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 pb-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs">Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da automação" className="text-sm" />
            </div>

            {/* Trigger */}
            <div className="space-y-1.5">
              <Label className="text-xs">Quando executar</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_CATEGORIES.map(cat => (
                    <SelectGroup key={cat.category}>
                      <SelectLabel>{cat.category}</SelectLabel>
                      {cat.triggers.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delay */}
            <div className="space-y-1.5">
              <Label className="text-xs">Atraso (segundos)</Label>
              <Input
                type="number" min={0} value={delaySeconds}
                onChange={(e) => setDelaySeconds(parseInt(e.target.value) || 0)}
                className="text-sm"
              />
            </div>

            {/* Execute once */}
            <div className="flex items-center gap-2">
              <Switch checked={executeOnce} onCheckedChange={setExecuteOnce} className="scale-90" />
              <span className="text-xs text-[hsl(var(--avivar-foreground))]">Executar apenas uma vez por lead</span>
            </div>

            {/* Action-specific configuration */}
            <div className="border-t border-[hsl(var(--avivar-border))] pt-4">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--avivar-muted-foreground))]">
                Configuração da Ação
              </Label>

              {triggerCard.defaultAction === 'send_message' && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    value={actionConfig.message || ''}
                    onChange={(e) => setActionConfig(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Digite a mensagem que será enviada ao lead...&#10;&#10;Use variáveis: {{nome}}, {{primeiro_nome}}, {{procedimento}}"
                    rows={4}
                    className="text-sm"
                  />
                  <p className="text-[10px] text-[hsl(var(--avivar-muted-foreground))]">
                    Variáveis disponíveis: {'{{nome}}'}, {'{{primeiro_nome}}'}, {'{{procedimento}}'}, {'{{empresa}}'}
                  </p>
                </div>
              )}

              {triggerCard.defaultAction === 'trigger_chatbot' && (
                <div className="mt-3">
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    O Salesbot configurado no agente IA será ativado automaticamente quando o gatilho disparar.
                  </p>
                </div>
              )}

              {triggerCard.defaultAction === 'change_stage' && (
                <div className="mt-3">
                  <Label className="text-xs">Mover para etapa</Label>
                  <Select
                    value={actionConfig.target_column_id || ''}
                    onValueChange={(v) => setActionConfig(prev => ({ ...prev, target_column_id: v }))}
                  >
                    <SelectTrigger className="mt-1 text-sm">
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
              )}

              {triggerCard.defaultAction === 'create_task' && (
                <div className="mt-3 space-y-2">
                  <Input
                    value={actionConfig.title || ''}
                    onChange={(e) => setActionConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título da tarefa..."
                    className="text-sm"
                  />
                  <Textarea
                    value={actionConfig.description || ''}
                    onChange={(e) => setActionConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição..."
                    rows={2}
                    className="text-sm"
                  />
                </div>
              )}

              {(triggerCard.defaultAction === 'add_tag' || triggerCard.defaultAction === 'remove_tag') && (
                <div className="mt-3">
                  <Input
                    value={actionConfig.tag || ''}
                    onChange={(e) => setActionConfig(prev => ({ ...prev, tag: e.target.value }))}
                    placeholder="Nome da tag..."
                    className="text-sm"
                  />
                </div>
              )}

              {triggerCard.defaultAction === 'create_note' && (
                <div className="mt-3">
                  <Textarea
                    value={actionConfig.content || ''}
                    onChange={(e) => setActionConfig(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Conteúdo da nota..."
                    rows={3}
                    className="text-sm"
                  />
                </div>
              )}

              {triggerCard.defaultAction === 'dispatch_webhook' && (
                <div className="mt-3 space-y-2">
                  <Input
                    value={actionConfig.url || ''}
                    onChange={(e) => setActionConfig(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    className="text-sm"
                  />
                  <Select
                    value={actionConfig.method || 'POST'}
                    onValueChange={(v) => setActionConfig(prev => ({ ...prev, method: v }))}
                  >
                    <SelectTrigger className="text-sm">
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

              {triggerCard.defaultAction === 'change_field' && (
                <div className="mt-3 space-y-2">
                  <Input
                    value={actionConfig.field_name || ''}
                    onChange={(e) => setActionConfig(prev => ({ ...prev, field_name: e.target.value }))}
                    placeholder="Nome do campo..."
                    className="text-sm"
                  />
                  <Input
                    value={actionConfig.field_value || ''}
                    onChange={(e) => setActionConfig(prev => ({ ...prev, field_value: e.target.value }))}
                    placeholder="Novo valor..."
                    className="text-sm"
                  />
                </div>
              )}

              {(triggerCard.defaultAction === 'create_lead' || triggerCard.defaultAction === 'create_contact' || triggerCard.defaultAction === 'change_responsible' || triggerCard.defaultAction === 'execute_integration') && (
                <div className="mt-3">
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    A configuração detalhada será aplicada automaticamente quando o gatilho disparar.
                  </p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            size="sm"
            onClick={handleSave}
            className={`${triggerCard.color} hover:opacity-90 text-white`}
          >
            {isEditing ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <div className="p-4 space-y-4">
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
                  <span className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">{e.trigger_event}</span>
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
