import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ModuleLayout } from '@/components/ModuleLayout';
import { useProcessTemplates, useProcessSteps, ProcessStep } from '@/hooks/useProcessTemplates';
import { useStaffRoles } from '@/neohub/hooks/useStaffRoles';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Plus, GripVertical, Pencil, Trash2, Clock, User,
  Link2, CheckCircle2, Cog, ShieldCheck, Loader2, Save, Play,
  ChevronDown, ChevronUp, AlertCircle, Circle, Diamond, Square,
  ArrowDownCircle, Timer, Flag, Workflow,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── BPMN-inspired config ─── */
const STEP_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; shape: string; color: string; bgGlow: string }> = {
  manual: {
    label: 'Tarefa Manual',
    icon: <User className="h-4 w-4" />,
    shape: 'rounded-xl',
    color: 'border-blue-400 text-blue-400',
    bgGlow: 'from-blue-500/10 to-blue-600/5',
  },
  automatic: {
    label: 'Tarefa Automática',
    icon: <Cog className="h-4 w-4" />,
    shape: 'rounded-xl',
    color: 'border-violet-400 text-violet-400',
    bgGlow: 'from-violet-500/10 to-violet-600/5',
  },
  approval: {
    label: 'Gateway de Aprovação',
    icon: <ShieldCheck className="h-4 w-4" />,
    shape: 'rounded-xl',
    color: 'border-amber-400 text-amber-400',
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

/* ─── BPMN Node Component ─── */
function BpmnNode({
  step,
  steps,
  staffRoles,
  systemUsers,
  templateColor,
  onEdit,
  onDelete,
  isLast,
}: {
  step: ProcessStep;
  steps: ProcessStep[];
  staffRoles: { code: string; name: string }[];
  systemUsers: { id: string; full_name: string; email: string | null }[];
  templateColor: string;
  onEdit: (s: ProcessStep) => void;
  onDelete: (id: string) => void;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const typeCfg = STEP_TYPE_CONFIG[step.step_type] || STEP_TYPE_CONFIG.manual;
  const meta = (step.metadata || {}) as Record<string, unknown>;
  const userName = systemUsers.find(u => u.id === step.responsible_user_id)?.full_name;
  const roleLabel = staffRoles.find(r => r.code === step.responsible_role)?.name || step.responsible_role;
  const responsibleName = userName || (meta.responsible_name as string | undefined);
  const hasDeps = step.dependencies && step.dependencies.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* BPMN Node */}
      <div
        className={cn(
          'group relative w-full max-w-md transition-all duration-200',
          step.step_type === 'approval' ? 'px-4' : '',
        )}
      >
        {/* Approval: diamond wrapper */}
        {step.step_type === 'approval' ? (
          <div className="relative">
            {/* Diamond background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-8 h-8 rotate-45 border-2 border-amber-400/30"
                style={{ position: 'absolute', left: -16, top: '50%', marginTop: -16 }}
              />
            </div>
            <div
              className={cn(
                'relative border-2 border-amber-400/60 bg-gradient-to-br',
                typeCfg.bgGlow,
                typeCfg.shape,
                'p-4 cursor-pointer backdrop-blur-sm',
              )}
              onClick={() => setExpanded(!expanded)}
            >
              <NodeContent
                step={step} typeCfg={typeCfg} responsibleName={responsibleName}
                roleLabel={roleLabel} expanded={expanded}
                onEdit={onEdit} onDelete={onDelete} steps={steps} hasDeps={hasDeps}
              />
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'relative border-2 bg-gradient-to-br',
              step.step_type === 'automatic' ? 'border-violet-400/60' : 'border-blue-400/60',
              typeCfg.bgGlow,
              typeCfg.shape,
              'p-4 cursor-pointer backdrop-blur-sm',
              // BPMN visual: automatic tasks have double border
              step.step_type === 'automatic' && 'ring-2 ring-violet-400/20 ring-offset-1 ring-offset-transparent',
            )}
            onClick={() => setExpanded(!expanded)}
          >
            <NodeContent
              step={step} typeCfg={typeCfg} responsibleName={responsibleName}
              roleLabel={roleLabel} expanded={expanded}
              onEdit={onEdit} onDelete={onDelete} steps={steps} hasDeps={hasDeps}
            />
          </div>
        )}
      </div>

      {/* Connector arrow to next */}
      {!isLast && (
        <div className="flex flex-col items-center py-1">
          <div className="w-0.5 h-5 bg-muted-foreground/30" />
          <ArrowDownCircle className="h-4 w-4 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}

function NodeContent({
  step, typeCfg, responsibleName, roleLabel, expanded,
  onEdit, onDelete, steps, hasDeps,
}: {
  step: ProcessStep;
  typeCfg: typeof STEP_TYPE_CONFIG['manual'];
  responsibleName?: string;
  roleLabel?: string;
  expanded: boolean;
  onEdit: (s: ProcessStep) => void;
  onDelete: (id: string) => void;
  steps: ProcessStep[];
  hasDeps: boolean;
}) {
  return (
    <>
      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div className={cn('flex-shrink-0 p-2 rounded-lg border bg-background/50', typeCfg.color)}>
          {typeCfg.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm">{step.name}</span>
            {!step.is_required && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground px-1.5 py-0">
                Opcional
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className={cn('font-medium', typeCfg.color.split(' ')[1])}>{typeCfg.label}</span>
            {step.duration_hours && (
              <span className="flex items-center gap-0.5">
                <Timer className="h-3 w-3" /> {step.duration_hours}h
              </span>
            )}
          </div>
          {step.description && !expanded && (
            <p className="text-xs text-muted-foreground/70 mt-1 truncate max-w-[280px]">{step.description}</p>
          )}
        </div>

        {/* Responsible */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {(responsibleName || roleLabel) && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-full">
              <User className="h-3 w-3" /> {responsibleName || roleLabel}
            </span>
          )}
          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); onEdit(step); }}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={e => { e.stopPropagation(); onDelete(step.id); }}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-muted-foreground/10 space-y-2">
          {step.description && (
            <p className="text-xs text-muted-foreground">{step.description}</p>
          )}
          <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
            {responsibleName && roleLabel && (
              <span className="flex items-center gap-1 bg-muted/30 px-2 py-0.5 rounded">
                <User className="h-3 w-3" /> {responsibleName} · {roleLabel}
              </span>
            )}
            {hasDeps && (
              <span className="flex items-center gap-1 bg-muted/30 px-2 py-0.5 rounded">
                <Link2 className="h-3 w-3" />
                Depende de: {step.dependencies!.map(d => steps.find(s => s.id === d)?.name || '?').join(', ')}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Swim Lane (Phase Group) ─── */
function SwimLane({
  phaseKey,
  stepsInPhase,
  allSteps,
  staffRoles,
  systemUsers,
  templateColor,
  onEdit,
  onDelete,
  isLastLane,
}: {
  phaseKey: string;
  stepsInPhase: ProcessStep[];
  allSteps: ProcessStep[];
  staffRoles: { code: string; name: string }[];
  systemUsers: { id: string; full_name: string; email: string | null }[];
  templateColor: string;
  onEdit: (s: ProcessStep) => void;
  onDelete: (id: string) => void;
  isLastLane: boolean;
}) {
  const phaseConfig = getPhaseConfig(phaseKey);

  return (
    <div className="relative">
      {/* Swim Lane Container */}
      <div className={cn('border rounded-2xl overflow-hidden', phaseConfig.border, phaseConfig.bg)}>
        {/* Lane Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: phaseConfig.accent + '30' }}>
          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: phaseConfig.accent }} />
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4" style={{ color: phaseConfig.accent }} />
            <h3 className={cn('font-bold text-sm tracking-wide', phaseConfig.text)}>
              {phaseKey}
            </h3>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] ml-auto"
            style={{ borderColor: phaseConfig.accent + '50', color: phaseConfig.accent }}
          >
            {stepsInPhase.length} {stepsInPhase.length === 1 ? 'etapa' : 'etapas'}
          </Badge>
        </div>

        {/* Lane Body - Nodes */}
        <div className="px-5 py-4">
          <div className="flex flex-col items-center">
            {stepsInPhase.map((step, idx) => (
              <BpmnNode
                key={step.id}
                step={step}
                steps={allSteps}
                staffRoles={staffRoles}
                systemUsers={systemUsers}
                templateColor={templateColor}
                onEdit={onEdit}
                onDelete={onDelete}
                isLast={idx === stepsInPhase.length - 1}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Lane-to-lane connector */}
      {!isLastLane && (
        <div className="flex flex-col items-center py-2">
          <div className="w-0.5 h-4 bg-muted-foreground/20" />
          <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/30 bg-background" />
          <div className="w-0.5 h-4 bg-muted-foreground/20" />
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

  const template = useMemo(() => templates.find(t => t.id === id), [templates, id]);

  const [showStepDialog, setShowStepDialog] = useState(false);
  const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);
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

  // Group steps by phase (relative day)
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
      name: step.name,
      description: step.description || '',
      step_type: step.step_type,
      responsible_role: step.responsible_role || '',
      responsible_user_id: step.responsible_user_id || '',
      relative_day: step.relative_day?.toString() || '',
      duration_hours: step.duration_hours.toString(),
      is_required: step.is_required,
      dependencies: step.dependencies || [],
    });
    setShowStepDialog(true);
  };

  const handleSaveStep = async () => {
    if (!stepForm.name.trim() || !id) return;
    const data = {
      name: stepForm.name,
      description: stepForm.description || null,
      step_type: stepForm.step_type,
      responsible_role: stepForm.responsible_role || null,
      responsible_user_id: stepForm.responsible_user_id || null,
      relative_day: stepForm.relative_day ? parseInt(stepForm.relative_day) : null,
      duration_hours: parseInt(stepForm.duration_hours) || 24,
      is_required: stepForm.is_required,
    };

    if (editingStep) {
      await updateStep.mutateAsync({ id: editingStep.id, ...data });
    } else {
      await createStep.mutateAsync({ template_id: id, ...data });
    }
    setShowStepDialog(false);
  };

  const handleActivate = () => {
    if (id && steps.length > 0) {
      updateTemplate.mutate({ id, status: 'active' });
    }
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
      <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/neoteam/processos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Workflow className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">{template.name}</h1>
              <Badge variant="outline" className="text-xs">
                {template.status === 'active' ? 'Ativo' : template.status === 'draft' ? 'Rascunho' : 'Arquivado'}
              </Badge>
            </div>
            {template.description && (
              <p className="text-sm text-muted-foreground mt-1 ml-8">{template.description}</p>
            )}
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

        {/* BPMN Legend */}
        <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-muted/30 border border-muted-foreground/10 text-xs text-muted-foreground flex-wrap">
          <span className="font-semibold text-foreground/70">Legenda BPMN:</span>
          <span className="flex items-center gap-1.5">
            <div className="w-5 h-4 rounded border-2 border-blue-400/60 bg-blue-500/10" />
            Tarefa Manual
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-5 h-4 rounded border-2 border-violet-400/60 bg-violet-500/10 ring-1 ring-violet-400/20" />
            Tarefa Automática
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-5 h-4 rounded border-2 border-amber-400/60 bg-amber-500/10" />
            Aprovação/Gateway
          </span>
          <span className="flex items-center gap-1.5">
            <ArrowDownCircle className="h-3.5 w-3.5 text-muted-foreground/40" />
            Fluxo sequencial
          </span>
        </div>

        <Separator />

        {/* BPMN Diagram */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
              <Workflow className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">Nenhuma etapa definida</p>
              <p className="text-sm text-muted-foreground mt-1">
                Comece adicionando as etapas do processo para montar o fluxo BPMN.
              </p>
            </div>
            <Button onClick={openCreateStep} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar primeira etapa
            </Button>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Start Event */}
            <div className="flex flex-col items-center mb-3">
              <div className="w-10 h-10 rounded-full border-[3px] border-emerald-400 bg-emerald-500/10 flex items-center justify-center">
                <Play className="h-4 w-4 text-emerald-400 ml-0.5" />
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold mt-1 tracking-wider uppercase">Início</span>
              <div className="w-0.5 h-4 bg-muted-foreground/20 mt-1" />
            </div>

            {/* Swim Lanes */}
            {phaseKeys.map((phaseKey, idx) => (
              <SwimLane
                key={phaseKey}
                phaseKey={phaseKey}
                stepsInPhase={dayGroups[phaseKey]}
                allSteps={steps}
                staffRoles={staffRoles}
                systemUsers={systemUsers}
                templateColor={template.color}
                onEdit={openEditStep}
                onDelete={id => deleteStep.mutate(id)}
                isLastLane={idx === phaseKeys.length - 1}
              />
            ))}

            {/* End Event */}
            <div className="flex flex-col items-center mt-3">
              <div className="w-0.5 h-4 bg-muted-foreground/20 mb-1" />
              <div className="w-10 h-10 rounded-full border-[3px] border-red-400 bg-red-500/10 flex items-center justify-center">
                <Square className="h-3.5 w-3.5 text-red-400" />
              </div>
              <span className="text-[10px] text-red-400 font-semibold mt-1 tracking-wider uppercase">Fim</span>
            </div>
          </div>
        )}
      </div>

      {/* Step Dialog */}
      <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStep ? 'Editar Etapa' : 'Nova Etapa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da Etapa *</Label>
              <Input
                placeholder="Ex: Solicitar exames pré-operatórios"
                value={stepForm.name}
                onChange={e => setStepForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descreva o que deve ser feito nesta etapa..."
                value={stepForm.description}
                onChange={e => setStepForm(p => ({ ...p, description: e.target.value }))}
                rows={2}
              />
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
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {departmentLabels[dept] || dept}
                        </div>
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
                <Input
                  type="number"
                  value={stepForm.duration_hours}
                  onChange={e => setStepForm(p => ({ ...p, duration_hours: e.target.value }))}
                />
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
                      onClick={() => {
                        setStepForm(p => ({
                          ...p,
                          dependencies: p.dependencies.includes(s.id)
                            ? p.dependencies.filter(d => d !== s.id)
                            : [...p.dependencies, s.id],
                        }));
                      }}
                    >
                      <Link2 className="h-3 w-3 mr-1" />
                      {s.name}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Essa etapa depende da conclusão anterior.
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                checked={stepForm.is_required}
                onCheckedChange={v => setStepForm(p => ({ ...p, is_required: v }))}
              />
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
              {(createStep.isPending || updateStep.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>{editingStep ? 'Salvar' : 'Adicionar'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
