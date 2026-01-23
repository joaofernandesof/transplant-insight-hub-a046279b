import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Answer {
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
    order_index: number;
  };
}

interface AttemptAnswersDialogProps {
  attemptId: string;
  studentName: string;
  examTitle: string;
  score: number;
}

export function AttemptAnswersDialog({ 
  attemptId, 
  studentName, 
  examTitle,
  score 
}: AttemptAnswersDialogProps) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && attemptId) {
      fetchAnswers();
    }
  }, [open, attemptId]);

  const fetchAnswers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_answers')
        .select(`
          id,
          question_id,
          selected_answer,
          is_correct,
          points_earned,
          exam_questions!inner(
            question_text,
            correct_answer,
            options,
            points,
            order_index
          )
        `)
        .eq('attempt_id', attemptId)
        .order('exam_questions(order_index)');

      if (error) throw error;

      const formattedAnswers = (data || []).map((a: any) => ({
        id: a.id,
        question_id: a.question_id,
        selected_answer: a.selected_answer,
        is_correct: a.is_correct,
        points_earned: a.points_earned,
        question: {
          question_text: a.exam_questions.question_text,
          correct_answer: a.exam_questions.correct_answer,
          options: a.exam_questions.options || [],
          points: a.exam_questions.points || 1,
          order_index: a.exam_questions.order_index,
        }
      }));

      // Sort by order_index
      formattedAnswers.sort((a, b) => a.question.order_index - b.question.order_index);
      
      setAnswers(formattedAnswers);
    } catch (error) {
      console.error('Error fetching answers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const correctCount = answers.filter(a => a.is_correct).length;
  const totalQuestions = answers.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>Respostas de {studentName}</span>
            <Badge variant={score >= 70 ? "default" : "destructive"}>
              {score.toFixed(1)}%
            </Badge>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {examTitle} • {correctCount}/{totalQuestions} corretas
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {answers.map((answer, idx) => {
                const options = answer.question.options as string[];
                const correctIndex = answer.question.correct_answer.charCodeAt(0) - 65;
                const correctText = options[correctIndex] || answer.question.correct_answer;
                
                // Find selected option index (if letter was stored)
                let selectedText = answer.selected_answer;
                if (answer.selected_answer.length === 1 && /[A-E]/i.test(answer.selected_answer)) {
                  const selectedIndex = answer.selected_answer.toUpperCase().charCodeAt(0) - 65;
                  selectedText = options[selectedIndex] || answer.selected_answer;
                }

                return (
                  <div 
                    key={answer.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      answer.is_correct 
                        ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800" 
                        : "border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        answer.is_correct 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      )}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium mb-2 line-clamp-2">
                          {answer.question.question_text}
                        </p>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            {answer.is_correct ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                            )}
                            <span className="text-muted-foreground">Respondeu:</span>
                            <span className={cn(
                              "font-medium",
                              answer.is_correct ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                            )}>
                              {answer.selected_answer}
                              {selectedText !== answer.selected_answer && ` - ${selectedText.substring(0, 50)}...`}
                            </span>
                          </div>
                          
                          {!answer.is_correct && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span className="text-muted-foreground">Correta:</span>
                              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                                {answer.question.correct_answer}
                                {correctText !== answer.question.correct_answer && ` - ${correctText.substring(0, 50)}...`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Badge variant="outline" className="shrink-0">
                        {answer.points_earned}/{answer.question.points} pts
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
