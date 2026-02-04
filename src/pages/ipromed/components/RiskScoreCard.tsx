/**
 * CPG Advocacia Médica - Risk Score Card Component
 * Exibe o score de risco de um cliente com breakdown por categoria
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2,
  TrendingUp,
  Building2,
  Gavel,
  FileWarning
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskScore {
  crm_score: number;
  civel_score: number;
  criminal_score: number;
  total_score: number;
  risk_level: 'low' | 'medium' | 'high';
  crm_factors?: string[];
  civel_factors?: string[];
  criminal_factors?: string[];
}

interface RiskScoreCardProps {
  score: RiskScore | null;
  clientName?: string;
  compact?: boolean;
  onEdit?: () => void;
}

const riskLevelConfig = {
  low: {
    label: 'Baixo',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    borderColor: 'border-emerald-200',
    icon: CheckCircle2,
  },
  medium: {
    label: 'Médio',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-200',
    icon: AlertTriangle,
  },
  high: {
    label: 'Alto',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    borderColor: 'border-rose-200',
    icon: AlertCircle,
  },
};

const categoryConfig = {
  crm: {
    label: 'CRM/Ético',
    weight: '40%',
    icon: Shield,
    description: 'Conselho Regional de Medicina',
  },
  civel: {
    label: 'Cível',
    weight: '35%',
    icon: Building2,
    description: 'Processos cíveis e contratuais',
  },
  criminal: {
    label: 'Criminal',
    weight: '25%',
    icon: Gavel,
    description: 'Responsabilidade penal',
  },
};

function getScoreColor(score: number) {
  if (score >= 70) return 'text-rose-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-emerald-600';
}

function getProgressColor(score: number) {
  if (score >= 70) return 'bg-rose-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export default function RiskScoreCard({ 
  score, 
  clientName,
  compact = false,
  onEdit 
}: RiskScoreCardProps) {
  // Default score if null
  const displayScore: RiskScore = score || {
    crm_score: 0,
    civel_score: 0,
    criminal_score: 0,
    total_score: 0,
    risk_level: 'low',
  };

  const config = riskLevelConfig[displayScore.risk_level];
  const RiskIcon = config.icon;

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg border",
        config.bgColor,
        config.borderColor
      )}>
        <div className={cn("p-2 rounded-full", config.bgColor)}>
          <RiskIcon className={cn("h-5 w-5", config.color)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Risco</span>
            <Badge className={cn(config.bgColor, config.color)}>
              {config.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("text-2xl font-bold", config.color)}>
              {displayScore.total_score}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-muted-foreground" />
            Análise de Risco
            {clientName && (
              <span className="text-muted-foreground font-normal">
                - {clientName}
              </span>
            )}
          </CardTitle>
          <Badge className={cn(config.bgColor, config.color, "gap-1")}>
            <RiskIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Score */}
        <div className="text-center py-4 border-b">
          <div className="flex items-center justify-center gap-2">
            <span className={cn("text-5xl font-bold", config.color)}>
              {displayScore.total_score}
            </span>
            <span className="text-xl text-muted-foreground">/100</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Score Total Ponderado
          </p>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          {/* CRM */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{categoryConfig.crm.label}</span>
                <Badge variant="outline" className="text-[10px]">
                  {categoryConfig.crm.weight}
                </Badge>
              </div>
              <span className={cn("font-semibold", getScoreColor(displayScore.crm_score))}>
                {displayScore.crm_score}
              </span>
            </div>
            <Progress 
              value={displayScore.crm_score} 
              className="h-2"
              style={{
                ['--progress-background' as any]: getProgressColor(displayScore.crm_score)
              }}
            />
            {displayScore.crm_factors && displayScore.crm_factors.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {displayScore.crm_factors.slice(0, 3).map((factor, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">
                    {factor}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Cível */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{categoryConfig.civel.label}</span>
                <Badge variant="outline" className="text-[10px]">
                  {categoryConfig.civel.weight}
                </Badge>
              </div>
              <span className={cn("font-semibold", getScoreColor(displayScore.civel_score))}>
                {displayScore.civel_score}
              </span>
            </div>
            <Progress 
              value={displayScore.civel_score} 
              className="h-2"
            />
            {displayScore.civel_factors && displayScore.civel_factors.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {displayScore.civel_factors.slice(0, 3).map((factor, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">
                    {factor}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Criminal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gavel className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{categoryConfig.criminal.label}</span>
                <Badge variant="outline" className="text-[10px]">
                  {categoryConfig.criminal.weight}
                </Badge>
              </div>
              <span className={cn("font-semibold", getScoreColor(displayScore.criminal_score))}>
                {displayScore.criminal_score}
              </span>
            </div>
            <Progress 
              value={displayScore.criminal_score} 
              className="h-2"
            />
            {displayScore.criminal_factors && displayScore.criminal_factors.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {displayScore.criminal_factors.slice(0, 3).map((factor, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">
                    {factor}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>0-39 Baixo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>40-69 Médio</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span>70-100 Alto</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
