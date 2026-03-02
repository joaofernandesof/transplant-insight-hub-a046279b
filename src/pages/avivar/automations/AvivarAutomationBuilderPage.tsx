/**
 * AvivarAutomationBuilderPage - ClickUp-style Automation Builder
 * QUANDO [gatilho] + [condições] → ENTÃO [múltiplas ações]
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Zap, Trash2, ArrowRight, Save, Search, Power, PowerOff,
  MessageSquare, ListTodo, StickyNote, Hash, Pencil, Webhook,
  UserCheck, Bot, Tag, Contact, Plug, ChevronDown, ChevronUp,
  Filter, Clock, ArrowLeft, Copy, MoreHorizontal, Play,
  AlertCircle, CheckCircle2, XCircle, GripVertical, History, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  useAvivarAutomations,
  useAvivarAutomationExecutions,
  TRIGGER_CATEGORIES,
  ACTION_TYPES,
  CONDITION_FIELDS,
  CONDITION_OPERATORS,
  type AvivarAutomation,
} from '@/hooks/useAvivarAutomations';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import { cn } from '@/lib/utils';

/* ─── Action Icon Map ─── */
const ACTION_ICON_MAP: Record<string, React.ElementType> = {
  change_stage: ArrowRight,
  change_responsible: UserCheck,
  create_task: ListTodo,
  send_message: MessageSquare,
  trigger_chatbot: Bot,
  add_tag: Tag,
  remove_tag: XCircle,
  change_field: Pencil,
  create_note: StickyNote,
  dispatch_webhook: Webhook,
  execute_integration: Plug,
  create_lead: Contact,
  create_contact: Contact,
};

const getActionIcon = (type: string) => ACTION_ICON_MAP[type] || Zap;
const getActionLabel = (type: string) => ACTION_TYPES.find(a => a.value === type)?.label || type;

/* ─── Types ─── */
interface AutomationCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface AutomationAction {
  id: string;
  action_type: string;
  action_config: Record<string, any>;
  delay_seconds: number;
}

interface AutomationDraft {
  id?: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  is_active: boolean;
  kanban_id?: string;
  execute_once_per_lead: boolean;
}

const emptyDraft = (): AutomationDraft => ({
  name: '',
  description: '',
  trigger_type: '',
  trigger_config: {},
  conditions: [],
  actions: [],
  is_active: true,
  execute_once_per_lead: false,
});

