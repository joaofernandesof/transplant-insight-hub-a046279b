/**
 * Etapa Simplificada: Objetivos do Agente
 * Permite definir objetivo principal + objetivos secundários + criar objetivos customizados
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AgentObjective, AgentObjectives, NichoType, SubnichoType, CustomObjective } from '../../../types';
import { cn } from '@/lib/utils';
import { Target, Calendar, Video, Home, ShoppingCart, Truck, UserPlus, Star, CheckCircle2, Plus, Sparkles, Trash2, Edit2 } from 'lucide-react';

interface StepObjectivesSimpleProps {
  objectives: AgentObjectives;
  onChange: (objectives: AgentObjectives) => void;
  nicho?: NichoType | null;
  subnicho?: SubnichoType | null;
}

// Configuração dos objetivos disponíveis
const AVAILABLE_OBJECTIVES: Array<{
  id: AgentObjective;
  name: string;
  description: string;
  icon: React.ReactNode;
  applicableNichos?: NichoType[];
}> = [
  {
    id: 'agendar_presencial',
    name: 'Agendar Consulta Presencial',
    description: 'Marcar horários para atendimento na sua unidade',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    id: 'agendar_online',
    name: 'Agendar Reunião Online',
    description: 'Marcar sessões por videoconferência',
    icon: <Video className="h-5 w-5" />,
  },
  {
    id: 'agendar_domicilio',
    name: 'Agendar Visita em Domicílio',
    description: 'Marcar visitas na casa do cliente',
    icon: <Home className="h-5 w-5" />,
  },
  {
    id: 'vender_produto',
    name: 'Vender Produtos',
    description: 'Apresentar catálogo e fechar vendas',
    icon: <ShoppingCart className="h-5 w-5" />,
    applicableNichos: ['vendas', 'alimentacao', 'estetica'],
  },
  {
    id: 'delivery',
    name: 'Pedidos/Delivery',
    description: 'Receber pedidos para entrega',
    icon: <Truck className="h-5 w-5" />,
    applicableNichos: ['alimentacao', 'vendas'],
  },
  {
    id: 'capturar_lead',
    name: 'Capturar Lead',
    description: 'Coletar informações para contato posterior',
    icon: <UserPlus className="h-5 w-5" />,
  },
];

// Sugestões de objetivo principal por subnicho
const SUGGESTED_PRIMARY: Partial<Record<SubnichoType, AgentObjective>> = {
  clinica_medica: 'agendar_presencial',
  hospital: 'agendar_presencial',
  dentista: 'agendar_presencial',
  fisioterapia: 'agendar_presencial',
  psicologia: 'agendar_online',
  nutricao: 'agendar_online',
  laboratorio: 'agendar_presencial',
  farmacia: 'vender_produto',
  transplante_capilar: 'agendar_presencial',
  clinica_estetica: 'agendar_presencial',
  salao_beleza: 'agendar_presencial',
  barbearia: 'agendar_presencial',
  spa: 'agendar_presencial',
  micropigmentacao: 'agendar_presencial',
  depilacao: 'agendar_presencial',
  produtos_hospitalares: 'vender_produto',
  celulares_eletronicos: 'vender_produto',
  roupas_moda: 'vender_produto',
  joias_acessorios: 'vender_produto',
  cosmeticos: 'vender_produto',
  suplementos: 'vender_produto',
  moveis_decoracao: 'agendar_domicilio',
  agente_imobiliario: 'agendar_presencial',
  construtora: 'agendar_presencial',
  imobiliaria: 'agendar_presencial',
  administradora: 'agendar_online',
  restaurante: 'agendar_presencial',
  delivery: 'delivery',
  lanchonete: 'delivery',
  pizzaria: 'delivery',
  cafeteria: 'agendar_presencial',
  confeitaria: 'vender_produto',
  food_truck: 'capturar_lead',
  advocacia: 'agendar_online',
  contabilidade: 'agendar_online',
  consultoria: 'agendar_online',
  academia_personal: 'agendar_presencial',
  oficina_mecanica: 'agendar_presencial',
  pet_shop_veterinario: 'agendar_presencial',
  limpeza_manutencao: 'agendar_domicilio',
  marketing_agencia: 'agendar_online',
  cursos_educacao: 'capturar_lead',
  eventos: 'agendar_presencial',
  fotografia: 'agendar_presencial',
  tecnologia_ti: 'agendar_online',
  personalizado: 'capturar_lead',
};

export function StepObjectivesSimple({ 
  objectives, 
  onChange,
  nicho = null,
  subnicho = null 
}: StepObjectivesSimpleProps) {
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [editingCustom, setEditingCustom] = useState<CustomObjective | null>(null);
  const [customForm, setCustomForm] = useState({ name: '', description: '', context: '' });
  const [customTarget, setCustomTarget] = useState<'primary' | 'secondary'>('primary');

  // Filtrar objetivos aplicáveis ao nicho
  const applicableObjectives = AVAILABLE_OBJECTIVES.filter(obj => {
    if (!obj.applicableNichos) return true;
    if (!nicho) return true;
    return obj.applicableNichos.includes(nicho);
  });

  // Sugerir objetivo principal baseado no subnicho
  React.useEffect(() => {
    if (subnicho && !objectives.primary) {
      const suggested = SUGGESTED_PRIMARY[subnicho];
      if (suggested) {
        onChange({
          ...objectives,
          primary: suggested,
        });
      }
    }
  }, [subnicho]);

  const handlePrimaryChange = (value: AgentObjective | string) => {
    const newSecondary = objectives.secondary.filter(s => s !== value);
    const secondaryCustomIds = objectives.secondaryCustomIds?.filter(id => id !== value) || [];
    
    // Check if it's a custom objective
    if (value.startsWith('custom_')) {
      onChange({
        ...objectives,
        primary: 'custom',
        primaryCustomId: value,
        secondary: newSecondary,
        secondaryCustomIds,
      });
    } else {
      onChange({
        ...objectives,
        primary: value as AgentObjective,
        primaryCustomId: undefined,
        secondary: newSecondary,
        secondaryCustomIds,
      });
    }
  };

  const handleSecondaryToggle = (objectiveId: AgentObjective | string) => {
    const isPrimary = objectives.primary === objectiveId || 
      (objectives.primary === 'custom' && objectives.primaryCustomId === objectiveId);
    if (isPrimary) return;

    // Check if it's a custom objective
    if (objectiveId.startsWith('custom_')) {
      const currentSecondaryCustomIds = objectives.secondaryCustomIds || [];
      const isCurrentlySelected = currentSecondaryCustomIds.includes(objectiveId);
      const newSecondaryCustomIds = isCurrentlySelected
        ? currentSecondaryCustomIds.filter(s => s !== objectiveId)
        : [...currentSecondaryCustomIds, objectiveId];

      onChange({
        ...objectives,
        secondaryCustomIds: newSecondaryCustomIds,
      });
    } else {
      const isCurrentlySelected = objectives.secondary.includes(objectiveId as AgentObjective);
      const newSecondary = isCurrentlySelected
        ? objectives.secondary.filter(s => s !== objectiveId)
        : [...objectives.secondary, objectiveId as AgentObjective];

      onChange({
        ...objectives,
        secondary: newSecondary,
      });
    }
  };

  const handleAddCustomObjective = () => {
    if (!customForm.name.trim()) return;

    const newCustom: CustomObjective = {
      id: editingCustom?.id || `custom_${Date.now()}`,
      name: customForm.name.trim(),
      description: customForm.description.trim(),
      context: customForm.context.trim() || generateContext(customForm.name, customForm.description),
    };

    const existingCustoms = objectives.customObjectives || [];
    let updatedCustoms: CustomObjective[];

    if (editingCustom) {
      updatedCustoms = existingCustoms.map(c => c.id === editingCustom.id ? newCustom : c);
    } else {
      updatedCustoms = [...existingCustoms, newCustom];
    }

    // Se for um novo objetivo (não edição), adicionar automaticamente à lista apropriada
    if (!editingCustom) {
      if (customTarget === 'secondary') {
        // Adicionar aos secundários selecionados
        const currentSecondaryCustomIds = objectives.secondaryCustomIds || [];
        onChange({
          ...objectives,
          customObjectives: updatedCustoms,
          secondaryCustomIds: [...currentSecondaryCustomIds, newCustom.id],
        });
      } else {
        // Apenas adicionar à lista de customObjectives (usuário escolhe se quer selecionar)
        onChange({
          ...objectives,
          customObjectives: updatedCustoms,
        });
      }
    } else {
      onChange({
        ...objectives,
        customObjectives: updatedCustoms,
      });
    }

    setCustomForm({ name: '', description: '', context: '' });
    setEditingCustom(null);
    setShowCustomDialog(false);
  };

  const handleEditCustom = (custom: CustomObjective) => {
    setEditingCustom(custom);
    setCustomForm({
      name: custom.name,
      description: custom.description,
      context: custom.context,
    });
    setShowCustomDialog(true);
  };

  const handleDeleteCustom = (customId: string) => {
    const updatedCustoms = (objectives.customObjectives || []).filter(c => c.id !== customId);
    const updatedSecondaryCustomIds = (objectives.secondaryCustomIds || []).filter(id => id !== customId);
    
    onChange({
      ...objectives,
      customObjectives: updatedCustoms,
      secondaryCustomIds: updatedSecondaryCustomIds,
      primaryCustomId: objectives.primaryCustomId === customId ? undefined : objectives.primaryCustomId,
      primary: objectives.primaryCustomId === customId ? null : objectives.primary,
    });
  };

  // Gera contexto automaticamente baseado no nome e descrição
  const generateContext = (name: string, description: string): string => {
    return `O agente deve priorizar "${name}". ${description ? `Detalhes: ${description}.` : ''} Quando o cliente demonstrar interesse nesse objetivo, o agente deve conduzir a conversa de forma proativa para alcançá-lo, fazendo perguntas relevantes e oferecendo as informações necessárias.`;
  };

  const customObjectives = objectives.customObjectives || [];
  const selectedCount = (objectives.primary ? 1 : 0) + 
    objectives.secondary.length + 
    (objectives.secondaryCustomIds?.length || 0);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-[hsl(var(--avivar-primary)/0.1)]">
            <Target className="h-8 w-8 text-[hsl(var(--avivar-primary))]" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Qual o objetivo do seu agente?
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Defina o foco principal e, se quiser, objetivos secundários
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Objetivo Principal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <Label className="text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
                Objetivo Principal
              </Label>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingCustom(null);
                setCustomForm({ name: '', description: '', context: '' });
                setCustomTarget('primary');
                setShowCustomDialog(true);
              }}
              className="gap-1 text-xs border-[hsl(var(--avivar-primary)/0.5)] text-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
            >
              <Plus className="h-3 w-3" />
              Criar Objetivo
            </Button>
          </div>
          
          <RadioGroup 
            value={objectives.primary === 'custom' ? objectives.primaryCustomId : objectives.primary || ''} 
            onValueChange={handlePrimaryChange}
          >
            <div className="space-y-2">
              {/* Objetivos padrão */}
              {applicableObjectives.map((obj) => (
                <ObjectiveCard
                  key={obj.id}
                  id={obj.id}
                  name={obj.name}
                  description={obj.description}
                  icon={obj.icon}
                  isSelected={objectives.primary === obj.id}
                  isPrimary
                />
              ))}

              {/* Objetivos customizados - apenas os que NÃO estão como secundários */}
              {customObjectives
                .filter(custom => {
                  // Mostrar na lista principal se:
                  // 1. Está selecionado como principal OU
                  // 2. NÃO está selecionado como secundário (pode ser escolhido como principal)
                  const isSelectedAsPrimary = objectives.primary === 'custom' && objectives.primaryCustomId === custom.id;
                  const isSelectedAsSecondary = objectives.secondaryCustomIds?.includes(custom.id) || false;
                  return isSelectedAsPrimary || !isSelectedAsSecondary;
                })
                .map((custom) => (
                  <ObjectiveCard
                    key={custom.id}
                    id={custom.id}
                    name={custom.name}
                    description={custom.description}
                    icon={<Sparkles className="h-5 w-5" />}
                    isSelected={objectives.primary === 'custom' && objectives.primaryCustomId === custom.id}
                    isPrimary
                    isCustom
                    onEdit={() => handleEditCustom(custom)}
                    onDelete={() => handleDeleteCustom(custom.id)}
                  />
                ))}
            </div>
          </RadioGroup>
        </div>

        {/* Objetivos Secundários */}
        {objectives.primary && (
          <div className="space-y-3 pt-4 border-t border-[hsl(var(--avivar-border))]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                <Label className="text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
                  Objetivos Secundários (opcional)
                </Label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingCustom(null);
                  setCustomForm({ name: '', description: '', context: '' });
                  setCustomTarget('secondary');
                  setShowCustomDialog(true);
                }}
                className="gap-1 text-xs border-[hsl(var(--avivar-primary)/0.5)] text-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
              >
                <Plus className="h-3 w-3" />
                Objetivo Secundário
              </Button>
            </div>
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
              Se o cliente pedir, a IA também pode realizar essas ações
            </p>
            
            <div className="space-y-2">
              {/* Objetivos padrão secundários */}
              {applicableObjectives
                .filter(obj => obj.id !== objectives.primary)
                .map((obj) => {
                  const isSelected = objectives.secondary.includes(obj.id);
                  return (
                    <SecondaryObjectiveCard
                      key={obj.id}
                      id={obj.id}
                      name={obj.name}
                      description={obj.description}
                      icon={obj.icon}
                      isSelected={isSelected}
                      onToggle={() => handleSecondaryToggle(obj.id)}
                    />
                  );
                })}

              {/* Objetivos customizados secundários - apenas os que NÃO estão como principal */}
              {customObjectives
                .filter(custom => {
                  // Mostrar na lista secundária se:
                  // 1. NÃO está selecionado como principal
                  const isSelectedAsPrimary = objectives.primary === 'custom' && objectives.primaryCustomId === custom.id;
                  return !isSelectedAsPrimary;
                })
                .map((custom) => {
                  const isSelected = objectives.secondaryCustomIds?.includes(custom.id) || false;
                  return (
                    <SecondaryObjectiveCard
                      key={custom.id}
                      id={custom.id}
                      name={custom.name}
                      description={custom.description}
                      icon={<Sparkles className="h-5 w-5" />}
                      isSelected={isSelected}
                      onToggle={() => handleSecondaryToggle(custom.id)}
                      isCustom
                      onEdit={() => handleEditCustom(custom)}
                      onDelete={() => handleDeleteCustom(custom.id)}
                    />
                  );
                })}
            </div>
          </div>
        )}

        {/* Counter */}
        <div className="flex items-center justify-center gap-2 py-2">
          <Badge 
            variant={selectedCount > 0 ? "default" : "secondary"}
            className={cn(
              selectedCount > 0 
                ? "bg-[hsl(var(--avivar-primary))] text-white" 
                : "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]"
            )}
          >
            <Target className="h-3 w-3 mr-1" />
            {selectedCount} objetivo{selectedCount !== 1 ? 's' : ''} definido{selectedCount !== 1 ? 's' : ''}
          </Badge>
        </div>

        {!objectives.primary && (
          <p className="text-center text-sm text-[hsl(var(--avivar-primary))]">
            ⚠️ Selecione o objetivo principal para continuar
          </p>
        )}
      </div>

      {/* Dialog para criar/editar objetivo customizado */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--avivar-foreground))]">
              {editingCustom ? 'Editar Objetivo' : 'Criar Novo Objetivo'}
            </DialogTitle>
            <DialogDescription className="text-[hsl(var(--avivar-muted-foreground))]">
              Defina um objetivo personalizado para seu agente. O sistema entenderá automaticamente o contexto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[hsl(var(--avivar-foreground))]">Nome do Objetivo *</Label>
              <Input
                placeholder="Ex: Agendar test drive, Enviar orçamento, Qualificar interesse"
                value={customForm.name}
                onChange={(e) => setCustomForm(prev => ({ ...prev, name: e.target.value }))}
                className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[hsl(var(--avivar-foreground))]">Descrição curta</Label>
              <Input
                placeholder="Ex: Marcar visita para conhecer o veículo"
                value={customForm.description}
                onChange={(e) => setCustomForm(prev => ({ ...prev, description: e.target.value }))}
                className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-[hsl(var(--avivar-foreground))]">Contexto para a IA (opcional)</Label>
                <Badge variant="outline" className="text-xs border-[hsl(var(--avivar-primary)/0.5)] text-[hsl(var(--avivar-primary))]">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Auto-gerado
                </Badge>
              </div>
              <Textarea
                placeholder="Deixe em branco para gerar automaticamente. Ou descreva como a IA deve agir para alcançar esse objetivo..."
                value={customForm.context}
                onChange={(e) => setCustomForm(prev => ({ ...prev, context: e.target.value }))}
                className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] min-h-[100px]"
              />
              <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                O contexto ajuda a IA a entender exatamente como conduzir a conversa para alcançar esse objetivo.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowCustomDialog(false)}
              className="text-[hsl(var(--avivar-muted-foreground))]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddCustomObjective}
              disabled={!customForm.name.trim()}
              className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)] text-white"
            >
              {editingCustom ? 'Salvar' : 'Criar Objetivo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente para card de objetivo principal
function ObjectiveCard({
  id,
  name,
  description,
  icon,
  isSelected,
  isPrimary,
  isCustom,
  onEdit,
  onDelete,
}: {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isSelected: boolean;
  isPrimary?: boolean;
  isCustom?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 border-2",
        isSelected
          ? "border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.05)]"
          : "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] hover:border-[hsl(var(--avivar-primary)/0.3)]"
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <RadioGroupItem 
            value={id} 
            id={`primary-${id}`}
            className="border-[hsl(var(--avivar-border))] data-[state=checked]:border-[hsl(var(--avivar-primary))] data-[state=checked]:text-[hsl(var(--avivar-primary))]"
          />
          <div className={cn(
            "p-2 rounded-lg",
            isSelected
              ? "bg-[hsl(var(--avivar-primary))] text-white"
              : isCustom
                ? "bg-gradient-to-br from-[hsl(var(--avivar-primary)/0.2)] to-[hsl(var(--avivar-accent)/0.2)] text-[hsl(var(--avivar-primary))]"
                : "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]"
          )}>
            {icon}
          </div>
          <div className="flex-1">
            <Label 
              htmlFor={`primary-${id}`}
              className="font-medium text-[hsl(var(--avivar-foreground))] cursor-pointer flex items-center gap-2"
            >
              {name}
              {isCustom && (
                <Badge variant="outline" className="text-[10px] py-0 px-1 border-[hsl(var(--avivar-primary)/0.3)] text-[hsl(var(--avivar-primary))]">
                  Personalizado
                </Badge>
              )}
            </Label>
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
              {description}
            </p>
          </div>
          {isSelected && isPrimary && (
            <Badge className="bg-[hsl(var(--avivar-primary))] text-white text-xs">
              <Star className="h-3 w-3 mr-1 fill-white" />
              Principal
            </Badge>
          )}
          {isCustom && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-primary))]"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[hsl(var(--avivar-muted-foreground))] hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para card de objetivo secundário
function SecondaryObjectiveCard({
  id,
  name,
  description,
  icon,
  isSelected,
  onToggle,
  isCustom,
  onEdit,
  onDelete,
}: {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onToggle: () => void;
  isCustom?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 border",
        isSelected
          ? "border-[hsl(var(--avivar-primary)/0.5)] bg-[hsl(var(--avivar-primary)/0.03)]"
          : "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] hover:border-[hsl(var(--avivar-primary)/0.2)]"
      )}
      onClick={onToggle}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggle}
            className="border-[hsl(var(--avivar-border))] data-[state=checked]:bg-[hsl(var(--avivar-primary))] data-[state=checked]:border-[hsl(var(--avivar-primary))]"
          />
          <div className={cn(
            "p-2 rounded-lg",
            isSelected
              ? "bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))]"
              : isCustom
                ? "bg-gradient-to-br from-[hsl(var(--avivar-primary)/0.1)] to-[hsl(var(--avivar-accent)/0.1)] text-[hsl(var(--avivar-primary))]"
                : "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]"
          )}>
            {icon}
          </div>
          <div className="flex-1">
            <span className="font-medium text-sm text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              {name}
              {isCustom && (
                <Badge variant="outline" className="text-[10px] py-0 px-1 border-[hsl(var(--avivar-primary)/0.3)] text-[hsl(var(--avivar-primary))]">
                  Personalizado
                </Badge>
              )}
            </span>
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
              {description}
            </p>
          </div>
          {isCustom && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-primary))]"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[hsl(var(--avivar-muted-foreground))] hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
