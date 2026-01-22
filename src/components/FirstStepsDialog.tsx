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
import GuidedTour from "./GuidedTour";

export default function FirstStepsDialog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { steps, completedCount, totalSteps, progressPercent, allCompleted, isLoading, markTourCompleted, markNotificationsConfigured } = useFirstSteps();
  const [isOpen, setIsOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);

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
    console.log("Step clicked:", step.id, step.isCompleted);
    if (step.isCompleted) return;
    
    // Handle tour step
    if (step.id === "tour") {
      console.log("Opening tour...");
      setIsOpen(false);
      setTimeout(() => setShowTour(true), 100);
      return;
    }
    
    // Handle notifications step - navigate to profile notifications section
    if (step.id === "notifications") {
      markNotificationsConfigured();
      setIsOpen(false);
      navigate("/profile?tab=notifications");
      return;
    }
    
    // Handle profile step
    if (step.id === "profile") {
      setIsOpen(false);
      navigate("/profile");
      return;
    }
    
    // Default: navigate to route
    setIsOpen(false);
    navigate(step.route);
  };

  const handleTourComplete = () => {
    markTourCompleted();
    setShowTour(false);
    
    // Re-check if should show dialog again
    if (!allCompleted) {
      setTimeout(() => setIsOpen(true), 500);
    }
  };

  // Don't render if loading or all completed (and tour is not showing)
  if (isLoading || (allCompleted && !showTour)) {
    return null;
  }

  return (
    <>
      {/* Guided Tour */}
      <GuidedTour 
        isOpen={showTour} 
        onComplete={handleTourComplete} 
      />

      {/* First Steps Dialog */}
      <Dialog open={isOpen && !showTour} onOpenChange={(open) => !open && handleDismiss()}>
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
            <div className="space-y-2" role="list">
              {steps.map((step) => {
                const isDisabled = step.isCompleted || step.isLoading;
                return (
                  <div
                    key={step.id}
                    role="listitem"
                    onClick={() => !isDisabled && handleStepClick(step)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left select-none ${
                      isDisabled 
                        ? "bg-primary/5 cursor-default opacity-70" 
                        : "bg-muted/50 hover:bg-muted cursor-pointer hover:shadow-sm active:scale-[0.98]"
                    }`}
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 pointer-events-none ${step.isCompleted ? "text-primary" : "text-muted-foreground"}`}>
                      {step.isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pointer-events-none">
                      <p className={`font-medium text-sm ${step.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {step.description}
                      </p>
                    </div>

                    {/* Arrow for incomplete steps */}
                    {!step.isCompleted && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 pointer-events-none" />
                    )}
                  </div>
                );
              })}
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
    </>
  );
}
