import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useExams, useExamAttempts } from "@/hooks/useExams";
import { GlobalBreadcrumb } from "@/components/GlobalBreadcrumb";
import {
  FileText,
  Clock,
  Trophy,
  Play,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Target,
  Award
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AcademyExams() {
  const navigate = useNavigate();
  const { data: exams = [], isLoading } = useExams();
  const { data: attempts = [] } = useExamAttempts();
  const [activeTab, setActiveTab] = useState('available');

  // Calculate stats
  const completedAttempts = attempts.filter(a => a.status === 'submitted');
  const passedAttempts = completedAttempts.filter(a => (a.score || 0) >= 70);
  const averageScore = completedAttempts.length > 0 
    ? Math.round(completedAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / completedAttempts.length)
    : 0;

  // Filter exams
  const availableExams = exams.filter(e => e.is_active);
  const completedExams = exams.filter(e => 
    attempts.some(a => a.exam_id === e.id && a.status === 'submitted')
  );

  const getExamAttempts = (examId: string) => {
    return attempts.filter(a => a.exam_id === examId);
  };

  const getBestScore = (examId: string) => {
    const examAttempts = getExamAttempts(examId);
    if (examAttempts.length === 0) return null;
    return Math.max(...examAttempts.map(a => a.score || 0));
  };

  const handleStartExam = (examId: string) => {
    navigate(`/academy/exams/${examId}/take`);
  };

  const handleViewResults = (examId: string, attemptId: string) => {
    navigate(`/academy/exams/${examId}/results/${attemptId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="px-4 py-4">
          <div className="pl-12 lg:pl-0">
            <GlobalBreadcrumb />
            <h1 className="text-xl font-bold flex items-center gap-2 mt-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Provas e Avaliações
            </h1>
            <p className="text-sm text-muted-foreground">Teste seus conhecimentos e obtenha certificações</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 overflow-x-hidden w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/50 dark:to-indigo-950/50 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{availableExams.length}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-500">Provas Disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-950/50 dark:to-emerald-950/50 dark:border-green-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{passedAttempts.length}</p>
                  <p className="text-xs text-green-600 dark:text-green-500">Aprovações</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-950/50 dark:to-yellow-950/50 dark:border-amber-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{averageScore}%</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">Média Geral</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 dark:from-purple-950/50 dark:to-violet-950/50 dark:border-purple-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{completedAttempts.length}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-500">Provas Realizadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-blue-50 dark:bg-blue-950/30">
            <TabsTrigger value="available" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-blue-900">
              <Play className="h-4 w-4" />
              Disponíveis ({availableExams.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-blue-900">
              <CheckCircle2 className="h-4 w-4" />
              Realizadas ({completedExams.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Exams List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-32" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {(activeTab === 'available' ? availableExams : completedExams).map((exam) => {
              const examAttempts = getExamAttempts(exam.id);
              const bestScore = getBestScore(exam.id);
              const lastAttempt = examAttempts[0];
              const canRetake = !exam.max_attempts || examAttempts.length < exam.max_attempts;

              return (
                <Card key={exam.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        bestScore !== null && bestScore >= 70
                          ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                          : bestScore !== null
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-500'
                          : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                      }`}>
                        {bestScore !== null && bestScore >= 70 ? (
                          <Award className="h-6 w-6 text-white" />
                        ) : (
                          <FileText className="h-6 w-6 text-white" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold">{exam.title}</h3>
                          {bestScore !== null && (
                            <Badge className={bestScore >= 70 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' 
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                            }>
                              {bestScore >= 70 ? 'Aprovado' : 'Reprovado'} • {bestScore}%
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">{exam.description}</p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          {exam.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {exam.duration_minutes} min
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Mínimo: {exam.passing_score || 70}%
                          </span>
                          {exam.max_attempts && (
                            <span className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {examAttempts.length}/{exam.max_attempts} tentativas
                            </span>
                          )}
                        </div>

                        {bestScore !== null && (
                          <div className="mt-2 flex items-center gap-2">
                            <Progress value={bestScore} className="flex-1 h-2" />
                            <span className="text-xs font-medium">{bestScore}%</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {activeTab === 'available' && canRetake && (
                          <Button
                            onClick={() => handleStartExam(exam.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {examAttempts.length > 0 ? 'Refazer' : 'Iniciar'}
                          </Button>
                        )}
                        {lastAttempt && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewResults(exam.id, lastAttempt.id)}
                          >
                            Ver Resultado
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {(activeTab === 'available' ? availableExams : completedExams).length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-lg font-medium text-muted-foreground">
                  {activeTab === 'available' 
                    ? 'Nenhuma prova disponível no momento'
                    : 'Você ainda não realizou nenhuma prova'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
