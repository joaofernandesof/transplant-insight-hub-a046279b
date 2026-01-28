import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, ChevronRight, Loader2, 
  GitBranch, Mail, ClipboardCheck, MessageSquare, 
  FileSignature, CreditCard, CheckCheck,
  AlertTriangle, User, Clock, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Tipos para o fluxo BPMN de Distrato
export type DistratoEtapaBpmn = 
  | 'solicitacao_recebida'
  | 'validacao_contato'
  | 'checklist_preenchido'
  | 'aguardando_parecer_gerente'
  | 'em_negociacao'
  | 'aguardando_assinatura'
  | 'aguardando_pagamento'
  | 'caso_concluido';

export type DistratoDecisao = 'pendente' | 'devolver' | 'nao_devolver' | 'em_negociacao';

// Configuração das etapas
const ETAPAS_DISTRATO: {
  key: DistratoEtapaBpmn;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  responsavel: string;
  sla?: string;
  cor: { bg: string; border: string; text: string; ring: string };
}[] = [
  { 
    key: 'solicitacao_recebida', 
    label: 'Solicitação Recebida', 
    shortLabel: 'Recebido',
    icon: Mail, 
    responsavel: 'Sistema',
    cor: { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700', ring: 'ring-slate-200' }
  },
  { 
    key: 'validacao_contato', 
    label: 'Validação do Contato', 
    shortLabel: 'Validação',
    icon: User, 
    responsavel: 'Júlia',
    sla: '24h / 8h úteis',
    cor: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', ring: 'ring-amber-200' }
  },
  { 
    key: 'checklist_preenchido', 
    label: 'Checklist Preenchido', 
    shortLabel: 'Checklist',
    icon: ClipboardCheck, 
    responsavel: 'Júlia',
    sla: '24h',
    cor: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', ring: 'ring-blue-200' }
  },
  { 
    key: 'aguardando_parecer_gerente', 
    label: 'Aguardando Parecer da Gerente', 
    shortLabel: 'Parecer',
    icon: MessageSquare, 
    responsavel: 'Júlia → Jéssica',
    sla: '24h',
    cor: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', ring: 'ring-purple-200' }
  },
  { 
    key: 'em_negociacao', 
    label: 'Em Negociação', 
    shortLabel: 'Negociação',
    icon: MessageSquare, 
    responsavel: 'Júlia + Jéssica',
    sla: 'Cobrança 24h',
    cor: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', ring: 'ring-orange-200' }
  },
  { 
    key: 'aguardando_assinatura', 
    label: 'Aguardando Assinatura do Paciente', 
    shortLabel: 'Assinatura',
    icon: FileSignature, 
    responsavel: 'Júlia',
    cor: { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700', ring: 'ring-cyan-200' }
  },
  { 
    key: 'aguardando_pagamento', 
    label: 'Aguardando Pagamento Financeiro', 
    shortLabel: 'Pagamento',
    icon: CreditCard, 
    responsavel: 'Júlia → Financeiro',
    sla: 'Verificação 24h',
    cor: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', ring: 'ring-emerald-200' }
  },
  { 
    key: 'caso_concluido', 
    label: 'Caso Concluído', 
    shortLabel: 'Concluído',
    icon: CheckCheck, 
    responsavel: 'Júlia',
    cor: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', ring: 'ring-green-200' }
  },
];

// Mapeamento de índices para navegação
const getEtapaIndex = (etapa: DistratoEtapaBpmn) => 
  ETAPAS_DISTRATO.findIndex(e => e.key === etapa);

const getEtapaConfig = (etapa: DistratoEtapaBpmn) => 
  ETAPAS_DISTRATO.find(e => e.key === etapa);

interface DistratoEtapaFlowProps {
  currentEtapa: DistratoEtapaBpmn;
  decisao: DistratoDecisao;
  onAdvance: (targetEtapa: DistratoEtapaBpmn, metadata?: Record<string, any>) => Promise<void>;
  onSetDecisao?: (decisao: DistratoDecisao) => Promise<void>;
  canAdvance?: boolean;
  validationErrors?: string[];
  isSubmitting?: boolean;
}

export function DistratoEtapaFlow({ 
  currentEtapa, 
  decisao,
  onAdvance, 
  onSetDecisao,
  canAdvance = true,
  validationErrors = [],
  isSubmitting = false
}: DistratoEtapaFlowProps) {
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [showDecisaoDialog, setShowDecisaoDialog] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [selectedDecisao, setSelectedDecisao] = useState<DistratoDecisao>('pendente');

  const currentIndex = getEtapaIndex(currentEtapa);
  const currentConfig = getEtapaConfig(currentEtapa);
  
  // Determinar próxima etapa baseado no fluxo
  const getNextEtapa = (): DistratoEtapaBpmn | null => {
    switch (currentEtapa) {
      case 'solicitacao_recebida':
        return 'validacao_contato';
      case 'validacao_contato':
        return 'checklist_preenchido';
      case 'checklist_preenchido':
        return 'aguardando_parecer_gerente';
      case 'aguardando_parecer_gerente':
        if (decisao === 'em_negociacao') return 'em_negociacao';
        if (decisao === 'devolver' || decisao === 'nao_devolver') return 'aguardando_assinatura';
        return null; // Precisa definir decisão primeiro
      case 'em_negociacao':
        return 'aguardando_assinatura'; // Após negociação, vai para assinatura
      case 'aguardando_assinatura':
        if (decisao === 'devolver') return 'aguardando_pagamento';
        return 'caso_concluido'; // Se não devolver, conclui direto
      case 'aguardando_pagamento':
        return 'caso_concluido';
      default:
        return null;
    }
  };

  const nextEtapa = getNextEtapa();
  const nextConfig = nextEtapa ? getEtapaConfig(nextEtapa) : null;

  // Verificar se pode avançar
  const canAdvanceNow = canAdvance && nextEtapa !== null && validationErrors.length === 0;
  
  // No parecer da gerente, precisa definir decisão primeiro
  const needsDecision = currentEtapa === 'aguardando_parecer_gerente' && decisao === 'pendente';

  const handleAdvance = async () => {
    if (!nextEtapa) return;
    await onAdvance(nextEtapa, { observacao });
    setShowAdvanceDialog(false);
    setObservacao('');
  };

  const handleSetDecisao = async () => {
    if (!onSetDecisao || selectedDecisao === 'pendente') return;
    await onSetDecisao(selectedDecisao);
    setShowDecisaoDialog(false);
    setSelectedDecisao('pendente');
  };

  return (
    <Card className="border border-border/50 bg-gradient-to-br from-card to-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-4 w-4 text-primary" />
            Fluxo BPMN - Distrato
          </CardTitle>
          {decisao !== 'pendente' && (
            <Badge variant={decisao === 'devolver' ? 'default' : decisao === 'nao_devolver' ? 'secondary' : 'outline'}>
              {decisao === 'devolver' && 'Devolver'}
              {decisao === 'nao_devolver' && 'Não Devolver'}
              {decisao === 'em_negociacao' && 'Em Negociação'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="relative">
          <div className="absolute top-5 left-4 right-4 h-0.5 bg-muted rounded-full" />
          <div 
            className="absolute top-5 left-4 h-0.5 bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(0, (currentIndex / (ETAPAS_DISTRATO.length - 1)) * 100 - 5)}%` }}
          />
        </div>

        {/* Steps - Compact View */}
        <div className="relative flex justify-between items-start pt-2">
          {ETAPAS_DISTRATO.map((etapa, index) => {
            const isComplete = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;
            const Icon = etapa.icon;
            
            // Verificar se esta etapa é atingível baseado na decisão
            const isReachable = (() => {
              if (etapa.key === 'aguardando_pagamento' && decisao === 'nao_devolver') return false;
              if (etapa.key === 'em_negociacao' && decisao !== 'em_negociacao' && decisao !== 'pendente') return false;
              return true;
            })();

            return (
              <TooltipProvider key={etapa.key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex flex-col items-center flex-1 transition-opacity",
                      !isReachable && "opacity-30"
                    )}>
                      {/* Step Circle */}
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10",
                          isComplete && "bg-primary border-primary text-primary-foreground shadow-md",
                          isCurrent && cn(
                            etapa.cor.bg, 
                            etapa.cor.border, 
                            etapa.cor.text, 
                            "ring-2",
                            etapa.cor.ring,
                            "shadow-lg scale-110"
                          ),
                          isFuture && "bg-muted border-muted-foreground/30 text-muted-foreground"
                        )}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>

                      {/* Label - Only show on larger screens */}
                      <div className="mt-1.5 text-center max-w-[60px] hidden lg:block">
                        <p className={cn(
                          "text-[9px] font-medium leading-tight",
                          isCurrent && cn(etapa.cor.text, "font-bold"),
                          isFuture && "text-muted-foreground",
                          isComplete && "text-foreground"
                        )}>
                          {etapa.shortLabel}
                        </p>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px]">
                    <div className="space-y-1">
                      <p className="font-medium">{etapa.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Responsável: {etapa.responsavel}
                      </p>
                      {etapa.sla && (
                        <p className="text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" /> SLA: {etapa.sla}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {/* Current Stage Info */}
        {currentConfig && (
          <div className={cn(
            "p-3 rounded-lg border",
            currentConfig.cor.bg,
            currentConfig.cor.border
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <currentConfig.icon className={cn("h-4 w-4", currentConfig.cor.text)} />
                <span className={cn("font-medium text-sm", currentConfig.cor.text)}>
                  {currentConfig.label}
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                {currentConfig.responsavel}
              </Badge>
            </div>
            {currentConfig.sla && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> SLA: {currentConfig.sla}
              </p>
            )}
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">Pendências para avançar:</p>
                <ul className="text-xs text-destructive/90 list-disc list-inside">
                  {validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {/* Botão de Definir Decisão (quando na etapa de parecer) */}
          {needsDecision && onSetDecisao && (
            <Button
              onClick={() => setShowDecisaoDialog(true)}
              disabled={isSubmitting}
              variant="default"
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Definir Parecer
            </Button>
          )}

          {/* Botão de Avançar */}
          {canAdvanceNow && nextConfig && !needsDecision && (
            <Button
              onClick={() => setShowAdvanceDialog(true)}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Avançar para {nextConfig.shortLabel}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {currentEtapa === 'caso_concluido' && (
            <Badge variant="default" className="bg-green-600 text-white px-4 py-2">
              <CheckCheck className="h-4 w-4 mr-2" />
              Caso Encerrado
            </Badge>
          )}
        </div>
      </CardContent>

      {/* Dialog de Avançar Etapa */}
      <Dialog open={showAdvanceDialog} onOpenChange={setShowAdvanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Avançar para {nextConfig?.label}
            </DialogTitle>
            <DialogDescription>
              O chamado será movido para a próxima etapa do fluxo de distrato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Observação (opcional)</Label>
              <Textarea
                placeholder="Adicione uma observação sobre esta transição..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdvanceDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdvance} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Definir Decisão */}
      <Dialog open={showDecisaoDialog} onOpenChange={setShowDecisaoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Definir Parecer da Gerente
            </DialogTitle>
            <DialogDescription>
              Selecione a decisão para este caso de distrato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Decisão</Label>
              <Select value={selectedDecisao} onValueChange={(v) => setSelectedDecisao(v as DistratoDecisao)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a decisão..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="devolver">
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-green-600" />
                      Devolver - Distrato com devolução
                    </span>
                  </SelectItem>
                  <SelectItem value="nao_devolver">
                    <span className="flex items-center gap-2">
                      <FileSignature className="h-4 w-4 text-amber-600" />
                      Não Devolver - Distrato sem devolução
                    </span>
                  </SelectItem>
                  <SelectItem value="em_negociacao">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      Em Negociação - Continuar tratativas
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDecisaoDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSetDecisao} 
              disabled={isSubmitting || selectedDecisao === 'pendente'}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Decisão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Exportar constantes para uso em outros componentes
export { ETAPAS_DISTRATO, getEtapaIndex, getEtapaConfig };
