import React, { useMemo } from 'react';
import { WeekData, formatDate, generateWeeks2026 } from '@/data/metricsData';
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
  User
} from 'lucide-react';

interface KeyDailyMetricsProps {
  weeks: WeekData[];
  currentWeekNumber: number;
  onValueChange: (weekNumber: number, key: string, value: number | string | null) => void;
  getWeekValues: (weekNumber: number) => Record<string, number | string | null>;
  isAdmin: boolean;
}

// Indicadores-chave diários para preenchimento da atendente
const keyMetrics = [
  { 
    id: 'leads_novos', 
    nome: 'Leads Novos', 
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  { 
    id: 'tempo_uso_atendente', 
    nome: 'Tempo de Uso (Atendente)', 
    icon: Clock,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  { 
    id: 'atividades_atendente', 
    nome: 'Atividades (Atendente)', 
    icon: Activity,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    borderColor: 'border-cyan-200 dark:border-cyan-800'
  },
  { 
    id: 'atividades_robo', 
    nome: 'Atividades (Robô)', 
    icon: Bot,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  { 
    id: 'mensagens_enviadas_atendente', 
    nome: 'Msgs Enviadas (Atendente)', 
    icon: MessageSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  { 
    id: 'mensagens_enviadas_robo', 
    nome: 'Msgs Enviadas (Robô)', 
    icon: Bot,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    borderColor: 'border-teal-200 dark:border-teal-800'
  },
  { 
    id: 'mensagens_recebidas', 
    nome: 'Mensagens Recebidas', 
    icon: MessageSquare,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    borderColor: 'border-indigo-200 dark:border-indigo-800'
  },
  { 
    id: 'tarefas_realizadas', 
    nome: 'Tarefas Realizadas', 
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800'
  },
  { 
    id: 'tarefas_atrasadas', 
    nome: 'Tarefas Atrasadas', 
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  { 
    id: 'agendamentos', 
    nome: 'Agendamentos', 
    icon: Calendar,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800'
  },
  { 
    id: 'vendas_realizadas', 
    nome: 'Vendas Realizadas', 
    icon: ShoppingCart,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    borderColor: 'border-pink-200 dark:border-pink-800'
  },
  { 
    id: 'leads_descartados', 
    nome: 'Leads Descartados', 
    icon: XCircle,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 dark:bg-slate-950/30',
    borderColor: 'border-slate-200 dark:border-slate-800'
  },
];

export function KeyDailyMetrics({
  weeks,
  currentWeekNumber,
  onValueChange,
  getWeekValues,
  isAdmin
}: KeyDailyMetricsProps) {
  // Get last 7 days/weeks for display
  const allWeeks = useMemo(() => generateWeeks2026(), []);
  
  // Show current week and previous 6 weeks for trend
  const displayWeeks = useMemo(() => {
    const startIndex = Math.max(0, currentWeekNumber - 7);
    const endIndex = currentWeekNumber;
    return allWeeks.slice(startIndex, endIndex + 1);
  }, [allWeeks, currentWeekNumber]);

  const handleInputChange = (weekNumber: number, metricId: string, value: string) => {
    if (value === '') {
      onValueChange(weekNumber, metricId, null);
      return;
    }
    const numVal = parseFloat(value.replace(',', '.'));
    if (!isNaN(numVal)) {
      onValueChange(weekNumber, metricId, numVal);
    }
  };

  const isWeekEditable = (weekNumber: number) => {
    if (isAdmin) return true;
    return weekNumber <= currentWeekNumber;
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm mb-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Activity className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base sm:text-lg">Indicadores-Chave Diários</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Métricas operacionais para acompanhamento rápido
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-muted sticky top-0 z-20">
            <tr className="border-b border-border">
              {/* Fixed column - Indicator */}
              <th className="text-left px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-foreground whitespace-nowrap sticky left-0 bg-muted z-30 min-w-[180px] sm:min-w-[220px] border-r border-border">
                <span className="text-xs sm:text-sm">Indicador</span>
              </th>
              
              {/* Week columns */}
              {displayWeeks.map((week) => (
                <th 
                  key={week.weekNumber}
                  className={cn(
                    "text-center px-2 sm:px-3 py-2 sm:py-2.5 font-semibold whitespace-nowrap min-w-[70px] sm:min-w-[85px] border-l border-border transition-colors",
                    week.weekNumber === currentWeekNumber && "bg-primary/20 ring-2 ring-primary ring-inset"
                  )}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={cn(
                      "text-xs sm:text-sm font-bold",
                      week.weekNumber === currentWeekNumber ? "text-primary" : "text-foreground"
                    )}>
                      S{week.weekNumber}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                      {formatDate(week.startDate).split('/').slice(0, 2).join('/')}
                    </span>
                    {week.weekNumber === currentWeekNumber && (
                      <span className="text-[8px] sm:text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">
                        ATUAL
                      </span>
                    )}
                  </div>
                </th>
              ))}
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
                  {/* Indicator Name */}
                  <td className={cn(
                    "px-3 sm:px-4 py-2.5 sm:py-3 sticky left-0 z-10 border-r border-border",
                    metric.bgColor
                  )}>
                    <div className="flex items-center gap-2">
                      <div className={cn("p-1.5 rounded", metric.bgColor)}>
                        <Icon className={cn("w-4 h-4", metric.color)} />
                      </div>
                      <span className="font-medium text-foreground text-xs sm:text-sm whitespace-nowrap">
                        {metric.nome}
                      </span>
                    </div>
                  </td>
                  
                  {/* Week Values */}
                  {displayWeeks.map((week) => {
                    const weekValues = getWeekValues(week.weekNumber);
                    const value = weekValues[metric.id] ?? null;
                    const editable = isWeekEditable(week.weekNumber);
                    const isCurrent = week.weekNumber === currentWeekNumber;
                    
                    return (
                      <td 
                        key={week.weekNumber}
                        className={cn(
                          "text-center px-1.5 sm:px-2 py-2 border-l border-border",
                          isCurrent && "bg-primary/5"
                        )}
                      >
                        {editable && !isAdmin ? (
                          <input
                            type="text"
                            value={value !== null ? String(value) : ''}
                            onChange={(e) => handleInputChange(week.weekNumber, metric.id, e.target.value)}
                            placeholder="-"
                            className={cn(
                              "w-full text-center font-semibold rounded px-1 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                              "bg-white dark:bg-gray-800 border",
                              isCurrent 
                                ? "border-primary/50 shadow-sm" 
                                : "border-border hover:border-primary/30",
                              value !== null && "bg-amber-50 dark:bg-amber-950/30"
                            )}
                          />
                        ) : (
                          <span className={cn(
                            "font-semibold text-xs sm:text-sm",
                            value !== null ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {value !== null ? String(value) : '-'}
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
    </div>
  );
}
