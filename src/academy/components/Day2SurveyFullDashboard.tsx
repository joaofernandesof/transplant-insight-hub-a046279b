import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Flame, Thermometer, Snowflake, Search, Download, Filter,
  Zap, Target, Shield, TrendingUp, Users, Award, Clock, AlertCircle, 
  Sparkles, BarChart3, Eye, ArrowUpDown, ListOrdered, FileText, User,
  MessageSquare, CheckCircle2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportAllTabsToPdf } from '@/utils/exportAllTabsPdf';
import { Loader2, FileStack } from 'lucide-react';
import { useDay2SurveyAnalytics, type Day2StudentResponse } from '../hooks/useDay2SurveyAnalytics';
import { Day2AIInsightsPanel } from './Day2AIInsightsPanel';
import { Day2CallProfilesPanel } from './Day2CallProfilesPanel';
import { Day2SurveyDetailsDialog } from './Day2SurveyDetailsDialog';
import { Day2ScorePopover } from './Day2ScorePopover';
import { Day2CallInsightsPopover } from './Day2CallInsightsPopover';
import { 
  ChartExecutiveSummary, 
  generateLeadDistributionInsight, 
  generateProductScoreInsight,
  generateInstructorInsight,
  generateSatisfactionInsight 
} from '@/components/surveys/ChartExecutiveSummary';

interface Day2SurveyFullDashboardProps {
  classId?: string | null;
}

const CLASSIFICATION_COLORS = {
  hot: { bg: 'bg-destructive/10', text: 'text-destructive', icon: Flame },
  warm: { bg: 'bg-warning/10', text: 'text-warning', icon: Thermometer },
  cold: { bg: 'bg-accent/30', text: 'text-accent-foreground', icon: Snowflake },
};

const formatTime = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const TAB_NAMES_DAY2: Record<string, string> = {
  overview: 'Visão Geral',
  matrix: 'Matriz',
  ranking: 'Ranking',
  questions: 'Perguntas',
  students: 'Alunos',
  timing: 'Tempos',
  insights: 'Insights IA',
};

