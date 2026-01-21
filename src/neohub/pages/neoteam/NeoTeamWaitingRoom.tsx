import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Clock, Users, Bell, Search, UserCheck,
  AlertCircle, CheckCircle2, Timer, Volume2,
  ArrowRight, MoreVertical, Phone, Loader2,
  Plus, RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNeoTeamWaitingRoom, WaitingPatient, AddToWaitingRoom } from '@/neohub/hooks/useNeoTeamWaitingRoom';

type WaitingStatus = 'arrived' | 'waiting' | 'called' | 'in_service' | 'completed';

const statusConfig: Record<WaitingStatus, { label: string; color: string; bg: string }> = {
  arrived: { label: 'Chegou', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  waiting: { label: 'Aguardando', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  called: { label: 'Chamado', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  in_service: { label: 'Em Atendimento', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  completed: { label: 'Concluído', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
};

const priorityConfig = {
  normal: { label: 'Normal', color: 'bg-gray-100 text-gray-600' },
  high: { label: 'Alta', color: 'bg-amber-100 text-amber-600' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-600' },
};

const rooms = ['Sala 1', 'Sala 2', 'Sala 3', 'Consultório 1', 'Consultório 2'];

export default function NeoTeamWaitingRoom() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<WaitingStatus | 'all'>('all');
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  
  // New patient form
  const [newPatient, setNewPatient] = useState<AddToWaitingRoom>({
    patient_name: '',
    type: 'consulta',
    doctor_name: '',
    priority: 'normal',
  });

  const {
    patients,
    isLoading,
    stats,
    addToWaitingRoom,
    callPatient,
    startService,
    completeService,
    removeFromWaitingRoom,
    updatePriority,
    refetch,
  } = useNeoTeamWaitingRoom();

  const now = new Date();

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getWaitTime = (arrivalTime: string) => {
    const minutes = differenceInMinutes(now, new Date(arrivalTime));
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const handleAddPatient = async () => {
    if (!newPatient.patient_name) return;
    
    await addToWaitingRoom(newPatient);
    setNewPatient({
      patient_name: '',
      type: 'consulta',
      doctor_name: '',
      priority: 'normal',
    });
    setAddPatientOpen(false);
  };

  const handleCallPatient = async (patient: WaitingPatient) => {
    await callPatient(patient.id, selectedRoom || undefined);
    setSelectedRoom('');
  };

  const handleStartService = async (patient: WaitingPatient, room: string) => {
    await startService(patient.id, room);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-amber-500" />
            Sala de Espera
            <Badge variant="outline" className="ml-2 animate-pulse">
              🔴 Tempo Real
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            {format(now, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={addPatientOpen} onOpenChange={setAddPatientOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Paciente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar à Sala de Espera</DialogTitle>
                <DialogDescription>
                  Registre a chegada de um paciente
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome do Paciente *</Label>
                  <Input
                    placeholder="Nome completo"
                    value={newPatient.patient_name}
                    onChange={(e) => setNewPatient({ ...newPatient, patient_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select 
                      value={newPatient.type} 
                      onValueChange={(v) => setNewPatient({ ...newPatient, type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consulta">Consulta</SelectItem>
                        <SelectItem value="retorno">Retorno</SelectItem>
                        <SelectItem value="procedimento">Procedimento</SelectItem>
                        <SelectItem value="exame">Exame</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select 
                      value={newPatient.priority} 
                      onValueChange={(v) => setNewPatient({ ...newPatient, priority: v as 'normal' | 'high' | 'urgent' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Médico (opcional)</Label>
                  <Input
                    placeholder="Nome do médico"
                    value={newPatient.doctor_name || ''}
                    onChange={(e) => setNewPatient({ ...newPatient, doctor_name: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setAddPatientOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddPatient} disabled={!newPatient.patient_name}>
                    Adicionar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Users className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.waiting}</p>
              <p className="text-sm text-muted-foreground">Aguardando</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Bell className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.called}</p>
              <p className="text-sm text-muted-foreground">Chamados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inService}</p>
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
              <p className="text-2xl font-bold">{stats.avgWaitTime}min</p>
              <p className="text-sm text-muted-foreground">Tempo Médio</p>
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
        {isLoading ? (
          <Card>
            <CardContent className="p-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : filteredPatients.length === 0 ? (
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
                patient.priority === 'urgent' ? 'border-l-4 border-l-red-500' :
                patient.priority === 'high' ? 'border-l-4 border-l-amber-500' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {patient.patient_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{patient.patient_name}</p>
                        {patient.priority !== 'normal' && (
                          <Badge className={priorityConfig[patient.priority].color}>
                            {priorityConfig[patient.priority].label}
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
                        {patient.appointment_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Agendado: {patient.appointment_time}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          Espera: {getWaitTime(patient.arrival_time)}
                        </span>
                        <span>{patient.type}</span>
                        {patient.doctor_name && <span>• {patient.doctor_name}</span>}
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" className="gap-2">
                            <Volume2 className="h-4 w-4" />
                            Chamar
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {rooms.map((room) => (
                            <DropdownMenuItem 
                              key={room}
                              onClick={() => callPatient(patient.id, room)}
                            >
                              {room}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {patient.status === 'called' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-2">
                            <ArrowRight className="h-4 w-4" />
                            Iniciar
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {rooms.map((room) => (
                            <DropdownMenuItem 
                              key={room}
                              onClick={() => handleStartService(patient, room)}
                            >
                              {room}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {patient.status === 'in_service' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="gap-2"
                        onClick={() => completeService(patient.id)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Finalizar
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updatePriority(patient.id, 'high')}>
                          Prioridade Alta
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updatePriority(patient.id, 'urgent')}>
                          Prioridade Urgente
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updatePriority(patient.id, 'normal')}>
                          Prioridade Normal
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => removeFromWaitingRoom(patient.id)}
                        >
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
