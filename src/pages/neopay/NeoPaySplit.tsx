import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreHorizontal,
  GitBranch,
  Users,
  DollarSign,
  Percent,
  Building2,
  Clock,
  CheckCircle2,
  ArrowRight,
  Edit,
  Trash2,
  Eye,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data
const mockSplitRules = [
  { 
    id: '1', 
    name: 'Split Licenciados NeoFolic', 
    description: 'Repasse padrão para licenciados ByNeoFolic',
    productName: 'Licença ByNeoFolic',
    isActive: true,
    recipients: [
      { name: 'NeoHub (Taxa Admin)', percentage: 15, type: 'percentage' },
      { name: 'Licenciado', percentage: 85, type: 'percentage' },
    ],
  },
  { 
    id: '2', 
    name: 'Split Transplante FUE', 
    description: 'Divisão para procedimentos de transplante',
    productName: 'Transplante Capilar FUE',
    isActive: true,
    recipients: [
      { name: 'NeoHub', percentage: 10, type: 'percentage' },
      { name: 'Clínica Parceira', percentage: 60, type: 'percentage' },
      { name: 'Médico Executor', percentage: 30, type: 'percentage' },
    ],
  },
  { 
    id: '3', 
    name: 'Split Curso IBRAMEC', 
    description: 'Repasse para instrutores e parceiros',
    productName: 'Curso IBRAMEC Presencial',
    isActive: false,
    recipients: [
      { name: 'NeoHub', percentage: 20, type: 'percentage' },
      { name: 'Instrutor Principal', percentage: 50, type: 'percentage' },
      { name: 'Monitor', percentage: 30, type: 'percentage' },
    ],
  },
];

const mockTransfers = [
  { id: 'TRF-001', recipient: 'Licenciado SP - Centro', chargeId: 'CHG-001', grossAmount: 2500, adminFee: 375, netAmount: 2125, status: 'completed', scheduledDate: '2025-01-30', transferredAt: '2025-01-30 10:00' },
  { id: 'TRF-002', recipient: 'Clínica Vida Nova', chargeId: 'CHG-002', grossAmount: 8500, adminFee: 850, netAmount: 7650, status: 'completed', scheduledDate: '2025-01-30', transferredAt: '2025-01-30 10:05' },
  { id: 'TRF-003', recipient: 'Licenciado RJ - Barra', chargeId: 'CHG-005', grossAmount: 3200, adminFee: 480, netAmount: 2720, status: 'pending', scheduledDate: '2025-01-31', transferredAt: null },
  { id: 'TRF-004', recipient: 'Dr. Marcos Lima', chargeId: 'CHG-006', grossAmount: 4500, adminFee: 450, netAmount: 4050, status: 'processing', scheduledDate: '2025-01-31', transferredAt: null },
];

const statusConfig = {
  pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
  processing: { label: 'Processando', variant: 'outline' as const, icon: ArrowRight },
  completed: { label: 'Concluído', variant: 'default' as const, icon: CheckCircle2 },
  failed: { label: 'Falhou', variant: 'destructive' as const, icon: Clock },
};

export default function NeoPaySplit() {
  const [selectedTab, setSelectedTab] = useState('rules');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Stats
  const totalTransferred = mockTransfers.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.netAmount, 0);
  const pendingTransfers = mockTransfers.filter(t => t.status === 'pending' || t.status === 'processing').reduce((sum, t) => sum + t.netAmount, 0);
  const totalAdminFees = mockTransfers.reduce((sum, t) => sum + t.adminFee, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Split de Pagamentos</h1>
          <p className="text-muted-foreground">Configure regras de divisão e acompanhe repasses</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalTransferred)}</p>
                <p className="text-xs text-muted-foreground">Total Repassado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(pendingTransfers)}</p>
                <p className="text-xs text-muted-foreground">Repasses Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalAdminFees)}</p>
                <p className="text-xs text-muted-foreground">Taxas Administrativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <GitBranch className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockSplitRules.filter(r => r.isActive).length}</p>
                <p className="text-xs text-muted-foreground">Regras Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="rules">Regras de Split</TabsTrigger>
            <TabsTrigger value="transfers">Histórico de Repasses</TabsTrigger>
            <TabsTrigger value="recipients">Recebedores</TabsTrigger>
          </TabsList>
          {selectedTab === 'rules' && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Criar Regra de Split</DialogTitle>
                  <DialogDescription>
                    Configure como o pagamento será dividido entre os recebedores
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome da Regra</Label>
                    <Input placeholder="Ex: Split Licenciados" />
                  </div>
                  <div className="space-y-2">
                    <Label>Produto/Serviço</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os produtos</SelectItem>
                        <SelectItem value="license">Licença ByNeoFolic</SelectItem>
                        <SelectItem value="transplant">Transplante FUE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input placeholder="Descrição da regra" />
                  </div>
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Recebedores</Label>
                      <Button variant="outline" size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="flex-1 text-sm">NeoHub (Admin)</span>
                        <Input className="w-20" type="number" defaultValue="15" />
                        <span className="text-sm">%</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="flex-1 text-sm">Recebedor</span>
                        <Input className="w-20" type="number" defaultValue="85" />
                        <span className="text-sm">%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => { toast.success('Regra criada!'); setIsCreateDialogOpen(false); }} className="bg-emerald-600">
                    Criar Regra
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Rules Tab */}
        <TabsContent value="rules" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockSplitRules.map((rule) => (
              <Card key={rule.id} className={!rule.isActive ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{rule.name}</CardTitle>
                      <CardDescription className="text-xs">{rule.productName}</CardDescription>
                    </div>
                    <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                      {rule.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{rule.description}</p>
                  <div className="space-y-2">
                    {rule.recipients.map((recipient, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{recipient.name}</span>
                          <span className="font-medium">{recipient.percentage}%</span>
                        </div>
                        <Progress value={recipient.percentage} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Transfers Tab */}
        <TabsContent value="transfers" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar repasses..." className="pl-10" />
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Recebedor</TableHead>
                    <TableHead>Valor Bruto</TableHead>
                    <TableHead>Taxa Admin</TableHead>
                    <TableHead>Valor Líquido</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTransfers.map((transfer) => {
                    const status = statusConfig[transfer.status as keyof typeof statusConfig];
                    const StatusIcon = status?.icon || Clock;
                    return (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-mono text-sm">{transfer.id}</TableCell>
                        <TableCell className="font-medium">{transfer.recipient}</TableCell>
                        <TableCell>{formatCurrency(transfer.grossAmount)}</TableCell>
                        <TableCell className="text-red-600">-{formatCurrency(transfer.adminFee)}</TableCell>
                        <TableCell className="font-medium text-emerald-600">{formatCurrency(transfer.netAmount)}</TableCell>
                        <TableCell>
                          <Badge variant={status?.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{transfer.scheduledDate}</p>
                            {transfer.transferredAt && (
                              <p className="text-xs text-muted-foreground">Enviado: {transfer.transferredAt}</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recipients Tab */}
        <TabsContent value="recipients" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recebedores Cadastrados</CardTitle>
              <CardDescription>Gerencie os recebedores de split</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Licenciado SP - Centro', 'Clínica Vida Nova', 'Dr. Marcos Lima', 'Licenciado RJ - Barra'].map((name, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">financeiro@{name.toLowerCase().replace(/\s/g, '')}.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Ativo</Badge>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
