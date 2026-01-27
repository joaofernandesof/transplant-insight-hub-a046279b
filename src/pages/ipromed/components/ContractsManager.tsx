/**
 * IPROMED Legal Hub - Gestão de Contratos (com Clicksign)
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Download,
  Eye,
  ChevronRight,
  Calendar,
  Building2,
  RefreshCw,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  client: string;
  status: 'draft' | 'pending_review' | 'pending_approval' | 'pending_signature' | 'signed' | 'active' | 'expired' | 'cancelled';
  contractType: string;
  value: number;
  startDate?: Date;
  endDate?: Date;
  department: string;
  clicksignStatus?: 'pending' | 'sent' | 'signed' | 'expired';
}

const mockContracts: Contract[] = [
  {
    id: '1',
    contractNumber: 'CTR-2024-001',
    title: 'Prestação de Serviços Médicos - Clínica Norte',
    client: 'Clínica Norte LTDA',
    status: 'pending_signature',
    contractType: 'Prestação de Serviços',
    value: 120000,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2025-01-31'),
    department: 'Comercial',
    clicksignStatus: 'sent',
  },
  {
    id: '2',
    contractNumber: 'CTR-2024-002',
    title: 'Locação de Equipamentos Hospitalares',
    client: 'MedEquip Brasil',
    status: 'active',
    contractType: 'Locação',
    value: 45000,
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-07-15'),
    department: 'Operações',
    clicksignStatus: 'signed',
  },
  {
    id: '3',
    contractNumber: 'CTR-2024-003',
    title: 'Parceria Estratégica - Programa Avivar',
    client: 'Instituto Avivar',
    status: 'draft',
    contractType: 'Parceria',
    value: 250000,
    department: 'Diretoria',
  },
  {
    id: '4',
    contractNumber: 'CTR-2023-045',
    title: 'Manutenção Predial - Unidade SP',
    client: 'Manutenção Express',
    status: 'expired',
    contractType: 'Manutenção',
    value: 36000,
    startDate: new Date('2023-01-01'),
    endDate: new Date('2024-01-01'),
    department: 'Facilities',
    clicksignStatus: 'signed',
  },
];

const getStatusConfig = (status: Contract['status']) => {
  const config = {
    draft: { label: 'Rascunho', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: FileText },
    pending_review: { label: 'Em Revisão', className: 'bg-blue-100 text-blue-700', icon: Eye },
    pending_approval: { label: 'Aguard. Aprovação', className: 'bg-amber-100 text-amber-700', icon: Clock },
    pending_signature: { label: 'Aguard. Assinatura', className: 'bg-purple-100 text-purple-700', icon: FileSignature },
    signed: { label: 'Assinado', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    active: { label: 'Ativo', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    expired: { label: 'Expirado', className: 'bg-rose-100 text-rose-700', icon: AlertTriangle },
    cancelled: { label: 'Cancelado', className: 'bg-slate-100 text-slate-700', icon: AlertTriangle },
  };
  return config[status];
};

const getClicksignBadge = (status?: Contract['clicksignStatus']) => {
  if (!status) return null;
  const config = {
    pending: { label: 'Pendente', className: 'bg-gray-100 text-gray-600' },
    sent: { label: 'Enviado', className: 'bg-blue-100 text-blue-700' },
    signed: { label: 'Assinado', className: 'bg-emerald-100 text-emerald-700' },
    expired: { label: 'Expirado', className: 'bg-rose-100 text-rose-700' },
  };
  return (
    <Badge className={`${config[status].className} gap-1`}>
      <FileSignature className="h-3 w-3" />
      {config[status].label}
    </Badge>
  );
};

export default function ContractsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewContractOpen, setIsNewContractOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const filteredContracts = mockContracts.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contractNumber.includes(searchTerm) ||
      c.client.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'pending' && ['draft', 'pending_review', 'pending_approval', 'pending_signature'].includes(c.status)) ||
      (activeTab === 'active' && ['signed', 'active'].includes(c.status)) ||
      (activeTab === 'expired' && c.status === 'expired');
    
    return matchesSearch && matchesTab;
  });

  const pendingCount = mockContracts.filter(c => 
    ['draft', 'pending_review', 'pending_approval', 'pending_signature'].includes(c.status)
  ).length;

  const expiringCount = mockContracts.filter(c => 
    c.endDate && differenceInDays(c.endDate, new Date()) <= 30 && differenceInDays(c.endDate, new Date()) > 0
  ).length;

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
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
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
                <Label>Título do Contrato</Label>
                <Input placeholder="Título descritivo do contrato" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente / Contraparte</Label>
                  <Input placeholder="Nome da empresa ou pessoa" />
                </div>
                <div className="space-y-2">
                  <Label>Valor do Contrato</Label>
                  <Input type="number" placeholder="R$ 0,00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Data de Término</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição / Objeto</Label>
                <Textarea placeholder="Descreva o objeto do contrato..." rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNewContractOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsNewContractOpen(false)}>Criar Contrato</Button>
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
                <p className="text-2xl font-bold">{mockContracts.filter(c => c.status === 'active').length}</p>
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
                <p className="text-2xl font-bold">{mockContracts.filter(c => c.status === 'expired').length}</p>
                <p className="text-xs text-muted-foreground">Expirados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="active">Ativos</TabsTrigger>
            <TabsTrigger value="expired">Expirados</TabsTrigger>
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
                          <p className="font-medium text-sm">{contract.contractNumber}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {contract.title}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{contract.client}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{contract.contractType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig.className} gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{getClicksignBadge(contract.clicksignStatus)}</TableCell>
                      <TableCell className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(contract.value)}
                      </TableCell>
                      <TableCell>
                        {contract.endDate ? (
                          <div className="text-sm">
                            {format(contract.endDate, 'dd/MM/yy', { locale: ptBR })}
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
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
