/**
 * DistratoSwimLanesBpmn - Visualização BPMN 2.0.2 em formato de Swim Lanes
 * Design modernizado com formas arredondadas coloridas e linhas conectoras
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, ZoomIn, ZoomOut, Mail, UserCheck, ClipboardCheck, FileSignature, Wallet, Archive, MessageSquare, HandCoins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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

const SWIM_LANES: { key: Responsavel; label: string; bgColor: string; textColor: string }[] = [
  { key: 'sistema', label: 'Sistema', bgColor: 'bg-slate-600', textColor: 'text-white' },
  { key: 'julia', label: 'Administrativo', bgColor: 'bg-blue-600', textColor: 'text-white' },
  { key: 'jessica', label: 'Gerência', bgColor: 'bg-purple-600', textColor: 'text-white' },
  { key: 'financeiro', label: 'Financeiro', bgColor: 'bg-emerald-600', textColor: 'text-white' },
];

// Mapeamento de atividades com cores vibrantes
interface ActivityConfig {
  key: DistratoEtapaBpmn;
  label: string;
  lane: Responsavel;
  icon: React.ReactNode;
  color: {
    bg: string;
    border: string;
    text: string;
    iconBg: string;
  };
  sla?: string;
  column: number;
}

const getActivityConfigs = (): ActivityConfig[] => [
  { 
    key: 'solicitacao_recebida', 
    label: 'Receber Solicitação', 
    lane: 'sistema', 
    icon: <Mail className="h-5 w-5" />,
    color: { bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-400', text: 'text-slate-700 dark:text-slate-200', iconBg: 'bg-slate-500' },
    column: 1 
  },
  { 
    key: 'validacao_contato', 
    label: 'Validar Contato', 
    lane: 'julia', 
    icon: <UserCheck className="h-5 w-5" />,
    color: { bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-400', text: 'text-blue-700 dark:text-blue-200', iconBg: 'bg-blue-500' },
    sla: '24h', 
    column: 2 
  },
  { 
    key: 'checklist_preenchido', 
    label: 'Preencher Checklist', 
    lane: 'julia', 
    icon: <ClipboardCheck className="h-5 w-5" />,
    color: { bg: 'bg-cyan-50 dark:bg-cyan-950', border: 'border-cyan-400', text: 'text-cyan-700 dark:text-cyan-200', iconBg: 'bg-cyan-500' },
    sla: '24h', 
    column: 3 
  },
  { 
    key: 'aguardando_parecer_gerente', 
    label: 'Emitir Parecer', 
    lane: 'jessica', 
    icon: <MessageSquare className="h-5 w-5" />,
    color: { bg: 'bg-purple-50 dark:bg-purple-950', border: 'border-purple-400', text: 'text-purple-700 dark:text-purple-200', iconBg: 'bg-purple-500' },
    sla: '24h', 
    column: 4 
  },
  { 
    key: 'em_negociacao', 
    label: 'Negociar', 
    lane: 'jessica', 
    icon: <HandCoins className="h-5 w-5" />,
    color: { bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-400', text: 'text-amber-700 dark:text-amber-200', iconBg: 'bg-amber-500' },
    sla: '24h', 
    column: 5 
  },
  { 
    key: 'aguardando_assinatura', 
    label: 'Coletar Assinatura', 
    lane: 'julia', 
    icon: <FileSignature className="h-5 w-5" />,
    color: { bg: 'bg-indigo-50 dark:bg-indigo-950', border: 'border-indigo-400', text: 'text-indigo-700 dark:text-indigo-200', iconBg: 'bg-indigo-500' },
    column: 6 
  },
  { 
    key: 'aguardando_pagamento', 
    label: 'Processar Pagamento', 
    lane: 'financeiro', 
    icon: <Wallet className="h-5 w-5" />,
    color: { bg: 'bg-emerald-50 dark:bg-emerald-950', border: 'border-emerald-400', text: 'text-emerald-700 dark:text-emerald-200', iconBg: 'bg-emerald-500' },
    sla: '24h', 
    column: 7 
  },
  { 
    key: 'caso_concluido', 
    label: 'Arquivar Caso', 
    lane: 'julia', 
    icon: <Archive className="h-5 w-5" />,
    color: { bg: 'bg-green-50 dark:bg-green-950', border: 'border-green-400', text: 'text-green-700 dark:text-green-200', iconBg: 'bg-green-500' },
    column: 8 
  },
];

interface DistratoSwimLanesBpmnProps {
  currentEtapa: DistratoEtapaBpmn;
  decisao: DistratoDecisao;
}

// Componente de nó arredondado colorido
function BpmnNode({ 
  activity, 
  status,
}: { 
  activity: ActivityConfig; 
  status: 'complete' | 'current' | 'future' | 'inactive';
}) {
  const isActive = status !== 'inactive';
  const isCurrent = status === 'current';
  const isComplete = status === 'complete';
  
  return (
    <div className="relative flex flex-col items-center">
      {/* Badge "Atual" */}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-amber-500 text-white text-[10px] px-2 py-0.5 shadow-lg">
            Atual
          </Badge>
        </div>
      )}
      
      {/* Círculo principal */}
      <div className={cn(
        "relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
        "shadow-lg border-3",
        isCurrent && "ring-4 ring-amber-400/50 scale-110",
        isComplete && "opacity-100",
        !isActive && "opacity-40 grayscale",
        activity.color.iconBg,
        "border-white dark:border-gray-800"
      )}>
        <div className="text-white">
          {activity.icon}
        </div>
        
        {/* Checkmark para completos */}
        {isComplete && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Label */}
      <div className={cn(
        "mt-2 px-3 py-1.5 rounded-full text-center max-w-[120px] shadow-sm border",
        isActive ? activity.color.bg : "bg-muted/50",
        isActive ? activity.color.border : "border-muted",
        isActive ? activity.color.text : "text-muted-foreground",
        isCurrent && "ring-2 ring-amber-400/50 font-semibold"
      )}>
        <span className="text-[11px] leading-tight block">{activity.label}</span>
      </div>
      
      {/* SLA Badge */}
      {activity.sla && isActive && (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          {activity.sla}
        </div>
      )}
    </div>
  );
}

