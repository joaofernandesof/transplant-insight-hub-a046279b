import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Rocket,
  PartyPopper,
  X
} from "lucide-react";
import { useFirstSteps } from "@/hooks/useFirstSteps";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function FirstStepsChecklist() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { steps, completedCount, totalSteps, progressPercent, allCompleted, isLoading } = useFirstSteps();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if checklist was dismissed
  useEffect(() => {
    if (user?.id) {
      const dismissed = localStorage.getItem(`checklist_dismissed_${user.id}`);
      setIsDismissed(dismissed === "true");
    }
  }, [user?.id]);

  const handleDismiss = () => {
    if (user?.id) {
      localStorage.setItem(`checklist_dismissed_${user.id}`, "true");
      setIsDismissed(true);
    }
  };

  const handleStepClick = (route: string) => {
    navigate(route);
  };

  // Don't show if loading, all completed, or dismissed
  if (isLoading || allCompleted || isDismissed) {
    return null;
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Primeiros Passos
                <Badge variant="secondary" className="text-xs">
                  {completedCount}/{totalSteps}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete estas tarefas para começar com o pé direito
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {Math.round(progressPercent)}% concluído
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-2">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => !step.isCompleted && handleStepClick(step.route)}
              disabled={step.isCompleted}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                step.isCompleted 
                  ? "bg-primary/5 cursor-default" 
                  : "bg-muted/30 hover:bg-muted/50 cursor-pointer hover:shadow-sm"
              }`}
            >
              {/* Icon */}
              <div className={`flex-shrink-0 ${step.isCompleted ? "text-primary" : "text-muted-foreground"}`}>
                {step.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${step.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {step.description}
                </p>
              </div>

              {/* Arrow for incomplete steps */}
              {!step.isCompleted && (
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Celebration when almost done */}
        {completedCount >= totalSteps - 1 && completedCount < totalSteps && (
          <div className="flex items-center gap-2 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-800 dark:text-amber-200">
            <PartyPopper className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm font-medium">
              Falta apenas 1 passo! Você está quase lá! 🎉
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
