/**
 * CPG Advocacia Médica - Risk Scoring Card
 * Componente para exibir e calcular scoring de risco jurídico
 * Pesos: CRM 40%, Cível 35%, Criminal 25%
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Shield,
  Scale,
  Gavel,
  Loader2,
  RefreshCw,
  Info,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RiskData {
  risk_crm: { score: number; justificativa: string };
  risk_civel: { score: number; justificativa: string };
  risk_criminal: { score: number; justificativa: string };
  total_score: number;
  classification: string;
  recommendations: string[];
}

interface RiskScoringCardProps {
  clientId?: string;
  clientName?: string;
  caseId?: string;
  caseDescription?: string;
  initialRiskData?: RiskData;
  onRiskCalculated?: (data: RiskData) => void;
}

const riskColors = {
  baixo: "bg-emerald-500",
  medio: "bg-amber-500",
  alto: "bg-orange-500",
  critico: "bg-rose-500",
};

const riskLabels = {
  baixo: "Baixo",
  medio: "Médio",
  alto: "Alto",
  critico: "Crítico",
};

export default function RiskScoringCard({
  clientId,
  clientName,
  caseId,
  caseDescription,
  initialRiskData,
  onRiskCalculated,
}: RiskScoringCardProps) {
  const [description, setDescription] = useState(caseDescription || "");
  const [riskData, setRiskData] = useState<RiskData | null>(initialRiskData || null);

  const calculateRiskMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const { data, error } = await supabase.functions.invoke("ai-legal-document", {
        body: {
          prompt,
          action: "risk_scoring",
          context: { clientName, caseId },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.riskData) {
        setRiskData(data.riskData);
        onRiskCalculated?.(data.riskData);
        toast.success("Análise de risco concluída!");
      } else {
        toast.error("Não foi possível extrair os dados de risco");
      }
    },
    onError: (error: any) => {
      console.error("Risk scoring error:", error);
      toast.error(error.message || "Erro ao calcular risco");
    },
  });

  const handleCalculate = () => {
    if (!description.trim()) {
      toast.error("Descreva o caso para análise de risco");
      return;
    }
    calculateRiskMutation.mutate(description);
  };

  const getScoreColor = (score: number) => {
    if (score <= 30) return "text-emerald-600";
    if (score <= 60) return "text-amber-600";
    if (score <= 80) return "text-orange-600";
    return "text-rose-600";
  };

  const getProgressColor = (score: number) => {
    if (score <= 30) return "bg-emerald-500";
    if (score <= 60) return "bg-amber-500";
    if (score <= 80) return "bg-orange-500";
    return "bg-rose-500";
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Scoring de Risco Jurídico
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  <strong>Pesos:</strong><br />
                  CRM (Ético): 40%<br />
                  Cível: 35%<br />
                  Criminal: 25%
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!riskData ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição do Caso</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o caso, incluindo: especialidade médica, procedimento realizado, queixa do paciente, documentação existente (prontuário, TCLE), histórico de reclamações..."
                rows={5}
                className="resize-none"
              />
            </div>
            <Button
              className="w-full gap-2"
              onClick={handleCalculate}
              disabled={calculateRiskMutation.isPending || !description.trim()}
            >
              {calculateRiskMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Scale className="h-4 w-4" />
                  Calcular Risco com IA
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-6">
            {/* Total Score */}
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="text-sm text-muted-foreground mb-1">Score Total</div>
              <div className={`text-4xl font-bold ${getScoreColor(riskData.total_score)}`}>
                {riskData.total_score}
              </div>
              <Badge className={`mt-2 ${riskColors[riskData.classification as keyof typeof riskColors] || "bg-gray-500"}`}>
                {riskLabels[riskData.classification as keyof typeof riskLabels] || riskData.classification}
              </Badge>
            </div>

            {/* Individual Scores */}
            <div className="space-y-4">
              {/* CRM */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Risco Ético (CRM)
                    <span className="text-xs text-muted-foreground">(40%)</span>
                  </div>
                  <span className={`font-bold ${getScoreColor(riskData.risk_crm.score)}`}>
                    {riskData.risk_crm.score}
                  </span>
                </div>
                <Progress 
                  value={riskData.risk_crm.score} 
                  className="h-2"
                  style={{ 
                    '--progress-background': getProgressColor(riskData.risk_crm.score) 
                  } as React.CSSProperties}
                />
                <p className="text-xs text-muted-foreground">
                  {riskData.risk_crm.justificativa}
                </p>
              </div>

              {/* Cível */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Scale className="h-4 w-4 text-blue-600" />
                    Risco Cível
                    <span className="text-xs text-muted-foreground">(35%)</span>
                  </div>
                  <span className={`font-bold ${getScoreColor(riskData.risk_civel.score)}`}>
                    {riskData.risk_civel.score}
                  </span>
                </div>
                <Progress 
                  value={riskData.risk_civel.score} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {riskData.risk_civel.justificativa}
                </p>
              </div>

              {/* Criminal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Gavel className="h-4 w-4 text-rose-600" />
                    Risco Criminal
                    <span className="text-xs text-muted-foreground">(25%)</span>
                  </div>
                  <span className={`font-bold ${getScoreColor(riskData.risk_criminal.score)}`}>
                    {riskData.risk_criminal.score}
                  </span>
                </div>
                <Progress 
                  value={riskData.risk_criminal.score} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {riskData.risk_criminal.justificativa}
                </p>
              </div>
            </div>

            {/* Recommendations */}
            {riskData.recommendations && riskData.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Recomendações
                </div>
                <ul className="space-y-1">
                  {riskData.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-emerald-600">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recalculate */}
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => setRiskData(null)}
            >
              <RefreshCw className="h-4 w-4" />
              Nova Análise
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