// Evento de início/fim (círculo simples)
function BpmnEventNode({ 
  type, 
  status 
}: { 
  type: 'start' | 'end'; 
  status: 'complete' | 'current' | 'future';
}) {
  const isStart = type === 'start';
  const isComplete = status === 'complete';
  const isCurrent = status === 'current';
  
  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center border-3 transition-all",
        isStart ? "border-primary bg-primary/20" : "border-rose-500 bg-rose-500/20",
        isComplete && "ring-2 ring-primary/30",
        isCurrent && "ring-4 ring-amber-400/50 scale-110"
      )}>
        {isStart ? (
          <Mail className="h-4 w-4 text-primary" />
        ) : (
          <div className="w-4 h-4 rounded-full bg-rose-500" />
        )}
      </div>
      <span className="mt-1 text-[10px] text-muted-foreground">
        {isStart ? 'Início' : 'Fim'}
      </span>
    </div>
  );
}

// Gateway (losango arredondado)
function BpmnGatewayNode({ 
  status,
  label
}: { 
  status: 'complete' | 'current' | 'future';
  label?: string;
}) {
  const isComplete = status === 'complete';
  const isCurrent = status === 'current';
  
  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        "w-12 h-12 rotate-45 rounded-lg flex items-center justify-center border-3 transition-all shadow-md",
        isComplete ? "bg-primary/20 border-primary" : isCurrent ? "bg-amber-100 border-amber-500 ring-4 ring-amber-400/50" : "bg-muted border-muted-foreground",
      )}>
        <span className="-rotate-45 text-lg font-bold text-muted-foreground">✕</span>
      </div>
      {label && (
        <span className="mt-3 text-[10px] text-muted-foreground text-center max-w-[80px]">
          {label}
        </span>
      )}
    </div>
  );
}

