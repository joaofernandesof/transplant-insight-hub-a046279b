/**
 * Surgery Kanban - Styled Kanban for surgery scheduling
 */

import { Badge } from "@/components/ui/badge";
import { SurgerySchedule } from "@/hooks/useSurgerySchedule";
import { SurgeryCard } from "./SurgeryCard";
import { format, parseISO, isToday, isTomorrow, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";
import { StyledKanban, StyledKanbanCard, KanbanColumn } from "@/components/shared/StyledKanban";

interface SurgeryKanbanProps {
  surgeries: SurgerySchedule[];
  onSelectSurgery: (surgery: SurgerySchedule) => void;
}

export function SurgeryKanban({ surgeries, onSelectSurgery }: SurgeryKanbanProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { locale: ptBR });
  const weekEnd = endOfWeek(today, { locale: ptBR });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getColumnTotal = (columnSurgeries: SurgerySchedule[]) => {
    return columnSurgeries.reduce((sum, s) => sum + (s.final_value || 0), 0);
  };

  const columns: KanbanColumn<SurgerySchedule>[] = useMemo(() => {
    const todaySurgeries = surgeries.filter(s => isToday(parseISO(s.surgery_date)));
    const tomorrowSurgeries = surgeries.filter(s => isTomorrow(parseISO(s.surgery_date)));
    const thisWeekSurgeries = surgeries.filter(s => {
      const date = parseISO(s.surgery_date);
      return isWithinInterval(date, { start: weekStart, end: weekEnd }) && 
             !isToday(date) && 
             !isTomorrow(date);
    });
    const upcomingSurgeries = surgeries.filter(s => {
      const date = parseISO(s.surgery_date);
      return date > weekEnd;
    });

    return [
      { 
        id: 'today', 
        title: 'Hoje', 
        subtitle: formatCurrency(getColumnTotal(todaySurgeries)),
        items: todaySurgeries,
        color: 'from-emerald-500 to-emerald-600',
        statusColor: 'bg-emerald-500',
      },
      { 
        id: 'tomorrow', 
        title: 'Amanhã', 
        subtitle: formatCurrency(getColumnTotal(tomorrowSurgeries)),
        items: tomorrowSurgeries,
        color: 'from-blue-500 to-blue-600',
        statusColor: 'bg-blue-500',
      },
      { 
        id: 'thisWeek', 
        title: 'Esta Semana', 
        subtitle: formatCurrency(getColumnTotal(thisWeekSurgeries)),
        items: thisWeekSurgeries,
        color: 'from-amber-500 to-amber-600',
        statusColor: 'bg-amber-500',
      },
      { 
        id: 'upcoming', 
        title: 'Próximas', 
        subtitle: formatCurrency(getColumnTotal(upcomingSurgeries)),
        items: upcomingSurgeries,
        color: 'from-purple-500 to-purple-600',
        statusColor: 'bg-purple-500',
      },
    ];
  }, [surgeries, weekStart, weekEnd]);

  const renderCard = (surgery: SurgerySchedule) => (
    <div key={surgery.id}>
      <SurgeryCard surgery={surgery} onEdit={onSelectSurgery} />
    </div>
  );

  return (
    <StyledKanban
      columns={columns}
      renderCard={renderCard}
      renderEmptyState={(columnId) => (
        <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
          {columnId === 'today' ? 'Nenhuma cirurgia hoje' :
           columnId === 'tomorrow' ? 'Nenhuma cirurgia amanhã' :
           columnId === 'thisWeek' ? 'Sem cirurgias esta semana' :
           'Sem cirurgias futuras'}
        </div>
      )}
    />
  );
}
