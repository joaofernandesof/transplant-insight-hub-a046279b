import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Clock, RefreshCw, Trash2, Settings, Plus, Loader2, Volume2, VolumeX, 
  Stethoscope, Users, Timer, AlertCircle, UserPlus, BarChart3
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNeoTeamWaitingRoom, TriageStatus, MoodStatus, AddToWaitingRoom } from '@/neohub/hooks/useNeoTeamWaitingRoom';
import { useNeoTeamBranches } from '@/neohub/hooks/useNeoTeamBranches';
import { useNavigate } from 'react-router-dom';

const typeOptions = [
  { value: 'consulta', label: 'Consulta', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'retorno', label: 'Retorno', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'procedimento', label: 'Procedimento', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'exame', label: 'Exame', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
];

const triageOptions: { value: TriageStatus; label: string; color: string }[] = [
  { value: 'em_espera', label: 'Em Espera', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'nao_precisa', label: 'Não Precisa', color: 'bg-muted text-muted-foreground' },
  { value: 'triado', label: 'Triado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];

const moodOptions: { value: MoodStatus; label: string; color: string }[] = [
  { value: 'calmo', label: 'Calmo', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'tranquilo', label: 'Tranquilo', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'ansioso', label: 'Ansioso', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'irritado', label: 'Irritado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];

const WAIT_TIME_ALERT_MINUTES = 15;

export default function NeoTeamWaitingRoom() {
  const navigate = useNavigate();
  const { branches, isLoading: branchesLoading } = useNeoTeamBranches();
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [deletePatient, setDeletePatient] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alertedPatients, setAlertedPatients] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // New patient form
  const [newPatient, setNewPatient] = useState<AddToWaitingRoom>({
    patient_name: '',
    scheduled_time: '',
    type: 'consulta',
    branch: '',
  });

  const {
    patients,
    isLoading,
    addToWaitingRoom,
    updateTriage,
    updateMood,
    updateObservations,
    updateType,
    removeFromWaitingRoom,
    refetch,
  } = useNeoTeamWaitingRoom(selectedBranch || undefined);

  // Set default branch when branches load
  useEffect(() => {
    if (branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].code);
    }
  }, [branches, selectedBranch]);

  // Update branch in new patient form
  useEffect(() => {
    setNewPatient(prev => ({ ...prev, branch: selectedBranch }));
  }, [selectedBranch]);

  // Update time every second for real-time wait time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check for patients waiting too long and play alert sound
  useEffect(() => {
    if (!soundEnabled) return;

    const patientsWaitingTooLong = patients.filter(p => {
      const waitMinutes = differenceInMinutes(currentTime, new Date(p.arrival_time));
      return waitMinutes >= WAIT_TIME_ALERT_MINUTES && 
             ['arrived', 'waiting'].includes(p.status) &&
             !alertedPatients.has(p.id);
    });

    if (patientsWaitingTooLong.length > 0) {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      setAlertedPatients(prev => {
        const newSet = new Set(prev);
        patientsWaitingTooLong.forEach(p => newSet.add(p.id));
        return newSet;
      });
    }
  }, [patients, currentTime, soundEnabled, alertedPatients]);

  const formatWaitTime = (arrivalTime: string) => {
    const now = currentTime;
    const arrival = new Date(arrivalTime);
    const totalMinutes = differenceInMinutes(now, arrival);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getWaitTimeClass = (arrivalTime: string) => {
    const totalMinutes = differenceInMinutes(currentTime, new Date(arrivalTime));
    if (totalMinutes >= 30) return 'text-destructive font-bold';
    if (totalMinutes >= WAIT_TIME_ALERT_MINUTES) return 'text-amber-600 font-semibold';
    return 'text-muted-foreground';
  };

  const formatTimeOnly = (timeString?: string) => {
    if (!timeString) return '--:--';
    if (timeString.includes(':') && !timeString.includes('T')) {
      return timeString.substring(0, 5);
    }
    try {
      return format(new Date(timeString), 'HH:mm');
    } catch {
      return '--:--';
    }
  };

  const handleAddPatient = async () => {
    if (!newPatient.patient_name) return;
    
    await addToWaitingRoom({
      ...newPatient,
      scheduled_time: newPatient.scheduled_time || undefined,
    });
    
    setNewPatient({
      patient_name: '',
      scheduled_time: '',
      type: 'consulta',
      branch: selectedBranch,
    });
  };

  const handleDeleteConfirm = async () => {
    if (deletePatient) {
      await removeFromWaitingRoom(deletePatient);
      setDeletePatient(null);
    }
  };

  const getTypeConfig = (type: string) => {
    return typeOptions.find(t => t.value === type) || typeOptions[0];
  };

  const getTriageConfig = (triage: TriageStatus) => {
    return triageOptions.find(t => t.value === triage) || triageOptions[0];
  };

  const getMoodConfig = (mood: MoodStatus) => {
    return moodOptions.find(m => m.value === mood) || moodOptions[0];
  };

  // Stats
  const stats = {
    total: patients.length,
    waiting: patients.filter(p => ['arrived', 'waiting'].includes(p.status)).length,
    urgent: patients.filter(p => p.triage === 'urgente').length,
    avgWaitTime: patients.length > 0 
      ? Math.round(patients.reduce((acc, p) => acc + differenceInMinutes(currentTime, new Date(p.arrival_time)), 0) / patients.length)
      : 0,
  };

  const patientsWaitingTooLong = patients.filter(p => 
    differenceInMinutes(currentTime, new Date(p.arrival_time)) >= WAIT_TIME_ALERT_MINUTES &&
    ['arrived', 'waiting'].includes(p.status)
  );

  if (branchesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Audio element for alerts */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JgYB/g4yTlI+Nh4N9dG9tb3N5gIaJiYmIiIeFg4B8d3NxcXN2eX2AgoSFhoaFhIKAfXp3dHJxcXN2eX2AgoWHiImIh4WCf3x4dXJwcHJ1eH2AhIeJioqJh4WAe3h1cnBvcXR4fIGEh4qLi4mGg395dnNwb3BzdnuAg4eKjIyKiIR/enZzb29wc3Z7gIWIi4yLioeDfnl1cm9vcHN3fIGFiYyNjIqHg355dXJvbnBzdnyBhomMjY2Lh4N+eXVyb29wc3d8gYWJjI2Ni4eDfnl1cm9vcHN3fIGFiYyNjYuIg355dXJvb3Bzd3yBhYmMjY2LiIN+eXVyb29wc3d8gYWJjI2Ni4iDfnl1cm9vcHN3fIGFiYyNjYuIg355dXJvb3BzdnyBhYmMjY2LiIN+eXVyb29wc3d8gYWJjI2Ni4eDfnl1cm9vcHN3fIGFiYyNjYuHg355dXJvb3Bzd3yBhYmMjY2Lh4N+eXVyb29wc3d8gYWJjI2Ni4eDfnl1cm9vcHN3fIGFiIuNjYuIg355dXJvb3Bzd3yBhYiLjY2LiIN+eXVyb29wc3d8gYWIi42Ni4eDfnl1cm9vcHN3fIGFiIuNjYuHg355dXJvb3Bzd3yBhYiLjY2Lh4N+eXVyb29wc3d8gYWIi42Ni4eDfnl1cW9vcHN3fIGFiIuNjYuHg355dHJvb3Bzd3yBhYiLjY2Lh4N+eXRyb29wc3d8gYWIi42Ni4eDfnl0cm9vcHN2fIGFiIuNjYuHg355dHJvb3Bzd3yBhYiLjY2Lh4N+eXRyb29wc3d8gYWIi42Ni4eDfnl0cm9vcHN3fIGFiIuNjYuHg355dHJvb3Bzd3yBhYiLjY2Lh4N+eXRyb29wc3d8gYWIi42Ni4eDfnl0cm9vcHN3fIGFiIuNjYuHg355dHJvb3Bzd3yBhYiLjY2Lh4N+eXRyb29wc3d8gYWIi42Ni4eDfnl0cm9vcHN3fIGFiIuNjYuHg355dHJvb3Bzd3yBhYiLjY2Lh4N+eXRyb29wc3d8gYWIi42Ni4eDfnl0cm9vcHN3fIGFiIuNjYuHg355dHJvb3Bzd3yBhYiLjY2Lh4N+eXRyb29wc3d8gQ==" type="audio/wav" />
      </audio>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Sala de Espera
          </h1>
          <p className="text-muted-foreground">Gerenciamento de pacientes em atendimento</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs text-muted-foreground uppercase">Data</p>
            <p className="font-semibold">{format(currentTime, 'dd/MM/yyyy')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase">Hora</p>
            <p className="font-bold text-xl text-primary">{format(currentTime, 'HH:mm')}</p>
          </div>
          <div className="flex gap-2 ml-2">
            <Button variant="outline" size="icon" onClick={refetch} title="Atualizar">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant={soundEnabled ? "default" : "outline"}
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Desativar alertas sonoros' : 'Ativar alertas sonoros'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => navigate('/neoteam/waiting-room/reports')}
              title="Relatórios"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate('/neoteam/doctor-view')}
              title="Visão do Médico"
            >
              <Stethoscope className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate('/neoteam/settings')}
              title="Configurações"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Na Fila</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Timer className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgWaitTime}<span className="text-sm font-normal text-muted-foreground">min</span></p>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patientsWaitingTooLong.length}</p>
                <p className="text-sm text-muted-foreground">+15 min Espera</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.urgent}</p>
                <p className="text-sm text-muted-foreground">Urgentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branch Tabs */}
      {branches.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <Tabs value={selectedBranch} onValueChange={setSelectedBranch}>
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${branches.length}, 1fr)` }}>
                {branches.map((branch) => (
                  <TabsTrigger key={branch.code} value={branch.code}>
                    {branch.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Alert for long wait times */}
      {patientsWaitingTooLong.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50 animate-pulse">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-400">Atenção: Pacientes aguardando</p>
              <p className="text-sm text-amber-600 dark:text-amber-500">
                {patientsWaitingTooLong.length} paciente(s) aguardando há mais de {WAIT_TIME_ALERT_MINUTES} minutos
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Patient Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Adicionar Paciente à Fila
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Nome do Paciente</Label>
              <Input
                placeholder="Nome completo"
                value={newPatient.patient_name}
                onChange={(e) => setNewPatient({ ...newPatient, patient_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Horário Agendamento</Label>
              <Input
                type="time"
                value={newPatient.scheduled_time || ''}
                onChange={(e) => setNewPatient({ ...newPatient, scheduled_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Select
                value={newPatient.type}
                onValueChange={(value) => setNewPatient({ ...newPatient, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Médico (opcional)</Label>
              <Input
                placeholder="Nome do médico"
                value={newPatient.doctor_name || ''}
                onChange={(e) => setNewPatient({ ...newPatient, doctor_name: e.target.value })}
              />
            </div>
            <Button 
              onClick={handleAddPatient}
              disabled={!newPatient.patient_name}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Waiting List Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Paciente</TableHead>
                  <TableHead className="text-center font-semibold">Agendamento</TableHead>
                  <TableHead className="text-center font-semibold">Chegada</TableHead>
                  <TableHead className="text-center font-semibold">Espera</TableHead>
                  <TableHead className="text-center font-semibold">Tipo</TableHead>
                  <TableHead className="text-center font-semibold">Triagem</TableHead>
                  <TableHead className="text-center font-semibold">Humor</TableHead>
                  <TableHead className="font-semibold">Observações</TableHead>
                  <TableHead className="text-center w-[80px]">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 opacity-50" />
                        <p>Nenhum paciente na fila de espera</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.map((patient) => (
                    <TableRow 
                      key={patient.id} 
                      className={`hover:bg-muted/30 ${
                        differenceInMinutes(currentTime, new Date(patient.arrival_time)) >= WAIT_TIME_ALERT_MINUTES
                          ? 'bg-amber-50/50 dark:bg-amber-950/10'
                          : ''
                      }`}
                    >
                      <TableCell className="font-medium py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {patient.patient_name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium">{patient.patient_name}</p>
                            {patient.doctor_name && (
                              <p className="text-xs text-muted-foreground">Dr. {patient.doctor_name}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {formatTimeOnly(patient.scheduled_time)}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {format(new Date(patient.arrival_time), 'HH:mm')}
                      </TableCell>
                      <TableCell className={`text-center font-mono text-lg ${getWaitTimeClass(patient.arrival_time)}`}>
                        {formatWaitTime(patient.arrival_time)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={patient.type}
                          onValueChange={(value) => updateType(patient.id, value)}
                        >
                          <SelectTrigger className={`w-[110px] h-8 text-xs ${getTypeConfig(patient.type).color} border-0`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {typeOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={patient.triage}
                          onValueChange={(value) => updateTriage(patient.id, value as TriageStatus)}
                        >
                          <SelectTrigger className={`w-[110px] h-8 text-xs ${getTriageConfig(patient.triage).color} border-0`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {triageOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={patient.mood}
                          onValueChange={(value) => updateMood(patient.id, value as MoodStatus)}
                        >
                          <SelectTrigger className={`w-[100px] h-8 text-xs ${getMoodConfig(patient.mood).color} border-0`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {moodOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Adicionar observação..."
                          defaultValue={patient.observations || ''}
                          onBlur={(e) => {
                            if (e.target.value !== patient.observations) {
                              updateObservations(patient.id, e.target.value);
                            }
                          }}
                          className="min-w-[150px] h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletePatient(patient.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePatient} onOpenChange={() => setDeletePatient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Paciente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este paciente da fila de espera?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
