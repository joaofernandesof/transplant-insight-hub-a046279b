import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SurgerySchedule } from "@/hooks/useSurgerySchedule";
import { SurgeryCard } from "./SurgeryCard";
import { format, parseISO, isToday, isTomorrow, addDays, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

interface SurgeryKanbanProps {
  surgeries: SurgerySchedule[];
  onSelectSurgery: (surgery: SurgerySchedule) => void;
}

export function SurgeryKanban({ surgeries, onSelectSurgery }: SurgeryKanbanProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { locale: ptBR });
  const weekEnd = endOfWeek(today, { locale: ptBR });

  const groupedSurgeries = useMemo(() => {
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

    return {
      today: todaySurgeries,
      tomorrow: tomorrowSurgeries,
      thisWeek: thisWeekSurgeries,
      upcoming: upcomingSurgeries,
    };
  }, [surgeries, weekStart, weekEnd]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getColumnTotal = (columnSurgeries: SurgerySchedule[]) => {
    return columnSurgeries.reduce((sum, s) => sum + (s.final_value || 0), 0);
  };

  const columns = [
    { 
      id: 'today', 
      title: 'Hoje', 
      surgeries: groupedSurgeries.today,
      color: 'bg-green-500',
      emptyMessage: 'Nenhuma cirurgia hoje',
    },
    { 
      id: 'tomorrow', 
      title: 'Amanhã', 
      surgeries: groupedSurgeries.tomorrow,
      color: 'bg-blue-500',
      emptyMessage: 'Nenhuma cirurgia amanhã',
    },
    { 
      id: 'thisWeek', 
      title: 'Esta Semana', 
      surgeries: groupedSurgeries.thisWeek,
      color: 'bg-amber-500',
      emptyMessage: 'Sem cirurgias esta semana',
    },
    { 
      id: 'upcoming', 
      title: 'Próximas', 
      surgeries: groupedSurgeries.upcoming,
      color: 'bg-purple-500',
      emptyMessage: 'Sem cirurgias futuras',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-350px)] min-h-[500px]">
      {columns.map((column) => (
        <Card key={column.id} className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${column.color}`} />
                <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">
                {column.surgeries.length}
              </Badge>
            </div>
            {column.surgeries.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Total: {formatCurrency(getColumnTotal(column.surgeries))}
              </p>
            )}
          </CardHeader>
          <CardContent className="flex-1 p-3 pt-0">
            <ScrollArea className="h-full pr-2">
              {column.surgeries.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <p className="text-sm text-muted-foreground">{column.emptyMessage}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {column.surgeries.map((surgery) => (
                    <SurgeryCard
                      key={surgery.id}
                      surgery={surgery}
                      onEdit={onSelectSurgery}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
