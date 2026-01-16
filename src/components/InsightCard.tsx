import React from 'react';
import { MetricDefinition, MetricStatus } from '@/data/metricsData';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Lightbulb, TrendingDown, TrendingUp } from 'lucide-react';

interface InsightCardProps {
  metric: MetricDefinition;
  status: MetricStatus;
  value: number | string | null;
  formattedValue: string;
}

export function InsightCard({ metric, status, value, formattedValue }: InsightCardProps) {
  if (!status || status === 'great' || status === 'good') return null;
  
  const isWarning = status === 'medium';
  const isError = status === 'bad';
  
  return (
    <div className={cn(
      'insight-card animate-fade-in',
      isError && 'insight-error',
      isWarning && 'insight-warning'
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'p-2 rounded-lg shrink-0',
          isError ? 'bg-red-100' : 'bg-amber-100'
        )}>
          {isError ? (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          ) : (
            <TrendingDown className="w-5 h-5 text-amber-600" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="funnel-stage stage-gestao">
              {metric.etapa}
            </span>
            <span className="font-semibold text-foreground">
              {metric.sigla}
            </span>
            <span className={cn(
              'text-sm font-medium',
              isError ? 'text-red-600' : 'text-amber-600'
            )}>
              {formattedValue}
            </span>
          </div>
          
          <h4 className="font-medium text-foreground mb-2">
            {metric.nome}
          </h4>
          
          <div className="space-y-3 text-sm">
            <div>
              <div className="flex items-center gap-1 text-red-600 font-medium mb-1">
                <TrendingDown className="w-4 h-4" />
                <span>Quando está ruim, significa que:</span>
              </div>
              <p className="text-muted-foreground pl-5">
                {metric.seRuim}
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-1 text-amber-600 font-medium mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Possíveis erros:</span>
              </div>
              <p className="text-muted-foreground pl-5">
                {metric.possiveisErros}
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-1 text-emerald-600 font-medium mb-1">
                <Lightbulb className="w-4 h-4" />
                <span>Ações corretivas:</span>
              </div>
              <p className="text-muted-foreground pl-5">
                {metric.acoesCorretivas}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
