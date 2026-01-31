/**
 * Etapa 1 Simplificada: Seleção do Tipo de Negócio
 * Mostra nichos como cards grandes e subnichos ao clicar
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  NichoType, 
  SubnichoType, 
  NICHOS_CATEGORIES 
} from '../../../types';

interface StepSelectBusinessProps {
  selectedNicho: NichoType | null;
  selectedSubnicho: SubnichoType | null;
  onSelect: (nicho: NichoType, subnicho: SubnichoType) => void;
}

export function StepSelectBusiness({ 
  selectedNicho, 
  selectedSubnicho, 
  onSelect 
}: StepSelectBusinessProps) {
  const [viewingNicho, setViewingNicho] = useState<NichoType | null>(selectedNicho);

  const handleNichoClick = (nichoId: NichoType) => {
    setViewingNicho(nichoId);
  };

  const handleSubnichoClick = (nichoId: NichoType, subnichoId: SubnichoType) => {
    onSelect(nichoId, subnichoId);
  };

  const handleBack = () => {
    setViewingNicho(null);
  };

  const currentNicho = NICHOS_CATEGORIES.find(n => n.id === viewingNicho);

  // Se está vendo subnichos
  if (viewingNicho && currentNicho) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
            {currentNicho.name}
          </h2>
          <p className="text-[hsl(var(--avivar-muted-foreground))]">
            Qual tipo de {currentNicho.name.toLowerCase()} você tem?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {currentNicho.subnichos.map((subnicho) => {
            const isSelected = selectedSubnicho === subnicho.id;
            return (
              <Card
                key={subnicho.id}
                onClick={() => handleSubnichoClick(currentNicho.id, subnicho.id)}
                className={cn(
                  "cursor-pointer transition-all hover:scale-[1.02] border-2",
                  isSelected 
                    ? "border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.1)]" 
                    : "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] hover:border-[hsl(var(--avivar-primary)/0.5)]"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-[hsl(var(--avivar-foreground))]">
                        {subnicho.name}
                      </h3>
                      <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                        {subnicho.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[hsl(var(--avivar-primary))] flex items-center justify-center flex-shrink-0">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Tela inicial - mostrar nichos
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Qual é o seu tipo de negócio? 🏢
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Selecione a categoria que melhor descreve sua empresa
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {NICHOS_CATEGORIES.map((nicho) => {
          const isSelected = selectedNicho === nicho.id;
          return (
            <Card
              key={nicho.id}
              onClick={() => handleNichoClick(nicho.id)}
              className={cn(
                "cursor-pointer transition-all hover:scale-[1.02] border-2 overflow-hidden",
                isSelected 
                  ? "border-[hsl(var(--avivar-primary))] ring-2 ring-[hsl(var(--avivar-primary)/0.3)]" 
                  : "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] hover:border-[hsl(var(--avivar-primary)/0.5)]"
              )}
            >
              <div className={cn("h-2 bg-gradient-to-r", nicho.color)} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-2xl",
                    nicho.color
                  )}>
                    {nicho.id === 'saude' && '🏥'}
                    {nicho.id === 'estetica' && '✨'}
                    {nicho.id === 'vendas' && '🛍️'}
                    {nicho.id === 'imobiliario' && '🏠'}
                    {nicho.id === 'alimentacao' && '🍽️'}
                    {nicho.id === 'servicos' && '💼'}
                    {nicho.id === 'outros' && '📦'}
                  </div>
                  {isSelected && (
                    <Badge className="bg-[hsl(var(--avivar-primary))] text-white">
                      Selecionado
                    </Badge>
                  )}
                </div>
                <h3 className="font-bold text-lg text-[hsl(var(--avivar-foreground))] mb-1">
                  {nicho.name}
                </h3>
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  {nicho.description}
                </p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-2">
                  {nicho.subnichos.length} tipos disponíveis →
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
