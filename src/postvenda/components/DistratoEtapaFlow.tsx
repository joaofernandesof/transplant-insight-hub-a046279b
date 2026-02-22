import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, ChevronRight, Loader2, 
  GitBranch, MessageSquare, 
  FileSignature, CreditCard, CheckCheck,
  AlertTriangle, Clock, ArrowRight, Shield,
  FileText, Mail, HandshakeIcon, Ban, HelpCircle
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

// Tipos para o novo fluxo de Distrato
export type DistratoEtapaBpmn = 
  | 'aguardando_negociacao'
  | 'retido'
  | 'produzir_distrato'
  | 'aguardando_assinatura'
  | 'gerar_contas_pagar'
  | 'realizar_pagamento'
  | 'enviar_comprovante'
  | 'caso_concluido'
  // Legado
  | 'solicitacao_recebida'
  | 'validacao_contato'
  | 'checklist_preenchido'
  | 'aguardando_parecer_gerente'
  | 'em_negociacao'
  | 'aguardando_pagamento';

export type DistratoDecisao = 
  | 'pendente' 
  | 'retido' 
  | 'nao_retido_com_contrato' 
  | 'nao_retido_sem_contrato' 
  | 'sem_definicao'
  // Legado
  | 'devolver' 
  | 'nao_devolver' 
  | 'em_negociacao';

