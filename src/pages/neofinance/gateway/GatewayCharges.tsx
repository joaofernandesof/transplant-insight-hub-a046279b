/**
 * Gateway Charges - Cobranças do NeoPay
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Receipt,
  Plus,
  ExternalLink,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data
const charges = [
  { id: 'chr_001', date: '2024-01-29', customer: 'Dr. João Silva', description: 'Licença Mensal', amount: 2500, method: 'Boleto', status: 'paid', dueDate: '2024-02-05' },
  { id: 'chr_002', date: '2024-01-28', customer: 'Clínica Vida', description: 'Setup Inicial', amount: 5000, method: 'PIX', status: 'paid', dueDate: '2024-01-30' },
  { id: 'chr_003', date: '2024-01-27', customer: 'Maria Santos', description: 'Curso Online', amount: 897, method: 'Boleto', status: 'pending', dueDate: '2024-02-10' },
  { id: 'chr_004', date: '2024-01-26', customer: 'Dr. Pedro Costa', description: 'Consultoria', amount: 3500, method: 'Link', status: 'overdue', dueDate: '2024-01-20' },
  { id: 'chr_005', date: '2024-01-25', customer: 'Ana Ferreira', description: 'Licença Trimestral', amount: 6500, method: 'Boleto', status: 'paid', dueDate: '2024-01-28' },
];

export default function GatewayCharges() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      paid: { label: 'Pago', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
      pending: { label: 'Pendente', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      overdue: { label: 'Vencido', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
    };
    return configs[status] || { label: status, variant: 'outline', icon: null };
  };

  const stats = {
    total: charges.length,
    paid: charges.filter(c => c.status === 'paid').length,
    pending: charges.filter(c => c.status === 'pending').length,
    overdue: charges.filter(c => c.status === 'overdue').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-violet-500" />
            Cobranças
          </h1>
          <p className="text-muted-foreground">Boletos, PIX e links de pagamento</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/neopay/charges">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir NeoPay
            </Link>
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Cobrança
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pagas</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
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
            <p className="text-sm text-muted-foreground">Vencidas</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cobranças</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {charges.map((charge) => {
                const statusConfig = getStatusConfig(charge.status);
                return (
                  <TableRow key={charge.id}>
                    <TableCell className="font-mono text-sm">{charge.id}</TableCell>
                    <TableCell>{charge.date}</TableCell>
                    <TableCell className="font-medium">{charge.customer}</TableCell>
                    <TableCell>{charge.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{charge.method}</Badge>
                    </TableCell>
                    <TableCell>{charge.dueDate}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant} className="flex items-center gap-1 w-fit">
                        {statusConfig.icon}
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(charge.amount)}</TableCell>
                    <TableCell>
                      {charge.status === 'pending' && (
                        <Button size="sm" variant="ghost">
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
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
