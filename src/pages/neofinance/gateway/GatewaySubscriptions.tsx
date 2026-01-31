/**
 * Gateway Subscriptions - Assinaturas do NeoPay
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  Users,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data
const subscriptions = [
  { id: 'sub_001', customer: 'Dr. João Silva', plan: 'Premium', amount: 497, status: 'active', nextBilling: '2024-02-15', mrr: 497 },
  { id: 'sub_002', customer: 'Clínica Vida', plan: 'Enterprise', amount: 1497, status: 'active', nextBilling: '2024-02-10', mrr: 1497 },
  { id: 'sub_003', customer: 'Maria Santos', plan: 'Basic', amount: 97, status: 'past_due', nextBilling: '2024-01-25', mrr: 0 },
  { id: 'sub_004', customer: 'Dr. Pedro Costa', plan: 'Premium', amount: 497, status: 'active', nextBilling: '2024-02-20', mrr: 497 },
  { id: 'sub_005', customer: 'Ana Ferreira', plan: 'Premium', amount: 497, status: 'canceled', nextBilling: null, mrr: 0 },
  { id: 'sub_006', customer: 'Clínica Derma', plan: 'Enterprise', amount: 1497, status: 'active', nextBilling: '2024-02-05', mrr: 1497 },
];

const mrrHistory = [
  { month: 'Ago', value: 42500 },
  { month: 'Set', value: 45800 },
  { month: 'Out', value: 48200 },
  { month: 'Nov', value: 52400 },
  { month: 'Dez', value: 56800 },
  { month: 'Jan', value: 62500 },
];

export default function GatewaySubscriptions() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Ativa', variant: 'default' },
      past_due: { label: 'Vencida', variant: 'destructive' },
      canceled: { label: 'Cancelada', variant: 'outline' },
      trialing: { label: 'Trial', variant: 'secondary' },
    };
    return configs[status] || { label: status, variant: 'outline' };
  };

  const stats = {
    totalActive: subscriptions.filter(s => s.status === 'active').length,
    totalMRR: subscriptions.reduce((s, sub) => s + sub.mrr, 0),
    pastDue: subscriptions.filter(s => s.status === 'past_due').length,
    churnRate: 2.3,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-blue-500" />
            Assinaturas Recorrentes
          </h1>
          <p className="text-muted-foreground">Gestão de assinaturas e MRR</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/neopay/subscriptions">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir NeoPay
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assinantes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActive}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalMRR)}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pastDue}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Churn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.churnRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* MRR Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do MRR</CardTitle>
          <CardDescription>Últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-32 gap-2">
            {mrrHistory.map((item, i) => (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full bg-primary/80 rounded-t"
                  style={{ 
                    height: `${(item.value / Math.max(...mrrHistory.map(h => h.value))) * 100}%`,
                    minHeight: '10px'
                  }}
                />
                <span className="text-xs text-muted-foreground">{item.month}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{formatCurrency(mrrHistory[0].value)}</span>
            <span className="font-medium text-foreground">{formatCurrency(mrrHistory[mrrHistory.length - 1].value)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Assinaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Próxima Cobrança</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => {
                const statusConfig = getStatusConfig(sub.status);
                return (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono text-sm">{sub.id}</TableCell>
                    <TableCell className="font-medium">{sub.customer}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{sub.plan}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(sub.amount)}/mês</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </TableCell>
                    <TableCell>{sub.nextBilling || '-'}</TableCell>
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
