/**
 * Etapa 1 Simplificada: Seleção do Tipo de Negócio
 * - Saúde e Estética unificados com multi-seleção
 * - Outros módulos bloqueados com cadeado "EM BREVE"
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  NichoType, 
  SubnichoType, 
  NICHOS_CATEGORIES_UI,
  BLOCKED_NICHOS,
  SUBNICHO_TO_NICHO
} from '../../../types';

interface StepSelectBusinessProps {
  selectedNicho: NichoType | null;
  selectedSubnicho: SubnichoType | null;
  selectedSubnichos?: SubnichoType[]; // Para multi-seleção
  onSelect: (nicho: NichoType, subnicho: SubnichoType, allSubnichos?: SubnichoType[]) => void;
}

export function StepSelectBusiness({ 
  selectedNicho, 
  selectedSubnicho,
  selectedSubnichos = [],
  onSelect 
}: StepSelectBusinessProps) {
  const [viewingNicho, setViewingNicho] = useState<NichoType | null>(selectedNicho);
  // Estado local para multi-seleção
  const [localSelectedSubnichos, setLocalSelectedSubnichos] = useState<SubnichoType[]>(
    selectedSubnichos.length > 0 ? selectedSubnichos : (selectedSubnicho ? [selectedSubnicho] : [])
  );

  const handleNichoClick = (nichoId: NichoType) => {
    // Se está bloqueado, não faz nada
    if (BLOCKED_NICHOS.includes(nichoId)) return;
    setViewingNicho(nichoId);
  };

  const handleSubnichoClick = (subnichoId: SubnichoType) => {
    // Multi-seleção: toggle
    setLocalSelectedSubnichos(prev => {
      if (prev.includes(subnichoId)) {
        return prev.filter(s => s !== subnichoId);
      } else {
        return [...prev, subnichoId];
      }
    });
  };

  const handleConfirmSelection = () => {
    if (localSelectedSubnichos.length === 0) return;
    
    // Pegar o nicho do primeiro subnicho selecionado
    const primarySubnicho = localSelectedSubnichos[0];
    const nicho = SUBNICHO_TO_NICHO[primarySubnicho];
    
    // Chamar onSelect com o primeiro subnicho como principal e todos como array
    onSelect(nicho, primarySubnicho, localSelectedSubnichos);
  };

  const handleBack = () => {
    setViewingNicho(null);
    // Reset local selection quando voltar
    setLocalSelectedSubnichos(selectedSubnichos.length > 0 ? selectedSubnichos : (selectedSubnicho ? [selectedSubnicho] : []));
  };

  const currentNicho = NICHOS_CATEGORIES_UI.find(n => n.id === viewingNicho);

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
            Selecione um ou mais tipos de serviço que você oferece
          </p>
          {localSelectedSubnichos.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {localSelectedSubnichos.map(id => {
                const subnicho = currentNicho.subnichos.find(s => s.id === id);
                return (
                  <Badge key={id} className="bg-[hsl(var(--avivar-primary))] text-white">
                    {subnicho?.name}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {currentNicho.subnichos.map((subnicho) => {
            const isSelected = localSelectedSubnichos.includes(subnicho.id);
            return (
              <Card
                key={subnicho.id}
                onClick={() => handleSubnichoClick(subnicho.id)}
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
                    <div className={cn(
                      "w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0",
                      isSelected 
                        ? "bg-[hsl(var(--avivar-primary))] border-[hsl(var(--avivar-primary))]"
                        : "border-[hsl(var(--avivar-muted-foreground)/0.3)]"
                    )}>
                      {isSelected && <Check className="h-4 w-4 text-white" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Botão de confirmação */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleConfirmSelection}
            disabled={localSelectedSubnichos.length === 0}
            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)] text-white px-8"
          >
            Confirmar Seleção ({localSelectedSubnichos.length})
          </Button>
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
        {NICHOS_CATEGORIES_UI.map((nicho) => {
          const isBlocked = BLOCKED_NICHOS.includes(nicho.id);
          const isSelected = selectedNicho === nicho.id || 
            (selectedNicho === 'saude' && nicho.id === 'saude') ||
            (selectedNicho === 'estetica' && nicho.id === 'saude'); // 'saude' na UI representa ambos
          
          return (
            <Card
              key={nicho.id}
              onClick={() => handleNichoClick(nicho.id)}
              className={cn(
                "transition-all border-2 overflow-hidden relative",
                isBlocked 
                  ? "cursor-not-allowed opacity-60 border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-muted)/0.3)]" 
                  : "cursor-pointer hover:scale-[1.02]",
                !isBlocked && isSelected 
                  ? "border-[hsl(var(--avivar-primary))] ring-2 ring-[hsl(var(--avivar-primary)/0.3)]" 
                  : !isBlocked ? "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] hover:border-[hsl(var(--avivar-primary)/0.5)]" : ""
              )}
            >
              {/* Bloqueado badge */}
              {isBlocked && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[hsl(var(--avivar-muted))] px-2 py-1 rounded-full">
                  <Lock className="h-3 w-3 text-[hsl(var(--avivar-muted-foreground))]" />
                  <span className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))]">EM BREVE</span>
                </div>
              )}
              
              <div className={cn("h-2 bg-gradient-to-r", nicho.color, isBlocked && "opacity-50")} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-2xl",
                    nicho.color,
                    isBlocked && "opacity-50"
                  )}>
                    {nicho.id === 'saude' && '🏥'}
                    {nicho.id === 'vendas' && '🛍️'}
                    {nicho.id === 'imobiliario' && '🏠'}
                    {nicho.id === 'alimentacao' && '🍽️'}
                    {nicho.id === 'servicos' && '💼'}
                    {nicho.id === 'outros' && '📦'}
                  </div>
                  {!isBlocked && isSelected && (
                    <Badge className="bg-[hsl(var(--avivar-primary))] text-white">
                      Selecionado
                    </Badge>
                  )}
                </div>
                <h3 className={cn(
                  "font-bold text-lg text-[hsl(var(--avivar-foreground))] mb-1",
                  isBlocked && "opacity-60"
                )}>
                  {nicho.name}
                </h3>
                <p className={cn(
                  "text-sm text-[hsl(var(--avivar-muted-foreground))]",
                  isBlocked && "opacity-60"
                )}>
                  {nicho.description}
                </p>
                {!isBlocked && (
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-2">
                    {nicho.subnichos.length} tipos disponíveis →
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
