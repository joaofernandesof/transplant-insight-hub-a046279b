import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, Search, Plus, Clock, User,
  Calendar, Stethoscope, Pill, Camera,
  Paperclip, ChevronRight, History, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';

interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  type: 'consultation' | 'procedure' | 'exam' | 'return';
  doctor: string;
  diagnosis?: string;
  notes: string;
  prescriptions: string[];
  attachments: string[];
}

interface Patient {
  id: string;
  name: string;
  birthDate: string;
  phone: string;
  allergies: string[];
  conditions: string[];
}

export default function NeoTeamMedicalRecords() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Mock data
  const patients: Patient[] = [
    { 
      id: '1', name: 'Maria Silva', birthDate: '1985-05-15', phone: '(11) 99999-1234',
      allergies: ['Dipirona', 'Penicilina'], conditions: ['Hipertensão']
    },
    { 
      id: '2', name: 'João Santos', birthDate: '1978-08-22', phone: '(11) 99999-5678',
      allergies: [], conditions: ['Diabetes Tipo 2']
    },
    { 
      id: '3', name: 'Ana Costa', birthDate: '1990-12-03', phone: '(11) 99999-9012',
      allergies: ['Ibuprofeno'], conditions: []
    },
  ];

  const records: MedicalRecord[] = [
    {
      id: '1', patientId: '1', patientName: 'Maria Silva',
      date: '2024-01-15', type: 'consultation', doctor: 'Dr. Ricardo Mendes',
      diagnosis: 'Alopecia androgenética grau III',
      notes: 'Paciente apresenta queda de cabelo há 3 anos com progressão lenta...',
      prescriptions: ['Minoxidil 5% - aplicar 2x ao dia', 'Finasterida 1mg - 1x ao dia'],
      attachments: ['exame_tricoscopia.pdf']
    },
    {
      id: '2', patientId: '1', patientName: 'Maria Silva',
      date: '2024-01-08', type: 'procedure', doctor: 'Dr. Ricardo Mendes',
      notes: 'Realizado procedimento de microagulhamento capilar. Área tratada: região frontal e vertex.',
      prescriptions: [],
      attachments: ['foto_antes.jpg', 'foto_depois.jpg']
    },
    {
      id: '3', patientId: '1', patientName: 'Maria Silva',
      date: '2023-12-20', type: 'exam', doctor: 'Dra. Paula Lima',
      notes: 'Tricoscopia realizada. Observado miniaturização folicular moderada.',
      prescriptions: [],
      attachments: ['tricoscopia_resultado.pdf']
    },
  ];

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const patientRecords = selectedPatient 
    ? records.filter(r => r.patientId === selectedPatient.id)
    : [];

  const typeConfig = {
    consultation: { label: 'Consulta', color: 'bg-blue-100 text-blue-600' },
    procedure: { label: 'Procedimento', color: 'bg-purple-100 text-purple-600' },
    exam: { label: 'Exame', color: 'bg-green-100 text-green-600' },
    return: { label: 'Retorno', color: 'bg-amber-100 text-amber-600' },
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <NeoTeamBreadcrumb />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-500" />
            Prontuários
          </h1>
          <p className="text-muted-foreground">Histórico médico dos pacientes</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Entrada
        </Button>
      </div>

      <div className="grid lg:grid-cols-[350px,1fr] gap-6">
        {/* Patient List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pacientes</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className={`p-4 border-b cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedPatient?.id === patient.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{patient.name}</p>
                      <p className="text-xs text-muted-foreground">{patient.phone}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Patient Details & Records */}
        {selectedPatient ? (
          <div className="space-y-6">
            {/* Patient Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-xl bg-primary/10 text-primary">
                        {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold">{selectedPatient.name}</h2>
                      <p className="text-muted-foreground">
                        {format(new Date(selectedPatient.birthDate), "dd/MM/yyyy")} • {selectedPatient.phone}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <History className="h-4 w-4" />
                    Histórico Completo
                  </Button>
                </div>

                {/* Alerts */}
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  {selectedPatient.allergies.length > 0 && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                      <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Alergias
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {selectedPatient.allergies.join(', ')}
                      </p>
                    </div>
                  )}
                  {selectedPatient.conditions.length > 0 && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        Condições
                      </p>
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                        {selectedPatient.conditions.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Records */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico de Atendimentos</CardTitle>
                <CardDescription>{patientRecords.length} registros encontrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patientRecords.map((record) => (
                    <div key={record.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {format(new Date(record.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </p>
                              <Badge className={typeConfig[record.type].color}>
                                {typeConfig[record.type].label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {record.doctor}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Ver Detalhes
                        </Button>
                      </div>

                      {record.diagnosis && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Diagnóstico</p>
                          <p className="text-sm">{record.diagnosis}</p>
                        </div>
                      )}

                      <p className="text-sm text-muted-foreground line-clamp-2">{record.notes}</p>

                      {record.prescriptions.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <Pill className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {record.prescriptions.length} prescrição(ões)
                          </span>
                        </div>
                      )}

                      {record.attachments.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {record.attachments.length} anexo(s)
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">Selecione um paciente</p>
              <p className="text-muted-foreground">
                Escolha um paciente na lista para visualizar o prontuário
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
