import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RotateCcw,
  Eye,
} from 'lucide-react';

// Mock data
const mockTransactions = [
  { id: 'TXN-001', chargeId: 'CHG-001', operation: 'authorization', amount: 2500, status: 'captured', processedAt: '2025-01-29 14:30', processedBy: 'Sistema' },
  { id: 'TXN-002', chargeId: 'CHG-001', operation: 'capture', amount: 2500, status: 'captured', processedAt: '2025-01-29 14:32', processedBy: 'Sistema' },
  { id: 'TXN-003', chargeId: 'CHG-002', operation: 'authorization', amount: 8500, status: 'captured', processedAt: '2025-01-28 10:12', processedBy: 'Sistema' },
  { id: 'TXN-004', chargeId: 'CHG-002', operation: 'capture', amount: 8500, status: 'captured', processedAt: '2025-01-28 10:15', processedBy: 'Sistema' },
  { id: 'TXN-005', chargeId: 'CHG-004', operation: 'authorization', amount: 1200, status: 'failed', processedAt: '2025-01-27 09:45', processedBy: 'Sistema', error: 'Cartão recusado pelo emissor' },
  { id: 'TXN-006', chargeId: 'CHG-005', operation: 'authorization', amount: 3200, status: 'captured', processedAt: '2025-01-26 16:42', processedBy: 'Sistema' },
  { id: 'TXN-007', chargeId: 'CHG-005', operation: 'capture', amount: 3200, status: 'captured', processedAt: '2025-01-26 16:45', processedBy: 'Sistema' },
  { id: 'TXN-008', chargeId: 'CHG-006', operation: 'authorization', amount: 15000, status: 'authorized', processedAt: '2025-01-25 11:30', processedBy: 'Sistema' },
  { id: 'TXN-009', chargeId: 'CHG-003', operation: 'refund', amount: 450, status: 'pending', processedAt: '2025-01-25 10:00', processedBy: 'Admin' },
];

const operationConfig = {
  authorization: { label: 'Autorização', icon: ArrowUpRight, color: 'text-blue-600 bg-blue-100' },
  capture: { label: 'Captura', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-100' },
  cancel: { label: 'Cancelamento', icon: XCircle, color: 'text-red-600 bg-red-100' },
  refund: { label: 'Reembolso', icon: RotateCcw, color: 'text-amber-600 bg-amber-100' },
};

const statusConfig = {
  pending: { label: 'Pendente', icon: Clock, variant: 'secondary' as const },
  authorized: { label: 'Autorizada', icon: AlertCircle, variant: 'outline' as const },
  captured: { label: 'Capturada', icon: CheckCircle2, variant: 'default' as const },
  failed: { label: 'Falhou', icon: XCircle, variant: 'destructive' as const },
  cancelled: { label: 'Cancelada', icon: XCircle, variant: 'destructive' as const },
  refunded: { label: 'Reembolsada', icon: RotateCcw, variant: 'outline' as const },
};

export default function NeoPayTransactions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOperation, setFilterOperation] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<typeof mockTransactions[0] | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredTransactions = mockTransactions.filter((tx) => {
    const matchesSearch = 
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.chargeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOperation = filterOperation === 'all' || tx.operation === filterOperation;
    const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
    return matchesSearch && matchesOperation && matchesStatus;
  });

  // Stats
  const stats = {
    total: mockTransactions.length,
    captured: mockTransactions.filter(t => t.status === 'captured').length,
    pending: mockTransactions.filter(t => t.status === 'pending' || t.status === 'authorized').length,
    failed: mockTransactions.filter(t => t.status === 'failed').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transações</h1>
          <p className="text-muted-foreground">Histórico detalhado de todas as operações</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.captured}</p>
                <p className="text-xs text-muted-foreground">Capturadas</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                <p className="text-xs text-muted-foreground">Falhas</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/30" />
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
                placeholder="Buscar por ID da transação ou cobrança..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterOperation} onValueChange={setFilterOperation}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Operação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas operações</SelectItem>
                <SelectItem value="authorization">Autorização</SelectItem>
                <SelectItem value="capture">Captura</SelectItem>
                <SelectItem value="cancel">Cancelamento</SelectItem>
                <SelectItem value="refund">Reembolso</SelectItem>
              </SelectContent>
            </Select>
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
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cobrança</TableHead>
                <TableHead>Operação</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Processado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => {
                const operation = operationConfig[tx.operation as keyof typeof operationConfig];
                const status = statusConfig[tx.status as keyof typeof statusConfig];
                const OpIcon = operation?.icon || ArrowUpRight;
                const StatusIcon = status?.icon || Clock;

                return (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-sm">{tx.id}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{tx.chargeId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={operation?.color}>
                        <OpIcon className="h-3 w-3 mr-1" />
                        {operation?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(tx.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={status?.variant}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{tx.processedAt}</p>
                        <p className="text-xs text-muted-foreground">por {tx.processedBy}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedTransaction(tx)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Transação</DialogTitle>
            <DialogDescription>
              {selectedTransaction?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cobrança</p>
                  <p className="font-mono">{selectedTransaction.chargeId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-medium">{formatCurrency(selectedTransaction.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Operação</p>
                  <p>{operationConfig[selectedTransaction.operation as keyof typeof operationConfig]?.label}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={statusConfig[selectedTransaction.status as keyof typeof statusConfig]?.variant}>
                    {statusConfig[selectedTransaction.status as keyof typeof statusConfig]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Processado em</p>
                  <p>{selectedTransaction.processedAt}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Processado por</p>
                  <p>{selectedTransaction.processedBy}</p>
                </div>
              </div>
              {selectedTransaction.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Erro:</p>
                  <p className="text-sm text-red-700">{selectedTransaction.error}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
