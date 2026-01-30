/**
 * Etapa 0: Tela de boas-vindas
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Sparkles, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface StepWelcomeProps {
  onStart: () => void;
}

export function StepWelcome({ onStart }: StepWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
      {/* Icon */}
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] flex items-center justify-center shadow-2xl shadow-[hsl(270_75%_45%/0.4)]">
          <Bot className="h-12 w-12 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[hsl(var(--avivar-accent))] flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Title */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[hsl(var(--avivar-foreground))]">
          Bem-vindo ao Configurador de IA!
        </h1>
        <p className="text-lg text-[hsl(var(--avivar-muted-foreground))] max-w-md">
          Vou te guiar passo a passo para criar seu assistente virtual personalizado
        </p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl w-full">
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Clock className="h-8 w-8 text-[hsl(var(--avivar-primary))] mb-2" />
            <span className="font-medium text-[hsl(var(--avivar-foreground))]">5-10 min</span>
            <span className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Tempo estimado</span>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <CheckCircle2 className="h-8 w-8 text-[hsl(var(--avivar-primary))] mb-2" />
            <span className="font-medium text-[hsl(var(--avivar-foreground))]">14 etapas</span>
            <span className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Configuração completa</span>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Sparkles className="h-8 w-8 text-[hsl(var(--avivar-primary))] mb-2" />
            <span className="font-medium text-[hsl(var(--avivar-foreground))]">Auto-save</span>
            <span className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Progresso salvo</span>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <Button
        size="lg"
        onClick={onStart}
        className="bg-gradient-to-r from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] hover:from-[hsl(270_75%_50%)] hover:to-[hsl(280_80%_55%)] text-white shadow-lg shadow-[hsl(270_75%_45%/0.3)] px-8 py-6 text-lg"
      >
        Começar Configuração
        <ArrowRight className="h-5 w-5 ml-2" />
      </Button>

      {/* Secondary link */}
      <button className="text-sm text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] underline-offset-4 hover:underline transition-colors">
        Ver tutorial em vídeo (opcional)
      </button>
    </div>
  );
}
