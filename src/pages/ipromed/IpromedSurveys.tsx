/**
 * IPROMED Surveys - Pesquisas de Satisfação Jurídica
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  FileText, 
  Users,
  CheckCircle2,
  Clock,
  BarChart3,
  Loader2,
  PieChart,
} from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function IpromedSurveys() {
  const navigate = useNavigate();

  // Fetch survey statistics
  const { data, isLoading } = useQuery({
    queryKey: ['ipromed-surveys'],
    queryFn: async () => {
      // Day 2 surveys (contains legal questions)
      const { data: day2Surveys, error } = await supabase
        .from('day2_satisfaction_surveys')
        .select('id, user_id, is_completed, completed_at, created_at, q18_legal_feeling, score_legal, lead_classification');
      
      if (error) throw error;

      // Calculate stats
      const completed = day2Surveys?.filter(s => s.is_completed) || [];
      const pending = day2Surveys?.filter(s => !s.is_completed) || [];

      // Feeling distribution
      const feelingDist: Record<string, number> = {};
      completed.forEach(s => {
        if (s.q18_legal_feeling) {
          const key = normalizeFeeling(s.q18_legal_feeling);
          feelingDist[key] = (feelingDist[key] || 0) + 1;
        }
      });

      // Lead classification distribution
      const leadDist = {
        hot: completed.filter(s => s.lead_classification === 'hot').length,
        warm: completed.filter(s => s.lead_classification === 'warm').length,
        cold: completed.filter(s => s.lead_classification === 'cold').length,
      };

      return {
        total: day2Surveys?.length || 0,
        completed: completed.length,
        pending: pending.length,
        completionRate: day2Surveys && day2Surveys.length > 0 
          ? (completed.length / day2Surveys.length) * 100 
          : 0,
        feelingDist,
        leadDist,
        avgScore: completed.length > 0 
          ? completed.reduce((sum, s) => sum + (s.score_legal || 0), 0) / completed.length 
          : 0,
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Format data for charts
  const feelingData = Object.entries(data?.feelingDist || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const leadData = [
    { name: 'HOT', value: data?.leadDist.hot || 0, color: '#ef4444' },
    { name: 'WARM', value: data?.leadDist.warm || 0, color: '#f59e0b' },
    { name: 'COLD', value: data?.leadDist.cold || 0, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/ipromed')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          IPROMED
        </Button>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-medium">Pesquisas</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pesquisas Jurídicas</h1>
          <p className="text-muted-foreground">
            Análise das pesquisas de satisfação do módulo jurídico
          </p>
        </div>
        <Button onClick={() => navigate('/ipromed/dashboard')}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Ver Dashboard Completo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{data?.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completas</p>
                <p className="text-2xl font-bold">{data?.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{data?.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <PieChart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score Médio</p>
                <p className="text-2xl font-bold">{data?.avgScore.toFixed(1)}/18</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Conclusão</CardTitle>
          <CardDescription>Porcentagem de pesquisas finalizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>{data?.completed} de {data?.total} pesquisas</span>
              <span className="font-medium">{data?.completionRate.toFixed(0)}%</span>
            </div>
            <Progress value={data?.completionRate} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Feeling Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sentimento Jurídico</CardTitle>
            <CardDescription>Como os alunos se sentem em relação à segurança jurídica</CardDescription>
          </CardHeader>
          <CardContent>
            {feelingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPie>
                  <Pie
                    data={feelingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {feelingData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Classification */}
        <Card>
          <CardHeader>
            <CardTitle>Classificação de Leads</CardTitle>
            <CardDescription>Distribuição por interesse em serviços jurídicos</CardDescription>
          </CardHeader>
          <CardContent>
            {leadData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPie>
                  <Pie
                    data={leadData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {leadData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function
function normalizeFeeling(val: string): string {
  const v = val.toLowerCase();
  if (v.includes('exposto') || v.includes('risco')) return 'Exposto a riscos';
  if (v.includes('inseguro') && v.includes('alguns')) return 'Inseguro em pontos';
  if (v.includes('pouco inseguro')) return 'Um pouco inseguro';
  if (v.includes('tranquilo') || v.includes('seguro')) return 'Tranquilo e seguro';
  return 'Outro';
}
