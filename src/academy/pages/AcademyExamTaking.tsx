import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Send,
  FileText,
  ArrowLeft
} from "lucide-react";
import { useExamQuestions, useStartExam, useSubmitExam } from "@/hooks/useExams";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GlobalBreadcrumb } from "@/components/GlobalBreadcrumb";

export function AcademyExamTaking() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<any>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: questions, isLoading: questionsLoading } = useExamQuestions(examId || '');
  const startExamMutation = useStartExam();
  const submitExamMutation = useSubmitExam();

  // Fetch exam details
  useEffect(() => {
    async function fetchExam() {
      if (!examId) return;
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();
      
      if (data) {
        setExam(data);
        if (data.duration_minutes) {
          setTimeRemaining(data.duration_minutes * 60);
        }
      }
    }
    fetchExam();
  }, [examId]);

  // Start exam attempt
  useEffect(() => {
    async function startAttempt() {
      if (!examId || attemptId) return;
      
      try {
        const result = await startExamMutation.mutateAsync({ examId });
        setAttemptId(result.id);
      } catch (error: any) {
        toast.error("Erro ao iniciar prova: " + error.message);
        navigate('/academy/exams');
      }
    }
    
    if (exam && !attemptId) {
      startAttempt();
    }
  }, [exam, examId, attemptId, navigate, startExamMutation]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions?.[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions?.length || 0;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const handleAnswerChange = (questionId: string, answerLetter: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerLetter }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!attemptId || !questions) return;
    
    setIsSubmitting(true);
    try {
      const formattedAnswers = questions.map(q => ({
        questionId: q.id,
        answer: answers[q.id] || ''
      }));
      
      await submitExamMutation.mutateAsync({
        attemptId,
        answers: formattedAnswers
      });
      
      toast.success("Prova enviada com sucesso!");
      navigate(`/academy/exams/${examId}/results/${attemptId}`);
    } catch (error: any) {
      toast.error("Erro ao enviar prova: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = questionsLoading || !exam;

  if (isLoading) {
    return (
      <div className="p-4 pt-16 lg:pt-4 lg:p-6">
        <div className="space-y-6 w-full max-w-4xl mx-auto">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      {/* Header fixo */}
      <header className="sticky top-0 z-20 bg-card border-b shadow-sm w-full overflow-hidden">
        <div className="px-3 sm:px-4 py-3 max-w-4xl mx-auto">
          <GlobalBreadcrumb />
          <div className="flex items-center justify-between gap-2 sm:gap-4 mt-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/academy/exams')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <FileText className="h-5 w-5 text-emerald-600 shrink-0 hidden sm:block" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold truncate">{exam?.title}</h1>
                <p className="text-xs text-muted-foreground">
                  Questão {currentQuestionIndex + 1} de {totalQuestions}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {timeRemaining !== null && (
                <Badge 
                  variant={timeRemaining < 300 ? "destructive" : "secondary"}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1"
                >
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {formatTime(timeRemaining)}
                </Badge>
              )}
              
              <Badge variant="outline" className="hidden sm:flex">
                {answeredCount}/{totalQuestions} respondidas
              </Badge>
            </div>
          </div>
          
          <Progress value={progressPercent} className="mt-3 h-2" />
        </div>
      </header>

      <main className="px-3 sm:px-4 py-6 w-full overflow-x-hidden max-w-4xl mx-auto">
        {/* Question Card */}
        <Card className="mb-6 border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-lg leading-relaxed">
                {currentQuestionIndex + 1}. {currentQuestion?.question_text}
              </CardTitle>
              <Badge variant="outline" className="shrink-0 bg-emerald-50 dark:bg-emerald-950">
                {currentQuestion?.points || 1} pts
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQuestion?.id || ''] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion?.id || '', value)}
              className="space-y-3"
            >
              {(currentQuestion?.options || []).map((option, idx) => {
                const letter = String.fromCharCode(65 + idx); // A, B, C, D, E...
                return (
                  <div
                    key={idx}
                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                      answers[currentQuestion?.id || ''] === letter
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleAnswerChange(currentQuestion?.id || '', letter)}
                  >
                    <RadioGroupItem value={letter} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer text-sm">
                      <span className="font-semibold mr-2">{letter}.</span>
                      {option}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          <div className="flex gap-2 overflow-x-auto py-2 max-w-xs sm:max-w-md">
            {questions?.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center shrink-0 transition-colors ${
                  idx === currentQuestionIndex
                    ? 'bg-emerald-600 text-white'
                    : answers[q.id]
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                    : 'bg-muted hover:bg-muted-foreground/10'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === totalQuestions - 1 ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                  <Send className="h-4 w-4 mr-1" />
                  Enviar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Enviar Prova?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você respondeu {answeredCount} de {totalQuestions} questões.
                    {answeredCount < totalQuestions && (
                      <span className="block mt-2 text-amber-600">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        Existem {totalQuestions - answeredCount} questões não respondidas.
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Revisar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isSubmitting ? 'Enviando...' : 'Confirmar Envio'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Question Overview */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Resumo das Respostas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2">
              {questions?.map((q, idx) => (
                <div
                  key={q.id}
                  className={`aspect-square rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-colors ${
                    answers[q.id]
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  onClick={() => setCurrentQuestionIndex(idx)}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
