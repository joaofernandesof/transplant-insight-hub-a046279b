/**
 * Analytics Delinquency - Inadimplência
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
  AlertTriangle,
  TrendingDown,
  Users,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data
const delinquentAccounts = [
  { id: 1, customer: 'Dr. João Silva', portal: 'NeoPay', amount: 2500, daysOverdue: 45, attempts: 3, lastContact: '2024-01-20' },
  { id: 2, customer: 'Clínica Vida', portal: 'NeoLicense', amount: 4500, daysOverdue: 30, attempts: 2, lastContact: '2024-01-25' },
  { id: 3, customer: 'Maria Santos', portal: 'Academy', amount: 897, daysOverdue: 15, attempts: 1, lastContact: '2024-01-28' },
  { id: 4, customer: 'Dr. Pedro Costa', portal: 'IPROMED', amount: 5000, daysOverdue: 60, attempts: 5, lastContact: '2024-01-10' },
  { id: 5, customer: 'Ana Ferreira', portal: 'NeoPay', amount: 1200, daysOverdue: 7, attempts: 0, lastContact: null },
];

const stats = {
  totalOverdue: 14097,
  overdueRate: 2.8,
  accountsCount: 5,
  avgDaysOverdue: 31,
};

export default function AnalyticsDelinquency() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getSeverity = (days: number) => {
    if (days >= 60) return { label: 'Crítico', variant: 'destructive' as const };
    if (days >= 30) return { label: 'Alto', variant: 'destructive' as const };
    if (days >= 15) return { label: 'Médio', variant: 'secondary' as const };
    return { label: 'Baixo', variant: 'outline' as const };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Gestão de Inadimplência
          </h1>
          <p className="text-muted-foreground">Contas vencidas de todos os portais</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/neopay/delinquency">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Régua de Cobrança
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total em Atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalOverdue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa Inadimplência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdueRate}%</div>
            <Progress value={stats.overdueRate} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contas em Atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accountsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média Dias Atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDaysOverdue} dias</div>
          </CardContent>
        </Card>
      </div>

      {/* Alert */}
      <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <h3 className="font-bold text-red-700 dark:text-red-400">Atenção: 2 contas críticas</h3>
              <p className="text-sm text-red-600 dark:text-red-500">
                Contas com mais de 60 dias de atraso precisam de ação imediata
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contas em Atraso</CardTitle>
          <CardDescription>Ordenado por dias de atraso</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Portal</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Dias Atraso</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Tentativas</TableHead>
                <TableHead>Último Contato</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {delinquentAccounts.sort((a, b) => b.daysOverdue - a.daysOverdue).map((acc) => {
                const severity = getSeverity(acc.daysOverdue);
                return (
                  <TableRow key={acc.id}>
                    <TableCell className="font-medium">{acc.customer}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{acc.portal}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-red-600">{formatCurrency(acc.amount)}</TableCell>
                    <TableCell>{acc.daysOverdue} dias</TableCell>
                    <TableCell>
                      <Badge variant={severity.variant}>{severity.label}</Badge>
                    </TableCell>
                    <TableCell>{acc.attempts}</TableCell>
                    <TableCell>{acc.lastContact || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Mail className="h-4 w-4" />
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
    </div>
  );
}