// Configuração das etapas do NOVO fluxo
const ETAPAS_DISTRATO: {
  key: DistratoEtapaBpmn;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  responsavel: string;
  sla?: string;
  cor: { bg: string; border: string; text: string; ring: string };
  terminal?: boolean;
}[] = [
  { 
    key: 'aguardando_negociacao', 
    label: 'Aguardando Negociação da Gerência', 
    shortLabel: 'Negociação',
    icon: MessageSquare, 
    responsavel: 'Jessika',
    sla: '24h úteis',
    cor: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', ring: 'ring-amber-200' }
  },
  { 
    key: 'retido', 
    label: 'Retido', 
    shortLabel: 'Retido',
    icon: HandshakeIcon, 
    responsavel: 'Jessika',
    terminal: true,
    cor: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', ring: 'ring-green-200' }
  },
  { 
    key: 'produzir_distrato', 
    label: 'Produzir Distrato', 
    shortLabel: 'Distrato',
    icon: FileText, 
    responsavel: 'Pós-Venda',
    cor: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', ring: 'ring-blue-200' }
  },
  { 
    key: 'aguardando_assinatura', 
    label: 'Aguardando Assinaturas', 
    shortLabel: 'Assinatura',
    icon: FileSignature, 
    responsavel: 'Pós-Venda',
    cor: { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700', ring: 'ring-cyan-200' }
  },
  { 
    key: 'gerar_contas_pagar', 
    label: 'Gerar Contas a Pagar', 
    shortLabel: 'Contas',
    icon: CreditCard, 
    responsavel: 'Financeiro',
    cor: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', ring: 'ring-purple-200' }
  },
  { 
    key: 'realizar_pagamento', 
    label: 'Realizar Pagamento na Data Prevista', 
    shortLabel: 'Pagamento',
    icon: CreditCard, 
    responsavel: 'Financeiro',
    cor: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', ring: 'ring-emerald-200' }
  },
  { 
    key: 'enviar_comprovante', 
    label: 'Enviar E-mail com Comprovante', 
    shortLabel: 'Comprovante',
    icon: Mail, 
    responsavel: 'Pós-Venda',
    cor: { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', ring: 'ring-indigo-200' }
  },
  { 
    key: 'caso_concluido', 
    label: 'Caso Concluído', 
    shortLabel: 'Concluído',
    icon: CheckCheck, 
    responsavel: 'Sistema',
    cor: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', ring: 'ring-green-200' }
  },
];

// Determinar quais etapas são visíveis dado a decisão
function getVisibleEtapas(decisao: DistratoDecisao): DistratoEtapaBpmn[] {
  if (decisao === 'retido') {
    return ['aguardando_negociacao', 'retido'];
  }
  if (decisao === 'nao_retido_com_contrato') {
    return ['aguardando_negociacao', 'produzir_distrato', 'aguardando_assinatura', 'gerar_contas_pagar', 'realizar_pagamento', 'enviar_comprovante', 'caso_concluido'];
  }
  if (decisao === 'nao_retido_sem_contrato') {
    return ['aguardando_negociacao', 'gerar_contas_pagar', 'realizar_pagamento', 'enviar_comprovante', 'caso_concluido'];
  }
  // pendente ou sem_definicao - mostra apenas a etapa de negociação e possíveis caminhos
  return ['aguardando_negociacao', 'retido', 'produzir_distrato', 'aguardando_assinatura', 'gerar_contas_pagar', 'realizar_pagamento', 'enviar_comprovante', 'caso_concluido'];
}

const getEtapaConfig = (etapa: DistratoEtapaBpmn) => 
  ETAPAS_DISTRATO.find(e => e.key === etapa);

interface DistratoEtapaFlowProps {
  currentEtapa: DistratoEtapaBpmn;
  decisao: DistratoDecisao;
  chamadoId?: string;
  tipoDemanda?: string;
  contratoAssinado?: boolean;
  onAdvance: (targetEtapa: DistratoEtapaBpmn, metadata?: Record<string, any>) => Promise<void>;
  onSetDecisao?: (decisao: DistratoDecisao, metadata?: Record<string, any>) => Promise<void>;
  canAdvance?: boolean;
  validationErrors?: string[];
  isSubmitting?: boolean;
}

export function DistratoEtapaFlow({ 
  currentEtapa, 
  decisao,
  chamadoId,
  tipoDemanda,
  contratoAssinado,
  onAdvance, 
  onSetDecisao,
  canAdvance = true,
  validationErrors = [],
  isSubmitting = false
}: DistratoEtapaFlowProps) {
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [showDecisaoDialog, setShowDecisaoDialog] = useState(false);
  const [showSemDefinicaoDialog, setShowSemDefinicaoDialog] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [retencaoInfo, setRetencaoInfo] = useState('');
  const [semDefinicaoMotivo, setSemDefinicaoMotivo] = useState('');
  const [selectedDecisao, setSelectedDecisao] = useState<DistratoDecisao>('pendente');

  // Mapear etapa legada para novo fluxo
  const mappedEtapa = mapLegacyEtapa(currentEtapa);
  const mappedDecisao = mapLegacyDecisao(decisao);

  const visibleEtapas = getVisibleEtapas(mappedDecisao);
  const visibleEtapaConfigs = ETAPAS_DISTRATO.filter(e => visibleEtapas.includes(e.key));
  
  const currentIndex = visibleEtapaConfigs.findIndex(e => e.key === mappedEtapa);
  const currentConfig = getEtapaConfig(mappedEtapa);
  
  // Determinar próxima etapa baseado no fluxo
  const getNextEtapa = (): DistratoEtapaBpmn | null => {
    if (mappedEtapa === 'retido' || mappedEtapa === 'caso_concluido') return null;
    
    const currentVisibleIndex = visibleEtapas.indexOf(mappedEtapa);
    if (currentVisibleIndex === -1 || currentVisibleIndex >= visibleEtapas.length - 1) return null;
    
    return visibleEtapas[currentVisibleIndex + 1];
  };

  const nextEtapa = getNextEtapa();
  const nextConfig = nextEtapa ? getEtapaConfig(nextEtapa) : null;

  // Na etapa de negociação e sem decisão, precisa definir decisão primeiro
  const needsDecision = mappedEtapa === 'aguardando_negociacao' && (mappedDecisao === 'pendente' || mappedDecisao === 'sem_definicao');

  const canAdvanceNow = canAdvance && nextEtapa !== null && validationErrors.length === 0 && !needsDecision;

  const handleAdvance = async () => {
    if (!nextEtapa) return;
    await onAdvance(nextEtapa, { observacao });
    setShowAdvanceDialog(false);
    setObservacao('');
  };

  const handleSetDecisao = async () => {
    if (!onSetDecisao || selectedDecisao === 'pendente') return;
    
    // Auto-resolve "nao_retido" based on contratoAssinado from the form
    let finalDecisao = selectedDecisao;
    if (selectedDecisao === ('nao_retido' as any)) {
      finalDecisao = contratoAssinado ? 'nao_retido_com_contrato' : 'nao_retido_sem_contrato';
    }

    if (finalDecisao === 'retido') {
      if (!retencaoInfo.trim()) return;
      await onSetDecisao(finalDecisao, { retencaoInfo });
    } else if (finalDecisao === 'sem_definicao') {
      if (!semDefinicaoMotivo.trim()) return;
      await onSetDecisao(finalDecisao, { semDefinicaoMotivo });
    } else {
      await onSetDecisao(finalDecisao);
    }
    
    setShowDecisaoDialog(false);
    setSelectedDecisao('pendente');
    setRetencaoInfo('');
    setSemDefinicaoMotivo('');
  };

  return (
    <Card className="border border-border/50 bg-gradient-to-br from-card to-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-4 w-4 text-primary" />
            Fluxo de Distrato
          </CardTitle>
          <div className="flex items-center gap-2">
            {mappedDecisao === 'retido' && (
              <Badge className="bg-green-600 text-white">
                <HandshakeIcon className="h-3 w-3 mr-1" />
                Retido
              </Badge>
            )}
            {mappedDecisao === 'nao_retido_com_contrato' && (
              <Badge variant="destructive">
                <Ban className="h-3 w-3 mr-1" />
                Não Retido (Com Contrato)
              </Badge>
            )}
            {mappedDecisao === 'nao_retido_sem_contrato' && (
              <Badge variant="destructive">
                <Ban className="h-3 w-3 mr-1" />
                Não Retido (Sem Contrato)
              </Badge>
            )}
            {mappedDecisao === 'sem_definicao' && (
              <Badge className="bg-orange-500 text-white">
                <HelpCircle className="h-3 w-3 mr-1" />
                Sem Definição
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="relative">
          <div className="absolute top-5 left-4 right-4 h-0.5 bg-muted rounded-full" />
          {currentIndex >= 0 && (
            <div 
              className="absolute top-5 left-4 h-0.5 bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(0, (currentIndex / Math.max(1, visibleEtapaConfigs.length - 1)) * 100 - 5)}%` }}
            />
          )}
        </div>

        {/* Steps */}
        <div className="relative flex justify-between items-start pt-2">
          {visibleEtapaConfigs.map((etapa, index) => {
            const isComplete = index < currentIndex;
            const isCurrent = etapa.key === mappedEtapa;
            const isFuture = index > currentIndex;
            const Icon = etapa.icon;

            return (
              <TooltipProvider key={etapa.key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex flex-col items-center flex-1 transition-all relative"
                    )}>
                      {isCurrent && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                          <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-lg whitespace-nowrap animate-pulse">
                            Atual
                          </span>
                        </div>
                      )}
                      
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10",
                          isComplete && "bg-primary border-primary text-primary-foreground shadow-md",
                          isCurrent && "bg-primary/20 border-primary text-primary ring-4 ring-primary/30 shadow-xl scale-125",
                          isFuture && "bg-muted border-muted-foreground/30 text-muted-foreground"
                        )}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Icon className={cn("h-4 w-4", isCurrent && "h-5 w-5")} />
                        )}
                      </div>

                      <div className={cn(
                        "mt-2 text-center max-w-[70px] hidden lg:block",
                        isCurrent && "bg-primary/10 px-2 py-0.5 rounded-full"
                      )}>
                        <p className={cn(
                          "text-[10px] font-medium leading-tight",
                          isCurrent && "text-primary font-bold",
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
                      {isCurrent && <Badge variant="default" className="text-[10px]">Etapa Atual</Badge>}
                      <p className="text-xs text-muted-foreground">Responsável: {etapa.responsavel}</p>
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
          <div className={cn("p-3 rounded-lg border", currentConfig.cor.bg, currentConfig.cor.border)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <currentConfig.icon className={cn("h-4 w-4", currentConfig.cor.text)} />
                <span className={cn("font-medium text-sm", currentConfig.cor.text)}>
                  {currentConfig.label}
                </span>
              </div>
              <Badge variant="outline" className="text-xs">{currentConfig.responsavel}</Badge>
            </div>
            {currentConfig.sla && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> SLA: {currentConfig.sla}
              </p>
            )}
          </div>
        )}

        {/* Sem Definição warning */}
        {mappedDecisao === 'sem_definicao' && mappedEtapa === 'aguardando_negociacao' && (
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium">Sem Definição - Novo SLA de 24h úteis ativado</p>
                <p className="text-xs mt-1">
                  A gerente deixou sem definição. É necessário definir o resultado da negociação.
                </p>
              </div>
            </div>
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
          {needsDecision && onSetDecisao && (
            <Button
              onClick={() => setShowDecisaoDialog(true)}
              disabled={isSubmitting}
              variant="default"
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Definir Resultado da Negociação
            </Button>
          )}

          {canAdvanceNow && nextConfig && (
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

          {(mappedEtapa === 'caso_concluido' || mappedEtapa === 'retido') && (
            <Badge variant="default" className={cn(
              "px-4 py-2",
              mappedEtapa === 'retido' ? 'bg-green-600 text-white' : 'bg-green-600 text-white'
            )}>
              <CheckCheck className="h-4 w-4 mr-2" />
              {mappedEtapa === 'retido' ? 'Paciente Retido' : 'Caso Encerrado'}
            </Badge>
          )}
        </div>
      </CardContent>

      {/* Dialog de Avançar Etapa */}
      <Dialog open={showAdvanceDialog} onOpenChange={setShowAdvanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avançar para {nextConfig?.label}</DialogTitle>
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
            <Button variant="outline" onClick={() => setShowAdvanceDialog(false)}>Cancelar</Button>
            <Button onClick={handleAdvance} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Definir Resultado da Negociação */}
      <Dialog open={showDecisaoDialog} onOpenChange={setShowDecisaoDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Resultado da Negociação
            </DialogTitle>
            <DialogDescription>
              Defina o resultado da tentativa de retenção pela gerência.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Decisão</Label>
              <Select value={selectedDecisao} onValueChange={(v) => setSelectedDecisao(v as DistratoDecisao)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o resultado..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retido">
                    <span className="flex items-center gap-2">
                      <HandshakeIcon className="h-4 w-4 text-green-600" />
                      Retido - Paciente convencido a permanecer
                    </span>
                  </SelectItem>
                  <SelectItem value="nao_retido">
                    <span className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-red-600" />
                      Não Retido
                    </span>
                  </SelectItem>
                  <SelectItem value="sem_definicao">
                    <span className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-orange-600" />
                      Sem Definição - Preciso de mais tempo
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campo condicional: Retido → Info do acordo */}
            {selectedDecisao === 'retido' && (
              <div>
                <Label>O que ficou combinado? *</Label>
                <Textarea
                  placeholder="Descreva o que foi acordado com o paciente para a retenção..."
                  value={retencaoInfo}
                  onChange={(e) => setRetencaoInfo(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            {/* Campo condicional: Sem Definição → Motivo + comprovação de contato */}
            {selectedDecisao === 'sem_definicao' && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div className="text-sm text-orange-800">
                      <p className="font-medium">Atenção</p>
                      <p className="text-xs mt-1">
                        Você precisa informar o motivo e comprovar que já entrou em contato com o paciente para liberar um novo SLA de 24h úteis.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Motivo e comprovação de contato *</Label>
                  <Textarea
                    placeholder="Explique o motivo de ainda não ter uma definição e comprove que já entrou em contato com o(a) paciente..."
                    value={semDefinicaoMotivo}
                    onChange={(e) => setSemDefinicaoMotivo(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDecisaoDialog(false)}>Cancelar</Button>
            <Button 
              onClick={handleSetDecisao} 
              disabled={
                isSubmitting || 
                selectedDecisao === 'pendente' ||
                (selectedDecisao === 'retido' && !retencaoInfo.trim()) ||
                (selectedDecisao === 'sem_definicao' && !semDefinicaoMotivo.trim())
              }
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

// Mapear etapas legadas para o novo fluxo
function mapLegacyEtapa(etapa: DistratoEtapaBpmn): DistratoEtapaBpmn {
  const map: Partial<Record<DistratoEtapaBpmn, DistratoEtapaBpmn>> = {
    'solicitacao_recebida': 'aguardando_negociacao',
    'validacao_contato': 'aguardando_negociacao',
    'checklist_preenchido': 'aguardando_negociacao',
    'aguardando_parecer_gerente': 'aguardando_negociacao',
    'em_negociacao': 'aguardando_negociacao',
    'aguardando_pagamento': 'realizar_pagamento',
  };
  return map[etapa] || etapa;
}

function mapLegacyDecisao(decisao: DistratoDecisao): DistratoDecisao {
  const map: Partial<Record<DistratoDecisao, DistratoDecisao>> = {
    'devolver': 'nao_retido_com_contrato',
    'nao_devolver': 'nao_retido_sem_contrato',
    'em_negociacao': 'pendente',
  };
  return map[decisao] || decisao;
}

// Exportar constantes para uso em outros componentes
export { ETAPAS_DISTRATO, getEtapaConfig };
