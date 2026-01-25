import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle2, Clock, ChevronRight } from "lucide-react";

interface Survey {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  isCompleted: boolean;
  isLoading: boolean;
  onOpen: () => void;
}

interface ClassSurveyListProps {
  surveys: Survey[];
}

export function ClassSurveyList({ surveys }: ClassSurveyListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Pesquisas de Satisfação
        </CardTitle>
        <CardDescription>
          Sua opinião é muito importante para continuarmos evoluindo a formação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {surveys.map((survey) => (
          <div
            key={survey.id}
            className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
          >
            {/* Status Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              survey.isCompleted
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-primary/10 text-primary'
            }`}>
              {survey.isCompleted ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <ClipboardList className="h-6 w-6" />
              )}
            </div>

            {/* Survey Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm sm:text-base">{survey.title}</h3>
                {survey.isCompleted ? (
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                    Concluída
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                    Pendente
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                {survey.description}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{survey.questionCount} perguntas</span>
              </div>
            </div>

            {/* Action Button */}
            <Button
              size="sm"
              variant={survey.isCompleted ? "outline" : "default"}
              onClick={survey.onOpen}
              disabled={survey.isLoading}
              className="flex-shrink-0"
            >
              {survey.isCompleted ? 'Ver' : 'Responder'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        ))}

        {surveys.length === 0 && (
          <div className="text-center py-8">
            <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhuma pesquisa disponível para esta turma.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
