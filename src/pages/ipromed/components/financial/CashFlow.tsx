/**
 * IPROMED Financial - Fluxo de Caixa
 * Visão diária e projeções financeiras
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Calendar,
  Users,
  Briefcase,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

// Generate mock daily data
const generateDailyData = () => {
  const start = startOfMonth(new Date());
  const end = endOfMonth(new Date());
  const days = eachDayOfInterval({ start, end });
  
  let balance = 150000;
  
  return days.map((day, i) => {
    const entries = Math.random() * 15000 + 2000;
    const exits = Math.random() * 10000 + 1500;
    balance = balance + entries - exits;
    
    return {
      date: format(day, 'dd/MM'),
      entradas: Math.round(entries),
      saidas: Math.round(exits),
      saldo: Math.round(balance),
    };
  });
};

const dailyData = generateDailyData();

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const upcomingEntries = [
  { id: '1', description: 'Honorários - Dr. João Silva', amount: 5000, date: '2026-02-05', client: 'Dr. João Silva' },
  { id: '2', description: 'Mensalidade - Hospital XYZ', amount: 8500, date: '2026-02-10', client: 'Hospital XYZ' },
  { id: '3', description: 'Parecer - Clínica ABC', amount: 2500, date: '2026-02-12', client: 'Clínica ABC' },
];

const upcomingExits = [
  { id: '1', description: 'Pró-labore', amount: 15000, date: '2026-01-30', type: 'Recorrente' },
  { id: '2', description: 'Aluguel', amount: 4500, date: '2026-02-01', type: 'Recorrente' },
  { id: '3', description: 'Perito - Processo 001', amount: 3500, date: '2026-02-05', type: 'Avulso' },
];

const stats = {
  currentBalance: 156000,
  projectedBalance: 198500,
  monthEntries: 85000,
  monthExits: 42500,
  variation: 12.5,
};

export default function CashFlow() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Fluxo de Caixa
        </h2>
        <p className="text-sm text-muted-foreground">
          Visão diária e projeções para decidir contratações, investimentos e distribuição de lucros
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Saldo Atual</p>
                <p className="text-2xl font-bold text-blue-800">{formatCurrency(stats.currentBalance)}</p>
              </div>
              <Wallet className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700">Saldo Previsto (30d)</p>
                <p className="text-2xl font-bold text-emerald-800">{formatCurrency(stats.projectedBalance)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entradas (Mês)</p>
                <p className="text-xl font-bold text-emerald-600">{formatCurrency(stats.monthEntries)}</p>
              </div>
              <ArrowDownLeft className="h-6 w-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saídas (Mês)</p>
                <p className="text-xl font-bold text-rose-600">{formatCurrency(stats.monthExits)}</p>
              </div>
              <ArrowUpRight className="h-6 w-6 text-rose-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução do Saldo - {format(new Date(), 'MMMM yyyy', { locale: ptBR })}</CardTitle>
          <CardDescription>Saldo diário projetado com entradas e saídas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis 
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Dia ${label}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="saldo" 
                  name="Saldo"
                  stroke="#3b82f6" 
                  fill="#93c5fd"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Entries & Exits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-700">
              <ArrowDownLeft className="h-5 w-5" />
              Entradas Previstas (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEntries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{entry.description}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(entry.date), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <span className="font-bold text-emerald-600">{formatCurrency(entry.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-rose-700">
              <ArrowUpRight className="h-5 w-5" />
              Saídas Previstas (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingExits.map(exit => (
                <div key={exit.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{exit.description}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(exit.date), "dd/MM/yyyy")}
                      <Badge variant="outline" className="ml-2 text-[10px]">{exit.type}</Badge>
                    </p>
                  </div>
                  <span className="font-bold text-rose-600">{formatCurrency(exit.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            Insights e Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-amber-900">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">•</span>
              <span>O saldo projetado permite considerar <strong>1 nova contratação</strong> mantendo margem de segurança de 3 meses.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">•</span>
              <span>Honorários de êxito previstos: <strong>{formatCurrency(25000)}</strong> no próximo trimestre.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">•</span>
              <span>Distribuição de lucros segura: até <strong>{formatCurrency(stats.currentBalance * 0.3)}</strong> este mês.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