/* ═════════════════════════════════════════════ */
/*  MAIN PAGE                                    */
/* ═════════════════════════════════════════════ */
export default function AvivarAutomationBuilderPage() {
  const navigate = useNavigate();
  const { accountId } = useAvivarAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<AutomationDraft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'history'>('list');

  const {
    automations, actionsByAutomation, isLoading,
    createAutomation, updateAutomation, deleteAutomation, toggleAutomation,
  } = useAvivarAutomations(); // no kanbanId = all automations

  // Fetch kanbans for selection
  const { data: kanbans = [] } = useQuery({
    queryKey: ['avivar-kanbans-all', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const { data } = await supabase
        .from('avivar_kanbans').select('id, name').eq('account_id', accountId).eq('is_active', true);
      return data || [];
    },
    enabled: !!accountId,
  });

  const { data: allColumns = [] } = useQuery({
    queryKey: ['avivar-columns-all', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const { data } = await supabase
        .from('avivar_kanban_columns').select('id, name, kanban_id, color').eq('account_id', accountId)
        .order('order_index');
      return data || [];
    },
    enabled: !!accountId,
  });

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return automations;
    const q = searchQuery.toLowerCase();
    return automations.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.trigger_type.toLowerCase().includes(q)
    );
  }, [automations, searchQuery]);

  const openNew = () => {
    setDraft(emptyDraft());
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (auto: AvivarAutomation) => {
    const actions = actionsByAutomation[auto.id] || [];
    const conditions = auto.conditions && 'groups' in (auto.conditions as any)
      ? ((auto.conditions as any).groups || []).map((c: any, i: number) => ({
          id: `cond-${i}`, field: c.field || '', operator: c.operator || 'equals', value: c.value || '',
        }))
      : [];

    setDraft({
      id: auto.id,
      name: auto.name,
      description: auto.description || '',
      trigger_type: auto.trigger_type,
      trigger_config: auto.trigger_config || {},
      conditions,
      actions: actions.map(a => ({
        id: a.id, action_type: a.action_type,
        action_config: a.action_config || {},
        delay_seconds: a.delay_seconds || 0,
      })),
      is_active: auto.is_active,
      kanban_id: auto.kanban_id || undefined,
      execute_once_per_lead: auto.execute_once_per_lead,
    });
    setEditingId(auto.id);
    setDialogOpen(true);
  };

  const handleDuplicate = (auto: AvivarAutomation) => {
    const actions = actionsByAutomation[auto.id] || [];
    setDraft({
      name: `${auto.name} (cópia)`,
      description: auto.description || '',
      trigger_type: auto.trigger_type,
      trigger_config: auto.trigger_config || {},
      conditions: [],
      actions: actions.map(a => ({
        id: `new-${Date.now()}-${Math.random()}`,
        action_type: a.action_type,
        action_config: a.action_config || {},
        delay_seconds: a.delay_seconds || 0,
      })),
      is_active: false,
      kanban_id: auto.kanban_id || undefined,
      execute_once_per_lead: auto.execute_once_per_lead,
    });
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) { toast.error('Dê um nome à automação'); return; }
    if (!draft.trigger_type) { toast.error('Selecione um gatilho'); return; }
    if (draft.actions.length === 0) { toast.error('Adicione pelo menos uma ação'); return; }

    const conditionsPayload = draft.conditions.length > 0
      ? { logic: 'AND' as const, groups: draft.conditions.map(c => ({ field: c.field, operator: c.operator, value: c.value })) }
      : {};

    const payload = {
      name: draft.name,
      description: draft.description || undefined,
      trigger_type: draft.trigger_type,
      trigger_config: draft.trigger_config,
      conditions: conditionsPayload as any,
      kanban_id: draft.kanban_id,
      is_active: draft.is_active,
      execute_once_per_lead: draft.execute_once_per_lead,
      actions: draft.actions.map((a, i) => ({
        action_type: a.action_type,
        action_config: a.action_config,
        order_index: i,
        delay_seconds: a.delay_seconds,
      })),
    };

    try {
      if (editingId) {
        await updateAutomation.mutateAsync({ id: editingId, ...payload });
      } else {
        await createAutomation.mutateAsync(payload as any);
      }
      setDialogOpen(false);
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta automação?')) return;
    await deleteAutomation.mutateAsync(id);
  };

  const getTriggerLabel = (type: string) => {
    for (const cat of TRIGGER_CATEGORIES) {
      const found = cat.triggers.find(t => t.value === type);
      if (found) return found.label;
    }
    return type;
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--avivar-background))]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[hsl(var(--avivar-background))] border-b border-[hsl(var(--avivar-border))]">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/avivar')}
              className="h-9 w-9 rounded-xl hover:bg-[hsl(var(--avivar-primary)/0.08)]">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-[hsl(var(--avivar-foreground))] leading-tight">
                  Automações
                </h1>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                  Quando acontecer X, faça Y
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/avivar/variaveis')}
              className="gap-1.5 rounded-xl h-9 px-3">
              <Hash className="h-3.5 w-3.5" /> Variáveis
            </Button>
            <Badge variant="secondary" className="text-xs px-2.5 py-1">
              {automations.length} automação{automations.length !== 1 ? 'ões' : ''}
            </Badge>
            <Button onClick={openNew} size="sm"
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white gap-1.5 rounded-xl shadow-lg shadow-violet-600/20 h-9 px-4">
              <Plus className="h-3.5 w-3.5" /> Nova Automação
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
            <Input placeholder="Buscar automações..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-xl bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]" />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 pb-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'history')}>
            <TabsList className="bg-[hsl(var(--avivar-card))] h-9 p-0.5 rounded-lg">
              <TabsTrigger value="list" className="text-xs rounded-md h-8 px-3">Automações</TabsTrigger>
              <TabsTrigger value="history" className="text-xs rounded-md h-8 px-3">
                <History className="h-3.5 w-3.5 mr-1.5" /> Histórico
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'list' ? (
        <ScrollArea className="flex-1">
          <div className="p-5 space-y-3">
            {isLoading ? (
              <div className="text-center py-20 text-[hsl(var(--avivar-muted-foreground))]">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <Zap className="h-12 w-12 mx-auto text-[hsl(var(--avivar-muted-foreground))] opacity-30 mb-4" />
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Nenhuma automação encontrada</p>
                <Button onClick={openNew} variant="outline" size="sm" className="mt-4 rounded-xl">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Criar primeira automação
                </Button>
              </div>
            ) : (
              filtered.map(auto => (
                <AutomationListCard
                  key={auto.id}
                  automation={auto}
                  actions={actionsByAutomation[auto.id] || []}
                  kanbans={kanbans}
                  getTriggerLabel={getTriggerLabel}
                  onEdit={() => openEdit(auto)}
                  onDuplicate={() => handleDuplicate(auto)}
                  onDelete={() => handleDelete(auto.id)}
                  onToggle={(active) => toggleAutomation.mutate({ id: auto.id, is_active: active })}
                />
              ))
            )}
          </div>
        </ScrollArea>
      ) : (
        <ScrollArea className="flex-1">
          <BuilderHistoryView />
        </ScrollArea>
      )}

      {/* Builder Dialog */}
      <AutomationBuilderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        draft={draft}
        setDraft={setDraft}
        onSave={handleSave}
        isEditing={!!editingId}
        isSaving={createAutomation.isPending || updateAutomation.isPending}
        kanbans={kanbans}
        allColumns={allColumns}
      />
    </div>
  );
}

