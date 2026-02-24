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
  Trash2,
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

type SortField = 'name' | 'created_at' | 'status' | 'risk_level' | 'journey_stage' | 'client_number' | 'phone' | 'email' | 'payment_status' | 'contract_status';
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
  const [contractFilter, setContractFilter] = useState<string>('all');
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
        (client.client_number?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (client.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (client.address?.state?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      const matchesJourney = journeyFilter === 'all' || client.journey_stage === journeyFilter;
      const matchesPayment = paymentFilter === 'all' || client.metadata?.payment_status === paymentFilter;
      const matchesRisk = riskFilter === 'all' || client.risk_level === riskFilter;
      const matchesContract = contractFilter === 'all' || client.metadata?.contract_status === contractFilter;
      const matchesOnboarding = onboardingFilter === 'all' || 
        (onboardingFilter === 'completed' && client.onboarding_completed) ||
        (onboardingFilter === 'pending' && !client.onboarding_completed);
      return matchesSearch && matchesStatus && matchesJourney && matchesPayment && matchesRisk && matchesContract && matchesOnboarding;
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
        case 'client_number':
          comparison = (a.client_number || '').localeCompare(b.client_number || '');
          break;
        case 'phone':
          comparison = (a.phone || '').localeCompare(b.phone || '');
          break;
        case 'email':
          comparison = (a.email || '').localeCompare(b.email || '');
          break;
        case 'payment_status':
          comparison = (a.metadata?.payment_status || '').localeCompare(b.metadata?.payment_status || '');
          break;
        case 'contract_status':
          comparison = (a.metadata?.contract_status || '').localeCompare(b.metadata?.contract_status || '');
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

  const activeFiltersCount = [statusFilter, journeyFilter, paymentFilter, riskFilter, onboardingFilter, contractFilter]
    .filter(f => f !== 'all').length;

  const clearFilters = () => {
    setStatusFilter('all');
    setJourneyFilter('all');
    setPaymentFilter('all');
    setRiskFilter('all');
    setOnboardingFilter('all');
    setContractFilter('all');
  };

  if (error) {
    toast.error("Erro ao carregar clientes");
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-6 max-w-full">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Voltar</span>
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
            <Button variant="outline" size="sm" onClick={() => navigate('/cpg/journey')}>
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

        {/* Search Only */}
        <Card>
          <CardContent className="py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, telefone, CPF/CNPJ ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 max-w-lg"
              />
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
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
                  <Filter className="h-3 w-3 mr-1" />
                  Limpar {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="w-full">
                <Table className="w-full table-fixed">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {/* Nome - 18% */}
                      <TableHead className="w-[18%]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 -ml-3 font-medium hover:bg-muted gap-1">
                              Nome
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-background">
                            <DropdownMenuItem onClick={() => { setSortField('name'); setSortOrder('asc'); }}>
                              A → Z {sortField === 'name' && sortOrder === 'asc' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSortField('name'); setSortOrder('desc'); }}>
                              Z → A {sortField === 'name' && sortOrder === 'desc' && '✓'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>

                      {/* Status - 7% */}
                      <TableHead className="w-[7%]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className={cn(
                              "h-8 -ml-3 font-medium hover:bg-muted gap-1",
                              statusFilter !== 'all' && "text-primary"
                            )}>
                              Status
                              <Filter className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-background">
                            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                              Todos {statusFilter === 'all' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                              Ativos {statusFilter === 'active' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('prospect')}>
                              Prospectos {statusFilter === 'prospect' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('churned')}>
                              Cancelados {statusFilter === 'churned' && '✓'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>

                      {/* Código - 9% */}
                      <TableHead className="w-[9%]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 -ml-3 font-medium hover:bg-muted gap-1">
                              Código
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-background">
                            <DropdownMenuItem onClick={() => { setSortField('client_number'); setSortOrder('asc'); }}>
                              A → Z {sortField === 'client_number' && sortOrder === 'asc' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSortField('client_number'); setSortOrder('desc'); }}>
                              Z → A {sortField === 'client_number' && sortOrder === 'desc' && '✓'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>

                      {/* Telefone - 10% */}
                      <TableHead className="w-[10%]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 -ml-3 font-medium hover:bg-muted gap-1">
                              Telefone
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-background">
                            <DropdownMenuItem onClick={() => { setSortField('phone'); setSortOrder('asc'); }}>
                              A → Z {sortField === 'phone' && sortOrder === 'asc' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSortField('phone'); setSortOrder('desc'); }}>
                              Z → A {sortField === 'phone' && sortOrder === 'desc' && '✓'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>

                      {/* Email - 14% */}
                      <TableHead className="w-[14%]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 -ml-3 font-medium hover:bg-muted gap-1">
                              Email
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-background">
                            <DropdownMenuItem onClick={() => { setSortField('email'); setSortOrder('asc'); }}>
                              A → Z {sortField === 'email' && sortOrder === 'asc' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSortField('email'); setSortOrder('desc'); }}>
                              Z → A {sortField === 'email' && sortOrder === 'desc' && '✓'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>

                      {/* Jornada - 8% */}
                      <TableHead className="w-[8%]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className={cn(
                              "h-8 -ml-3 font-medium hover:bg-muted gap-1",
                              journeyFilter !== 'all' && "text-primary"
                            )}>
                              Jornada
                              <Filter className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-background">
                            <DropdownMenuItem onClick={() => setJourneyFilter('all')}>
                              Todos {journeyFilter === 'all' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setJourneyFilter('prospect')}>
                              Prospecto {journeyFilter === 'prospect' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setJourneyFilter('onboarding')}>
                              Onboarding {journeyFilter === 'onboarding' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setJourneyFilter('retention')}>
                              Retenção {journeyFilter === 'retention' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setJourneyFilter('expansion')}>
                              Expansão {journeyFilter === 'expansion' && '✓'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>

                      {/* Pagamento - 8% */}
                      <TableHead className="w-[8%]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className={cn(
                              "h-8 -ml-3 font-medium hover:bg-muted gap-1",
                              paymentFilter !== 'all' && "text-primary"
                            )}>
                              Pagamento
                              <Filter className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-background">
                            <DropdownMenuItem onClick={() => setPaymentFilter('all')}>
                              Todos {paymentFilter === 'all' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setPaymentFilter('paid')}>
                              Pagos {paymentFilter === 'paid' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPaymentFilter('pending')}>
                              Pendentes {paymentFilter === 'pending' && '✓'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>

                      {/* Contrato - 8% */}
                      <TableHead className="w-[8%]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className={cn(
                              "h-8 -ml-3 font-medium hover:bg-muted gap-1",
                              contractFilter !== 'all' && "text-primary"
                            )}>
                              Contrato
                              <Filter className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-background">
                            <DropdownMenuItem onClick={() => setContractFilter('all')}>
                              Todos {contractFilter === 'all' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setContractFilter('draft')}>
                              Rascunho {contractFilter === 'draft' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setContractFilter('pending_signature')}>
                              Aguard. Assinatura {contractFilter === 'pending_signature' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setContractFilter('signed')}>
                              Assinado {contractFilter === 'signed' && '✓'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>

                      {/* Risco - 6% */}
                      <TableHead className="w-[6%]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className={cn(
                              "h-8 -ml-3 font-medium hover:bg-muted gap-1",
                              riskFilter !== 'all' && "text-primary"
                            )}>
                              Risco
                              <Filter className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-background">
                            <DropdownMenuItem onClick={() => setRiskFilter('all')}>
                              Todos {riskFilter === 'all' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setRiskFilter('low')}>
                              Baixo {riskFilter === 'low' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRiskFilter('medium')}>
                              Médio {riskFilter === 'medium' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRiskFilter('high')}>
                              Alto {riskFilter === 'high' && '✓'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>

                      {/* Cadastro - 6% */}
                      <TableHead className="w-[6%]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 -ml-3 font-medium hover:bg-muted gap-1">
                              Cada
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-background">
                            <DropdownMenuItem onClick={() => { setSortField('created_at'); setSortOrder('desc'); }}>
                              Mais recente {sortField === 'created_at' && sortOrder === 'desc' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSortField('created_at'); setSortOrder('asc'); }}>
                              Mais antigo {sortField === 'created_at' && sortOrder === 'asc' && '✓'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>

                      {/* Ações - 4% */}
                      <TableHead className="text-right w-[4%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center py-4">
                            <Users className="h-10 w-10 text-muted-foreground mb-3" />
                            <h3 className="text-base font-medium mb-1">Nenhum cliente encontrado</h3>
                            <p className="text-muted-foreground text-sm">
                              {searchTerm || activeFiltersCount > 0
                                ? "Tente ajustar os filtros de busca"
                                : "Cadastre seu primeiro cliente"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClients.map((client) => {
                        const status = statusConfig[client.status] || statusConfig.prospect;
                        const risk = riskConfig[client.risk_level] || riskConfig.low;
                        const RiskIcon = risk.icon;
                        const journey = journeyConfig[client.journey_stage] || journeyConfig.prospect;
                        const paymentStatus = paymentStatusConfig[client.metadata?.payment_status || 'pending'];
                        const PaymentIcon = paymentStatus?.icon || Clock;
                        const contractStatus = contractStatusConfig[client.metadata?.contract_status || 'draft'];

                        return (
                          <TableRow 
                            key={client.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/ipromed/clients/${client.id}`)}
                          >
                          {/* Nome */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                  {getInitials(client.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm truncate max-w-[150px]">{client.name}</span>
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge className={cn(status.color, "text-white text-xs")}>
                              {status.label}
                            </Badge>
                          </TableCell>

                          {/* Código */}
                          <TableCell>
                            <span className="text-xs font-mono text-muted-foreground">
                              {client.client_number || '-'}
                            </span>
                          </TableCell>

                          {/* Telefone */}
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {client.phone || '-'}
                            </span>
                          </TableCell>

                          {/* Email */}
                          <TableCell>
                            <span className="text-sm text-muted-foreground truncate max-w-[160px] block">
                              {client.email || '-'}
                            </span>
                          </TableCell>

                          {/* Jornada */}
                          <TableCell>
                            <Badge variant="outline" className={cn(journey.color, "text-xs")}>
                              {journey.label}
                            </Badge>
                          </TableCell>

                          {/* Pagamento */}
                          <TableCell>
                            <Badge className={cn(paymentStatus?.color || 'bg-gray-100 text-gray-700', "text-xs")}>
                              <PaymentIcon className="h-3 w-3 mr-1" />
                              {paymentStatus?.label || 'Pendente'}
                            </Badge>
                          </TableCell>

                          {/* Contrato */}
                          <TableCell>
                            <Badge variant="outline" className={cn(contractStatus?.color || '', "text-xs")}>
                              {contractStatus?.label || 'Rascunho'}
                            </Badge>
                          </TableCell>

                          {/* Risco */}
                          <TableCell>
                            <Badge variant="outline" className={cn(risk.color, "text-xs")}>
                              <RiskIcon className="h-3 w-3 mr-1" />
                              {risk.label}
                            </Badge>
                          </TableCell>

                          {/* Cadastro */}
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(client.created_at), "dd/MM/yy", { locale: ptBR })}
                            </span>
                          </TableCell>

                          {/* Ações */}
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-background">
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
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm(`Tem certeza que deseja excluir o cliente "${client.name}"? Esta ação não pode ser desfeita.`)) {
                                      try {
                                        const { error } = await supabase
                                          .from('ipromed_legal_clients')
                                          .delete()
                                          .eq('id', client.id);
                                        
                                        if (error) throw error;
                                        
                                        toast.success('Cliente excluído com sucesso!');
                                        queryClient.invalidateQueries({ queryKey: ['ipromed-clients'] });
                                      } catch (error) {
                                        console.error('Erro ao excluir:', error);
                                        toast.error('Erro ao excluir cliente. Verifique se não há dados vinculados.');
                                      }
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                    )}
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
