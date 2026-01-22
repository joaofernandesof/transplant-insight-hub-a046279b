import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Stethoscope, Clock, User, AlertCircle, Volume2, RefreshCw, Loader2
} from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNeoTeamWaitingRoom, WaitingPatient } from '@/neohub/hooks/useNeoTeamWaitingRoom';
import { useNeoTeamBranches } from '@/neohub/hooks/useNeoTeamBranches';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';

const rooms = ['Sala 1', 'Sala 2', 'Sala 3', 'Consultório 1', 'Consultório 2'];

export default function NeoTeamDoctorView() {
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const { branches } = useNeoTeamBranches();
  
  const {
    patients,
    isLoading,
    startService,
    completeService,
    refetch,
  } = useNeoTeamWaitingRoom();

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter patients that are called or in service
  const calledPatients = patients.filter(p => 
    p.status === 'called' && (!selectedRoom || p.room === selectedRoom)
  );
  
  const inServicePatients = patients.filter(p => 
    p.status === 'in_service' && (!selectedRoom || p.room === selectedRoom)
  );

  const formatWaitTime = (arrivalTime: string) => {
    const totalMinutes = differenceInMinutes(currentTime, new Date(arrivalTime));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}min`;
  };

  const handleStartService = async (patient: WaitingPatient) => {
    if (patient.room) {
      await startService(patient.id, patient.room);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-6 space-y-6">
      <NeoTeamBreadcrumb />
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Stethoscope className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">VISÃO DO MÉDICO</h1>
              <p className="text-sm opacity-80">Pacientes Chamados para Atendimento</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm opacity-80">HORA</p>
              <p className="font-semibold text-xl">{format(currentTime, 'HH:mm:ss')}</p>
            </div>
            <Button 
              variant="secondary" 
              size="icon" 
              className="rounded-full"
              onClick={refetch}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Room Filter */}
        <div className="flex items-center gap-4">
          <span className="font-medium">Filtrar por Sala:</span>
          <Select value={selectedRoom || 'all'} onValueChange={(value) => setSelectedRoom(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas as salas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as salas</SelectItem>
              {rooms.map((room) => (
                <SelectItem key={room} value={room}>
                  {room}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="animate-pulse">
            🔴 Tempo Real
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Called Patients */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-purple-500" />
                Pacientes Chamados
                <Badge variant="secondary">{calledPatients.length}</Badge>
              </h2>
              
              {calledPatients.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum paciente chamado no momento</p>
                  </CardContent>
                </Card>
              ) : (
                calledPatients.map((patient) => (
                  <Card key={patient.id} className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <User className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{patient.patient_name}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Espera: {formatWaitTime(patient.arrival_time)}
                              </span>
                              <Badge variant="outline">{patient.type}</Badge>
                              {patient.room && (
                                <Badge className="bg-purple-100 text-purple-700">{patient.room}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button onClick={() => handleStartService(patient)}>
                          Iniciar Atendimento
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* In Service Patients */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-green-500" />
                Em Atendimento
                <Badge variant="secondary">{inServicePatients.length}</Badge>
              </h2>
              
              {inServicePatients.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum atendimento em andamento</p>
                  </CardContent>
                </Card>
              ) : (
                inServicePatients.map((patient) => (
                  <Card key={patient.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <User className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{patient.patient_name}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <Badge variant="outline">{patient.type}</Badge>
                              {patient.room && (
                                <Badge className="bg-green-100 text-green-700">{patient.room}</Badge>
                              )}
                              {patient.service_started_at && (
                                <span>
                                  Início: {format(new Date(patient.service_started_at), 'HH:mm')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => completeService(patient.id)}
                        >
                          Finalizar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
