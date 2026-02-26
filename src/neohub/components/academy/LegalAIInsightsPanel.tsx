/**
 * LegalAIInsightsPanel - AI-powered insights for legal module dashboard
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Brain } from "lucide-react";
import type { LarissaMetrics, LegalPerception, ExamMetrics } from "./legal/types";

interface LegalAIInsightsPanelProps {
  metrics: {
    larisaMetrics: {
      expectations: number;
      clarity: number;
      time: number;
      overall: number;
      totalResponses: number;
      feedbacksPositive: string[];
      feedbacksImprove: string[];
    } | null;
    legalPerception: LegalPerception | null;
    examMetrics: ExamMetrics | null;
  };
}

export function LegalAIInsightsPanel({ metrics }: LegalAIInsightsPanelProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = () => {
    setLoading(true);
    // Generate local insights based on the metrics
    const parts: string[] = [];

    if (metrics.larisaMetrics) {
      const m = metrics.larisaMetrics;
      parts.push(`## Avaliação da Mentora\n- Nota geral: **${m.overall.toFixed(1)}/5** (${m.totalResponses} respostas)`);
      if (m.overall >= 4.0) parts.push("- ✅ Excelente avaliação geral");
      else if (m.overall >= 3.0) parts.push("- ⚠️ Avaliação boa, mas com pontos de melhoria");
      else parts.push("- 🔴 Avaliação requer atenção");
    }

    if (metrics.legalPerception) {
      const p = metrics.legalPerception;
      parts.push(`\n## Percepção Jurídica\n- Score normalizado: **${p.normalizedScore.toFixed(0)}%**`);
      parts.push(`- Leads: 🔥 ${p.leads.hot} hot | 🌡️ ${p.leads.warm} warm | ❄️ ${p.leads.cold} cold`);
    }

    if (metrics.examMetrics) {
      const e = metrics.examMetrics;
      parts.push(`\n## Prova\n- Aprovação: **${e.approvalRate.toFixed(0)}%** | Média: **${e.average.toFixed(1)}%**`);
    }

    if (parts.length === 0) {
      parts.push("Nenhum dado disponível para análise.");
    }

    setInsights(parts.join("\n"));
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-purple-500" />
          Insights com IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!insights ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Gere insights automáticos baseados nos dados da turma
            </p>
            <Button onClick={generateInsights} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Insights
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-line">
            {insights}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
