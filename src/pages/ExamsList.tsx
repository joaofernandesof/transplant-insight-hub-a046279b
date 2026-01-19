import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "@/components/ModuleLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Clock, 
  Trophy, 
  CheckCircle2,
  Play,
  ArrowLeft,
  Users,
  Calendar
} from "lucide-react";
import { useExams, useExamAttempts, useCourseClasses, Exam } from "@/hooks/useExams";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ExamsList() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  
  const { data: exams, isLoading: examsLoading } = useExams();
  const { data: attempts, isLoading: attemptsLoading } = useExamAttempts();
  const { data: classes, isLoading: classesLoading } = useCourseClasses();

  const isLoading = examsLoading || attemptsLoading || classesLoading;

  const getAttemptForExam = (examId: string) => {
    return attempts?.find(a => a.exam_id === examId && a.status === 'submitted');
  };

  const canTakeExam = (exam: Exam) => {
    const existingAttempts = attempts?.filter(a => a.exam_id === exam.id) || [];
    const completedAttempts = existingAttempts.filter(a => a.status === 'submitted');
    return completedAttempts.length < exam.max_attempts;
  };

  const handleStartExam = (exam: Exam) => {
    navigate(`/university/exams/${exam.id}/take`);
  };

  const handleViewResults = (examId: string, attemptId: string) => {
    navigate(`/university/exams/${examId}/results/${attemptId}`);
  };

  const filteredExams = selectedClassId === 'all' 
    ? exams 
    : exams?.filter(e => e.class_id === selectedClassId || !e.class_id);

  return (
    <ModuleLayout>
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-12 lg:pl-0">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/university')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Provas e Avaliações
                </h1>
                <p className="text-sm text-muted-foreground">
                  Complete as provas para validar seu aprendizado
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Button variant="outline" onClick={() => navigate('/university/exams/admin')}>
                  <Users className="h-4 w-4 mr-2" />
                  Painel Admin
                </Button>
              )}
              
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por turma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as provas</SelectItem>
                  {classes?.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Active Classes */}
        {classes && classes.filter(c => c.status === 'active').length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              TURMAS ATIVAS
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {classes.filter(c => c.status === 'active').map(cls => (
                <Card 
                  key={cls.id}
                  className={cn(
                    "shrink-0 cursor-pointer transition-colors",
                    selectedClassId === cls.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedClassId(cls.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(cls.start_date), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Exams Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExams?.map(exam => {
              const attempt = getAttemptForExam(exam.id);
              const canTake = canTakeExam(exam);
              const passed = attempt && (attempt.score || 0) >= exam.passing_score;
              
              return (
                <Card 
                  key={exam.id}
                  className={cn(
                    "transition-all hover:shadow-md",
                    attempt && passed && "border-l-4 border-l-emerald-500",
                    attempt && !passed && "border-l-4 border-l-amber-500"
                  )}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-base">{exam.title}</CardTitle>
                        {exam.description && (
                          <CardDescription className="mt-1">{exam.description}</CardDescription>
                        )}
                      </div>
                      {attempt && (
                        <Badge variant={passed ? "default" : "secondary"}>
                          {passed ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Aprovado
                            </>
                          ) : (
                            <>
                              <Trophy className="h-3 w-3 mr-1" />
                              {attempt.score?.toFixed(0)}%
                            </>
                          )}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {exam.duration_minutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        Mín. {exam.passing_score}%
                      </span>
                    </div>
                    
                    {attempt ? (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleViewResults(exam.id, attempt.id)}
                        >
                          Ver Resultado
                        </Button>
                        {canTake && (
                          <Button 
                            className="flex-1"
                            onClick={() => handleStartExam(exam)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Refazer
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => handleStartExam(exam)}
                        disabled={!canTake}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Iniciar Prova
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!filteredExams || filteredExams.length === 0) && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhuma prova disponível
            </p>
            <p className="text-sm text-muted-foreground">
              As provas serão liberadas durante o curso presencial.
            </p>
          </div>
        )}
      </main>
    </ModuleLayout>
  );
}