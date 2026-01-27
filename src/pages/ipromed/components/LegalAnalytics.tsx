/**
 * IPROMED Legal Hub - Indicadores Estratégicos
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  Gavel,
  Users,
  Download,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Scale,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

const casesByType = [
  { type: 'Erro Médico', count: 12, value: 1800000 },
  { type: 'Contratual', count: 8, value: 450000 },
  { type: 'Trabalhista', count: 5, value: 320000 },
  { type: 'Cobrança', count: 7, value: 180000 },
  { type: 'Outros', count: 3, value: 95000 },
];

const contractsByStatus = [
  { name: 'Ativos', value: 145, color: '#10b981' },
  { name: 'Pendentes', value: 23, color: '#f59e0b' },
  { name: 'Vencendo', value: 12, color: '#ef4444' },
  { name: 'Rascunho', value: 8, color: '#6b7280' },
];

const slaPerformance = [
  { month: 'Set', contratos: 92, solicitacoes: 88, processos: 95 },
  { month: 'Out', contratos: 89, solicitacoes: 85, processos: 92 },
  { month: 'Nov', contratos: 94, solicitacoes: 90, processos: 88 },
  { month: 'Dez', contratos: 91, solicitacoes: 92, processos: 94 },
  { month: 'Jan', contratos: 93, solicitacoes: 87, processos: 96 },
];

const tasksByLawyer = [
  { name: 'Dr. Carlos', concluidas: 24, pendentes: 8, emAndamento: 5 },
  { name: 'Dra. Ana', concluidas: 18, pendentes: 4, emAndamento: 7 },
  { name: 'Dra. Marina', concluidas: 15, pendentes: 6, emAndamento: 3 },
  { name: 'Dr. Roberto', concluidas: 12, pendentes: 3, emAndamento: 4 },
];

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: string; isPositive: boolean };
  color?: string;
}

const KPICard = ({ title, value, subtitle, icon: Icon, trend, color = "text-primary" }: KPICardProps) => (
  <Card className="border-none shadow-md">
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-muted`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          {trend.isPositive ? (
            <TrendingUp className="h-3 w-3 text-emerald-600" />
          ) : (
            <TrendingDown className="h-3 w-3 text-rose-600" />
          )}
          <span className={`text-xs ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.value}
          </span>
          <span className="text-xs text-muted-foreground">vs mês anterior</span>
        </div>
      )}
    </CardContent>
  </Card>
);

export default function LegalAnalytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            Indicadores Estratégicos
          </h2>
          <p className="text-muted-foreground">Performance e métricas do departamento jurídico</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="30d">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Tempo Médio Resolução"
          value="18 dias"
          subtitle="Processos contenciosos"
          icon={Timer}
          trend={{ value: '-3 dias', isPositive: true }}
          color="text-blue-600"
        />
        <KPICard
          title="SLA de Contratos"
          value="93%"
          subtitle="Dentro do prazo"
          icon={Target}
          trend={{ value: '+2%', isPositive: true }}
          color="text-emerald-600"
        />
        <KPICard
          title="Provisão Contenciosa"
          value="R$ 2.8M"
          subtitle="Total provisionado"
          icon={Scale}
          trend={{ value: '-5%', isPositive: true }}
          color="text-amber-600"
        />
        <KPICard
          title="Taxa de Êxito"
          value="78%"
          subtitle="Processos favoráveis"
          icon={CheckCircle2}
          trend={{ value: '+4%', isPositive: true }}
          color="text-purple-600"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cases by Type */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gavel className="h-5 w-5 text-blue-600" />
              Processos por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={casesByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="type" width={100} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'count') return [value, 'Processos'];
                    return [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Valor'];
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Contracts by Status */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Contratos por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={contractsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {contractsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {contractsByStatus.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SLA Performance */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Performance de SLA (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={slaPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[80, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="contratos" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="solicitacoes" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="processos" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tasks by Lawyer */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-600" />
              Carga por Advogado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={tasksByLawyer}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="concluidas" stackId="a" fill="#10b981" name="Concluídas" />
                <Bar dataKey="emAndamento" stackId="a" fill="#3b82f6" name="Em Andamento" />
                <Bar dataKey="pendentes" stackId="a" fill="#f59e0b" name="Pendentes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Risk Overview */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            Visão de Riscos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Risco Baixo</span>
                <span className="font-medium text-emerald-600">15 casos</span>
              </div>
              <Progress value={42} className="h-2 bg-emerald-100" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Risco Médio</span>
                <span className="font-medium text-amber-600">12 casos</span>
              </div>
              <Progress value={34} className="h-2 bg-amber-100" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Risco Alto</span>
                <span className="font-medium text-orange-600">6 casos</span>
              </div>
              <Progress value={17} className="h-2 bg-orange-100" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Risco Crítico</span>
                <span className="font-medium text-rose-600">2 casos</span>
              </div>
              <Progress value={6} className="h-2 bg-rose-100" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