/* ═════════════════════════════════════════════ */
/*  AUTOMATION LIST CARD                         */
/* ═════════════════════════════════════════════ */
function AutomationListCard({
  automation: auto, actions, kanbans, getTriggerLabel,
  onEdit, onDuplicate, onDelete, onToggle,
}: {
  automation: AvivarAutomation;
  actions: any[];
  kanbans: { id: string; name: string }[];
  getTriggerLabel: (t: string) => string;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggle: (active: boolean) => void;
}) {
  const kanbanName = kanbans.find(k => k.id === auto.kanban_id)?.name;

  return (
    <div
      className={cn(
        'group rounded-2xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] p-4 cursor-pointer transition-all hover:shadow-lg hover:border-[hsl(var(--avivar-primary)/0.3)]',
        !auto.is_active && 'opacity-50'
      )}
      onClick={onEdit}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
          <Zap className="h-4.5 w-4.5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm text-[hsl(var(--avivar-foreground))] truncate">{auto.name}</h3>
            {kanbanName && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                {kanbanName}
              </Badge>
            )}
          </div>

          {/* Trigger → Actions flow */}
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] px-2 py-0.5">
              Quando: {getTriggerLabel(auto.trigger_type)}
            </Badge>
            <ArrowRight className="h-3 w-3 text-[hsl(var(--avivar-muted-foreground))]" />
            {actions.slice(0, 3).map((act, i) => {
              const Icon = getActionIcon(act.action_type);
              return (
                <Badge key={i} variant="outline" className="text-[10px] px-2 py-0.5 gap-1">
                  <Icon className="h-3 w-3" />
                  {getActionLabel(act.action_type)}
                </Badge>
              );
            })}
            {actions.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                +{actions.length - 3}
              </Badge>
            )}
          </div>

          {auto.description && (
            <p className="text-[11px] text-[hsl(var(--avivar-muted-foreground))] mt-1.5 line-clamp-1">{auto.description}</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <Switch checked={auto.is_active} onCheckedChange={onToggle} className="scale-[0.8]" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}><Pencil className="h-3.5 w-3.5 mr-2" /> Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}><Copy className="h-3.5 w-3.5 mr-2" /> Duplicar</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-500">
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════ */
/*  BUILDER DIALOG                               */
/* ═════════════════════════════════════════════ */
function AutomationBuilderDialog({
  open, onOpenChange, draft, setDraft, onSave, isEditing, isSaving,
  kanbans, allColumns,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: AutomationDraft;
  setDraft: React.Dispatch<React.SetStateAction<AutomationDraft>>;
  onSave: () => void;
  isEditing: boolean;
  isSaving: boolean;
  kanbans: { id: string; name: string }[];
  allColumns: { id: string; name: string; kanban_id: string; color: string | null }[];
}) {
  const columnsForKanban = draft.kanban_id
    ? allColumns.filter(c => c.kanban_id === draft.kanban_id)
    : allColumns;

  const addCondition = () => {
    setDraft(prev => ({
      ...prev,
      conditions: [...prev.conditions, { id: `cond-${Date.now()}`, field: '', operator: 'equals', value: '' }],
    }));
  };

  const updateCondition = (id: string, updates: Partial<AutomationCondition>) => {
    setDraft(prev => ({
      ...prev,
      conditions: prev.conditions.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  };

  const removeCondition = (id: string) => {
    setDraft(prev => ({ ...prev, conditions: prev.conditions.filter(c => c.id !== id) }));
  };

  const addAction = () => {
    setDraft(prev => ({
      ...prev,
      actions: [...prev.actions, { id: `act-${Date.now()}`, action_type: '', action_config: {}, delay_seconds: 0 }],
    }));
  };

  const updateAction = (id: string, updates: Partial<AutomationAction>) => {
    setDraft(prev => ({
      ...prev,
      actions: prev.actions.map(a => a.id === id ? { ...a, ...updates } : a),
    }));
  };

  const removeAction = (id: string) => {
    setDraft(prev => ({ ...prev, actions: prev.actions.filter(a => a.id !== id) }));
  };

  // Summary bar text
  const triggerLabel = (() => {
    for (const cat of TRIGGER_CATEGORIES) {
      const found = cat.triggers.find(t => t.value === draft.trigger_type);
      if (found) return found.label;
    }
    return null;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[hsl(var(--avivar-border))] bg-gradient-to-r from-violet-500/5 to-purple-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Dê um nome a essa regra de automação..."
                value={draft.name}
                onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
                className="border-0 bg-transparent text-base font-semibold p-0 h-auto focus-visible:ring-0 placeholder:text-[hsl(var(--avivar-muted-foreground))]"
              />
              <Input
                placeholder="Descrição (opcional)"
                value={draft.description}
                onChange={e => setDraft(prev => ({ ...prev, description: e.target.value }))}
                className="border-0 bg-transparent text-xs p-0 h-auto mt-0.5 focus-visible:ring-0 text-[hsl(var(--avivar-muted-foreground))]"
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6">
            {/* ClickUp-style two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT: Acionar (Trigger + Conditions) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-[hsl(var(--avivar-foreground))]">Acionar</h3>
                </div>

                {/* Trigger Selection */}
                <div className="rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] p-4 space-y-3">
                  <Label className="text-xs font-medium">Gatilho</Label>
                  <Select value={draft.trigger_type} onValueChange={v => setDraft(prev => ({ ...prev, trigger_type: v, trigger_config: {} }))}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione um gatilho..." />
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

                  {/* Trigger Config Fields */}
                  <TriggerConfigFields
                    triggerType={draft.trigger_type}
                    config={draft.trigger_config}
                    onChange={cfg => setDraft(prev => ({ ...prev, trigger_config: cfg }))}
                    kanbans={kanbans}
                    columns={columnsForKanban}
                  />

                  {/* Kanban scope */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Funil (opcional)</Label>
                    <Select
                      value={draft.kanban_id || '__all__'}
                      onValueChange={v => setDraft(prev => ({ ...prev, kanban_id: v === '__all__' ? undefined : v }))}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Todos os funis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todos os funis</SelectItem>
                        {kanbans.map(k => (
                          <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Conditions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5 text-[hsl(var(--avivar-muted-foreground))]" />
                      <span className="text-xs font-medium text-[hsl(var(--avivar-foreground))]">Condições</span>
                    </div>
                  </div>

                  {draft.conditions.map((cond, idx) => (
                    <div key={cond.id} className="rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px]">
                          {idx === 0 ? 'Se' : 'E'}
                        </Badge>
                        <button onClick={() => removeCondition(cond.id)}
                          className="p-1 rounded-md hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Select value={cond.field} onValueChange={v => updateCondition(cond.id, { field: v })}>
                          <SelectTrigger className="rounded-lg text-xs h-8">
                            <SelectValue placeholder="Campo" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONDITION_FIELDS.map(f => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={cond.operator} onValueChange={v => updateCondition(cond.id, { operator: v })}>
                          <SelectTrigger className="rounded-lg text-xs h-8">
                            <SelectValue placeholder="Operador" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONDITION_OPERATORS.map(o => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Valor"
                          value={cond.value}
                          onChange={e => updateCondition(cond.id, { value: e.target.value })}
                          className="rounded-lg text-xs h-8"
                        />
                      </div>
                    </div>
                  ))}

                  <button onClick={addCondition}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-primary))] hover:border-[hsl(var(--avivar-primary))] transition-all text-xs font-medium">
                    <Plus className="h-3 w-3" /> Adicionar condição
                  </button>
                </div>

                {/* Options */}
                <div className="rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] p-4 space-y-3">
                  <Label className="text-xs font-medium">Opções</Label>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Executar apenas uma vez por lead</span>
                    <Switch checked={draft.execute_once_per_lead}
                      onCheckedChange={v => setDraft(prev => ({ ...prev, execute_once_per_lead: v }))} className="scale-[0.8]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Automação ativa</span>
                    <Switch checked={draft.is_active}
                      onCheckedChange={v => setDraft(prev => ({ ...prev, is_active: v }))} className="scale-[0.8]" />
                  </div>
                </div>
              </div>

              {/* RIGHT: Ação (Actions) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <Play className="h-3.5 w-3.5 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-[hsl(var(--avivar-foreground))]">Ação</h3>
                </div>

                {draft.actions.map((act, idx) => {
                  const Icon = getActionIcon(act.action_type);
                  return (
                    <div key={act.id} className="rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-3.5 w-3.5 text-[hsl(var(--avivar-muted-foreground))] cursor-grab" />
                          <Badge variant="outline" className="text-[10px]">
                            Ação {idx + 1}
                          </Badge>
                        </div>
                        <button onClick={() => removeAction(act.id)}
                          className="p-1 rounded-md hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Action Type */}
                      <Select value={act.action_type} onValueChange={v => updateAction(act.id, { action_type: v, action_config: {} })}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Selecione uma ação..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTION_TYPES.map(a => (
                            <SelectItem key={a.value} value={a.value}>
                              {a.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Action Config (contextual) */}
                      <ActionConfigFields
                        actionType={act.action_type}
                        config={act.action_config}
                        onChange={cfg => updateAction(act.id, { action_config: cfg })}
                        columns={columnsForKanban}
                      />

                      {/* Delay */}
                      {idx > 0 && (
                        <div className="space-y-1">
                          <Label className="text-[10px] text-[hsl(var(--avivar-muted-foreground))]">Atraso antes desta ação</Label>
                          <Select
                            value={String(act.delay_seconds)}
                            onValueChange={v => updateAction(act.id, { delay_seconds: Number(v) })}
                          >
                            <SelectTrigger className="rounded-lg text-xs h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Imediato</SelectItem>
                              <SelectItem value="300">5 minutos</SelectItem>
                              <SelectItem value="900">15 minutos</SelectItem>
                              <SelectItem value="1800">30 minutos</SelectItem>
                              <SelectItem value="3600">1 hora</SelectItem>
                              <SelectItem value="86400">24 horas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  );
                })}

                <button onClick={addAction}
                  className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 border-dashed border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] hover:text-emerald-500 hover:border-emerald-500 transition-all text-xs font-medium">
                  <Plus className="h-3.5 w-3.5" /> Adicionar ação
                </button>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer summary bar */}
        <div className="px-6 py-3 border-t border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--avivar-muted-foreground))] flex-wrap">
              <span>Quando</span>
              {triggerLabel ? (
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px]">
                  {triggerLabel}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">...</Badge>
              )}
              {draft.conditions.length > 0 && (
                <>
                  <span>e</span>
                  <Badge variant="outline" className="text-[10px]">
                    {draft.conditions.length} condição{draft.conditions.length > 1 ? 'ões' : ''}
                  </Badge>
                </>
              )}
              <span>então</span>
              {draft.actions.filter(a => a.action_type).map((a, i) => (
                <Badge key={i} variant="outline" className="text-[10px] gap-1">
                  {getActionLabel(a.action_type)}
                </Badge>
              ))}
              {draft.actions.length === 0 && <Badge variant="outline" className="text-[10px]">...</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button onClick={onSave} disabled={isSaving} size="sm"
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl shadow-lg shadow-violet-600/20">
                {isSaving ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═════════════════════════════════════════════ */
/*  ACTION CONFIG FIELDS                         */
/* ═════════════════════════════════════════════ */
function ActionConfigFields({
  actionType, config, onChange, columns,
}: {
  actionType: string;
  config: Record<string, any>;
  onChange: (cfg: Record<string, any>) => void;
  columns: { id: string; name: string; color: string | null }[];
}) {
  if (!actionType) return null;

  const set = (key: string, value: any) => onChange({ ...config, [key]: value });

  const variableButtons = ['{{nome}}', '{{primeiro_nome}}', '{{telefone}}', '{{email}}', '{{procedimento}}', '{{funil}}', '{{etapa}}', '{{empresa}}', '{{profissional}}', '{{data_consulta}}', '{{horario_consulta}}', '{{utm_source}}', '{{link_agendamento}}'];
  const insertVar = (field: string, v: string) => set(field, (config[field] || '') + ' ' + v);

  switch (actionType) {
    case 'send_message':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Mensagem</Label>
          <Textarea
            placeholder="Digite a mensagem... Use {{nome}}, {{procedimento}} para variáveis"
            value={config.message || ''}
            onChange={e => set('message', e.target.value)}
            className="rounded-xl text-xs min-h-[80px] resize-none"
          />
          <div className="flex flex-wrap gap-1">
            {variableButtons.map(v => (
              <button key={v} onClick={() => insertVar('message', v)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors">
                {v}
              </button>
            ))}
          </div>
          <Label className="text-xs">Canal</Label>
          <Select value={config.channel || 'whatsapp'} onValueChange={v => set('channel', v)}>
            <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );

    case 'change_stage':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Mover para etapa</Label>
          <Select value={config.target_column_id || ''} onValueChange={v => set('target_column_id', v)}>
            <SelectTrigger className="rounded-xl text-xs"><SelectValue placeholder="Selecionar etapa..." /></SelectTrigger>
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
      );

    case 'change_responsible':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Modo de atribuição</Label>
          <Select value={config.assignment_mode || 'specific'} onValueChange={v => set('assignment_mode', v)}>
            <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="specific">Responsável específico</SelectItem>
              <SelectItem value="round_robin">Rodízio automático</SelectItem>
              <SelectItem value="least_busy">Menos ocupado</SelectItem>
              <SelectItem value="remove">Remover responsável</SelectItem>
            </SelectContent>
          </Select>
          {config.assignment_mode === 'specific' && (
            <>
              <Label className="text-xs">ID do responsável</Label>
              <Input placeholder="ID do membro..." value={config.responsible_id || ''} onChange={e => set('responsible_id', e.target.value)}
                className="rounded-xl text-xs" />
            </>
          )}
        </div>
      );

    case 'create_task':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Nome da tarefa</Label>
          <Input placeholder="Nome da tarefa..." value={config.task_name || ''} onChange={e => set('task_name', e.target.value)}
            className="rounded-xl text-xs" />
          <Label className="text-xs">Descrição</Label>
          <Textarea placeholder="Descrição..." value={config.task_description || ''} onChange={e => set('task_description', e.target.value)}
            className="rounded-xl text-xs min-h-[60px] resize-none" />
          <Label className="text-xs">Prazo (dias)</Label>
          <Input type="number" placeholder="7" value={config.due_days || ''} onChange={e => set('due_days', e.target.value)}
            className="rounded-xl text-xs" />
        </div>
      );

    case 'add_tag':
    case 'remove_tag':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Tag</Label>
          <Input placeholder="Nome da tag..." value={config.tag || ''} onChange={e => set('tag', e.target.value)}
            className="rounded-xl text-xs" />
        </div>
      );

    case 'create_note':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Conteúdo da nota</Label>
          <Textarea placeholder="Nota... Use {{nome}} para variáveis" value={config.note_content || ''} onChange={e => set('note_content', e.target.value)}
            className="rounded-xl text-xs min-h-[60px] resize-none" />
          <div className="flex flex-wrap gap-1">
            {variableButtons.map(v => (
              <button key={v} onClick={() => insertVar('note_content', v)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors">
                {v}
              </button>
            ))}
          </div>
        </div>
      );

    case 'change_field':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Campo</Label>
          <Select value={config.field_name || ''} onValueChange={v => set('field_name', v)}>
            <SelectTrigger className="rounded-xl text-xs"><SelectValue placeholder="Selecionar campo..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Telefone</SelectItem>
              <SelectItem value="source">Origem</SelectItem>
              <SelectItem value="notes">Notas</SelectItem>
              <SelectItem value="custom_field">Campo personalizado</SelectItem>
            </SelectContent>
          </Select>
          {config.field_name === 'custom_field' && (
            <>
              <Label className="text-xs">Chave do campo</Label>
              <Input placeholder="custom_key" value={config.custom_key || ''} onChange={e => set('custom_key', e.target.value)}
                className="rounded-xl text-xs" />
            </>
          )}
          <Label className="text-xs">Novo valor</Label>
          <Input placeholder="Valor..." value={config.field_value || ''} onChange={e => set('field_value', e.target.value)}
            className="rounded-xl text-xs" />
        </div>
      );

    case 'dispatch_webhook':
      return (
        <div className="space-y-2">
          <Label className="text-xs">URL do Webhook</Label>
          <Input placeholder="https://..." value={config.webhook_url || ''} onChange={e => set('webhook_url', e.target.value)}
            className="rounded-xl text-xs" />
          <Label className="text-xs">Método</Label>
          <Select value={config.method || 'POST'} onValueChange={v => set('method', v)}>
            <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
            </SelectContent>
          </Select>
          <Label className="text-xs">Headers (JSON, opcional)</Label>
          <Textarea placeholder='{"Authorization": "Bearer ..."}' value={config.headers || ''} onChange={e => set('headers', e.target.value)}
            className="rounded-xl text-xs min-h-[40px] resize-none font-mono" />
          <Label className="text-xs">Payload (JSON, opcional)</Label>
          <Textarea placeholder='{"lead_id": "{{lead_id}}"}' value={config.payload || ''} onChange={e => set('payload', e.target.value)}
            className="rounded-xl text-xs min-h-[40px] resize-none font-mono" />
        </div>
      );

    case 'trigger_chatbot':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Comportamento</Label>
          <Select value={config.bot_action || 'activate'} onValueChange={v => set('bot_action', v)}>
            <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="activate">Ativar IA para a conversa</SelectItem>
              <SelectItem value="deactivate">Desativar IA para a conversa</SelectItem>
              <SelectItem value="send_prompt">Enviar prompt específico</SelectItem>
            </SelectContent>
          </Select>
          {config.bot_action === 'send_prompt' && (
            <>
              <Label className="text-xs">Prompt / mensagem inicial</Label>
              <Textarea placeholder="Instrução para o chatbot..." value={config.initial_message || ''}
                onChange={e => set('initial_message', e.target.value)}
                className="rounded-xl text-xs min-h-[60px] resize-none" />
            </>
          )}
        </div>
      );

    case 'create_lead':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Nome do lead</Label>
          <Input placeholder="{{nome}} ou texto fixo" value={config.lead_name || ''} onChange={e => set('lead_name', e.target.value)}
            className="rounded-xl text-xs" />
          <Label className="text-xs">Telefone</Label>
          <Input placeholder="{{telefone}}" value={config.lead_phone || ''} onChange={e => set('lead_phone', e.target.value)}
            className="rounded-xl text-xs" />
          <Label className="text-xs">Mover para etapa</Label>
          <Select value={config.target_column_id || ''} onValueChange={v => set('target_column_id', v)}>
            <SelectTrigger className="rounded-xl text-xs"><SelectValue placeholder="Selecionar etapa..." /></SelectTrigger>
            <SelectContent>
              {columns.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label className="text-xs">Origem</Label>
          <Input placeholder="automação" value={config.source || 'automação'} onChange={e => set('source', e.target.value)}
            className="rounded-xl text-xs" />
        </div>
      );

    case 'create_contact':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Nome</Label>
          <Input placeholder="{{nome}}" value={config.contact_name || ''} onChange={e => set('contact_name', e.target.value)}
            className="rounded-xl text-xs" />
          <Label className="text-xs">Telefone</Label>
          <Input placeholder="{{telefone}}" value={config.contact_phone || ''} onChange={e => set('contact_phone', e.target.value)}
            className="rounded-xl text-xs" />
          <Label className="text-xs">Email</Label>
          <Input placeholder="{{email}}" value={config.contact_email || ''} onChange={e => set('contact_email', e.target.value)}
            className="rounded-xl text-xs" />
          <Label className="text-xs">Tags (separar por vírgula)</Label>
          <Input placeholder="vip, automação" value={config.tags || ''} onChange={e => set('tags', e.target.value)}
            className="rounded-xl text-xs" />
        </div>
      );

    case 'execute_integration':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Integração</Label>
          <Select value={config.integration_type || ''} onValueChange={v => set('integration_type', v)}>
            <SelectTrigger className="rounded-xl text-xs"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="n8n">n8n</SelectItem>
              <SelectItem value="zapier">Zapier</SelectItem>
              <SelectItem value="make">Make (Integromat)</SelectItem>
              <SelectItem value="custom_api">API personalizada</SelectItem>
            </SelectContent>
          </Select>
          <Label className="text-xs">URL do endpoint</Label>
          <Input placeholder="https://..." value={config.endpoint_url || ''} onChange={e => set('endpoint_url', e.target.value)}
            className="rounded-xl text-xs" />
          <Label className="text-xs">Payload (JSON)</Label>
          <Textarea placeholder='{"lead_id": "{{lead_id}}"}' value={config.payload || ''} onChange={e => set('payload', e.target.value)}
            className="rounded-xl text-xs min-h-[40px] resize-none font-mono" />
        </div>
      );

    default:
      return (
        <p className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] italic">
          Configure os detalhes desta ação após selecioná-la.
        </p>
      );
  }
}

