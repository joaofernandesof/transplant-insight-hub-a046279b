/**
 * Gateway Split - Split de pagamentos e repasses
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
  Landmark,
  Users,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  Building2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data
const recipients = [
  { id: 'rec_001', name: 'Licenciado SP - Centro', type: 'licensee', percentage: 70, balance: 12450, pending: 3200, status: 'active' },
  { id: 'rec_002', name: 'Licenciado RJ - Barra', type: 'licensee', percentage: 70, balance: 8720, pending: 1800, status: 'active' },
  { id: 'rec_003', name: 'Licenciado MG - Savassi', type: 'licensee', percentage: 70, balance: 5380, pending: 0, status: 'active' },
  { id: 'rec_004', name: 'NeoHub Master', type: 'master', percentage: 30, balance: 45200, pending: 8500, status: 'active' },
];

const pendingTransfers = [
  { id: 'tr_001', recipient: 'Licenciado SP - Centro', amount: 3200, scheduledFor: '2024-01-30', status: 'scheduled' },
  { id: 'tr_002', recipient: 'Licenciado RJ - Barra', amount: 1800, scheduledFor: '2024-01-30', status: 'scheduled' },
  { id: 'tr_003', recipient: 'NeoHub Master', amount: 8500, scheduledFor: '2024-01-31', status: 'scheduled' },
];

const recentTransfers = [
  { id: 'tr_004', recipient: 'Licenciado SP - Centro', amount: 8500, date: '2024-01-25', status: 'completed' },
  { id: 'tr_005', recipient: 'Licenciado RJ - Barra', amount: 6200, date: '2024-01-25', status: 'completed' },
  { id: 'tr_006', recipient: 'Licenciado MG - Savassi', amount: 4100, date: '2024-01-25', status: 'completed' },
  { id: 'tr_007', recipient: 'NeoHub Master', amount: 32000, date: '2024-01-25', status: 'completed' },
];

export default function GatewaySplit() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const totalBalance = recipients.reduce((s, r) => s + r.balance, 0);
  const totalPending = recipients.reduce((s, r) => s + r.pending, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Landmark className="h-6 w-6 text-amber-500" />
            Split & Repasses
          </h1>
          <p className="text-muted-foreground">Gestão de divisão de pagamentos e transferências</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/neopay/split">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir NeoPay
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Total Disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Repasses Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recebedores Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recipients.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recipients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recebedores
          </CardTitle>
          <CardDescription>Parceiros e licenciados configurados para split</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>% Split</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right">Pendente</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {rec.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rec.type === 'master' ? 'default' : 'outline'}>
                      {rec.type === 'master' ? 'Master' : 'Licenciado'}
                    </Badge>
                  </TableCell>
                  <TableCell>{rec.percentage}%</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(rec.balance)}</TableCell>
                  <TableCell className="text-right text-amber-600">{formatCurrency(rec.pending)}</TableCell>
                  <TableCell>
                    <Badge variant="default">Ativo</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Transfers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Transferências Agendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTransfers.map((tr) => (
                <div key={tr.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{tr.recipient}</p>
                    <p className="text-sm text-muted-foreground">Agendado: {tr.scheduledFor}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(tr.amount)}</p>
                    <Badge variant="secondary">Agendado</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Últimas Transferências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransfers.map((tr) => (
                <div key={tr.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{tr.recipient}</p>
                    <p className="text-sm text-muted-foreground">{tr.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">{formatCurrency(tr.amount)}</p>
                    <Badge variant="default">Concluído</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
