import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft,
  Award,
  Target,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { GlobalBreadcrumb } from "@/components/GlobalBreadcrumb";

interface ExamResult {
  id: string;
  exam_id: string;
  score: number;
  earned_points: number;
  total_points: number;
  submitted_at: string;
  status: string;
  exam: {
    title: string;
    description: string;
    passing_score: number;
    duration_minutes: number;
  };
  answers: {
    id: string;
    question_id: string;
    selected_answer: string;
    is_correct: boolean;
    points_earned: number;
    question: {
      question_text: string;
      correct_answer: string;
      options: string[];
      points: number;
      explanation: string;
    };
  }[];
}

export function AcademyExamResults() {
  const { examId, attemptId } = useParams<{ examId: string; attemptId: string }>();
  const navigate = useNavigate();
  
  const [result, setResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      if (!attemptId || !examId) return;
      
      try {
        // Fetch attempt with exam data
        const { data: attempt, error: attemptError } = await supabase
          .from('exam_attempts')
          .select(`
            *,
            exam:exams (title, description, passing_score, duration_minutes, show_results_immediately)
          `)
          .eq('id', attemptId)
          .single();
        
        if (attemptError) throw attemptError;
        
        // Fetch answers with questions
        const { data: answers, error: answersError } = await supabase
          .from('exam_answers')
          .select(`
            *,
            question:exam_questions (question_text, correct_answer, options, points, explanation)
          `)
          .eq('attempt_id', attemptId)
          .order('question_id');
        
        if (answersError) throw answersError;
        
        setResult({
          ...attempt,
          exam: attempt.exam,
          answers: answers.map(a => ({
            ...a,
            question: {
              ...a.question,
              options: a.question.options as string[]
            }
          }))
        } as ExamResult);
        
        // Check if we can show answers
        setShowAnswers(attempt.exam?.show_results_immediately !== false);
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchResults();
  }, [attemptId, examId]);

  if (isLoading) {
    return (
      <div className="p-4 pt-16 lg:pt-4 lg:p-6">
        <div className="space-y-6 w-full max-w-4xl mx-auto">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-4 pt-16 lg:pt-4 lg:p-6 text-center">
        <p className="text-muted-foreground">Resultado não encontrado.</p>
        <Button onClick={() => navigate('/academy/exams')} className="mt-4">
          Voltar para Provas
        </Button>
      </div>
    );
  }

  const passed = result.score >= (result.exam.passing_score || 70);
  const correctCount = result.answers.filter(a => a.is_correct).length;
  const totalQuestions = result.answers.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="px-4 py-4">
          <GlobalBreadcrumb />
          <div className="flex items-center gap-4 mt-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/academy/exams')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Resultado da Prova
              </h1>
              <p className="text-sm text-muted-foreground">{result.exam.title}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 w-full overflow-x-hidden max-w-4xl mx-auto">
        {/* Score Card */}
        <Card className={cn(
          "mb-6 overflow-hidden",
          passed 
            ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800" 
            : "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800"
        )}>
          <CardContent className="pt-8 pb-6">
            <div className="text-center">
              <div className={cn(
                "w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center",
                passed ? "bg-emerald-100 dark:bg-emerald-900" : "bg-red-100 dark:bg-red-900"
              )}>
                {passed ? (
                  <Trophy className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Target className="h-12 w-12 text-red-600 dark:text-red-400" />
                )}
              </div>
              
              <h2 className={cn(
                "text-4xl font-bold mb-2",
                passed ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
              )}>
                {(result.score ?? 0).toFixed(1)}%
              </h2>
              
              <Badge 
                variant={passed ? "default" : "destructive"} 
                className={cn("text-sm px-4 py-1", passed && "bg-emerald-600")}
              >
                {passed ? "APROVADO" : "REPROVADO"}
              </Badge>
              
              <p className="mt-4 text-muted-foreground">
                Nota mínima: {result.exam.passing_score || 70}%
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <div className="text-2xl font-bold text-foreground">{correctCount}</div>
                <p className="text-xs text-muted-foreground">Acertos</p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <div className="text-2xl font-bold text-foreground">{totalQuestions - correctCount}</div>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <div className="text-2xl font-bold text-foreground">{result.earned_points}/{result.total_points}</div>
                <p className="text-xs text-muted-foreground">Pontos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Answers Review */}
        {showAnswers && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Revisão das Questões
            </h3>
            
            {result.answers.map((answer, idx) => (
              <Card 
                key={answer.id}
                className={cn(
                  "transition-colors",
                  answer.is_correct 
                    ? "border-l-4 border-l-emerald-500" 
                    : "border-l-4 border-l-red-500"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-base leading-relaxed">
                      {idx + 1}. {answer.question.question_text}
                    </CardTitle>
                    {answer.is_correct ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Options with letters A, B, C... */}
                  <div className="space-y-2">
                    {answer.question.options?.map((option, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx); // A, B, C, D, E...
                      
                      // Check correct answer by TEXT (current system) or by LETTER (legacy)
                      const correctAnswerRaw = answer.question.correct_answer;
                      const isCorrectByText = option === correctAnswerRaw;
                      const isCorrectByLetter = letter === correctAnswerRaw;
                      const isCorrectOption = isCorrectByText || isCorrectByLetter;
                      
                      // Check selected answer by TEXT (current system) or by LETTER (legacy)
                      const selectedAnswerRaw = answer.selected_answer;
                      const isSelectedByText = option === selectedAnswerRaw;
                      const isSelectedByLetter = letter === selectedAnswerRaw;
                      const isSelectedOption = isSelectedByText || isSelectedByLetter;
                      const isSelectedWrong = isSelectedOption && !answer.is_correct;
                      
                      return (
                        <div
                          key={optIdx}
                          className={cn(
                            "p-3 rounded-lg text-sm",
                            isCorrectOption
                              ? "bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700"
                              : isSelectedWrong
                              ? "bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700"
                              : "bg-muted"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-semibold min-w-[24px]",
                              isCorrectOption 
                                ? "text-emerald-700 dark:text-emerald-300" 
                                : isSelectedWrong
                                ? "text-red-700 dark:text-red-300"
                                : "text-muted-foreground"
                            )}>
                              {letter})
                            </span>
                            <span className={cn(
                              isCorrectOption 
                                ? "text-emerald-800 dark:text-emerald-200" 
                                : isSelectedWrong
                                ? "text-red-800 dark:text-red-200"
                                : ""
                            )}>
                              {option}
                            </span>
                            {isCorrectOption && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 ml-auto" />
                            )}
                            {isSelectedWrong && (
                              <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Explanation */}
                  {answer.question.explanation && (
                    <div className="mt-4 p-4 rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700">
                      <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                        <strong className="text-amber-900 dark:text-amber-100">Explicação:</strong>{' '}
                        {answer.question.explanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigate('/academy/exams')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Provas
          </Button>
          <Button onClick={() => navigate('/academy/courses')} className="bg-emerald-600 hover:bg-emerald-700">
            <Award className="h-4 w-4 mr-2" />
            Ver Meus Cursos
          </Button>
        </div>
      </main>
    </div>
  );
}
