/**
 * DistratoSwimLanesBpmn - Visualização BPMN 2.0.2 em formato de Swim Lanes
 * Implementação com notação técnica padrão BPMN 2.0.2
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BpmnEvent, BpmnTask, BpmnGateway, BpmnFlow } from './bpmn/BpmnShapes';

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

const SWIM_LANES: { key: Responsavel; label: string; color: string }[] = [
  { key: 'sistema', label: 'Sistema', color: 'bg-slate-700' },
  { key: 'julia', label: 'Administrativo', color: 'bg-blue-700' },
  { key: 'jessica', label: 'Gerência', color: 'bg-purple-700' },
  { key: 'financeiro', label: 'Financeiro', color: 'bg-emerald-700' },
];

// Mapeamento de atividades
interface ActivityConfig {
  key: DistratoEtapaBpmn;
  label: string;
  lane: Responsavel;
  taskType: 'user' | 'service' | 'manual' | 'send' | 'receive';
  sla?: string;
  column: number;
}

const ACTIVITIES: ActivityConfig[] = [
  { key: 'solicitacao_recebida', label: 'Receber Solicitação', lane: 'sistema', taskType: 'receive', column: 1 },
  { key: 'validacao_contato', label: 'Validar Contato', lane: 'julia', taskType: 'user', sla: '24h', column: 2 },
  { key: 'checklist_preenchido', label: 'Preencher Checklist', lane: 'julia', taskType: 'manual', sla: '24h', column: 3 },
  { key: 'aguardando_parecer_gerente', label: 'Emitir Parecer', lane: 'jessica', taskType: 'user', sla: '24h', column: 4 },
  { key: 'em_negociacao', label: 'Negociar', lane: 'jessica', taskType: 'user', sla: '24h', column: 5 },
  { key: 'aguardando_assinatura', label: 'Coletar Assinatura', lane: 'julia', taskType: 'send', column: 6 },
  { key: 'aguardando_pagamento', label: 'Processar Pagamento', lane: 'financeiro', taskType: 'service', sla: '24h', column: 7 },
  { key: 'caso_concluido', label: 'Arquivar Caso', lane: 'julia', taskType: 'manual', column: 8 },
];

interface DistratoSwimLanesBpmnProps {
  currentEtapa: DistratoEtapaBpmn;
  decisao: DistratoDecisao;
}

export function DistratoSwimLanesBpmn({ 
  currentEtapa, 
  decisao
}: DistratoSwimLanesBpmnProps) {
  const [zoom, setZoom] = useState(100);
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
          className="min-w-[1100px] transition-transform origin-top-left"
          style={{ transform: `scale(${zoom / 100})`, width: `${10000 / zoom}%` }}
        >
          {/* Pool Container */}
          <div className="flex border-t border-border/50">
            {/* Pool Label */}
            <div className="w-10 shrink-0 bg-slate-800 flex items-center justify-center min-h-[400px]">
              <span className="text-white text-sm font-bold whitespace-nowrap transform -rotate-90 origin-center tracking-wider">
                DISTRATO
              </span>
            </div>

            {/* Lanes Container */}
            <div className="flex-1">
              {SWIM_LANES.map((lane) => {
                const laneActivities = ACTIVITIES.filter(a => a.lane === lane.key);
                
                return (
                  <div 
                    key={lane.key}
                    className="flex border-b border-border/30 last:border-b-0"
                  >
                    {/* Lane Label */}
                    <div className={cn(
                      "w-28 shrink-0 flex items-center justify-center",
                      lane.color
                    )}>
                      <span className="text-white text-xs font-semibold whitespace-nowrap transform -rotate-90 origin-center">
                        {lane.label}
                      </span>
                    </div>

                    {/* Lane Content - Grid de colunas */}
                    <div 
                      className="flex-1 grid min-h-[100px] items-center bg-muted/10"
                      style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}
                    >
                      {/* Coluna 0: Evento de Início (apenas na lane Sistema) */}
                      {lane.key === 'sistema' && (
                        <div className="flex items-center justify-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <BpmnEvent 
                                    type="start" 
                                    variant="message"
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
                        
                        // Gateway exclusivo após parecer (coluna 5 na lane jessica)
                        if (lane.key === 'jessica' && col === 5 && !activity) {
                          return (
                            <div key={col} className="flex items-center justify-center">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <BpmnGateway 
                                        type="exclusive" 
                                        status={getGatewayStatus()}
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
                            <div key={col} className="flex items-center justify-center py-3">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <BpmnTask
                                        type={activity.taskType}
                                        label={activity.label}
                                        status={status}
                                        sla={activity.sla}
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
                                  <BpmnEvent 
                                    type="end" 
                                    variant="terminate"
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

          {/* Conexões SVG Overlay */}
          <svg 
            className="absolute inset-0 pointer-events-none" 
            style={{ 
              width: '100%', 
              height: '100%',
              left: '138px',
              top: '60px'
            }}
          >
            {/* As conexões serão desenhadas aqui via path */}
          </svg>
        </div>

        {/* Legenda BPMN */}
        <div className="p-3 border-t border-border/50 bg-muted/30">
          <div className="flex flex-wrap items-center gap-6 text-xs">
            {/* Eventos */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Eventos:</span>
              <div className="flex items-center gap-1">
                <svg width="20" height="20" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span className="text-muted-foreground">Início</span>
              </div>
              <div className="flex items-center gap-1">
                <svg width="20" height="20" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="3" />
                  <circle cx="20" cy="20" r="6" fill="currentColor" />
                </svg>
                <span className="text-muted-foreground">Término</span>
              </div>
            </div>

            {/* Tarefas */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Tarefas:</span>
              <div className="flex items-center gap-1">
                <div className="w-5 h-4 rounded border-2 border-current" />
                <span className="text-muted-foreground">Atividade</span>
              </div>
            </div>

            {/* Gateway */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Gateway:</span>
              <div className="flex items-center gap-1">
                <svg width="20" height="20" viewBox="0 0 40 40">
                  <rect x="8" y="8" width="16" height="16" rx="1" transform="rotate(45 16 16)" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 12l8 8M20 12l-8 8" stroke="currentColor" strokeWidth="1.5" />
                </svg>
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
