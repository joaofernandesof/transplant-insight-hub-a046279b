import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ModuleLayout } from '@/components/ModuleLayout';
import { useProcessTemplates, useProcessSteps, ProcessStep } from '@/hooks/useProcessTemplates';
import { useStaffRoles } from '@/neohub/hooks/useStaffRoles';
import { useNeoTeamBranches } from '@/neohub/hooks/useNeoTeamBranches';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ArrowLeft, Plus, Pencil, Trash2, User,
  Link2, Cog, ShieldCheck, Loader2, Play,
  Square, Timer, Flag, Workflow, ArrowRight, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Category options (sidebar module mapping) ─── */
const CATEGORY_OPTIONS = [
  { value: 'neoteam_schedule', label: 'Agenda' },
  { value: 'neoteam_surgical_dashboard', label: 'Agenda Cirúrgica' },
  { value: 'neoteam_waiting_room', label: 'Sala de Espera' },
  { value: 'neoteam_patients', label: 'Pacientes' },
  { value: 'neoteam_medical_records', label: 'Prontuários' },
  { value: 'neoteam_anamnesis', label: 'Anamnese' },
  { value: 'neoteam_procedures', label: 'Procedimentos' },
  { value: 'neoteam_after_sales', label: 'Pós-Venda' },
  { value: 'neoteam_retention', label: 'Retenção & Churn' },
  { value: 'neoteam_tasks', label: 'Tarefas' },
  { value: 'neoteam_cleaning', label: 'Limpeza' },
  { value: 'neoteam_inventory', label: 'Inventário' },
  { value: 'neoteam_diary', label: 'Diário de Bordo' },
  { value: 'neoteam_financial_dashboard', label: 'Dashboard Financeiro' },
  { value: 'neoteam_contract_review', label: 'Revisão de Contratos' },
  { value: 'neoteam_legal_dashboard', label: 'Dashboard Jurídico' },
  { value: 'neoteam_staff', label: 'Cargos & Funções' },
  { value: 'custom', label: 'Personalizado' },
];

/* ─── BPMN config ─── */
const STEP_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; borderColor: string; bgGlow: string }> = {
  manual: {
    label: 'Tarefa Manual',
    icon: <User className="h-3.5 w-3.5" />,
    color: 'text-blue-400',
    borderColor: 'border-blue-400/60',
    bgGlow: 'from-blue-500/10 to-blue-600/5',
  },
  automatic: {
    label: 'Tarefa Automática',
    icon: <Cog className="h-3.5 w-3.5" />,
    color: 'text-violet-400',
    borderColor: 'border-violet-400/60',
    bgGlow: 'from-violet-500/10 to-violet-600/5',
  },
  approval: {
    label: 'Aprovação',
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    color: 'text-amber-400',
    borderColor: 'border-amber-400/60',
    bgGlow: 'from-amber-500/10 to-amber-600/5',
  },
};

const PHASE_COLORS: Record<string, { bg: string; text: string; accent: string; border: string }> = {
  'Venda': { bg: 'bg-emerald-950/40', text: 'text-emerald-300', accent: '#10b981', border: 'border-emerald-700/40' },
  'D-20': { bg: 'bg-blue-950/40', text: 'text-blue-300', accent: '#3b82f6', border: 'border-blue-700/40' },
  'D-15': { bg: 'bg-sky-950/40', text: 'text-sky-300', accent: '#0ea5e9', border: 'border-sky-700/40' },
  'D-10': { bg: 'bg-orange-950/40', text: 'text-orange-300', accent: '#f97316', border: 'border-orange-700/40' },
  'D-7': { bg: 'bg-rose-950/40', text: 'text-rose-300', accent: '#f43f5e', border: 'border-rose-700/40' },
  'D-5': { bg: 'bg-pink-950/40', text: 'text-pink-300', accent: '#ec4899', border: 'border-pink-700/40' },
  'D-3': { bg: 'bg-fuchsia-950/40', text: 'text-fuchsia-300', accent: '#d946ef', border: 'border-fuchsia-700/40' },
  'D-2': { bg: 'bg-red-950/40', text: 'text-red-300', accent: '#ef4444', border: 'border-red-700/40' },
  'D-1': { bg: 'bg-rose-950/40', text: 'text-rose-300', accent: '#fb7185', border: 'border-rose-700/40' },
  'D0': { bg: 'bg-yellow-950/40', text: 'text-yellow-300', accent: '#eab308', border: 'border-yellow-700/40' },
  'D+1': { bg: 'bg-teal-950/40', text: 'text-teal-300', accent: '#14b8a6', border: 'border-teal-700/40' },
};