export function Day2SurveyFullDashboard({ classId }: Day2SurveyFullDashboardProps) {
  const { data: analytics, isLoading, error } = useDay2SurveyAnalytics(classId);
  const [activeTab, setActiveTab] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<string>('all');
  const [questionSearch, setQuestionSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSortBy, setStudentSortBy] = useState<'name' | 'score' | 'date'>('score');
  const [questionSortBy, setQuestionSortBy] = useState<'original' | 'name' | 'score'>('original');
  
  // Dialog state
  const [selectedStudent, setSelectedStudent] = useState<Day2StudentResponse | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Filtered students
  const filteredStudents = useMemo(() => {
    if (!analytics) return [];
    return analytics.responsesByStudent
      .filter(s => {
        const matchesSearch = s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              s.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = classificationFilter === 'all' || s.classification === classificationFilter;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        switch (studentSortBy) {
          case 'name': return a.userName.localeCompare(b.userName, 'pt-BR');
          case 'score': return b.scores.total - a.scores.total;
          case 'date':
            if (!a.completedAt && !b.completedAt) return 0;
            if (!a.completedAt) return 1;
            if (!b.completedAt) return -1;
            return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
          default: return 0;
        }
      });
  }, [analytics, searchTerm, classificationFilter, studentSortBy]);
  
  // Filtered questions
  const filteredQuestions = useMemo(() => {
    if (!analytics) return [];
    const categories = [...new Set(analytics.allQuestions.map(q => q.category))];
    return analytics.allQuestions
      .filter(q => {
        const matchesSearch = q.questionLabel.toLowerCase().includes(questionSearch.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || q.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        switch (questionSortBy) {
          case 'name': return a.questionLabel.localeCompare(b.questionLabel, 'pt-BR');
          case 'score': return b.avgRating - a.avgRating;
          default: return 0;
        }
      });
  }, [analytics, questionSearch, categoryFilter, questionSortBy]);
  
  const categories = useMemo(() => {
    if (!analytics) return [];
    return [...new Set(analytics.allQuestions.map(q => q.category))];
  }, [analytics]);
  
  const exportToPDF = () => {
    if (!analytics) return;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Dashboard Pesquisa Dia 2', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
    doc.text(`Total: ${analytics.totalResponses} | Quentes: ${analytics.hotLeads} | Mornos: ${analytics.warmLeads} | Frios: ${analytics.coldLeads}`, 14, 34);
    
    const tableData = filteredStudents.map((s, idx) => [
      idx + 1,
      s.userName,
      s.scores.total,
      s.scores.ia,
      s.scores.license,
      s.scores.legal,
      s.classification === 'hot' ? 'Quente' : s.classification === 'warm' ? 'Morno' : 'Frio',
    ]);
    
    autoTable(doc, {
      head: [['#', 'Nome', 'Total', 'IA', 'Licença', 'Jurídico', 'Status']],
      body: tableData,
      startY: 42,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 197, 94] },
    });
    
    doc.save('dashboard-dia2.pdf');
  };
  
  const exportAllTabs = async () => {
    const tabs = ['overview', 'matrix', 'ranking', 'questions', 'students', 'timing', 'insights'];
    await exportAllTabsToPdf({
      tabs,
      tabNames: TAB_NAMES_DAY2,
      setActiveTab,
      setIsExporting,
      filename: 'Pesquisa-Dia2-Completa',
    });
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  if (error || !analytics) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <h3 className="font-semibold mb-1">Nenhuma resposta ainda</h3>
          <p className="text-sm">As respostas da pesquisa do Dia 2 aparecerão aqui.</p>
        </div>
      </Card>
    );
  }
  
  // Chart data
  const classificationData = [
    { name: 'Quentes', value: analytics.hotLeads, fill: '#ef4444' },
    { name: 'Mornos', value: analytics.warmLeads, fill: '#f59e0b' },
    { name: 'Frios', value: analytics.coldLeads, fill: '#3b82f6' },
  ].filter(d => d.value > 0);
  
  const bntRadarData = [
    { metric: 'IA Avivar', value: (analytics.avgScoreIA / 18) * 10 },
    { metric: 'Licença', value: (analytics.avgScoreLicense / 18) * 10 },
    { metric: 'Jurídico', value: (analytics.avgScoreLegal / 18) * 10 },
  ];
  
  const instructorRadarData = [
    {
      metric: 'Expectativas',
      'Dr. João': analytics.instructors.joao.avgExpectations,
      'Dra. Larissa': analytics.instructors.larissa.avgExpectations,
    },
    {
      metric: 'Clareza',
      'Dr. João': analytics.instructors.joao.avgClarity,
      'Dra. Larissa': analytics.instructors.larissa.avgClarity,
    },
    {
      metric: 'Tempo',
      'Dr. João': analytics.instructors.joao.avgTime,
      'Dra. Larissa': analytics.instructors.larissa.avgTime,
    },
  ];
  
  // Order for satisfaction levels (best to worst)
  const SATISFACTION_ORDER = ['Muito satisfeito', 'Satisfeito', 'Neutro', 'Insatisfeito', 'Muito insatisfeito'];
  
  const satisfactionData = SATISFACTION_ORDER
    .filter(label => analytics.satisfactionBreakdown[label] > 0)
    .map(label => ({
      name: label,
      value: analytics.satisfactionBreakdown[label] || 0,
      fill: label === 'Muito satisfeito' ? '#10b981' : 
            label === 'Satisfeito' ? '#22c55e' :
            label === 'Neutro' ? '#f59e0b' : '#ef4444',
    }));
  
  // Matrix data
  const matrixQuestions = analytics.allQuestions.filter(q => 
    ['IA Avivar', 'Licença', 'Jurídico'].includes(q.category)
  );
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
      {/* Sticky header with KPIs and tabs */}
      <div className="sticky top-0 z-30 bg-background pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 pt-1 border-b">
        {/* Score Cards by Theme - IA, Licença, Jurídico (escala 0-10) */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">IA Avivar</p>
                <p className="text-xl font-bold">{((analytics.avgScoreIA / 18) * 10).toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-gray-400">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-500/10">
                <Target className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Licença</p>
                <p className="text-xl font-bold">{((analytics.avgScoreLicense / 18) * 10).toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-destructive bg-destructive/5">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Jurídico</p>
                <p className="text-xl font-bold">{((analytics.avgScoreLegal / 18) * 10).toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{analytics.totalResponses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Flame className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quentes</p>
                  <p className="text-2xl font-bold text-destructive">{analytics.hotLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Thermometer className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mornos</p>
                  <p className="text-2xl font-bold text-warning">{analytics.warmLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/30">
                  <Snowflake className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Frios</p>
                  <p className="text-2xl font-bold text-accent-foreground">{analytics.coldLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média</p>
                  <p className="text-2xl font-bold">{analytics.avgScoreTotal.toFixed(0)}/54</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs navigation with action buttons */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList className="grid grid-cols-7 w-full max-w-4xl">
            <TabsTrigger value="overview" className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="matrix" className="flex items-center gap-1.5">
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">Matriz</span>
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex items-center gap-1.5">
              <ListOrdered className="h-4 w-4" />
              <span className="hidden sm:inline">Ranking</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Perguntas</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Alunos</span>
            </TabsTrigger>
            <TabsTrigger value="timing" className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Tempos</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Insights IA</span>
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button onClick={exportToPDF} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Button 
              onClick={exportAllTabs} 
              variant="outline" 
              className="gap-2"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <FileStack className="h-4 w-4" />
                  Exportar Tudo (PDF)
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* === OVERVIEW TAB === */}
      <TabsContent value="overview" className="mt-4 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Classification Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Distribuição de Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classificationData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {classificationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ChartExecutiveSummary 
                insights={generateLeadDistributionInsight(analytics.hotLeads, analytics.warmLeads, analytics.coldLeads, analytics.totalResponses)}
                variant={analytics.hotLeads >= analytics.totalResponses * 0.3 ? 'success' : analytics.coldLeads >= analytics.totalResponses * 0.5 ? 'warning' : 'default'}
              />
            </CardContent>
          </Card>
          
          {/* BNT Product Scores - Horizontal Bars */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Scores por Produto (BNT)
              </CardTitle>
              <CardDescription>Média de pontuação normalizada (0-10)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* IA Avivar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Target className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-sm">IA Avivar</span>
                    </div>
                    <span className={`text-lg font-bold ${
                      ((analytics.avgScoreIA / 18) * 10) >= 7 ? 'text-emerald-600' : 
                      ((analytics.avgScoreIA / 18) * 10) >= 5 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {((analytics.avgScoreIA / 18) * 10).toFixed(1)}
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(((analytics.avgScoreIA / 18) * 10) * 10, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Licença */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Shield className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="font-medium text-sm">Licença</span>
                    </div>
                    <span className={`text-lg font-bold ${
                      ((analytics.avgScoreLicense / 18) * 10) >= 7 ? 'text-emerald-600' : 
                      ((analytics.avgScoreLicense / 18) * 10) >= 5 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {((analytics.avgScoreLicense / 18) * 10).toFixed(1)}
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(((analytics.avgScoreLicense / 18) * 10) * 10, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Jurídico */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                        <Shield className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="font-medium text-sm">Jurídico</span>
                    </div>
                    <span className={`text-lg font-bold ${
                      ((analytics.avgScoreLegal / 18) * 10) >= 7 ? 'text-emerald-600' : 
                      ((analytics.avgScoreLegal / 18) * 10) >= 5 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {((analytics.avgScoreLegal / 18) * 10).toFixed(1)}
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(((analytics.avgScoreLegal / 18) * 10) * 10, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <ChartExecutiveSummary 
                insights={generateProductScoreInsight(
                  (analytics.avgScoreIA / 18) * 10, 
                  (analytics.avgScoreLicense / 18) * 10, 
                  (analytics.avgScoreLegal / 18) * 10
                )}
                variant={
                  Math.max((analytics.avgScoreIA / 18) * 10, (analytics.avgScoreLicense / 18) * 10, (analytics.avgScoreLegal / 18) * 10) >= 7 
                    ? 'success' 
                    : Math.min((analytics.avgScoreIA / 18) * 10, (analytics.avgScoreLicense / 18) * 10, (analytics.avgScoreLegal / 18) * 10) < 5 
                      ? 'warning' 
                      : 'info'
                }
              />
            </CardContent>
          </Card>
          
          {/* Instructor Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Avaliação de Professores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={instructorRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis domain={[0, 5]} />
                    <Radar
                      name="Dr. João"
                      dataKey="Dr. João"
                      stroke="hsl(210, 80%, 50%)"
                      fill="hsl(210, 80%, 50%)"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Dra. Larissa"
                      dataKey="Dra. Larissa"
                      stroke="hsl(330, 80%, 50%)"
                      fill="hsl(330, 80%, 50%)"
                      fillOpacity={0.3}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <ChartExecutiveSummary 
                insights={generateInstructorInsight(
                  { name: 'Dr. João', avg: (analytics.instructors.joao.avgExpectations + analytics.instructors.joao.avgClarity + analytics.instructors.joao.avgTime) / 3 },
                  { name: 'Dra. Larissa', avg: (analytics.instructors.larissa.avgExpectations + analytics.instructors.larissa.avgClarity + analytics.instructors.larissa.avgTime) / 3 }
                )}
                variant="info"
              />
            </CardContent>
          </Card>
          
          {/* Satisfaction Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Satisfação Geral
              </CardTitle>
              <CardDescription>
                Média: {analytics.overallSatisfactionPercent.toFixed(0)}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={satisfactionData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {satisfactionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ChartExecutiveSummary 
                insights={generateSatisfactionInsight(analytics.overallSatisfactionPercent, analytics.satisfactionBreakdown)}
                variant={analytics.overallSatisfactionPercent >= 80 ? 'success' : analytics.overallSatisfactionPercent >= 60 ? 'info' : 'warning'}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">IA Avivar</p>
                  <p className="text-2xl font-bold">{((analytics.avgScoreIA / 18) * 10).toFixed(1)}/10</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Licença</p>
                  <p className="text-2xl font-bold">{((analytics.avgScoreLicense / 18) * 10).toFixed(1)}/10</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Jurídico</p>
                  <p className="text-2xl font-bold">{((analytics.avgScoreLegal / 18) * 10).toFixed(1)}/10</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      {/* === MATRIX TAB === */}
      <TabsContent value="matrix" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-primary" />
              Matriz de Respostas BNT
            </CardTitle>
            <CardDescription>
              Visualização de todas as respostas por aluno e pergunta BNT
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10">Aluno</TableHead>
                      {matrixQuestions.map(q => (
                        <TableHead key={q.questionKey} className="text-center text-xs min-w-[100px]">
                          {q.questionLabel}
                        </TableHead>
                      ))}
                      <TableHead className="text-center">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.slice(0, 50).map((student) => (
                      <TableRow key={student.surveyId}>
                        <TableCell className="sticky left-0 bg-background z-10 font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={student.avatarUrl || ''} />
                              <AvatarFallback className="text-xs">
                                {student.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[120px]">{student.userName}</span>
                          </div>
                        </TableCell>
                        {matrixQuestions.map(q => {
                          const response = student.responses.find(r => r.questionKey === q.questionKey);
                          const score = response?.numericValue ?? 0;
                          return (
                            <TableCell key={q.questionKey} className="text-center">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${
                                score >= 5 ? 'bg-primary/20 text-primary' :
                                score >= 3 ? 'bg-warning/20 text-warning' :
                                score > 0 ? 'bg-destructive/20 text-destructive' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {score || '-'}
                              </span>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          <Badge className={
                            student.classification === 'hot' ? 'bg-destructive' :
                            student.classification === 'warm' ? 'bg-warning' : 'bg-accent'
                          }>
                            {student.scores.total}/54
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* === RANKING TAB === */}
      <TabsContent value="ranking" className="mt-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={classificationFilter} onValueChange={setClassificationFilter}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="hot">Quentes</SelectItem>
              <SelectItem value="warm">Mornos</SelectItem>
              <SelectItem value="cold">Frios</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Ranking de Leads por Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Zap className="h-4 w-4" /> IA
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Target className="h-4 w-4" /> Licença
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Shield className="h-4 w-4" /> Jurídico
                    </div>
                  </TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student, idx) => (
                  <TableRow key={student.surveyId} className={idx < 3 ? 'bg-primary/5' : ''}>
                    <TableCell>
                      {idx < 3 ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-sm font-bold ${
                          idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-amber-600'
                        }`}>
                          {idx + 1}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{idx + 1}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={student.avatarUrl || ''} />
                          <AvatarFallback className="text-sm">
                            {student.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{student.userName}</p>
                            {!student.isCompleted && (
                              <Badge variant="outline" className="text-warning border-warning/50 text-[10px]">
                                <Clock className="h-3 w-3 mr-1" />
                                Parcial
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">{((student.scores.ia / 18) * 10).toFixed(1)}<span className="text-muted-foreground text-xs">/10</span></span>
                        <Progress value={(student.scores.ia / 18) * 100} className="h-1.5 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">{((student.scores.license / 18) * 10).toFixed(1)}<span className="text-muted-foreground text-xs">/10</span></span>
                        <Progress value={(student.scores.license / 18) * 100} className="h-1.5 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">{((student.scores.legal / 18) * 10).toFixed(1)}<span className="text-muted-foreground text-xs">/10</span></span>
                        <Progress value={(student.scores.legal / 18) * 100} className="h-1.5 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-lg font-bold ${
                        student.classification === 'hot' ? 'text-destructive' :
                        student.classification === 'warm' ? 'text-warning' : 'text-primary'
                      }`}>
                        {((student.scores.total / 54) * 10).toFixed(1)}<span className="text-muted-foreground text-sm font-normal">/10</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={
                        student.classification === 'hot' ? 'bg-destructive' :
                        student.classification === 'warm' ? 'bg-warning' : 'bg-accent'
                      }>
                        {student.classification === 'hot' ? <><Flame className="h-3 w-3 mr-1" />Quente</> :
                         student.classification === 'warm' ? <><Thermometer className="h-3 w-3 mr-1" />Morno</> :
                         <><Snowflake className="h-3 w-3 mr-1" />Frio</>}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedStudent(student);
                          setDetailsDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum lead encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* === QUESTIONS TAB === */}
      <TabsContent value="questions" className="mt-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pergunta..."
              value={questionSearch}
              onChange={(e) => setQuestionSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={questionSortBy} onValueChange={(v) => setQuestionSortBy(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original">Ordem Original</SelectItem>
              <SelectItem value="name">Por Nome</SelectItem>
              <SelectItem value="score">Por Nota</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-4">
          {filteredQuestions.map(q => (
            <Card key={q.questionKey}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2">{q.category}</Badge>
                    <CardTitle className="text-base">{q.questionLabel}</CardTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {q.avgRating.toFixed(1)}<span className="text-muted-foreground text-sm font-normal">/6</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{q.totalResponses} respostas</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(q.responseBreakdown).map(([option, count]) => (
                    <div key={option} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="truncate">{option}</span>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <Progress 
                          value={(count / q.totalResponses) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
      
      {/* === STUDENTS TAB === */}
      <TabsContent value="students" className="mt-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={studentSortBy} onValueChange={(v) => setStudentSortBy(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Por Nome</SelectItem>
              <SelectItem value="score">Por Score</SelectItem>
              <SelectItem value="date">Por Data</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.responsesByStudent
            .filter(s => s.userName.toLowerCase().includes(studentSearch.toLowerCase()))
            .sort((a, b) => {
              switch (studentSortBy) {
                case 'name': return a.userName.localeCompare(b.userName, 'pt-BR');
                case 'score': return b.scores.total - a.scores.total;
                case 'date':
                  if (!a.completedAt && !b.completedAt) return 0;
                  if (!a.completedAt) return 1;
                  if (!b.completedAt) return -1;
                  return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
                default: return 0;
              }
            })
            .map(student => {
              const config = CLASSIFICATION_COLORS[student.classification];
              const Icon = config.icon;
              return (
                <Card key={student.surveyId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={student.avatarUrl || ''} />
                        <AvatarFallback>
                          {student.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{student.userName}</p>
                          <Badge className={`${config.bg} ${config.text}`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {student.scores.total}/54
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          {student.isCompleted ? (
                            <><CheckCircle2 className="h-3 w-3 text-primary" /> Completo</>
                          ) : (
                            <><AlertCircle className="h-3 w-3 text-warning" /> Parcial</>
                          )}
                          {student.effectiveTimeSeconds && (
                            <>
                              <span>•</span>
                              <Clock className="h-3 w-3" />
                              {formatTime(student.effectiveTimeSeconds)}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="text-center p-2 rounded bg-muted/50">
                        <p className="text-xs text-muted-foreground">IA</p>
                        <p className="font-bold">{((student.scores.ia / 18) * 10).toFixed(1)}<span className="text-muted-foreground text-xs font-normal">/10</span></p>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/50">
                        <p className="text-xs text-muted-foreground">Licença</p>
                        <p className="font-bold">{((student.scores.license / 18) * 10).toFixed(1)}<span className="text-muted-foreground text-xs font-normal">/10</span></p>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/50">
                        <p className="text-xs text-muted-foreground">Jurídico</p>
                        <p className="font-bold">{((student.scores.legal / 18) * 10).toFixed(1)}<span className="text-muted-foreground text-xs font-normal">/10</span></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </TabsContent>
      
      {/* === TIMING TAB === */}
      <TabsContent value="timing" className="mt-4 space-y-4">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Médio</p>
                  <p className="text-2xl font-bold">{formatTime(Math.round(analytics.avgEffectiveTime))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Mais Rápido</p>
                  <p className="text-2xl font-bold">{formatTime(analytics.minEffectiveTime)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Mais Lento</p>
                  <p className="text-2xl font-bold">{formatTime(analytics.maxEffectiveTime)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Tempo por Aluno</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: Math.max(400, analytics.timingData.length * 32) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.timingData} layout="vertical" barSize={20}>
                  <XAxis type="number" tickFormatter={(v) => formatTime(v)} />
                  <YAxis dataKey="userName" type="category" width={150} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatTime(v)} />
                  <Bar dataKey="seconds" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Conclusão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span>Completas</span>
                  <span className="font-bold">{analytics.completedResponses}</span>
                </div>
                <Progress value={analytics.completionRate} className="h-3" />
              </div>
              <div className="text-3xl font-bold text-primary">
                {analytics.completionRate.toFixed(0)}%
              </div>
            </div>
            <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {analytics.completedResponses} completas
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                {analytics.partialResponses} parciais
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* === INSIGHTS TAB === */}
      <TabsContent value="insights" className="mt-4">
        <Day2AIInsightsPanel 
          surveys={analytics.responsesByStudent.map(s => ({
            id: s.surveyId,
            user_id: s.userId,
            class_id: classId || null,
            score_ia_avivar: s.scores.ia,
            score_license: s.scores.license,
            score_legal: s.scores.legal,
            score_total: s.scores.total,
            lead_classification: s.classification,
            is_completed: s.isCompleted,
            neohub_users: {
              full_name: s.userName,
              email: s.email,
              avatar_url: s.avatarUrl,
            },
          }))} 
          className={classId ? `Turma ${classId}` : 'Todas as turmas'} 
        />
      </TabsContent>
    </Tabs>
  );
}
