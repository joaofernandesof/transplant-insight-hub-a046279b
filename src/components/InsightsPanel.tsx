import React from 'react';
import { metrics } from '@/data/metricsData';
import { CalculatedMetrics, getMetricStatus, formatMetricValue } from '@/utils/metricCalculations';
import { InsightCard } from './InsightCard';
import { AlertTriangle, Lightbulb, TrendingUp, CheckCircle } from 'lucide-react';

interface InsightsPanelProps {
  calculatedValues: CalculatedMetrics;
  manualValues: Record<string, number | string | null>;
}

export function InsightsPanel({ calculatedValues, manualValues }: InsightsPanelProps) {
  const allValues = { ...calculatedValues, ...manualValues };
  
  // Get metrics with bad or medium status
  const problemMetrics = metrics
    .map(m => ({
      metric: m,
      value: allValues[m.sigla],
      status: getMetricStatus(m.sigla, allValues[m.sigla]),
      formattedValue: formatMetricValue(allValues[m.sigla], m.formato)
    }))
    .filter(m => m.status === 'bad' || m.status === 'medium')
    .sort((a, b) => {
      // Sort by severity (bad first) then by funnel stage
      if (a.status === 'bad' && b.status !== 'bad') return -1;
      if (a.status !== 'bad' && b.status === 'bad') return 1;
      return 0;
    });
  
  const badCount = problemMetrics.filter(m => m.status === 'bad').length;
  const mediumCount = problemMetrics.filter(m => m.status === 'medium').length;
  
  if (problemMetrics.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-emerald-700 mb-2">
          Parabéns! Todos os indicadores estão saudáveis 🎉
        </h3>
        <p className="text-emerald-600 text-sm">
          Continue monitorando semanalmente para manter o funil otimizado.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 rounded-xl">
            <Lightbulb className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Insights do Mentor
            </h3>
            <p className="text-muted-foreground text-sm">
              Identificamos <strong className="text-red-600">{badCount} problemas críticos</strong>
              {mediumCount > 0 && (
                <> e <strong className="text-amber-600">{mediumCount} pontos de atenção</strong></>
              )}
              . Veja abaixo o que está acontecendo e como corrigir.
            </p>
          </div>
        </div>
      </div>
      
      {/* Critical Issues First */}
      {badCount > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-red-600">
              Problemas Críticos ({badCount})
            </h4>
          </div>
          <div className="space-y-4">
            {problemMetrics
              .filter(m => m.status === 'bad')
              .map(m => (
                <InsightCard
                  key={m.metric.sigla}
                  metric={m.metric}
                  status={m.status}
                  value={m.value}
                  formattedValue={m.formattedValue}
                />
              ))
            }
          </div>
        </div>
      )}
      
      {/* Warning Issues */}
      {mediumCount > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <h4 className="font-semibold text-amber-600">
              Pontos de Atenção ({mediumCount})
            </h4>
          </div>
          <div className="space-y-4">
            {problemMetrics
              .filter(m => m.status === 'medium')
              .map(m => (
                <InsightCard
                  key={m.metric.sigla}
                  metric={m.metric}
                  status={m.status}
                  value={m.value}
                  formattedValue={m.formattedValue}
                />
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