function getPhaseConfig(key: string) {
  return PHASE_COLORS[key] || { bg: 'bg-slate-900/40', text: 'text-slate-300', accent: '#64748b', border: 'border-slate-700/40' };
}

const RELATIVE_DAY_OPTIONS = [
  { value: -30, label: 'D-30' }, { value: -20, label: 'D-20' }, { value: -15, label: 'D-15' },
  { value: -10, label: 'D-10' }, { value: -7, label: 'D-7' }, { value: -5, label: 'D-5' },
  { value: -3, label: 'D-3' }, { value: -2, label: 'D-2' }, { value: -1, label: 'D-1' },
  { value: 0, label: 'D0 (Dia)' },
  { value: 1, label: 'D+1' }, { value: 2, label: 'D+2' }, { value: 3, label: 'D+3' },
  { value: 5, label: 'D+5' }, { value: 7, label: 'D+7' }, { value: 14, label: 'D+14' },
  { value: 30, label: 'D+30' },
];

function formatRelativeDay(day: number | null): string {
  if (day === null || day === undefined) return '—';
  if (day === 0) return 'D0';
  return day > 0 ? `D+${day}` : `D${day}`;
}

function getPhaseLabel(step: ProcessStep): string {
  const meta = (step.metadata || {}) as Record<string, unknown>;
  return (meta.phase_label as string) || formatRelativeDay(step.relative_day);
}

