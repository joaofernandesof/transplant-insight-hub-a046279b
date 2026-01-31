/**
 * Portal NeoTeam Financeiro - Dados financeiros das clínicas
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
  Building2,
  TrendingUp,
  DollarSign,
  Package,
  ExternalLink,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Mock data
const clinicRevenue = [
  { month: 'Ago', procedures: 45000, products: 12000 },
  { month: 'Set', procedures: 48000, products: 14000 },
  { month: 'Out', procedures: 52000, products: 15000 },
  { month: 'Nov', procedures: 58000, products: 16000 },
  { month: 'Dez', procedures: 65000, products: 18000 },
  { month: 'Jan', procedures: 72000, products: 20000 },
];

const recentSales = [
  { id: 1, date: '2024-01-29', patient: 'João Silva', procedure: 'Transplante FUE', branch: 'SP Centro', amount: 25000, status: 'ativo' },
  { id: 2, date: '2024-01-28', patient: 'Maria Santos', procedure: 'Mesoterapia', branch: 'RJ Barra', amount: 1800, status: 'ativo' },
  { id: 3, date: '2024-01-27', patient: 'Pedro Costa', procedure: 'PRP Capilar', branch: 'SP Centro', amount: 3500, status: 'ativo' },
  { id: 4, date: '2024-01-26', patient: 'Ana Ferreira', procedure: 'Transplante FUE', branch: 'MG Savassi', amount: 28000, status: 'pendente' },
  { id: 5, date: '2024-01-25', patient: 'Carlos Lima', procedure: 'Laser Terapia', branch: 'SP Centro', amount: 1200, status: 'ativo' },
];

export default function PortalNeoTeamFinancial() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const totalRevenue = clinicRevenue[clinicRevenue.length - 1].procedures + clinicRevenue[clinicRevenue.length - 1].products;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-500" />
            NeoTeam - Financeiro Clínicas
          </h1>
          <p className="text-muted-foreground">Receitas de procedimentos e vendas</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/neoteam">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir NeoTeam
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <div className="flex items-center text-sm text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
              +10.8% vs anterior
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Procedimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(72000)}</div>
            <p className="text-sm text-muted-foreground">156 realizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Produtos/Materiais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(20000)}</div>
            <p className="text-sm text-muted-foreground">Consumo do mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(5900)}</div>
            <p className="text-sm text-muted-foreground">Por procedimento</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Receitas</CardTitle>
          <CardDescription>Procedimentos vs Produtos (últimos 6 meses)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={clinicRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area type="monotone" dataKey="procedures" name="Procedimentos" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="products" name="Produtos" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Vendas</CardTitle>
          <CardDescription>Contratos e procedimentos recentes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Procedimento</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.date}</TableCell>
                  <TableCell className="font-medium">{sale.patient}</TableCell>
                  <TableCell>{sale.procedure}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{sale.branch}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sale.status === 'ativo' ? 'default' : 'secondary'}>
                      {sale.status === 'ativo' ? 'Ativo' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(sale.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
