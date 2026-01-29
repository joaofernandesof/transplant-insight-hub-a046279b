/**
 * IPROMED Financial - Relatórios e Indicadores
 * DRE, aging, relatórios por cliente e comparativos
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
  Users,
  Calendar,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";

// DRE Data
const dreData = {
  receitas: {
    honorarios: 85000,
    consultas: 12500,
    pareceres: 8000,
    mensalidades: 35000,
    total: 140500,
  },
  despesas: {
    pessoal: 45000,
    prolabore: 25000,
    aluguel: 4500,
    software: 2500,
    correspondentes: 8500,
    peritos: 12000,
    custas: 5500,
    marketing: 3500,
    outros: 4000,
    total: 110500,
  },
  resultado: 30000,
  margem: 21.4,
};

// Aging data
const agingData = [
  { range: 'A vencer', amount: 42500, count: 8, color: 'bg-emerald-500' },
  { range: '1-7 dias', amount: 3500, count: 2, color: 'bg-amber-400' },
  { range: '8-15 dias', amount: 5200, count: 3, color: 'bg-amber-500' },
  { range: '16-30 dias', amount: 8750, count: 4, color: 'bg-orange-500' },
  { range: '31-60 dias', amount: 4200, count: 2, color: 'bg-rose-500' },
  { range: '+60 dias', amount: 2800, count: 1, color: 'bg-rose-700' },
];

// Monthly comparison
const monthlyData = [
  { month: 'Ago', receitas: 95000, despesas: 78000 },
  { month: 'Set', receitas: 102000, despesas: 85000 },
  { month: 'Out', receitas: 115000, despesas: 92000 },
  { month: 'Nov', receitas: 128000, despesas: 98000 },
  { month: 'Dez', receitas: 145000, despesas: 105000 },
  { month: 'Jan', receitas: 140500, despesas: 110500 },
];

// Client ranking
const clientRanking = [
  { name: 'Hospital XYZ', revenue: 48000, expenses: 12000, profit: 36000, delay: 0 },
  { name: 'Clínica ABC', revenue: 32000, expenses: 8500, profit: 23500, delay: 15 },
  { name: 'Dr. João Silva', revenue: 28000, expenses: 5000, profit: 23000, delay: 0 },
  { name: 'Dra. Maria Santos', revenue: 18500, expenses: 3200, profit: 15300, delay: 7 },
  { name: 'Dr. Carlos Oliveira', revenue: 14000, expenses: 6800, profit: 7200, delay: 30 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function FinancialReports() {
  const [period, setPeriod] = useState('current-month');
  const [activeTab, setActiveTab] = useState('dre');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            Relatórios e Indicadores
          </h2>
          <p className="text-sm text-muted-foreground">
            DRE, aging de recebíveis, relatórios por cliente e comparativos
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Janeiro/2026</SelectItem>
              <SelectItem value="last-month">Dezembro/2025</SelectItem>
              <SelectItem value="quarter">Último Trimestre</SelectItem>
              <SelectItem value="year">Ano 2025</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dre">DRE</TabsTrigger>
          <TabsTrigger value="aging">Aging</TabsTrigger>
          <TabsTrigger value="clients">Por Cliente</TabsTrigger>
          <TabsTrigger value="comparison">Comparativo</TabsTrigger>
        </TabsList>

        {/* DRE Tab */}
        <TabsContent value="dre" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-700">Receita Bruta</p>
                    <p className="text-2xl font-bold text-emerald-800">{formatCurrency(dreData.receitas.total)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-rose-200 bg-rose-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-rose-700">Despesas</p>
                    <p className="text-2xl font-bold text-rose-800">{formatCurrency(dreData.despesas.total)}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-rose-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Resultado (Lucro)</p>
                    <p className="text-2xl font-bold text-blue-800">{formatCurrency(dreData.resultado)}</p>
                    <p className="text-xs text-blue-600">Margem: {dreData.margem}%</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-emerald-700">Receitas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(dreData.receitas).filter(([k]) => k !== 'total').map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="capitalize text-sm">{key}</span>
                      <span className="font-medium">{formatCurrency(value)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between items-center font-bold">
                    <span>Total</span>
                    <span className="text-emerald-600">{formatCurrency(dreData.receitas.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base text-rose-700">Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(dreData.despesas).filter(([k]) => k !== 'total').map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="capitalize text-sm">{key}</span>
                      <span className="font-medium">{formatCurrency(value)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between items-center font-bold">
                    <span>Total</span>
                    <span className="text-rose-600">{formatCurrency(dreData.despesas.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aging Tab */}
        <TabsContent value="aging" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aging de Recebíveis</CardTitle>
              <CardDescription>Distribuição de valores por faixa de vencimento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agingData.map(item => (
                  <div key={item.range} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium">{item.range}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className={`h-6 rounded ${item.color}`}
                          style={{ width: `${(item.amount / 50000) * 100}%`, minWidth: '4px' }}
                        />
                        <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                        <Badge variant="outline" className="text-xs">{item.count} títulos</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                Ranking por Cliente
              </CardTitle>
              <CardDescription>Quem dá mais lucro, quem atrasa, quem consome mais custo</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Cliente</TableHead>
                    <TableHead className="font-semibold">Receita</TableHead>
                    <TableHead className="font-semibold">Despesa</TableHead>
                    <TableHead className="font-semibold">Lucro</TableHead>
                    <TableHead className="font-semibold">Atraso Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientRanking.map((client, idx) => (
                    <TableRow key={client.name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {idx + 1}
                          </span>
                          {client.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-emerald-600 font-medium">{formatCurrency(client.revenue)}</TableCell>
                      <TableCell className="text-rose-600">{formatCurrency(client.expenses)}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(client.profit)}</TableCell>
                      <TableCell>
                        <Badge className={client.delay === 0 ? 'bg-emerald-100 text-emerald-700' : client.delay <= 7 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}>
                          {client.delay === 0 ? 'Em dia' : `${client.delay} dias`}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Comparativo Mensal
              </CardTitle>
              <CardDescription>Crescimento e sazonalidade - últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="receitas" name="Receitas" fill="#10b981" />
                    <Bar dataKey="despesas" name="Despesas" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
