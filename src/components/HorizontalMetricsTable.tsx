import React, { useMemo, useRef, useEffect, useCallback } from 'react';
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
  TrendingUp,
  Download,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { MetricSparkline } from './MetricSparkline';
import { Button } from './ui/button';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  // Export to Excel
  const exportToExcel = useCallback(() => {
    const data: any[] = [];
    
    // Header row
    const headerRow = ['Etapa', 'Responsável', 'Sigla', 'Indicador', 'O que mede', 'Fórmula', 'Ruim', 'Médio', 'Bom', 'Ótimo'];
    allWeeks.forEach(week => {
      headerRow.push(`S${week.weekNumber}`);
    });
    data.push(headerRow);
    
    // Data rows
    orderedMetrics.forEach(metric => {
      const row: any[] = [
        metric.etapa,
        metric.responsavel,
        metric.sigla,
        metric.nome,
        metric.oQueMede,
        metric.formula,
        metric.ruim,
        metric.medio,
        metric.bom,
        metric.otimo
      ];
      
      allWeeks.forEach(week => {
        const value = getValue(week.weekNumber, metric);
        row.push(value !== null ? formatMetricValue(value, metric.unidade) : '');
      });
      
      data.push(row);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Indicadores');
    XLSX.writeFile(wb, `indicadores-2026-semana-${currentWeekNumber}.xlsx`);
  }, [orderedMetrics, allWeeks, currentWeekNumber, getValue]);

  // Export to PDF
  const exportToPDF = useCallback(() => {
    const doc = new jsPDF('landscape', 'mm', 'a3');
    
    doc.setFontSize(16);
    doc.text('Indicadores Completos - 2026', 14, 15);
    doc.setFontSize(10);
    doc.text(`Semana atual: ${currentWeekNumber}`, 14, 22);
    
    // Prepare table data - show only current week and nearby weeks for PDF
    const weeksToShow = allWeeks.filter(w => 
      Math.abs(w.weekNumber - currentWeekNumber) <= 4
    );
    
    const headers = ['Etapa', 'Resp.', 'Sigla', 'Indicador', 'Fórmula', ...weeksToShow.map(w => `S${w.weekNumber}`)];
    
    const tableData = orderedMetrics.map(metric => {
      const row = [
        metric.etapa,
        metric.responsavel,
        metric.sigla,
        metric.nome.substring(0, 20),
        metric.formula.substring(0, 15)
      ];
      
      weeksToShow.forEach(week => {
        const value = getValue(week.weekNumber, metric);
        row.push(value !== null ? formatMetricValue(value, metric.unidade) : '-');
      });
      
      return row;
    });
    
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 28,
      styles: { fontSize: 6, cellPadding: 1 },
      headStyles: { fillColor: [99, 102, 241], fontSize: 6 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 15 },
        2: { cellWidth: 12 },
        3: { cellWidth: 30 },
        4: { cellWidth: 20 }
      }
    });
    
    doc.save(`indicadores-2026-semana-${currentWeekNumber}.pdf`);
  }, [orderedMetrics, allWeeks, currentWeekNumber, getValue]);

  return (
    <div className="bg-card rounded-lg sm:rounded-xl border border-border overflow-hidden shadow-sm">
      {/* Header - Compact on mobile */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-2 sm:px-6 py-2 sm:py-4 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-primary/20 rounded-lg flex-shrink-0">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-foreground text-xs sm:text-lg truncate">Indicadores Completos</h3>
              <p className="text-[10px] sm:text-sm text-muted-foreground hidden sm:block">
                Histórico semanal completo de 2026
              </p>
            </div>
          </div>
          
          {/* Export Buttons - Compact */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToExcel}
              className="gap-1 h-7 sm:h-8 px-1.5 sm:px-3 text-[10px] sm:text-xs"
            >
              <FileSpreadsheet className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToPDF}
              className="gap-1 h-7 sm:h-8 px-1.5 sm:px-3 text-[10px] sm:text-xs"
            >
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>
        
        {/* Funnel Visual - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-1 mt-3 overflow-x-auto pb-2 scrollbar-hide">
          {etapas.map((etapa, idx) => (
            <div 
              key={etapa}
              className={cn(
                "flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap",
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
      
      <div ref={tableRef} className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-[10px] sm:text-xs border-collapse">
          <thead className="bg-muted sticky top-0 z-20">
            <tr className="border-b border-border">
              {/* Fixed columns - Ultra compact on mobile */}
              <th className="text-left px-1 sm:px-3 py-1.5 sm:py-3 font-semibold text-foreground whitespace-nowrap sticky left-0 bg-muted z-30 min-w-[45px] sm:min-w-[110px] border-r border-border">
                <span className="text-[9px] sm:text-xs">Etapa</span>
              </th>
              <th className="text-left px-1 sm:px-3 py-1.5 sm:py-3 font-semibold text-foreground whitespace-nowrap sticky left-[45px] sm:left-[110px] bg-muted z-30 min-w-[35px] sm:min-w-[90px] border-r border-border">
                <span className="text-[9px] sm:text-xs">Resp</span>
              </th>
              <th className="text-left px-1 sm:px-3 py-1.5 sm:py-3 font-semibold text-foreground whitespace-nowrap sticky left-[80px] sm:left-[200px] bg-muted z-30 min-w-[40px] sm:min-w-[70px] border-r border-border">
                <span className="text-[9px] sm:text-xs">Sigla</span>
              </th>
              {/* Hidden on mobile */}
              <th className="hidden sm:table-cell text-left px-3 py-3 font-semibold text-foreground whitespace-nowrap min-w-[180px] bg-muted">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-primary" />
                  <span>Indicador</span>
                </div>
              </th>
              <th className="hidden lg:table-cell text-left px-3 py-3 font-semibold text-foreground whitespace-nowrap min-w-[160px] bg-muted">
                <div className="flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-primary" />
                  <span>O que mede</span>
                </div>
              </th>
              <th className="hidden lg:table-cell text-left px-3 py-3 font-semibold text-foreground whitespace-nowrap min-w-[130px] bg-muted">
                <div className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-primary" />
                  <span>Fórmula</span>
                </div>
              </th>
              {/* Status columns - Hidden on mobile */}
              <th className="hidden sm:table-cell text-center px-1 sm:px-2 py-2 sm:py-3 font-semibold whitespace-nowrap min-w-[50px] sm:min-w-[70px] bg-muted">
                <span className="px-1.5 py-0.5 rounded bg-red-200 text-gray-900 text-[9px] sm:text-[10px]">Ruim</span>
              </th>
              <th className="hidden sm:table-cell text-center px-1 sm:px-2 py-2 sm:py-3 font-semibold whitespace-nowrap min-w-[50px] sm:min-w-[70px] bg-muted">
                <span className="px-1.5 py-0.5 rounded bg-yellow-200 text-gray-900 text-[9px] sm:text-[10px]">Médio</span>
              </th>
              <th className="hidden sm:table-cell text-center px-1 sm:px-2 py-2 sm:py-3 font-semibold whitespace-nowrap min-w-[50px] sm:min-w-[70px] bg-muted">
                <span className="px-1.5 py-0.5 rounded bg-blue-200 text-gray-900 text-[9px] sm:text-[10px]">Bom</span>
              </th>
              <th className="hidden sm:table-cell text-center px-1 sm:px-2 py-2 sm:py-3 font-semibold whitespace-nowrap min-w-[50px] sm:min-w-[70px] bg-muted">
                <span className="px-1.5 py-0.5 rounded bg-green-200 text-gray-900 text-[9px] sm:text-[10px]">Ótimo</span>
              </th>
              
              {/* Trend/Evolution Column - Hidden on mobile */}
              <th className="hidden md:table-cell text-center px-2 sm:px-3 py-2 sm:py-3 font-semibold whitespace-nowrap min-w-[90px] sm:min-w-[110px] border-r border-border bg-muted">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                  <span className="text-[10px] sm:text-xs">Tendência</span>
                </div>
              </th>
              
              {/* All weeks - Compact */}
              {allWeeks.map((week) => (
                <th 
                  key={week.weekNumber}
                  data-week={week.weekNumber}
                  className={cn(
                    "text-center px-0.5 sm:px-2 py-1 sm:py-2 font-semibold whitespace-nowrap min-w-[42px] sm:min-w-[75px] border-l border-border transition-colors bg-muted",
                    week.weekNumber === currentWeekNumber && "bg-primary/20 ring-2 ring-primary ring-inset"
                  )}
                >
                  <div className="flex flex-col items-center gap-0">
                    <span className={cn(
                      "text-[9px] sm:text-xs font-bold",
                      week.weekNumber === currentWeekNumber ? "text-primary" : "text-foreground"
                    )}>
                      S{week.weekNumber}
                    </span>
                    <span className="text-[7px] sm:text-[9px] text-muted-foreground hidden sm:block">
                      {formatDate(week.startDate).split('/').slice(0, 2).join('/')}
                    </span>
                    {week.weekNumber === currentWeekNumber && (
                      <span className="text-[6px] sm:text-[8px] bg-primary text-primary-foreground px-1 py-0.5 rounded-full font-bold">
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
                  {/* Etapa - Ultra compact on mobile */}
                  <td className="px-1 sm:px-3 py-1.5 sm:py-2.5 sticky left-0 bg-card z-10 border-r border-border align-middle">
                    <span className={cn(
                      "px-1 py-0.5 rounded text-[7px] sm:text-[10px] font-semibold whitespace-nowrap inline-block",
                      etapaBadgeColors[metric.etapa] || 'bg-muted text-gray-900'
                    )}>
                      <span className="hidden sm:inline">{metric.etapa}</span>
                      <span className="sm:hidden">{metric.etapa.substring(0, 3)}</span>
                    </span>
                  </td>
                  
                  {/* Responsável */}
                  <td className="px-1 sm:px-3 py-1.5 sm:py-2.5 sticky left-[45px] sm:left-[110px] bg-card z-10 border-r border-border align-middle">
                    <span className={cn(
                      "px-1 py-0.5 rounded text-[7px] sm:text-[10px] font-semibold whitespace-nowrap inline-block",
                      responsavelBadgeColors[metric.responsavel] || 'bg-muted text-gray-900'
                    )}>
                      <span className="hidden sm:inline">{metric.responsavel}</span>
                      <span className="sm:hidden">{metric.responsavel.substring(0, 2)}</span>
                    </span>
                  </td>
                  
                  {/* Sigla */}
                  <td className="px-1 sm:px-3 py-1.5 sm:py-2.5 sticky left-[80px] sm:left-[200px] bg-card z-10 border-r border-border align-middle">
                    <span className="font-mono font-bold text-primary text-[8px] sm:text-xs">
                      {metric.sigla}
                    </span>
                  </td>
                  
                  {/* Indicador, descrição - Hidden on mobile */}
                  <td className="hidden sm:table-cell px-3 py-2.5 align-middle">
                    <div className="max-w-[180px]">
                      <p className="font-semibold text-foreground text-xs leading-tight">{metric.nome}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">{metric.descricao}</p>
                    </div>
                  </td>
                  
                  {/* O que mede - Hidden on mobile/tablet */}
                  <td className="hidden lg:table-cell px-3 py-2.5 align-middle">
                    <p className="text-[10px] text-muted-foreground max-w-[160px] line-clamp-2 leading-tight">
                      {metric.oQueMede}
                    </p>
                  </td>
                  
                  {/* Fórmula - Hidden on mobile/tablet */}
                  <td className="hidden lg:table-cell px-3 py-2.5 align-middle">
                    <span className="text-[10px] font-mono text-muted-foreground leading-tight">
                      {metric.formula}
                    </span>
                  </td>
                  
                  {/* Faixas - Hidden on mobile */}
                  <td className="hidden sm:table-cell px-1 sm:px-2 py-1.5 sm:py-2.5 text-center align-middle">
                    <span className="px-1 py-0.5 rounded bg-red-200 text-gray-900 text-[8px] sm:text-[9px] font-medium">
                      {metric.ruim}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-1 sm:px-2 py-1.5 sm:py-2.5 text-center align-middle">
                    <span className="px-1 py-0.5 rounded bg-yellow-200 text-gray-900 text-[8px] sm:text-[9px] font-medium">
                      {metric.medio}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-1 sm:px-2 py-1.5 sm:py-2.5 text-center align-middle">
                    <span className="px-1 py-0.5 rounded bg-blue-200 text-gray-900 text-[8px] sm:text-[9px] font-medium">
                      {metric.bom}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-1 sm:px-2 py-1.5 sm:py-2.5 text-center align-middle">
                    <span className="px-1 py-0.5 rounded bg-green-200 text-gray-900 text-[8px] sm:text-[9px] font-medium">
                      {metric.otimo}
                    </span>
                  </td>
                  
                  {/* Sparkline - Hidden on mobile */}
                  <td className="hidden md:table-cell px-1.5 sm:px-2 py-1.5 sm:py-2.5 text-center align-middle border-r border-border">
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
                          "px-0.5 py-1 text-center border-l border-border align-middle",
                          week.weekNumber === currentWeekNumber && "bg-primary/10",
                          isFutureWeek && "bg-muted/30"
                        )}
                      >
                        {isFutureWeek ? (
                          <div className="text-[7px] sm:text-[9px] text-muted-foreground/50">-</div>
                        ) : isManual && editable ? (
                          <input
                            type="number"
                            inputMode="decimal"
                            step={metric.formato === 'percent' || metric.formato === 'decimal' ? '0.01' : '1'}
                            value={value ?? ''}
                            onChange={(e) => handleInputChange(week.weekNumber, metric.sigla, e.target.value)}
                            className={cn(
                              "w-full px-0.5 py-0.5 text-[8px] sm:text-[10px] text-center rounded border bg-background text-foreground",
                              "focus:outline-none focus:ring-1 focus:ring-primary",
                              status && statusInputBg[status]
                            )}
                            placeholder="-"
                          />
                        ) : (
                          <div className={cn(
                            "px-0.5 py-0.5 rounded text-[8px] sm:text-[10px] font-medium",
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