/**
 * IPROMED - Gestão de Clientes Jurídicos
 * Controle de processos jurídicos dos clientes
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Scale,
  Users,
  Search,
  Plus,
  Filter,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Phone,
  Mail,
  Eye,
  MoreHorizontal,
  Briefcase,
  Calendar,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data for clients
const mockClients = [
  {
    id: '1',
    name: 'Dr. Ricardo Mendes',
    email: 'ricardo@clinica.com',
    phone: '(11) 99999-1234',
    avatar: null,
    status: 'active',
    totalProcesses: 3,
    activeProcesses: 2,
    contractDate: '2024-01-15',
    lastContact: '2025-01-20',
    riskLevel: 'low',
    journeyStage: 'retention',
  },
  {
    id: '2',
    name: 'Dra. Marina Silva',
    email: 'marina@clinica.com',
    phone: '(21) 98888-5678',
    avatar: null,
    status: 'active',
    totalProcesses: 1,
    activeProcesses: 1,
    contractDate: '2024-06-20',
    lastContact: '2025-01-22',
    riskLevel: 'medium',
    journeyStage: 'onboarding',
  },
  {
    id: '3',
    name: 'Dr. Paulo Andrade',
    email: 'paulo@clinicaandrade.com',
    phone: '(31) 97777-9012',
    avatar: null,
    status: 'prospect',
    totalProcesses: 0,
    activeProcesses: 0,
    contractDate: null,
    lastContact: '2025-01-18',
    riskLevel: 'high',
    journeyStage: 'prospect',
  },
  {
    id: '4',
    name: 'Dra. Camila Torres',
    email: 'camila@torres.med.br',
    phone: '(41) 96666-3456',
    avatar: null,
    status: 'active',
    totalProcesses: 5,
    activeProcesses: 3,
    contractDate: '2023-08-10',
    lastContact: '2025-01-25',
    riskLevel: 'high',
    journeyStage: 'expansion',
  },
  {
    id: '5',
    name: 'Dr. Fernando Lima',
    email: 'fernando.lima@email.com',
    phone: '(51) 95555-7890',
    avatar: null,
    status: 'churned',
    totalProcesses: 2,
    activeProcesses: 0,
    contractDate: '2023-03-01',
    lastContact: '2024-12-15',
    riskLevel: 'low',
    journeyStage: 'churned',
  },
];

const statusConfig = {
  active: { label: 'Ativo', color: 'bg-emerald-500', textColor: 'text-emerald-700' },
  prospect: { label: 'Prospecto', color: 'bg-blue-500', textColor: 'text-blue-700' },
  churned: { label: 'Cancelado', color: 'bg-gray-500', textColor: 'text-gray-700' },
};

const riskConfig = {
  low: { label: 'Baixo', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  medium: { label: 'Médio', color: 'bg-amber-100 text-amber-700', icon: Clock },
  high: { label: 'Alto', color: 'bg-rose-100 text-rose-700', icon: AlertTriangle },
};

const journeyConfig = {
  prospect: { label: 'Prospecto', color: 'bg-blue-100 text-blue-700' },
  onboarding: { label: 'Onboarding', color: 'bg-purple-100 text-purple-700' },
  retention: { label: 'Retenção', color: 'bg-emerald-100 text-emerald-700' },
  expansion: { label: 'Expansão', color: 'bg-amber-100 text-amber-700' },
  churned: { label: 'Cancelado', color: 'bg-gray-100 text-gray-700' },
};

export default function IpromedClients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [journeyFilter, setJourneyFilter] = useState<string>('all');

  const filteredClients = mockClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesJourney = journeyFilter === 'all' || client.journeyStage === journeyFilter;
    return matchesSearch && matchesStatus && matchesJourney;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const stats = {
    total: mockClients.length,
    active: mockClients.filter(c => c.status === 'active').length,
    prospects: mockClients.filter(c => c.status === 'prospect').length,
    activeProcesses: mockClients.reduce((sum, c) => sum + c.activeProcesses, 0),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/ipromed')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          IPROMED
        </Button>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-medium">Clientes</span>
        </div>
      </div>

      {/* Title and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Clientes</h1>
          <p className="text-muted-foreground">Controle de clientes e processos jurídicos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/ipromed/journey')}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Jornada do Cliente
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prospectos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.prospects}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processos Ativos</p>
                <p className="text-2xl font-bold text-amber-600">{stats.activeProcesses}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Scale className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="prospect">Prospectos</SelectItem>
                <SelectItem value="churned">Cancelados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={journeyFilter} onValueChange={setJourneyFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Jornada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Etapas</SelectItem>
                <SelectItem value="prospect">Prospecto</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="retention">Retenção</SelectItem>
                <SelectItem value="expansion">Expansão</SelectItem>
                <SelectItem value="churned">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes ({filteredClients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jornada</TableHead>
                <TableHead className="text-center">Processos</TableHead>
                <TableHead>Risco</TableHead>
                <TableHead>Último Contato</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => {
                const status = statusConfig[client.status as keyof typeof statusConfig];
                const risk = riskConfig[client.riskLevel as keyof typeof riskConfig];
                const journey = journeyConfig[client.journeyStage as keyof typeof journeyConfig];
                const RiskIcon = risk.icon;

                return (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={client.avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-xs text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${status.color} text-white`}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={journey.color}>
                        {journey.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold">{client.activeProcesses}</span>
                        <span className="text-xs text-muted-foreground">de {client.totalProcesses}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={risk.color}>
                        <RiskIcon className="h-3 w-3 mr-1" />
                        {risk.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(client.lastContact).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/ipromed/clients/${client.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="h-4 w-4 mr-2" />
                            Ligar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Processos
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
