/**
 * Etapa Final Simplificada: Revisão e Finalização
 * Mostra resumo completo e permite ajustes rápidos
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Building2, 
  User, 
  Bot, 
  Package, 
  Clock,
  Image as ImageIcon,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Settings2,
  Loader2,
  CreditCard,
  Target,
  Route,
  HelpCircle,
} from 'lucide-react';
import { AgentConfig, DAY_NAMES, WeekSchedule } from '../../../types';

interface StepReviewSimpleProps {
  config: AgentConfig;
  onComplete: (agentName: string) => void;
  onEdit: (step: number) => void;
  isLoading?: boolean;
}

export function StepReviewSimple({ 
  config, 
  onComplete, 
  onEdit,
  isLoading = false 
}: StepReviewSimpleProps) {
  const [agentName, setAgentName] = useState(
    config.attendantName 
      ? `${config.attendantName} - ${config.companyName || 'Agente'}` 
      : 'Meu Agente'
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  const enabledServices = config.services.filter(s => s.enabled);
  const enabledPayments = config.paymentMethods.filter(p => p.enabled);

  const imagesCount =
    (config.imageGallery?.before_after?.length || 0) +
    (config.imageGallery?.catalog?.length || 0) +
    (config.imageGallery?.location?.length || 0) +
    (config.imageGallery?.general?.length || 0);
  
  const getEnabledDays = (schedule: WeekSchedule): string => {
    const days = Object.entries(schedule)
      .filter(([_, value]) => value.enabled)
      .map(([key]) => DAY_NAMES[key as keyof typeof DAY_NAMES].slice(0, 3));
    
    if (days.length === 0) return 'Nenhum dia configurado';
    if (days.length === 7) return 'Todos os dias';
    if (days.length === 5 && !schedule.saturday.enabled && !schedule.sunday.enabled) {
      return 'Segunda a Sexta';
    }
    return days.join(', ');
  };

  const fluxoStepsCount = (config.fluxoAtendimento?.passosCronologicos?.length || 0) + (config.fluxoAtendimento?.passosExtras?.length || 0);

  const handleComplete = () => {
    onComplete(agentName);
  };

  // Step indices matching SIMPLE_STEPS:
  // 0: Tipo de Negócio, 1: Sua Empresa, 2: Serviços, 3: Pagamentos,
  // 4: Objetivos, 5: Fluxo, 6: FAQ, 7: Documentos, 8: Imagens

  const ReviewRow = ({ icon: Icon, children, stepIndex }: { icon: React.ElementType; children: React.ReactNode; stepIndex: number }) => (
    <>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 text-[hsl(var(--avivar-primary))] mt-0.5" />
          <div>{children}</div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onEdit(stepIndex)}
          className="text-[hsl(var(--avivar-primary))]"
        >
          Editar
        </Button>
      </div>
      <div className="border-t border-[hsl(var(--avivar-border))]" />
    </>
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--avivar-primary))] to-[hsl(280_80%_50%)] flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Tudo pronto! 🎉
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Revise as informações e finalize a configuração do seu agente
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Nome do Agente */}
        <Card className="bg-gradient-to-br from-[hsl(var(--avivar-primary)/0.1)] to-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-primary)/0.3)]">
          <CardContent className="p-4 space-y-3">
            <Label htmlFor="agentName" className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <Bot className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
              Nome do Agente (para sua organização)
            </Label>
            <Input
              id="agentName"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Ex: Atendente Principal"
              className="text-lg bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
            />
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4 space-y-4">
            {/* Empresa - step 1 */}
            <ReviewRow icon={Building2} stepIndex={1}>
              <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                {config.companyName || 'Empresa não definida'}
              </p>
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                {config.city && config.state ? `${config.city}/${config.state}` : 'Localização não definida'}
              </p>
            </ReviewRow>

            {/* Profissional - step 1 */}
            <ReviewRow icon={User} stepIndex={1}>
              <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                {config.professionalName || 'Profissional não definido'}
              </p>
              {config.crm && (
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">{config.crm}</p>
              )}
            </ReviewRow>

            {/* Atendente Virtual - step 1 */}
            <ReviewRow icon={Bot} stepIndex={1}>
              <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                Atendente: <span className="text-[hsl(var(--avivar-primary))]">{config.attendantName || 'Não definido'}</span>
              </p>
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                Tom de voz: {config.toneOfVoice === 'formal' ? 'Formal' : config.toneOfVoice === 'casual' ? 'Descontraído' : 'Cordial'}
              </p>
            </ReviewRow>

            {/* Serviços - step 2 */}
            <ReviewRow icon={Package} stepIndex={2}>
              <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                {enabledServices.length} serviço{enabledServices.length !== 1 ? 's' : ''} ativo{enabledServices.length !== 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {enabledServices.slice(0, 3).map(s => (
                  <Badge key={s.id} variant="secondary" className="text-xs bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-foreground))]">
                    {s.name}
                  </Badge>
                ))}
                {enabledServices.length > 3 && (
                  <Badge variant="secondary" className="text-xs bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-foreground))]">
                    +{enabledServices.length - 3}
                  </Badge>
                )}
              </div>
            </ReviewRow>

            {/* Pagamentos - step 3 */}
            <ReviewRow icon={CreditCard} stepIndex={3}>
              <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                {enabledPayments.length} forma{enabledPayments.length !== 1 ? 's' : ''} de pagamento
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {enabledPayments.slice(0, 4).map(p => (
                  <Badge key={p.id} variant="secondary" className="text-xs bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-foreground))]">
                    {p.name}
                  </Badge>
                ))}
                {enabledPayments.length > 4 && (
                  <Badge variant="secondary" className="text-xs bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-foreground))]">
                    +{enabledPayments.length - 4}
                  </Badge>
                )}
              </div>
            </ReviewRow>

            {/* Objetivos - step 4 */}
            <ReviewRow icon={Target} stepIndex={4}>
              <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                Objetivo do Agente
              </p>
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                {config.aiObjective || 'Objetivo não definido'}
              </p>
            </ReviewRow>

            {/* Fluxo - step 5 */}
            <ReviewRow icon={Route} stepIndex={5}>
              <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                Fluxo de Atendimento
              </p>
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                {fluxoStepsCount} passo{fluxoStepsCount !== 1 ? 's' : ''} configurado{fluxoStepsCount !== 1 ? 's' : ''}
              </p>
            </ReviewRow>

            {/* Documentos - step 7 */}
            <ReviewRow icon={FileText} stepIndex={7}>
              <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                Base de Conhecimento
              </p>
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                {config.knowledgeFiles?.length || 0} documento(s) adicionado(s)
              </p>
            </ReviewRow>

            {/* Imagens - step 8 */}
            <ReviewRow icon={ImageIcon} stepIndex={8}>
              <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                Galeria de Imagens
              </p>
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                {imagesCount} imagem(ns) adicionada(s)
              </p>
            </ReviewRow>
          </CardContent>
        </Card>

        {/* Opções Avançadas (colapsável) */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2 text-[hsl(var(--avivar-muted-foreground))]">
                <Settings2 className="h-5 w-5" />
                <span className="font-medium">Configurações Avançadas</span>
                <span className="text-xs">(opcional)</span>
              </div>
              {showAdvanced ? (
                <ChevronUp className="h-5 w-5 text-[hsl(var(--avivar-muted-foreground))]" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[hsl(var(--avivar-muted-foreground))]" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-3 pt-3 border-t border-[hsl(var(--avivar-border))]">
                {/* Horários */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-[hsl(var(--avivar-primary))] mt-0.5" />
                    <div>
                      <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                        Horários de Atendimento
                      </p>
                      <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                        {getEnabledDays(config.schedule)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-[hsl(var(--avivar-border))]">
                    ✓ Personalidade configurada
                  </Badge>
                  <Badge variant="outline" className="border-[hsl(var(--avivar-border))]">
                    ✓ Instruções definidas
                  </Badge>
                  <Badge variant="outline" className="border-[hsl(var(--avivar-border))]">
                    ✓ Fluxo de atendimento pronto
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botão de Finalizar */}
        <Button
          onClick={handleComplete}
          disabled={!agentName.trim() || isLoading}
          className="w-full py-6 text-lg bg-gradient-to-r from-[hsl(var(--avivar-primary))] to-[hsl(280_80%_50%)] hover:opacity-90"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Salvando agente...
            </>
          ) : (
            <>
              <Check className="h-5 w-5 mr-2" />
              Salvar Agente
            </>
          )}
        </Button>

        <p className="text-center text-xs text-[hsl(var(--avivar-muted-foreground))]">
          Você poderá editar todas as configurações depois.
        </p>
      </div>
    </div>
  );
}
