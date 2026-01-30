/**
 * Etapa 7: Tipo de Consulta
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConsultationType } from '../../types';
import { cn } from '@/lib/utils';
import { Building2, Monitor, CheckCircle2, Info } from 'lucide-react';

interface StepConsultationProps {
  consultationType: ConsultationType;
  city: string;
  state: string;
  onChange: (type: ConsultationType) => void;
}

export function StepConsultation({ consultationType, city, state, onChange }: StepConsultationProps) {
  const toggleType = (type: 'presencial' | 'online') => {
    onChange({
      ...consultationType,
      [type]: !consultationType[type]
    });
  };

  const hasSelection = consultationType.presencial || consultationType.online;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Como você atende seus pacientes?
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Você pode oferecer ambas as modalidades
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-4">
        {/* Presencial */}
        <Card
          className={cn(
            "cursor-pointer transition-all duration-200",
            "border-2",
            consultationType.presencial
              ? "border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.05)]"
              : "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] hover:border-[hsl(var(--avivar-primary)/0.3)]"
          )}
          onClick={() => toggleType('presencial')}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                <Building2 className="h-7 w-7" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={consultationType.presencial}
                    onCheckedChange={() => toggleType('presencial')}
                    className="border-[hsl(var(--avivar-border))] data-[state=checked]:bg-[hsl(var(--avivar-primary))] data-[state=checked]:border-[hsl(var(--avivar-primary))]"
                  />
                  <h4 className="font-semibold text-lg text-[hsl(var(--avivar-foreground))]">
                    Consulta Presencial
                  </h4>
                  {consultationType.presencial && (
                    <CheckCircle2 className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                  )}
                </div>
                <p className="text-[hsl(var(--avivar-muted-foreground))] mt-1 ml-7">
                  Pacientes podem ir até sua clínica
                </p>
                {city && state && (
                  <p className="text-sm text-[hsl(var(--avivar-primary))] mt-2 ml-7 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Local: {city} - {state}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Online */}
        <Card
          className={cn(
            "cursor-pointer transition-all duration-200",
            "border-2",
            consultationType.online
              ? "border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.05)]"
              : "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] hover:border-[hsl(var(--avivar-primary)/0.3)]"
          )}
          onClick={() => toggleType('online')}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <Monitor className="h-7 w-7" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={consultationType.online}
                    onCheckedChange={() => toggleType('online')}
                    className="border-[hsl(var(--avivar-border))] data-[state=checked]:bg-[hsl(var(--avivar-primary))] data-[state=checked]:border-[hsl(var(--avivar-primary))]"
                  />
                  <h4 className="font-semibold text-lg text-[hsl(var(--avivar-foreground))]">
                    Consulta Online
                  </h4>
                  {consultationType.online && (
                    <CheckCircle2 className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                  )}
                </div>
                <p className="text-[hsl(var(--avivar-muted-foreground))] mt-1 ml-7">
                  Atenda pacientes de qualquer lugar
                </p>
                <p className="text-sm text-[hsl(var(--avivar-primary))] mt-2 ml-7 flex items-center gap-1">
                  <Monitor className="h-3 w-3" />
                  Brasil e exterior
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Alert */}
        {consultationType.presencial && consultationType.online && (
          <Alert className="bg-[hsl(var(--avivar-primary)/0.1)] border-[hsl(var(--avivar-primary)/0.3)]">
            <Info className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
            <AlertDescription className="text-[hsl(var(--avivar-foreground))]">
              A IA priorizará atendimento presencial, mas oferecerá online quando necessário ou solicitado pelo paciente.
            </AlertDescription>
          </Alert>
        )}

        {!hasSelection && (
          <p className="text-center text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ Selecione pelo menos 1 tipo de consulta para continuar
          </p>
        )}
      </div>
    </div>
  );
}
