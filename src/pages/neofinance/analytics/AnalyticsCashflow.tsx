/**
 * Analytics Cashflow - Fluxo de Caixa
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';

// Mock data
const dailyCashflow = [
  { day: '20/01', entradas: 28500, saidas: 8200, saldo: 20300 },
  { day: '21/01', entradas: 32000, saidas: 12000, saldo: 20000 },
  { day: '22/01', entradas: 18500, saidas: 5500, saldo: 13000 },
  { day: '23/01', entradas: 45000, saidas: 15000, saldo: 30000 },
  { day: '24/01', entradas: 22000, saidas: 28000, saldo: -6000 },
  { day: '25/01', entradas: 38000, saidas: 9500, saldo: 28500 },
  { day: '26/01', entradas: 15000, saidas: 4200, saldo: 10800 },
  { day: '27/01', entradas: 42000, saidas: 18000, saldo: 24000 },
  { day: '28/01', entradas: 35000, saidas: 12500, saldo: 22500 },
  { day: '29/01', entradas: 48000, saidas: 8000, saldo: 40000 },
];

const upcomingPayments = [
  { date: '30/01', description: 'Folha de Pagamento', amount: -45000 },
  { date: '31/01', description: 'Aluguel Escritório', amount: -8500 },
  { date: '01/02', description: 'Fornecedores', amount: -12000 },
  { date: '05/02', description: 'Recebimento Assinaturas', amount: 85000 },
  { date: '10/02', description: 'Recebimento Split', amount: 42000 },
];

export default function AnalyticsCashflow() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const totalEntradas = dailyCashflow.reduce((s, d) => s + d.entradas, 0);
  const totalSaidas = dailyCashflow.reduce((s, d) => s + d.saidas, 0);
  const saldoAtual = 285000; // Mock saldo atual

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-500" />
          Fluxo de Caixa
        </h1>
        <p className="text-muted-foreground">Entradas, saídas e projeções</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(saldoAtual)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              Entradas (10d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalEntradas)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-red-500" />
              Saídas (10d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSaidas)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Projetado (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(saldoAtual + 95000)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Fluxo Diário</CardTitle>
          <CardDescription>Últimos 10 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyCashflow}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" />
                <YAxis tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <ReferenceLine y={0} stroke="#666" />
                <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximos Lançamentos
          </CardTitle>
          <CardDescription>Pagamentos e recebimentos agendados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingPayments.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                </div>
                <div className={`font-bold ${item.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {item.amount > 0 ? '+' : ''}{formatCurrency(item.amount)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
