/**
 * Etapa 1: Seleção de Nicho/Template
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TemplateType } from '../../types';
import { cn } from '@/lib/utils';
import { Scissors, Check } from 'lucide-react';

interface StepTemplateProps {
  selected: TemplateType | null;
  onSelect: (template: TemplateType) => void;
}

const templates = [
  {
    id: 'transplante_capilar' as TemplateType,
    title: 'Clínica de Transplante Capilar',
    description: 'Ideal para clínicas especializadas em transplante capilar, barba e sobrancelha',
    icon: Scissors,
    available: true,
    color: 'from-purple-500 to-violet-600'
  }
];

export function StepTemplate({ selected, onSelect }: StepTemplateProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Qual é o seu segmento de atuação?
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Selecione o template que melhor se adapta ao seu negócio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => {
          const Icon = template.icon;
          const isSelected = selected === template.id;

          return (
            <Card
              key={template.id}
              className={cn(
                "relative cursor-pointer transition-all duration-300 overflow-hidden",
                "border-2",
                isSelected 
                  ? "border-[hsl(var(--avivar-primary))] shadow-lg shadow-[hsl(var(--avivar-primary)/0.2)]" 
                  : "border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)]",
                !template.available && "opacity-60 cursor-not-allowed",
                "bg-[hsl(var(--avivar-card))]"
              )}
              onClick={() => template.available && onSelect(template.id)}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[hsl(var(--avivar-primary))] flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}

              {/* Coming soon badge */}
              {!template.available && (
                <Badge className="absolute top-3 right-3 bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]">
                  Em breve
                </Badge>
              )}

              <CardContent className="p-6 space-y-4">
                {/* Icon */}
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br",
                  template.color,
                  "shadow-lg"
                )}>
                  <Icon className="h-7 w-7 text-white" />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[hsl(var(--avivar-foreground))]">
                    {template.title}
                  </h3>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                    {template.description}
                  </p>
                </div>

                {/* Button */}
                {template.available ? (
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "w-full",
                      isSelected 
                        ? "bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
                        : "border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
                    )}
                  >
                    {isSelected ? 'Selecionado' : 'Selecionar'}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    disabled
                    className="w-full border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))]"
                  >
                    Cadastre-se na Lista
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
