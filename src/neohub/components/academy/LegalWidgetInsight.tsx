/**
 * LegalWidgetInsight - Small insight badges for legal module dashboard widgets
 */

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LegalWidgetInsightProps {
  emoji: string;
  text: string;
  variant?: "positive" | "neutral" | "warning" | "danger";
}

const variantStyles = {
  positive: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  neutral: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  danger: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export function LegalWidgetInsight({ emoji, text, variant = "neutral" }: LegalWidgetInsightProps) {
  return (
    <div className={cn("flex items-start gap-1.5 mt-2 p-2 rounded-lg text-xs", variantStyles[variant])}>
      <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
      <span>
        {emoji} {text}
      </span>
    </div>
  );
}

// Generator functions for widget insights

export function generateLarisaOverallInsight(overall: number, totalResponses: number): LegalWidgetInsightProps {
  if (overall >= 4.5) return { emoji: "🌟", text: `Excelente! Nota ${overall.toFixed(1)} com ${totalResponses} avaliações`, variant: "positive" };
  if (overall >= 3.5) return { emoji: "👍", text: `Bom! Nota ${overall.toFixed(1)} com ${totalResponses} avaliações`, variant: "neutral" };
  if (overall >= 2.5) return { emoji: "⚠️", text: `Atenção: nota ${overall.toFixed(1)} com ${totalResponses} avaliações`, variant: "warning" };
  return { emoji: "🔴", text: `Crítico: nota ${overall.toFixed(1)} com ${totalResponses} avaliações`, variant: "danger" };
}

export function generateLegalScoreInsight(normalizedScore: number, total: number): LegalWidgetInsightProps {
  if (normalizedScore >= 80) return { emoji: "🎯", text: `Score alto (${normalizedScore.toFixed(0)}%) — ${total} respostas`, variant: "positive" };
  if (normalizedScore >= 60) return { emoji: "📊", text: `Score moderado (${normalizedScore.toFixed(0)}%) — ${total} respostas`, variant: "neutral" };
  if (normalizedScore >= 40) return { emoji: "⚡", text: `Score baixo (${normalizedScore.toFixed(0)}%) — ${total} respostas`, variant: "warning" };
  return { emoji: "🚨", text: `Score crítico (${normalizedScore.toFixed(0)}%) — ${total} respostas`, variant: "danger" };
}

export function generateExamInsight(approvalRate: number, average: number): LegalWidgetInsightProps {
  if (approvalRate >= 90) return { emoji: "🏆", text: `${approvalRate.toFixed(0)}% de aprovação — média ${average.toFixed(0)}%`, variant: "positive" };
  if (approvalRate >= 70) return { emoji: "✅", text: `${approvalRate.toFixed(0)}% de aprovação — média ${average.toFixed(0)}%`, variant: "neutral" };
  if (approvalRate >= 50) return { emoji: "📝", text: `${approvalRate.toFixed(0)}% de aprovação — média ${average.toFixed(0)}%`, variant: "warning" };
  return { emoji: "📉", text: `Apenas ${approvalRate.toFixed(0)}% de aprovação — média ${average.toFixed(0)}%`, variant: "danger" };
}

export function generateLeadsInsight(hot: number, warm: number, cold: number, total: number): LegalWidgetInsightProps {
  const hotPct = total > 0 ? (hot / total) * 100 : 0;
  if (hotPct >= 40) return { emoji: "🔥", text: `${hot} hot leads (${hotPct.toFixed(0)}%) de ${total} alunos`, variant: "positive" };
  if (hotPct >= 20) return { emoji: "🌡️", text: `${hot} hot, ${warm} warm de ${total} alunos`, variant: "neutral" };
  return { emoji: "❄️", text: `Apenas ${hot} hot leads de ${total} alunos`, variant: "warning" };
}

export function generateFeelingInsight(feelingDist: Record<string, number>, total: number): LegalWidgetInsightProps {
  const safe = feelingDist["Tranquilo e seguro"] || 0;
  const safePct = total > 0 ? (safe / total) * 100 : 0;
  if (safePct >= 60) return { emoji: "😊", text: `${safePct.toFixed(0)}% se sentem seguros`, variant: "positive" };
  if (safePct >= 40) return { emoji: "😐", text: `${safePct.toFixed(0)}% se sentem seguros — espaço para melhorar`, variant: "neutral" };
  return { emoji: "😟", text: `Apenas ${safePct.toFixed(0)}% se sentem seguros`, variant: "warning" };
}
