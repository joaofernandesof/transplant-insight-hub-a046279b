/**
 * AvivarAutomationsPage - Kommo-style Digital Pipeline Automations
 * Clean, premium UI with proper triggers, conditions, and message editor
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Zap, ChevronRight, Trash2, X, Save,
  History, MessageSquare, ArrowRight, ListTodo, StickyNote,
  Webhook, Hash, Clock, Search, Pencil, GripHorizontal,
  CheckCircle2, AlertCircle, Timer, CalendarCheck, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
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
  type AvivarAutomation,
  type AvivarAutomationAction,
} from '@/hooks/useAvivarAutomations';
import type { KanbanColumnData } from '../kanban/AvivarKanbanPage';

/* ─── Trigger Card Definitions ─── */
const TRIGGER_CARDS = [
  {
    id: 'send_message',
    label: 'Enviar mensagem',
    description: 'Envie uma mensagem automática via WhatsApp',
    icon: MessageSquare,
    gradient: 'from-emerald-500 to-green-600',
    color: 'bg-emerald-500',
    ring: 'ring-emerald-500/20',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800/50',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    defaultAction: 'send_message',
  },
  {
    id: 'change_stage',
    label: 'Mudar etapa',
    description: 'Mova o lead para outra etapa com condições',
    icon: ArrowRight,
    gradient: 'from-amber-500 to-orange-500',
    color: 'bg-amber-500',
    ring: 'ring-amber-500/20',
    bgLight: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800/50',
    textColor: 'text-amber-700 dark:text-amber-400',
    defaultAction: 'change_stage',
  },
  {
    id: 'add_task',
    label: 'Criar tarefa',
    description: 'Crie uma tarefa automaticamente',
    icon: ListTodo,
    gradient: 'from-blue-500 to-indigo-500',
    color: 'bg-blue-500',
    ring: 'ring-blue-500/20',
    bgLight: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800/50',
    textColor: 'text-blue-700 dark:text-blue-400',
    defaultAction: 'create_task',
  },
  {
    id: 'add_tag',
    label: 'Adicionar tag',
    description: 'Adicione tags ao lead automaticamente',
    icon: Hash,
    gradient: 'from-pink-500 to-rose-500',
    color: 'bg-pink-500',
    ring: 'ring-pink-500/20',
    bgLight: 'bg-pink-50 dark:bg-pink-950/20',
    borderColor: 'border-pink-200 dark:border-pink-800/50',
    textColor: 'text-pink-700 dark:text-pink-400',
    defaultAction: 'add_tag',
  },
  {
    id: 'create_note',
    label: 'Criar nota',
    description: 'Adicione uma nota ao histórico do lead',
    icon: StickyNote,
    gradient: 'from-yellow-500 to-amber-500',
    color: 'bg-yellow-500',
    ring: 'ring-yellow-500/20',
    bgLight: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800/50',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    defaultAction: 'create_note',
  },
  {
    id: 'change_field',
    label: 'Alterar campo',
    description: 'Modifique um campo personalizado',
    icon: Pencil,
    gradient: 'from-violet-500 to-purple-500',
    color: 'bg-violet-500',
    ring: 'ring-violet-500/20',
    bgLight: 'bg-violet-50 dark:bg-violet-950/20',
    borderColor: 'border-violet-200 dark:border-violet-800/50',
    textColor: 'text-violet-700 dark:text-violet-400',
    defaultAction: 'change_field',
  },
  {
    id: 'send_webhook',
    label: 'Webhook',
    description: 'Dispare um webhook para sistema externo',
    icon: Webhook,
    gradient: 'from-slate-500 to-gray-600',
    color: 'bg-slate-500',
    ring: 'ring-slate-500/20',
    bgLight: 'bg-slate-50 dark:bg-slate-950/20',
    borderColor: 'border-slate-200 dark:border-slate-800/50',
    textColor: 'text-slate-700 dark:text-slate-400',
    defaultAction: 'dispatch_webhook',
  },
] as const;

type TriggerCard = typeof TRIGGER_CARDS[number];

