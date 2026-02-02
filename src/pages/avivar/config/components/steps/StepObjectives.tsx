/**
 * Etapa: Objetivos do Agente
 * Permite definir objetivo principal + objetivos secundários
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AgentObjective, AgentObjectives, NichoType, SubnichoType } from '../../types';
import { cn } from '@/lib/utils';
import { Target, Calendar, Video, Home, ShoppingCart, Truck, UserPlus, Star, CheckCircle2 } from 'lucide-react';

interface StepObjectivesProps {
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
    name: 'Agendar Consulta/Atendimento Presencial',
    description: 'Marcar horários para atendimento na sua unidade',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    id: 'agendar_online',
    name: 'Agendar Reunião/Consulta Online',
    description: 'Marcar sessões por videoconferência',
    icon: <Video className="h-5 w-5" />,
  },
  {
    id: 'agendar_domicilio',
    name: 'Agendar Visita em Domicílio',
    description: 'Marcar visitas na casa ou local do cliente',
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
    name: 'Realizar Pedidos/Delivery',
    description: 'Receber pedidos para entrega',
    icon: <Truck className="h-5 w-5" />,
    applicableNichos: ['alimentacao', 'vendas'],
  },
  {
    id: 'capturar_lead',
    name: 'Capturar Lead/Contato',
    description: 'Coletar informações para contato posterior',
    icon: <UserPlus className="h-5 w-5" />,
  },
];

// Sugestões de objetivo principal por subnicho
const SUGGESTED_PRIMARY: Partial<Record<SubnichoType, AgentObjective>> = {
  // Saúde
  clinica_medica: 'agendar_presencial',
  hospital: 'agendar_presencial',
  dentista: 'agendar_presencial',
  fisioterapia: 'agendar_presencial',
  psicologia: 'agendar_online',
  nutricao: 'agendar_online',
  laboratorio: 'agendar_presencial',
  farmacia: 'vender_produto',
  
  // Estética
  transplante_capilar: 'agendar_presencial',
  clinica_estetica: 'agendar_presencial',
  salao_beleza: 'agendar_presencial',
  barbearia: 'agendar_presencial',
  spa: 'agendar_presencial',
  micropigmentacao: 'agendar_presencial',
  depilacao: 'agendar_presencial',
  
  // Vendas
  produtos_hospitalares: 'vender_produto',
  celulares_eletronicos: 'vender_produto',
  roupas_moda: 'vender_produto',
  joias_acessorios: 'vender_produto',
  cosmeticos: 'vender_produto',
  suplementos: 'vender_produto',
  moveis_decoracao: 'agendar_domicilio',
  
  // Imobiliário
  agente_imobiliario: 'agendar_presencial',
  construtora: 'agendar_presencial',
  imobiliaria: 'agendar_presencial',
  administradora: 'agendar_online',
  
  // Alimentação
  restaurante: 'agendar_presencial',
  delivery: 'delivery',
  lanchonete: 'delivery',
  pizzaria: 'delivery',
  cafeteria: 'agendar_presencial',
  confeitaria: 'vender_produto',
  food_truck: 'capturar_lead',
  
  // Serviços
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
  
  // Outros
  personalizado: 'capturar_lead',
};

export function StepObjectives({ 
  objectives, 
  onChange,
  nicho = null,
  subnicho = null 
}: StepObjectivesProps) {
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

  const handlePrimaryChange = (value: AgentObjective) => {
    // Remove o objetivo do secondary se estiver lá
    const newSecondary = objectives.secondary.filter(s => s !== value);
    onChange({
      ...objectives,
      primary: value,
      secondary: newSecondary,
    });
  };

  const handleSecondaryToggle = (objectiveId: AgentObjective) => {
    // Não pode ser secundário se for o principal
    if (objectiveId === objectives.primary) return;

    const isCurrentlySelected = objectives.secondary.includes(objectiveId);
    const newSecondary = isCurrentlySelected
      ? objectives.secondary.filter(s => s !== objectiveId)
      : [...objectives.secondary, objectiveId];

    onChange({
      ...objectives,
      secondary: newSecondary,
    });
  };

  const selectedCount = (objectives.primary ? 1 : 0) + objectives.secondary.length;

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
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <Label className="text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
              Objetivo Principal (prioridade da IA)
            </Label>
          </div>
          
          <RadioGroup 
            value={objectives.primary || ''} 
            onValueChange={(v) => handlePrimaryChange(v as AgentObjective)}
          >
            <div className="space-y-2">
              {applicableObjectives.map((obj) => (
                <Card
                  key={obj.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 border-2",
                    objectives.primary === obj.id
                      ? "border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.05)]"
                      : "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] hover:border-[hsl(var(--avivar-primary)/0.3)]"
                  )}
                  onClick={() => handlePrimaryChange(obj.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem 
                        value={obj.id} 
                        id={`primary-${obj.id}`}
                        className="border-[hsl(var(--avivar-border))] data-[state=checked]:border-[hsl(var(--avivar-primary))] data-[state=checked]:text-[hsl(var(--avivar-primary))]"
                      />
                      <div className={cn(
                        "p-2 rounded-lg",
                        objectives.primary === obj.id
                          ? "bg-[hsl(var(--avivar-primary))] text-white"
                          : "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]"
                      )}>
                        {obj.icon}
                      </div>
                      <div className="flex-1">
                        <Label 
                          htmlFor={`primary-${obj.id}`}
                          className="font-medium text-[hsl(var(--avivar-foreground))] cursor-pointer"
                        >
                          {obj.name}
                        </Label>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                          {obj.description}
                        </p>
                      </div>
                      {objectives.primary === obj.id && (
                        <Badge className="bg-[hsl(var(--avivar-primary))] text-white text-xs">
                          <Star className="h-3 w-3 mr-1 fill-white" />
                          Principal
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Objetivos Secundários */}
        {objectives.primary && (
          <div className="space-y-3 pt-4 border-t border-[hsl(var(--avivar-border))]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
              <Label className="text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
                Objetivos Secundários (opcional)
              </Label>
            </div>
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
              Se o cliente pedir, a IA também pode realizar essas ações
            </p>
            
            <div className="space-y-2">
              {applicableObjectives
                .filter(obj => obj.id !== objectives.primary)
                .map((obj) => {
                  const isSelected = objectives.secondary.includes(obj.id);
                  return (
                    <Card
                      key={obj.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 border",
                        isSelected
                          ? "border-[hsl(var(--avivar-primary)/0.5)] bg-[hsl(var(--avivar-primary)/0.03)]"
                          : "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] hover:border-[hsl(var(--avivar-primary)/0.2)]"
                      )}
                      onClick={() => handleSecondaryToggle(obj.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSecondaryToggle(obj.id)}
                            className="border-[hsl(var(--avivar-border))] data-[state=checked]:bg-[hsl(var(--avivar-primary))] data-[state=checked]:border-[hsl(var(--avivar-primary))]"
                          />
                          <div className={cn(
                            "p-2 rounded-lg",
                            isSelected
                              ? "bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))]"
                              : "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]"
                          )}>
                            {obj.icon}
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-sm text-[hsl(var(--avivar-foreground))]">
                              {obj.name}
                            </span>
                            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                              {obj.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
            ⚠️ Selecione pelo menos o objetivo principal para continuar
          </p>
        )}
      </div>
    </div>
  );
}
