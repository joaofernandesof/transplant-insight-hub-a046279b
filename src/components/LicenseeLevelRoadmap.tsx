import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

type LicenseeTier = 'basic' | 'pro' | 'expert' | 'master' | 'elite' | 'titan' | 'legacy';

interface TierLevel {
  key: LicenseeTier;
  name: string;
  revenue: string;
  avgRevenue: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const tierLevels: TierLevel[] = [
  { 
    key: 'basic', 
    name: 'Basic', 
    revenue: 'R$ 50 mil',
    avgRevenue: 'Faturamento Médio',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-200',
    borderColor: 'border-indigo-300'
  },
  { 
    key: 'pro', 
    name: 'Pro', 
    revenue: 'R$ 100 mil',
    avgRevenue: 'Faturamento Médio',
    color: 'text-blue-700',
    bgColor: 'bg-blue-200',
    borderColor: 'border-blue-300'
  },
  { 
    key: 'expert', 
    name: 'Expert', 
    revenue: 'R$ 200 mil',
    avgRevenue: 'Faturamento Médio',
    color: 'text-lime-700',
    bgColor: 'bg-lime-300',
    borderColor: 'border-lime-400'
  },
  { 
    key: 'master', 
    name: 'Master', 
    revenue: 'R$ 500 mil',
    avgRevenue: 'Faturamento Médio',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-300',
    borderColor: 'border-yellow-400'
  },
  { 
    key: 'elite', 
    name: 'Elite', 
    revenue: 'R$ 750 mil',
    avgRevenue: 'Faturamento Médio',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-300',
    borderColor: 'border-cyan-400'
  },
  { 
    key: 'titan', 
    name: 'Titan', 
    revenue: 'R$ 1 milhão',
    avgRevenue: 'Faturamento Médio',
    color: 'text-pink-700',
    bgColor: 'bg-pink-300',
    borderColor: 'border-pink-400'
  },
  { 
    key: 'legacy', 
    name: 'Legacy', 
    revenue: 'R$ 2 milhões+',
    avgRevenue: 'Faturamento Médio',
    color: 'text-rose-700',
    bgColor: 'bg-rose-400',
    borderColor: 'border-rose-500'
  },
];

interface LicenseeLevelRoadmapProps {
  currentTier: LicenseeTier;
}

export function LicenseeLevelRoadmap({ currentTier }: LicenseeLevelRoadmapProps) {
  const currentIndex = tierLevels.findIndex(t => t.key === currentTier);

  return (
    <Card className="border border-border/50 bg-card/50 backdrop-blur-sm mb-6 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Roadmap de Licenciamento por Níveis
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {/* Scrollable container for mobile */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[700px]">
            {/* Tier Names Row */}
            <div className="flex gap-2 mb-2">
              {tierLevels.map((tier, index) => {
                const isCurrent = index === currentIndex;
                const isPast = index < currentIndex;
                
                return (
                  <div 
                    key={tier.key} 
                    className="flex-1 text-center"
                  >
                    <Badge 
                      className={cn(
                        "w-full justify-center py-1.5 px-2 text-xs font-semibold transition-all",
                        tier.bgColor,
                        tier.color,
                        "border-0 hover:opacity-90",
                        isCurrent && "ring-2 ring-offset-1 ring-primary shadow-lg scale-105",
                        isPast && "opacity-60"
                      )}
                    >
                      Licenciado {tier.name}
                    </Badge>
                  </div>
                );
              })}
            </div>

            {/* Average Revenue Row */}
            <div className="flex gap-2 mb-3">
              {tierLevels.map((tier, index) => {
                const isCurrent = index === currentIndex;
                const isPast = index < currentIndex;
                
                return (
                  <div key={`avg-${tier.key}`} className="flex-1 text-center">
                    <Badge 
                      variant="outline"
                      className={cn(
                        "w-full justify-center py-1 px-2 text-[10px] font-medium",
                        tier.bgColor,
                        tier.color,
                        tier.borderColor,
                        isCurrent && "ring-1 ring-primary",
                        isPast && "opacity-60"
                      )}
                    >
                      {tier.avgRevenue}
                    </Badge>
                  </div>
                );
              })}
            </div>

            {/* Timeline with Arrow */}
            <div className="relative py-4">
              {/* Arrow Line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-foreground -translate-y-1/2" />
              
              {/* Arrow Head */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2">
                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-foreground" />
              </div>
              
              {/* Vertical Dotted Lines */}
              <div className="flex gap-2 relative">
                {tierLevels.map((tier, index) => {
                  const isCurrent = index === currentIndex;
                  
                  return (
                    <div key={`line-${tier.key}`} className="flex-1 flex justify-center">
                      <div 
                        className={cn(
                          "w-0.5 h-8 border-l-2 border-dashed",
                          isCurrent ? "border-primary" : "border-muted-foreground/50"
                        )} 
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Revenue Values Row */}
            <div className="flex gap-2">
              {tierLevels.map((tier, index) => {
                const isCurrent = index === currentIndex;
                const isPast = index < currentIndex;
                
                return (
                  <div key={`rev-${tier.key}`} className="flex-1 text-center">
                    <Badge 
                      variant="outline"
                      className={cn(
                        "w-full justify-center py-1.5 px-2 text-xs font-bold",
                        tier.bgColor,
                        tier.color,
                        tier.borderColor,
                        isCurrent && "ring-2 ring-offset-1 ring-primary shadow-md scale-105",
                        isPast && "opacity-60"
                      )}
                    >
                      {tier.revenue}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current Level Indicator */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-border/50">
          <span className="text-sm text-muted-foreground">Seu nível atual:</span>
          <Badge 
            className={cn(
              "py-1 px-3 font-bold",
              tierLevels[currentIndex].bgColor,
              tierLevels[currentIndex].color
            )}
          >
            Licenciado {tierLevels[currentIndex].name}
          </Badge>
          <span className="text-xs text-muted-foreground">
            ({currentIndex + 1} de {tierLevels.length})
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
