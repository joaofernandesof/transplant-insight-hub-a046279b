/**
 * Etapa Final: Revisão e Confirmação
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AgentConfig, DAY_NAMES, WeekSchedule } from '../../types';
import { 
  CheckCircle2, 
  User, 
  Building2, 
  Bot, 
  Scissors,
  CreditCard,
  Calendar,
  Clock,
  Image,
  Key,
  Edit,
  Sparkles,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepReviewProps {
  config: AgentConfig;
  onEdit: (step: number) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function StepReview({ config, onEdit, onNext, onPrev }: StepReviewProps) {
  const enabledServices = config.services.filter(s => s.enabled);
  const enabledPayments = config.paymentMethods.filter(m => m.enabled);
  const activeDays = (Object.keys(config.schedule) as Array<keyof WeekSchedule>)
    .filter(d => config.schedule[d].enabled);
  const validImages = config.beforeAfterImages.filter(url => url);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Quase lá! Revise suas configurações
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Confirme os dados antes de salvar
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Summary Card */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-[hsl(var(--avivar-foreground))]">
                Resumo da Configuração
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(1)}
                className="text-[hsl(var(--avivar-primary))] hover:text-[hsl(var(--avivar-accent))]"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  <Scissors className="h-4 w-4" />
                  Nicho
                </div>
                <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                  Clínica de Transplante Capilar
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  <Building2 className="h-4 w-4" />
                  Clínica
                </div>
                <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                  {config.companyName || '-'}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  <User className="h-4 w-4" />
                  Médico
                </div>
                <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                  {config.professionalName || '-'} {config.crm && `(CRM ${config.crm})`}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  <Bot className="h-4 w-4" />
                  Assistente
                </div>
                <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                  {config.attendantName || '-'}
                </p>
              </div>
            </div>

            <hr className="border-[hsl(var(--avivar-border))]" />

            {/* Services */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                <Scissors className="h-4 w-4" />
                Serviços ({enabledServices.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {enabledServices.map(s => (
                  <Badge key={s.id} variant="secondary" className="bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-foreground))]">
                    {s.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Payments */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                <CreditCard className="h-4 w-4" />
                Formas de Pagamento ({enabledPayments.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {enabledPayments.map(m => (
                  <Badge key={m.id} variant="secondary" className="bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-foreground))]">
                    {m.name}
                  </Badge>
                ))}
              </div>
            </div>

            <hr className="border-[hsl(var(--avivar-border))]" />

            {/* Resources */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                <span className="text-sm text-[hsl(var(--avivar-foreground))]">
                  {validImages.length} fotos
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                <span className="text-sm text-[hsl(var(--avivar-foreground))]">
                  {activeDays.length} dias
                </span>
              </div>


              <div className="flex items-center gap-2">
                {config.openaiApiKeyValid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Key className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                )}
                <span className="text-sm text-[hsl(var(--avivar-foreground))]">
                  {config.openaiApiKeyValid ? 'API Key ✓' : 'API Key ✗'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps Info */}
        <Card className="bg-[hsl(var(--avivar-primary)/0.05)] border-[hsl(var(--avivar-primary)/0.3)]">
          <CardContent className="p-4">
            <h4 className="font-medium text-[hsl(var(--avivar-foreground))] mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
              Próximo Passo:
            </h4>
            <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
              No próximo passo você poderá visualizar e editar o prompt completo do seu agente antes de salvar.
            </p>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={onPrev}
            className="flex-1 border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Voltar
          </Button>
          <Button
            size="lg"
            onClick={onNext}
            className="flex-[2] bg-gradient-to-r from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] hover:from-[hsl(270_75%_50%)] hover:to-[hsl(280_80%_55%)] text-white shadow-lg"
          >
            Revisar Prompt Final
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
