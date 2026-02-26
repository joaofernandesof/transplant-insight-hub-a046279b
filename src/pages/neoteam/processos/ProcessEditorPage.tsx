import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModuleLayout } from '@/components/ModuleLayout';
import { useProcessTemplates, useProcessSteps, ProcessStep } from '@/hooks/useProcessTemplates';
import { useStaffRoles } from '@/neohub/hooks/useStaffRoles';
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
  ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEP_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  manual: { label: 'Manual', icon: <User className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  automatic: { label: 'Automática', icon: <Cog className="h-3.5 w-3.5" />, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  approval: { label: 'Aprovação', icon: <ShieldCheck className="h-3.5 w-3.5" />, color: 'bg-amber-100 text-amber-700 border-amber-200' },
};

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
    responsible_role: '', relative_day: '' as string, duration_hours: '24',
    is_required: true, dependencies: [] as string[],
  });
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // These must be before any early returns
  const sortedByDay = useMemo(() => [...steps].sort((a, b) => (a.relative_day ?? 99) - (b.relative_day ?? 99)), [steps]);
  const dayGroups = useMemo(() => {
    const groups: Record<string, ProcessStep[]> = {};
    sortedByDay.forEach(s => {
      const key = formatRelativeDay(s.relative_day);
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [sortedByDay]);

  const openCreateStep = () => {
    setEditingStep(null);
    setStepForm({
      name: '', description: '', step_type: 'manual',
      responsible_role: '', relative_day: '', duration_hours: '24',
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

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newOrder = [...steps];
    const [dragged] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, dragged);
    setDraggedIndex(index);
    reorderSteps.mutate(newOrder.map(s => s.id));
  };
  const handleDragEnd = () => setDraggedIndex(null);

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

  // dayGroups already computed above, no need to redeclare

  return (
    <ModuleLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/neoteam/processos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: template.color }} />
              <h1 className="text-xl font-bold text-foreground">{template.name}</h1>
              <Badge variant="outline" className="text-xs">
                {template.status === 'active' ? 'Ativo' : template.status === 'draft' ? 'Rascunho' : 'Arquivado'}
              </Badge>
            </div>
            {template.description && (
              <p className="text-sm text-muted-foreground mt-1 ml-6">{template.description}</p>
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

        <Separator />

        {/* Timeline View */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">Nenhuma etapa definida</p>
              <p className="text-sm text-muted-foreground mt-1">
                Comece adicionando as etapas do processo para montar o fluxo.
              </p>
            </div>
            <Button onClick={openCreateStep} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar primeira etapa
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Steps list with timeline line */}
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-border" />

              <div className="space-y-2">
                {steps.map((step, index) => {
                  const typeCfg = STEP_TYPE_CONFIG[step.step_type] || STEP_TYPE_CONFIG.manual;
                  const isExpanded = expandedStep === step.id;
                  const roleLabel = staffRoles.find(r => r.code === step.responsible_role)?.name || step.responsible_role;
                  const hasDeps = step.dependencies && step.dependencies.length > 0;
                  const meta = (step.metadata || {}) as Record<string, unknown>;
                  const phaseColor = (meta.phase_color as string) || template.color;
                  const phaseLabel = meta.phase_label as string | undefined;
                  const responsibleName = meta.responsible_name as string | undefined;

                  return (
                    <div
                      key={step.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={e => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'relative flex items-start gap-3 group transition-all',
                        draggedIndex === index && 'opacity-50',
                      )}
                    >
                      {/* Timeline dot */}
                      <div className="relative z-10 mt-3.5 flex-shrink-0">
                        <div
                          className="w-[14px] h-[14px] rounded-full border-2 border-background"
                          style={{ backgroundColor: phaseColor }}
                        />
                      </div>

                      {/* Step card */}
                      <Card className="flex-1 border transition-shadow hover:shadow-sm border-l-[3px]" style={{ borderLeftColor: phaseColor }}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-foreground">{step.name}</span>
                                <Badge variant="outline" className={cn('text-xs gap-1', typeCfg.color)}>
                                  {typeCfg.icon} {typeCfg.label}
                                </Badge>
                                {phaseLabel && (
                                  <Badge className="text-xs text-white font-mono" style={{ backgroundColor: phaseColor }}>
                                    {phaseLabel}
                                  </Badge>
                                )}
                                {step.relative_day !== null && !phaseLabel && (
                                  <Badge variant="secondary" className="text-xs font-mono">
                                    {formatRelativeDay(step.relative_day)}
                                  </Badge>
                                )}
                                {!step.is_required && (
                                  <Badge variant="outline" className="text-xs text-muted-foreground">Opcional</Badge>
                                )}
                              </div>
                              {step.description && !isExpanded && (
                                <p className="text-xs text-muted-foreground mt-1 truncate">{step.description}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              {(responsibleName || roleLabel) && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1 mr-2">
                                  <User className="h-3 w-3" /> {responsibleName || roleLabel}
                                </span>
                              )}
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                              >
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => openEditStep(step)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                                onClick={() => deleteStep.mutate(step.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                              {step.description && (
                                <p className="text-muted-foreground">{step.description}</p>
                              )}
                              <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> Duração: {step.duration_hours}h
                                </span>
                                {responsibleName && roleLabel && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" /> {responsibleName} ({roleLabel})
                                  </span>
                                )}
                                {hasDeps && (
                                  <span className="flex items-center gap-1">
                                    <Link2 className="h-3 w-3" />
                                    Depende de: {step.dependencies!.map(d => {
                                      const dep = steps.find(s => s.id === d);
                                      return dep?.name || '?';
                                    }).join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
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
                <Label>Responsável</Label>
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
