import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Video, 
  BookOpen, 
  Palette, 
  TrendingUp, 
  Flame,
  Gift,
  Users,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle,
  Rocket,
  Volume2,
  VolumeX
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import jonJobsAvatar from "@/assets/jon-jobs-avatar.png";

interface TourStep {
  id: string;
  title: string;
  jonJobsMessage: string;
  icon: React.ReactNode;
  route?: string;
  color: string;
  bgColor: string;
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao Escritório Virtual! 🎉",
    jonJobsMessage: "Olá! Eu sou o Jon Jobs, seu assistente virtual. Vou te guiar por todo o sistema para você aproveitar ao máximo sua Licença ByNeofolic. Vamos lá?",
    icon: <Sparkles className="h-6 w-6" />,
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    id: "dashboard",
    title: "Dashboard de Métricas",
    jonJobsMessage: "Aqui você acompanha seus KPIs semanais, o funil de vendas e recebe insights automáticos para melhorar seus resultados. É seu painel de controle principal!",
    icon: <BarChart3 className="h-6 w-6" />,
    route: "/dashboard",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    id: "university",
    title: "Academia ByNeofolic",
    jonJobsMessage: "Na Academia você encontra trilhas de capacitação, aulas gravadas e imersões exclusivas. Tudo que precisa para dominar as técnicas de transplante capilar!",
    icon: <Video className="h-6 w-6" />,
    route: "/university",
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  },
  {
    id: "materials",
    title: "Central de Materiais",
    jonJobsMessage: "Precisa de um protocolo ou script de vendas? Aqui você encontra POPs, contratos, termos e todos os documentos necessários para sua operação.",
    icon: <BookOpen className="h-6 w-6" />,
    route: "/materials",
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  {
    id: "marketing",
    title: "Central de Marketing",
    jonJobsMessage: "Templates prontos, campanhas validadas e banco de mídia! Tudo para sua clínica brilhar nas redes sociais e atrair mais pacientes.",
    icon: <Palette className="h-6 w-6" />,
    route: "/marketing",
    color: "text-pink-600",
    bgColor: "bg-pink-100"
  },
  {
    id: "hotleads",
    title: "HotLeads",
    jonJobsMessage: "Este é um dos maiores benefícios da licença! Você recebe leads qualificados diretamente. Quanto mais você evolui na carreira, mais leads recebe!",
    icon: <Flame className="h-6 w-6" />,
    route: "/hotleads",
    color: "text-red-600",
    bgColor: "bg-red-100"
  },
  {
    id: "career",
    title: "Plano de Carreira",
    jonJobsMessage: "Evolua do nível Basic ao Legacy! A cada nível você desbloqueia novos benefícios e aumenta sua participação nos HotLeads. É sua jornada de crescimento!",
    icon: <TrendingUp className="h-6 w-6" />,
    route: "/career",
    color: "text-amber-600",
    bgColor: "bg-amber-100"
  },
  {
    id: "referral",
    title: "Indique e Ganhe",
    jonJobsMessage: "Conhece alguém que se beneficiaria da licença? Indique e ganhe 5% de comissão! Seu link exclusivo está te esperando.",
    icon: <Gift className="h-6 w-6" />,
    route: "/indique-e-ganhe",
    color: "text-rose-600",
    bgColor: "bg-rose-100"
  },
  {
    id: "mentorship",
    title: "Mentoria & Suporte",
    jonJobsMessage: "Aqui você agenda mentorias individuais, participa do grupo exclusivo e se conecta com outros licenciados. Nunca estará sozinho nessa jornada!",
    icon: <Users className="h-6 w-6" />,
    route: "/mentorship",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100"
  },
  {
    id: "complete",
    title: "Tudo pronto! 🚀",
    jonJobsMessage: "Parabéns! Agora você conhece todo o sistema. Complete seu perfil, explore os módulos e comece sua jornada de sucesso. Estarei sempre aqui para ajudar!",
    icon: <Rocket className="h-6 w-6" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100"
  }
];

interface GuidedTourProps {
  onComplete: () => void;
  isOpen: boolean;
}

export default function GuidedTour({ onComplete, isOpen }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  // Text-to-speech using browser's SpeechSynthesis
  const speak = useCallback((text: string) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
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
      speak(step.jonJobsMessage);
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
    setTimeout(() => {
      if (isLastStep) {
        handleComplete();
      } else {
        setCurrentStep(prev => prev + 1);
      }
      setIsAnimating(false);
    }, 150);
  };

  const handlePrev = () => {
    if (isAnimating || isFirstStep) return;
    
    window.speechSynthesis?.cancel();
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => prev - 1);
      setIsAnimating(false);
    }, 150);
  };

  const handleSkip = () => {
    window.speechSynthesis?.cancel();
    handleComplete();
  };

  const handleComplete = () => {
    if (user?.id) {
      localStorage.setItem(`tour_completed_${user.id}`, "true");
      toast.success("Tour concluído! Bem-vindo à família ByNeofolic! 🎉");
    }
    setCurrentStep(0);
    onComplete();
  };

  const handleExplore = () => {
    if (step.route) {
      window.speechSynthesis?.cancel();
      navigate(step.route);
      handleComplete();
    }
  };

  const toggleAudio = () => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
    }
    setAudioEnabled(!audioEnabled);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <Card className={`w-full max-w-lg shadow-2xl border-2 transition-all duration-300 ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {currentStep + 1} de {tourSteps.length}
              </Badge>
              <span className="text-sm text-muted-foreground">Tour Guiado</span>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={toggleAudio}
                title={audioEnabled ? "Desativar áudio" : "Ativar áudio"}
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
          <div className="px-6 pt-4">
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Jon Jobs Avatar + Message */}
            <div className="flex gap-4 mb-6">
              <div className="flex-shrink-0">
                <div className="relative">
                  <img 
                    src={jonJobsAvatar} 
                    alt="Jon Jobs" 
                    className={`h-16 w-16 rounded-full object-cover ring-2 ring-primary/30 shadow-lg ${isSpeaking ? 'ring-primary animate-pulse' : ''}`}
                  />
                  <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full ${step.bgColor}`}>
                    <div className={step.color}>
                      {step.icon}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <div className="bg-muted/50 rounded-xl rounded-tl-none p-3 relative">
                  {/* Speech bubble pointer */}
                  <div className="absolute -left-2 top-2 w-0 h-0 border-t-[8px] border-t-transparent border-r-[8px] border-r-muted/50 border-b-[8px] border-b-transparent" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.jonJobsMessage}
                  </p>
                </div>
              </div>
            </div>

            {/* Step indicators */}
            <div className="flex justify-center gap-1.5">
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
          <div className="flex items-center justify-between p-4 border-t bg-muted/20">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={isFirstStep || isAnimating}
              className="gap-1"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="flex gap-2">
              {step.route && !isLastStep && (
                <Button
                  variant="outline"
                  onClick={handleExplore}
                  size="sm"
                >
                  Explorar
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                disabled={isAnimating}
                className="gap-1"
                size="sm"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Concluir
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
