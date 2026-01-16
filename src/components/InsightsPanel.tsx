import React from 'react';
import { metrics } from '@/data/metricsData';
import { CalculatedMetrics, getMetricStatus, formatMetricValue } from '@/utils/metricCalculations';
import { InsightCard } from './InsightCard';
import { AlertTriangle, Lightbulb, TrendingUp, CheckCircle } from 'lucide-react';

interface InsightsPanelProps {
  calculatedValues: CalculatedMetrics;
  manualValues: Record<string, number | string | null>;
}

// Badge colors for stages
const stageBadgeColors: Record<string, string> = {
  'Planejamento': 'bg-violet-200 text-gray-900',
  'Tráfego': 'bg-blue-200 text-gray-900',
  'Landing Page': 'bg-cyan-200 text-gray-900',
  'Conversão': 'bg-teal-200 text-gray-900',
  'Leads': 'bg-green-200 text-gray-900',
  'Atendimento': 'bg-yellow-200 text-gray-900',
  'Agendamento': 'bg-orange-200 text-gray-900',
  'Consulta': 'bg-rose-200 text-gray-900',
  'Vendas': 'bg-pink-200 text-gray-900',
  'Financeiro': 'bg-purple-200 text-gray-900',
  'Gestão': 'bg-slate-200 text-gray-900'
};

const stageOrder = [
  'Planejamento', 'Tráfego', 'Landing Page', 'Conversão', 'Leads',
  'Atendimento', 'Agendamento', 'Consulta', 'Vendas', 'Financeiro', 'Gestão'
];

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
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">Insights & Mentor</h3>
              <p className="text-sm text-muted-foreground">
                Diagnóstico automático e recomendações para otimizar seu funil
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-emerald-700 mb-2">
            Parabéns! Todos os indicadores estão saudáveis 🎉
          </h3>
          <p className="text-emerald-600">
            Continue monitorando semanalmente para manter o funil otimizado.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header Card matching other tabs */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">Insights & Mentor</h3>
              <p className="text-sm text-muted-foreground">
                Diagnóstico automático e recomendações para otimizar seu funil
              </p>
            </div>
          </div>
          
          {/* Funnel Visual */}
          <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-2">
            {stageOrder.map((stage, idx) => (
              <div
                key={stage}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${stageBadgeColors[stage]}`}
              >
                <span>{stage}</span>
                {idx < stageOrder.length - 1 && (
                  <span className="ml-1 text-gray-400">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Summary */}
        <div className="p-6">
          <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-1">
                Resumo do Diagnóstico
              </h4>
              <p className="text-muted-foreground text-sm">
                Identificamos <span className="px-2 py-0.5 rounded bg-red-200 text-gray-900 font-semibold">{badCount} problemas críticos</span>
                {mediumCount > 0 && (
                  <> e <span className="px-2 py-0.5 rounded bg-yellow-200 text-gray-900 font-semibold">{mediumCount} pontos de atenção</span></>
                )}
                . Veja abaixo o que está acontecendo e como corrigir.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Critical Issues First */}
      {badCount > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="bg-red-50 px-6 py-4 border-b border-red-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h4 className="font-bold text-red-700">
              Problemas Críticos
            </h4>
            <span className="px-2 py-0.5 rounded bg-red-200 text-gray-900 text-xs font-bold ml-2">
              {badCount}
            </span>
          </div>
          <div className="p-4 space-y-4">
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
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <h4 className="font-bold text-amber-700">
              Pontos de Atenção
            </h4>
            <span className="px-2 py-0.5 rounded bg-yellow-200 text-gray-900 text-xs font-bold ml-2">
              {mediumCount}
            </span>
          </div>
          <div className="p-4 space-y-4">
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
