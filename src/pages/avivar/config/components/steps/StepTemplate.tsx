/**
 * Etapa 2: Seleção de Nicho e Subnicho
 * Sistema de accordion com nichos principais e subnichos expansíveis
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  NichoType, 
  SubnichoType, 
  NICHOS_CATEGORIES,
  NichoCategory 
} from '../../types';
import { cn } from '@/lib/utils';
import { 
  Check, 
  ChevronDown,
  Stethoscope,
  Sparkles,
  ShoppingBag,
  Building2,
  UtensilsCrossed,
  Briefcase,
  MoreHorizontal
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface StepTemplateProps {
  selected: SubnichoType | null;
  onSelect: (template: SubnichoType) => void;
  onNichoSelect?: (nicho: NichoType) => void;
  selectedNicho?: NichoType | null;
}

// Mapeamento de ícones
const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Stethoscope,
  Sparkles,
  ShoppingBag,
  Building2,
  UtensilsCrossed,
  Briefcase,
  MoreHorizontal,
};

export function StepTemplate({ 
  selected, 
  onSelect, 
  onNichoSelect,
  selectedNicho 
}: StepTemplateProps) {
  const [expandedNicho, setExpandedNicho] = useState<string | undefined>(
    selectedNicho || undefined
  );

  const handleNichoClick = (nichoId: NichoType) => {
    setExpandedNicho(expandedNicho === nichoId ? undefined : nichoId);
    if (onNichoSelect) {
      onNichoSelect(nichoId);
    }
  };

  const handleSubnichoSelect = (subnichoId: SubnichoType) => {
    onSelect(subnichoId);
  };

  const getIcon = (iconName: string) => {
    const IconComponent = IconMap[iconName];
    return IconComponent || MoreHorizontal;
  };

  // Encontrar o nicho do subnicho selecionado
  const findSelectedNichoFromSubnicho = (): NichoType | null => {
    if (!selected) return null;
    for (const nicho of NICHOS_CATEGORIES) {
      if (nicho.subnichos.some(s => s.id === selected)) {
        return nicho.id;
      }
    }
    return null;
  };

  const activeNicho = selectedNicho || findSelectedNichoFromSubnicho();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Qual é o segmento do seu negócio?
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Selecione a categoria e depois o tipo específico do seu negócio
        </p>
      </div>

      {/* Selected Badge */}
      {selected && (
        <div className="flex justify-center">
          <Badge className="bg-[hsl(var(--avivar-primary))] text-white px-4 py-2 text-sm">
            <Check className="h-4 w-4 mr-2" />
            {NICHOS_CATEGORIES.flatMap(n => n.subnichos).find(s => s.id === selected)?.name}
          </Badge>
        </div>
      )}

      {/* Accordion de Nichos */}
      <Accordion 
        type="single" 
        collapsible 
        value={expandedNicho}
        onValueChange={(value) => setExpandedNicho(value)}
        className="space-y-3"
      >
        {NICHOS_CATEGORIES.map((nicho) => {
          const Icon = getIcon(nicho.icon);
          const isNichoSelected = activeNicho === nicho.id;
          const hasSelectedSubnicho = nicho.subnichos.some(s => s.id === selected);

          return (
            <AccordionItem 
              key={nicho.id} 
              value={nicho.id}
              className={cn(
                "border-2 rounded-xl overflow-hidden transition-all",
                hasSelectedSubnicho 
                  ? "border-[hsl(var(--avivar-primary))] shadow-lg shadow-[hsl(var(--avivar-primary)/0.2)]"
                  : "border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)]",
                "bg-[hsl(var(--avivar-card))]"
              )}
            >
              <AccordionTrigger 
                className="px-5 py-4 hover:no-underline [&[data-state=open]>div>svg.chevron]:rotate-180"
                onClick={() => handleNichoClick(nicho.id)}
              >
                <div className="flex items-center gap-4 w-full">
                  {/* Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0",
                    nicho.color,
                    "shadow-lg"
                  )}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-[hsl(var(--avivar-foreground))]">
                      {nicho.name}
                    </h3>
                    <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                      {nicho.description}
                    </p>
                  </div>

                  {/* Selected indicator */}
                  {hasSelectedSubnicho && (
                    <div className="w-6 h-6 rounded-full bg-[hsl(var(--avivar-primary))] flex items-center justify-center shrink-0 mr-2">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}

                  {/* Chevron */}
                  <ChevronDown className="h-5 w-5 text-[hsl(var(--avivar-muted-foreground))] transition-transform duration-200 chevron shrink-0" />
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {nicho.subnichos.map((subnicho) => {
                    const isSelected = selected === subnicho.id;

                    return (
                      <Card
                        key={subnicho.id}
                        className={cn(
                          "cursor-pointer transition-all duration-200",
                          "border-2",
                          isSelected 
                            ? "border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.1)]" 
                            : "border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)] bg-[hsl(var(--avivar-muted)/0.3)]"
                        )}
                        onClick={() => handleSubnichoSelect(subnicho.id)}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          {/* Selection indicator */}
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                            isSelected 
                              ? "border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary))]"
                              : "border-[hsl(var(--avivar-muted-foreground)/0.3)]"
                          )}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <h4 className={cn(
                              "font-medium truncate",
                              isSelected 
                                ? "text-[hsl(var(--avivar-primary))]"
                                : "text-[hsl(var(--avivar-foreground))]"
                            )}>
                              {subnicho.name}
                            </h4>
                            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] line-clamp-2">
                              {subnicho.description}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Help text */}
      <p className="text-center text-sm text-[hsl(var(--avivar-muted-foreground))]">
        💡 Clique em uma categoria para ver as opções disponíveis
      </p>
    </div>
  );
}
