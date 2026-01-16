import React, { useMemo } from 'react';
import { metrics, MetricDefinition, WeekData, formatDate } from '@/data/metricsData';
import { getMetricStatus, formatMetricValue } from '@/utils/metricCalculations';
import { cn } from '@/lib/utils';
import { 
  Target, 
  Users, 
  Tag, 
  BarChart3, 
  Search, 
  Edit3, 
  Calculator, 
  Ruler, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  Star,
  Lock,
  Unlock
} from 'lucide-react';

interface HorizontalMetricsTableProps {
  weeks: WeekData[];
  currentWeekNumber: number;
  onValueChange: (weekNumber: number, key: string, value: number | string | null) => void;
  getWeekValues: (weekNumber: number) => Record<string, number | string | null>;
  getCalculatedMetrics: (weekNumber: number) => Record<string, number | string | null>;
  isAdmin: boolean;
}

// Ordem correta das métricas conforme especificado
const metricOrder = [
  'ICPFit', 'Mix', 'Impr', 'Reach', 'Freq', 'CPM', 'CTR', 'CPC', 'Eng', 'VTR', 'Hook',
  'PageSpeed', 'Bounce', 'LPCR', 'FormCR', 'AbForm', 'WhatsCR', 'LeadDay', 'CPL', 
  'QualLead', 'MQL', 'SQL', 'SLA', 'TTF', 'RespRate', 'Follow', 'ConvFU', 'ConvCall',
  'Show', 'NoShow', 'QualCall', 'ObjWin', 'Close', 'SaleLead', 'CostSale', 'AOV', 
  'CAC', 'ROAS', 'ROI', 'Margin', 'Break', 'FunnelDrop', 'LeadLoss', 'Scale', 'Health',
  'LTV', 'Payback'
];

// Mapeamento de cores por etapa
const etapaColors: Record<string, string> = {
  'Planejamento': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Tráfego': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Landing Page': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'Conversão': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'Leads': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Atendimento': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Agendamento': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Consulta': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Vendas': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Financeiro': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Gestão': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
};

// Mapeamento de cores por responsável
const responsavelColors: Record<string, string> = {
  'Marketing': 'bg-blue-500/20 text-blue-300',
  'Comercial': 'bg-amber-500/20 text-amber-300',
  'Financeiro': 'bg-emerald-500/20 text-emerald-300',
  'Gestão': 'bg-indigo-500/20 text-indigo-300'
};

const statusColors = {
  bad: 'bg-red-500/20 text-red-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  good: 'bg-blue-500/20 text-blue-400',
  great: 'bg-green-500/20 text-green-400'
};

