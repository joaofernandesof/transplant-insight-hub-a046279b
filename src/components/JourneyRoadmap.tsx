import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Star, 
  Award, 
  Trophy, 
  Gem, 
  Crown, 
  Sparkles,
  ChevronRight,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

type LicenseeTier = 'basic' | 'pro' | 'expert' | 'master' | 'elite' | 'titan' | 'legacy';

interface TierStep {
  key: LicenseeTier;
  name: string;
  threshold: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const tierSteps: TierStep[] = [
  { key: 'basic', name: 'Basic', threshold: '50 mil', icon: <Shield className="h-4 w-4" />, color: 'text-slate-600', bgColor: 'bg-slate-100' },
  { key: 'pro', name: 'Pro', threshold: '100 mil', icon: <Star className="h-4 w-4" />, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { key: 'expert', name: 'Expert', threshold: '200 mil', icon: <Award className="h-4 w-4" />, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { key: 'master', name: 'Master', threshold: '500 mil', icon: <Trophy className="h-4 w-4" />, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  { key: 'elite', name: 'Elite', threshold: '750 mil', icon: <Gem className="h-4 w-4" />, color: 'text-rose-600', bgColor: 'bg-rose-100' },
  { key: 'titan', name: 'Titan', threshold: '1M', icon: <Crown className="h-4 w-4" />, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  { key: 'legacy', name: 'Legacy', threshold: '2M+', icon: <Sparkles className="h-4 w-4" />, color: 'text-amber-500', bgColor: 'bg-gradient-to-r from-amber-100 to-yellow-100' },
];

interface JourneyRoadmapProps {
  currentTier: LicenseeTier;
}

export function JourneyRoadmap({ currentTier }: JourneyRoadmapProps) {
  const navigate = useNavigate();
  const currentIndex = tierSteps.findIndex(t => t.key === currentTier);
  const progressPercent = Math.round(((currentIndex + 1) / tierSteps.length) * 100);

  return (
    <Card className="border border-border/50 bg-card/50 backdrop-blur-sm mb-6">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Sua Jornada</span>
            <Badge variant="secondary" className="text-xs font-medium">
              {currentIndex + 1}/{tierSteps.length}
            </Badge>
            <span className="text-xs text-muted-foreground">• {progressPercent}% concluído</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/career")}
            className="text-xs h-7 gap-1"
          >
            Ver detalhes
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        {/* Horizontal Timeline */}
        <div className="relative">
          {/* Progress Line Background */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted rounded-full" />
          
          {/* Progress Line Filled */}
          <div 
            className="absolute top-5 left-0 h-0.5 bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(currentIndex / (tierSteps.length - 1)) * 100}%` }}
          />

          {/* Steps */}
          <div className="relative flex justify-between">
            {tierSteps.map((step, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isFuture = index > currentIndex;

              return (
                <div key={step.key} className="flex flex-col items-center">
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10",
                      isCompleted && "bg-primary border-primary text-primary-foreground",
                      isCurrent && `${step.bgColor} border-2 ${step.color} ring-4 ring-offset-2 shadow-lg`,
                      isCurrent && step.key === 'basic' && "border-slate-400 ring-slate-200",
                      isCurrent && step.key === 'pro' && "border-blue-400 ring-blue-200",
                      isCurrent && step.key === 'expert' && "border-purple-400 ring-purple-200",
                      isCurrent && step.key === 'master' && "border-amber-400 ring-amber-200",
                      isCurrent && step.key === 'elite' && "border-rose-400 ring-rose-200",
                      isCurrent && step.key === 'titan' && "border-emerald-400 ring-emerald-200",
                      isCurrent && step.key === 'legacy' && "border-amber-500 ring-amber-200",
                      isFuture && "bg-muted border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : step.icon}
                  </div>

                  {/* Label */}
                  <div className="mt-2 text-center">
                    <p className={cn(
                      "text-xs font-medium",
                      isCurrent && `${step.color} font-bold`,
                      isFuture && "text-muted-foreground",
                      isCompleted && "text-foreground"
                    )}>
                      {step.name}
                    </p>
                    <p className={cn(
                      "text-[10px]",
                      isCurrent ? step.color : "text-muted-foreground"
                    )}>
                      {step.threshold}
                    </p>
                  </div>

                  {/* Current Badge */}
                  {isCurrent && (
                    <Badge className={cn(
                      "mt-1 text-[10px] h-4 border-0 gap-0.5",
                      step.key === 'basic' && "bg-slate-200 text-slate-700",
                      step.key === 'pro' && "bg-blue-200 text-blue-700",
                      step.key === 'expert' && "bg-purple-200 text-purple-700",
                      step.key === 'master' && "bg-amber-200 text-amber-700",
                      step.key === 'elite' && "bg-rose-200 text-rose-700",
                      step.key === 'titan' && "bg-emerald-200 text-emerald-700",
                      step.key === 'legacy' && "bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-700"
                    )}>
                      <Sparkles className="h-2.5 w-2.5" />
                      Atual
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
