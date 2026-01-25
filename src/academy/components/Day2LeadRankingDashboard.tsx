import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Flame, Thermometer, Snowflake, Search, Download, Filter,
  Zap, Target, Shield, TrendingUp, Users, Award, Clock, AlertCircle, Sparkles, BarChart3
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Day2AIInsightsPanel } from './Day2AIInsightsPanel';

interface Day2SurveyWithUser {
  id: string;
  user_id: string;
  class_id: string | null;
  completed_at: string | null;
  is_completed: boolean;
  current_section: number;
  score_ia_avivar: number;
  score_license: number;
  score_legal: number;
  score_total: number;
  lead_classification: string;
  // Question fields for recalculation
  q12_avivar_current_process?: string | null;
  q13_avivar_opportunity_loss?: string | null;
  q14_avivar_timing?: string | null;
  q15_license_path?: string | null;
  q16_license_pace?: string | null;
  q17_license_timing?: string | null;
  q18_legal_feeling?: string | null;
  q19_legal_influence?: string | null;
  q20_legal_timing?: string | null;
  neohub_users: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

interface Day2LeadRankingDashboardProps {
  classId?: string;
}

// Total questions in Day 2 survey (for progress calculation)
const TOTAL_DAY2_QUESTIONS = 20;

interface PartialSurveyWithUser {
  id: string;
  user_id: string;
  class_id: string | null;
  created_at: string;
  current_section: number;
  is_completed: boolean;
  neohub_users: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export function Day2LeadRankingDashboard({ classId }: Day2LeadRankingDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<string>('all');

  // Fetch completed surveys
  // Fetch ALL surveys (both completed and partial) - treat partial as valid leads
  const { data: surveys, isLoading } = useQuery({
    queryKey: ['day2-lead-ranking', classId],
    queryFn: async () => {
      let query = supabase
        .from('day2_satisfaction_surveys')
        .select('*')
        .order('score_total', { ascending: false });
      
      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      const { data: surveysData, error: surveysError } = await query;
      if (surveysError) throw surveysError;

      const userIds = surveysData?.map(s => s.user_id) || [];
      if (userIds.length === 0) return [];
      
      const { data: usersData } = await supabase
        .from('neohub_users')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      const merged = surveysData?.map(survey => ({
        ...survey,
        neohub_users: usersData?.find(u => u.user_id === survey.user_id) || {
          full_name: 'Usuário',
          email: '',
          avatar_url: null
        }
      })) || [];

      return merged as Day2SurveyWithUser[];
    }
  });

  // Fetch partial (incomplete) surveys with all answer fields
  const { data: partialSurveys, isLoading: isLoadingPartial } = useQuery({
    queryKey: ['day2-partial-surveys', classId],
    queryFn: async () => {
      let query = supabase
        .from('day2_satisfaction_surveys')
        .select('*')
        .eq('is_completed', false)
        .order('current_section', { ascending: false });
      
      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      const { data: surveysData, error: surveysError } = await query;
      if (surveysError) throw surveysError;

      const userIds = surveysData?.map(s => s.user_id) || [];
      if (userIds.length === 0) return [];
      
      const { data: usersData } = await supabase
        .from('neohub_users')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      const merged = surveysData?.map(survey => ({
        ...survey,
        neohub_users: usersData?.find(u => u.user_id === survey.user_id) || {
          full_name: 'Usuário',
          email: '',
          avatar_url: null
        }
      })) || [];

      return merged;
    }
  });

  // Helper function to calculate partial scores
  const calculatePartialScores = (survey: any) => {
    let iaScore = 0;
    let licenseScore = 0;
    let legalScore = 0;
    
    // IA Avivar scores (Q12-Q14) - 6 points each, max 18
    const iaScoreMap: Record<string, number> = {
      // Q12 - Multiple variations
      'Tudo depende de pessoas e memória': 0,
      'Tudo manual, depende de pessoas': 0,
      'Uso WhatsApp, mas sem padrão definido': 2,
      'Tenho organização básica, mas com falhas frequentes': 2,
      'Tenho algum sistema, mas é pouco eficiente': 2,
      'Consigo organizar, mas sinto limites claros': 4,
      'Tenho estrutura e quero ganhar escala e previsibilidade': 6,
      // Q13 - Multiple variations
      'Funciona bem do jeito que está': 0,
      'Não vejo perda de oportunidades': 0,
      'Perco poucas oportunidades': 2,
      'Funciona, mas gera desgaste': 2,
      'Perco bastante, mas consigo lidar': 4,
      'Funciona com perda de oportunidades': 4,
      'Perco muitas oportunidades e isso trava meu crescimento': 6,
      'É um gargalo claro no crescimento': 6,
      // Q14
      'Não é prioridade agora': 0,
      'Quando tiver mais tempo': 2,
      'Nos próximos meses': 4,
      'O quanto antes': 6,
    };
    
    if (survey.q12_avivar_current_process) iaScore += iaScoreMap[survey.q12_avivar_current_process] || 0;
    if (survey.q13_avivar_opportunity_loss) iaScore += iaScoreMap[survey.q13_avivar_opportunity_loss] || 0;
    if (survey.q14_avivar_timing) iaScore += iaScoreMap[survey.q14_avivar_timing] || 0;
    
    // License scores (Q15-Q17) - 6 points each, max 18
    const licenseScoreMap: Record<string, number> = {
      // Q15
      'Não é viável para mim hoje': 0,
      'Seria viável apenas com muito planejamento': 2,
      'É viável se o modelo fizer sentido': 4,
      'É totalmente viável para mim': 6,
      // Q16
      'Não me expõe': 0,
      'Me expõe pouco': 2,
      'Me expõe bastante': 4,
      'É um dos meus principais gargalos': 6,
      // Q17
      'Não penso nisso no momento': 0,
      'Talvez em um futuro distante': 2,
      'Nos próximos meses': 4,
      'Agora é o momento certo': 6,
    };
    
    if (survey.q15_license_path) licenseScore += licenseScoreMap[survey.q15_license_path] || 0;
    if (survey.q16_license_pace) licenseScore += licenseScoreMap[survey.q16_license_pace] || 0;
    if (survey.q17_license_timing) licenseScore += licenseScoreMap[survey.q17_license_timing] || 0;
    
    // Legal scores (Q18-Q20) - 6 points each, max 18
    const legalScoreMap: Record<string, number> = {
      // Q18
      'Tranquilo e seguro': 0,
      'Um pouco inseguro': 2,
      'Inseguro em alguns pontos': 4,
      'Exposto a riscos que me preocupam': 6,
      // Q19
      'Não influenciam': 0,
      'Influenciam pouco': 2,
      'Influenciam bastante': 4,
      'Travaram ou quase travaram decisões importantes': 6,
      // Q20
      'Não vejo isso como prioridade': 0,
      'Quando o negócio estiver maior': 2,
      'Nos próximos meses': 4,
      'O quanto antes': 6,
    };
    
    if (survey.q18_legal_feeling) legalScore += legalScoreMap[survey.q18_legal_feeling] || 0;
    if (survey.q19_legal_influence) legalScore += legalScoreMap[survey.q19_legal_influence] || 0;
    if (survey.q20_legal_timing) legalScore += legalScoreMap[survey.q20_legal_timing] || 0;
    
    // Count answered questions per section
    const answeredQuestions = {
      satisfaction: survey.q1_satisfaction_level ? 1 : 0,
      joao: [survey.q2_joao_expectations, survey.q3_joao_clarity, survey.q4_joao_time, survey.q5_joao_liked_most, survey.q6_joao_improve].filter(Boolean).length,
      larissa: [survey.q7_larissa_expectations, survey.q8_larissa_clarity, survey.q9_larissa_time, survey.q10_larissa_liked_most, survey.q11_larissa_improve].filter(Boolean).length,
      ia: [survey.q12_avivar_current_process, survey.q13_avivar_opportunity_loss, survey.q14_avivar_timing].filter(Boolean).length,
      license: [survey.q15_license_path, survey.q16_license_pace, survey.q17_license_timing].filter(Boolean).length,
      legal: [survey.q18_legal_feeling, survey.q19_legal_influence, survey.q20_legal_timing].filter(Boolean).length,
    };
    
    return {
      iaScore,
      licenseScore,
      legalScore,
      total: iaScore + licenseScore + legalScore,
      answered: answeredQuestions,
    };
  };

  const filteredSurveys = surveys?.filter(survey => {
    const matchesSearch = survey.neohub_users.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          survey.neohub_users.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = classificationFilter === 'all' || survey.lead_classification === classificationFilter;
    return matchesSearch && matchesFilter;
  });

  // Stats
  const totalLeads = surveys?.length || 0;
  const hotLeads = surveys?.filter(s => s.lead_classification === 'hot').length || 0;
  const warmLeads = surveys?.filter(s => s.lead_classification === 'warm').length || 0;
  const coldLeads = surveys?.filter(s => s.lead_classification === 'cold').length || 0;
  const avgScore = surveys?.length ? Math.round(surveys.reduce((acc, s) => acc + s.score_total, 0) / surveys.length) : 0;

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'hot':
        return <Badge className="bg-destructive text-destructive-foreground"><Flame className="h-3 w-3 mr-1" />Quente</Badge>;
      case 'warm':
        return <Badge className="bg-warning text-warning-foreground"><Thermometer className="h-3 w-3 mr-1" />Morno</Badge>;
      case 'cold':
        return <Badge className="bg-accent text-accent-foreground"><Snowflake className="h-3 w-3 mr-1" />Frio</Badge>;
      default:
        return <Badge variant="outline">{classification}</Badge>;
    }
  };

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 75) return 'bg-primary';
    if (percentage >= 50) return 'bg-warning';
    if (percentage >= 25) return 'bg-warning/70';
    return 'bg-destructive';
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Ranking de Leads - Pesquisa Dia 2', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
    doc.text(`Total de Leads: ${totalLeads} | Quentes: ${hotLeads} | Mornos: ${warmLeads} | Frios: ${coldLeads}`, 14, 34);

    const tableData = filteredSurveys?.map((survey, idx) => [
      idx + 1,
      survey.neohub_users.full_name,
      survey.score_total,
      survey.score_ia_avivar,
      survey.score_license,
      survey.score_legal,
      survey.lead_classification === 'hot' ? 'Quente' : 
        survey.lead_classification === 'warm' ? 'Morno' : 'Frio'
    ]) || [];

    autoTable(doc, {
      head: [['#', 'Nome', 'Total', 'IA', 'Licença', 'Jurídico', 'Status']],
      body: tableData,
      startY: 42,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 197, 94] }
    });

    doc.save('ranking-leads-dia2.pdf');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalLeads}</p>
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
                <p className="text-2xl font-bold text-destructive">{hotLeads}</p>
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
                <p className="text-2xl font-bold text-warning">{warmLeads}</p>
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
                <p className="text-2xl font-bold text-accent-foreground">{coldLeads}</p>
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
                <p className="text-2xl font-bold">{avgScore}/54</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Ranking vs AI Insights */}
      <Tabs defaultValue="ranking" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ranking" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Ranking de Leads
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Análise de IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="mt-4 space-y-4">
          {/* Filters and Export */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
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
            <Button onClick={exportToPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>

      {/* Ranking Table */}
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
                    <Zap className="h-4 w-4" />
                    IA
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="h-4 w-4" />
                    Licença
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Shield className="h-4 w-4" />
                    Jurídico
                  </div>
                </TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSurveys?.map((survey, idx) => {
                // Recalculate scores to handle different answer variations
                const recalculated = calculatePartialScores(survey);
                const displayScoreIA = recalculated.iaScore;
                const displayScoreLicense = recalculated.licenseScore;
                const displayScoreLegal = recalculated.legalScore;
                const displayScoreTotal = recalculated.total;
                const displayClassification = displayScoreTotal >= 40 ? 'hot' : displayScoreTotal >= 25 ? 'warm' : 'cold';
                
                return (
                <TableRow key={survey.id} className={idx < 3 ? 'bg-primary/5' : ''}>
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
                        <AvatarImage src={survey.neohub_users.avatar_url || ''} />
                        <AvatarFallback className="text-sm">
                          {survey.neohub_users.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{survey.neohub_users.full_name}</p>
                          {!survey.is_completed && (
                            <Badge variant="outline" className="text-warning border-warning/50 text-[10px]">
                              <Clock className="h-3 w-3 mr-1" />
                              {survey.current_section}/20
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{survey.neohub_users.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-medium">{displayScoreIA}/18</span>
                      <Progress 
                        value={(displayScoreIA / 18) * 100} 
                        className={`h-1.5 w-16 ${getScoreColor(displayScoreIA, 18)}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-medium">{displayScoreLicense}/18</span>
                      <Progress 
                        value={(displayScoreLicense / 18) * 100} 
                        className={`h-1.5 w-16 ${getScoreColor(displayScoreLicense, 18)}`}
                      />
                      <span className={`text-[10px] ${
                        displayScoreLicense >= 12 ? 'text-green-600' :
                        displayScoreLicense >= 6 ? 'text-yellow-600' : 'text-muted-foreground'
                      }`}>
                        {displayScoreLicense >= 12 ? 'Extremamente qualificado' :
                         displayScoreLicense >= 6 ? 'Precisa construção' : 'Fora do timing'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-medium">{displayScoreLegal}/18</span>
                      <Progress 
                        value={(displayScoreLegal / 18) * 100} 
                        className={`h-1.5 w-16 ${getScoreColor(displayScoreLegal, 18)}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-lg font-bold ${
                      displayScoreTotal >= 40 ? 'text-red-500' :
                      displayScoreTotal >= 25 ? 'text-orange-500' : 'text-blue-500'
                    }`}>
                      {displayScoreTotal}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {getClassificationBadge(displayClassification)}
                  </TableCell>
                </TableRow>
              )})}
              {(!filteredSurveys || filteredSurveys.length === 0) && (
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

      {/* Partial Responses Section */}
      {(partialSurveys && partialSurveys.length > 0) && (
        <Card className="border-warning/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Respostas Parciais ({partialSurveys.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {partialSurveys.map((survey) => {
                const progressPercent = Math.round((survey.current_section / TOTAL_DAY2_QUESTIONS) * 100);
                const scores = calculatePartialScores(survey);
                
                return (
                  <div 
                    key={survey.id}
                    className="p-4 rounded-lg bg-warning/10 border border-warning/30"
                  >
                    {/* Header with user info */}
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={survey.neohub_users.avatar_url || ''} />
                        <AvatarFallback className="bg-warning/20 text-warning">
                          {survey.neohub_users.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{survey.neohub_users.full_name}</p>
                          <Badge variant="outline" className="shrink-0 border-warning/50 text-warning">
                            <Clock className="h-3 w-3 mr-1" />
                            Questão {survey.current_section}/{TOTAL_DAY2_QUESTIONS}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{survey.neohub_users.email}</p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-warning">
                          {progressPercent}%
                        </p>
                        <Progress 
                          value={progressPercent} 
                          className="h-2 w-20" 
                        />
                      </div>
                    </div>
                    
                    {/* Partial scores by category */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Questions answered */}
                      <div className="bg-background/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Perguntas Respondidas</p>
                        <div className="flex flex-wrap gap-1 text-xs">
                          <span className={`px-1.5 py-0.5 rounded ${scores.answered.satisfaction ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            Satisfação: {scores.answered.satisfaction}/1
                          </span>
                          <span className={`px-1.5 py-0.5 rounded ${scores.answered.joao > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            João: {scores.answered.joao}/5
                          </span>
                          <span className={`px-1.5 py-0.5 rounded ${scores.answered.larissa > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            Larissa: {scores.answered.larissa}/5
                          </span>
                        </div>
                      </div>

                      {/* IA Avivar Score */}
                      <div className="bg-background/50 rounded-lg p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Zap className="h-3 w-3 text-primary" />
                          <p className="text-xs text-muted-foreground">IA Avivar</p>
                        </div>
                        <p className={`text-lg font-bold ${scores.iaScore >= 12 ? 'text-primary' : scores.iaScore >= 6 ? 'text-warning' : 'text-muted-foreground'}`}>
                          {scores.iaScore}/18
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {scores.answered.ia}/3 perguntas
                        </p>
                      </div>

                      {/* License Score */}
                      <div className="bg-background/50 rounded-lg p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Target className="h-3 w-3 text-primary" />
                          <p className="text-xs text-muted-foreground">Licença</p>
                        </div>
                        <p className={`text-lg font-bold ${scores.licenseScore >= 12 ? 'text-primary' : scores.licenseScore >= 6 ? 'text-warning' : 'text-muted-foreground'}`}>
                          {scores.licenseScore}/18
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {scores.answered.license}/3 perguntas
                        </p>
                      </div>

                      {/* Legal Score */}
                      <div className="bg-background/50 rounded-lg p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Shield className="h-3 w-3 text-primary" />
                          <p className="text-xs text-muted-foreground">Jurídico</p>
                        </div>
                        <p className={`text-lg font-bold ${scores.legalScore >= 12 ? 'text-primary' : scores.legalScore >= 6 ? 'text-warning' : 'text-muted-foreground'}`}>
                          {scores.legalScore}/18
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {scores.answered.legal}/3 perguntas
                        </p>
                      </div>
                    </div>
                    
                    {/* Partial total */}
                    {scores.total > 0 && (
                      <div className="mt-3 pt-3 border-t border-warning/30 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Score Parcial Total:</span>
                        <span className={`text-lg font-bold ${
                          scores.total >= 40 ? 'text-destructive' :
                          scores.total >= 25 ? 'text-warning' : 'text-primary'
                        }`}>
                          {scores.total}/54
                          <span className="text-xs text-muted-foreground ml-2">
                            ({scores.total >= 40 ? '🔥 Quente' : scores.total >= 25 ? '🌡️ Morno' : '❄️ Frio'})
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <Day2AIInsightsPanel 
            surveys={surveys || []} 
            className={classId ? `Turma ${classId}` : 'Todas as turmas'} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
