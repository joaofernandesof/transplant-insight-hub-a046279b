/**
 * JourneySelector - Tela inicial "Definir seu caminho"
 * Apresenta 3 jornadas de configuração para o usuário escolher
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  MessageSquare, 
  Kanban, 
  Bot,
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type JourneyPath = 'whatsapp_first' | 'funnel_first' | 'ai_first';

interface JourneySelectorProps {
  onSelectPath: (path: JourneyPath) => void;
  isLoading?: boolean;
}

const journeyOptions = [
  {
    id: 'whatsapp_first' as JourneyPath,
    title: 'Conectar WhatsApp primeiro',
    description: 'Comece conectando seu número de WhatsApp para já receber mensagens enquanto configura o restante.',
    icon: MessageSquare,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    iconColor: 'text-green-600',
    recommended: true,
    estimatedTime: '~5 min',
    steps: ['WhatsApp', 'Funis', 'IA']
  },
  {
    id: 'funnel_first' as JourneyPath,
    title: 'Configurar Funis primeiro',
    description: 'Estruture seus funis de vendas e pós-venda antes de conectar canais e IA.',
    icon: Kanban,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-600',
    recommended: false,
    estimatedTime: '~10 min',
    steps: ['Funis', 'Colunas', 'WhatsApp', 'IA']
  },
  {
    id: 'ai_first' as JourneyPath,
    title: 'Configurar IA primeiro',
    description: 'Crie sua assistente virtual e base de conhecimento antes de conectar canais.',
    icon: Bot,
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-600',
    recommended: false,
    estimatedTime: '~15 min',
    steps: ['Agente IA', 'Base de Conhecimento', 'WhatsApp', 'Funis']
  }
];

export function JourneySelector({ onSelectPath, isLoading }: JourneySelectorProps) {
  return (
    <div className="min-h-screen bg-[hsl(var(--avivar-background))] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] shadow-lg shadow-purple-500/30 mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[hsl(var(--avivar-foreground))]">
            Defina seu caminho
          </h1>
          <p className="text-lg text-[hsl(var(--avivar-muted-foreground))] max-w-xl mx-auto">
            Escolha como prefere começar a configurar seu CRM. Você vai passar por todas as etapas, 
            mas pode escolher a ordem que faz mais sentido para você.
          </p>
        </div>

        {/* Journey Options */}
        <div className="grid gap-4 md:grid-cols-3">
          {journeyOptions.map((journey) => {
            const Icon = journey.icon;
            
            return (
              <Card
                key={journey.id}
                className={cn(
                  "relative overflow-hidden cursor-pointer transition-all duration-300",
                  "border-2 hover:shadow-lg hover:scale-[1.02]",
                  "bg-[hsl(var(--avivar-card))]",
                  journey.borderColor,
                  "hover:border-[hsl(var(--avivar-primary))]"
                )}
                onClick={() => !isLoading && onSelectPath(journey.id)}
              >
                {/* Recommended badge */}
                {journey.recommended && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-[hsl(var(--avivar-primary))] text-white text-xs">
                      Recomendado
                    </Badge>
                  </div>
                )}

                <CardContent className="p-6 space-y-4">
                  {/* Icon */}
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center",
                    journey.bgColor
                  )}>
                    <Icon className={cn("h-7 w-7", journey.iconColor)} />
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-lg text-[hsl(var(--avivar-foreground))]">
                    {journey.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] leading-relaxed">
                    {journey.description}
                  </p>

                  {/* Steps preview */}
                  <div className="flex flex-wrap gap-1.5">
                    {journey.steps.map((step, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))]"
                      >
                        {idx + 1}. {step}
                      </Badge>
                    ))}
                  </div>

                  {/* Estimated time */}
                  <div className="flex items-center gap-2 text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{journey.estimatedTime} para começar</span>
                  </div>

                  {/* CTA */}
                  <Button 
                    className={cn(
                      "w-full gap-2 mt-2",
                      journey.recommended 
                        ? "bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
                        : "bg-[hsl(var(--avivar-secondary))] hover:bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-foreground))]"
                    )}
                    disabled={isLoading}
                  >
                    Escolher este caminho
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-[hsl(var(--avivar-muted-foreground))]">
          <CheckCircle2 className="h-4 w-4 inline-block mr-1" />
          Não se preocupe, você pode ajustar tudo depois. Essa escolha apenas define a ordem inicial.
        </p>
      </div>
    </div>
  );
}
