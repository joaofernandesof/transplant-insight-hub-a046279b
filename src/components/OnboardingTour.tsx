import { useState, useEffect } from "react";
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
  Rocket
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route?: string;
  color: string;
  bgColor: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo à Licença ByNeofolic! 🎉",
    description: "Este é o seu portal completo para gestão da sua clínica de transplante capilar. Vamos conhecer as principais funcionalidades?",
    icon: <Sparkles className="h-8 w-8" />,
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    id: "dashboard",
    title: "Dashboard de Métricas",
    description: "Acompanhe seus KPIs semanais, funil de vendas e receba insights automáticos do mentor virtual para melhorar seus resultados.",
    icon: <BarChart3 className="h-8 w-8" />,
    route: "/dashboard",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    id: "university",
    title: "Universidade ByNeofolic",
    description: "Acesse trilhas de capacitação completas, aulas gravadas e imersões exclusivas para dominar todas as técnicas.",
    icon: <Video className="h-8 w-8" />,
    route: "/university",
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  },
  {
    id: "materials",
    title: "Central de Materiais",
    description: "Encontre POPs, protocolos, scripts de vendas, contratos e todos os documentos necessários para sua operação.",
    icon: <BookOpen className="h-8 w-8" />,
    route: "/materials",
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  {
    id: "marketing",
    title: "Central de Marketing",
    description: "Templates prontos, campanhas validadas, banco de mídia e materiais de branding para sua clínica brilhar.",
    icon: <Palette className="h-8 w-8" />,
    route: "/marketing",
    color: "text-pink-600",
    bgColor: "bg-pink-100"
  },
  {
    id: "hotleads",
    title: "HotLeads",
    description: "Receba leads qualificados diretamente na sua clínica. Quanto mais você avança na carreira, mais leads você recebe!",
    icon: <Flame className="h-8 w-8" />,
    route: "/hotleads",
    color: "text-red-600",
    bgColor: "bg-red-100"
  },
  {
    id: "career",
    title: "Plano de Carreira",
    description: "Evolua do nível Basic ao Legacy desbloqueando benefícios exclusivos e aumentando sua participação nos HotLeads.",
    icon: <TrendingUp className="h-8 w-8" />,
    route: "/career",
    color: "text-amber-600",
    bgColor: "bg-amber-100"
  },
  {
    id: "referral",
    title: "Indique e Ganhe",
    description: "Ganhe 5% de comissão indicando novos licenciados. Seu link exclusivo está esperando por você!",
    icon: <Gift className="h-8 w-8" />,
    route: "/indique-e-ganhe",
    color: "text-rose-600",
    bgColor: "bg-rose-100"
  },
  {
    id: "mentorship",
    title: "Mentoria & Suporte",
    description: "Agende mentorias, participe do grupo exclusivo e conecte-se com outros licenciados e especialistas.",
    icon: <Users className="h-8 w-8" />,
    route: "/mentorship",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100"
  },
  {
    id: "complete",
    title: "Tudo pronto! 🚀",
    description: "Você está pronto para começar. Explore o portal, preencha seus dados e comece sua jornada de sucesso!",
    icon: <Rocket className="h-8 w-8" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100"
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
  isOpen: boolean;
}

export default function OnboardingTour({ onComplete, isOpen }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const step = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isAnimating) return;
    
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
    
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => prev - 1);
      setIsAnimating(false);
    }, 150);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    if (user?.id) {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ 
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString()
          })
          .eq("user_id", user.id);

        if (error) throw error;
        
        toast.success("Onboarding concluído! Bem-vindo à família ByNeofolic! 🎉");
      } catch (error) {
        console.error("Error completing onboarding:", error);
      }
    }
    onComplete();
  };

  const handleExplore = () => {
    if (step.route) {
      navigate(step.route);
      handleComplete();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className={`w-full max-w-lg shadow-2xl border-2 transition-all duration-300 ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {currentStep + 1} de {onboardingSteps.length}
              </Badge>
              <span className="text-sm text-muted-foreground">Tutorial</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="px-6 pt-4">
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            {/* Icon */}
            <div className={`mx-auto w-20 h-20 rounded-2xl ${step.bgColor} flex items-center justify-center mb-6 shadow-lg`}>
              <div className={step.color}>
                {step.icon}
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-3">
              {step.title}
            </h2>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed mb-6">
              {step.description}
            </p>

            {/* Step indicators */}
            <div className="flex justify-center gap-1.5 mb-6">
              {onboardingSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => !isAnimating && setCurrentStep(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep 
                      ? 'w-8 bg-primary' 
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
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="flex gap-2">
              {step.route && !isLastStep && (
                <Button
                  variant="outline"
                  onClick={handleExplore}
                  className="gap-2"
                >
                  Explorar Agora
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                disabled={isAnimating}
                className="gap-2"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Começar!
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
