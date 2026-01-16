import React, { useMemo, useRef, useEffect } from 'react';
import { metrics, MetricDefinition, WeekData, formatDate, generateWeeks2026 } from '@/data/metricsData';
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
  Unlock,
  Save,
  TrendingUp
} from 'lucide-react';
import { MetricSparkline } from './MetricSparkline';

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

// Cores por etapa com fundo colorido e texto preto
const etapaBadgeColors: Record<string, string> = {
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

// Cores por responsável com fundo colorido e texto preto
const responsavelBadgeColors: Record<string, string> = {
  'Marketing': 'bg-blue-200 text-gray-900',
  'Comercial': 'bg-amber-200 text-gray-900',
  'Financeiro': 'bg-emerald-200 text-gray-900',
  'Gestão': 'bg-indigo-200 text-gray-900'
};

// Cores de status para badges
const statusBadgeColors = {
  bad: 'bg-red-200 text-gray-900',
  medium: 'bg-yellow-200 text-gray-900',
  good: 'bg-blue-200 text-gray-900',
  great: 'bg-green-200 text-gray-900'
};

const statusInputBg = {
  bad: 'bg-red-100 border-red-300',
  medium: 'bg-yellow-100 border-yellow-300',
  good: 'bg-blue-100 border-blue-300',
  great: 'bg-green-100 border-green-300'
};

export function HorizontalMetricsTable({
  weeks,
  currentWeekNumber,
  onValueChange,
  getWeekValues,
  getCalculatedMetrics,
  isAdmin
}: HorizontalMetricsTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  
  // Ordenar métricas conforme a ordem especificada
  const orderedMetrics = useMemo(() => {
    return metricOrder
      .map(sigla => metrics.find(m => m.sigla === sigla))
      .filter((m): m is MetricDefinition => m !== undefined);
  }, []);

  // Todas as semanas do ano
  const allWeeks = useMemo(() => generateWeeks2026(), []);

  // Scroll to current week on mount
  useEffect(() => {
    if (tableRef.current) {
      const currentWeekCol = tableRef.current.querySelector(`[data-week="${currentWeekNumber}"]`);
      if (currentWeekCol) {
        currentWeekCol.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentWeekNumber]);

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
    return weekNumber <= currentWeekNumber;
  };

  // Group metrics by etapa for visual funnel
  const etapas = ['Planejamento', 'Tráfego', 'Landing Page', 'Conversão', 'Leads', 'Atendimento', 'Agendamento', 'Consulta', 'Vendas', 'Financeiro', 'Gestão'];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      {/* Header matching "Resumo Semana" style */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg">Indicadores Completos</h3>
            <p className="text-sm text-muted-foreground">
              Todos os indicadores do funil com histórico semanal completo de 2026
            </p>
          </div>
        </div>
        
        {/* Funnel Visual */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-2">
          {etapas.map((etapa, idx) => (
            <div 
              key={etapa}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap",
                etapaBadgeColors[etapa]
              )}
              style={{
                transform: `scale(${1 - idx * 0.02})`,
              }}
            >
              <span>{etapa}</span>
              {idx < etapas.length - 1 && (
                <span className="ml-1 text-gray-400">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div ref={tableRef} className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-muted/50 sticky top-0 z-20">
            <tr className="border-b border-border">
              {/* Fixed columns */}
              <th className="text-left px-3 py-3 font-semibold text-foreground whitespace-nowrap sticky left-0 bg-muted/50 z-30 min-w-[110px] border-r border-border">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  <span>Etapa Funil</span>
                </div>
              </th>
              <th className="text-left px-3 py-3 font-semibold text-foreground whitespace-nowrap sticky left-[110px] bg-muted/50 z-30 min-w-[90px] border-r border-border">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span>Resp.</span>
                </div>
              </th>
              <th className="text-left px-3 py-3 font-semibold text-foreground whitespace-nowrap sticky left-[200px] bg-muted/50 z-30 min-w-[70px] border-r border-border">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  <span>Sigla</span>
                </div>
              </th>
              <th className="text-left px-3 py-3 font-semibold text-foreground whitespace-nowrap min-w-[180px]">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-primary" />
                  <span>Indicador</span>
                </div>
              </th>
              <th className="text-left px-3 py-3 font-semibold text-foreground whitespace-nowrap min-w-[160px]">
                <div className="flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-primary" />
                  <span>O que mede</span>
                </div>
              </th>
              <th className="text-center px-3 py-3 font-semibold text-foreground whitespace-nowrap min-w-[80px]">
                <div className="flex items-center justify-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-primary" />
                  <span>Tipo</span>
                </div>
              </th>
              <th className="text-left px-3 py-3 font-semibold text-foreground whitespace-nowrap min-w-[130px]">
                <div className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-primary" />
                  <span>Fórmula</span>
                </div>
              </th>
              <th className="text-center px-3 py-3 font-semibold text-foreground whitespace-nowrap min-w-[50px]">
                <div className="flex items-center justify-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-primary" />
                  <span>Un.</span>
                </div>
              </th>
              <th className="text-center px-2 py-3 font-semibold whitespace-nowrap min-w-[70px]">
                <div className="flex items-center justify-center gap-1">
                  <span className="px-2 py-0.5 rounded bg-red-200 text-gray-900 text-[10px]">Ruim</span>
                </div>
              </th>
              <th className="text-center px-2 py-3 font-semibold whitespace-nowrap min-w-[70px]">
                <div className="flex items-center justify-center gap-1">
                  <span className="px-2 py-0.5 rounded bg-yellow-200 text-gray-900 text-[10px]">Médio</span>
                </div>
              </th>
              <th className="text-center px-2 py-3 font-semibold whitespace-nowrap min-w-[70px]">
                <div className="flex items-center justify-center gap-1">
                  <span className="px-2 py-0.5 rounded bg-blue-200 text-gray-900 text-[10px]">Bom</span>
                </div>
              </th>
              <th className="text-center px-2 py-3 font-semibold whitespace-nowrap min-w-[70px]">
                <div className="flex items-center justify-center gap-1">
                  <span className="px-2 py-0.5 rounded bg-green-200 text-gray-900 text-[10px]">Ótimo</span>
                </div>
              </th>
              
              {/* Trend/Evolution Column */}
              <th className="text-center px-3 py-3 font-semibold whitespace-nowrap min-w-[110px] border-r border-border">
                <div className="flex items-center justify-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  <span>Tendência</span>
                </div>
              </th>
              
              {/* All weeks of the year */}
              {allWeeks.map((week) => (
                <th 
                  key={week.weekNumber}
                  data-week={week.weekNumber}
                  className={cn(
                    "text-center px-2 py-2 font-semibold whitespace-nowrap min-w-[75px] border-l border-border transition-colors",
                    week.weekNumber === currentWeekNumber && "bg-primary/20 ring-2 ring-primary ring-inset"
                  )}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={cn(
                      "text-xs font-bold",
                      week.weekNumber === currentWeekNumber ? "text-primary" : "text-foreground"
                    )}>
                      S{week.weekNumber}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {formatDate(week.startDate).split('/').slice(0, 2).join('/')}
                    </span>
                    {week.weekNumber === currentWeekNumber && (
                      <span className="text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">
                        ATUAL
                      </span>
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
                    'border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors',
                    idx % 2 === 0 && 'bg-muted/10'
                  )}
                >
                  {/* Etapa do Funil - texto preto com badge colorido */}
                  <td className="px-3 py-2.5 sticky left-0 bg-card z-10 border-r border-border align-middle">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-semibold whitespace-nowrap inline-block",
                      etapaBadgeColors[metric.etapa] || 'bg-muted text-gray-900'
                    )}>
                      {metric.etapa}
                    </span>
                  </td>
                  
                  {/* Responsável - texto preto com badge colorido */}
                  <td className="px-3 py-2.5 sticky left-[110px] bg-card z-10 border-r border-border align-middle">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-semibold whitespace-nowrap inline-block",
                      responsavelBadgeColors[metric.responsavel] || 'bg-muted text-gray-900'
                    )}>
                      {metric.responsavel}
                    </span>
                  </td>
                  
                  {/* Sigla */}
                  <td className="px-3 py-2.5 sticky left-[200px] bg-card z-10 border-r border-border align-middle">
                    <span className="font-mono font-bold text-primary text-xs">
                      {metric.sigla}
                    </span>
                  </td>
                  
                  {/* Indicador, descrição */}
                  <td className="px-3 py-2.5 align-middle">
                    <div className="max-w-[180px]">
                      <p className="font-semibold text-foreground text-xs leading-tight">{metric.nome}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">{metric.descricao}</p>
                    </div>
                  </td>
                  
                  {/* O que mede */}
                  <td className="px-3 py-2.5 align-middle">
                    <p className="text-[10px] text-muted-foreground max-w-[160px] line-clamp-2 leading-tight">
                      {metric.oQueMede}
                    </p>
                  </td>
                  
                  {/* Tipo de preenchimento */}
                  <td className="px-3 py-2.5 text-center align-middle">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold",
                      isManual 
                        ? "bg-amber-200 text-gray-900" 
                        : "bg-slate-200 text-gray-900"
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
                  <td className="px-3 py-2.5 align-middle">
                    <span className="text-[10px] font-mono text-muted-foreground leading-tight">
                      {metric.formula}
                    </span>
                  </td>
                  
                  {/* Unidade */}
                  <td className="px-3 py-2.5 text-center align-middle">
                    <span className="text-[10px] bg-muted px-2 py-1 rounded font-medium">
                      {metric.unidade}
                    </span>
                  </td>
                  
                  {/* Faixas com badges coloridos */}
                  <td className="px-2 py-2.5 text-center align-middle">
                    <span className="px-1.5 py-0.5 rounded bg-red-200 text-gray-900 text-[9px] font-medium">
                      {metric.ruim}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center align-middle">
                    <span className="px-1.5 py-0.5 rounded bg-yellow-200 text-gray-900 text-[9px] font-medium">
                      {metric.medio}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center align-middle">
                    <span className="px-1.5 py-0.5 rounded bg-blue-200 text-gray-900 text-[9px] font-medium">
                      {metric.bom}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center align-middle">
                    <span className="px-1.5 py-0.5 rounded bg-green-200 text-gray-900 text-[9px] font-medium">
                      {metric.otimo}
                    </span>
                  </td>
                  
                  {/* Sparkline/Trend Column */}
                  <td className="px-2 py-2.5 text-center align-middle border-r border-border">
                    {(() => {
                      // Collect all values for this metric across weeks up to current week
                      const weekNumbers: number[] = [];
                      const values: (number | null)[] = [];
                      const currentWeekIdx = allWeeks.findIndex(w => w.weekNumber === currentWeekNumber);
                      
                      allWeeks.slice(0, currentWeekIdx + 1).forEach((week) => {
                        const val = getValue(week.weekNumber, metric);
                        weekNumbers.push(week.weekNumber);
                        values.push(typeof val === 'number' ? val : null);
                      });
                      
                      // Get current status for color
                      const currentValue = getValue(currentWeekNumber, metric);
                      const currentStatus = getMetricStatus(metric.sigla, currentValue);
                      
                      // Determine if higher is better based on metric
                      const lowerIsBetter = ['Freq', 'CPM', 'CPC', 'PageSpeed', 'Bounce', 'AbForm', 
                                            'NoShow', 'Obj', 'CostSale', 'CAC', 'FunnelDrop', 
                                            'LeadLoss', 'Payback'].includes(metric.sigla);
                      
                      return (
                        <MetricSparkline 
                          data={values}
                          weeks={weekNumbers}
                          currentWeekIndex={currentWeekIdx}
                          status={currentStatus}
                          higherIsBetter={!lowerIsBetter}
                        />
                      );
                    })()}
                  </td>
                  {allWeeks.map((week) => {
                    const value = getValue(week.weekNumber, metric);
                    const status = getMetricStatus(metric.sigla, value);
                    const editable = isWeekEditable(week.weekNumber) && isManual;
                    const isFutureWeek = week.weekNumber > currentWeekNumber;
                    
                    return (
                      <td 
                        key={`${metric.sigla}-${week.weekNumber}`}
                        className={cn(
                          "px-1 py-1.5 text-center border-l border-border align-middle",
                          week.weekNumber === currentWeekNumber && "bg-primary/10",
                          isFutureWeek && "bg-muted/30"
                        )}
                      >
                        {isFutureWeek ? (
                          <div className="text-[9px] text-muted-foreground/50">-</div>
                        ) : isManual && editable ? (
                          <input
                            type="number"
                            step={metric.formato === 'percent' || metric.formato === 'decimal' ? '0.01' : '1'}
                            value={value ?? ''}
                            onChange={(e) => handleInputChange(week.weekNumber, metric.sigla, e.target.value)}
                            className={cn(
                              "w-full px-1 py-1 text-[10px] text-center rounded border bg-background text-foreground",
                              "focus:outline-none focus:ring-1 focus:ring-primary",
                              status && statusInputBg[status]
                            )}
                            placeholder="-"
                          />
                        ) : (
                          <div className={cn(
                            "px-1 py-1 rounded text-[10px] font-medium",
                            value !== null && status && statusBadgeColors[status],
                            !isManual && value === null && "text-muted-foreground"
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