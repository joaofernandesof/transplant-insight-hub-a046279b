/**
 * StepFluxoSimple - Etapa de Fluxo de Atendimento
 * 
 * Mostra os passos cronológicos e extras do atendimento
 * com templates dinâmicos baseados no objetivo selecionado.
 * Suporta drag-and-drop para reordenar e adicionar novos passos.
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Pencil, Check, X, Lightbulb, ArrowRight, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FluxoAtendimento, FluxoStep, AgentObjectives, AgentObjective, CustomObjective } from '../../../types';
import { getFluxoByObjective, OBJECTIVE_TEMPLATE_LABELS } from '../../../fluxoTemplates';

// Mapeamento de objetivos secundários para passos extras
const SECONDARY_OBJECTIVE_TO_STEP: Record<AgentObjective, { titulo: string; descricao: string; exemploMensagem: string }> = {
  'agendar_presencial': {
    titulo: 'Agendar Consulta Presencial',
    descricao: 'Quando o lead demonstrar interesse em agendar uma consulta presencial, ofereça datas disponíveis usando a técnica "ou/ou" com 2 opções.',
    exemploMensagem: 'Tenho disponível {dia1} às {hora1} ou {dia2} às {hora2}. Qual fica melhor para você?',
  },
  'agendar_online': {
    titulo: 'Agendar Consulta Online',
    descricao: 'Quando o lead quiser agendar uma reunião online/videoconferência, ofereça datas disponíveis e explique como será o acesso.',
    exemploMensagem: 'Para a reunião online, tenho {dia1} às {hora1} ou {dia2} às {hora2}. Você receberá o link por WhatsApp. Qual prefere?',
  },
  'agendar_domicilio': {
    titulo: 'Agendar Visita em Domicílio',
    descricao: 'Quando o lead preferir atendimento em domicílio, confirme o endereço e ofereça datas disponíveis.',
    exemploMensagem: 'Para a visita em domicílio, preciso confirmar seu endereço. Tenho disponível {dia1} às {hora1} ou {dia2} às {hora2}.',
  },
  'vender_produto': {
    titulo: 'Apresentar Produtos',
    descricao: 'Quando o lead demonstrar interesse em produtos, apresente o catálogo, destaque benefícios e facilite a compra.',
    exemploMensagem: 'Temos ótimas opções! Posso te mostrar nosso catálogo? Qual categoria te interessa mais?',
  },
  'delivery': {
    titulo: 'Fazer Pedido Delivery',
    descricao: 'Quando o lead quiser fazer um pedido para entrega, anote os itens, confirme endereço e forma de pagamento.',
    exemploMensagem: 'Vamos fazer seu pedido! O que você gostaria hoje?',
  },
  'capturar_lead': {
    titulo: 'Coletar Informações',
    descricao: 'Quando precisar capturar dados do lead para contato posterior, colete nome, telefone e/ou e-mail de forma natural.',
    exemploMensagem: 'Para te manter informado(a), qual seu melhor e-mail ou telefone?',
  },
  'custom': {
    titulo: 'Objetivo Personalizado',
    descricao: 'Execute o objetivo personalizado conforme definido.',
    exemploMensagem: '',
  },
};

// Função para gerar passos extras a partir dos objetivos secundários
function generateSecondarySteps(
  objectives: AgentObjectives,
  existingExtras: FluxoStep[]
): FluxoStep[] {
  const secondarySteps: FluxoStep[] = [];
  let ordem = existingExtras.length + 1;

  // Adicionar objetivos secundários padrão
  for (const secondaryId of objectives.secondary || []) {
    const stepTemplate = SECONDARY_OBJECTIVE_TO_STEP[secondaryId];
    if (stepTemplate) {
      // Verificar se já existe um passo com este objetivo
      const alreadyExists = existingExtras.some(e => e.id === `secondary_${secondaryId}`);
      if (!alreadyExists) {
        secondarySteps.push({
          id: `secondary_${secondaryId}`,
          ordem: ordem++,
          titulo: stepTemplate.titulo,
          descricao: stepTemplate.descricao,
          exemploMensagem: stepTemplate.exemploMensagem,
        });
      }
    }
  }

  // Adicionar objetivos secundários customizados
  for (const customId of objectives.secondaryCustomIds || []) {
    const custom = objectives.customObjectives?.find(c => c.id === customId);
    if (custom) {
      const alreadyExists = existingExtras.some(e => e.id === `secondary_custom_${customId}`);
      if (!alreadyExists) {
        secondarySteps.push({
          id: `secondary_custom_${customId}`,
          ordem: ordem++,
          titulo: custom.name,
          descricao: custom.context || custom.description,
          exemploMensagem: '',
        });
      }
    }
  }

  return secondarySteps;
}

interface StepFluxoSimpleProps {
  fluxoAtendimento: FluxoAtendimento;
  objectives: AgentObjectives;
  attendantName: string;
  companyName: string;
  onChange: (fluxo: FluxoAtendimento) => void;
}

interface EditingState {
  stepId: string;
  field: 'titulo' | 'descricao' | 'exemploMensagem';
}

// Componente Sortable para cada passo
interface SortableStepItemProps {
  step: FluxoStep;
  type: 'passosCronologicos' | 'passosExtras';
  displayOrder: number;
  renderStep: (step: FluxoStep, type: 'passosCronologicos' | 'passosExtras', displayOrder: number) => React.ReactNode;
}

function SortableStepItem({ step, type, displayOrder, renderStep }: SortableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {renderStep(step, type, displayOrder)}
    </div>
  );
}

export function StepFluxoSimple({
  fluxoAtendimento,
  objectives,
  attendantName,
  companyName,
  onChange,
}: StepFluxoSimpleProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [editValue, setEditValue] = useState('');

  // Carregar template baseado no objetivo quando a etapa é montada ou objetivo mudar
  useEffect(() => {
    // Se tem objetivo primário, sempre carrega/atualiza o template
    if (objectives.primary) {
      const template = getFluxoByObjective(objectives.primary);
      
      // Adicionar objetivos secundários como passos extras (se houver e não for "Nenhum")
      const hasSecondaryObjectives = 
        (objectives.secondary && objectives.secondary.length > 0) ||
        (objectives.secondaryCustomIds && objectives.secondaryCustomIds.length > 0);
      
      if (hasSecondaryObjectives) {
        const secondarySteps = generateSecondarySteps(objectives, template.passosExtras || []);
        template.passosExtras = [...(template.passosExtras || []), ...secondarySteps];
      }
      
      onChange(template);
    }
  }, [objectives.primary]);

  // Atualizar passos extras quando objetivos secundários mudarem
  useEffect(() => {
    // Verificar se há objetivos secundários selecionados
    const hasSecondaryObjectives = 
      (objectives.secondary && objectives.secondary.length > 0) ||
      (objectives.secondaryCustomIds && objectives.secondaryCustomIds.length > 0);
    
    if (!hasSecondaryObjectives) return;
    
    // Filtrar passos extras que NÃO são de objetivos secundários (manter os originais do template)
    const nonSecondaryExtras = (fluxoAtendimento.passosExtras || []).filter(
      step => !step.id.startsWith('secondary_')
    );
    
    // Gerar novos passos extras baseados nos objetivos secundários atuais
    const secondarySteps = generateSecondarySteps(objectives, []);
    
    // Mesclar: passos originais + passos de objetivos secundários
    const updatedExtras = [...nonSecondaryExtras];
    let ordem = nonSecondaryExtras.length + 1;
    
    for (const newStep of secondarySteps) {
      // Verificar se este objetivo secundário já tem um passo
      const existingIndex = (fluxoAtendimento.passosExtras || []).findIndex(e => e.id === newStep.id);
      if (existingIndex !== -1) {
        // Manter o passo existente (pode ter sido editado pelo usuário)
        updatedExtras.push({
          ...fluxoAtendimento.passosExtras![existingIndex],
          ordem: ordem++,
        });
      } else {
        // Adicionar novo passo
        updatedExtras.push({
          ...newStep,
          ordem: ordem++,
        });
      }
    }
    
    // Só atualizar se houver diferença
    const currentIds = (fluxoAtendimento.passosExtras || []).map(e => e.id).sort().join(',');
    const newIds = updatedExtras.map(e => e.id).sort().join(',');
    
    if (currentIds !== newIds) {
      onChange({
        ...fluxoAtendimento,
        passosExtras: updatedExtras,
      });
    }
  }, [objectives.secondary, objectives.secondaryCustomIds]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const startEditing = (stepId: string, field: 'titulo' | 'descricao' | 'exemploMensagem', currentValue: string) => {
    setEditing({ stepId, field });
    setEditValue(currentValue || '');
  };

  const saveEdit = (type: 'passosCronologicos' | 'passosExtras') => {
    if (!editing) return;

    const steps = [...fluxoAtendimento[type]];
    const stepIndex = steps.findIndex(s => s.id === editing.stepId);
    
    if (stepIndex !== -1) {
      steps[stepIndex] = {
        ...steps[stepIndex],
        [editing.field]: editValue,
      };
      
      onChange({
        ...fluxoAtendimento,
        [type]: steps,
      });
    }
    
    setEditing(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue('');
  };

  // Substituir placeholders no exemplo
  const formatExampleMessage = (message?: string) => {
    if (!message) return '';
    return message
      .replace(/{atendente}/g, attendantName || 'Assistente')
      .replace(/{empresa}/g, companyName || 'sua empresa')
      .replace(/{nome}/g, '[Nome do Lead]')
      .replace(/{lista_servicos}/g, '[Serviços disponíveis]')
      .replace(/{problema}/g, '[problema do lead]')
      .replace(/{dia1}/g, 'segunda (10/02)')
      .replace(/{dia2}/g, 'quarta (12/02)')
      .replace(/{hora1}/g, '14h')
      .replace(/{hora2}/g, '16h')
      .replace(/{data}/g, 'Quarta, 12/02/2025')
      .replace(/{horario}/g, '14:00')
      .replace(/{endereco}/g, '[Endereço da clínica]');
  };

  // Adicionar novo passo
  const addNewStep = (type: 'passosCronologicos' | 'passosExtras') => {
    const steps = [...(fluxoAtendimento[type] || [])];
    const newOrder = steps.length + 1;
    const newStep: FluxoStep = {
      id: `custom_${Date.now()}`,
      ordem: newOrder,
      titulo: 'Novo Passo',
      descricao: 'Descreva o que a IA deve fazer neste passo',
      exemploMensagem: '',
    };
    
    onChange({
      ...fluxoAtendimento,
      [type]: [...steps, newStep],
    });
  };

  // Remover passo
  const removeStep = (stepId: string, type: 'passosCronologicos' | 'passosExtras') => {
    const steps = fluxoAtendimento[type].filter(s => s.id !== stepId);
    // Reordenar
    const reorderedSteps = steps.map((s, idx) => ({ ...s, ordem: idx + 1 }));
    onChange({
      ...fluxoAtendimento,
      [type]: reorderedSteps,
    });
  };

  // Drag and drop handlers
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent, type: 'passosCronologicos' | 'passosExtras') => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const steps = [...fluxoAtendimento[type]];
      const oldIndex = steps.findIndex(s => s.id === active.id);
      const newIndex = steps.findIndex(s => s.id === over.id);

      const reorderedSteps = arrayMove(steps, oldIndex, newIndex).map((step, idx) => ({
        ...step,
        ordem: idx + 1,
      }));

      onChange({
        ...fluxoAtendimento,
        [type]: reorderedSteps,
      });
    }
  };

  const renderStep = (step: FluxoStep, type: 'passosCronologicos' | 'passosExtras', displayOrder: number) => {
    const isExpanded = expandedSteps.has(step.id);
    const isEditing = editing?.stepId === step.id;

    return (
      <div 
        className="border border-[hsl(var(--avivar-border))] rounded-lg overflow-hidden bg-[hsl(var(--avivar-card))]"
      >
        <Collapsible open={isExpanded} onOpenChange={() => toggleStep(step.id)}>
          <div className="flex items-center">
            {/* Drag Handle - não é mais parte do sortable, só visual */}
            <div 
              className="flex items-center justify-center w-10 cursor-grab active:cursor-grabbing hover:bg-[hsl(var(--avivar-muted)/0.5)] transition-colors py-4"
              title="Arraste para reordenar"
            >
              <GripVertical className="h-5 w-5 text-[hsl(var(--avivar-muted-foreground))]" />
            </div>
            
            <CollapsibleTrigger asChild>
              <div 
                className="flex-1 flex items-center justify-between p-4 hover:bg-[hsl(var(--avivar-muted)/0.5)] transition-colors cursor-pointer"
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[hsl(var(--avivar-primary))] text-white font-semibold text-sm">
                    {displayOrder}
                  </div>
                  <div className="text-left">
                    {isEditing && editing.field === 'titulo' ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-8 text-sm !bg-[hsl(var(--avivar-card))] !text-[hsl(var(--avivar-foreground))] border-[hsl(var(--avivar-border))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
                          autoFocus
                        />
                        <div 
                          className="h-8 w-8 flex items-center justify-center hover:bg-[hsl(var(--avivar-muted))] rounded cursor-pointer" 
                          onClick={(e) => { e.stopPropagation(); saveEdit(type); }}
                        >
                          <Check className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                        </div>
                        <div 
                          className="h-8 w-8 flex items-center justify-center hover:bg-[hsl(var(--avivar-muted))] rounded cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <span className="font-medium text-[hsl(var(--avivar-foreground))]">
                          {step.titulo}
                        </span>
                        <div
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[hsl(var(--avivar-muted))] rounded cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(step.id, 'titulo', step.titulo);
                          }}
                        >
                          <Pencil className="h-3 w-3 text-[hsl(var(--avivar-muted-foreground))]" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {step.exemploMensagem && (
                    <Badge variant="secondary" className="text-xs">
                      Exemplo
                    </Badge>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-[hsl(var(--avivar-muted-foreground))]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[hsl(var(--avivar-muted-foreground))]" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
            
            {/* Delete button */}
            <div
              className="flex items-center justify-center w-10 hover:bg-destructive/20 transition-colors py-4 cursor-pointer"
              title="Remover passo"
              onClick={() => removeStep(step.id, type)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </div>
          </div>
          
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 border-t border-[hsl(var(--avivar-border))] pt-4">
              {/* Descrição */}
              <div>
                <label className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wider">
                  Instrução para a IA
                </label>
                {editing && editing.stepId === step.id && editing.field === 'descricao' ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      rows={3}
                      className="resize-none !bg-[hsl(var(--avivar-card))] !text-[hsl(var(--avivar-foreground))] border-[hsl(var(--avivar-border))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(type)} className="gap-1">
                        <Check className="h-3 w-3" /> Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 group">
                    <p className="text-sm text-[hsl(var(--avivar-foreground))]">
                      {step.descricao}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                      onClick={() => startEditing(step.id, 'descricao', step.descricao)}
                    >
                      <Pencil className="h-3 w-3" /> Editar
                    </Button>
                  </div>
                )}
              </div>

              {/* Exemplo de Mensagem */}
              {(step.exemploMensagem || (editing && editing.stepId === step.id && editing.field === 'exemploMensagem')) && (
                <div className="bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                    <label className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wider">
                      Exemplo de Mensagem
                    </label>
                  </div>
                  {editing && editing.stepId === step.id && editing.field === 'exemploMensagem' ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        rows={3}
                        className="resize-none border-[hsl(var(--avivar-primary))] bg-[hsl(260,25%,12%)] text-white placeholder:text-[hsl(var(--avivar-muted-foreground))]"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(type)} className="gap-1">
                          <Check className="h-3 w-3" /> Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="group">
                      <p className="text-sm text-[hsl(var(--avivar-foreground))] italic opacity-90">
                        "{formatExampleMessage(step.exemploMensagem)}"
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                        onClick={() => startEditing(step.id, 'exemploMensagem', step.exemploMensagem || '')}
                      >
                        <Pencil className="h-3 w-3" /> Editar
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Botão para adicionar exemplo se não tiver */}
              {!step.exemploMensagem && !(editing && editing.stepId === step.id && editing.field === 'exemploMensagem') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => startEditing(step.id, 'exemploMensagem', '')}
                >
                  <Lightbulb className="h-3 w-3" /> Adicionar exemplo
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  const primaryLabel = objectives.primary ? OBJECTIVE_TEMPLATE_LABELS[objectives.primary] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Fluxo de Atendimento
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Defina os passos que sua IA seguirá durante o atendimento
        </p>
        {primaryLabel && (
          <Badge variant="secondary" className="text-sm">
            Template: {primaryLabel}
          </Badge>
        )}
      </div>

      {/* Passos Cronológicos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            <h3 className="font-semibold text-[hsl(var(--avivar-foreground))]">
              Passos do Atendimento
            </h3>
            <span className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
              (em ordem)
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => addNewStep('passosCronologicos')}
          >
            <Plus className="h-4 w-4" /> Adicionar Passo
          </Button>
        </div>
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => handleDragEnd(event, 'passosCronologicos')}
        >
          <SortableContext
            items={fluxoAtendimento.passosCronologicos?.map(s => s.id) || []}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {fluxoAtendimento.passosCronologicos?.map((step, index) => (
                <SortableStepItem 
                  key={step.id} 
                  step={step} 
                  type="passosCronologicos"
                  displayOrder={index + 1}
                  renderStep={renderStep}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {(!fluxoAtendimento.passosCronologicos?.length) && (
          <div className="text-center py-8 text-[hsl(var(--avivar-muted-foreground))]">
            <p>Nenhum passo configurado ainda.</p>
            <p className="text-sm">Selecione um objetivo na etapa anterior para carregar um template.</p>
          </div>
        )}
      </div>

      {/* Passos Extras */}
      <div className="space-y-3 pt-4 border-t border-[hsl(var(--avivar-border))]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            <h3 className="font-semibold text-[hsl(var(--avivar-foreground))]">
              Passos Extras
            </h3>
            <span className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
              (quando necessário)
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => addNewStep('passosExtras')}
          >
            <Plus className="h-4 w-4" /> Adicionar Extra
          </Button>
        </div>
        
        {fluxoAtendimento.passosExtras?.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, 'passosExtras')}
          >
            <SortableContext
              items={fluxoAtendimento.passosExtras?.map(s => s.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {fluxoAtendimento.passosExtras.map((step, index) => (
                  <SortableStepItem 
                    key={step.id} 
                    step={step} 
                    type="passosExtras"
                    displayOrder={index + 1}
                    renderStep={renderStep}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] text-center py-4">
            Nenhum passo extra configurado.
          </p>
        )}
      </div>

      {/* Dica */}
      <div className="bg-[hsl(var(--avivar-primary)/0.1)] rounded-lg p-4 flex gap-3">
        <Lightbulb className="h-5 w-5 text-[hsl(var(--avivar-primary))] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[hsl(var(--avivar-foreground))]">
          <p className="font-medium">Dica:</p>
          <p>Clique em cada passo para expandir e editar. A IA seguirá esses passos na ordem durante o atendimento.</p>
        </div>
      </div>
    </div>
  );
}
