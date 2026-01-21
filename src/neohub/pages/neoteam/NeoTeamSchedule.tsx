import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, ChevronLeft, ChevronRight, Clock, User,
  Phone, MoreVertical, Check, X, AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  time: string;
  duration: number;
  type: string;
  doctor: string;
  status: AppointmentStatus;
  notes?: string;
}

const statusConfig: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  scheduled: { label: 'Agendado', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  confirmed: { label: 'Confirmado', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  in_progress: { label: 'Em Atendimento', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  completed: { label: 'Concluído', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
  cancelled: { label: 'Cancelado', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  no_show: { label: 'Não Compareceu', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
};

export default function NeoTeamSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');

  // Mock data
  const appointments: Appointment[] = [
    { id: '1', patientName: 'Maria Silva', patientPhone: '(11) 99999-1234', time: '08:00', duration: 30, type: 'Consulta', doctor: 'Dr. Ricardo Mendes', status: 'completed' },
    { id: '2', patientName: 'João Santos', patientPhone: '(11) 99999-5678', time: '08:30', duration: 45, type: 'Avaliação', doctor: 'Dr. Ricardo Mendes', status: 'completed' },
    { id: '3', patientName: 'Ana Costa', patientPhone: '(11) 99999-9012', time: '09:15', duration: 30, type: 'Retorno', doctor: 'Dra. Paula Lima', status: 'in_progress' },
    { id: '4', patientName: 'Pedro Lima', patientPhone: '(11) 99999-3456', time: '10:00', duration: 60, type: 'Procedimento', doctor: 'Dr. Ricardo Mendes', status: 'confirmed' },
    { id: '5', patientName: 'Carla Souza', patientPhone: '(11) 99999-7890', time: '11:00', duration: 30, type: 'Consulta', doctor: 'Dra. Paula Lima', status: 'scheduled' },
    { id: '6', patientName: 'Bruno Alves', patientPhone: '(11) 99999-2345', time: '11:30', duration: 30, type: 'Retorno', doctor: 'Dr. Ricardo Mendes', status: 'scheduled' },
    { id: '7', patientName: 'Fernanda Dias', patientPhone: '(11) 99999-6789', time: '14:00', duration: 45, type: 'Avaliação', doctor: 'Dra. Paula Lima', status: 'scheduled' },
    { id: '8', patientName: 'Lucas Martins', patientPhone: '(11) 99999-0123', time: '15:00', duration: 30, type: 'Consulta', doctor: 'Dr. Ricardo Mendes', status: 'cancelled' },
  ];

  const weekDays = Array.from({ length: 7 }, (_, i) => 
    addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), i)
  );

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    pending: appointments.filter(a => a.status === 'scheduled').length,
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">Gerencie os agendamentos da clínica</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total do Dia</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            <p className="text-sm text-muted-foreground">Confirmados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
            <p className="text-sm text-muted-foreground">Concluídos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-[300px,1fr] gap-6">
        {/* Calendar Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md"
                locale={ptBR}
              />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Médicos Disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">Dr. Ricardo Mendes</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">Dra. Paula Lima</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-lg">
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </CardTitle>
                <CardDescription>
                  {appointments.length} agendamentos
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Tabs value={view} onValueChange={(v) => setView(v as 'day' | 'week')}>
              <TabsList>
                <TabsTrigger value="day">Dia</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div 
                    key={apt.id}
                    className={`p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
                      apt.status === 'cancelled' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-lg font-bold">{apt.time}</p>
                          <p className="text-xs text-muted-foreground">{apt.duration}min</p>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{apt.patientName}</p>
                            <Badge 
                              variant="secondary" 
                              className={`${statusConfig[apt.status].bg} ${statusConfig[apt.status].color} text-xs`}
                            >
                              {statusConfig[apt.status].label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {apt.type}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {apt.doctor}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {apt.patientPhone}
                            </span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Check className="h-4 w-4 mr-2" />
                            Confirmar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Clock className="h-4 w-4 mr-2" />
                            Remarcar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
