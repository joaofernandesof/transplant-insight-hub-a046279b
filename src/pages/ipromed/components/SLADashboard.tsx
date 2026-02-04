/**
 * CPG Advocacia Médica - SLA Dashboard
 * Dashboard de produtividade e métricas de SLA por advogada
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Calendar,
  Target,
  Award,
  Timer,
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
} from "recharts";
import { ipromedTeam } from "./IpromedTeamProfiles";

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1'];

// Mock SLA metrics - would come from real data
const slaMetrics = {
  resposta_inicial: { target: 24, unit: 'horas', label: 'Resposta Inicial' },
  retorno_cliente: { target: 48, unit: 'horas', label: 'Retorno ao Cliente' },
  entrega_documento: { target: 72, unit: 'horas', label: 'Entrega de Documento' },
  protocolo_prazo: { target: 99, unit: '%', label: 'Protocolo no Prazo' },
  atualizacao_caso: { target: 7, unit: 'dias', label: 'Atualização do Caso' },
};

export default function SLADashboard() {
  const [period, setPeriod] = useState('month');
  const [selectedAttorney, setSelectedAttorney] = useState('all');

  // Fetch real data
  const { data: cases = [] } = useQuery({
    queryKey: ['ipromed-cases-sla'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ipromed_legal_cases')
        .select('id, status, case_type, created_at, updated_at');
      return data || [];
    },
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['ipromed-appointments-sla'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ipromed_appointments')
        .select('id, status, start_datetime, created_at');
      return data || [];
    },
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['ipromed-documents-sla'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ipromed_ai_documents')
        .select('id, generation_status, created_at');
      return data || [];
    },
  });

  // Calculate metrics per attorney
  const attorneyMetrics = ipromedTeam.map((attorney, idx) => {
    // Distribute cases among attorneys for demo
    const attorneyCasesCount = Math.floor(cases.length / 3) + (idx === 0 ? cases.length % 3 : 0);
    
    return {
      id: attorney.id,
      name: attorney.name,
      role: attorney.role,
      avatar: attorney.name.split(' ').map(n => n[0]).join(''),
      casesActive: Math.floor(attorneyCasesCount * 0.6),
      casesTotal: attorneyCasesCount,
      slaCompliance: Math.floor(85 + Math.random() * 15), // Simulated
      avgResponseTime: Math.floor(12 + Math.random() * 24), // hours
      documentsGenerated: Math.floor(5 + Math.random() * 20),
      deadlinesMet: Math.floor(90 + Math.random() * 10),
    };
  });

  // Overall metrics
  const totalCases = cases.length;
  const activeCases = cases.filter((c: any) => c.status === 'active').length;
  const closedCases = cases.filter((c: any) => c.status === 'closed').length;
  const totalDocuments = documents.length;
  
  // SLA compliance data for charts
  const slaComplianceData = [
    { name: 'Resposta Inicial', compliance: 94, target: 95 },
    { name: 'Retorno Cliente', compliance: 88, target: 90 },
    { name: 'Entrega Doc', compliance: 92, target: 90 },
    { name: 'Protocolo Prazo', compliance: 98, target: 99 },
    { name: 'Atualização', compliance: 85, target: 85 },
  ];

  const weeklyTrendData = [
    { week: 'Sem 1', sla: 89, casos: 12 },
    { week: 'Sem 2', sla: 92, casos: 15 },
    { week: 'Sem 3', sla: 88, casos: 18 },
    { week: 'Sem 4', sla: 95, casos: 14 },
  ];

  const caseDistribution = [
    { name: 'Ético', value: cases.filter((c: any) => c.case_type === 'etico').length || 3 },
    { name: 'Cível', value: cases.filter((c: any) => c.case_type === 'civel').length || 8 },
    { name: 'Criminal', value: cases.filter((c: any) => c.case_type === 'criminal').length || 2 },
    { name: 'Administrativo', value: cases.filter((c: any) => c.case_type === 'administrativo').length || 4 },
  ];

  return (
    <div className="space-y-6 px-4 lg:px-0">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            Dashboard de SLA e Produtividade
          </h1>
          <p className="text-xs lg:text-sm text-muted-foreground">
            Métricas de atendimento e desempenho da equipe
          </p>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <Select value={selectedAttorney} onValueChange={setSelectedAttorney}>
            <SelectTrigger className="w-[140px] lg:w-[180px]">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Advogada" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas</SelectItem>
              {ipromedTeam.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name.split(' ')[0]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px] lg:w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards - Scroll horizontal no mobile */}
      <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
        <div className="flex lg:grid lg:grid-cols-5 gap-3 lg:gap-4 min-w-max lg:min-w-0">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 min-w-[140px] lg:min-w-0">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] lg:text-xs text-blue-700">Tempo Médio Resposta</div>
                  <div className="text-xl lg:text-2xl font-bold text-blue-800">18h</div>
                  <div className="flex items-center text-[10px] lg:text-xs text-emerald-600">
                    <TrendingDown className="h-3 w-3" />
                    <span>-12% vs meta</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100 min-w-[140px] lg:min-w-0">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] lg:text-xs text-emerald-700">SLA Cumprido</div>
                  <div className="text-xl lg:text-2xl font-bold text-emerald-800">94%</div>
                  <div className="flex items-center text-[10px] lg:text-xs text-emerald-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>+3% vs mês anterior</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 min-w-[140px] lg:min-w-0">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <FileText className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] lg:text-xs text-purple-700">Documentos Gerados</div>
                  <div className="text-xl lg:text-2xl font-bold text-purple-800">{totalDocuments}</div>
                  <div className="flex items-center text-[10px] lg:text-xs text-emerald-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>+28 este mês</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100 min-w-[140px] lg:min-w-0">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Timer className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] lg:text-xs text-amber-700">Prazos no Prazo</div>
                  <div className="text-xl lg:text-2xl font-bold text-amber-800">98%</div>
                  <div className="text-[10px] lg:text-xs text-muted-foreground">
                    47/48 prazos
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-rose-100 min-w-[140px] lg:min-w-0">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg bg-rose-500 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] lg:text-xs text-rose-700">Alertas Pendentes</div>
                  <div className="text-xl lg:text-2xl font-bold text-rose-800">3</div>
                  <div className="text-[10px] lg:text-xs text-rose-600">
                    2 urgentes
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* SLA Compliance */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base lg:text-lg">Compliance por Métrica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] lg:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={slaComplianceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="compliance" fill="#10B981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="target" fill="#E5E7EB" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base lg:text-lg">Tendência Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] lg:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" domain={[80, 100]} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="sla" 
                    name="SLA %"
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981' }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="casos" 
                    name="Novos Casos"
                    stroke="#6366F1" 
                    strokeWidth={2}
                    dot={{ fill: '#6366F1' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-base lg:text-lg flex items-center gap-2">
            <Award className="h-4 w-4 lg:h-5 lg:w-5 text-amber-500" />
            Desempenho da Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {attorneyMetrics.map((attorney) => (
              <Card key={attorney.id} className="border shadow-sm">
                <CardContent className="p-3 lg:p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 lg:h-12 lg:w-12">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {attorney.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm lg:text-base truncate">{attorney.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{attorney.role}</div>
                      
                      <div className="mt-2 lg:mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">SLA</span>
                          <Badge className={
                            attorney.slaCompliance >= 90 
                              ? "bg-emerald-100 text-emerald-700"
                              : attorney.slaCompliance >= 80
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                          }>
                            {attorney.slaCompliance}%
                          </Badge>
                        </div>
                        <Progress value={attorney.slaCompliance} className="h-1.5" />
                        
                        <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <div className="font-semibold">{attorney.casesActive}</div>
                            <div className="text-muted-foreground">Casos</div>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <div className="font-semibold">{attorney.documentsGenerated}</div>
                            <div className="text-muted-foreground">Docs</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