/* ═════════════════════════════════════════════ */
/*  TRIGGER CONFIG FIELDS                        */
/* ═════════════════════════════════════════════ */
function TriggerConfigFields({
  triggerType, config, onChange, kanbans, columns,
}: {
  triggerType: string;
  config: Record<string, any>;
  onChange: (cfg: Record<string, any>) => void;
  kanbans: { id: string; name: string }[];
  columns: { id: string; name: string; color: string | null }[];
}) {
  if (!triggerType) return null;

  const set = (key: string, value: any) => onChange({ ...config, [key]: value });

  switch (triggerType) {
    case 'lead.created_in_stage':
    case 'lead.moved_to':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Etapa de destino</Label>
          <Select value={config.target_column_id || ''} onValueChange={v => set('target_column_id', v)}>
            <SelectTrigger className="rounded-xl text-xs"><SelectValue placeholder="Selecionar etapa..." /></SelectTrigger>
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
      );

    case 'lead.moved_from':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Etapa de origem</Label>
          <Select value={config.source_column_id || ''} onValueChange={v => set('source_column_id', v)}>
            <SelectTrigger className="rounded-xl text-xs"><SelectValue placeholder="Selecionar etapa..." /></SelectTrigger>
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
      );

    case 'lead.pipeline_changed':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Pipeline de destino</Label>
          <Select value={config.target_kanban_id || ''} onValueChange={v => set('target_kanban_id', v)}>
            <SelectTrigger className="rounded-xl text-xs"><SelectValue placeholder="Selecionar funil..." /></SelectTrigger>
            <SelectContent>
              {kanbans.map(k => (
                <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'lead.field_changed':
    case 'lead.value_changed':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Campo monitorado</Label>
          <Select value={config.field_name || ''} onValueChange={v => set('field_name', v)}>
            <SelectTrigger className="rounded-xl text-xs"><SelectValue placeholder="Selecionar campo..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Telefone</SelectItem>
              <SelectItem value="source">Origem</SelectItem>
              <SelectItem value="notes">Notas</SelectItem>
              <SelectItem value="tags">Tags</SelectItem>
              <SelectItem value="custom_field">Campo personalizado</SelectItem>
            </SelectContent>
          </Select>
          {config.field_name === 'custom_field' && (
            <>
              <Label className="text-xs">Chave do campo</Label>
              <Input placeholder="custom_key" value={config.custom_key || ''} onChange={e => set('custom_key', e.target.value)}
                className="rounded-xl text-xs" />
            </>
          )}
        </div>
      );

    case 'lead.tag_added':
    case 'lead.tag_removed':
    case 'contact.tag_added':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Tag específica (opcional)</Label>
          <Input placeholder="Deixe vazio para qualquer tag" value={config.tag || ''} onChange={e => set('tag', e.target.value)}
            className="rounded-xl text-xs" />
        </div>
      );

    case 'message.received':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Filtrar por conteúdo (opcional)</Label>
          <Input placeholder="Palavra-chave na mensagem..." value={config.keyword || ''} onChange={e => set('keyword', e.target.value)}
            className="rounded-xl text-xs" />
          <Label className="text-xs">Canal</Label>
          <Select value={config.channel || 'any'} onValueChange={v => set('channel', v)}>
            <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Qualquer canal</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );

    case 'webhook.received':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Filtrar por campo do payload (opcional)</Label>
          <Input placeholder="campo.sub_campo" value={config.filter_field || ''} onChange={e => set('filter_field', e.target.value)}
            className="rounded-xl text-xs" />
          <Label className="text-xs">Valor esperado</Label>
          <Input placeholder="valor" value={config.filter_value || ''} onChange={e => set('filter_value', e.target.value)}
            className="rounded-xl text-xs" />
        </div>
      );

    case 'custom.external':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Nome do evento</Label>
          <Input placeholder="meu_evento_customizado" value={config.event_name || ''} onChange={e => set('event_name', e.target.value)}
            className="rounded-xl text-xs" />
        </div>
      );

    case 'appointment.created':
    case 'appointment.updated':
    case 'appointment.cancelled':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Tipo de serviço (opcional)</Label>
          <Input placeholder="Consulta, Retorno..." value={config.service_type || ''} onChange={e => set('service_type', e.target.value)}
            className="rounded-xl text-xs" />
        </div>
      );

    case 'task.overdue':
      return (
        <div className="space-y-2">
          <Label className="text-xs">Tolerância (horas)</Label>
          <Input type="number" placeholder="0" value={config.tolerance_hours || ''} onChange={e => set('tolerance_hours', e.target.value)}
            className="rounded-xl text-xs" />
        </div>
      );

    default:
      return null;
  }
}

