/**
 * BPMN Flow Visualization with Swimlanes
 * Commercial and Post-Sale flows with blocking rules
 */

import { useState } from 'react';
import { COMMERCIAL_STAGES, POST_SALE_STAGES, StageConfig, STAGE_LABELS } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Circle, 
  CheckCircle2, 
  Lock,
  Play,
  Square,
  Users,
  Briefcase,
  HeartPulse
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BPMNFlowProps {
  className?: string;
}

interface FlowNodeProps {
  stage: StageConfig;
  isFirst?: boolean;
  isLast?: boolean;
  showArrow?: boolean;
}

function FlowNode({ stage, isFirst, isLast, showArrow = true }: FlowNodeProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Node */}
      <div className="relative group">
        {/* Start Event */}
        {isFirst && (
          <div className="absolute -left-8 top-1/2 -translate-y-1/2">
            <Circle className="h-6 w-6 text-emerald-500 fill-emerald-100" />
          </div>
        )}
        
        {/* Task Box */}
        <div className={cn(
          "flex flex-col items-center p-3 rounded-lg border-2 min-w-[120px] transition-all",
          "hover:shadow-md cursor-pointer",
          `bg-gradient-to-br ${stage.color} text-white border-transparent`
        )}>
          <span className="text-xs font-semibold text-center">{stage.label}</span>
          <Badge 
            variant="secondary" 
            className="mt-1 text-[9px] bg-white/20 text-white border-0"
          >
            {stage.checklist.filter(c => c.required).length} obrigatório(s)
          </Badge>
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
          <div className="bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg border max-w-[200px]">
            <p className="font-medium mb-1">{stage.label}</p>
            <p className="text-muted-foreground mb-2">{stage.description}</p>
            <div className="space-y-1">
              {stage.checklist.map(item => (
                <div key={item.id} className="flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5 text-amber-500" />
                  <span className="text-[10px]">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t">
              <p className="text-[10px] text-destructive flex items-center gap-1">
                <Lock className="h-3 w-3" />
                {stage.blockingMessage}
              </p>
            </div>
          </div>
        </div>

        {/* End Event */}
        {isLast && (
          <div className="absolute -right-8 top-1/2 -translate-y-1/2">
            <Square className="h-6 w-6 text-rose-500 fill-rose-100 rounded" />
          </div>
        )}
      </div>

      {/* Arrow */}
      {showArrow && !isLast && (
        <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
      )}
    </div>
  );
}

export function BPMNFlow({ className }: BPMNFlowProps) {
  const [activeTab, setActiveTab] = useState<'full' | 'comercial' | 'posvenda'>('full');

  return (
    <div className={cn("space-y-6", className)}>
      {/* Tab Selector */}
      <div className="flex gap-2">
        <Badge 
          variant={activeTab === 'full' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setActiveTab('full')}
        >
          Fluxo Completo
        </Badge>
        <Badge 
          variant={activeTab === 'comercial' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setActiveTab('comercial')}
        >
          Comercial
        </Badge>
        <Badge 
          variant={activeTab === 'posvenda' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setActiveTab('posvenda')}
        >
          Pós-Venda
        </Badge>
      </div>

      {/* BPMN Diagram */}
      <Card className="overflow-x-auto">
        <CardContent className="p-6 min-w-[1200px]">
          {/* Pool Container */}
          <div className="border-2 border-primary/20 rounded-xl overflow-hidden">
            {/* Pool Header */}
            <div className="bg-primary/10 px-4 py-2 border-b-2 border-primary/20">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <Users className="h-5 w-5" />
                Jornada do Paciente - Clínica de Transplante Capilar
              </h3>
            </div>

            {/* Swimlanes */}
            <div className="flex flex-col">
              {/* Commercial Swimlane */}
              {(activeTab === 'full' || activeTab === 'comercial') && (
                <div className="flex border-b-2 border-primary/20 last:border-b-0">
                  {/* Lane Label */}
                  <div className="w-32 shrink-0 bg-blue-50 dark:bg-blue-950/30 border-r-2 border-primary/20 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-1 py-4">
                      <Briefcase className="h-6 w-6 text-blue-600" />
                      <span className="text-xs font-bold text-blue-600 [writing-mode:vertical-lr] rotate-180">
                        COMERCIAL
                      </span>
                    </div>
                  </div>

                  {/* Lane Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Start Event */}
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-center">
                          <Circle className="h-8 w-8 text-emerald-500 fill-emerald-100" />
                          <span className="text-[10px] text-muted-foreground mt-1">Início</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>

                      {/* Commercial Stages */}
                      {COMMERCIAL_STAGES.map((stage, idx) => (
                        <FlowNode
                          key={stage.id}
                          stage={stage}
                          isLast={activeTab === 'comercial' && idx === COMMERCIAL_STAGES.length - 1}
                          showArrow={idx < COMMERCIAL_STAGES.length - 1 || activeTab === 'full'}
                        />
                      ))}

                      {/* Transition to Post-Sale */}
                      {activeTab === 'full' && (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full border-2 border-dashed border-primary flex items-center justify-center">
                              <ArrowRight className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1">Transferir</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Post-Sale Swimlane */}
              {(activeTab === 'full' || activeTab === 'posvenda') && (
                <div className="flex">
                  {/* Lane Label */}
                  <div className="w-32 shrink-0 bg-emerald-50 dark:bg-emerald-950/30 border-r-2 border-primary/20 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-1 py-4">
                      <HeartPulse className="h-6 w-6 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-600 [writing-mode:vertical-lr] rotate-180">
                        PÓS-VENDA
                      </span>
                    </div>
                  </div>

                  {/* Lane Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* From Commercial transition */}
                      {activeTab === 'full' && (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full border-2 border-dashed border-emerald-500 flex items-center justify-center">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1">Receber</span>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}

                      {activeTab === 'posvenda' && (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-center">
                            <Circle className="h-8 w-8 text-emerald-500 fill-emerald-100" />
                            <span className="text-[10px] text-muted-foreground mt-1">Início</span>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}

                      {/* Post-Sale Stages */}
                      {POST_SALE_STAGES.map((stage, idx) => (
                        <FlowNode
                          key={stage.id}
                          stage={stage}
                          isLast={idx === POST_SALE_STAGES.length - 1}
                          showArrow={idx < POST_SALE_STAGES.length - 1}
                        />
                      ))}

                      {/* End Event */}
                      <div className="flex items-center gap-2 ml-2">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full border-4 border-rose-500 flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-rose-500" />
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1">Fim</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Legenda BPMN</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Circle className="h-5 w-5 text-emerald-500 fill-emerald-100" />
              <span>Evento de Início</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border-4 border-rose-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
              <span>Evento de Fim</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-6 rounded bg-gradient-to-r from-blue-500 to-blue-600" />
              <span>Tarefa/Etapa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-dashed border-primary flex items-center justify-center">
                <ArrowRight className="h-3 w-3 text-primary" />
              </div>
              <span>Transição entre Pools</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-500" />
              <span>Regra de Bloqueio (checklist obrigatório)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
