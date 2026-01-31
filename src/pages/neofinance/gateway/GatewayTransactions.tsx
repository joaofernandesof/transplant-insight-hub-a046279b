/**
 * Gateway Transactions - Transações do NeoPay integradas
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CreditCard,
  Search,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data de transações do gateway
const transactions = [
  { id: 'pay_abc123', date: '2024-01-29 14:32', customer: 'Dr. João Silva', email: 'joao@clinica.com', amount: 2500, method: 'credit_card', brand: 'Visa', status: 'captured', installments: 3 },
  { id: 'pay_def456', date: '2024-01-29 13:15', customer: 'Clínica Vida', email: 'contato@clinicavida.com', amount: 8500, method: 'pix', brand: null, status: 'captured', installments: 1 },
  { id: 'pay_ghi789', date: '2024-01-29 12:48', customer: 'Maria Santos', email: 'maria@email.com', amount: 450, method: 'credit_card', brand: 'Mastercard', status: 'pending', installments: 1 },
  { id: 'pay_jkl012', date: '2024-01-29 11:22', customer: 'Dr. Pedro Costa', email: 'pedro@dermato.com', amount: 1200, method: 'pix', brand: null, status: 'failed', installments: 1 },
  { id: 'pay_mno345', date: '2024-01-29 10:55', customer: 'Ana Ferreira', email: 'ana@email.com', amount: 3200, method: 'credit_card', brand: 'Elo', status: 'captured', installments: 6 },
  { id: 'pay_pqr678', date: '2024-01-28 16:20', customer: 'Clínica Derma', email: 'fin@derma.com', amount: 12000, method: 'pix', brand: null, status: 'captured', installments: 1 },
  { id: 'pay_stu901', date: '2024-01-28 15:45', customer: 'Roberto Lima', email: 'roberto@gmail.com', amount: 850, method: 'credit_card', brand: 'Visa', status: 'refunded', installments: 1 },
  { id: 'pay_vwx234', date: '2024-01-28 14:30', customer: 'Fernanda Alves', email: 'fernanda@clinica.com', amount: 4200, method: 'boleto', brand: null, status: 'pending', installments: 1 },
];

export default function GatewayTransactions() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      captured: { label: 'Capturada', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
      pending: { label: 'Pendente', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      failed: { label: 'Falha', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
      refunded: { label: 'Reembolsada', variant: 'outline', icon: <RefreshCw className="h-3 w-3" /> },
    };
    return configs[status] || { label: status, variant: 'outline', icon: null };
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      credit_card: '💳 Cartão',
      pix: '⚡ PIX',
      boleto: '📄 Boleto',
    };
    return labels[method] || method;
  };

  const stats = {
    total: transactions.length,
    captured: transactions.filter(t => t.status === 'captured').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    failed: transactions.filter(t => t.status === 'failed').length,
    volume: transactions.filter(t => t.status === 'captured').reduce((s, t) => s + t.amount, 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-emerald-500" />
            Transações Gateway
          </h1>
          <p className="text-muted-foreground">Todas as transações processadas pelo NeoPay</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/neopay/transactions">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir NeoPay
            </Link>
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Capturadas</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.captured}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Falhas</p>
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Volume</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.volume)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Transações</CardTitle>
              <CardDescription>Clique para ver detalhes</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Parcelas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                const statusConfig = getStatusConfig(tx.status);
                return (
                  <TableRow key={tx.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{tx.id}</TableCell>
                    <TableCell className="text-sm">{tx.date}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tx.customer}</p>
                        <p className="text-xs text-muted-foreground">{tx.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{getMethodLabel(tx.method)}</span>
                        {tx.brand && <span className="text-xs text-muted-foreground">({tx.brand})</span>}
                      </div>
                    </TableCell>
                    <TableCell>{tx.installments}x</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant} className="flex items-center gap-1 w-fit">
                        {statusConfig.icon}
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(tx.amount)}</TableCell>
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
