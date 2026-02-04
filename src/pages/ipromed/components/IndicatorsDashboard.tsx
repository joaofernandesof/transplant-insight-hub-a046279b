/**
 * CPG Advocacia Médica - Dashboard de Indicadores Completo
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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Indicadores</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Métricas e análises do escritório
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full sm:w-[160px]">
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

      {/* KPI Cards - Scroll horizontal no mobile */}
      <div className="overflow-x-auto -mx-2 px-2 pb-2 sm:overflow-visible sm:mx-0 sm:px-0">
        <div className="flex gap-3 sm:grid sm:grid-cols-3 lg:grid-cols-6 min-w-max sm:min-w-0">
          <Card className="border-0 shadow-sm min-w-[140px] sm:min-w-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Clientes Ativos</div>
                  <div className="text-xl sm:text-2xl font-bold">{activeClients}</div>
                  <div className="flex items-center text-[10px] sm:text-xs text-emerald-600 mt-0.5">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>+12%</span>
                  </div>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm min-w-[140px] sm:min-w-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Processos Ativos</div>
                  <div className="text-xl sm:text-2xl font-bold">{activeCases}</div>
                  <div className="flex items-center text-[10px] sm:text-xs text-emerald-600 mt-0.5">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>+5%</span>
                  </div>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <Gavel className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm min-w-[140px] sm:min-w-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Taxa de Sucesso</div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                    {totalCases > 0 ? Math.round((wonCases / (wonCases + lostCases || 1)) * 100) : 0}%
                  </div>
                  <div className="flex items-center text-[10px] sm:text-xs text-emerald-600 mt-0.5">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>+8%</span>
                  </div>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm min-w-[140px] sm:min-w-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Prazos Cumpridos</div>
                  <div className="text-xl sm:text-2xl font-bold">
                    {deadlinesTotal > 0 ? Math.round((deadlinesMet / deadlinesTotal) * 100) : 100}%
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    {deadlinesMet}/{deadlinesTotal}
                  </div>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm min-w-[140px] sm:min-w-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Recebido</div>
                  <div className="text-lg sm:text-xl font-bold text-emerald-600">
                    {formatCurrency(totalReceived)}
                  </div>
                  <div className="flex items-center text-[10px] sm:text-xs text-emerald-600 mt-0.5">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>+15%</span>
                  </div>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm min-w-[140px] sm:min-w-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-xs text-muted-foreground truncate">A Receber</div>
                  <div className="text-lg sm:text-xl font-bold text-amber-600">
                    {formatCurrency(totalPending)}
                  </div>
                  {totalOverdue > 0 && (
                    <div className="flex items-center text-[10px] sm:text-xs text-rose-600 mt-0.5">
                      <AlertTriangle className="h-3 w-3 mr-0.5" />
                      <span className="truncate">{formatCurrency(totalOverdue)}</span>
                    </div>
                  )}
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs - Scroll horizontal no mobile */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto -mx-2 px-2 sm:overflow-visible sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-auto">
            <TabsTrigger value="geral" className="text-xs sm:text-sm">Visão Geral</TabsTrigger>
            <TabsTrigger value="processos" className="text-xs sm:text-sm">Processos</TabsTrigger>
            <TabsTrigger value="financeiro" className="text-xs sm:text-sm">Financeiro</TabsTrigger>
            <TabsTrigger value="clientes" className="text-xs sm:text-sm">Clientes</TabsTrigger>
            <TabsTrigger value="produtividade" className="text-xs sm:text-sm">Produtividade</TabsTrigger>
          </TabsList>
        </div>

        {/* Visão Geral */}
        <TabsContent value="geral" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Processos por Status */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg">Processos por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] sm:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={casesByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {casesByStatus.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Processos']} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Processos por Tipo */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg">Processos por Área</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] sm:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={casesByType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
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
              <CardTitle className="text-base sm:text-lg">Evolução Financeira</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financialTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value)]}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
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
