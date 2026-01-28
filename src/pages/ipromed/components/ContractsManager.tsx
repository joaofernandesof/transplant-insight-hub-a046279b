/**
 * IPROMED Legal Hub - Gestão de Contratos
 * Interface melhorada com cards visuais e ações rápidas
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Search,
  Plus,
  FileSignature,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Eye,
  Calendar,
  Building2,
  DollarSign,
  MoreVertical,
  ExternalLink,
  Download,
  Pencil,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Contract {
  id: string;
  contract_number: string | null;
  title: string;
  description: string | null;
  client_id: string | null;
  status: 'draft' | 'pending_review' | 'pending_approval' | 'pending_signature' | 'signed' | 'active' | 'expired' | 'cancelled';
  contract_type: string | null;
  value: number | null;
  start_date: string | null;
  end_date: string | null;
  department: string | null;
  clicksign_status: string | null;
  created_at: string | null;
  partner1_client_id: string | null;
  partner2_client_id: string | null;
  ipromed_legal_clients?: { name: string } | null;
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof FileText }> = {
  draft: { label: 'Rascunho', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: FileText },
  pending_review: { label: 'Em Revisão', className: 'bg-blue-100 text-blue-700', icon: Eye },
  pending_approval: { label: 'Aguard. Aprovação', className: 'bg-amber-100 text-amber-700', icon: Clock },
  pending_signature: { label: 'Aguard. Assinatura', className: 'bg-purple-100 text-purple-700', icon: FileSignature },
  signed: { label: 'Assinado', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  active: { label: 'Ativo', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  expired: { label: 'Expirado', className: 'bg-rose-100 text-rose-700', icon: AlertTriangle },
  cancelled: { label: 'Cancelado', className: 'bg-slate-100 text-slate-700', icon: AlertTriangle },
};

const contractTypes: Record<string, string> = {
  preventivo: 'Contrato Preventivo',
  prestacao: 'Prestação de Serviços',
  locacao: 'Locação',
  parceria: 'Parceria',
  manutencao: 'Manutenção',
  trabalho: 'Trabalhista',
};

export default function ContractsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewContractOpen, setIsNewContractOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [newContract, setNewContract] = useState({
    title: '',
    contract_type: '',
    client_id: '',
    department: '',
    value: '',
    start_date: '',
    end_date: '',
    description: '',
  });

  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['ipromed-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_contracts')
        .select(`
          *,
          ipromed_legal_clients!client_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Contract[];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['ipromed-clients-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_legal_clients')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const createContract = useMutation({
    mutationFn: async (contractData: typeof newContract) => {
      const contractNumber = `CTR-${new Date().getFullYear()}-${String(contracts.length + 1).padStart(3, '0')}`;
      
      const { data, error } = await supabase
        .from('ipromed_contracts')
        .insert({
          contract_number: contractNumber,
          title: contractData.title,
          contract_type: contractData.contract_type || null,
          client_id: contractData.client_id || null,
          partner1_client_id: contractData.client_id || null,
          department: contractData.department || null,
          value: contractData.value ? parseFloat(contractData.value) : null,
          start_date: contractData.start_date || null,
          end_date: contractData.end_date || null,
          description: contractData.description || null,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-contracts'] });
      toast.success('Contrato criado com sucesso!');
      setIsNewContractOpen(false);
      setNewContract({
        title: '',
        contract_type: '',
        client_id: '',
        department: '',
        value: '',
        start_date: '',
        end_date: '',
        description: '',
      });
    },
    onError: (error) => {
      toast.error('Erro ao criar contrato: ' + error.message);
    },
  });

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contract_number?.includes(searchTerm) ?? false) ||
      (c.ipromed_legal_clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'pending' && ['draft', 'pending_review', 'pending_approval', 'pending_signature'].includes(c.status)) ||
      (activeTab === 'active' && ['signed', 'active'].includes(c.status)) ||
      (activeTab === 'expired' && c.status === 'expired');
    
    return matchesSearch && matchesTab;
  });

  const pendingCount = contracts.filter(c => 
    ['draft', 'pending_review', 'pending_approval', 'pending_signature'].includes(c.status)
  ).length;

  const expiringCount = contracts.filter(c => 
    c.end_date && differenceInDays(new Date(c.end_date), new Date()) <= 30 && differenceInDays(new Date(c.end_date), new Date()) > 0
  ).length;

  const handleSubmit = () => {
    if (!newContract.title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }
    createContract.mutate(newContract);
  };

  const getDaysUntilExpiry = (endDate: string | null) => {
    if (!endDate) return null;
    const days = differenceInDays(new Date(endDate), new Date());
    return days;
  };

  const ContractCard = ({ contract }: { contract: Contract }) => {
    const config = statusConfig[contract.status] || statusConfig.draft;
    const StatusIcon = config.icon;
    const daysUntilExpiry = getDaysUntilExpiry(contract.end_date);

    return (
      <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 group">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground">
                  {contract.contract_number || 'Sem número'}
                </p>
                <h3 className="font-semibold text-sm line-clamp-1">{contract.title}</h3>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                {contract.status === 'pending_signature' && (
                  <DropdownMenuItem className="text-purple-600">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar para assinatura
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Client */}
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {contract.ipromed_legal_clients?.name || 'Sem cliente'}
            </span>
          </div>

          {/* Status and Type */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className={`${config.className} gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
            {contract.contract_type && (
              <Badge variant="outline" className="text-xs">
                {contractTypes[contract.contract_type] || contract.contract_type}
              </Badge>
            )}
          </div>

          {/* Value and Dates */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Valor</p>
              <p className="font-semibold text-sm">
                {contract.value ? (
                  new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(contract.value)
                ) : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Vigência</p>
              {contract.end_date ? (
                <div className="flex items-center gap-1">
                  <p className="font-semibold text-sm">
                    {format(new Date(contract.end_date), 'dd/MM/yy', { locale: ptBR })}
                  </p>
                  {daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 ml-1">
                      {daysUntilExpiry}d
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </div>
          </div>

          {/* Clicksign Status */}
          {contract.clicksign_status && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Clicksign:</span>
                <Badge className="text-xs bg-purple-100 text-purple-700">
                  {contract.clicksign_status}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-600" />
            Gestão de Contratos
          </h2>
          <p className="text-muted-foreground">Biblioteca e assinatura digital via Clicksign</p>
        </div>
        <Dialog open={isNewContractOpen} onOpenChange={setIsNewContractOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Contrato</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="grid gap-4 py-4 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Contrato</Label>
                    <Select 
                      value={newContract.contract_type}
                      onValueChange={(value) => setNewContract({ ...newContract, contract_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(contractTypes).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Departamento</Label>
                    <Select 
                      value={newContract.department}
                      onValueChange={(value) => setNewContract({ ...newContract, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="juridico">Jurídico</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                        <SelectItem value="operacoes">Operações</SelectItem>
                        <SelectItem value="rh">RH</SelectItem>
                        <SelectItem value="financeiro">Financeiro</SelectItem>
                        <SelectItem value="diretoria">Diretoria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Título do Contrato *</Label>
                  <Input 
                    placeholder="Título descritivo do contrato" 
                    value={newContract.title}
                    onChange={(e) => setNewContract({ ...newContract, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente / Contraparte</Label>
                    <Select 
                      value={newContract.client_id}
                      onValueChange={(value) => setNewContract({ ...newContract, client_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor do Contrato (R$)</Label>
                    <Input 
                      type="number" 
                      placeholder="0,00" 
                      value={newContract.value}
                      onChange={(e) => setNewContract({ ...newContract, value: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Início</Label>
                    <Input 
                      type="date" 
                      value={newContract.start_date}
                      onChange={(e) => setNewContract({ ...newContract, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Término</Label>
                    <Input 
                      type="date" 
                      value={newContract.end_date}
                      onChange={(e) => setNewContract({ ...newContract, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição / Objeto</Label>
                  <Textarea 
                    placeholder="Descreva o objeto do contrato..." 
                    rows={3} 
                    value={newContract.description}
                    onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                  />
                </div>
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsNewContractOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={createContract.isPending}>
                {createContract.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Contrato
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileSignature className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Aguard. Assinatura</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contracts.filter(c => c.status === 'active' || c.status === 'signed').length}</p>
                <p className="text-xs text-muted-foreground">Contratos Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiringCount}</p>
                <p className="text-xs text-muted-foreground">Vencendo em 30d</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contracts.filter(c => c.status === 'expired').length}</p>
                <p className="text-xs text-muted-foreground">Expirados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setActiveTab('all')} data-state={activeTab === 'all' ? 'active' : ''}>
            Todos ({contracts.length})
          </TabsTrigger>
          <TabsTrigger value="pending" onClick={() => setActiveTab('pending')} data-state={activeTab === 'pending' ? 'active' : ''}>
            Pendentes ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="active" onClick={() => setActiveTab('active')} data-state={activeTab === 'active' ? 'active' : ''}>
            Ativos
          </TabsTrigger>
          <TabsTrigger value="expired" onClick={() => setActiveTab('expired')} data-state={activeTab === 'expired' ? 'active' : ''}>
            Expirados
          </TabsTrigger>
        </TabsList>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contratos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Contracts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredContracts.length === 0 ? (
        <Card className="border-none shadow-md">
          <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <FileText className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhum contrato encontrado</p>
            <p className="text-sm">Clique em "Novo Contrato" para criar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContracts.map((contract) => (
            <ContractCard key={contract.id} contract={contract} />
          ))}
        </div>
      )}
    </div>
  );
}
