/**
 * Etapa 6: Serviços Oferecidos
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Service } from '../../types';
import { cn } from '@/lib/utils';
import { CheckCircle2, Scissors, Sparkles } from 'lucide-react';

interface StepServicesProps {
  services: Service[];
  onChange: (services: Service[]) => void;
}

const serviceIcons: Record<string, React.ReactNode> = {
  cabelo: '💇',
  barba: '🧔',
  sobrancelha: '👁️',
  tratamento: '💉'
};

export function StepServices({ services, onChange }: StepServicesProps) {
  const selectedCount = services.filter(s => s.enabled).length;

  const toggleService = (serviceId: string) => {
    const updated = services.map(s => 
      s.id === serviceId ? { ...s, enabled: !s.enabled } : s
    );
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Quais procedimentos sua clínica oferece?
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          A IA só oferecerá aos pacientes os procedimentos que você marcar aqui
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-4">
        {services.map((service) => (
          <Card
            key={service.id}
            className={cn(
              "cursor-pointer transition-all duration-200",
              "border-2",
              service.enabled
                ? "border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.05)]"
                : "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] hover:border-[hsl(var(--avivar-primary)/0.3)]"
            )}
            onClick={() => toggleService(service.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[hsl(var(--avivar-muted))] text-2xl">
                  {serviceIcons[service.id] || '✨'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={service.enabled}
                      onCheckedChange={() => toggleService(service.id)}
                      className="border-[hsl(var(--avivar-border))] data-[state=checked]:bg-[hsl(var(--avivar-primary))] data-[state=checked]:border-[hsl(var(--avivar-primary))]"
                    />
                    <h4 className="font-medium text-[hsl(var(--avivar-foreground))]">
                      {service.name}
                    </h4>
                  </div>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] mt-1 ml-6">
                    {service.description}
                  </p>
                </div>

                {service.enabled && (
                  <CheckCircle2 className="h-5 w-5 text-[hsl(var(--avivar-primary))] flex-shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}

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
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {selectedCount} procedimento{selectedCount !== 1 ? 's' : ''} selecionado{selectedCount !== 1 ? 's' : ''}
          </Badge>
        </div>

        {selectedCount === 0 && (
          <p className="text-center text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ Selecione pelo menos 1 procedimento para continuar
          </p>
        )}
      </div>
    </div>
  );
}
