/**
 * IPROMED Legal Hub - Gestão de Contratos
 * Integrado com banco de dados real
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Search,
  Plus,
  FileSignature,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  ChevronRight,
  Loader2,
  Eye,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

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

const getStatusConfig = (status: Contract['status']) => {
  const config: Record<string, { label: string; className: string; icon: typeof FileText }> = {
    draft: { label: 'Rascunho', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: FileText },
    pending_review: { label: 'Em Revisão', className: 'bg-blue-100 text-blue-700', icon: Eye },
    pending_approval: { label: 'Aguard. Aprovação', className: 'bg-amber-100 text-amber-700', icon: Clock },
    pending_signature: { label: 'Aguard. Assinatura', className: 'bg-purple-100 text-purple-700', icon: FileSignature },
    signed: { label: 'Assinado', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    active: { label: 'Ativo', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    expired: { label: 'Expirado', className: 'bg-rose-100 text-rose-700', icon: AlertTriangle },
    cancelled: { label: 'Cancelado', className: 'bg-slate-100 text-slate-700', icon: AlertTriangle },
  };
  return config[status] || config.draft;
};

const getClicksignBadge = (status?: string | null) => {
  if (!status) return null;
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pendente', className: 'bg-gray-100 text-gray-600' },
    sent: { label: 'Enviado', className: 'bg-blue-100 text-blue-700' },
    signed: { label: 'Assinado', className: 'bg-emerald-100 text-emerald-700' },
    expired: { label: 'Expirado', className: 'bg-rose-100 text-rose-700' },
  };
  const cfg = config[status] || config.pending;
  return (
    <Badge className={`${cfg.className} gap-1`}>
      <FileSignature className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
};

export default function ContractsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewContractOpen, setIsNewContractOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
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

  // Fetch contracts from database
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

  // Fetch clients for dropdown
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

  // Create contract mutation
  const createContract = useMutation({
    mutationFn: async (contractData: typeof newContract) => {
      // Generate contract number
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
            <div className="grid gap-4 py-4">
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
                      <SelectItem value="preventivo">Contrato Preventivo</SelectItem>
                      <SelectItem value="prestacao">Prestação de Serviços</SelectItem>
                      <SelectItem value="locacao">Locação</SelectItem>
                      <SelectItem value="parceria">Parceria</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                      <SelectItem value="trabalho">Trabalhista</SelectItem>
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
            <div className="flex justify-end gap-2">
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

      {/* Tabs and Table */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setActiveTab('all')} data-state={activeTab === 'all' ? 'active' : ''}>
            Todos
          </TabsTrigger>
          <TabsTrigger value="pending" onClick={() => setActiveTab('pending')} data-state={activeTab === 'pending' ? 'active' : ''}>
            Pendentes
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

      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhum contrato encontrado</p>
              <p className="text-sm">Clique em "Novo Contrato" para criar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clicksign</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => {
                  const statusConfig = getStatusConfig(contract.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <TableRow key={contract.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{contract.contract_number || 'Sem número'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {contract.title}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {contract.ipromed_legal_clients?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {contract.contract_type ? (
                          <Badge variant="outline">{contract.contract_type}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig.className} gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{getClicksignBadge(contract.clicksign_status)}</TableCell>
                      <TableCell className="font-medium">
                        {contract.value ? (
                          new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(contract.value)
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {contract.end_date ? (
                          <div className="text-sm">
                            {format(new Date(contract.end_date), 'dd/MM/yy', { locale: ptBR })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {contract.status === 'pending_signature' && (
                            <Button variant="ghost" size="icon" title="Enviar para assinatura">
                              <Send className="h-4 w-4 text-purple-600" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
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
  );
}
