import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle,
  HelpCircle,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useExams } from "@/hooks/useExams";

interface MissedQuestion {
  question_id: string;
  question_text: string;
  exam_id: string;
  exam_title: string;
  correct_answer: string;
  correct_text: string;
  total_attempts: number;
  wrong_count: number;
  error_rate: number;
}

export function MostMissedQuestionsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<MissedQuestion[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  
  const { data: exams } = useExams();

  useEffect(() => {
    if (isOpen) {
      fetchMissedQuestions();
    }
  }, [isOpen, selectedExamId]);

  const fetchMissedQuestions = async () => {
    setIsLoading(true);
    try {
      await fetchMissedQuestionsDirect();
    } catch (error) {
      console.error('Error fetching missed questions:', error);
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMissedQuestionsDirect = async () => {
    try {
      // Query direta caso a RPC não exista
      let query = supabase
        .from('exam_answers')
        .select(`
          question_id,
          is_correct,
          exam_questions!inner(
            id,
            question_text,
            correct_answer,
            options,
            exam_id,
            exams!inner(title)
          )
        `);

      const { data, error } = await query;

      if (error) throw error;

      // Processar dados localmente
      const questionStats: Record<string, {
        question_id: string;
        question_text: string;
        exam_id: string;
        exam_title: string;
        correct_answer: string;
        options: string[];
        total: number;
        wrong: number;
      }> = {};

      (data || []).forEach((ans: any) => {
        const q = ans.exam_questions;
        const qId = q.id;
        
        // Filtrar por exame se selecionado
        if (selectedExamId !== 'all' && q.exam_id !== selectedExamId) return;

        if (!questionStats[qId]) {
          questionStats[qId] = {
            question_id: qId,
            question_text: q.question_text,
            exam_id: q.exam_id,
            exam_title: q.exams?.title || 'Prova',
            correct_answer: q.correct_answer,
            options: q.options || [],
            total: 0,
            wrong: 0
          };
        }

        questionStats[qId].total++;
        if (!ans.is_correct) {
          questionStats[qId].wrong++;
        }
      });

      // Converter para array e calcular taxa de erro
      const result: MissedQuestion[] = Object.values(questionStats)
        .filter(q => q.total >= 1) // Pelo menos 1 resposta
        .map(q => {
          const correctIndex = q.correct_answer.charCodeAt(0) - 65;
          const correctText = q.options[correctIndex] || q.correct_answer;
          
          return {
            question_id: q.question_id,
            question_text: q.question_text,
            exam_id: q.exam_id,
            exam_title: q.exam_title,
            correct_answer: q.correct_answer,
            correct_text: correctText,
            total_attempts: q.total,
            wrong_count: q.wrong,
            error_rate: (q.wrong / q.total) * 100
          };
        })
        .sort((a, b) => b.error_rate - a.error_rate)
        .slice(0, 20);

      setQuestions(result);
    } catch (error) {
      console.error('Error in direct query:', error);
      setQuestions([]);
    }
  };

  const getErrorRateColor = (rate: number) => {
    if (rate >= 80) return "text-red-600 dark:text-red-400";
    if (rate >= 60) return "text-orange-600 dark:text-orange-400";
    if (rate >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-yellow-600 dark:text-yellow-400";
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return "bg-red-500";
    if (rate >= 60) return "bg-orange-500";
    if (rate >= 40) return "bg-amber-500";
    return "bg-yellow-500";
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <CardTitle className="text-base">Ranking de Erros</CardTitle>
                  <CardDescription className="text-xs">
                    Questões com maior frequência de erros
                  </CardDescription>
                </div>
              </div>
            </CollapsibleTrigger>
            
            {isOpen && (
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por prova" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as provas</SelectItem>
                  {exams?.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : questions.length > 0 ? (
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div 
                    key={q.question_id}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Ranking number */}
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx < 3 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {idx + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Question text */}
                        <p className="text-sm font-medium line-clamp-2 mb-2">
                          {q.question_text}
                        </p>
                        
                        {/* Exam badge */}
                        <Badge variant="outline" className="text-xs mb-2">
                          {q.exam_title}
                        </Badge>
                        
                        {/* Correct answer */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <HelpCircle className="h-3 w-3" />
                          <span>Resposta correta:</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            {q.correct_text.length > 60 ? q.correct_text.slice(0, 60) + '...' : q.correct_text}
                          </span>
                        </div>
                        
                        {/* Error rate bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${getProgressColor(q.error_rate)}`}
                                style={{ width: `${q.error_rate}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <BarChart3 className="h-3 w-3 text-muted-foreground" />
                            <span className={`font-bold ${getErrorRateColor(q.error_rate)}`}>
                              {q.error_rate.toFixed(0)}% erros
                            </span>
                            <span className="text-muted-foreground">
                              ({q.wrong_count}/{q.total_attempts})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhuma resposta registrada ainda</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
