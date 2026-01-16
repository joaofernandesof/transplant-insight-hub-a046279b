import React, { useState } from 'react';
import { MetricDefinition, MetricStatus } from '@/data/metricsData';
import { MetricInput } from './MetricInput';
import { StatusBadge } from './StatusBadge';
import { formatMetricValue } from '@/utils/metricCalculations';
import { cn } from '@/lib/utils';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

interface MetricRowProps {
  metric: MetricDefinition;
  value: number | string | null;
  status: MetricStatus;
  onChange?: (value: number | string | null) => void;
  isEditable?: boolean;
  showDetails?: boolean;
}

const stageClasses: Record<string, string> = {
  'Planejamento': 'stage-planejamento',
  'Tráfego': 'stage-trafego',
  'Landing Page': 'stage-landing',
  'Conversão': 'stage-conversao',
  'Leads': 'stage-leads',
  'Atendimento': 'stage-atendimento',
  'Agendamento': 'stage-agendamento',
  'Consulta': 'stage-consulta',
  'Vendas': 'stage-vendas',
  'Financeiro': 'stage-financeiro',
  'Gestão': 'stage-gestao'
};

export function MetricRow({ 
  metric, 
  value, 
  status, 
  onChange, 
  isEditable = false,
  showDetails = false 
}: MetricRowProps) {
  const [expanded, setExpanded] = useState(false);
  
  const formattedValue = formatMetricValue(value, metric.formato);
  const isAuto = metric.tipo === 'auto';
  
  return (
    <div className={cn(
      'border-b border-border last:border-b-0 transition-colors',
      expanded && 'bg-muted/30'
    )}>
      <div className="grid grid-cols-12 gap-2 items-center py-3 px-4">
        {/* Sigla */}
        <div className="col-span-1">
          <span className="font-mono font-bold text-primary text-sm">
            {metric.sigla}
          </span>
        </div>
        
        {/* Nome/Descrição */}
        <div className="col-span-3">
          <p className="font-medium text-foreground text-sm truncate" title={metric.nome}>
            {metric.nome}
          </p>
          <p className="text-xs text-muted-foreground truncate" title={metric.descricao}>
            {metric.descricao}
          </p>
        </div>
        
        {/* Etapa */}
        <div className="col-span-1">
          <span className={cn('funnel-stage text-[10px]', stageClasses[metric.etapa])}>
            {metric.etapa}
          </span>
        </div>
        
        {/* Tipo */}
        <div className="col-span-1">
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            isAuto 
              ? 'bg-purple-100 text-purple-700' 
              : 'bg-blue-100 text-blue-700'
          )}>
            {isAuto ? 'Auto' : 'Manual'}
          </span>
        </div>
        
        {/* Valor/Input */}
        <div className="col-span-2">
          {isEditable && !isAuto ? (
            <MetricInput
              value={value}
              onChange={onChange!}
              formato={metric.formato}
              placeholder={metric.unidade}
            />
          ) : (
            <span className={cn(
              'font-semibold text-sm',
              status === 'bad' && 'text-red-600',
              status === 'medium' && 'text-amber-600',
              status === 'good' && 'text-sky-600',
              status === 'great' && 'text-emerald-600'
            )}>
              {formattedValue}
            </span>
          )}
        </div>
        
        {/* Faixas */}
        <div className="col-span-2 flex gap-1 text-[10px]">
          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700" title="Ruim">
            {metric.ruim}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700" title="Médio">
            {metric.medio}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-700" title="Bom">
            {metric.bom}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700" title="Ótimo">
            {metric.otimo}
          </span>
        </div>
        
        {/* Status */}
        <div className="col-span-1">
          <StatusBadge status={status} size="sm" />
        </div>
        
        {/* Ações */}
        <div className="col-span-1 flex justify-end">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Ver detalhes"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
      
      {/* Detalhes expandidos */}
      {expanded && (
        <div className="px-4 pb-4 animate-slide-up">
          <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Como encontrar
                </h5>
                <p className="text-sm text-foreground">{metric.comoEncontrar}</p>
              </div>
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  O que mede
                </h5>
                <p className="text-sm text-foreground">{metric.oQueMede}</p>
              </div>
            </div>
            
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                Fórmula
              </h5>
              <p className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                {metric.formula}
              </p>
            </div>
            
            {status === 'bad' || status === 'medium' ? (
              <div className="pt-3 border-t border-border space-y-3">
                <div>
                  <h5 className="text-xs font-semibold text-red-600 uppercase mb-1">
                    🚨 Se estiver ruim, significa que:
                  </h5>
                  <p className="text-sm text-foreground">{metric.seRuim}</p>
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-amber-600 uppercase mb-1">
                    ❌ Possíveis erros:
                  </h5>
                  <p className="text-sm text-foreground">{metric.possiveisErros}</p>
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-emerald-600 uppercase mb-1">
                    🛠️ Ações corretivas:
                  </h5>
                  <p className="text-sm text-foreground">{metric.acoesCorretivas}</p>
                </div>
              </div>
            ) : status === 'good' || status === 'great' ? (
              <div className="pt-3 border-t border-border">
                <h5 className="text-xs font-semibold text-emerald-600 uppercase mb-1">
                  ✅ Se estiver bom, significa que:
                </h5>
                <p className="text-sm text-foreground">{metric.seBom}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
