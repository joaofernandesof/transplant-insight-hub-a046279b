/**
 * Portal NeoLicense Financeiro - Dados financeiros de licenciamento
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
  Wallet,
  Building2,
  TrendingUp,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data
const licensees = [
  { id: 1, name: 'SP Centro', plan: 'Premium', monthlyFee: 4500, status: 'active', nextPayment: '2024-02-05', paidMonths: 18 },
  { id: 2, name: 'RJ Barra', plan: 'Premium', monthlyFee: 4500, status: 'active', nextPayment: '2024-02-10', paidMonths: 12 },
  { id: 3, name: 'MG Savassi', plan: 'Standard', monthlyFee: 2500, status: 'active', nextPayment: '2024-02-15', paidMonths: 8 },
  { id: 4, name: 'RS Centro', plan: 'Standard', monthlyFee: 2500, status: 'past_due', nextPayment: '2024-01-20', paidMonths: 5 },
  { id: 5, name: 'PR Curitiba', plan: 'Premium', monthlyFee: 4500, status: 'active', nextPayment: '2024-02-08', paidMonths: 24 },
];

const stats = {
  totalMRR: 45000,
  activeLicensees: 15,
  avgLTV: 85000,
  renewalRate: 94,
};

export default function PortalNeoLicenseFinancial() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-amber-500" />
            NeoLicense - Financeiro
          </h1>
          <p className="text-muted-foreground">Receitas de licenciamento</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/neolicense">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir NeoLicense
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR Licenças
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalMRR)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Licenciados Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLicensees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              LTV Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgLTV)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa Renovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.renewalRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Licensees */}
      <Card>
        <CardHeader>
          <CardTitle>Licenciados</CardTitle>
          <CardDescription>Status de pagamento das licenças</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidade</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Mensalidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Próx. Pagamento</TableHead>
                <TableHead className="text-right">Meses Pagos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licensees.map((lic) => (
                <TableRow key={lic.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {lic.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{lic.plan}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(lic.monthlyFee)}</TableCell>
                  <TableCell>
                    <Badge variant={lic.status === 'active' ? 'default' : 'destructive'}>
                      {lic.status === 'active' ? 'Ativo' : 'Vencido'}
                    </Badge>
                  </TableCell>
                  <TableCell>{lic.nextPayment}</TableCell>
                  <TableCell className="text-right">{lic.paidMonths}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