/* ═════════════════════════════════════════════ */
/*  BUILDER HISTORY VIEW                         */
/* ═════════════════════════════════════════════ */
function BuilderHistoryView() {
  const { data: executions = [], isLoading } = useAvivarAutomationExecutions();
  const { automations } = useAvivarAutomations();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchLog, setSearchLog] = useState('');

  const automationMap = useMemo(() => {
    const map: Record<string, string> = {};
    automations.forEach(a => { map[a.id] = a.name; });
    return map;
  }, [automations]);

  const triggerLabels: Record<string, string> = {
    'lead.created': 'Lead criado',
    'lead.moved_to': 'Lead movido',
    'message.received': 'Mensagem recebida',
    'message.sent': 'Mensagem enviada',
    'lead.tag_added': 'Tag adicionada',
    'lead.field_changed': 'Campo alterado',
  };

  const statusStyles: Record<string, string> = {
    completed: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    failed: 'text-red-500 bg-red-500/10 border-red-500/20',
    running: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    pending: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    skipped: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
  };

  const statusLabels: Record<string, string> = {
    completed: 'Executada', failed: 'Falhou', running: 'Executando', pending: 'Pendente', skipped: 'Ignorada',
  };

  const filtered = useMemo(() => {
    let list = executions;
    if (statusFilter !== 'all') list = list.filter(e => e.status === statusFilter);
    if (searchLog.trim()) {
      const q = searchLog.toLowerCase();
      list = list.filter(e =>
        (automationMap[e.automation_id] || '').toLowerCase().includes(q) ||
        (e.trigger_event || '').toLowerCase().includes(q) ||
        (e.error_message || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [executions, statusFilter, searchLog, automationMap]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: executions.length };
    executions.forEach(e => { c[e.status] = (c[e.status] || 0) + 1; });
    return c;
  }, [executions]);

  const getActionLabel = (actionType: string) => {
    const map: Record<string, string> = {
      send_message: 'Enviar mensagem', change_stage: 'Mudar etapa', create_task: 'Criar tarefa',
      add_tag: 'Adicionar tag', create_note: 'Criar nota', dispatch_webhook: 'Webhook', change_field: 'Alterar campo',
    };
    return map[actionType] || actionType;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--avivar-primary))]" />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="font-semibold text-sm text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
          <History className="h-4 w-4" /> Log de Execuções
          <Badge variant="secondary" className="text-[10px]">{executions.length}</Badge>
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--avivar-muted-foreground))]" />
            <Input placeholder="Buscar..." value={searchLog} onChange={e => setSearchLog(e.target.value)}
              className="pl-8 h-8 text-xs w-48 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {['all', 'completed', 'failed', 'running', 'pending', 'skipped'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all font-medium ${
              statusFilter === s
                ? 'bg-[hsl(var(--avivar-primary)/0.15)] text-[hsl(var(--avivar-primary))] border-[hsl(var(--avivar-primary)/0.3)]'
                : 'bg-[hsl(var(--avivar-card))] text-[hsl(var(--avivar-muted-foreground))] border-[hsl(var(--avivar-border))] hover:bg-[hsl(var(--avivar-muted))]'
            }`}>
            {s === 'all' ? 'Todas' : statusLabels[s] || s} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))] flex items-center justify-center mx-auto mb-4">
            <History className="h-8 w-8 text-[hsl(var(--avivar-muted-foreground))]" />
          </div>
          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
            {executions.length === 0 ? 'Nenhuma execução registrada' : 'Nenhum resultado para o filtro atual'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(e => {
            const isExpanded = expanded === e.id;
            const automationName = automationMap[e.automation_id] || 'Automação removida';
            const actionsLog = Array.isArray(e.actions_log) ? e.actions_log : [];
            const triggerLabel = triggerLabels[e.trigger_event] || e.trigger_event;
            const duration = e.started_at && e.completed_at
              ? Math.round((new Date(e.completed_at).getTime() - new Date(e.started_at).getTime()) / 1000)
              : null;

            return (
              <div key={e.id} className="rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] overflow-hidden">
                <button onClick={() => setExpanded(isExpanded ? null : e.id)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-[hsl(var(--avivar-muted)/0.3)] transition-colors">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge className={`text-[10px] border flex-shrink-0 ${statusStyles[e.status] || statusStyles.skipped}`}>
                      {statusLabels[e.status] || e.status}
                    </Badge>
                    <span className="text-sm font-medium text-[hsl(var(--avivar-foreground))] truncate">{automationName}</span>
                    <span className="text-[11px] text-[hsl(var(--avivar-muted-foreground))] flex-shrink-0">{triggerLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {duration !== null && <span className="text-[10px] text-[hsl(var(--avivar-muted-foreground))]">{duration}s</span>}
                    <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">{new Date(e.created_at).toLocaleString('pt-BR')}</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-[hsl(var(--avivar-muted-foreground))] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-muted)/0.15)]">
                    <div className="pt-3 space-y-2">
                      {e.error_message && (
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/15">
                          <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-red-500">{e.error_message}</p>
                        </div>
                      )}
                      {actionsLog.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wider">Ações executadas</p>
                          {actionsLog.map((action: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-[hsl(var(--avivar-foreground))] pl-2">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${action.status === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                              <span>{getActionLabel(action.action_type || action.type || 'unknown')}</span>
                              {action.error && <span className="text-red-500 text-[10px]">({action.error})</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {e.trigger_data && Object.keys(e.trigger_data).length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wider">Dados do gatilho</p>
                          <pre className="text-[10px] bg-[hsl(var(--avivar-card))] p-2 rounded-lg border border-[hsl(var(--avivar-border))] overflow-x-auto text-[hsl(var(--avivar-muted-foreground))]">
                            {JSON.stringify(e.trigger_data, null, 2)}
                          </pre>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3 text-[10px] text-[hsl(var(--avivar-muted-foreground))] pt-1">
                        <span>ID: {e.id.substring(0, 8)}...</span>
                        {e.retry_count > 0 && <span>Retentativas: {e.retry_count}/{e.max_retries}</span>}
                        {e.lead_id && <span>Lead: {e.lead_id.substring(0, 8)}...</span>}
                        {e.conversation_id && <span>Conv: {e.conversation_id.substring(0, 8)}...</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
