import React, { useState } from 'react';
import { useClinicSurgeries } from '../hooks/useClinicSurgeries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock } from 'lucide-react';
import { format, parseISO, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClinicSchedule() {
  const { scheduledSurgeries, isLoading } = useClinicSurgeries();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getSurgeriesForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return scheduledSurgeries.filter(s => s.surgeryDate === dateStr);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">Cirurgias agendadas da sua filial</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            Semana anterior
          </Button>
          <Button variant="outline" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Hoje
          </Button>
          <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Próxima semana
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {weekDays.map(day => {
          const surgeries = getSurgeriesForDay(day);
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          return (
            <Card key={day.toISOString()} className={isToday ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="p-3">
                <CardTitle className="text-sm">
                  {format(day, "EEE, d", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[200px]">
                  {surgeries.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Sem cirurgias</p>
                  ) : (
                    <div className="space-y-2">
                      {surgeries.map(s => (
                        <div key={s.id} className="p-2 rounded border text-xs">
                          <p className="font-medium truncate">{s.patientName}</p>
                          <p className="text-muted-foreground">{s.surgeryTime?.substring(0, 5)}</p>
                          <Badge variant="outline" className="mt-1 text-xs">{s.procedure}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
