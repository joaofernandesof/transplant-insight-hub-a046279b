import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronRight,
  ChevronLeft,
  X,
  Volume2,
  VolumeX
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import jonJobsAvatar from "@/assets/jon-jobs-avatar.png";
import { tourSteps, TourStep } from "./tourSteps";

interface SpotlightTourProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function SpotlightTour({ isOpen, onComplete }: SpotlightTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const observerRef = useRef<MutationObserver | null>(null);

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  // Find and highlight target element
  const findTargetElement = useCallback(() => {
    if (!step?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(step.targetSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      
      // Scroll element into view if needed
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTargetRect(null);
    }
  }, [step]);

  // Navigate to correct route and find element
  useEffect(() => {
    if (!isOpen || !step) return;

    // Navigate to step route if different
    if (step.route && location.pathname !== step.route) {
      navigate(step.route);
      // Wait for navigation and DOM update
      setTimeout(findTargetElement, 500);
    } else {
      setTimeout(findTargetElement, 100);
    }

    // Set up observer to watch for DOM changes
    observerRef.current = new MutationObserver(() => {
      findTargetElement();
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [currentStep, isOpen, step, location.pathname, navigate, findTargetElement]);

  // Handle window resize
  useEffect(() => {
    if (!isOpen) return;
    
    const handleResize = () => findTargetElement();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, findTargetElement]);

  // Text-to-speech
  const speak = useCallback((text: string) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, [audioEnabled]);

  // Speak when step changes
  useEffect(() => {
    if (isOpen && step) {
      speak(step.message);
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentStep, isOpen, step, speak]);

  const handleNext = () => {
    if (isAnimating) return;
    
    window.speechSynthesis?.cancel();
    setIsAnimating(true);
    
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handlePrev = () => {
    if (isAnimating || isFirstStep) return;
    
    window.speechSynthesis?.cancel();
    setIsAnimating(true);
    setCurrentStep(prev => prev - 1);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleSkip = () => {
    window.speechSynthesis?.cancel();
    handleComplete();
  };

  const handleComplete = () => {
    if (user?.id) {
      localStorage.setItem(`tour_completed_${user.id}`, "true");
      toast.success("Tour concluído! Bem-vindo ao Escritório Virtual! 🎉");
    }
    setCurrentStep(0);
    navigate("/home");
    onComplete();
  };

  const toggleAudio = () => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
    }
    setAudioEnabled(!audioEnabled);
  };

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!targetRect) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    const padding = 20;
    const tooltipWidth = 400;
    const tooltipHeight = 280;
    
    // Determine best position
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;
    const spaceRight = window.innerWidth - targetRect.right;
    const spaceLeft = targetRect.left;

    let position: React.CSSProperties = {};

    // Prefer below, then above, then right, then left
    if (spaceBelow > tooltipHeight + padding) {
      position = {
        top: targetRect.bottom + padding,
        left: Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding)),
      };
    } else if (spaceAbove > tooltipHeight + padding) {
      position = {
        top: targetRect.top - tooltipHeight - padding,
        left: Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding)),
      };
    } else if (spaceRight > tooltipWidth + padding) {
      position = {
        top: Math.max(padding, Math.min(targetRect.top + targetRect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - padding)),
        left: targetRect.right + padding,
      };
    } else if (spaceLeft > tooltipWidth + padding) {
      position = {
        top: Math.max(padding, Math.min(targetRect.top + targetRect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - padding)),
        left: targetRect.left - tooltipWidth - padding,
      };
    } else {
      // Fallback to center
      position = {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    return position;
  };

  if (!isOpen) return null;

  const tooltipPosition = getTooltipPosition();
  const spotlightPadding = 8;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - spotlightPadding}
                y={targetRect.top - spotlightPadding}
                width={targetRect.width + spotlightPadding * 2}
                height={targetRect.height + spotlightPadding * 2}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.8)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight border/glow */}
      {targetRect && (
        <div
          className="absolute border-2 border-primary rounded-xl pointer-events-none animate-pulse shadow-[0_0_20px_rgba(var(--primary),0.5)]"
          style={{
            left: targetRect.left - spotlightPadding,
            top: targetRect.top - spotlightPadding,
            width: targetRect.width + spotlightPadding * 2,
            height: targetRect.height + spotlightPadding * 2,
            boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.4)",
          }}
        />
      )}

      {/* Tooltip Card */}
      <div
        className="absolute w-[400px] max-w-[calc(100vw-40px)] bg-card rounded-2xl shadow-2xl border-2 border-border overflow-hidden transition-all duration-300"
        style={tooltipPosition}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground text-xs font-bold">
              {currentStep + 1} de {tourSteps.length}
            </Badge>
            <span className="text-sm font-medium text-muted-foreground">Tour Guiado</span>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={toggleAudio}
            >
              {audioEnabled ? (
                <Volume2 className={`h-4 w-4 ${isSpeaking ? 'text-primary animate-pulse' : ''}`} />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="px-4 pt-3">
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex gap-4">
            {/* Jon Jobs Avatar */}
            <div className="flex-shrink-0">
              <div className="relative">
                <img 
                  src={jonJobsAvatar} 
                  alt="Jon Jobs" 
                  className={`h-16 w-16 rounded-full object-cover ring-2 ring-primary/30 shadow-lg ${isSpeaking ? 'ring-primary ring-4' : ''}`}
                />
                <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full ${step.bgColor}`}>
                  <div className={step.iconColor}>
                    {step.icon}
                  </div>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg mb-1.5">{step.title}</h3>
              <div className="bg-muted/50 rounded-xl rounded-tl-none p-3 relative">
                <div className="absolute -left-2 top-2 w-0 h-0 border-t-[8px] border-t-transparent border-r-[8px] border-r-muted/50 border-b-[8px] border-b-transparent" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.message}
                </p>
              </div>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!isAnimating) {
                    window.speechSynthesis?.cancel();
                    setCurrentStep(index);
                  }
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'w-6 bg-primary' 
                    : index < currentStep 
                      ? 'w-2 bg-primary/50' 
                      : 'w-2 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-3 border-t bg-muted/30">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={isFirstStep || isAnimating}
            size="sm"
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <Button
            onClick={handleNext}
            disabled={isAnimating}
            size="sm"
            className="gap-1"
          >
            {isLastStep ? "Concluir" : "Próximo"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
