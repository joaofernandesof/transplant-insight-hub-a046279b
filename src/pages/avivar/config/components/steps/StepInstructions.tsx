/**
 * Etapa 13: Instruções e Restrições da IA
 */

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SubnichoType, NichoType } from '../../types';
import { getAIInstructionsConfig } from '../../nichoConfig';
import { RefreshCw, BookOpen, ShieldAlert, Expand } from 'lucide-react';

interface StepInstructionsProps {
  aiInstructions: string;
  aiRestrictions: string;
  attendantName: string;
  companyName: string;
  nicho: NichoType | null;
  subnicho: SubnichoType | null;
  onChange: (field: string, value: string) => void;
}

type ExpandedField = 'instructions' | 'restrictions' | null;

export function StepInstructions({
  aiInstructions,
  aiRestrictions,
  attendantName,
  companyName,
  nicho,
  subnicho,
  onChange
}: StepInstructionsProps) {
  const lastSubnichoRef = useRef<SubnichoType | null>(null);
  const hasInitializedRef = useRef(false);
  const [expandedField, setExpandedField] = useState<ExpandedField>(null);
  const [tempValue, setTempValue] = useState('');

  // Preenche automaticamente baseado no subnicho
  useEffect(() => {
    const instructionsConfig = getAIInstructionsConfig(subnicho);
    
    // Primeira vez que o componente monta
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      // Se não tem conteúdo OU se o conteúdo é genérico
      const isGenericInstructions = !aiInstructions || aiInstructions.includes('Responda de forma clara e objetiva');
      const isGenericRestrictions = !aiRestrictions || aiRestrictions.includes('Não forneça informações falsas');
      
      if (isGenericInstructions) {
        onChange('aiInstructions', instructionsConfig.instructions);
      }
      if (isGenericRestrictions) {
        onChange('aiRestrictions', instructionsConfig.restrictions);
      }
      
      lastSubnichoRef.current = subnicho;
      return;
    }
    
    // Se o subnicho mudou, atualiza os campos
    if (subnicho !== lastSubnichoRef.current) {
      onChange('aiInstructions', instructionsConfig.instructions);
      onChange('aiRestrictions', instructionsConfig.restrictions);
      lastSubnichoRef.current = subnicho;
    }
  }, [subnicho, aiInstructions, aiRestrictions, onChange]);

  const resetInstructions = () => {
    const instructionsConfig = getAIInstructionsConfig(subnicho);
    onChange('aiInstructions', instructionsConfig.instructions);
  };

  const resetRestrictions = () => {
    const instructionsConfig = getAIInstructionsConfig(subnicho);
    onChange('aiRestrictions', instructionsConfig.restrictions);
  };

  const openExpandedEditor = (field: ExpandedField) => {
    if (field === 'instructions') {
      setTempValue(aiInstructions);
    } else if (field === 'restrictions') {
      setTempValue(aiRestrictions);
    }
    setExpandedField(field);
  };

  const saveAndClose = () => {
    if (expandedField === 'instructions') {
      onChange('aiInstructions', tempValue);
    } else if (expandedField === 'restrictions') {
      onChange('aiRestrictions', tempValue);
    }
    setExpandedField(null);
    setTempValue('');
  };

  const getDialogTitle = () => {
    if (expandedField === 'instructions') {
      return 'Instruções da IA';
    }
    return 'Restrições da IA';
  };

  const getDialogDescription = () => {
    if (expandedField === 'instructions') {
      return `Defina como ${attendantName || 'a assistente'} deve se comportar e atender`;
    }
    return `Defina o que ${attendantName || 'a assistente'} NÃO pode fazer`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Instruções e Restrições
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Defina o que a IA pode e não pode fazer durante os atendimentos
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* AI Instructions */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-4 py-3 border-b border-[hsl(var(--avivar-border))]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[hsl(var(--avivar-foreground))]">
                    Instruções
                  </h3>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    O que {attendantName || 'a assistente'} DEVE fazer
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetInstructions}
                className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Restaurar
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="relative">
              <Textarea
                id="instructions"
                value={aiInstructions}
                onChange={(e) => onChange('aiInstructions', e.target.value)}
                rows={6}
                placeholder="Descreva as instruções de comportamento da assistente..."
                className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))] resize-none"
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                💡 Dica: Seja específico sobre como a IA deve conduzir as conversas
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openExpandedEditor('instructions')}
                className="h-7 w-7 text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))] flex-shrink-0"
                title="Expandir editor"
              >
                <Expand className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Restrictions */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] overflow-hidden">
          <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 px-4 py-3 border-b border-[hsl(var(--avivar-border))]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <ShieldAlert className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[hsl(var(--avivar-foreground))]">
                    Restrições
                  </h3>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    O que {attendantName || 'a assistente'} NÃO PODE fazer
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetRestrictions}
                className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Restaurar
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="relative">
              <Textarea
                id="restrictions"
                value={aiRestrictions}
                onChange={(e) => onChange('aiRestrictions', e.target.value)}
                rows={6}
                placeholder="Descreva as restrições e proibições da assistente..."
                className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))] resize-none"
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                ⚠️ Importante: Defina limites claros para proteger seu negócio
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openExpandedEditor('restrictions')}
                className="h-7 w-7 text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))] flex-shrink-0"
                title="Expandir editor"
              >
                <Expand className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-[hsl(var(--avivar-primary)/0.05)] border-[hsl(var(--avivar-primary)/0.3)]">
          <CardContent className="p-4">
            <h4 className="font-medium text-[hsl(var(--avivar-foreground))] mb-2 flex items-center gap-2">
              💡 Por que isso é importante?
            </h4>
            <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
              Instruções claras garantem que a IA atenda seus clientes da forma correta, 
              enquanto restrições protegem seu negócio de problemas legais e éticos. 
              Uma IA bem configurada é mais eficiente e gera mais confiança.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expanded Editor Dialog */}
      <Dialog open={expandedField !== null} onOpenChange={(open) => !open && setExpandedField(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[hsl(var(--avivar-foreground))]">
              {expandedField === 'instructions' ? (
                <BookOpen className="h-5 w-5 text-emerald-500" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-red-500" />
              )}
              {getDialogTitle()}
            </DialogTitle>
            <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
              {getDialogDescription()}
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              rows={15}
              placeholder={
                expandedField === 'instructions' 
                  ? "Descreva as instruções de comportamento da assistente..."
                  : "Descreva as restrições e proibições da assistente..."
              }
              className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))] resize-none"
            />
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setExpandedField(null)}
                className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
              >
                Cancelar
              </Button>
              <Button
                onClick={saveAndClose}
                className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
