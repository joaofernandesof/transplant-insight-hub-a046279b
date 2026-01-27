/**
 * IPROMED Exams - Provas e Avaliações de Direito Médico
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
  FileCheck, 
  BookOpen, 
  Users, 
  Trophy,
  TrendingUp,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  BarChart3,
} from "lucide-react";

export default function IpromedExams() {
  const navigate = useNavigate();

  // Fetch exam data
  const { data: examData, isLoading } = useQuery({
    queryKey: ['ipromed-exams'],
    queryFn: async () => {
      // Get legal-related exams
      const { data: exams, error: examError } = await supabase
        .from('exams')
        .select('id, title, description, duration_minutes, passing_score, is_active')
        .or('title.ilike.%direito%,title.ilike.%juridico%,title.ilike.%legal%');
      
      if (examError) throw examError;

      // Get attempt statistics for each exam
      const examStats = await Promise.all((exams || []).map(async (exam) => {
        const { data: attempts } = await supabase
          .from('exam_attempts')
          .select('score, status, submitted_at')
          .eq('exam_id', exam.id)
          .eq('status', 'submitted');

        const scores = attempts?.map(a => a.score || 0) || [];
        const approved = scores.filter(s => s >= (exam.passing_score || 70)).length;

        return {
          ...exam,
          totalAttempts: scores.length,
          averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
          approvalRate: scores.length > 0 ? (approved / scores.length) * 100 : 0,
          minScore: scores.length > 0 ? Math.min(...scores) : 0,
          maxScore: scores.length > 0 ? Math.max(...scores) : 0,
          approved,
        };
      }));

      return examStats;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Overall stats
  const totalAttempts = examData?.reduce((sum, e) => sum + e.totalAttempts, 0) || 0;
  const avgApproval = examData && examData.length > 0 
    ? examData.reduce((sum, e) => sum + e.approvalRate, 0) / examData.length 
    : 0;

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
          <FileCheck className="h-4 w-4 text-primary" />
          <span className="font-medium">Provas e Avaliações</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Provas de Direito Médico</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho dos alunos nas avaliações jurídicas
          </p>
        </div>
        <Button onClick={() => navigate('/exams/admin')}>
          <BookOpen className="h-4 w-4 mr-2" />
          Gerenciar Provas
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Provas Ativas</p>
                <p className="text-2xl font-bold">{examData?.filter(e => e.is_active).length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Respostas</p>
                <p className="text-2xl font-bold">{totalAttempts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <Trophy className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Aprovação</p>
                <p className="text-2xl font-bold">{avgApproval.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tendência</p>
                <p className="text-2xl font-bold text-emerald-600">+5%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exams List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Provas Cadastradas</h2>
        
        {examData && examData.length > 0 ? (
          <div className="grid gap-4">
            {examData.map((exam) => (
              <Card key={exam.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {exam.title}
                        {exam.is_active ? (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativa
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{exam.description || 'Sem descrição'}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/exams/admin`)}>
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Respostas</p>
                      <p className="text-lg font-semibold">{exam.totalAttempts}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Média</p>
                      <p className="text-lg font-semibold">{exam.averageScore.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Aprovados</p>
                      <p className="text-lg font-semibold text-emerald-600">{exam.approved}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Nota Mínima</p>
                      <p className="text-lg font-semibold">{exam.minScore}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Nota Máxima</p>
                      <p className="text-lg font-semibold">{exam.maxScore}%</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxa de Aprovação</span>
                      <span className="font-medium">{exam.approvalRate.toFixed(0)}%</span>
                    </div>
                    <Progress value={exam.approvalRate} className="h-2" />
                  </div>

                  <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {exam.duration_minutes || 60} minutos
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      Nota mínima: {exam.passing_score || 70}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma prova de Direito Médico cadastrada</p>
              <Button variant="link" onClick={() => navigate('/exams/admin')}>
                Criar nova prova
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
