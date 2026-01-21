import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  Clock, Users, Bell, Search, UserCheck,
  AlertCircle, CheckCircle2, Timer, Volume2,
  ArrowRight, MoreVertical, Phone
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type WaitingStatus = 'arrived' | 'waiting' | 'called' | 'in_service' | 'completed';

interface WaitingPatient {
  id: string;
  name: string;
  phone: string;
  appointmentTime: string;
  arrivalTime: Date;
  type: string;
  doctor: string;
  room?: string;
  status: WaitingStatus;
  priority: 'normal' | 'high';
}

const statusConfig: Record<WaitingStatus, { label: string; color: string; bg: string }> = {
  arrived: { label: 'Chegou', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  waiting: { label: 'Aguardando', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  called: { label: 'Chamado', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  in_service: { label: 'Em Atendimento', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  completed: { label: 'Concluído', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
};

export default function NeoTeamWaitingRoom() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<WaitingStatus | 'all'>('all');

  const now = new Date();

  // Mock data
  const patients: WaitingPatient[] = [
    { 
      id: '1', name: 'Maria Silva', phone: '(11) 99999-1234',
      appointmentTime: '14:00', arrivalTime: new Date(now.getTime() - 25 * 60000),
      type: 'Consulta', doctor: 'Dr. Ricardo Mendes', status: 'waiting', priority: 'high'
    },
    { 
      id: '2', name: 'João Santos', phone: '(11) 99999-5678',
      appointmentTime: '14:15', arrivalTime: new Date(now.getTime() - 18 * 60000),
      type: 'Retorno', doctor: 'Dra. Paula Lima', status: 'waiting', priority: 'normal'
    },
    { 
      id: '3', name: 'Ana Costa', phone: '(11) 99999-9012',
      appointmentTime: '14:30', arrivalTime: new Date(now.getTime() - 12 * 60000),
      type: 'Procedimento', doctor: 'Dr. Ricardo Mendes', room: 'Sala 2', status: 'in_service', priority: 'normal'
    },
    { 
      id: '4', name: 'Pedro Lima', phone: '(11) 99999-3456',
      appointmentTime: '14:45', arrivalTime: new Date(now.getTime() - 5 * 60000),
      type: 'Consulta', doctor: 'Dra. Paula Lima', status: 'called', priority: 'normal'
    },
    { 
      id: '5', name: 'Carla Souza', phone: '(11) 99999-7890',
      appointmentTime: '15:00', arrivalTime: new Date(now.getTime() - 2 * 60000),
      type: 'Avaliação', doctor: 'Dr. Ricardo Mendes', status: 'arrived', priority: 'normal'
    },
  ];

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  const waitingCount = patients.filter(p => ['arrived', 'waiting'].includes(p.status)).length;
  const inServiceCount = patients.filter(p => p.status === 'in_service').length;
  const avgWaitTime = Math.round(
    patients
      .filter(p => ['waiting', 'called'].includes(p.status))
      .reduce((acc, p) => acc + differenceInMinutes(now, p.arrivalTime), 0) / 
    Math.max(1, patients.filter(p => ['waiting', 'called'].includes(p.status)).length)
  );

  const getWaitTime = (arrivalTime: Date) => {
    const minutes = differenceInMinutes(now, arrivalTime);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const handleCallPatient = (patient: WaitingPatient) => {
    // TODO: Implement call functionality with sound/notification
    console.log('Calling patient:', patient.name);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-amber-500" />
            Sala de Espera
          </h1>
          <p className="text-muted-foreground">
            {format(now, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <Button className="gap-2">
          <Bell className="h-4 w-4" />
          Chamar Próximo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Users className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{waitingCount}</p>
              <p className="text-sm text-muted-foreground">Aguardando</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inServiceCount}</p>
              <p className="text-sm text-muted-foreground">Em Atendimento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Timer className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgWaitTime}min</p>
              <p className="text-sm text-muted-foreground">Tempo Médio</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">Atendidos Hoje</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'arrived', 'waiting', 'called', 'in_service'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'Todos' : statusConfig[status].label}
            </Button>
          ))}
        </div>
      </div>

      {/* Patient List */}
      <div className="grid gap-4">
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">Nenhum paciente na sala de espera</p>
              <p className="text-muted-foreground">Os pacientes aparecerão aqui quando chegarem</p>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
            <Card 
              key={patient.id} 
              className={`transition-all hover:shadow-md ${
                patient.priority === 'high' ? 'border-l-4 border-l-red-500' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{patient.name}</p>
                        {patient.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Prioridade
                          </Badge>
                        )}
                        <Badge 
                          variant="secondary" 
                          className={`${statusConfig[patient.status].bg} ${statusConfig[patient.status].color}`}
                        >
                          {statusConfig[patient.status].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Agendado: {patient.appointmentTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          Espera: {getWaitTime(patient.arrivalTime)}
                        </span>
                        <span>{patient.type} • {patient.doctor}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {patient.room && (
                      <Badge variant="outline" className="font-medium">
                        {patient.room}
                      </Badge>
                    )}
                    {['arrived', 'waiting'].includes(patient.status) && (
                      <Button 
                        size="sm" 
                        className="gap-2"
                        onClick={() => handleCallPatient(patient)}
                      >
                        <Volume2 className="h-4 w-4" />
                        Chamar
                      </Button>
                    )}
                    {patient.status === 'called' && (
                      <Button size="sm" variant="outline" className="gap-2">
                        <ArrowRight className="h-4 w-4" />
                        Iniciar
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Phone className="h-4 w-4 mr-2" />
                          Ligar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Marcar como Atendido
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Remover da Fila
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
