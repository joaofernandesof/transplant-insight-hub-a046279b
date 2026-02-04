/**
 * IPROMED - Astrea-style Full Agenda Page
 * Agenda completa com visualização semanal, integração com tarefas e ferramenta de reuniões
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Tag,
  Calendar,
  Clock,
  Users,
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import MeetingToolContent from "./MeetingToolContent";

interface CalendarEvent {
  id: string;
  title: string;
  type: 'task' | 'meeting' | 'deadline' | 'hearing';
  date: Date;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  assignee: string;
  color: string;
  caseNumber?: string;
}

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Análise do processo',
    type: 'task',
    date: new Date(2026, 0, 26),
    allDay: true,
    assignee: 'EU',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: '2',
    title: 'Estudo de teoria',
    type: 'task',
    date: new Date(2026, 0, 27),
    allDay: true,
    assignee: 'EU',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: '3',
    title: 'Audiência - Letícia Fonseca',
    type: 'hearing',
    date: new Date(2026, 0, 28),
    startTime: '16:00',
    endTime: '17:30',
    assignee: 'EU',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
    caseNumber: '0001234-56.2025',
  },
  {
    id: '4',
    title: 'Reunião com cliente - Lucas Moura',
    type: 'meeting',
    date: new Date(2026, 0, 29),
    startTime: '16:00',
    endTime: '17:00',
    assignee: 'EU',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: '5',
    title: 'Preparar documentação',
    type: 'task',
    date: new Date(2026, 0, 30),
    allDay: true,
    assignee: 'EU',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
];

const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 to 19:00

export default function AstreaAgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 27));
  const [viewMode, setViewMode] = useState('week');
  const [assigneeFilter, setAssigneeFilter] = useState('mine');
  const [activityFilter, setActivityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('calendar');

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));

  const getEventsForTime = (day: Date, hour: number) => {
    return mockEvents.filter(event => {
      if (!isSameDay(event.date, day)) return false;
      if (!event.startTime) return false;
      const eventHour = parseInt(event.startTime.split(':')[0]);
      return eventHour === hour;
    });
  };

  const getAllDayEvents = (day: Date) => {
    return mockEvents.filter(event => isSameDay(event.date, day) && event.allDay);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <Button className="gap-2 bg-[#0066CC]">
          <Plus className="h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="meetings" className="gap-2">
            <Users className="h-4 w-4" />
            Reuniões com Pauta
          </TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="mt-4 space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Por semana" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Por dia</SelectItem>
                <SelectItem value="week">Por semana</SelectItem>
                <SelectItem value="month">Por mês</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Minhas atribuições" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mine">Minhas atribuições</SelectItem>
                <SelectItem value="all">Todas atribuições</SelectItem>
                <SelectItem value="team">Da equipe</SelectItem>
              </SelectContent>
            </Select>

            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas as atividades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as atividades</SelectItem>
                <SelectItem value="tasks">Tarefas</SelectItem>
                <SelectItem value="meetings">Reuniões</SelectItem>
                <SelectItem value="hearings">Audiências</SelectItem>
                <SelectItem value="deadlines">Prazos</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Tag className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <h2 className="text-lg font-semibold">
                    {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
                  </h2>
                  <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Hoje
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Week Header */}
              <div className="grid grid-cols-7 border-b">
                <div className="w-16" /> {/* Time column spacer */}
                {weekDays.map((day, i) => {
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={i}
                      className={`text-center py-3 border-l ${isToday ? 'bg-[#0066CC]/5' : ''}`}
                    >
                      <div className="text-xs text-muted-foreground uppercase">
                        {format(day, 'EEE', { locale: ptBR })}
                      </div>
                      <div className={`text-xl font-semibold ${isToday ? 'text-[#0066CC]' : ''}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* All Day Events Row */}
              <div className="grid grid-cols-7 border-b bg-gray-50/50">
                <div className="w-16 p-2 text-xs text-muted-foreground text-right pr-3">
                  Dia todo
                </div>
                {weekDays.map((day, i) => {
                  const events = getAllDayEvents(day);
                  return (
                    <div key={i} className="border-l p-1 min-h-[40px]">
                      {events.map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded truncate ${event.color} border cursor-pointer hover:opacity-80`}
                        >
                          {event.assignee} - {event.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Time Grid */}
              <ScrollArea className="h-[400px]">
                <div className="relative">
                  {hours.map(hour => (
                    <div key={hour} className="grid grid-cols-7 border-b h-16">
                      <div className="w-16 p-2 text-xs text-muted-foreground text-right pr-3">
                        {String(hour).padStart(2, '0')}:00
                      </div>
                      {weekDays.map((day, i) => {
                        const events = getEventsForTime(day, hour);
                        return (
                          <div key={i} className="border-l relative">
                            {events.map(event => (
                              <div
                                key={event.id}
                                className={`absolute inset-x-1 ${event.color} border rounded p-1 text-xs cursor-pointer hover:opacity-80 z-10`}
                                style={{ top: '2px' }}
                              >
                                <div className="font-medium truncate">{event.title}</div>
                                {event.startTime && (
                                  <div className="text-[10px] opacity-75">
                                    {event.startTime} - {event.endTime}
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
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-xs text-muted-foreground">Prazos esta semana</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">2</div>
                  <div className="text-xs text-muted-foreground">Audiências agendadas</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">5</div>
                  <div className="text-xs text-muted-foreground">Reuniões marcadas</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Tag className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-xs text-muted-foreground">Tarefas pendentes</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Meetings with Agenda Tab */}
        <TabsContent value="meetings" className="mt-4">
          <MeetingToolContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
