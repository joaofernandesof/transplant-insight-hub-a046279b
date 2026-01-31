/**
 * Portal IPROMED Financeiro - Dados financeiros jurídicos
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
  FileText,
  Scale,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data
const invoices = [
  { id: 'INV-001', date: '2024-01-29', client: 'Dr. João Silva', service: 'Consultoria Jurídica', amount: 3500, status: 'pago', dueDate: '2024-02-05' },
  { id: 'INV-002', date: '2024-01-28', client: 'Clínica Vida', service: 'Defesa Trabalhista', amount: 8500, status: 'pago', dueDate: '2024-02-10' },
  { id: 'INV-003', date: '2024-01-27', client: 'Maria Santos', service: 'Consultoria Mensal', amount: 2500, status: 'pendente', dueDate: '2024-02-15' },
  { id: 'INV-004', date: '2024-01-20', client: 'Dr. Pedro Costa', service: 'Parecer Técnico', amount: 5000, status: 'vencido', dueDate: '2024-01-25' },
  { id: 'INV-005', date: '2024-01-15', client: 'Ana Ferreira', service: 'Contrato Social', amount: 1800, status: 'pago', dueDate: '2024-01-20' },
];

const stats = {
  totalMonth: 52000,
  pending: 12500,
  overdue: 5000,
  clients: 48,
};

export default function PortalIpromedFinancial() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      pago: { label: 'Pago', variant: 'default' },
      pendente: { label: 'Pendente', variant: 'secondary' },
      vencido: { label: 'Vencido', variant: 'destructive' },
    };
    return configs[status] || { label: status, variant: 'secondary' };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="h-6 w-6 text-violet-500" />
            IPROMED - Financeiro Jurídico
          </h1>
          <p className="text-muted-foreground">Faturamento de serviços jurídicos</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/ipromed/financial">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir IPROMED
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-violet-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalMonth)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              A Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(stats.pending)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Faturas Recentes</CardTitle>
          <CardDescription>Serviços jurídicos faturados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Fatura</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => {
                const statusConfig = getStatusConfig(inv.status);
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono">{inv.id}</TableCell>
                    <TableCell>{inv.date}</TableCell>
                    <TableCell className="font-medium">{inv.client}</TableCell>
                    <TableCell>{inv.service}</TableCell>
                    <TableCell>{inv.dueDate}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(inv.amount)}</TableCell>
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
