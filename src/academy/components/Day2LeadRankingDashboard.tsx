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
  Zap, Target, Shield, Calendar, TrendingUp, Users, Award
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Day2SurveyWithUser {
  id: string;
  user_id: string;
  class_id: string | null;
  completed_at: string;
  score_ia_avivar: number;
  score_license: number;
  score_legal: number;
  score_timing: number;
  score_total: number;
  lead_classification: string;
  q19_timing_individual_interest: string | null;
  neohub_users: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

interface Day2LeadRankingDashboardProps {
  classId?: string;
}

export function Day2LeadRankingDashboard({ classId }: Day2LeadRankingDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<string>('all');

  const { data: surveys, isLoading } = useQuery({
    queryKey: ['day2-lead-ranking', classId],
    queryFn: async () => {
      // First get surveys
      let query = supabase
        .from('day2_satisfaction_surveys')
        .select('*')
        .eq('is_completed', true)
        .order('score_total', { ascending: false });
      
      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      const { data: surveysData, error: surveysError } = await query;
      if (surveysError) throw surveysError;

      // Get user info for each survey
      const userIds = surveysData?.map(s => s.user_id) || [];
      const { data: usersData } = await supabase
        .from('neohub_users')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      // Merge data
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
        return <Badge className="bg-red-500 text-white"><Flame className="h-3 w-3 mr-1" />Quente</Badge>;
      case 'warm':
        return <Badge className="bg-orange-500 text-white"><Thermometer className="h-3 w-3 mr-1" />Morno</Badge>;
      case 'cold':
        return <Badge className="bg-blue-500 text-white"><Snowflake className="h-3 w-3 mr-1" />Frio</Badge>;
      default:
        return <Badge variant="outline">{classification}</Badge>;
    }
  };

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
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
      survey.score_timing,
      survey.lead_classification === 'hot' ? 'Quente' : 
        survey.lead_classification === 'warm' ? 'Morno' : 'Frio'
    ]) || [];

    autoTable(doc, {
      head: [['#', 'Nome', 'Total', 'IA', 'Licença', 'Jurídico', 'Timing', 'Status']],
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
              <div className="p-2 rounded-lg bg-red-500/10">
                <Flame className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quentes</p>
                <p className="text-2xl font-bold text-red-500">{hotLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Thermometer className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mornos</p>
                <p className="text-2xl font-bold text-orange-500">{warmLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Snowflake className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Frios</p>
                <p className="text-2xl font-bold text-blue-500">{coldLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média</p>
                <p className="text-2xl font-bold">{avgScore}/48</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Timing
                  </div>
                </TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSurveys?.map((survey, idx) => (
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
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={survey.neohub_users.avatar_url || ''} />
                        <AvatarFallback>
                          {survey.neohub_users.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{survey.neohub_users.full_name}</p>
                        <p className="text-xs text-muted-foreground">{survey.neohub_users.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-medium">{survey.score_ia_avivar}/12</span>
                      <Progress 
                        value={(survey.score_ia_avivar / 12) * 100} 
                        className={`h-1.5 w-16 ${getScoreColor(survey.score_ia_avivar, 12)}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-medium">{survey.score_license}/12</span>
                      <Progress 
                        value={(survey.score_license / 12) * 100} 
                        className={`h-1.5 w-16 ${getScoreColor(survey.score_license, 12)}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-medium">{survey.score_legal}/12</span>
                      <Progress 
                        value={(survey.score_legal / 12) * 100} 
                        className={`h-1.5 w-16 ${getScoreColor(survey.score_legal, 12)}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-medium">{survey.score_timing}/12</span>
                      <Progress 
                        value={(survey.score_timing / 12) * 100} 
                        className={`h-1.5 w-16 ${getScoreColor(survey.score_timing, 12)}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-lg font-bold ${
                      survey.score_total >= 36 ? 'text-red-500' :
                      survey.score_total >= 24 ? 'text-orange-500' : 'text-blue-500'
                    }`}>
                      {survey.score_total}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {getClassificationBadge(survey.lead_classification)}
                  </TableCell>
                </TableRow>
              ))}
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
    </div>
  );
}
