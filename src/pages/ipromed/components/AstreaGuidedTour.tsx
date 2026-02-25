/**
 * IPROMED - Astrea-style Guided Tour
 * Tour guiado com tooltips azuis inspirado no Astrea
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  title: string;
  message: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Área de Trabalho',
    message: 'A Área de Trabalho oferece uma visão global e das suas tarefas do dia e movimentações dos seus processos.\n\n👉 Use o menu à esquerda para navegar por todas as funcionalidades.',
    position: 'right',
  },
  {
    id: 'alerts',
    title: 'Alertas',
    message: 'Agora vamos aos Alertas do sistema.',
    targetSelector: '[data-tour="alerts"]',
    position: 'right',
  },
  {
    id: 'publications-tracking',
    title: 'Acompanhe cada publicação ⭐',
    message: 'Com o CPG Advocacia, você não perde novidade de vista.',
    position: 'bottom',
  },
  {
    id: 'important-andamentos',
    title: 'Classificação automática ⭐',
    message: 'A nossa IA captura e analisa todas as movimentações e sinaliza o que realmente merece sua atenção.',
    position: 'bottom',
  },
  {
    id: 'andamentos-ia',
    title: 'Andamentos importantes',
    message: 'Todos os andamentos importantes estarão sinalizados pela nossa IA.',
    position: 'left',
  },
  {
    id: 'create-task',
    title: 'Crie tarefas rapidamente',
    message: 'Recebeu um andamento? Crie a tarefa ou o evento na mesma hora e conecte tudo à sua agenda.',
    position: 'left',
  },
  {
    id: 'task-form',
    title: 'Detalhes da tarefa',
    message: 'Também é possível adicionar data, responsável e prioridade.',
    position: 'left',
  },
  {
    id: 'publications',
    title: 'Publicações',
    message: 'Agora vamos conhecer a parte de Publicações.',
    targetSelector: '[data-tour="publications"]',
    position: 'right',
  },
  {
    id: 'publications-search',
    title: 'Recebimento de publicações ⭐',
    message: 'Nossa busca por nome e OAB garante que nada seja perdido, recebendo publicações mesmo que o processo ainda não esteja cadastrado no sistema.',
    position: 'bottom',
  },
];

interface AstreaGuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function AstreaGuidedTour({ isOpen, onClose, onComplete }: AstreaGuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  useEffect(() => {
    if (!isOpen) return;

    // Calculate position based on target element or center
    if (step.targetSelector) {
      const target = document.querySelector(step.targetSelector);
      if (target) {
        const rect = target.getBoundingClientRect();
        const pos = { top: 0, left: 0 };
        
        switch (step.position) {
          case 'right':
            pos.top = rect.top + rect.height / 2;
            pos.left = rect.right + 20;
            break;
          case 'left':
            pos.top = rect.top + rect.height / 2;
            pos.left = rect.left - 320;
            break;
          case 'bottom':
            pos.top = rect.bottom + 20;
            pos.left = rect.left + rect.width / 2 - 150;
            break;
          case 'top':
            pos.top = rect.top - 120;
            pos.left = rect.left + rect.width / 2 - 150;
            break;
        }
        setPosition(pos);
      }
    } else {
      // Center on screen
      setPosition({
        top: window.innerHeight / 2 - 60,
        left: window.innerWidth / 2 - 150,
      });
    }
  }, [currentStep, isOpen, step]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-[999]" onClick={handleSkip} />
      
      {/* Tooltip */}
      <div
        className="fixed z-[1000] w-[300px] animate-in fade-in-0 zoom-in-95"
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        {/* Arrow */}
        <div
          className={cn(
            "absolute w-0 h-0",
            step.position === 'right' && "border-t-[10px] border-t-transparent border-r-[12px] border-r-[#4A90D9] border-b-[10px] border-b-transparent -left-3 top-4",
            step.position === 'left' && "border-t-[10px] border-t-transparent border-l-[12px] border-l-[#4A90D9] border-b-[10px] border-b-transparent -right-3 top-4",
            step.position === 'bottom' && "border-l-[10px] border-l-transparent border-b-[12px] border-b-[#4A90D9] border-r-[10px] border-r-transparent -top-3 left-1/2 -translate-x-1/2",
            step.position === 'top' && "border-l-[10px] border-l-transparent border-t-[12px] border-t-[#4A90D9] border-r-[10px] border-r-transparent -bottom-3 left-1/2 -translate-x-1/2"
          )}
        />
        
        {/* Content */}
        <div className="bg-[#4A90D9] text-white rounded-lg shadow-xl p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold">{step.title}</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/10 -mt-1 -mr-1"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-white/90 whitespace-pre-line mb-4">
            {step.message}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70">
              {currentStep + 1} de {tourSteps.length}
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleNext}
              className="bg-white text-[#4A90D9] hover:bg-white/90"
            >
              {isLastStep ? 'Concluir' : 'Próximo'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