export function HorizontalMetricsTable({
  weeks,
  currentWeekNumber,
  onValueChange,
  getWeekValues,
  getCalculatedMetrics,
  isAdmin
}: HorizontalMetricsTableProps) {
  // Ordenar métricas conforme a ordem especificada
  const orderedMetrics = useMemo(() => {
    return metricOrder
      .map(sigla => metrics.find(m => m.sigla === sigla))
      .filter((m): m is MetricDefinition => m !== undefined);
  }, []);

  // Pegar apenas as últimas 12 semanas disponíveis para visualização
  const visibleWeeks = useMemo(() => {
    return weeks.filter(w => w.weekNumber <= currentWeekNumber).slice(-12);
  }, [weeks, currentWeekNumber]);

  const handleInputChange = (weekNumber: number, sigla: string, value: string) => {
    if (value === '') {
      onValueChange(weekNumber, sigla, null);
      return;
    }
    const numVal = parseFloat(value.replace(',', '.'));
    if (!isNaN(numVal)) {
      onValueChange(weekNumber, sigla, numVal);
    }
  };

  const getValue = (weekNumber: number, metric: MetricDefinition): number | string | null => {
    if (metric.tipo === 'auto') {
      const calculated = getCalculatedMetrics(weekNumber);
      return calculated[metric.sigla] ?? null;
    }
    const weekValues = getWeekValues(weekNumber);
    return weekValues[metric.sigla] ?? null;
  };

  const isWeekEditable = (weekNumber: number) => {
    if (isAdmin) return true;
    return weekNumber === currentWeekNumber;
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="bg-muted/50 px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Dados Base para Cálculo - Histórico Semanal
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Dados organizados por etapa do funil. Campos automáticos são calculados, campos manuais são editáveis.
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/30 sticky top-0 z-10">
            <tr className="border-b border-border">
              <th className="text-left px-2 py-2 font-medium text-muted-foreground whitespace-nowrap sticky left-0 bg-muted/30 z-20 min-w-[100px]">
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Etapa do Funil
                </div>
              </th>
              <th className="text-left px-2 py-2 font-medium text-muted-foreground whitespace-nowrap sticky left-[100px] bg-muted/30 z-20 min-w-[80px]">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Responsável
                </div>
              </th>
              <th className="text-left px-2 py-2 font-medium text-muted-foreground whitespace-nowrap sticky left-[180px] bg-muted/30 z-20 min-w-[70px]">
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Sigla
                </div>
              </th>
              <th className="text-left px-2 py-2 font-medium text-muted-foreground whitespace-nowrap min-w-[200px]">
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  Indicador, descrição
                </div>
              </th>
              <th className="text-left px-2 py-2 font-medium text-muted-foreground whitespace-nowrap min-w-[180px]">
                <div className="flex items-center gap-1">
                  <Search className="w-3 h-3" />
                  O que mede
                </div>
              </th>
              <th className="text-center px-2 py-2 font-medium text-muted-foreground whitespace-nowrap min-w-[80px]">
                <div className="flex items-center justify-center gap-1">
                  <Edit3 className="w-3 h-3" />
                  Tipo
                </div>
              </th>
              <th className="text-left px-2 py-2 font-medium text-muted-foreground whitespace-nowrap min-w-[140px]">
                <div className="flex items-center gap-1">
                  <Calculator className="w-3 h-3" />
                  Fórmula
                </div>
              </th>
              <th className="text-center px-2 py-2 font-medium text-muted-foreground whitespace-nowrap min-w-[50px]">
                <div className="flex items-center justify-center gap-1">
                  <Ruler className="w-3 h-3" />
                  Un.
                </div>
              </th>
              <th className="text-center px-2 py-2 font-medium whitespace-nowrap min-w-[60px]">
                <div className="flex items-center justify-center gap-1 text-red-400">
                  <AlertCircle className="w-3 h-3" />
                  Ruim
                </div>
              </th>
              <th className="text-center px-2 py-2 font-medium whitespace-nowrap min-w-[60px]">
                <div className="flex items-center justify-center gap-1 text-yellow-400">
                  <AlertTriangle className="w-3 h-3" />
                  Médio
                </div>
              </th>
              <th className="text-center px-2 py-2 font-medium whitespace-nowrap min-w-[60px]">
                <div className="flex items-center justify-center gap-1 text-blue-400">
                  <CheckCircle className="w-3 h-3" />
                  Bom
                </div>
              </th>
              <th className="text-center px-2 py-2 font-medium whitespace-nowrap min-w-[60px]">
                <div className="flex items-center justify-center gap-1 text-green-400">
                  <Star className="w-3 h-3" />
                  Ótimo
                </div>
              </th>
              {/* Week columns */}
              {visibleWeeks.map((week) => (
                <th 
                  key={week.weekNumber} 
                  className={cn(
                    "text-center px-2 py-2 font-medium whitespace-nowrap min-w-[80px] border-l border-border",
                    week.weekNumber === currentWeekNumber && "bg-primary/10"
                  )}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-foreground text-xs">S{week.weekNumber}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {formatDate(week.startDate).split('/').slice(0, 2).join('/')}
                    </span>
                    {week.weekNumber === currentWeekNumber && (
                      <span className="text-[9px] bg-primary/20 text-primary px-1 rounded">Atual</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderedMetrics.map((metric, idx) => {
              const isManual = metric.tipo === 'manual';
              
              return (
                <tr 
                  key={metric.sigla}
                  className={cn(
                    'border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors',
                    idx % 2 === 0 && 'bg-muted/5'
                  )}
                >
                  {/* Etapa do Funil */}
                  <td className="px-2 py-2 sticky left-0 bg-card z-10">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium border whitespace-nowrap",
                      etapaColors[metric.etapa] || 'bg-muted text-muted-foreground'
                    )}>
                      {metric.etapa}
                    </span>
                  </td>
                  
                  {/* Responsável */}
                  <td className="px-2 py-2 sticky left-[100px] bg-card z-10">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap",
                      responsavelColors[metric.responsavel] || 'bg-muted text-muted-foreground'
                    )}>
                      {metric.responsavel}
                    </span>
                  </td>
                  
                  {/* Sigla */}
                  <td className="px-2 py-2 sticky left-[180px] bg-card z-10">
                    <span className="font-mono font-bold text-primary text-xs">
                      {metric.sigla}
                    </span>
                  </td>
                  
                  {/* Indicador, descrição */}
                  <td className="px-2 py-2">
                    <div className="max-w-[200px]">
                      <p className="font-medium text-foreground text-xs truncate">{metric.nome}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{metric.descricao}</p>
                    </div>
                  </td>
                  
                  {/* O que mede */}
                  <td className="px-2 py-2">
                    <p className="text-[10px] text-muted-foreground max-w-[180px] line-clamp-2">
                      {metric.oQueMede}
                    </p>
                  </td>
                  
                  {/* Tipo de preenchimento */}
                  <td className="px-2 py-2 text-center">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                      isManual 
                        ? "bg-amber-500/20 text-amber-300" 
                        : "bg-slate-500/20 text-slate-400"
                    )}>
                      {isManual ? (
                        <>
                          <Unlock className="w-2.5 h-2.5" />
                          Manual
                        </>
                      ) : (
                        <>
                          <Lock className="w-2.5 h-2.5" />
                          Auto
                        </>
                      )}
                    </span>
                  </td>
                  
                  {/* Fórmula */}
                  <td className="px-2 py-2">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {metric.formula}
                    </span>
                  </td>
                  
                  {/* Unidade */}
                  <td className="px-2 py-2 text-center">
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      {metric.unidade}
                    </span>
                  </td>
                  
                  {/* Ruim */}
                  <td className="px-2 py-2 text-center">
                    <span className="text-[10px] text-red-400">
                      {metric.ruim}
                    </span>
                  </td>
                  
                  {/* Médio */}
                  <td className="px-2 py-2 text-center">
                    <span className="text-[10px] text-yellow-400">
                      {metric.medio}
                    </span>
                  </td>
                  
                  {/* Bom */}
                  <td className="px-2 py-2 text-center">
                    <span className="text-[10px] text-blue-400">
                      {metric.bom}
                    </span>
                  </td>
                  
                  {/* Ótimo */}
                  <td className="px-2 py-2 text-center">
                    <span className="text-[10px] text-green-400">
                      {metric.otimo}
                    </span>
                  </td>
                  
                  {/* Week Values */}
                  {visibleWeeks.map((week) => {
                    const value = getValue(week.weekNumber, metric);
                    const status = getMetricStatus(metric.sigla, value);
                    const editable = isWeekEditable(week.weekNumber) && isManual;
                    
                    return (
                      <td 
                        key={`${metric.sigla}-${week.weekNumber}`}
                        className={cn(
                          "px-1 py-1 text-center border-l border-border",
                          week.weekNumber === currentWeekNumber && "bg-primary/5"
                        )}
                      >
                        {isManual && editable ? (
                          <input
                            type="number"
                            step={metric.formato === 'percent' || metric.formato === 'decimal' ? '0.01' : '1'}
                            value={value ?? ''}
                            onChange={(e) => handleInputChange(week.weekNumber, metric.sigla, e.target.value)}
                            className={cn(
                              "w-full px-1 py-1 text-[10px] text-center rounded border bg-background",
                              "focus:outline-none focus:ring-1 focus:ring-primary",
                              status && statusColors[status]
                            )}
                            placeholder="-"
                          />
                        ) : (
                          <div className={cn(
                            "px-1 py-1 rounded text-[10px]",
                            value !== null && status && statusColors[status],
                            !isManual && "bg-muted/30 text-muted-foreground"
                          )}>
                            {value !== null ? formatMetricValue(value, metric.formato) : '-'}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
