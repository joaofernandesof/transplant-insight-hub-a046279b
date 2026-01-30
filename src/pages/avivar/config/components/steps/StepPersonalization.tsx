/**
 * Etapa 12: Personalização de Mensagens
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TomVoz } from '../../types';
import { RefreshCw, MessageSquare, UserX, Volume2 } from 'lucide-react';

interface StepPersonalizationProps {
  welcomeMessage: string;
  transferMessage: string;
  toneOfVoice: TomVoz;
  consultationDuration: number;
  attendantName: string;
  companyName: string;
  onChange: (field: string, value: string | number) => void;
}

const DEFAULT_WELCOME = (name: string, company: string) => 
  `Olá! Sou a ${name || 'assistente'}, assistente virtual da ${company || 'clínica'}. Como posso te ajudar hoje? 😊`;

const DEFAULT_TRANSFER = 'Vou te transferir para um especialista. Aguarde um momento! 🙂';

export function StepPersonalization({
  welcomeMessage,
  transferMessage,
  toneOfVoice,
  consultationDuration,
  attendantName,
  companyName,
  onChange
}: StepPersonalizationProps) {
  const resetWelcome = () => {
    onChange('welcomeMessage', DEFAULT_WELCOME(attendantName, companyName));
  };

  const resetTransfer = () => {
    onChange('transferMessage', DEFAULT_TRANSFER);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Personalize as mensagens do seu agente
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Configure como a IA vai se comunicar com seus pacientes
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Welcome message */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="welcome" className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
              Mensagem de Boas-Vindas
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetWelcome}
              className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Restaurar Padrão
            </Button>
          </div>
          <Textarea
            id="welcome"
            value={welcomeMessage || DEFAULT_WELCOME(attendantName, companyName)}
            onChange={(e) => onChange('welcomeMessage', e.target.value)}
            rows={3}
            className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))] resize-none"
          />
        </div>

        {/* Transfer message */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="transfer" className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <UserX className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
              Mensagem de Transferência para Humano
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetTransfer}
              className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Restaurar Padrão
            </Button>
          </div>
          <Textarea
            id="transfer"
            value={transferMessage || DEFAULT_TRANSFER}
            onChange={(e) => onChange('transferMessage', e.target.value)}
            rows={2}
            className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))] resize-none"
          />
        </div>

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
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="formal" id="formal" className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-primary))]" />
                <Label htmlFor="formal" className="text-[hsl(var(--avivar-foreground))] cursor-pointer">
                  Formal e profissional
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cordial" id="cordial" className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-primary))]" />
                <Label htmlFor="cordial" className="text-[hsl(var(--avivar-foreground))] cursor-pointer flex items-center gap-2">
                  Cordial e humanizado
                  <span className="text-xs px-2 py-0.5 bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))] rounded-full">
                    Recomendado
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="casual" id="casual" className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-primary))]" />
                <Label htmlFor="casual" className="text-[hsl(var(--avivar-foreground))] cursor-pointer">
                  Casual e descontraído
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Consultation duration */}
        <div className="space-y-2">
          <Label htmlFor="duration" className="text-[hsl(var(--avivar-foreground))]">
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
              {[30, 45, 60, 90, 120].map((mins) => (
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
        </div>
      </div>
    </div>
  );
}
