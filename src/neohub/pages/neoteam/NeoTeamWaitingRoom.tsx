import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  Clock, RefreshCw, Trash2, Settings, Plus, Loader2, Volume2, VolumeX, Stethoscope
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
  { value: 'consulta', label: 'Consulta', color: 'bg-blue-100 text-blue-700' },
  { value: 'retorno', label: 'Retorno', color: 'bg-purple-100 text-purple-700' },
  { value: 'procedimento', label: 'Procedimento', color: 'bg-green-100 text-green-700' },
  { value: 'exame', label: 'Exame', color: 'bg-amber-100 text-amber-700' },
];

const triageOptions: { value: TriageStatus; label: string; color: string }[] = [
  { value: 'em_espera', label: 'Em Espera', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'nao_precisa', label: 'Não Precisa', color: 'bg-gray-100 text-gray-700' },
  { value: 'triado', label: 'Triado', color: 'bg-green-100 text-green-700' },
  { value: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-700' },
];

const moodOptions: { value: MoodStatus; label: string; color: string }[] = [
  { value: 'calmo', label: 'Calmo', color: 'bg-green-100 text-green-700' },
  { value: 'tranquilo', label: 'Tranquilo', color: 'bg-blue-100 text-blue-700' },
  { value: 'ansioso', label: 'Ansioso', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'irritado', label: 'Irritado', color: 'bg-red-100 text-red-700' },
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
      // Play alert sound
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      
      // Mark as alerted
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
    
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
  };

  const getWaitTimeClass = (arrivalTime: string) => {
    const totalMinutes = differenceInMinutes(currentTime, new Date(arrivalTime));
    if (totalMinutes >= 30) return 'text-red-600 font-bold';
    if (totalMinutes >= WAIT_TIME_ALERT_MINUTES) return 'text-amber-600 font-semibold';
    return '';
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

  if (branchesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Audio element for alerts */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JgYB/g4yTlI+Nh4N9dG9tb3N5gIaJiYmIiIeFg4B8d3NxcXN2eX2AgoSFhoaFhIKAfXp3dHJxcXN2eX2AgoWHiImIh4WCf3x4dXJwcHJ1eH2AhIeJioqJh4WAe3h1cnBvcXR4fIGEh4qLi4mGg395dnNwb3BzdnuAg4eKjIyKiIR/enZzb29wc3Z7gIWIi4yLioeDfnl1cm9vcHN3fIGFiYyNjIqHg355dXJvbnBzdnyBhomMjY2Lh4N+eXVyb29wc3d8gYWJjI2Ni4eDfnl1cm9vcHN3fIGFiYyNjYuIg355dXJvb3Bzd3yBhYmMjY2LiIN+eXVyb29wc3d8gYWJjI2Ni4iDfnl1cm9vcHN3fIGFiYyNjYuIg355dXJvb3BzdnyBhYmMjY2LiIN+eXVyb29wc3d8gYWJjI2Ni4eDfnl1cm9vcHN3fIGFiYyNjYuHg355dXJvb3Bzd3yBhYmMjY2Lh4N+eXVyb29wc3d8gYWJjI2Ni4eDfnl1cm9vcHN3fIGFiIuNjYuIg355dXJvb3Bzd3yBhYiLjY2LiIN+eXVyb29wc3d8gYWIi42Ni4eDfnl1cm9vcHN3fIGFiIuNjYuHg355dXJvb3Bzd3yBhYiLjY2Lh4N+eXVyb29wc3d8gYWIi42Ni4eDfnl1cW9vcHN3fIGFiIuNjYuHg355dHJvb3Bzd3yBhYiLjY2Lh4N+eXRyb29wc3d8gYWIi42Ni4eDfnl0cm9vcHN2fIGFiIuNjYuHg355dHJvb3Bzd3yBhYiLjY2Lh4N+eXRyb29wc3d8gYWIi42Ni4eDfnl0cm9vcHN3fIGFiIuNjYuHg355dHJvb3Bzd3yBhYiLjY2Lh4N+eXRyb29wc3d8gYWIi42Ni4eDfnl0cm9vcHN3fIGFiIuNjYuHg355dHJvb3Bzd3yBhYiLjY2Lh4N+eXRyb29wc3d8gYWIi42Ni4eDfnl0cm9vcHN3fIGFiIuNjYuHg355dHJvb3Bzd3yBhYiLjY2Lh4N+eXRyb29wc3d8gYWIi42Ni4eDfnl0cm9vcHN3fIGFiIuNjYuHg355dHJvb3Bzd3yBhYiLjY2Lh4N+eXRyb29wc3d8gQ==" type="audio/wav" />
      </audio>

      {/* Header */}
      <div className="bg-[#1e3a5f] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Clock className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">FILA DE ESPERA</h1>
              <p className="text-sm opacity-80">Gerenciamento de Pacientes</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm opacity-80">DATA</p>
              <p className="font-semibold">{format(currentTime, 'dd/MM/yyyy')}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">HORA</p>
              <p className="font-semibold text-xl">{format(currentTime, 'HH:mm')}</p>
            </div>
            <Button 
              variant="secondary" 
              size="icon" 
              className="rounded-full"
              onClick={refetch}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant={soundEnabled ? "secondary" : "outline"}
              size="icon" 
              className="rounded-full"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Desativar alertas sonoros' : 'Ativar alertas sonoros'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              className="rounded-full"
              onClick={() => navigate('/neoteam/doctor-view')}
              title="Visão do Médico"
            >
              <Stethoscope className="h-4 w-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              className="rounded-full"
              onClick={() => navigate('/neoteam/settings')}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Branch Tabs */}
        {branches.length > 0 && (
          <Tabs value={selectedBranch} onValueChange={setSelectedBranch}>
            <TabsList className="bg-transparent gap-2 p-0 h-auto">
              {branches.map((branch) => (
                <TabsTrigger
                  key={branch.code}
                  value={branch.code}
                  className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white px-6 py-2 rounded-md"
                >
                  {branch.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Alert for long wait times */}
        {patients.some(p => 
          differenceInMinutes(currentTime, new Date(p.arrival_time)) >= WAIT_TIME_ALERT_MINUTES &&
          ['arrived', 'waiting'].includes(p.status)
        ) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center animate-pulse">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-800">Atenção: Pacientes aguardando</p>
              <p className="text-sm text-amber-600">
                {patients.filter(p => 
                  differenceInMinutes(currentTime, new Date(p.arrival_time)) >= WAIT_TIME_ALERT_MINUTES &&
                  ['arrived', 'waiting'].includes(p.status)
                ).length} paciente(s) aguardando há mais de {WAIT_TIME_ALERT_MINUTES} minutos
              </p>
            </div>
          </div>
        )}

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
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">PACIENTE ↕</TableHead>
                    <TableHead className="text-center font-semibold">
                      HORÁRIO<br/>AGENDAMENTO ↕
                    </TableHead>
                    <TableHead className="text-center font-semibold">
                      HORÁRIO<br/>CHEGADA ↕
                    </TableHead>
                    <TableHead className="text-center font-semibold">
                      TEMPO DE<br/>ESPERA ↕
                    </TableHead>
                    <TableHead className="text-center font-semibold">TIPO ↕</TableHead>
                    <TableHead className="text-center font-semibold">TRIAGEM ↕</TableHead>
                    <TableHead className="text-center font-semibold">HUMOR ↕</TableHead>
                    <TableHead className="font-semibold">OBSERVAÇÕES</TableHead>
                    <TableHead className="text-center font-semibold">AÇÃO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        Nenhum paciente na fila de espera
                      </TableCell>
                    </TableRow>
                  ) : (
                    patients.map((patient) => (
                      <TableRow key={patient.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium py-4">
                          <div className="border rounded-md px-3 py-2 bg-background">
                            {patient.patient_name}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="border rounded-md px-3 py-2 bg-background inline-block min-w-[80px]">
                            {formatTimeOnly(patient.scheduled_time)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="border rounded-md px-3 py-2 bg-background inline-block min-w-[80px]">
                            {format(new Date(patient.arrival_time), 'HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell className={`text-center font-mono ${getWaitTimeClass(patient.arrival_time)}`}>
                          {formatWaitTime(patient.arrival_time)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={patient.type}
                            onValueChange={(value) => updateType(patient.id, value)}
                          >
                            <SelectTrigger className={`w-[120px] ${getTypeConfig(patient.type).color} border-0`}>
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
                            <SelectTrigger className={`w-[120px] ${getTriageConfig(patient.triage).color} border-0`}>
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
                            <SelectTrigger className={`w-[100px] ${getMoodConfig(patient.mood).color} border-0`}>
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
                            placeholder=""
                            defaultValue={patient.observations || ''}
                            onBlur={(e) => {
                              if (e.target.value !== patient.observations) {
                                updateObservations(patient.id, e.target.value);
                              }
                            }}
                            className="min-w-[150px]"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeletePatient(patient.id)}
                          >
                            <Trash2 className="h-5 w-5" />
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

        {/* Add New Patient Section */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-center mb-4">Adicionar Novo Paciente</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <Label>Nome do Paciente</Label>
                <Input
                  placeholder="Nome completo"
                  value={newPatient.patient_name}
                  onChange={(e) => setNewPatient({ ...newPatient, patient_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Horário Agendamento</Label>
                <Input
                  type="time"
                  value={newPatient.scheduled_time || ''}
                  onChange={(e) => setNewPatient({ ...newPatient, scheduled_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
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
                <Label>Médico (opcional)</Label>
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
      </div>

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
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
