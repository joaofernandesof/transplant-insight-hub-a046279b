/**
 * CPG Advocacia Médica - Guided Tour Component
 * Tour interativo para novos usuários do portal jurídico
 */

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
  VolumeX,
  Scale,
  BarChart3,
  Users,
  FileText,
  FolderOpen,
  Calendar,
  Sparkles,
  Rocket,
  Search,
  DollarSign,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  title: string;
  message: string;
  icon: React.ReactNode;
  iconColor: string;
  bgColor: string;
  route?: string;
  targetSelector?: string;
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao CPG Advocacia Médica! 🎉",
    message: "Este é seu portal jurídico completo. Vou te guiar pelas principais funcionalidades para você aproveitar ao máximo o sistema. Vamos começar!",
    icon: <Scale className="h-5 w-5" />,
    iconColor: "text-primary",
    bgColor: "bg-primary/20",
    route: "/cpg",
  },
  {
    id: "search",
    title: "Busca Global",
    message: "Use Ctrl+K ou clique na barra de busca para encontrar rapidamente processos, clientes, tarefas e documentos. A busca é inteligente e mostra resultados em tempo real!",
    icon: <Search className="h-5 w-5" />,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100",
    route: "/cpg",
    targetSelector: "[data-tour='global-search']",
  },
  {
    id: "dashboard",
    title: "Dashboard Jurídico",
    message: "Aqui você tem uma visão geral de todos os seus indicadores: processos ativos, prazos, clientes e métricas de performance da sua operação.",
    icon: <BarChart3 className="h-5 w-5" />,
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-100",
    route: "/cpg",
    targetSelector: "[data-tour='sidebar-dashboard']",
  },
  {
    id: "clients",
    title: "Gestão de Clientes",
    message: "Cadastre e gerencie seus clientes com todos os dados importantes: CPF, contatos, processos vinculados e histórico de atendimentos.",
    icon: <Users className="h-5 w-5" />,
    iconColor: "text-purple-600",
    bgColor: "bg-purple-100",
    route: "/cpg",
    targetSelector: "[data-tour='sidebar-clients']",
  },
  {
    id: "contracts",
    title: "Contratos Digitais",
    message: "Crie contratos com templates personalizados e envie para assinatura digital. Acompanhe o status de cada contrato em tempo real.",
    icon: <FileText className="h-5 w-5" />,
    iconColor: "text-rose-600",
    bgColor: "bg-rose-100",
    route: "/cpg",
    targetSelector: "[data-tour='sidebar-contracts']",
  },
  {
    id: "cases",
    title: "Gestão de Processos",
    message: "Cadastre processos com todos os detalhes, acompanhe movimentações, prazos e andamentos. Tudo em um só lugar!",
    icon: <FolderOpen className="h-5 w-5" />,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100",
    route: "/cpg/legal?tab=cases",
    targetSelector: "[data-tour='sidebar-cases']",
  },
  {
    id: "agenda",
    title: "Agenda Jurídica",
    message: "Visualize todos os compromissos, audiências, prazos e tarefas em uma agenda unificada. Crie eventos e tarefas rapidamente!",
    icon: <Calendar className="h-5 w-5" />,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-100",
    route: "/cpg",
    targetSelector: "[data-tour='sidebar-agenda']",
  },
  {
    id: "financial",
    title: "Módulo Financeiro",
    message: "Controle receitas, despesas, honorários e faturamento. Gere relatórios financeiros e acompanhe a saúde do seu escritório.",
    icon: <DollarSign className="h-5 w-5" />,
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-100",
    route: "/cpg",
    targetSelector: "[data-tour='sidebar-financial']",
  },
  {
    id: "ai",
    title: "IA Jurídica",
    message: "Nossa inteligência artificial te ajuda a gerar petições, analisar documentos e encontrar jurisprudências relevantes para seus casos.",
    icon: <Sparkles className="h-5 w-5" />,
    iconColor: "text-violet-600",
    bgColor: "bg-violet-100",
    route: "/cpg/legal?tab=ai",
    targetSelector: "[data-tour='sidebar-ai']",
  },
  {
    id: "university",
    title: "Universidade CPG",
    message: "Acesse cursos, capacitações e materiais exclusivos para aprimorar sua atuação jurídica. Evolua constantemente!",
    icon: <GraduationCap className="h-5 w-5" />,
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-100",
    route: "/cpg",
    targetSelector: "[data-tour='sidebar-university']",
  },
  {
    id: "complete",
    title: "Tudo pronto! 🚀",
    message: "Agora você conhece os principais recursos do CPG Advocacia Médica. Explore cada módulo, use a busca global (Ctrl+K) e aproveite todas as funcionalidades. Bom trabalho!",
    icon: <Rocket className="h-5 w-5" />,
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-100",
    route: "/cpg",
  }
];

interface IpromedGuidedTourProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function IpromedGuidedTour({ isOpen, onComplete }: IpromedGuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
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
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTargetRect(null);
    }
  }, [step]);

  // Navigate to correct route and find element
  useEffect(() => {
    if (!isOpen || !step) return;

    if (step.route && location.pathname !== step.route.split('?')[0]) {
      navigate(step.route);
      setTimeout(findTargetElement, 500);
    } else {
      setTimeout(findTargetElement, 100);
    }

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

  useEffect(() => {
    if (isOpen && step && audioEnabled) {
      speak(step.message);
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentStep, isOpen, step, speak, audioEnabled]);

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
      localStorage.setItem(`ipromed_tour_completed_${user.id}`, "true");
      toast.success("Tour concluído! Bem-vindo ao CPG Advocacia Médica! 🎉");
    }
    setCurrentStep(0);
    navigate("/cpg");
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
    
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;
    const spaceRight = window.innerWidth - targetRect.right;
    const spaceLeft = targetRect.left;

    let position: React.CSSProperties = {};

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
      position = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    return position;
  };

  if (!isOpen) return null;

  const tooltipPosition = getTooltipPosition();
  const spotlightPadding = 8;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="ipromed-spotlight-mask">
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
          mask="url(#ipromed-spotlight-mask)"
        />
      </svg>

      {/* Spotlight border/glow */}
      {targetRect && (
        <div
          className="absolute border-2 border-primary rounded-xl pointer-events-none animate-pulse"
          style={{
            left: targetRect.left - spotlightPadding,
            top: targetRect.top - spotlightPadding,
            width: targetRect.width + spotlightPadding * 2,
            height: targetRect.height + spotlightPadding * 2,
            boxShadow: "0 0 0 4px rgba(0, 98, 155, 0.3), 0 0 30px rgba(0, 98, 155, 0.4)",
          }}
        />
      )}

      {/* Tooltip Card */}
      <div
        className="absolute w-[400px] max-w-[calc(100vw-40px)] bg-card rounded-2xl shadow-2xl border-2 border-border overflow-hidden transition-all duration-300"
        style={tooltipPosition}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-primary/5">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground text-xs font-bold">
              {currentStep + 1} de {tourSteps.length}
            </Badge>
            <span className="text-sm font-medium text-muted-foreground">Tour CPG</span>
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
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg",
                step.bgColor
              )}>
                <div className={step.iconColor}>
                  {step.icon}
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
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentStep 
                    ? 'w-6 bg-primary' 
                    : index < currentStep 
                      ? 'w-2 bg-primary/50' 
                      : 'w-2 bg-muted-foreground/30'
                )}
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
            className="gap-1 bg-primary hover:bg-primary/90"
          >
            {isLastStep ? "Concluir" : "Próximo"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
