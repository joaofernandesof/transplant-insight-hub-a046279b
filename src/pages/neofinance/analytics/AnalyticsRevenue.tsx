/**
 * Analytics Revenue - Receitas e Despesas
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

// Mock data
const monthlyData = [
  { month: 'Ago', receitas: 285000, despesas: 82000 },
  { month: 'Set', receitas: 312000, despesas: 88000 },
  { month: 'Out', receitas: 298000, despesas: 85000 },
  { month: 'Nov', receitas: 345000, despesas: 92000 },
  { month: 'Dez', receitas: 398000, despesas: 105000 },
  { month: 'Jan', receitas: 419000, despesas: 98000 },
];

const expenseBreakdown = [
  { category: 'Operacional', value: 45000 },
  { category: 'Pessoal', value: 28000 },
  { category: 'Marketing', value: 12000 },
  { category: 'Infraestrutura', value: 8000 },
  { category: 'Outros', value: 5000 },
];

export default function AnalyticsRevenue() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];
  const revenueGrowth = ((currentMonth.receitas - previousMonth.receitas) / previousMonth.receitas * 100).toFixed(1);
  const expenseGrowth = ((currentMonth.despesas - previousMonth.despesas) / previousMonth.despesas * 100).toFixed(1);
  const netProfit = currentMonth.receitas - currentMonth.despesas;
  const margin = ((netProfit / currentMonth.receitas) * 100).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-emerald-500" />
          Receitas & Despesas
        </h1>
        <p className="text-muted-foreground">Análise de fluxo financeiro consolidado</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Receitas (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(currentMonth.receitas)}
            </div>
            <div className="flex items-center text-sm text-emerald-600 dark:text-emerald-500 mt-1">
              <ArrowUpRight className="h-4 w-4" />
              +{revenueGrowth}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
              Despesas (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {formatCurrency(currentMonth.despesas)}
            </div>
            <div className="flex items-center text-sm text-red-600 dark:text-red-500 mt-1">
              <ArrowDownRight className="h-4 w-4" />
              -{Math.abs(Number(expenseGrowth))}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {formatCurrency(netProfit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Margem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{margin}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
            <CardDescription>Receitas vs Despesas (6 meses)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Breakdown de Despesas</CardTitle>
            <CardDescription>Por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => `${v/1000}k`} />
                  <YAxis dataKey="category" type="category" width={100} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" name="Valor" fill="#ef4444" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
