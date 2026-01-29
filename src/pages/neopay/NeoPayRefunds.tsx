import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreHorizontal,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data
const mockRefunds = [
  { id: 'REF-001', chargeId: 'CHG-010', customer: 'Carlos Mendes', amount: 450, type: 'full', status: 'completed', reason: 'Solicitação do cliente', requestedAt: '2025-01-25', completedAt: '2025-01-26' },
  { id: 'REF-002', chargeId: 'CHG-011', customer: 'Ana Souza', amount: 150, type: 'partial', status: 'pending', reason: 'Cobrança duplicada', requestedAt: '2025-01-28', completedAt: null },
  { id: 'REF-003', chargeId: 'CHG-012', customer: 'Dr. Ricardo Lima', amount: 2500, type: 'full', status: 'approved', reason: 'Cancelamento de serviço', requestedAt: '2025-01-27', completedAt: null },
  { id: 'REF-004', chargeId: 'CHG-013', customer: 'Clínica Beauty', amount: 800, type: 'partial', status: 'rejected', reason: 'Insatisfação com atendimento', requestedAt: '2025-01-20', completedAt: null },
];

const statusConfig = {
  pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
  approved: { label: 'Aprovado', variant: 'outline' as const, icon: CheckCircle2 },
  rejected: { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle },
  completed: { label: 'Concluído', variant: 'default' as const, icon: CheckCircle2 },
};

export default function NeoPayRefunds() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredRefunds = mockRefunds.filter((refund) => {
    const matchesSearch = refund.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || refund.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: mockRefunds.length,
    pending: mockRefunds.filter(r => r.status === 'pending').length,
    totalAmount: mockRefunds.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.amount, 0),
  };

  const handleCreateRefund = () => {
    toast.success('Reembolso solicitado com sucesso!');
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reembolsos</h1>
          <p className="text-muted-foreground">Gerencie solicitações de reembolso</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Reembolso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar Reembolso</DialogTitle>
              <DialogDescription>
                Crie uma nova solicitação de reembolso
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cobrança</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cobrança" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">CHG-001 - Dr. João Silva - R$ 2.500</SelectItem>
                    <SelectItem value="2">CHG-002 - Clínica Vida - R$ 8.500</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select defaultValue="full">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Total</SelectItem>
                      <SelectItem value="partial">Parcial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input type="number" placeholder="0,00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Textarea placeholder="Descreva o motivo do reembolso" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateRefund} className="bg-emerald-600">
                Solicitar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total de Solicitações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Aguardando Aprovação</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
                <p className="text-xs text-muted-foreground">Total Reembolsado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar reembolsos..."
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
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Refunds Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cobrança</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRefunds.map((refund) => {
                const status = statusConfig[refund.status as keyof typeof statusConfig];
                const StatusIcon = status?.icon || Clock;
                return (
                  <TableRow key={refund.id}>
                    <TableCell className="font-mono text-sm">{refund.id}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{refund.chargeId}</TableCell>
                    <TableCell className="font-medium">{refund.customer}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(refund.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {refund.type === 'full' ? 'Total' : 'Parcial'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status?.variant}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{refund.requestedAt}</p>
                        {refund.completedAt && (
                          <p className="text-xs text-muted-foreground">Concluído: {refund.completedAt}</p>
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
                          {refund.status === 'pending' && (
                            <>
                              <DropdownMenuItem className="text-emerald-600">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Aprovar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <XCircle className="h-4 w-4 mr-2" />
                                Rejeitar
                              </DropdownMenuItem>
                            </>
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
    </div>
  );
}
