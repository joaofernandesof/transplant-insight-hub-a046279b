/**
 * CPG Advocacia Médica - Gestão de Clientes Jurídicos
 * Controle de processos jurídicos dos clientes (conectado ao banco de dados)
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
  Users,
  Search,
  Plus,
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
  ArrowUpDown,
  Building2,
  UserCheck,
  Shield,
  Filter,
  MapPin,
  Hash,
  FileCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClientFormModal } from "./components/ClientFormModal";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LegalClient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf_cnpj: string | null;
  client_number: string | null;
  client_type: string;
  status: string;
  risk_level: string;
  journey_stage: string;
  health_score: number | null;
  notes: string | null;
  onboarding_completed: boolean | null;
  address: {
    city?: string;
    state?: string;
    street?: string;
    cep?: string;
  } | null;
  metadata: {
    payment_status?: string;
    payment_amount?: number;
    payment_date?: string;
    contract_status?: string;
    partner?: string;
    specialty?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; color: string; textColor: string }> = {
  active: { label: 'Ativo', color: 'bg-emerald-500', textColor: 'text-emerald-700' },
  prospect: { label: 'Prospecto', color: 'bg-blue-500', textColor: 'text-blue-700' },
  churned: { label: 'Cancelado', color: 'bg-gray-500', textColor: 'text-gray-700' },
};

const riskConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  low: { label: 'Baixo', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: Shield },
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
  pending_signature: { label: 'Aguard. Assinatura', color: 'bg-amber-100 text-amber-700' },
  signed: { label: 'Assinado', color: 'bg-emerald-100 text-emerald-700' },
};

type SortField = 'name' | 'created_at' | 'status' | 'risk_level' | 'journey_stage';
type SortOrder = 'asc' | 'desc';

export default function IpromedClients() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [journeyFilter, setJourneyFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [onboardingFilter, setOnboardingFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<LegalClient | undefined>(undefined);

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

  // Filter and sort clients
  const filteredClients = clients
    .filter(client => {
      const matchesSearch = 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (client.phone?.includes(searchTerm) ?? false) ||
        (client.cpf_cnpj?.includes(searchTerm) ?? false) ||
        (client.client_number?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      const matchesJourney = journeyFilter === 'all' || client.journey_stage === journeyFilter;
      const matchesPayment = paymentFilter === 'all' || client.metadata?.payment_status === paymentFilter;
      const matchesRisk = riskFilter === 'all' || client.risk_level === riskFilter;
      const matchesOnboarding = onboardingFilter === 'all' || 
        (onboardingFilter === 'completed' && client.onboarding_completed) ||
        (onboardingFilter === 'pending' && !client.onboarding_completed);
      return matchesSearch && matchesStatus && matchesJourney && matchesPayment && matchesRisk && matchesOnboarding;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'risk_level':
          const riskOrder = { high: 3, medium: 2, low: 1 };
          comparison = (riskOrder[a.risk_level as keyof typeof riskOrder] || 0) - (riskOrder[b.risk_level as keyof typeof riskOrder] || 0);
          break;
        case 'journey_stage':
          comparison = a.journey_stage.localeCompare(b.journey_stage);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    prospects: clients.filter(c => c.status === 'prospect').length,
    paid: clients.filter(c => c.metadata?.payment_status === 'paid').length,
    pendingSignature: clients.filter(c => c.metadata?.contract_status === 'pending_signature').length,
    onboardingCompleted: clients.filter(c => c.onboarding_completed).length,
  };

  const activeFiltersCount = [statusFilter, journeyFilter, paymentFilter, riskFilter, onboardingFilter]
    .filter(f => f !== 'all').length;

  const clearFilters = () => {
    setStatusFilter('all');
    setJourneyFilter('all');
    setPaymentFilter('all');
    setRiskFilter('all');
    setOnboardingFilter('all');
  };

  if (error) {
    toast.error("Erro ao carregar clientes");
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/ipromed')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">IPROMED</span>
          </Button>
          <span className="text-muted-foreground hidden sm:inline">/</span>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm sm:text-base">Clientes</span>
          </div>
        </div>

        {/* Title and Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Clientes</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Gestão completa de clientes e processos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/ipromed/journey')}>
              <TrendingUp className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Jornada</span>
            </Button>
            <Button size="sm" onClick={() => { setEditingClient(undefined); setIsFormOpen(true); }}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Novo Cliente</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('all')}>
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Total</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-xl">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('active')}>
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Ativos</p>
                  <p className="text-lg sm:text-2xl font-bold text-emerald-600">{stats.active}</p>
                </div>
                <div className="p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg sm:rounded-xl">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('prospect')}>
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Prospectos</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.prospects}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-xl">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setPaymentFilter('paid')}>
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Pagos</p>
                  <p className="text-lg sm:text-2xl font-bold text-emerald-600">{stats.paid}</p>
                </div>
                <div className="p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg sm:rounded-xl">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setOnboardingFilter('completed')}>
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Onboarding OK</p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-600">{stats.onboardingCompleted}</p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg sm:rounded-xl">
                  <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setPaymentFilter('pending')}>
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Aguard. Assinatura</p>
                  <p className="text-lg sm:text-2xl font-bold text-amber-600">{stats.pendingSignature}</p>
                </div>
                <div className="p-2 sm:p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg sm:rounded-xl">
                  <FileSignature className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col gap-4">
              {/* Search and Filters Row */}
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email, telefone, CPF/CNPJ ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="prospect">Prospectos</SelectItem>
                    <SelectItem value="churned">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={journeyFilter} onValueChange={setJourneyFilter}>
                  <SelectTrigger className="w-full lg:w-[140px]">
                    <SelectValue placeholder="Jornada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toda Jornada</SelectItem>
                    <SelectItem value="prospect">Prospecto</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="retention">Retenção</SelectItem>
                    <SelectItem value="expansion">Expansão</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-full lg:w-[140px]">
                    <SelectValue placeholder="Pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo Pagamento</SelectItem>
                    <SelectItem value="paid">Pagos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="w-full lg:w-[130px]">
                    <SelectValue placeholder="Risco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo Risco</SelectItem>
                    <SelectItem value="low">Baixo</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={onboardingFilter} onValueChange={setOnboardingFilter}>
                  <SelectTrigger className="w-full lg:w-[150px]">
                    <SelectValue placeholder="Onboarding" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo Onboarding</SelectItem>
                    <SelectItem value="completed">Completo</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters and Sort Info */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Filter className="h-3 w-3" />
                    {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} ativo{activeFiltersCount > 1 ? 's' : ''}
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Clients Table - Full Width */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Clientes ({filteredClients.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Ordenar:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5">
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      {sortField === 'name' && 'Nome'}
                      {sortField === 'created_at' && 'Data'}
                      {sortField === 'status' && 'Status'}
                      {sortField === 'risk_level' && 'Risco'}
                      {sortField === 'journey_stage' && 'Jornada'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toggleSort('name')}>
                      Nome {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('created_at')}>
                      Data de Cadastro {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('status')}>
                      Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('risk_level')}>
                      Nível de Risco {sortField === 'risk_level' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('journey_stage')}>
                      Etapa da Jornada {sortField === 'journey_stage' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum cliente encontrado</h3>
                <p className="text-muted-foreground text-sm">
                  {searchTerm || activeFiltersCount > 0
                    ? "Tente ajustar os filtros de busca"
                    : "Cadastre seu primeiro cliente"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[250px]">Cliente</TableHead>
                      <TableHead className="min-w-[100px]">Código</TableHead>
                      <TableHead className="min-w-[140px]">Contato</TableHead>
                      <TableHead className="min-w-[120px]">Jornada</TableHead>
                      <TableHead className="min-w-[100px]">Pagamento</TableHead>
                      <TableHead className="min-w-[110px]">Contrato</TableHead>
                      <TableHead className="min-w-[90px]">Risco</TableHead>
                      <TableHead className="min-w-[100px]">Cadastro</TableHead>
                      <TableHead className="text-right min-w-[80px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => {
                      const status = statusConfig[client.status] || statusConfig.prospect;
                      const risk = riskConfig[client.risk_level] || riskConfig.low;
                      const RiskIcon = risk.icon;
                      const journey = journeyConfig[client.journey_stage] || journeyConfig.prospect;
                      const paymentStatus = paymentStatusConfig[client.metadata?.payment_status || 'pending'];
                      const PaymentIcon = paymentStatus?.icon || Clock;
                      const contractStatus = contractStatusConfig[client.metadata?.contract_status || 'draft'];
                      const location = client.address?.city && client.address?.state 
                        ? `${client.address.city}/${client.address.state}` 
                        : null;

                      return (
                        <TableRow 
                          key={client.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/ipromed/clients/${client.id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                  {getInitials(client.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate max-w-[180px]">{client.name}</p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge className={cn(status.color, "text-white text-[10px] px-1.5 py-0")}>
                                    {status.label}
                                  </Badge>
                                  {client.metadata?.partner && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                      Sócio
                                    </Badge>
                                  )}
                                  {client.onboarding_completed && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <FileCheck className="h-3.5 w-3.5 text-purple-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>Onboarding Completo</TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-mono text-muted-foreground">
                              {client.client_number || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {client.phone && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span className="truncate max-w-[100px]">{client.phone}</span>
                                </div>
                              )}
                              {client.email && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate max-w-[100px]">{client.email}</span>
                                </div>
                              )}
                              {location && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>{location}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(journey.color, "text-xs")}>
                              {journey.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge className={cn(paymentStatus?.color || 'bg-gray-100 text-gray-700', "text-xs")}>
                                <PaymentIcon className="h-3 w-3 mr-1" />
                                {paymentStatus?.label || 'Pendente'}
                              </Badge>
                              {client.metadata?.payment_amount && (
                                <p className="text-[10px] text-muted-foreground">
                                  R$ {client.metadata.payment_amount.toLocaleString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(contractStatus?.color || '', "text-xs")}>
                              {contractStatus?.label || 'Rascunho'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(risk.color, "text-xs")}>
                              <RiskIcon className="h-3 w-3 mr-1" />
                              {risk.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(client.created_at), "dd/MM/yy", { locale: ptBR })}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {format(new Date(client.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { 
                                  e.stopPropagation(); 
                                  navigate(`/ipromed/clients/${client.id}`);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  if (client.phone) {
                                    const phoneClean = client.phone.replace(/\D/g, '');
                                    window.open(`https://wa.me/${phoneClean}`, '_blank');
                                  } else {
                                    toast.error("Cliente sem telefone cadastrado");
                                  }
                                }}>
                                  <Phone className="h-4 w-4 mr-2" />
                                  WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  if (client.email) {
                                    window.location.href = `mailto:${client.email}`;
                                  } else {
                                    toast.error("Cliente sem email cadastrado");
                                  }
                                }}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Enviar Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/ipromed/contracts?clientId=${client.id}`);
                                }}>
                                  <FileSignature className="h-4 w-4 mr-2" />
                                  Ver Contratos
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Cadastro/Edição */}
        <ClientFormModal
          open={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditingClient(undefined); }}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['ipromed-clients'] })}
          client={editingClient}
        />
      </div>
    </TooltipProvider>
  );
}