/* ─── Delay Condition Options ─── */
const DELAY_CONDITIONS = [
  { value: 'immediate', label: 'Imediatamente', icon: Zap, seconds: 0 },
  { value: '5min', label: 'Após 5 minutos', icon: Timer, seconds: 300 },
  { value: '15min', label: 'Após 15 minutos', icon: Timer, seconds: 900 },
  { value: '30min', label: 'Após 30 minutos', icon: Timer, seconds: 1800 },
  { value: '1h', label: 'Após 1 hora', icon: Clock, seconds: 3600 },
  { value: '2h', label: 'Após 2 horas', icon: Clock, seconds: 7200 },
  { value: '6h', label: 'Após 6 horas', icon: Clock, seconds: 21600 },
  { value: '12h', label: 'Após 12 horas', icon: Clock, seconds: 43200 },
  { value: '24h', label: 'Após 24 horas', icon: Clock, seconds: 86400 },
  { value: '48h', label: 'Após 48 horas', icon: Clock, seconds: 172800 },
  { value: '72h', label: 'Após 72 horas', icon: Clock, seconds: 259200 },
  { value: '7d', label: 'Após 7 dias', icon: CalendarCheck, seconds: 604800 },
] as const;

const getDelayLabel = (seconds: number) => {
  const found = DELAY_CONDITIONS.find(d => d.seconds === seconds);
  if (found) return found.label;
  if (seconds >= 86400) return `${Math.floor(seconds / 86400)}d`;
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h`;
  if (seconds >= 60) return `${Math.floor(seconds / 60)}min`;
  return seconds > 0 ? `${seconds}s` : 'Imediato';
};

const getCardForAction = (actionType: string): TriggerCard => {
  return TRIGGER_CARDS.find(c => c.defaultAction === actionType) || TRIGGER_CARDS[0];
};

/* ─── Pending Automation Type ─── */
type PendingAutomation = {
  tempId: string;
  name: string;
  trigger_type: string;
  kanban_id: string;
  column_id: string;
  column_ids: string[];
  is_global: boolean;
  delay_seconds: number;
  execute_once_per_lead: boolean;
  is_active: boolean;
  actions: {
    action_type: string;
    action_config: Record<string, any>;
    order_index: number;
    delay_seconds: number;
  }[];
  existingId?: string;
};

/* ═══════════════════════════════════════════ */
/*  MAIN PAGE                                 */
/* ═══════════════════════════════════════════ */
export default function AvivarAutomationsPage() {
  const { kanbanId } = useParams<{ kanbanId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pipeline');
  const [triggerPickerColumn, setTriggerPickerColumn] = useState<string | null>(null);
  const [configDialog, setConfigDialog] = useState<{
    open: boolean;
    pendingIndex: number | null;
  }>({ open: false, pendingIndex: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingAutomations, setPendingAutomations] = useState<PendingAutomation[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { data: kanban } = useQuery({
    queryKey: ['avivar-kanban', kanbanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avivar_kanbans').select('*').eq('id', kanbanId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!kanbanId,
  });

  const { data: columns = [] } = useQuery({
    queryKey: ['avivar-kanban-columns', kanbanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avivar_kanban_columns').select('*').eq('kanban_id', kanbanId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as KanbanColumnData[];
    },
    enabled: !!kanbanId,
  });

  const {
    automations, actionsByAutomation, isLoading,
    createAutomation, updateAutomation, deleteAutomation,
  } = useAvivarAutomations(kanbanId);

  // Initialize from DB
  useMemo(() => {
    if (!initialized && automations.length > 0 && columns.length > 0) {
      const pending: PendingAutomation[] = automations.map(a => {
        const acts = actionsByAutomation[a.id] || [];
        const cfgColIds = (a.trigger_config as any)?.column_ids as string[] | undefined;
        const colIds = cfgColIds || (a.column_id ? [a.column_id] : []);
        return {
          tempId: a.id, existingId: a.id, name: a.name, trigger_type: a.trigger_type,
          kanban_id: a.kanban_id || kanbanId || '', column_id: a.column_id || '',
          column_ids: colIds.length > 0 ? colIds : (a.column_id ? [a.column_id] : []),
          is_global: a.is_global, delay_seconds: a.delay_seconds,
          execute_once_per_lead: a.execute_once_per_lead, is_active: a.is_active,
          actions: acts.map(act => ({
            action_type: act.action_type, action_config: act.action_config || {},
            order_index: act.order_index, delay_seconds: act.delay_seconds || 0,
          })),
        };
      });
      setPendingAutomations(pending);
      setInitialized(true);
    }
    if (!initialized && !isLoading && columns.length > 0) setInitialized(true);
  }, [automations, actionsByAutomation, columns, initialized, isLoading, kanbanId]);

  const activePending = useMemo(() =>
    pendingAutomations.filter(a => !deletedIds.includes(a.tempId)),
    [pendingAutomations, deletedIds]
  );

  const automationsByColumn = useMemo(() => {
    const map: Record<string, PendingAutomation[]> = {};
    columns.forEach(c => { map[c.id] = []; });
    activePending.forEach(a => {
      const cols = a.column_ids.length > 0 ? a.column_ids : (a.column_id ? [a.column_id] : []);
      cols.forEach(cId => {
        if (map[cId] && !map[cId].find(x => x.tempId === a.tempId)) {
          map[cId].push(a);
        }
      });
    });
    return map;
  }, [activePending, columns]);

  const handleAddTrigger = (columnId: string, card: TriggerCard) => {
    setTriggerPickerColumn(null);
    const newA: PendingAutomation = {
      tempId: `new-${Date.now()}`, name: card.label,
      trigger_type: 'lead.moved_to', kanban_id: kanbanId || '',
      column_id: columnId, column_ids: [columnId], is_global: false,
      delay_seconds: 0, execute_once_per_lead: false, is_active: true,
      actions: [{ action_type: card.defaultAction, action_config: {}, order_index: 0, delay_seconds: 0 }],
    };
    const list = [...pendingAutomations, newA];
    setPendingAutomations(list);
    setHasUnsavedChanges(true);
    setConfigDialog({ open: true, pendingIndex: list.length - 1 });
  };

  const handleEdit = (a: PendingAutomation) => {
    const idx = pendingAutomations.findIndex(p => p.tempId === a.tempId);
    setConfigDialog({ open: true, pendingIndex: idx });
  };

  const handleDelete = (tempId: string) => {
    setDeletedIds(prev => [...prev, tempId]);
    setHasUnsavedChanges(true);
  };

  const handleToggle = (tempId: string, active: boolean) => {
    setPendingAutomations(prev => prev.map(a => a.tempId === tempId ? { ...a, is_active: active } : a));
    setHasUnsavedChanges(true);
  };

  const handleUpdate = (index: number, data: Partial<PendingAutomation>) => {
    setPendingAutomations(prev => prev.map((a, i) => i === index ? { ...a, ...data } : a));
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = async () => {
    if (!kanbanId) return;
    setIsSaving(true);
    try {
      for (const id of deletedIds) {
        const existing = pendingAutomations.find(a => a.tempId === id && a.existingId);
        if (existing?.existingId) await deleteAutomation.mutateAsync(existing.existingId);
      }
      for (const a of pendingAutomations) {
        if (deletedIds.includes(a.tempId)) continue;
        const payload = {
          name: a.name, trigger_type: a.trigger_type, kanban_id: kanbanId,
          column_id: a.column_ids[0] || a.column_id, is_global: false,
          delay_seconds: a.delay_seconds, execute_once_per_lead: a.execute_once_per_lead,
          is_active: a.is_active, trigger_config: { column_ids: a.column_ids },
          actions: a.actions,
        };
        if (a.existingId) {
          await updateAutomation.mutateAsync({ id: a.existingId, ...payload });
        } else {
          await createAutomation.mutateAsync(payload as any);
        }
      }
      setHasUnsavedChanges(false);
      setDeletedIds([]);
      setInitialized(false);
      toast.success('Funil digital salvo com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err?.message || 'Tente novamente'));
    } finally {
      setIsSaving(false);
    }
  };

  const getSpan = useCallback((a: PendingAutomation) => {
    if (a.column_ids.length <= 1) return null;
    const indices = a.column_ids.map(cId => columns.findIndex(c => c.id === cId)).filter(i => i >= 0).sort((x, y) => x - y);
    if (indices.length < 2) return null;
    return { start: indices[0], end: indices[indices.length - 1], count: indices[indices.length - 1] - indices[0] + 1 };
  }, [columns]);

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--avivar-background))]">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-[hsl(var(--avivar-background))]/95 backdrop-blur-sm border-b border-[hsl(var(--avivar-border))]">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/avivar/kanban/${kanbanId}`)}
              className="h-9 w-9 rounded-xl hover:bg-[hsl(var(--avivar-primary)/0.08)]">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-[hsl(var(--avivar-foreground))] leading-tight">Automações</h1>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">{kanban?.name || '...'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-medium px-2.5 py-1">
              {activePending.length} automação{activePending.length !== 1 ? 'ões' : ''}
            </Badge>
            {hasUnsavedChanges && (
              <Badge className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse px-2.5 py-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                Não salvo
              </Badge>
            )}
            <Button onClick={handleSaveAll} disabled={!hasUnsavedChanges || isSaving} size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-xl shadow-lg shadow-emerald-600/20 h-9 px-4">
              <Save className="h-3.5 w-3.5" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-5">
          <TabsList className="bg-[hsl(var(--avivar-card))] h-9 p-0.5 rounded-lg">
            <TabsTrigger value="pipeline" className="text-xs rounded-md h-8 px-3">Funil Digital</TabsTrigger>
            <TabsTrigger value="list" className="text-xs rounded-md h-8 px-3">Todas</TabsTrigger>
            <TabsTrigger value="history" className="text-xs rounded-md h-8 px-3">Histórico</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'pipeline' && (
          <PipelineView
            columns={columns} automationsByColumn={automationsByColumn}
            pendingAutomations={pendingAutomations} deletedIds={deletedIds}
            triggerPickerColumn={triggerPickerColumn}
            onOpenTriggerPicker={setTriggerPickerColumn}
            onSelectTrigger={handleAddTrigger} onEditAutomation={handleEdit}
            onToggle={handleToggle} onDelete={handleDelete} getSpan={getSpan}
          />
        )}
        {activeTab === 'list' && (
          <ListView automations={activePending} columns={columns}
            searchQuery={searchQuery} onSearchChange={setSearchQuery}
            onEdit={handleEdit} onToggle={handleToggle} onDelete={handleDelete} />
        )}
        {activeTab === 'history' && <HistoryView />}
      </div>

      {/* ── Config Dialog ── */}
      {configDialog.pendingIndex !== null && pendingAutomations[configDialog.pendingIndex] && (
        <AutomationConfigDialog
          open={configDialog.open}
          onOpenChange={(open) => setConfigDialog(prev => ({ ...prev, open }))}
          pending={pendingAutomations[configDialog.pendingIndex]}
          columns={columns}
          onSave={(data) => {
            if (configDialog.pendingIndex !== null) handleUpdate(configDialog.pendingIndex, data);
            setConfigDialog({ open: false, pendingIndex: null });
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*  PIPELINE VIEW                             */
/* ═══════════════════════════════════════════ */
function PipelineView({
  columns, automationsByColumn, pendingAutomations, deletedIds,
  triggerPickerColumn, onOpenTriggerPicker, onSelectTrigger,
  onEditAutomation, onToggle, onDelete, getSpan,
}: {
  columns: KanbanColumnData[];
  automationsByColumn: Record<string, PendingAutomation[]>;
  pendingAutomations: PendingAutomation[];
  deletedIds: string[];
  triggerPickerColumn: string | null;
  onOpenTriggerPicker: (id: string | null) => void;
  onSelectTrigger: (colId: string, card: TriggerCard) => void;
  onEditAutomation: (a: PendingAutomation) => void;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  getSpan: (a: PendingAutomation) => { start: number; end: number; count: number } | null;
}) {
  const spanning = useMemo(() =>
    pendingAutomations
      .filter(a => !deletedIds.includes(a.tempId) && a.column_ids.length > 1)
      .map(a => ({ automation: a, span: getSpan(a) }))
      .filter(x => x.span !== null) as { automation: PendingAutomation; span: { start: number; end: number; count: number } }[],
    [pendingAutomations, deletedIds, getSpan]
  );

  const isSpanning = useCallback((id: string) => spanning.some(s => s.automation.tempId === id), [spanning]);
  const COL_W = 200;

  return (
    <div className="p-5">
      <ScrollArea className="w-full">
        <div className="relative min-w-max">
          {/* Column Headers */}
          <div className="flex">
            {columns.map((col, idx) => (
              <div key={col.id} className="flex items-center" style={{ width: COL_W }}>
                <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-t-xl"
                  style={{ backgroundColor: col.color || '#8b5cf6' }}>
                  <span className="font-semibold text-xs text-white truncate flex-1">{col.name}</span>
                  <span className="text-[10px] text-white/70 font-medium bg-white/15 rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {(automationsByColumn[col.id] || []).length}
                  </span>
                </div>
                {idx < columns.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 text-[hsl(var(--avivar-muted-foreground))] mx-0.5 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Column Bodies */}
          <div className="flex">
            {columns.map((col, idx) => {
              const colAutos = (automationsByColumn[col.id] || []).filter(a => !isSpanning(a.tempId));
              const isPickerOpen = triggerPickerColumn === col.id;

              return (
                <div key={col.id}
                  className={`border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] p-2 space-y-2 ${
                    idx === 0 ? 'rounded-bl-xl' : idx === columns.length - 1 ? 'rounded-br-xl' : ''
                  }`}
                  style={{ width: COL_W, minHeight: 160 }}
                >
                  {/* Spanning bars starting here */}
                  {spanning.filter(s => s.span.start === idx).map(({ automation: a, span }) => {
                    const card = getCardForAction(a.actions[0]?.action_type);
                    const w = span.count * COL_W - 12;
                    return (
                      <div key={a.tempId}
                        className={`relative z-10 group rounded-xl border ${card.borderColor} ${card.bgLight} p-2.5 cursor-pointer transition-all hover:shadow-md ${!a.is_active ? 'opacity-40' : ''}`}
                        style={{ width: w }}
                        onClick={() => onEditAutomation(a)}>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                            <card.icon className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs text-[hsl(var(--avivar-foreground))] truncate">{a.name}</p>
                            <p className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] flex items-center gap-1">
                              <GripHorizontal className="h-2.5 w-2.5" />
                              {span.count} etapas
                              {a.delay_seconds > 0 && (
                                <span className="ml-1">· {getDelayLabel(a.delay_seconds)}</span>
                              )}
                            </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <Switch checked={a.is_active} onCheckedChange={v => onToggle(a.tempId, v)} className="scale-[0.65]" />
                            <button className="p-1 rounded-md hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors" onClick={() => onDelete(a.tempId)}>
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        {a.actions[0]?.action_config?.message && (
                          <p className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] mt-1.5 line-clamp-2 pl-10 italic opacity-80">
                            "{(a.actions[0].action_config.message as string).substring(0, 80)}..."
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {/* Single-column automations */}
                  {colAutos.map(a => <AutomationCard key={a.tempId} automation={a}
                    onEdit={() => onEditAutomation(a)} onToggle={onToggle} onDelete={onDelete} />)}

                  {/* Add button / picker */}
                  {isPickerOpen ? (
                    <TriggerPicker columnId={col.id} onSelect={onSelectTrigger}
                      onClose={() => onOpenTriggerPicker(null)} />
                  ) : (
                    <button onClick={() => onOpenTriggerPicker(col.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-primary))] hover:border-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.03)] transition-all text-xs font-medium">
                      <Plus className="h-3.5 w-3.5" /> Automação
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

/* ─── Automation Card ─── */
function AutomationCard({ automation: a, onEdit, onToggle, onDelete }: {
  automation: PendingAutomation;
  onEdit: () => void;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const card = getCardForAction(a.actions[0]?.action_type);
  const msg = a.actions.find(act => act.action_type === 'send_message')?.action_config?.message as string | undefined;

  return (
    <div className={`group relative rounded-xl border ${card.borderColor} ${card.bgLight} p-2.5 cursor-pointer transition-all hover:shadow-md ${!a.is_active ? 'opacity-40' : ''}`}
      onClick={onEdit}>
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
          <card.icon className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-xs text-[hsl(var(--avivar-foreground))] truncate leading-tight">{a.name}</p>
          <p className={`text-[10px] ${card.textColor} leading-tight font-medium`}>{card.label}</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Switch checked={a.is_active} onCheckedChange={v => onToggle(a.tempId, v)} className="scale-[0.65]" />
          <button className="p-1 rounded-md hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors" onClick={() => onDelete(a.tempId)}>
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      {msg && (
        <p className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] mt-1.5 line-clamp-2 pl-10 italic opacity-80">
          "{msg.substring(0, 60)}{msg.length > 60 ? '...' : ''}"
        </p>
      )}
      {a.delay_seconds > 0 && (
        <div className="flex items-center gap-1 pl-10 mt-1">
          <Clock className="h-2.5 w-2.5 text-[hsl(var(--avivar-muted-foreground))]" />
          <span className="text-[9px] text-[hsl(var(--avivar-muted-foreground))] font-medium">{getDelayLabel(a.delay_seconds)}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Trigger Picker ─── */
function TriggerPicker({ columnId, onSelect, onClose }: {
  columnId: string;
  onSelect: (colId: string, card: TriggerCard) => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200 bg-[hsl(var(--avivar-background))] rounded-xl border border-[hsl(var(--avivar-border))] p-2.5 shadow-lg">
      <div className="flex items-center justify-between px-0.5">
        <p className="text-[10px] font-semibold text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wider">
          Escolha a ação
        </p>
        <button className="p-0.5 rounded hover:bg-[hsl(var(--avivar-primary)/0.1)] transition-colors" onClick={onClose}>
          <X className="h-3.5 w-3.5 text-[hsl(var(--avivar-muted-foreground))]" />
        </button>
      </div>
      <div className="space-y-1">
        {TRIGGER_CARDS.map(card => (
          <button key={card.id}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg ${card.bgLight} border ${card.borderColor} hover:shadow-sm transition-all text-left group/item`}
            onClick={() => onSelect(columnId, card)}>
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
              <card.icon className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-medium text-[hsl(var(--avivar-foreground))] block leading-tight">{card.label}</span>
              <span className="text-[9px] text-[hsl(var(--avivar-muted-foreground))] leading-tight">{card.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*  CONFIG DIALOG                             */
/* ═══════════════════════════════════════════ */
function AutomationConfigDialog({ open, onOpenChange, pending, columns, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: PendingAutomation;
  columns: KanbanColumnData[];
  onSave: (data: Partial<PendingAutomation>) => void;
}) {
  const [name, setName] = useState(pending.name);
  const [triggerType, setTriggerType] = useState(pending.trigger_type);
  const [delaySeconds, setDelaySeconds] = useState(pending.delay_seconds);
  const [executeOnce, setExecuteOnce] = useState(pending.execute_once_per_lead);
  const [selectedCols, setSelectedCols] = useState<string[]>(pending.column_ids);
  const [actionConfig, setActionConfig] = useState<Record<string, any>>(pending.actions[0]?.action_config || {});

  const actionType = pending.actions[0]?.action_type || 'send_message';
  const card = getCardForAction(actionType);

  useEffect(() => {
    if (open) {
      setName(pending.name);
      setTriggerType(pending.trigger_type);
      setDelaySeconds(pending.delay_seconds);
      setExecuteOnce(pending.execute_once_per_lead);
      setSelectedCols(pending.column_ids);
      setActionConfig(pending.actions[0]?.action_config || {});
    }
  }, [open, pending]);

  const toggleCol = (id: string) => setSelectedCols(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const handleSave = () => {
    if (!name.trim()) { toast.error('Preencha o nome'); return; }
    if (selectedCols.length === 0) { toast.error('Selecione pelo menos uma etapa'); return; }
    onSave({
      name, trigger_type: triggerType, column_id: selectedCols[0], column_ids: selectedCols,
      delay_seconds: delaySeconds, execute_once_per_lead: executeOnce,
      actions: [{ action_type: actionType, action_config: actionConfig, order_index: 0, delay_seconds: 0 }],
    });
  };

  const delayValue = DELAY_CONDITIONS.find(d => d.seconds === delaySeconds)?.value || 'custom';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl">
        {/* Header */}
        <div className={`px-5 py-4 border-b border-[hsl(var(--avivar-border))] bg-gradient-to-r ${card.gradient} bg-opacity-5`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}>
              <card.icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
                Configurar {card.label}
              </DialogTitle>
              <DialogDescription className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                {selectedCols.length > 1 ? `${selectedCols.length} etapas selecionadas` :
                  columns.find(c => c.id === selectedCols[0])?.name || 'Selecione etapas'}
              </DialogDescription>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-5 py-4">
          <div className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nome da automação</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Boas-vindas novo lead"
                className="text-sm h-9 rounded-lg" />
            </div>

            {/* Stages */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Aplicar nas etapas</Label>
              <div className="flex flex-wrap gap-1.5">
                {columns.map(col => {
                  const sel = selectedCols.includes(col.id);
                  return (
                    <button key={col.id} type="button" onClick={() => toggleCol(col.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                        sel ? 'text-white shadow-sm' : 'bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] hover:border-[hsl(var(--avivar-primary)/0.3)]'
                      }`}
                      style={sel ? { backgroundColor: col.color || '#8b5cf6' } : undefined}>
                      {sel && <CheckCircle2 className="h-3 w-3" />}
                      {col.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trigger */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Quando executar</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger className="text-sm h-9 rounded-lg">
                  <SelectValue placeholder="Selecione o gatilho..." />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_CATEGORIES.map(cat => (
                    <SelectGroup key={cat.category}>
                      <SelectLabel className="text-[10px] uppercase tracking-wider">{cat.category}</SelectLabel>
                      {cat.triggers.map(t => (
                        <SelectItem key={t.value} value={t.value} className="text-sm">{t.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delay / Condition */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Condição de tempo</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {DELAY_CONDITIONS.slice(0, 9).map(d => {
                  const sel = delaySeconds === d.seconds;
                  return (
                    <button key={d.value} type="button" onClick={() => setDelaySeconds(d.seconds)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all border ${
                        sel ? 'border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.08)] text-[hsl(var(--avivar-primary))]' :
                        'border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] text-[hsl(var(--avivar-muted-foreground))] hover:border-[hsl(var(--avivar-primary)/0.3)]'
                      }`}>
                      <d.icon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{d.label.replace('Após ', '')}</span>
                    </button>
                  );
                })}
              </div>
              {/* Custom delay */}
              <div className="flex items-center gap-2 mt-1">
                <Label className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] whitespace-nowrap">Personalizado (seg):</Label>
                <Input type="number" min={0} value={delaySeconds}
                  onChange={e => setDelaySeconds(parseInt(e.target.value) || 0)}
                  className="text-xs h-7 w-24 rounded-md" />
              </div>
            </div>

            {/* Execute once */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))]">
              <Switch checked={executeOnce} onCheckedChange={setExecuteOnce} className="scale-90" />
              <span className="text-xs text-[hsl(var(--avivar-foreground))]">Executar apenas uma vez por lead</span>
            </div>

            {/* ── Action Config ── */}
            <div className="border-t border-[hsl(var(--avivar-border))] pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                  <card.icon className="h-3 w-3 text-white" />
                </div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--avivar-muted-foreground))]">
                  Configurar ação
                </Label>
              </div>

              {/* Send Message */}
              {actionType === 'send_message' && (
                <div className="space-y-2">
                  <Textarea value={actionConfig.message || ''} rows={5}
                    onChange={e => setActionConfig(p => ({ ...p, message: e.target.value }))}
                    placeholder={"Olá {{nome}}! 👋\n\nSeja bem-vindo(a)! Estamos muito felizes em te receber.\n\nComo posso te ajudar hoje?"}
                    className="text-sm rounded-lg resize-none" />
                  <div className="flex flex-wrap gap-1">
                    {['{{nome}}', '{{primeiro_nome}}', '{{procedimento}}', '{{empresa}}', '{{telefone}}'].map(v => (
                      <button key={v} type="button"
                        className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors font-mono"
                        onClick={() => setActionConfig(p => ({ ...p, message: (p.message || '') + ' ' + v }))}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Change Stage */}
              {actionType === 'change_stage' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Mover para etapa</Label>
                    <Select value={actionConfig.target_column_id || ''}
                      onValueChange={v => setActionConfig(p => ({ ...p, target_column_id: v }))}>
                      <SelectTrigger className="mt-1 text-sm h-9 rounded-lg"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {columns.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color || '#8b5cf6' }} />
                              {c.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Condição adicional (opcional)</Label>
                    <Select value={actionConfig.condition_type || 'none'}
                      onValueChange={v => setActionConfig(p => ({ ...p, condition_type: v }))}>
                      <SelectTrigger className="mt-1 text-sm h-9 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem condição extra</SelectItem>
                        <SelectItem value="after_time">Após tempo decorrido</SelectItem>
                        <SelectItem value="after_appointment">Após consulta agendada</SelectItem>
                        <SelectItem value="after_custom_field">Após campo preenchido</SelectItem>
                        <SelectItem value="after_tag">Após tag adicionada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {actionConfig.condition_type === 'after_custom_field' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px]">Nome do campo</Label>
                        <Input value={actionConfig.condition_field || ''} className="text-xs h-8 mt-0.5 rounded-md"
                          onChange={e => setActionConfig(p => ({ ...p, condition_field: e.target.value }))}
                          placeholder="Ex: cpf, cep..." />
                      </div>
                      <div>
                        <Label className="text-[10px]">Valor esperado</Label>
                        <Input value={actionConfig.condition_value || ''} className="text-xs h-8 mt-0.5 rounded-md"
                          onChange={e => setActionConfig(p => ({ ...p, condition_value: e.target.value }))}
                          placeholder="(qualquer valor)" />
                      </div>
                    </div>
                  )}
                  {actionConfig.condition_type === 'after_tag' && (
                    <div>
                      <Label className="text-[10px]">Tag necessária</Label>
                      <Input value={actionConfig.condition_tag || ''} className="text-xs h-8 mt-0.5 rounded-md"
                        onChange={e => setActionConfig(p => ({ ...p, condition_tag: e.target.value }))}
                        placeholder="Ex: qualificado" />
                    </div>
                  )}
                </div>
              )}

              {/* Create Task */}
              {actionType === 'create_task' && (
                <div className="space-y-2">
                  <Input value={actionConfig.title || ''} placeholder="Título da tarefa"
                    onChange={e => setActionConfig(p => ({ ...p, title: e.target.value }))}
                    className="text-sm h-9 rounded-lg" />
                  <Textarea value={actionConfig.description || ''} rows={2}
                    onChange={e => setActionConfig(p => ({ ...p, description: e.target.value }))}
                    placeholder="Descrição da tarefa..." className="text-sm rounded-lg resize-none" />
                </div>
              )}

              {/* Add Tag */}
              {(actionType === 'add_tag' || actionType === 'remove_tag') && (
                <Input value={actionConfig.tag || ''} placeholder="Nome da tag..."
                  onChange={e => setActionConfig(p => ({ ...p, tag: e.target.value }))}
                  className="text-sm h-9 rounded-lg" />
              )}

              {/* Create Note */}
              {actionType === 'create_note' && (
                <Textarea value={actionConfig.content || ''} rows={3}
                  onChange={e => setActionConfig(p => ({ ...p, content: e.target.value }))}
                  placeholder="Conteúdo da nota..." className="text-sm rounded-lg resize-none" />
              )}

              {/* Webhook */}
              {actionType === 'dispatch_webhook' && (
                <div className="space-y-2">
                  <Input value={actionConfig.url || ''} placeholder="https://..."
                    onChange={e => setActionConfig(p => ({ ...p, url: e.target.value }))}
                    className="text-sm h-9 rounded-lg font-mono" />
                  <Select value={actionConfig.method || 'POST'}
                    onValueChange={v => setActionConfig(p => ({ ...p, method: v }))}>
                    <SelectTrigger className="text-sm h-9 rounded-lg w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Change Field */}
              {actionType === 'change_field' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Campo</Label>
                    <Input value={actionConfig.field_name || ''} className="text-sm h-9 mt-0.5 rounded-lg"
                      onChange={e => setActionConfig(p => ({ ...p, field_name: e.target.value }))}
                      placeholder="Nome do campo..." />
                  </div>
                  <div>
                    <Label className="text-[10px]">Novo valor</Label>
                    <Input value={actionConfig.field_value || ''} className="text-sm h-9 mt-0.5 rounded-lg"
                      onChange={e => setActionConfig(p => ({ ...p, field_value: e.target.value }))}
                      placeholder="Valor..." />
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[hsl(var(--avivar-border))] flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="rounded-lg h-9">
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave}
            className={`bg-gradient-to-r ${card.gradient} hover:opacity-90 text-white rounded-lg h-9 px-5 shadow-md`}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Aplicar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════ */
/*  LIST VIEW                                 */
/* ═══════════════════════════════════════════ */
function ListView({ automations, columns, searchQuery, onSearchChange, onEdit, onToggle, onDelete }: {
  automations: PendingAutomation[];
  columns: KanbanColumnData[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onEdit: (a: PendingAutomation) => void;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return automations;
    const q = searchQuery.toLowerCase();
    return automations.filter(a => a.name.toLowerCase().includes(q));
  }, [automations, searchQuery]);

  return (
    <div className="p-5 space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
        <Input placeholder="Buscar automações..." value={searchQuery} onChange={e => onSearchChange(e.target.value)}
          className="pl-10 h-9 rounded-lg bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))] flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-[hsl(var(--avivar-muted-foreground))]" />
          </div>
          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Nenhuma automação encontrada</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(a => {
            const card = getCardForAction(a.actions[0]?.action_type);
            const stageNames = a.column_ids.map(cId => columns.find(c => c.id === cId)?.name).filter(Boolean).join(' → ');
            return (
              <div key={a.tempId}
                className={`flex items-center gap-3 p-3 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] hover:border-[hsl(var(--avivar-primary)/0.3)] cursor-pointer transition-all ${!a.is_active ? 'opacity-50' : ''}`}
                onClick={() => onEdit(a)}>
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                  <card.icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[hsl(var(--avivar-foreground))] truncate">{a.name}</p>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    {card.label} · {stageNames || '—'}
                    {a.delay_seconds > 0 && ` · ${getDelayLabel(a.delay_seconds)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  {a.column_ids.length > 1 && (
                    <Badge variant="outline" className="text-[10px] font-medium">{a.column_ids.length} etapas</Badge>
                  )}
                  <Switch checked={a.is_active} onCheckedChange={v => onToggle(a.tempId, v)} className="scale-75" />
                  <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors" onClick={() => onDelete(a.tempId)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*  HISTORY VIEW                              */
/* ═══════════════════════════════════════════ */
function HistoryView() {
  const { data: executions = [] } = useAvivarAutomationExecutions();

  const statusStyles: Record<string, string> = {
    completed: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    failed: 'text-red-500 bg-red-500/10 border-red-500/20',
    running: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    pending: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    skipped: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
  };

  return (
    <div className="p-5 space-y-4">
      <h3 className="font-semibold text-sm text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
        <History className="h-4 w-4" /> Histórico de Execuções
      </h3>
      {executions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))] flex items-center justify-center mx-auto mb-4">
            <History className="h-8 w-8 text-[hsl(var(--avivar-muted-foreground))]" />
          </div>
          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Nenhuma execução registrada</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {executions.map(e => (
            <div key={e.id} className="rounded-xl border border-[hsl(var(--avivar-border))] p-3 bg-[hsl(var(--avivar-card))]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] border ${statusStyles[e.status] || statusStyles.skipped}`}>{e.status}</Badge>
                  <span className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">{e.trigger_event}</span>
                </div>
                <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                  {new Date(e.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
              {e.error_message && <p className="text-xs text-red-500 mt-1.5">{e.error_message}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
