/**
 * IPROMED - Gestão de Clientes Jurídicos
 * Controle de processos jurídicos dos clientes (conectado ao banco de dados)
 */

import { useState, useEffect } from "react";
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
  FileSignature,
  DollarSign,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import DeadlineAlerts from "./components/DeadlineAlerts";

interface LegalClient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  client_type: string;
  status: string;
  risk_level: string;
  journey_stage: string;
  health_score: number | null;
  notes: string | null;
  metadata: {
    payment_status?: string;
    payment_amount?: number;
    payment_date?: string;
    contract_status?: string;
    partner?: string;
  } | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; textColor: string }> = {
  active: { label: 'Ativo', color: 'bg-emerald-500', textColor: 'text-emerald-700' },
  prospect: { label: 'Prospecto', color: 'bg-blue-500', textColor: 'text-blue-700' },
  churned: { label: 'Cancelado', color: 'bg-gray-500', textColor: 'text-gray-700' },
};

const riskConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  low: { label: 'Baixo', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle },
  medium: { label: 'Médio', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: Clock },
  high: { label: 'Alto', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300', icon: AlertTriangle },
};

const journeyConfig: Record<string, { label: string; color: string }> = {
  prospect: { label: 'Prospecto', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  onboarding: { label: 'Onboarding', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  retention: { label: 'Retenção', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  expansion: { label: 'Expansão', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  churned: { label: 'Cancelado', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' },
};

const paymentStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  paid: { label: 'Pago', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
};

const contractStatusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700' },
  pending_signature: { label: 'Aguardando Assinatura', color: 'bg-amber-100 text-amber-700' },
  signed: { label: 'Assinado', color: 'bg-emerald-100 text-emerald-700' },
};

export default function IpromedClients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [journeyFilter, setJourneyFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Fetch clients from database
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['ipromed-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_legal_clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LegalClient[];
    },
  });

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesJourney = journeyFilter === 'all' || client.journey_stage === journeyFilter;
    const matchesPayment = paymentFilter === 'all' || client.metadata?.payment_status === paymentFilter;
    return matchesSearch && matchesStatus && matchesJourney && matchesPayment;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    prospects: clients.filter(c => c.status === 'prospect').length,
    paid: clients.filter(c => c.metadata?.payment_status === 'paid').length,
    pendingSignature: clients.filter(c => c.metadata?.contract_status === 'pending_signature').length,
  };

  // Prepare data for deadline alerts
  const clientsForAlerts = clients.map(c => ({
    id: c.id,
    name: c.name,
    startDate: c.created_at,
    currentStep: c.journey_stage === 'onboarding' ? 2 : c.journey_stage === 'prospect' ? 0 : 8,
  }));

  if (error) {
    toast.error("Erro ao carregar clientes");
  }

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
          <h1 className="text-2xl font-bold">Gestão de Clientes IPROMED</h1>
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
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
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagos</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aguardando Assinatura</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pendingSignature}</p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <FileSignature className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Table */}
        <div className="lg:col-span-2 space-y-4">
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
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="prospect">Prospectos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="paid">Pagos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
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
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Contrato</TableHead>
                      <TableHead>Risco</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => {
                      const status = statusConfig[client.status] || statusConfig.prospect;
                      const risk = riskConfig[client.risk_level] || riskConfig.low;
                      const RiskIcon = risk.icon;
                      const paymentStatus = paymentStatusConfig[client.metadata?.payment_status || 'pending'];
                      const PaymentIcon = paymentStatus?.icon || Clock;
                      const contractStatus = contractStatusConfig[client.metadata?.contract_status || 'draft'];

                      return (
                        <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(client.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{client.name}</p>
                                <div className="flex items-center gap-2">
                                  <Badge className={`${status.color} text-white text-xs`}>
                                    {status.label}
                                  </Badge>
                                  {client.metadata?.partner && (
                                    <Badge variant="outline" className="text-xs">
                                      Sócio
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={paymentStatus?.color || 'bg-gray-100 text-gray-700'}>
                              <PaymentIcon className="h-3 w-3 mr-1" />
                              {paymentStatus?.label || 'Pendente'}
                            </Badge>
                            {client.metadata?.payment_amount && (
                              <p className="text-xs text-muted-foreground mt-1">
                                R$ {client.metadata.payment_amount.toLocaleString('pt-BR')}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={contractStatus?.color || ''}>
                              {contractStatus?.label || 'Rascunho'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={risk.color}>
                              <RiskIcon className="h-3 w-3 mr-1" />
                              {risk.label}
                            </Badge>
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
                                  <FileSignature className="h-4 w-4 mr-2" />
                                  Enviar Contrato
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Enviar Email
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Deadline Alerts */}
        <div className="space-y-4">
          <DeadlineAlerts 
            clients={clientsForAlerts}
            onClientClick={(id) => navigate(`/ipromed/clients/${id}`)}
          />
        </div>
      </div>
    </div>
  );
}