/* ─── Horizontal BPMN Node ─── */
function HBpmnNode({
  step, steps, staffRoles, systemUsers, onEdit, onDelete, isLast,
}: {
  step: ProcessStep;
  steps: ProcessStep[];
  staffRoles: { code: string; name: string }[];
  systemUsers: { id: string; full_name: string; email: string | null }[];
  onEdit: (s: ProcessStep) => void;
  onDelete: (id: string) => void;
  isLast: boolean;
}) {
  const typeCfg = STEP_TYPE_CONFIG[step.step_type] || STEP_TYPE_CONFIG.manual;
  const meta = (step.metadata || {}) as Record<string, unknown>;
  const userName = systemUsers.find(u => u.id === step.responsible_user_id)?.full_name;
  const roleLabel = staffRoles.find(r => r.code === step.responsible_role)?.name;
  const responsibleName = userName || (meta.responsible_name as string | undefined);
  const displayResponsible = responsibleName || roleLabel;

  return (
    <div className="flex items-center flex-shrink-0">
      {/* Node */}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'group relative w-[160px] border-2 rounded-xl bg-gradient-to-br p-3 cursor-pointer backdrop-blur-sm transition-all hover:scale-105 hover:shadow-lg',
                typeCfg.borderColor,
                typeCfg.bgGlow,
                step.step_type === 'automatic' && 'ring-2 ring-violet-400/20 ring-offset-1 ring-offset-transparent',
              )}
              onClick={() => onEdit(step)}
            >
              {/* Type icon badge */}
              <div className={cn('flex items-center gap-1.5 mb-2', typeCfg.color)}>
                <div className={cn('p-1 rounded border bg-background/50', typeCfg.borderColor)}>
                  {typeCfg.icon}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider">{typeCfg.label}</span>
              </div>

              {/* Name */}
              <p className="font-semibold text-foreground text-xs leading-tight line-clamp-2 min-h-[2rem]">
                {step.name}
              </p>

              {/* Responsible */}
              {displayResponsible && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-full w-fit max-w-full">
                  <User className="h-2.5 w-2.5 flex-shrink-0" />
                  <span className="truncate">{displayResponsible}</span>
                </div>
              )}

              {/* Optional badge */}
              {!step.is_required && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 mt-1.5 text-muted-foreground">
                  Opcional
                </Badge>
              )}

              {/* Hover actions */}
              <div className="absolute -top-2 -right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-1 rounded-full bg-background border shadow-sm hover:bg-muted"
                  onClick={e => { e.stopPropagation(); onEdit(step); }}
                >
                  <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                </button>
                <button
                  className="p-1 rounded-full bg-background border shadow-sm hover:bg-destructive/10"
                  onClick={e => { e.stopPropagation(); onDelete(step.id); }}
                >
                  <Trash2 className="h-2.5 w-2.5 text-destructive" />
                </button>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold text-sm">{step.name}</p>
              {step.description && <p className="text-xs text-muted-foreground">{step.description}</p>}
              <div className="flex gap-2 text-xs text-muted-foreground">
                {step.duration_hours && (
                  <span className="flex items-center gap-0.5"><Timer className="h-3 w-3" /> {step.duration_hours}h</span>
                )}
                {displayResponsible && (
                  <span className="flex items-center gap-0.5"><User className="h-3 w-3" /> {displayResponsible}</span>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Horizontal connector */}
      {!isLast && (
        <div className="flex items-center flex-shrink-0 mx-1">
          <div className="w-6 h-0.5 bg-muted-foreground/30" />
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 -ml-1" />
        </div>
      )}
    </div>
  );
}

