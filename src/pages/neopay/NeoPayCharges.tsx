import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreHorizontal,
  CreditCard,
  QrCode,
  FileText,
  Link,
  Send,
  Copy,
  Eye,
  XCircle,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data
const mockCharges = [
  { id: 'CHG-001', customer: 'Dr. João Silva', email: 'joao@clinica.com', amount: 2500, installments: 1, method: 'credit_card', status: 'captured', dueDate: '2025-01-29', paidAt: '2025-01-29 14:32' },
  { id: 'CHG-002', customer: 'Clínica Vida Nova', email: 'contato@vidanova.com', amount: 8500, installments: 3, method: 'pix', status: 'captured', dueDate: '2025-01-28', paidAt: '2025-01-28 10:15' },
  { id: 'CHG-003', customer: 'Maria Santos', email: 'maria@email.com', amount: 450, installments: 1, method: 'payment_link', status: 'pending', dueDate: '2025-01-30', paidAt: null },
  { id: 'CHG-004', customer: 'Dr. Pedro Costa', email: 'pedro@medico.com', amount: 1200, installments: 2, method: 'credit_card', status: 'failed', dueDate: '2025-01-27', paidAt: null },
  { id: 'CHG-005', customer: 'Ana Ferreira', email: 'ana@empresa.com', amount: 3200, installments: 1, method: 'pix', status: 'captured', dueDate: '2025-01-26', paidAt: '2025-01-26 16:45' },
  { id: 'CHG-006', customer: 'Instituto Hair', email: 'financeiro@hair.com', amount: 15000, installments: 12, method: 'credit_card', status: 'authorized', dueDate: '2025-01-25', paidAt: null },
  { id: 'CHG-007', customer: 'Carlos Mendes', email: 'carlos@gmail.com', amount: 750, installments: 1, method: 'boleto', status: 'pending', dueDate: '2025-02-01', paidAt: null },
];

const statusConfig = {
  pending: { label: 'Pendente', variant: 'secondary' as const, color: 'text-amber-600' },
  authorized: { label: 'Autorizada', variant: 'outline' as const, color: 'text-blue-600' },
  captured: { label: 'Capturada', variant: 'default' as const, color: 'text-emerald-600' },
  cancelled: { label: 'Cancelada', variant: 'destructive' as const, color: 'text-red-600' },
  failed: { label: 'Falhou', variant: 'destructive' as const, color: 'text-red-600' },
  refunded: { label: 'Reembolsada', variant: 'outline' as const, color: 'text-gray-600' },
};

const methodConfig = {
  credit_card: { label: 'Cartão de Crédito', icon: CreditCard },
  debit_card: { label: 'Cartão de Débito', icon: CreditCard },
  pix: { label: 'PIX', icon: QrCode },
  boleto: { label: 'Boleto', icon: FileText },
  payment_link: { label: 'Link de Pagamento', icon: Link },
};

export default function NeoPayCharges() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredCharges = mockCharges.filter((charge) => {
    const matchesSearch = 
      charge.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      charge.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || charge.status === filterStatus;
    const matchesMethod = filterMethod === 'all' || charge.method === filterMethod;
    const matchesTab = selectedTab === 'all' || 
      (selectedTab === 'pending' && ['pending', 'authorized'].includes(charge.status)) ||
      (selectedTab === 'paid' && charge.status === 'captured') ||
      (selectedTab === 'failed' && ['failed', 'cancelled'].includes(charge.status));
    return matchesSearch && matchesStatus && matchesMethod && matchesTab;
  });

  const handleCreateCharge = () => {
    toast.success('Cobrança criada com sucesso!');
    setIsCreateDialogOpen(false);
  };

  const handleCopyLink = (id: string) => {
    navigator.clipboard.writeText(`https://pay.neohub.com.br/${id}`);
    toast.success('Link copiado para a área de transferência');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cobranças</h1>
          <p className="text-muted-foreground">Gerencie todas as cobranças e pagamentos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Nova Cobrança
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Nova Cobrança</DialogTitle>
                <DialogDescription>
                  Gere uma cobrança para um cliente
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Dr. João Silva</SelectItem>
                      <SelectItem value="2">Clínica Vida Nova</SelectItem>
                      <SelectItem value="3">Maria Santos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input type="number" placeholder="0,00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Parcelas</Label>
                    <Select defaultValue="1">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                          <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Método de Pagamento</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="payment_link">Link de Pagamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de Vencimento</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Input placeholder="Descrição da cobrança" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateCharge} className="bg-emerald-600 hover:bg-emerald-700">
                  Criar Cobrança
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="paid">Pagas</TabsTrigger>
          <TabsTrigger value="failed">Falhas</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente ou ID..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="authorized">Autorizada</SelectItem>
                    <SelectItem value="captured">Capturada</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterMethod} onValueChange={setFilterMethod}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos métodos</SelectItem>
                    <SelectItem value="credit_card">Cartão</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="payment_link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Charges Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCharges.map((charge) => {
                    const status = statusConfig[charge.status as keyof typeof statusConfig];
                    const method = methodConfig[charge.method as keyof typeof methodConfig];
                    const MethodIcon = method?.icon || CreditCard;
                    
                    return (
                      <TableRow key={charge.id}>
                        <TableCell className="font-mono text-sm">{charge.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{charge.customer}</p>
                            <p className="text-xs text-muted-foreground">{charge.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatCurrency(charge.amount)}</p>
                            {charge.installments > 1 && (
                              <p className="text-xs text-muted-foreground">
                                {charge.installments}x de {formatCurrency(charge.amount / charge.installments)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MethodIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{method?.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status?.variant}>{status?.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{charge.dueDate}</p>
                            {charge.paidAt && (
                              <p className="text-xs text-emerald-600">Pago: {charge.paidAt}</p>
                            )}
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
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyLink(charge.id)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copiar Link
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Send className="h-4 w-4 mr-2" />
                                Reenviar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {charge.status === 'authorized' && (
                                <DropdownMenuItem className="text-emerald-600">
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Capturar
                                </DropdownMenuItem>
                              )}
                              {charge.status === 'failed' && (
                                <DropdownMenuItem>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Reprocessar
                                </DropdownMenuItem>
                              )}
                              {['pending', 'authorized'].includes(charge.status) && (
                                <DropdownMenuItem className="text-red-600">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar
                                </DropdownMenuItem>
                              )}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
