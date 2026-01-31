/**
 * Etapa 12: Identidade e Objetivo da IA
 */

import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TomVoz, SubnichoType, NichoType } from '../../types';
import { getAIPersonaConfig } from '../../nichoConfig';
import { RefreshCw, Bot, Target, Volume2, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepPersonalizationProps {
  aiIdentity: string;
  aiObjective: string;
  toneOfVoice: TomVoz;
  consultationDuration: number;
  attendantName: string;
  companyName: string;
  nicho: NichoType | null;
  subnicho: SubnichoType | null;
  onChange: (field: string, value: string | number) => void;
}

export function StepPersonalization({
  aiIdentity,
  aiObjective,
  toneOfVoice,
  consultationDuration,
  attendantName,
  companyName,
  nicho,
  subnicho,
  onChange
}: StepPersonalizationProps) {
  const lastSubnichoRef = useRef<SubnichoType | null>(null);
  const hasInitializedRef = useRef(false);

  // Preenche automaticamente baseado no subnicho
  useEffect(() => {
    const personaConfig = getAIPersonaConfig(subnicho);
    
    // Primeira vez que o componente monta
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      // Se não tem conteúdo OU se o conteúdo é genérico (não específico do subnicho)
      const isGenericIdentity = !aiIdentity || aiIdentity.includes('Sou assistente virtual inteligente');
      const isGenericObjective = !aiObjective || aiObjective.includes('entender as necessidades de cada cliente');
      
      if (isGenericIdentity) {
        onChange('aiIdentity', personaConfig.identity);
      }
      if (isGenericObjective) {
        onChange('aiObjective', personaConfig.objective);
      }
      
      lastSubnichoRef.current = subnicho;
      return;
    }
    
    // Se o subnicho mudou, atualiza os campos
    if (subnicho !== lastSubnichoRef.current) {
      onChange('aiIdentity', personaConfig.identity);
      onChange('aiObjective', personaConfig.objective);
      lastSubnichoRef.current = subnicho;
    }
  }, [subnicho, aiIdentity, aiObjective, onChange]);

  const resetIdentity = () => {
    const personaConfig = getAIPersonaConfig(subnicho);
    onChange('aiIdentity', personaConfig.identity);
  };

  const resetObjective = () => {
    const personaConfig = getAIPersonaConfig(subnicho);
    onChange('aiObjective', personaConfig.objective);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Configure a Personalidade da IA
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Defina quem é sua assistente virtual e como ela deve atuar
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* AI Identity */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-4 py-3 border-b border-[hsl(var(--avivar-border))]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[hsl(var(--avivar-foreground))]">
                    Identidade da IA
                  </h3>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    Quem é {attendantName || 'a assistente'}?
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetIdentity}
                className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Restaurar
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            <Textarea
              id="identity"
              value={aiIdentity}
              onChange={(e) => onChange('aiIdentity', e.target.value)}
              rows={4}
              placeholder="Descreva quem é a assistente virtual, suas especialidades e como ela se comporta..."
              className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))] resize-none"
            />
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-2">
              💡 Exemplo: "Sou especialista em transplante capilar, ajudo pessoas a recuperarem seus cabelos..."
            </p>
          </CardContent>
        </Card>

        {/* AI Objective */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-4 py-3 border-b border-[hsl(var(--avivar-border))]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[hsl(var(--avivar-foreground))]">
                    Objetivo Principal
                  </h3>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    O que {attendantName || 'ela'} deve fazer?
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetObjective}
                className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Restaurar
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            <Textarea
              id="objective"
              value={aiObjective}
              onChange={(e) => onChange('aiObjective', e.target.value)}
              rows={4}
              placeholder="Descreva o objetivo principal da assistente no atendimento..."
              className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))] resize-none"
            />
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-2">
              💡 Exemplo: "Qualificar interessados, responder dúvidas e agendar avaliações."
            </p>
          </CardContent>
        </Card>

        {/* Tone of voice */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4 space-y-3">
            <Label className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
              Tom de Voz
            </Label>
            <RadioGroup
              value={toneOfVoice}
              onValueChange={(value) => onChange('toneOfVoice', value)}
              className="grid grid-cols-1 gap-2"
            >
              {[
                { value: 'formal', label: 'Formal e profissional', desc: 'Linguagem respeitosa e técnica' },
                { value: 'cordial', label: 'Cordial e humanizado', desc: 'Equilibrio entre profissionalismo e simpatia', recommended: true },
                { value: 'casual', label: 'Casual e descontraído', desc: 'Linguagem informal com emojis' }
              ].map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    toneOfVoice === option.value
                      ? "border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.1)]"
                      : "border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)]"
                  )}
                >
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value} 
                    className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-primary))]" 
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[hsl(var(--avivar-foreground))] font-medium">
                        {option.label}
                      </span>
                      {option.recommended && (
                        <span className="text-[10px] px-2 py-0.5 bg-[hsl(var(--avivar-primary))] text-white rounded-full flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5" />
                          Recomendado
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                      {option.desc}
                    </span>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Consultation duration */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4 space-y-3">
            <Label htmlFor="duration" className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
              Duração Padrão das Consultas
            </Label>
            <Select 
              value={consultationDuration.toString()} 
              onValueChange={(value) => onChange('consultationDuration', parseInt(value))}
            >
              <SelectTrigger className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
                {[20, 30, 45, 60, 90, 120].map((mins) => (
                  <SelectItem 
                    key={mins} 
                    value={mins.toString()}
                    className="text-[hsl(var(--avivar-foreground))] focus:bg-[hsl(var(--avivar-muted))]"
                  >
                    {mins} minutos
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
              A IA usará essa duração para calcular disponibilidade na agenda
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