/* ─── Horizontal Swim Lane ─── */
function HSwimLane({
  phaseKey, stepsInPhase, allSteps, staffRoles, systemUsers, onEdit, onDelete, isLastLane,
}: {
  phaseKey: string;
  stepsInPhase: ProcessStep[];
  allSteps: ProcessStep[];
  staffRoles: { code: string; name: string }[];
  systemUsers: { id: string; full_name: string; email: string | null }[];
  onEdit: (s: ProcessStep) => void;
  onDelete: (id: string) => void;
  isLastLane: boolean;
}) {
  const phaseConfig = getPhaseConfig(phaseKey);

  return (
    <div className="flex items-center flex-shrink-0">
      {/* Lane */}
      <div className={cn('border rounded-2xl overflow-hidden flex-shrink-0', phaseConfig.border, phaseConfig.bg)}>
        {/* Lane Header - vertical label on top */}
        <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: phaseConfig.accent + '30' }}>
          <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: phaseConfig.accent }} />
          <Flag className="h-3.5 w-3.5 flex-shrink-0" style={{ color: phaseConfig.accent }} />
          <h3 className={cn('font-bold text-xs tracking-wide whitespace-nowrap', phaseConfig.text)}>
            {phaseKey}
          </h3>
          <Badge
            variant="outline"
            className="text-[9px] ml-1"
            style={{ borderColor: phaseConfig.accent + '50', color: phaseConfig.accent }}
          >
            {stepsInPhase.length}
          </Badge>
        </div>

        {/* Lane Body - horizontal nodes */}
        <div className="px-4 py-3 flex items-center">
          {stepsInPhase.map((step, idx) => (
            <HBpmnNode
              key={step.id}
              step={step}
              steps={allSteps}
              staffRoles={staffRoles}
              systemUsers={systemUsers}
              onEdit={onEdit}
              onDelete={onDelete}
              isLast={idx === stepsInPhase.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Lane-to-lane connector */}
      {!isLastLane && (
        <div className="flex items-center flex-shrink-0 mx-2">
          <div className="w-4 h-0.5 bg-muted-foreground/20" />
          <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/30 bg-background flex-shrink-0" />
          <div className="w-4 h-0.5 bg-muted-foreground/20" />
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function ProcessEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { templates, updateTemplate } = useProcessTemplates();
  const { steps, isLoading, createStep, updateStep, deleteStep, reorderSteps } = useProcessSteps(id);
  const { roles: staffRoles, rolesByDepartment, departmentLabels } = useStaffRoles();
  const { branches } = useNeoTeamBranches();

  const template = useMemo(() => templates.find(t => t.id === id), [templates, id]);

  const [showStepDialog, setShowStepDialog] = useState(false);
  const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [stepForm, setStepForm] = useState({
    name: '', description: '', step_type: 'manual' as string,
    responsible_role: '', responsible_user_id: '', relative_day: '' as string, duration_hours: '24',
    is_required: true, dependencies: [] as string[],
  });

  const { data: systemUsers = [] } = useQuery({
    queryKey: ['neoteam-system-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neohub_users')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  const sortedByDay = useMemo(() => [...steps].sort((a, b) => (a.relative_day ?? 99) - (b.relative_day ?? 99)), [steps]);
  const dayGroups = useMemo(() => {
    const groups: Record<string, ProcessStep[]> = {};
    sortedByDay.forEach(s => {
      const key = getPhaseLabel(s);
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [sortedByDay]);

  const openCreateStep = () => {
    setEditingStep(null);
    setStepForm({
      name: '', description: '', step_type: 'manual',
      responsible_role: '', responsible_user_id: '', relative_day: '', duration_hours: '24',
      is_required: true, dependencies: [],
    });
    setShowStepDialog(true);
  };

  const openEditStep = (step: ProcessStep) => {
    setEditingStep(step);
    setStepForm({
      name: step.name, description: step.description || '', step_type: step.step_type,
      responsible_role: step.responsible_role || '', responsible_user_id: step.responsible_user_id || '',
      relative_day: step.relative_day?.toString() || '', duration_hours: step.duration_hours.toString(),
      is_required: step.is_required, dependencies: step.dependencies || [],
    });
    setShowStepDialog(true);
  };

  const handleSaveStep = async () => {
    if (!stepForm.name.trim() || !id) return;
    const data = {
      name: stepForm.name, description: stepForm.description || null,
      step_type: stepForm.step_type, responsible_role: stepForm.responsible_role || null,
      responsible_user_id: stepForm.responsible_user_id || null,
      relative_day: stepForm.relative_day ? parseInt(stepForm.relative_day) : null,
      duration_hours: parseInt(stepForm.duration_hours) || 24, is_required: stepForm.is_required,
    };
    if (editingStep) {
      await updateStep.mutateAsync({ id: editingStep.id, ...data });
    } else {
      await createStep.mutateAsync({ template_id: id, ...data });
    }
    setShowStepDialog(false);
  };

  const handleActivate = () => {
    if (id && steps.length > 0) updateTemplate.mutate({ id, status: 'active' });
  };

  if (!template) {
    return (
      <ModuleLayout>
        <div className="p-6 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ModuleLayout>
    );
  }

  const phaseKeys = Object.keys(dayGroups);

  return (
    <ModuleLayout>
      <div className="p-4 lg:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/neoteam/processos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Workflow className="h-5 w-5 text-primary" />
              {editingName ? (
                <form
                  className="flex items-center gap-2"
                  onSubmit={e => {
                    e.preventDefault();
                    if (nameValue.trim() && id) {
                      updateTemplate.mutate({ id, name: nameValue.trim() });
                      setEditingName(false);
                    }
                  }}
                >
                  <Input
                    value={nameValue}
                    onChange={e => setNameValue(e.target.value)}
                    className="h-8 text-lg font-bold w-[260px]"
                    autoFocus
                    onBlur={() => {
                      if (nameValue.trim() && id) {
                        updateTemplate.mutate({ id, name: nameValue.trim() });
                      }
                      setEditingName(false);
                    }}
                  />
                </form>
              ) : (
                <button
                  className="flex items-center gap-1.5 group/name hover:bg-muted/50 px-2 py-1 rounded-lg transition-colors"
                  onClick={() => { setNameValue(template.name); setEditingName(true); }}
                >
                  <h1 className="text-xl font-bold text-foreground">{template.name}</h1>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity" />
                </button>
              )}
              <Badge variant="outline" className="text-xs">
                {template.status === 'active' ? 'Ativo' : template.status === 'draft' ? 'Rascunho' : 'Arquivado'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 ml-8 mt-1 flex-wrap">
              {template.description && (
                <p className="text-sm text-muted-foreground">{template.description}</p>
              )}
              <span className="text-muted-foreground">•</span>
              <Select
                value={template.category || '__none__'}
                onValueChange={v => id && updateTemplate.mutate({ id, category: v === '__none__' ? '' : v })}
              >
                <SelectTrigger className="h-7 w-[180px] text-xs">
                  <SelectValue placeholder="Categoria..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem categoria</SelectItem>
                  {CATEGORY_OPTIONS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">•</span>
              <Select
                value={template.branch_id || '__none__'}
                onValueChange={v => id && updateTemplate.mutate({ id, branch_id: v === '__none__' ? null : v })}
              >
                <SelectTrigger className="h-7 w-[180px] text-xs">
                  <SelectValue placeholder="Filial..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Todas as filiais</SelectItem>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            {template.status === 'draft' && steps.length > 0 && (
              <Button onClick={handleActivate} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Play className="h-4 w-4" /> Ativar
              </Button>
            )}
            <Button onClick={openCreateStep} className="gap-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white">
              <Plus className="h-4 w-4" /> Adicionar Etapa
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-muted/30 border border-muted-foreground/10 text-xs text-muted-foreground flex-wrap">
          <span className="font-semibold text-foreground/70">Legenda:</span>
          <span className="flex items-center gap-1.5">
            <div className="w-5 h-4 rounded border-2 border-blue-400/60 bg-blue-500/10" />
            Manual
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-5 h-4 rounded border-2 border-violet-400/60 bg-violet-500/10 ring-1 ring-violet-400/20" />
            Automática
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-5 h-4 rounded border-2 border-amber-400/60 bg-amber-500/10" />
            Aprovação
          </span>
          <span className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
            Fluxo sequencial
          </span>
        </div>

        <Separator />

        {/* Horizontal BPMN Diagram */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
              <Workflow className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className="text-lg font-medium text-foreground">Nenhuma etapa definida</p>
            <p className="text-sm text-muted-foreground">Comece adicionando as etapas do processo para montar o fluxo BPMN.</p>
            <Button onClick={openCreateStep} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar primeira etapa
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4 -mx-4 px-4" style={{ scrollbarWidth: 'thin' }}>
            <div className="flex items-center min-w-max py-4">
              {/* Start Event */}
              <div className="flex flex-col items-center flex-shrink-0 mr-3">
                <div className="w-10 h-10 rounded-full border-[3px] border-emerald-400 bg-emerald-500/10 flex items-center justify-center">
                  <Play className="h-4 w-4 text-emerald-400 ml-0.5" />
                </div>
                <span className="text-[9px] text-emerald-400 font-semibold mt-1 tracking-wider uppercase">Início</span>
              </div>

              {/* Connector from start */}
              <div className="flex items-center flex-shrink-0 mr-2">
                <div className="w-6 h-0.5 bg-emerald-400/40" />
                <ChevronRight className="h-3.5 w-3.5 text-emerald-400/40 -ml-1" />
              </div>

              {/* Swim Lanes */}
              {phaseKeys.map((phaseKey, idx) => (
                <HSwimLane
                  key={phaseKey}
                  phaseKey={phaseKey}
                  stepsInPhase={dayGroups[phaseKey]}
                  allSteps={steps}
                  staffRoles={staffRoles}
                  systemUsers={systemUsers}
                  onEdit={openEditStep}
                  onDelete={stepId => deleteStep.mutate(stepId)}
                  isLastLane={idx === phaseKeys.length - 1}
                />
              ))}

              {/* Connector to end */}
              <div className="flex items-center flex-shrink-0 ml-2">
                <div className="w-6 h-0.5 bg-red-400/40" />
                <ChevronRight className="h-3.5 w-3.5 text-red-400/40 -ml-1" />
              </div>

              {/* End Event */}
              <div className="flex flex-col items-center flex-shrink-0 ml-3">
                <div className="w-10 h-10 rounded-full border-[3px] border-red-400 bg-red-500/10 flex items-center justify-center">
                  <Square className="h-3.5 w-3.5 text-red-400" />
                </div>
                <span className="text-[9px] text-red-400 font-semibold mt-1 tracking-wider uppercase">Fim</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step Dialog - unchanged */}
      <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStep ? 'Editar Etapa' : 'Nova Etapa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da Etapa *</Label>
              <Input placeholder="Ex: Solicitar exames pré-operatórios" value={stepForm.name} onChange={e => setStepForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea placeholder="Descreva o que deve ser feito nesta etapa..." value={stepForm.description} onChange={e => setStepForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={stepForm.step_type} onValueChange={v => setStepForm(p => ({ ...p, step_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STEP_TYPE_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cargo / Setor</Label>
                <Select value={stepForm.responsible_role} onValueChange={v => setStepForm(p => ({ ...p, responsible_role: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar cargo..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(rolesByDepartment).map(([dept, deptRoles]) => (
                      <React.Fragment key={dept}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{departmentLabels[dept] || dept}</div>
                        {deptRoles.map(r => (
                          <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
                        ))}
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Responsável (Usuário)</Label>
              <Select value={stepForm.responsible_user_id || '__none__'} onValueChange={v => setStepForm(p => ({ ...p, responsible_user_id: v === '__none__' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar usuário responsável..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum (apenas cargo)</SelectItem>
                  {systemUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name}{u.email ? ` (${u.email})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prazo Relativo</Label>
                <Select value={stepForm.relative_day} onValueChange={v => setStepForm(p => ({ ...p, relative_day: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar dia..." /></SelectTrigger>
                  <SelectContent>
                    {RELATIVE_DAY_OPTIONS.map(d => (
                      <SelectItem key={d.value} value={d.value.toString()}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duração (horas)</Label>
                <Input type="number" value={stepForm.duration_hours} onChange={e => setStepForm(p => ({ ...p, duration_hours: e.target.value }))} />
              </div>
            </div>
            {steps.length > 0 && (
              <div className="space-y-2">
                <Label>Dependências</Label>
                <div className="flex flex-wrap gap-2">
                  {steps.filter(s => s.id !== editingStep?.id).map(s => (
                    <Badge
                      key={s.id}
                      variant={stepForm.dependencies.includes(s.id) ? 'default' : 'outline'}
                      className="cursor-pointer transition-colors"
                      onClick={() => setStepForm(p => ({
                        ...p,
                        dependencies: p.dependencies.includes(s.id) ? p.dependencies.filter(d => d !== s.id) : [...p.dependencies, s.id],
                      }))}
                    >
                      <Link2 className="h-3 w-3 mr-1" />{s.name}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Essa etapa depende da conclusão anterior.</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={stepForm.is_required} onCheckedChange={v => setStepForm(p => ({ ...p, is_required: v }))} />
              <Label>Etapa obrigatória</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStepDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleSaveStep}
              disabled={!stepForm.name.trim() || createStep.isPending || updateStep.isPending}
              className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white"
            >
              {(createStep.isPending || updateStep.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{editingStep ? 'Salvar' : 'Adicionar'}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
