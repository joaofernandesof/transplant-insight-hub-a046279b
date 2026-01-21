import React, { useState, useMemo } from 'react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Clock, 
  MessageSquare, 
  CheckCircle2,
  AlertCircle,
  Calendar,
  ShoppingCart,
  XCircle,
  Activity,
  Bot,
  Filter,
  CalendarRange,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { useDailyMetrics, DailyMetric } from '@/hooks/useDailyMetrics';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DailyMetricsReport } from './DailyMetricsReport';

interface DailyMetricsTableProps {
  clinicId: string;
  clinicName?: string;
  isAdmin: boolean;
  onValueChange?: (date: string, key: string, value: number | null) => void;
}

type FilterType = 'week' | 'month' | 'year' | 'custom' | 'all';

const keyMetrics = [
  { id: 'investimento_trafego', nome: 'Invest. Tráfego (R$)', icon: Activity, color: 'text-violet-600', bgColor: 'bg-violet-50 dark:bg-violet-950/30', isCurrency: true },
  { id: 'leads_novos', nome: 'Leads Novos', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/30' },
  { id: 'tempo_uso_atendente', nome: 'Tempo de Uso (Atendente)', icon: Clock, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/30' },
  { id: 'atividades_atendente', nome: 'Atividades (Atendente)', icon: Activity, color: 'text-cyan-600', bgColor: 'bg-cyan-50 dark:bg-cyan-950/30' },
  { id: 'atividades_robo', nome: 'Atividades (Robô)', icon: Bot, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950/30' },
  { id: 'mensagens_enviadas_atendente', nome: 'Msgs Enviadas (Atendente)', icon: MessageSquare, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950/30' },
  { id: 'mensagens_enviadas_robo', nome: 'Msgs Enviadas (Robô)', icon: Bot, color: 'text-teal-600', bgColor: 'bg-teal-50 dark:bg-teal-950/30' },
  { id: 'mensagens_recebidas', nome: 'Mensagens Recebidas', icon: MessageSquare, color: 'text-indigo-600', bgColor: 'bg-indigo-50 dark:bg-indigo-950/30' },
  { id: 'tarefas_realizadas', nome: 'Tarefas Realizadas', icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { id: 'tarefas_atrasadas', nome: 'Tarefas Atrasadas', icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950/30' },
  { id: 'agendamentos', nome: 'Agendamentos', icon: Calendar, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/30' },
  { id: 'vendas_realizadas', nome: 'Vendas Realizadas', icon: ShoppingCart, color: 'text-pink-600', bgColor: 'bg-pink-50 dark:bg-pink-950/30' },
  { id: 'leads_descartados', nome: 'Leads Descartados', icon: XCircle, color: 'text-slate-600', bgColor: 'bg-slate-50 dark:bg-slate-950/30' },
];

export function DailyMetricsTable({ clinicId, clinicName, isAdmin, onValueChange }: DailyMetricsTableProps) {
  const today = new Date();
  const minDate = new Date('2025-09-30');
  
  const [filterType, setFilterType] = useState<FilterType>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(subDays(today, 30));
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(today);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedWeek, setSelectedWeek] = useState<Date>(today);

  // Calculate date range based on filter type
  const dateFilter = useMemo(() => {
    switch (filterType) {
      case 'week':
        return {
          startDate: format(startOfWeek(selectedWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          endDate: format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        };
      case 'month':
        const monthDate = new Date(selectedYear, selectedMonth, 1);
        return {
          startDate: format(startOfMonth(monthDate), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(monthDate), 'yyyy-MM-dd'),
        };
      case 'year':
        return {
          startDate: format(startOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd'),
          endDate: format(endOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd'),
        };
      case 'custom':
        return {
          startDate: customStartDate ? format(customStartDate, 'yyyy-MM-dd') : format(minDate, 'yyyy-MM-dd'),
          endDate: customEndDate ? format(customEndDate, 'yyyy-MM-dd') : format(today, 'yyyy-MM-dd'),
        };
      case 'all':
      default:
        return {
          startDate: format(minDate, 'yyyy-MM-dd'),
          endDate: format(today, 'yyyy-MM-dd'),
        };
    }
  }, [filterType, selectedWeek, selectedYear, selectedMonth, customStartDate, customEndDate]);

  const { dailyMetrics, isLoading, saveDailyMetric, isSaving } = useDailyMetrics(clinicId, dateFilter);

  // Generate all dates in the range (in chronological order: oldest to newest, weekdays only)
  const datesInRange = useMemo(() => {
    const dates: string[] = [];
    const start = parseISO(dateFilter.startDate);
    const end = parseISO(dateFilter.endDate);
    
    // Use the later of start date or minDate
    let current = start < minDate ? minDate : start;
    
    while (current <= end) {
      // getDay() returns 0 for Sunday, 6 for Saturday
      const dayOfWeek = getDay(current);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Only include weekdays (Monday-Friday)
      if (!isWeekend) {
        dates.push(format(current, 'yyyy-MM-dd'));
      }
      
      // Add one day
      current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
    }
    
    return dates;
  }, [dateFilter]);

  // Create a map of metrics by date
  const metricsByDate = useMemo(() => {
    const map: Record<string, DailyMetric> = {};
    dailyMetrics.forEach(m => {
      map[m.metric_date] = m;
    });
    return map;
  }, [dailyMetrics]);

  const handleInputChange = async (date: string, metricId: string, value: string) => {
    const numVal = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(numVal)) return;

    await saveDailyMetric(date, { [metricId]: numVal });
    onValueChange?.(date, metricId, numVal);
  };

  const formatDateHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    return {
      day: format(date, 'dd', { locale: ptBR }),
      month: format(date, 'MMM', { locale: ptBR }),
      weekday: format(date, 'EEE', { locale: ptBR }),
    };
  };

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const years = [2025, 2026, 2027];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm mb-4">
      {/* Header with Filters */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base sm:text-lg">Histórico de Métricas Diárias</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                  Dados desde 30/09/2025 • {datesInRange.length} dias úteis no período
                </p>
              </div>
            </div>
            
            {isSaving && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Salvando...</span>
              </div>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-background/50 rounded-lg p-1">
              <Filter className="w-4 h-4 text-muted-foreground ml-2" />
              
              <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                <SelectTrigger className="w-[120px] h-8 text-xs border-0 bg-transparent">
                  <SelectValue placeholder="Filtrar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                  <SelectItem value="all">Todo Histórico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterType === 'week' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                    <CalendarRange className="w-3.5 h-3.5" />
                    Semana de {format(startOfWeek(selectedWeek, { weekStartsOn: 1 }), 'dd/MM', { locale: ptBR })}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    mode="single"
                    selected={selectedWeek}
                    onSelect={(date) => date && setSelectedWeek(date)}
                    disabled={(date) => date > today || date < minDate}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            )}

            {filterType === 'month' && (
              <div className="flex items-center gap-2">
                <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, idx) => (
                      <SelectItem key={idx} value={String(idx)}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="w-[90px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {filterType === 'year' && (
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-[90px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {filterType === 'custom' && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                      {customStartDate ? format(customStartDate, 'dd/MM/yyyy') : 'De'}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      disabled={(date) => date > today || date < minDate}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-xs text-muted-foreground">até</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                      {customEndDate ? format(customEndDate, 'dd/MM/yyyy') : 'Até'}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      disabled={(date) => date > today || (customStartDate && date < customStartDate)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted sticky top-0 z-20">
              <tr className="border-b border-border">
                <th className="text-left px-2 sm:px-3 py-2 sm:py-2.5 font-semibold text-foreground whitespace-nowrap sticky left-0 bg-muted z-30 min-w-[140px] sm:min-w-[180px] border-r border-border">
                  <span className="text-xs sm:text-sm">Indicador</span>
                </th>
                
                {datesInRange.map((date) => {
                  const { day, month, weekday } = formatDateHeader(date);
                  const isToday = date === format(today, 'yyyy-MM-dd');
                  
                  return (
                    <th 
                      key={date}
                      className={cn(
                        "text-center px-1 sm:px-1.5 py-2 sm:py-2.5 font-semibold whitespace-nowrap min-w-[52px] sm:min-w-[65px] border-l border-border transition-colors bg-muted",
                        isToday && "bg-primary/20 ring-2 ring-primary ring-inset"
                      )}
                    >
                      <div className="flex flex-col items-center gap-0">
                        <span className={cn(
                          "text-[10px] sm:text-xs font-bold",
                          isToday ? "text-primary" : "text-foreground"
                        )}>
                          {day}
                        </span>
                        <span className="text-[8px] sm:text-[9px] text-muted-foreground capitalize">
                          {weekday}
                        </span>
                        <span className="text-[7px] sm:text-[8px] text-muted-foreground uppercase">
                          {month}
                        </span>
                        {isToday && (
                          <span className="text-[7px] sm:text-[8px] bg-primary text-primary-foreground px-1 py-0.5 rounded-full font-bold mt-0.5">
                            HOJE
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {keyMetrics.map((metric, idx) => {
                const Icon = metric.icon;
                
                return (
                  <tr 
                    key={metric.id}
                    className={cn(
                      'border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors',
                      idx % 2 === 0 && 'bg-muted/10'
                    )}
                  >
                    <td className={cn(
                      "px-2 sm:px-3 py-1.5 sm:py-2 sticky left-0 z-10 border-r border-border",
                      metric.bgColor
                    )}>
                      <div className="flex items-center gap-1.5">
                        <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", metric.color)} />
                        <span className="font-medium text-foreground text-[10px] sm:text-xs whitespace-nowrap truncate">
                          {metric.nome}
                        </span>
                      </div>
                    </td>
                    
                    {datesInRange.map((date) => {
                      const dayMetrics = metricsByDate[date];
                      const value = dayMetrics ? (dayMetrics as any)[metric.id] : null;
                      const isToday = date === format(today, 'yyyy-MM-dd');
                      const editable = !isAdmin;
                      
                      return (
                        <td 
                          key={date}
                          className={cn(
                            "text-center px-0.5 sm:px-1 py-1 border-l border-border",
                            isToday && "bg-primary/5"
                          )}
                        >
                          {editable ? (
                            <input
                              type="number"
                              value={value ?? ''}
                              onChange={(e) => handleInputChange(date, metric.id, e.target.value)}
                              placeholder="-"
                              className={cn(
                                "w-full text-center font-semibold rounded px-0.5 py-1 text-[10px] sm:text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all",
                                "bg-background border",
                                isToday 
                                  ? "border-primary/50" 
                                  : "border-border hover:border-primary/30",
                                value !== null && value !== 0 && "bg-accent/30"
                              )}
                            />
                          ) : (
                            <span className={cn(
                              "font-semibold text-[10px] sm:text-xs",
                              value !== null && value !== 0 ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {value !== null && value !== 0 ? String(value) : '-'}
                            </span>
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
      )}
    </div>
  );
}
