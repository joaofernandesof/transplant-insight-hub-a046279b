/**
 * IPROMED - Astrea-style Agenda/Calendar
 * Agenda semanal com filtros inspirada no Astrea
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Tag,
  Filter,
} from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgendaEvent {
  id: string;
  title: string;
  type: 'task' | 'audience' | 'meeting' | 'deadline';
  date: Date;
  time?: string;
  endTime?: string;
  assignee: string;
  color: string;
}

const mockEvents: AgendaEvent[] = [
  {
    id: '1',
    title: 'Eu - Análise do caso',
    type: 'task',
    date: new Date('2026-01-27'),
    assignee: 'Eu',
    color: 'bg-blue-100 text-blue-800 border-l-blue-500',
  },
  {
    id: '2',
    title: 'Eu - Estudo de tese',
    type: 'task',
    date: new Date('2026-01-28'),
    assignee: 'Eu',
    color: 'bg-blue-100 text-blue-800 border-l-blue-500',
  },
  {
    id: '3',
    title: 'Eu - Audiência - Letícia Fonseca',
    type: 'audience',
    date: new Date('2026-01-29'),
    time: '14:00',
    endTime: '16:00',
    assignee: 'Eu',
    color: 'bg-amber-100 text-amber-800 border-l-amber-500',
  },
  {
    id: '4',
    title: 'Eu - Reunião com cliente - Lucas Moura',
    type: 'meeting',
    date: new Date('2026-01-30'),
    time: '10:00',
    assignee: 'Eu',
    color: 'bg-emerald-100 text-emerald-800 border-l-emerald-500',
  },
  {
    id: '5',
    title: 'Eu - Preparar petição',
    type: 'deadline',
    date: new Date('2026-01-31'),
    assignee: 'Eu',
    color: 'bg-purple-100 text-purple-800 border-l-purple-500',
  },
];

const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export default function AstreaStyleAgenda() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week');
  const [filter, setFilter] = useState('mine');

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDate = (date: Date) => {
    return mockEvents.filter(event => isSameDay(event.date, date));
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  return (
    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#0066CC]" />
          Agenda
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Filters */}
        <div className="flex items-center gap-2 px-4 py-3 border-b flex-wrap">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[130px] h-9 text-sm bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Por dia</SelectItem>
              <SelectItem value="week">Por semana</SelectItem>
              <SelectItem value="month">Por mês</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mine">Minhas atribuições</SelectItem>
              <SelectItem value="all">Todas as atribuições</SelectItem>
              <SelectItem value="team">Atribuições do time</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-[160px] h-9 text-sm bg-white">
              <SelectValue placeholder="Todas as atividades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as atividades</SelectItem>
              <SelectItem value="tasks">Tarefas</SelectItem>
              <SelectItem value="audiences">Audiências</SelectItem>
              <SelectItem value="meetings">Reuniões</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-9">
            <Tag className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-9">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Month/Year Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-sm">
              {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b">
              {weekDates.map((date, idx) => {
                const isToday = isSameDay(date, new Date());
                return (
                  <div
                    key={idx}
                    className={`text-center py-3 border-r last:border-r-0 ${
                      isToday ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="text-xs text-muted-foreground font-medium">
                      {weekDays[idx]}
                    </div>
                    <div className={`text-lg font-semibold ${
                      isToday ? 'text-[#0066CC]' : ''
                    }`}>
                      {format(date, 'd')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* All Day Events Row */}
            <div className="grid grid-cols-7 border-b min-h-[60px]">
              {weekDates.map((date, idx) => {
                const events = getEventsForDate(date).filter(e => !e.time);
                return (
                  <div key={idx} className="border-r last:border-r-0 p-1">
                    {events.map(event => (
                      <div
                        key={event.id}
                        className={`text-xs p-1.5 rounded border-l-2 mb-1 truncate cursor-pointer hover:opacity-80 ${event.color}`}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Time Slots */}
            {['10:00', '14:00', '16:00'].map(time => (
              <div key={time} className="grid grid-cols-7 border-b min-h-[50px]">
                {weekDates.map((date, idx) => {
                  const events = getEventsForDate(date).filter(e => e.time === time);
                  return (
                    <div key={idx} className="border-r last:border-r-0 p-1 relative">
                      {idx === 0 && (
                        <span className="absolute -left-1 -top-2 text-xs text-muted-foreground bg-white px-1">
                          {time}
                        </span>
                      )}
                      {events.map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-1.5 rounded border-l-2 cursor-pointer hover:opacity-80 ${event.color}`}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          {event.endTime && (
                            <div className="text-[10px] opacity-70">
                              {event.time} - {event.endTime}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
