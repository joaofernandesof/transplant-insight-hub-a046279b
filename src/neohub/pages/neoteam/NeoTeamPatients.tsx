import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, Search, Plus, Filter, MoreVertical,
  Phone, Mail, Calendar, FileText, Eye, Edit,
  Download, Upload
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  gender: 'M' | 'F' | 'O';
  lastVisit?: string;
  nextAppointment?: string;
  totalVisits: number;
  status: 'active' | 'inactive' | 'pending';
  tags: string[];
}

export default function NeoTeamPatients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [view, setView] = useState<'table' | 'cards'>('table');

  // Mock data
  const patients: Patient[] = [
    {
      id: '1', name: 'Maria Silva', email: 'maria@email.com', phone: '(11) 99999-1234',
      cpf: '123.456.789-00', birthDate: '1985-05-15', gender: 'F',
      lastVisit: '2024-01-15', nextAppointment: '2024-01-22', totalVisits: 8,
      status: 'active', tags: ['Transplante', 'VIP']
    },
    {
      id: '2', name: 'João Santos', email: 'joao@email.com', phone: '(11) 99999-5678',
      cpf: '987.654.321-00', birthDate: '1978-08-22', gender: 'M',
      lastVisit: '2024-01-10', totalVisits: 3,
      status: 'active', tags: ['Avaliação']
    },
    {
      id: '3', name: 'Ana Costa', email: 'ana@email.com', phone: '(11) 99999-9012',
      cpf: '456.789.123-00', birthDate: '1990-12-03', gender: 'F',
      lastVisit: '2023-12-20', nextAppointment: '2024-01-25', totalVisits: 12,
      status: 'active', tags: ['Transplante', 'Retorno']
    },
    {
      id: '4', name: 'Pedro Lima', email: 'pedro@email.com', phone: '(11) 99999-3456',
      cpf: '789.123.456-00', birthDate: '1982-03-18', gender: 'M',
      lastVisit: '2023-11-05', totalVisits: 2,
      status: 'inactive', tags: []
    },
    {
      id: '5', name: 'Carla Souza', email: 'carla@email.com', phone: '(11) 99999-7890',
      cpf: '321.654.987-00', birthDate: '1995-07-30', gender: 'F',
      lastVisit: '2024-01-18', nextAppointment: '2024-02-01', totalVisits: 5,
      status: 'active', tags: ['Primeira Consulta']
    },
  ];

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm) ||
    p.cpf.includes(searchTerm)
  );

  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === 'active').length,
    withAppointment: patients.filter(p => p.nextAppointment).length,
    newThisMonth: 12,
  };

  const getStatusBadge = (status: Patient['status']) => {
    const config = {
      active: { label: 'Ativo', variant: 'default' as const },
      inactive: { label: 'Inativo', variant: 'secondary' as const },
      pending: { label: 'Pendente', variant: 'outline' as const },
    };
    return config[status];
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            Pacientes
          </h1>
          <p className="text-muted-foreground">Gerencie o cadastro de pacientes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total de Pacientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-sm text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-blue-600">{stats.withAppointment}</p>
            <p className="text-sm text-muted-foreground">Com Agendamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-purple-600">{stats.newThisMonth}</p>
            <p className="text-sm text-muted-foreground">Novos este Mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, telefone ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Última Visita</TableHead>
                <TableHead>Próximo Agendamento</TableHead>
                <TableHead>Consultas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">{patient.cpf}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {patient.phone}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {patient.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatDate(patient.lastVisit)}</span>
                  </TableCell>
                  <TableCell>
                    {patient.nextAppointment ? (
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(patient.nextAppointment)}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{patient.totalVisits}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(patient.status).variant}>
                      {getStatusBadge(patient.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="h-4 w-4 mr-2" />
                          Prontuário
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="h-4 w-4 mr-2" />
                          Agendar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Phone className="h-4 w-4 mr-2" />
                          Ligar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
