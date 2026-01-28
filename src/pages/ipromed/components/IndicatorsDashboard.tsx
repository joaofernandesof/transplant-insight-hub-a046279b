/**
 * IPROMED - Dashboard de Indicadores Completo
 * Indicadores pessoais, por cliente, processos e estratégicos
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Users,
  Gavel,
  Clock,
  DollarSign,
  Target,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  FileText,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const COLORS = ['#0066CC', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function IndicatorsDashboard() {
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('geral');

  // Fetch all data for indicators
  const { data: cases = [] } = useQuery({
    queryKey: ['ipromed-cases-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ipromed_legal_cases')
        .select('id, status, case_type, risk_level, created_at');
      return data || [];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['ipromed-clients-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ipromed_legal_clients')
        .select('id, name, client_type, status, created_at');
      return data || [];
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['ipromed-invoices-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ipromed_invoices')
        .select('id, amount, status, due_date, paid_at, created_at');
      return data || [];
    },
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['ipromed-appointments-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ipromed_appointments')
        .select('id, appointment_type, status, start_datetime');
      return data || [];
    },
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['ipromed-movements-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ipromed_case_movements')
        .select('id, has_deadline, deadline_completed, deadline_date, created_at');
      return data || [];
    },
  });

  // Calculate metrics
  const totalCases = cases.length;
  const activeCases = cases.filter(c => c.status === 'active').length;
  const wonCases = cases.filter(c => c.status === 'closed').length;
  const lostCases = cases.filter(c => c.status === 'suspended').length;
  
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'ativo').length;
  
  const totalBilled = invoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalReceived = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + Number(i.amount || 0), 0);
  
  const deadlinesTotal = movements.filter(m => m.has_deadline).length;
  const deadlinesMet = movements.filter(m => m.has_deadline && m.deadline_completed).length;
  const deadlinesMissed = movements.filter(m => 
    m.has_deadline && !m.deadline_completed && m.deadline_date && new Date(m.deadline_date) < new Date()
  ).length;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Chart data
  const casesByStatus = [
    { name: 'Ativos', value: activeCases, color: '#0066CC' },
    { name: 'Encerrados', value: wonCases, color: '#10B981' },
    { name: 'Suspensos', value: lostCases, color: '#EF4444' },
    { name: 'Arquivados', value: cases.filter(c => c.status === 'archived').length, color: '#6B7280' },
  ];

  const casesByType = [
    { name: 'Cível', value: cases.filter(c => c.case_type === 'civel').length },
    { name: 'Trabalhista', value: cases.filter(c => c.case_type === 'trabalhista').length },
    { name: 'Criminal', value: cases.filter(c => c.case_type === 'criminal').length },
    { name: 'Administrativo', value: cases.filter(c => c.case_type === 'administrativo').length },
    { name: 'Consultivo', value: cases.filter(c => c.case_type === 'consultivo').length },
  ];

  const financialTrend = [
    { month: 'Jan', faturado: 45000, recebido: 38000 },
    { month: 'Fev', faturado: 52000, recebido: 45000 },
    { month: 'Mar', faturado: 48000, recebido: 50000 },
    { month: 'Abr', faturado: 61000, recebido: 55000 },
    { month: 'Mai', faturado: 55000, recebido: 48000 },
    { month: 'Jun', faturado: 67000, recebido: 62000 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Indicadores</h1>
          <p className="text-sm text-muted-foreground">
            Métricas e análises do escritório
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[160px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="quarter">Este Trimestre</SelectItem>
            <SelectItem value="year">Este Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Clientes Ativos</div>
                <div className="text-2xl font-bold">{activeClients}</div>
                <div className="flex items-center text-xs text-emerald-600 mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+12%</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Processos Ativos</div>
                <div className="text-2xl font-bold">{activeCases}</div>
                <div className="flex items-center text-xs text-emerald-600 mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+5%</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Gavel className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Taxa de Sucesso</div>
                <div className="text-2xl font-bold text-emerald-600">
                  {totalCases > 0 ? Math.round((wonCases / (wonCases + lostCases || 1)) * 100) : 0}%
                </div>
                <div className="flex items-center text-xs text-emerald-600 mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+8%</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Prazos Cumpridos</div>
                <div className="text-2xl font-bold">
                  {deadlinesTotal > 0 ? Math.round((deadlinesMet / deadlinesTotal) * 100) : 100}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {deadlinesMet}/{deadlinesTotal}
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Recebido</div>
                <div className="text-xl font-bold text-emerald-600">
                  {formatCurrency(totalReceived)}
                </div>
                <div className="flex items-center text-xs text-emerald-600 mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+15%</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">A Receber</div>
                <div className="text-xl font-bold text-amber-600">
                  {formatCurrency(totalPending)}
                </div>
                {totalOverdue > 0 && (
                  <div className="flex items-center text-xs text-rose-600 mt-1">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    <span>{formatCurrency(totalOverdue)} vencido</span>
                  </div>
                )}
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="processos">Processos</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="produtividade">Produtividade</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="geral" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Processos por Status */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Processos por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={casesByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {casesByStatus.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Processos']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Processos por Tipo */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Processos por Área</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={casesByType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0066CC" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Evolução Financeira */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Evolução Financeira</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financialTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value)]}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="faturado" 
                      name="Faturado"
                      stroke="#0066CC" 
                      fill="#0066CC" 
                      fillOpacity={0.3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="recebido" 
                      name="Recebido"
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processos */}
        <TabsContent value="processos" className="space-y-6 mt-6">
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm bg-blue-50">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{totalCases}</div>
                <div className="text-sm text-blue-600">Total de Processos</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-emerald-50">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-emerald-600">{wonCases}</div>
                <div className="text-sm text-emerald-600">Ganhos</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-rose-50">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-rose-600">{lostCases}</div>
                <div className="text-sm text-rose-600">Perdidos</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-amber-50">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-amber-600">{deadlinesMissed}</div>
                <div className="text-sm text-amber-600">Prazos Perdidos</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Risco dos Processos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['baixo', 'medio', 'alto', 'critico'].map((risk) => {
                  const count = cases.filter(c => c.risk_level === risk).length;
                  const percentage = totalCases > 0 ? (count / totalCases) * 100 : 0;
                  const colors: Record<string, string> = {
                    baixo: 'bg-emerald-500',
                    medio: 'bg-amber-500',
                    alto: 'bg-orange-500',
                    critico: 'bg-rose-500',
                  };
                  return (
                    <div key={risk}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{risk}</span>
                        <span>{count} processos ({percentage.toFixed(0)}%)</span>
                      </div>
                      <Progress value={percentage} className={`h-2 ${colors[risk]}`} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financeiro */}
        <TabsContent value="financeiro" className="space-y-6 mt-6">
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Faturado</div>
                <div className="text-2xl font-bold">{formatCurrency(totalBilled)}</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-emerald-50">
              <CardContent className="p-4">
                <div className="text-sm text-emerald-600">Recebido</div>
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalReceived)}</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-amber-50">
              <CardContent className="p-4">
                <div className="text-sm text-amber-600">Pendente</div>
                <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-rose-50">
              <CardContent className="p-4">
                <div className="text-sm text-rose-600">Vencido</div>
                <div className="text-2xl font-bold text-rose-600">{formatCurrency(totalOverdue)}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Taxa de Adimplência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <Progress 
                    value={totalBilled > 0 ? (totalReceived / totalBilled) * 100 : 0} 
                    className="h-4"
                  />
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  {totalBilled > 0 ? Math.round((totalReceived / totalBilled) * 100) : 0}%
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clientes */}
        <TabsContent value="clientes" className="space-y-6 mt-6">
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold">{totalClients}</div>
                <div className="text-sm text-muted-foreground">Total de Clientes</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-emerald-50">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-emerald-600">{activeClients}</div>
                <div className="text-sm text-emerald-600">Ativos</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-blue-50">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {clients.filter(c => c.client_type === 'pf').length}
                </div>
                <div className="text-sm text-blue-600">Pessoa Física</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Produtividade */}
        <TabsContent value="produtividade" className="space-y-6 mt-6">
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold">{appointments.length}</div>
                <div className="text-sm text-muted-foreground">Compromissos</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold">
                  {appointments.filter(a => a.appointment_type === 'audiencia').length}
                </div>
                <div className="text-sm text-muted-foreground">Audiências</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold">{movements.length}</div>
                <div className="text-sm text-muted-foreground">Andamentos</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold">0h</div>
                <div className="text-sm text-muted-foreground">Horas Registradas</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
