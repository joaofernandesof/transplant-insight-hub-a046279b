/**
 * DistratoSwimLanesBpmn - Visualização BPMN em formato de Swim Lanes (Baias de Piscina)
 * Exibe o fluxo de distrato com raias por responsável
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, GitBranch, Mail, ClipboardCheck, MessageSquare, 
  FileSignature, CreditCard, CheckCheck, User, Clock,
  ArrowRight, ArrowDown, Split, Merge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

// Responsáveis (swim lanes)
type Responsavel = 'sistema' | 'julia' | 'jessica' | 'financeiro';

const SWIM_LANES: { key: Responsavel; label: string; color: string; bgColor: string }[] = [
  { key: 'sistema', label: 'Sistema', color: 'text-slate-600', bgColor: 'bg-slate-50 dark:bg-slate-900/50' },
  { key: 'julia', label: 'Júlia (Administrativo)', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  { key: 'jessica', label: 'Jéssica (Gerente)', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  { key: 'financeiro', label: 'Financeiro', color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
];

// Atividades por etapa com posicionamento em lanes
interface BpmnActivity {
  key: DistratoEtapaBpmn;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  lane: Responsavel;
  sla?: string;
  column: number; // Posição horizontal (0-8)
  description: string;
}

const BPMN_ACTIVITIES: BpmnActivity[] = [
  { 
    key: 'solicitacao_recebida', 
    label: 'Solicitação Recebida', 
    shortLabel: 'Recebido',
    icon: Mail, 
    lane: 'sistema',
    column: 0,
    description: 'Criação automática do chamado ao receber e-mail'
  },
  { 
    key: 'validacao_contato', 
    label: 'Validação do Contato', 
    shortLabel: 'Validação',
    icon: User, 
    lane: 'julia',
    sla: '24h',
    column: 1,
    description: 'Confirmar titular, e-mail e status do contrato'
  },
  { 
    key: 'checklist_preenchido', 
    label: 'Checklist Jurídico', 
    shortLabel: 'Checklist',
    icon: ClipboardCheck, 
    lane: 'julia',
    sla: '24h',
    column: 2,
    description: 'Preencher todos os dados do checklist jurídico'
  },
  { 
    key: 'aguardando_parecer_gerente', 
    label: 'Parecer da Gerente', 
    shortLabel: 'Parecer',
    icon: MessageSquare, 
    lane: 'jessica',
    sla: '24h',
    column: 3,
    description: 'Gerente define: Devolver, Não Devolver ou Negociar'
  },
  { 
    key: 'em_negociacao', 
    label: 'Em Negociação', 
    shortLabel: 'Negociação',
    icon: MessageSquare, 
    lane: 'jessica',
    sla: '24h/cobrança',
    column: 4,
    description: 'Acompanhamento do caso com cobrança a cada 24h'
  },
  { 
    key: 'aguardando_assinatura', 
    label: 'Assinatura do Paciente', 
    shortLabel: 'Assinatura',
    icon: FileSignature, 
    lane: 'julia',
    column: 5,
    description: 'Enviar e coletar distrato assinado'
  },
  { 
    key: 'aguardando_pagamento', 
    label: 'Pagamento Financeiro', 
    shortLabel: 'Pagamento',
    icon: CreditCard, 
    lane: 'financeiro',
    sla: '24h/verificação',
    column: 6,
    description: 'Programar e confirmar pagamento de devolução'
  },
  { 
    key: 'caso_concluido', 
    label: 'Caso Concluído', 
    shortLabel: 'Concluído',
    icon: CheckCheck, 
    lane: 'julia',
    column: 7,
    description: 'Distrato finalizado com documentos arquivados'
  },
];

interface DistratoSwimLanesBpmnProps {
  currentEtapa: DistratoEtapaBpmn;
  decisao: DistratoDecisao;
}

export function DistratoSwimLanesBpmn({ 
  currentEtapa, 
  decisao
}: DistratoSwimLanesBpmnProps) {
  const currentIndex = BPMN_ACTIVITIES.findIndex(a => a.key === currentEtapa);
  
  // Determinar quais etapas estão no caminho ativo baseado na decisão
  const getActivePath = (): DistratoEtapaBpmn[] => {
    const basePath: DistratoEtapaBpmn[] = [
      'solicitacao_recebida',
      'validacao_contato',
      'checklist_preenchido',
      'aguardando_parecer_gerente'
    ];
    
    if (decisao === 'em_negociacao') {
      return [...basePath, 'em_negociacao', 'aguardando_assinatura', 'aguardando_pagamento', 'caso_concluido'];
    }
    
    if (decisao === 'devolver') {
      return [...basePath, 'aguardando_assinatura', 'aguardando_pagamento', 'caso_concluido'];
    }
    
    if (decisao === 'nao_devolver') {
      return [...basePath, 'aguardando_assinatura', 'caso_concluido'];
    }
    
    // Pendente - mostra todas as possibilidades
    return [...basePath];
  };

  const activePath = getActivePath();
  
  const isInPath = (key: DistratoEtapaBpmn) => {
    if (decisao === 'pendente') return true; // Mostra tudo quando pendente
    return activePath.includes(key);
  };

  const getActivityStatus = (activity: BpmnActivity) => {
    const activityIndex = BPMN_ACTIVITIES.findIndex(a => a.key === activity.key);
    
    if (activityIndex < currentIndex) return 'complete';
    if (activityIndex === currentIndex) return 'current';
    return 'future';
  };

  const getActivityStyles = (activity: BpmnActivity) => {
    const status = getActivityStatus(activity);
    const inPath = isInPath(activity.key);
    
    if (!inPath) {
      return {
        bg: 'bg-muted/30',
        border: 'border-muted/50',
        text: 'text-muted-foreground/50',
        icon: 'text-muted-foreground/50'
      };
    }
    
    switch (status) {
      case 'complete':
        return {
          bg: 'bg-primary/10',
          border: 'border-primary',
          text: 'text-primary',
          icon: 'text-primary'
        };
      case 'current':
        return {
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          border: 'border-amber-500 ring-2 ring-amber-300',
          text: 'text-amber-700 dark:text-amber-400 font-bold',
          icon: 'text-amber-600'
        };
      default:
        return {
          bg: 'bg-card',
          border: 'border-border',
          text: 'text-muted-foreground',
          icon: 'text-muted-foreground'
        };
    }
  };

  // Renderizar atividade como um nó BPMN
  const renderActivity = (activity: BpmnActivity) => {
    const styles = getActivityStyles(activity);
    const status = getActivityStatus(activity);
    const Icon = activity.icon;
    const inPath = isInPath(activity.key);

    return (
      <TooltipProvider key={activity.key}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "relative flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all min-w-[120px]",
                styles.bg,
                styles.border,
                !inPath && "opacity-40"
              )}
            >
              {status === 'complete' ? (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Icon className={cn("h-4 w-4 shrink-0", styles.icon)} />
              )}
              <span className={cn("text-xs whitespace-nowrap", styles.text)}>
                {activity.shortLabel}
              </span>
              
              {status === 'current' && (
                <Badge variant="outline" className="absolute -top-2 -right-2 text-[8px] px-1 py-0 bg-amber-500 text-white border-amber-500">
                  Atual
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[250px]">
            <div className="space-y-1">
              <p className="font-medium">{activity.label}</p>
              <p className="text-xs text-muted-foreground">{activity.description}</p>
              {activity.sla && (
                <p className="text-xs flex items-center gap-1 text-amber-600">
                  <Clock className="h-3 w-3" /> SLA: {activity.sla}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Renderizar seta de conexão
  const renderArrow = (direction: 'right' | 'down' | 'down-right' = 'right', label?: string) => (
    <div className={cn(
      "flex items-center justify-center",
      direction === 'right' && "px-1",
      direction === 'down' && "py-1"
    )}>
      {direction === 'right' && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
      {direction === 'down' && <ArrowDown className="h-4 w-4 text-muted-foreground" />}
      {label && (
        <span className="text-[9px] text-muted-foreground ml-1">{label}</span>
      )}
    </div>
  );

  // Renderizar gateway (losango de decisão)
  const renderGateway = (type: 'split' | 'merge') => (
    <div className="flex items-center justify-center">
      <div className={cn(
        "w-8 h-8 rotate-45 border-2 flex items-center justify-center",
        "bg-amber-100 border-amber-500 dark:bg-amber-900/30"
      )}>
        <div className="-rotate-45">
          {type === 'split' ? (
            <Split className="h-3 w-3 text-amber-600" />
          ) : (
            <Merge className="h-3 w-3 text-amber-600" />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="border border-border/50 bg-gradient-to-br from-card to-muted/10 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-4 w-4 text-primary" />
            Fluxo BPMN - Swim Lanes
          </CardTitle>
          {decisao !== 'pendente' && (
            <Badge variant={decisao === 'devolver' ? 'default' : decisao === 'nao_devolver' ? 'secondary' : 'outline'}>
              {decisao === 'devolver' && '✓ Devolver'}
              {decisao === 'nao_devolver' && '✗ Não Devolver'}
              {decisao === 'em_negociacao' && '↔ Em Negociação'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0 overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Swim Lanes */}
          {SWIM_LANES.map((lane) => {
            const laneActivities = BPMN_ACTIVITIES.filter(a => a.lane === lane.key);
            
            return (
              <div 
                key={lane.key}
                className={cn(
                  "flex items-stretch border-b border-border/50 last:border-b-0",
                  lane.bgColor
                )}
              >
                {/* Lane Label */}
                <div className={cn(
                  "w-36 shrink-0 p-3 border-r border-border/50 flex items-center",
                  "bg-gradient-to-r from-transparent to-transparent"
                )}>
                  <span className={cn("text-xs font-medium", lane.color)}>
                    {lane.label}
                  </span>
                </div>

                {/* Lane Content - Grid de 8 colunas */}
                <div className="flex-1 grid grid-cols-8 gap-1 p-3 min-h-[70px]">
                  {Array.from({ length: 8 }).map((_, colIndex) => {
                    const activity = laneActivities.find(a => a.column === colIndex);
                    
                    // Verificar se precisa mostrar gateway de decisão
                    if (lane.key === 'jessica' && colIndex === 3 && !activity) {
                      return (
                        <div key={colIndex} className="flex items-center justify-center">
                          {/* Vazio - atividade está na coluna */}
                        </div>
                      );
                    }
                    
                    // Verificar se precisa mostrar setas de conexão
                    const showConnection = (() => {
                      // Sistema → Júlia (col 0-1)
                      if (lane.key === 'sistema' && colIndex === 0 && activity) {
                        return { after: true };
                      }
                      // Júlia validação → checklist (col 1-2)
                      if (lane.key === 'julia' && colIndex === 1 && activity) {
                        return { after: true };
                      }
                      // Júlia checklist → parecer (col 2)
                      if (lane.key === 'julia' && colIndex === 2 && activity) {
                        return { after: true, toOtherLane: 'jessica' };
                      }
                      return {};
                    })();

                    if (activity) {
                      return (
                        <div key={colIndex} className="flex items-center gap-1">
                          {renderActivity(activity)}
                          {showConnection.after && colIndex < 7 && renderArrow('right')}
                        </div>
                      );
                    }

                    // Renderizar setas de conexão entre lanes
                    if (lane.key === 'julia' && colIndex === 3) {
                      // Seta de Júlia para Jéssica (parecer)
                      return (
                        <div key={colIndex} className="flex items-center justify-center">
                          <ArrowDown className="h-4 w-4 text-muted-foreground rotate-[135deg]" />
                        </div>
                      );
                    }

                    if (lane.key === 'julia' && colIndex === 4) {
                      // Gateway de merge após decisão
                      if (decisao === 'pendente') {
                        return (
                          <div key={colIndex} className="flex items-center justify-center">
                            <span className="text-[8px] text-muted-foreground text-center">
                              Aguardando<br/>decisão
                            </span>
                          </div>
                        );
                      }
                    }

                    return <div key={colIndex} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="p-3 border-t border-border/50 bg-muted/30">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 border-primary bg-primary/10" />
              <span className="text-muted-foreground">Concluído</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 border-amber-500 bg-amber-100 ring-2 ring-amber-300" />
              <span className="text-muted-foreground">Etapa Atual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 border-border bg-card" />
              <span className="text-muted-foreground">Pendente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 border-muted/50 bg-muted/30 opacity-40" />
              <span className="text-muted-foreground">Fora do Caminho</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-amber-600" />
              <span className="text-muted-foreground">Com SLA</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