export function DistratoSwimLanesBpmn({ 
  currentEtapa, 
  decisao
}: DistratoSwimLanesBpmnProps) {
  const [zoom, setZoom] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<{x1: number; y1: number; x2: number; y2: number}[]>([]);
  
  const ACTIVITIES = getActivityConfigs();
  const currentActivityIndex = ACTIVITIES.findIndex(a => a.key === currentEtapa);

  // Determinar caminho ativo baseado na decisão
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
    return basePath;
  };

  const activePath = getActivePath();

  const getActivityStatus = (activity: ActivityConfig): 'complete' | 'current' | 'future' | 'inactive' => {
    const activityIndex = ACTIVITIES.findIndex(a => a.key === activity.key);
    const inPath = decisao === 'pendente' || activePath.includes(activity.key);
    
    if (!inPath) return 'inactive';
    if (activityIndex < currentActivityIndex) return 'complete';
    if (activityIndex === currentActivityIndex) return 'current';
    return 'future';
  };

  const getEventStatus = (position: 'start' | 'end'): 'complete' | 'current' | 'future' => {
    if (position === 'start') return 'complete';
    if (currentEtapa === 'caso_concluido') return 'current';
    return 'future';
  };

  const getGatewayStatus = (): 'complete' | 'current' | 'future' => {
    const gatewayAfterIndex = ACTIVITIES.findIndex(a => a.key === 'aguardando_parecer_gerente');
    if (currentActivityIndex > gatewayAfterIndex) return 'complete';
    if (currentActivityIndex === gatewayAfterIndex && decisao !== 'pendente') return 'complete';
    if (currentActivityIndex === gatewayAfterIndex) return 'current';
    return 'future';
  };

  return (
    <Card className="border border-border/50 bg-gradient-to-br from-card to-muted/10 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-4 w-4 text-primary" />
            Fluxo BPMN 2.0.2 - Processo de Distrato
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setZoom(Math.max(50, zoom - 10))}
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-xs w-10 text-center">{zoom}%</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setZoom(Math.min(150, zoom + 10))}
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>

            {decisao !== 'pendente' && (
              <Badge variant={decisao === 'devolver' ? 'default' : decisao === 'nao_devolver' ? 'secondary' : 'outline'}>
                {decisao === 'devolver' && '✓ Devolver'}
                {decisao === 'nao_devolver' && '✗ Não Devolver'}
                {decisao === 'em_negociacao' && '↔ Em Negociação'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 overflow-x-auto">
        <div 
          ref={containerRef}
          className="relative min-w-[1200px] transition-transform origin-top-left"
          style={{ transform: `scale(${zoom / 100})`, width: `${10000 / zoom}%` }}
        >
          {/* SVG para linhas conectoras */}
          <svg 
            className="absolute inset-0 pointer-events-none z-0" 
            width="100%" 
            height="100%"
            style={{ minHeight: '500px' }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--muted-foreground))" />
              </marker>
              <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
              </marker>
            </defs>
            
            {/* Conexão: Início -> Solicitação Recebida */}
            <line x1="180" y1="75" x2="250" y2="75" stroke="hsl(var(--primary))" strokeWidth="2" markerEnd="url(#arrowhead-active)" />
            
            {/* Conexão: Solicitação -> Validar (diagonal para baixo) */}
            <path d="M 340 95 Q 370 130 400 170" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" markerEnd="url(#arrowhead-active)" />
            
            {/* Conexão: Validar -> Checklist */}
            <line x1="460" y1="175" x2="530" y2="175" stroke={currentActivityIndex > 1 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} strokeWidth="2" markerEnd={currentActivityIndex > 1 ? "url(#arrowhead-active)" : "url(#arrowhead)"} />
            
            {/* Conexão: Checklist -> Parecer (diagonal para baixo) */}
            <path d="M 620 195 Q 650 230 680 270" stroke={currentActivityIndex > 2 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} strokeWidth="2" fill="none" markerEnd={currentActivityIndex > 2 ? "url(#arrowhead-active)" : "url(#arrowhead)"} />
            
            {/* Conexão: Parecer -> Gateway */}
            <line x1="760" y1="275" x2="820" y2="275" stroke={currentActivityIndex > 3 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} strokeWidth="2" markerEnd={currentActivityIndex > 3 ? "url(#arrowhead-active)" : "url(#arrowhead)"} />
            
            {/* Gateway -> Negociação */}
            {(decisao === 'pendente' || decisao === 'em_negociacao') && (
              <line x1="870" y1="275" x2="920" y2="275" stroke={currentActivityIndex > 4 && decisao === 'em_negociacao' ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} strokeWidth="2" strokeDasharray={decisao === 'pendente' ? "5,5" : "none"} markerEnd="url(#arrowhead)" />
            )}
            
            {/* Gateway -> Assinatura (para cima, direto) */}
            {(decisao === 'devolver' || decisao === 'nao_devolver') && (
              <path d="M 845 250 Q 845 175 920 175" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" markerEnd="url(#arrowhead-active)" />
            )}
            
            {/* Negociação -> Assinatura (para cima) */}
            {decisao === 'em_negociacao' && (
              <path d="M 980 250 Q 1000 200 1030 175" stroke={currentActivityIndex > 4 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
            )}
            
            {/* Assinatura -> Pagamento (para baixo) */}
            {(decisao === 'devolver' || decisao === 'em_negociacao' || decisao === 'pendente') && (
              <path d="M 1020 195 Q 1050 280 1100 370" stroke={currentActivityIndex > 5 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} strokeWidth="2" fill="none" strokeDasharray={decisao === 'pendente' ? "5,5" : "none"} markerEnd="url(#arrowhead)" />
            )}
            
            {/* Pagamento -> Arquivar (para cima) */}
            {(decisao === 'devolver' || decisao === 'em_negociacao' || decisao === 'pendente') && (
              <path d="M 1180 350 Q 1210 250 1240 175" stroke={currentActivityIndex > 6 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} strokeWidth="2" fill="none" strokeDasharray={decisao === 'pendente' ? "5,5" : "none"} markerEnd="url(#arrowhead)" />
            )}
            
            {/* Assinatura -> Arquivar (direto, se não devolver) */}
            {decisao === 'nao_devolver' && (
              <line x1="1030" y1="175" x2="1240" y2="175" stroke="hsl(var(--primary))" strokeWidth="2" markerEnd="url(#arrowhead-active)" />
            )}
            
            {/* Arquivar -> Fim */}
            <line x1="1330" y1="175" x2="1380" y2="175" stroke={currentEtapa === 'caso_concluido' ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} strokeWidth="2" markerEnd={currentEtapa === 'caso_concluido' ? "url(#arrowhead-active)" : "url(#arrowhead)"} />
          </svg>

          {/* Pool Container */}
          <div className="relative z-10 flex border-t border-border/50">
            {/* Pool Label */}
            <div className="w-10 shrink-0 bg-slate-800 flex items-center justify-center min-h-[500px]">
              <span className="text-white text-sm font-bold whitespace-nowrap transform -rotate-90 origin-center tracking-wider">
                DISTRATO
              </span>
            </div>

            {/* Lanes Container */}
            <div className="flex-1">
              {SWIM_LANES.map((lane, laneIndex) => {
                const laneActivities = ACTIVITIES.filter(a => a.lane === lane.key);
                const laneHeight = 125;
                
                return (
                  <div 
                    key={lane.key}
                    className="flex border-b border-border/30 last:border-b-0"
                    style={{ minHeight: `${laneHeight}px` }}
                  >
                    {/* Lane Label */}
                    <div className={cn(
                      "w-28 shrink-0 flex items-center justify-center",
                      lane.bgColor
                    )}>
                      <span className={cn(
                        "text-xs font-semibold whitespace-nowrap transform -rotate-90 origin-center",
                        lane.textColor
                      )}>
                        {lane.label}
                      </span>
                    </div>

                    {/* Lane Content - Grid de colunas */}
                    <div 
                      className="flex-1 grid items-center bg-gradient-to-r from-muted/5 to-muted/20 py-4"
                      style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}
                    >
                      {/* Coluna 0: Evento de Início (apenas na lane Sistema) */}
                      {lane.key === 'sistema' && (
                        <div className="flex items-center justify-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <BpmnEventNode 
                                    type="start" 
                                    status={getEventStatus('start')}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">Evento de Início</p>
                                <p className="text-xs text-muted-foreground">E-mail de solicitação recebido</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                      {lane.key !== 'sistema' && <div />}

                      {/* Colunas 1-8: Atividades */}
                      {Array.from({ length: 8 }).map((_, colIndex) => {
                        const col = colIndex + 1;
                        const activity = laneActivities.find(a => a.column === col);
                        
                        // Gateway exclusivo após parecer (coluna 5 na lane jessica, entre parecer e negociação)
                        if (lane.key === 'jessica' && col === 5 && !activity) {
                          return (
                            <div key={col} className="flex items-center justify-center -ml-8">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <BpmnGatewayNode 
                                        status={getGatewayStatus()}
                                        label="Decisão"
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-medium">Gateway Exclusivo</p>
                                    <p className="text-xs text-muted-foreground">
                                      Decisão: Devolver / Não Devolver / Negociar
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          );
                        }

                        if (activity) {
                          const status = getActivityStatus(activity);
                          return (
                            <div key={col} className="flex items-center justify-center">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <BpmnNode
                                        activity={activity}
                                        status={status}
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-medium">{activity.label}</p>
                                    {activity.sla && (
                                      <p className="text-xs text-amber-600">SLA: {activity.sla}</p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          );
                        }

                        return <div key={col} />;
                      })}

                      {/* Coluna 9: Evento de Fim (apenas na lane Julia após arquivar) */}
                      {lane.key === 'julia' && (
                        <div className="flex items-center justify-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <BpmnEventNode 
                                    type="end" 
                                    status={getEventStatus('end')}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">Evento de Término</p>
                                <p className="text-xs text-muted-foreground">Processo finalizado</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                      {lane.key !== 'julia' && <div />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legenda BPMN */}
        <div className="p-3 border-t border-border/50 bg-muted/30">
          <div className="flex flex-wrap items-center gap-6 text-xs">
            {/* Eventos */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Eventos:</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary/20" />
                <span className="text-muted-foreground">Início</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full border-2 border-rose-500 bg-rose-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                </div>
                <span className="text-muted-foreground">Término</span>
              </div>
            </div>

            {/* Atividades */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Atividade:</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Tarefa</span>
              </div>
            </div>

            {/* Gateway */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Gateway:</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rotate-45 rounded-sm border-2 border-muted-foreground bg-muted" />
                <span className="text-muted-foreground">Exclusivo</span>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Status:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">Concluído</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-300" />
                <span className="text-muted-foreground">Atual</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full border-2 border-muted-foreground" />
                <span className="text-muted-foreground">Pendente</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
