import { useNavigate } from "react-router-dom";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Rocket,
  PartyPopper
} from "lucide-react";
import { useFirstSteps } from "@/hooks/useFirstSteps";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import jonJobsAvatar from "@/assets/jon-jobs-avatar.png";

export default function FirstStepsDialog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { steps, completedCount, totalSteps, progressPercent, allCompleted, isLoading } = useFirstSteps();
  const [isOpen, setIsOpen] = useState(false);

  // Check if should show dialog after login
  useEffect(() => {
    if (user?.id && !isLoading) {
      // Don't show if all steps are completed
      if (allCompleted) {
        setIsOpen(false);
        return;
      }
      
      // Check if dialog was dismissed in this session
      const sessionDismissed = sessionStorage.getItem(`first_steps_dismissed_${user.id}`);
      if (sessionDismissed === "true") {
        setIsOpen(false);
        return;
      }
      
      // Show the dialog
      setIsOpen(true);
    }
  }, [user?.id, isLoading, allCompleted]);

  const handleDismiss = () => {
    if (user?.id) {
      // Only dismiss for this session
      sessionStorage.setItem(`first_steps_dismissed_${user.id}`, "true");
      setIsOpen(false);
    }
  };

  const handleStepClick = (step: typeof steps[0]) => {
    if (!step.isCompleted) {
      if (step.action) {
        step.action();
      } else {
        navigate(step.route);
      }
      setIsOpen(false);
    }
  };

  // Don't render if loading or all completed
  if (isLoading || allCompleted) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={jonJobsAvatar} 
                alt="Jon Jobs" 
                className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20"
              />
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-primary">
                <Rocket className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
            <div>
              <DialogTitle className="text-lg flex items-center gap-2">
                Primeiros Passos
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  {completedCount}/{totalSteps}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-sm">
                Olá! Sou o Jon Jobs, seu guia aqui no sistema. Vamos configurar tudo juntos?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
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
                onClick={() => handleStepClick(step)}
                disabled={step.isCompleted}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                  step.isCompleted 
                    ? "bg-primary/5 cursor-default" 
                    : "bg-muted/50 hover:bg-muted cursor-pointer hover:shadow-sm"
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

          {/* Continue Later Button */}
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground"
            onClick={handleDismiss}
          >
            Continuar depois
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
