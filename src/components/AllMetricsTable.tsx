import React, { useState } from 'react';
import { metrics, MetricDefinition } from '@/data/metricsData';
import { MetricRow } from './MetricRow';
import { CalculatedMetrics, getMetricStatus } from '@/utils/metricCalculations';
import { cn } from '@/lib/utils';
import { Filter, Search, AlertTriangle, CheckCircle } from 'lucide-react';

interface AllMetricsTableProps {
  calculatedValues: CalculatedMetrics;
  manualValues: Record<string, number | string | null>;
  onManualChange?: (key: string, value: number | string | null) => void;
  isEditable?: boolean;
}

type FilterType = 'all' | 'bad' | 'medium' | 'good' | 'great';

const stageOrder = [
  'Planejamento', 'Tráfego', 'Landing Page', 'Conversão', 'Leads',
  'Atendimento', 'Agendamento', 'Consulta', 'Vendas', 'Financeiro', 'Gestão'
];

export function AllMetricsTable({ 
  calculatedValues, 
  manualValues, 
  onManualChange,
  isEditable = false 
}: AllMetricsTableProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  
  // Combine all values
  const allValues = { ...calculatedValues, ...manualValues };
  
  // Get status for each metric
  const metricsWithStatus = metrics.map(m => ({
    metric: m,
    value: allValues[m.sigla],
    status: getMetricStatus(m.sigla, allValues[m.sigla])
  }));
  
  // Apply filters
  let filteredMetrics = metricsWithStatus;
  
  if (filter !== 'all') {
    filteredMetrics = filteredMetrics.filter(m => m.status === filter);
  }
  
  if (selectedStage) {
    filteredMetrics = filteredMetrics.filter(m => m.metric.etapa === selectedStage);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredMetrics = filteredMetrics.filter(m => 
      m.metric.sigla.toLowerCase().includes(searchLower) ||
      m.metric.nome.toLowerCase().includes(searchLower) ||
      m.metric.descricao.toLowerCase().includes(searchLower)
    );
  }
  
  // Group by stage
  const groupedByStage = stageOrder.reduce((acc, stage) => {
    const stageMetrics = filteredMetrics.filter(m => m.metric.etapa === stage);
    if (stageMetrics.length > 0) {
      acc[stage] = stageMetrics;
    }
    return acc;
  }, {} as Record<string, typeof filteredMetrics>);
  
  // Count by status
  const statusCounts = {
    all: metricsWithStatus.length,
    bad: metricsWithStatus.filter(m => m.status === 'bad').length,
    medium: metricsWithStatus.filter(m => m.status === 'medium').length,
    good: metricsWithStatus.filter(m => m.status === 'good').length,
    great: metricsWithStatus.filter(m => m.status === 'great').length
  };
  
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === 'all' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              Todos ({statusCounts.all})
            </button>
            <button
              onClick={() => setFilter('bad')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === 'bad' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              )}
            >
              🔴 Ruim ({statusCounts.bad})
            </button>
            <button
              onClick={() => setFilter('medium')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === 'medium' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              )}
            >
              🟡 Médio ({statusCounts.medium})
            </button>
            <button
              onClick={() => setFilter('good')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === 'good' 
                  ? 'bg-sky-500 text-white' 
                  : 'bg-sky-100 text-sky-700 hover:bg-sky-200'
              )}
            >
              🔵 Bom ({statusCounts.good})
            </button>
            <button
              onClick={() => setFilter('great')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === 'great' 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              )}
            >
              🟢 Ótimo ({statusCounts.great})
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar métrica..."
            className="input-metric pl-9 w-full"
          />
        </div>
        
        {/* Stage Filter */}
        <select
          value={selectedStage || ''}
          onChange={(e) => setSelectedStage(e.target.value || null)}
          className="input-metric w-40"
        >
          <option value="">Todas as etapas</option>
          {stageOrder.map(stage => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
      </div>
      
      {/* Quick Summary */}
      {statusCounts.bad > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-700">
            <strong>{statusCounts.bad} indicadores</strong> precisam de atenção imediata
          </span>
        </div>
      )}
      
      {statusCounts.bad === 0 && statusCounts.medium === 0 && statusCounts.great > 5 && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span className="text-sm text-emerald-700">
            Excelente! A maioria dos indicadores está em ótimo estado.
          </span>
        </div>
      )}
      
      {/* Metrics Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground">
            <div className="col-span-1">Sigla</div>
            <div className="col-span-3">Indicador</div>
            <div className="col-span-1">Etapa</div>
            <div className="col-span-1">Tipo</div>
            <div className="col-span-2">Valor</div>
            <div className="col-span-2">Faixas</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1"></div>
          </div>
          
          {/* Grouped Content */}
          {Object.entries(groupedByStage).map(([stage, stageMetrics]) => (
            <div key={stage}>
              <div className="bg-muted/30 px-4 py-2 border-b border-border">
                <span className="font-semibold text-foreground text-sm">{stage}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  ({stageMetrics.length} indicadores)
                </span>
              </div>
              {stageMetrics.map(({ metric, value, status }) => (
                <MetricRow
                  key={metric.sigla}
                  metric={metric}
                  value={value}
                  status={status}
                  onChange={onManualChange ? (val) => onManualChange(metric.sigla, val) : undefined}
                  isEditable={isEditable && metric.tipo === 'manual'}
                />
              ))}
            </div>
          ))}
          
          {filteredMetrics.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma métrica encontrada com os filtros aplicados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
