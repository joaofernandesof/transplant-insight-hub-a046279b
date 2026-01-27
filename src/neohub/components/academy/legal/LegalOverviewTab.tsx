/**
 * Legal Module - Overview Tab
 * Contains 10+ charts with executive insights
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from "recharts";
import {
  Users,
  TrendingUp,
  GraduationCap,
  FileText,
  Scale,
  Flame,
  Thermometer,
  Snowflake,
  AlertTriangle,
  CheckCircle2,
  Target,
  BarChart3,
  Shield,
  Activity
} from "lucide-react";
import { LegalWidgetInsight, generateLarisaOverallInsight, generateLeadsInsight, generateExamInsight, generateFeelingInsight } from "../LegalWidgetInsight";
import type { LarissaMetrics, LegalPerception, ExamMetrics, StudentWithScores } from "./types";

interface LegalOverviewTabProps {
  larisaMetrics: LarissaMetrics | null;
  legalPerception: LegalPerception | null;
  examMetrics: ExamMetrics | null;
  students: StudentWithScores[];
}

export function LegalOverviewTab({ larisaMetrics, legalPerception, examMetrics, students }: LegalOverviewTabProps) {
  // Radar data for instructor
  const radarData = larisaMetrics ? [
    { dimension: 'Expectativas', value: larisaMetrics.expectations, fullMark: 10 },
    { dimension: 'Clareza', value: larisaMetrics.clarity, fullMark: 10 },
    { dimension: 'Tempo', value: larisaMetrics.time, fullMark: 10 },
  ] : [];

  // Leads distribution
  const leadsChartData = legalPerception ? [
    { name: 'HOT', value: legalPerception.leads.hot, color: '#ef4444' },
    { name: 'WARM', value: legalPerception.leads.warm, color: '#f59e0b' },
    { name: 'COLD', value: legalPerception.leads.cold, color: '#3b82f6' },
  ] : [];

  // Feeling distribution
  const feelingChartData = legalPerception ? Object.entries(legalPerception.feelingDist).map(([name, value]) => ({
    name,
    value,
    color: name.includes('Exposto') ? '#ef4444' : name.includes('Inseguro') ? '#f59e0b' : '#10b981'
  })) : [];

  // Influence distribution
  const influenceData = legalPerception ? Object.entries(legalPerception.influenceDist).map(([name, value]) => ({
    name,
    value,
    color: name.includes('Travaram') ? '#ef4444' : name.includes('bastante') ? '#f59e0b' : '#10b981'
  })) : [];

  // Timing distribution
  const timingData = legalPerception ? Object.entries(legalPerception.timingDist).map(([name, value]) => ({
    name,
    value,
    color: name.includes('quanto antes') || name.includes('O quanto antes') ? '#ef4444' : name.includes('meses') ? '#f59e0b' : '#3b82f6'
  })) : [];

  // Score distribution histogram
  const scoreDistribution = students.reduce((acc, s) => {
    const bucket = s.scoreLegal >= 15 ? '15-18' : s.scoreLegal >= 12 ? '12-14' : s.scoreLegal >= 9 ? '9-11' : s.scoreLegal >= 6 ? '6-8' : '0-5';
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const histogramData = [
    { range: '0-5', count: scoreDistribution['0-5'] || 0, color: '#3b82f6' },
    { range: '6-8', count: scoreDistribution['6-8'] || 0, color: '#06b6d4' },
    { range: '9-11', count: scoreDistribution['9-11'] || 0, color: '#f59e0b' },
    { range: '12-14', count: scoreDistribution['12-14'] || 0, color: '#f97316' },
    { range: '15-18', count: scoreDistribution['15-18'] || 0, color: '#ef4444' },
  ];

  // Exam performance distribution
  const examDistribution = examMetrics ? [
    { range: '0-50%', value: students.filter(s => (s.examScore || 0) < 50).length, color: '#ef4444' },
    { range: '50-69%', value: students.filter(s => (s.examScore || 0) >= 50 && (s.examScore || 0) < 70).length, color: '#f59e0b' },
    { range: '70-89%', value: students.filter(s => (s.examScore || 0) >= 70 && (s.examScore || 0) < 90).length, color: '#22c55e' },
    { range: '90-100%', value: students.filter(s => (s.examScore || 0) >= 90).length, color: '#10b981' },
  ] : [];

  // Comparison radar (Larissa vs Caroline placeholder)
  const comparisonRadar = larisaMetrics ? [
    { dimension: 'Expectativas', Larissa: larisaMetrics.expectations, Caroline: 7.5 },
    { dimension: 'Clareza', Larissa: larisaMetrics.clarity, Caroline: 7.8 },
    { dimension: 'Tempo', Larissa: larisaMetrics.time, Caroline: 6.5 },
  ] : [];

  // Summary KPIs
  const kpis = {
    totalStudents: students.length,
    avgScore: students.length > 0 ? students.reduce((a, s) => a + s.scoreLegal, 0) / students.length : 0,
    hotPercentage: legalPerception ? Math.round((legalPerception.leads.hot / legalPerception.total) * 100) : 0,
    insecurePercentage: legalPerception ? Math.round(
      ((legalPerception.feelingDist['Exposto a riscos'] || 0) + 
       (legalPerception.feelingDist['Inseguro em pontos'] || 0) + 
       (legalPerception.feelingDist['Um pouco inseguro'] || 0)) / 
      legalPerception.total * 100
    ) : 0,
    examAvg: examMetrics?.average || 0,
    approvalRate: examMetrics?.approvalRate || 0,
  };

  return (
    <div className="space-y-6">
      {/* Row 1: Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="text-center">
          <CardContent className="pt-4">
            <Users className="h-5 w-5 mx-auto text-violet-500 mb-1" />
            <p className="text-2xl font-bold">{kpis.totalStudents}</p>
            <p className="text-xs text-muted-foreground">Total Alunos</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <Scale className="h-5 w-5 mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold">{(kpis.avgScore * 10 / 18).toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Score Médio</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <Flame className="h-5 w-5 mx-auto text-rose-500 mb-1" />
            <p className="text-2xl font-bold">{kpis.hotPercentage}%</p>
            <p className="text-xs text-muted-foreground">Leads HOT</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <AlertTriangle className="h-5 w-5 mx-auto text-orange-500 mb-1" />
            <p className="text-2xl font-bold">{kpis.insecurePercentage}%</p>
            <p className="text-xs text-muted-foreground">Inseguros</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <GraduationCap className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-2xl font-bold">{kpis.examAvg.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Média Prova</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-2xl font-bold">{kpis.approvalRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Aprovação</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: 3 Charts */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Chart 1: Instructor Radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-500" />
              Avaliação Dra. Larissa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 9 }} />
                  <Radar name="Nota" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {larisaMetrics && (
              <LegalWidgetInsight {...generateLarisaOverallInsight(larisaMetrics.overall, larisaMetrics.totalResponses)} />
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Leads Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-rose-500" />
              Classificação de Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {leadsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-xs">
                <Flame className="h-3 w-3 text-rose-500" />
                <span>HOT: {legalPerception?.leads.hot}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Thermometer className="h-3 w-3 text-amber-500" />
                <span>WARM: {legalPerception?.leads.warm}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Snowflake className="h-3 w-3 text-blue-500" />
                <span>COLD: {legalPerception?.leads.cold}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart 3: Score Histogram */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-500" />
              Distribuição de Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData}>
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {histogramData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Score bruto 0-18 pontos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: 3 Charts */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Chart 4: Feeling Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              Segurança Jurídica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feelingChartData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {feelingChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {legalPerception && (
              <LegalWidgetInsight {...generateFeelingInsight(legalPerception.feelingDist, legalPerception.total)} />
            )}
          </CardContent>
        </Card>

        {/* Chart 5: Influence Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-500" />
              Influência nas Decisões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={influenceData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {influenceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 6: Timing Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-rose-500" />
              Urgência Percebida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timingData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {timingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: 2 Charts + Exam Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Chart 7: Exam Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-500" />
              Desempenho na Prova
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={examDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ range }) => range}
                  >
                    {examDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {examMetrics && (
              <LegalWidgetInsight {...generateExamInsight(examMetrics.approvalRate, examMetrics.average)} />
            )}
          </CardContent>
        </Card>

        {/* Chart 8: Comparison Radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-500" />
              Comparativo Instrutoras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={comparisonRadar}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 9 }} />
                  <Radar name="Larissa" dataKey="Larissa" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                  <Radar name="Caroline" dataKey="Caroline" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 9: Exam Summary */}
        {examMetrics && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Resumo da Prova
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">{examMetrics.average.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Média Geral</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{examMetrics.min}%</p>
                  <p className="text-xs text-muted-foreground">Nota Mínima</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{examMetrics.max}%</p>
                  <p className="text-xs text-muted-foreground">Nota Máxima</p>
                </div>
                <div className="text-center p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-violet-600">{examMetrics.approved}/{examMetrics.total}</p>
                  <p className="text-xs text-muted-foreground">Aprovados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Row 5: Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-rose-50 dark:bg-rose-900/20 border-rose-200">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-rose-600">{kpis.insecurePercentage}%</p>
            <p className="text-xs text-rose-700 dark:text-rose-300">Relatam Insegurança</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Soma de categorias inseguras
            </p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-amber-600">
              {legalPerception ? Math.round(
                ((legalPerception.influenceDist['Travaram decisões'] || 0) + 
                 (legalPerception.influenceDist['Influenciam bastante'] || 0)) / 
                legalPerception.total * 100
              ) : 0}%
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">Decisões Impactadas</p>
          </CardContent>
        </Card>
        <Card className="bg-violet-50 dark:bg-violet-900/20 border-violet-200">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-violet-600">
              {legalPerception ? Math.round(
                ((legalPerception.timingDist['O quanto antes'] || 0) + 
                 (legalPerception.timingDist['Próximos meses'] || 0)) / 
                legalPerception.total * 100
              ) : 0}%
            </p>
            <p className="text-xs text-violet-700 dark:text-violet-300">Urgência Imediata</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{kpis.hotPercentage}%</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">Leads HOT</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Score ≥ 40 pontos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
