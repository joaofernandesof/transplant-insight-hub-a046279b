import React from 'react';
import { metrics, MetricDefinition } from '@/data/metricsData';
import { MetricInput } from './MetricInput';
import { StatusBadge } from './StatusBadge';
import { getMetricStatus, formatMetricValue } from '@/utils/metricCalculations';
import { cn } from '@/lib/utils';

interface ManualMetricsTableProps {
  values: Record<string, number | string | null>;
  onChange: (key: string, value: number | string | null) => void;
  isEditable: boolean;
}

const manualMetricsSiglas = [
  'ICPFit', 'Mix', 'QualLead', 'SLA', 'TTF', 'Follow', 'QualCall', 'ObjWin', 'Break', 'Scale'
];

export function ManualMetricsTable({ values, onChange, isEditable }: ManualMetricsTableProps) {
  const manualMetrics = metrics.filter(m => manualMetricsSiglas.includes(m.sigla));
  
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="bg-muted/50 px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground">Métricas Manuais</h3>
        <p className="text-xs text-muted-foreground">
          Estas métricas precisam ser preenchidas manualmente com base na sua análise.
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-20">Sigla</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Indicador</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Como encontrar</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-28">Formato</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-32">Valor</th>
              <th className="text-center px-4 py-2 font-medium text-muted-foreground w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {manualMetrics.map((metric, idx) => {
              const value = values[metric.sigla];
              const status = getMetricStatus(metric.sigla, value);
              
              return (
                <tr 
                  key={metric.sigla}
                  className={cn(
                    'border-b border-border last:border-b-0',
                    idx % 2 === 0 && 'bg-muted/10'
                  )}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-primary">
                      {metric.sigla}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{metric.nome}</p>
                    <p className="text-xs text-muted-foreground">{metric.oQueMede}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs">
                    <p className="text-xs line-clamp-2">{metric.comoEncontrar}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      {metric.unidade}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <MetricInput
                      value={value}
                      onChange={(val) => onChange(metric.sigla, val)}
                      formato={metric.formato}
                      disabled={!isEditable}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={status} size="sm" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
