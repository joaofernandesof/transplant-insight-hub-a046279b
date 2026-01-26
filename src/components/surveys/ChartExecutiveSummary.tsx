import { Lightbulb } from 'lucide-react';

interface ChartExecutiveSummaryProps {
  insights: string[];
  variant?: 'default' | 'success' | 'warning' | 'info';
}

const variantStyles = {
  default: 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300',
  success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
};

const iconStyles = {
  default: 'text-slate-500',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

export function ChartExecutiveSummary({ insights, variant = 'default' }: ChartExecutiveSummaryProps) {
  if (!insights || insights.length === 0) return null;
  
  return (
    <div className={`mt-4 p-3 rounded-lg border ${variantStyles[variant]}`}>
      <div className="flex items-start gap-2">
        <Lightbulb className={`h-4 w-4 mt-0.5 shrink-0 ${iconStyles[variant]}`} />
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Insight</p>
          {insights.map((insight, idx) => (
            <p key={idx} className="text-sm leading-relaxed">{insight}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to generate insights based on data
export function generateLeadDistributionInsight(hot: number, warm: number, cold: number, total: number): string[] {
  const hotPercent = total > 0 ? (hot / total) * 100 : 0;
  const coldPercent = total > 0 ? (cold / total) * 100 : 0;
  
  const insights: string[] = [];
  
  if (hotPercent >= 50) {
    insights.push(`🔥 Excelente potencial comercial! ${hotPercent.toFixed(0)}% dos leads estão quentes, prontos para conversão.`);
  } else if (hotPercent >= 30) {
    insights.push(`📈 Boa tração comercial com ${hotPercent.toFixed(0)}% de leads quentes. Foque no follow-up imediato.`);
  } else if (coldPercent >= 50) {
    insights.push(`⚠️ Atenção: ${coldPercent.toFixed(0)}% dos leads estão frios. Considere ajustar a abordagem ou qualificar melhor na entrada.`);
  } else {
    insights.push(`📊 Distribuição equilibrada de leads. Continue nutrindo os mornos para aumentar conversão.`);
  }
  
  return insights;
}

export function generateProductScoreInsight(iaScore: number, licenseScore: number, legalScore: number): string[] {
  const scores = [
    { name: 'IA Avivar', score: iaScore },
    { name: 'Licença', score: licenseScore },
    { name: 'Jurídico', score: legalScore },
  ].sort((a, b) => b.score - a.score);
  
  const insights: string[] = [];
  const highestScore = scores[0];
  const lowestScore = scores[scores.length - 1];
  
  if (highestScore.score >= 7) {
    insights.push(`🎯 Maior interesse em ${highestScore.name} (${highestScore.score.toFixed(1)}/10). Priorize este produto nas negociações.`);
  }
  
  if (lowestScore.score < 5 && highestScore.score - lowestScore.score > 2) {
    insights.push(`📉 ${lowestScore.name} tem baixa aderência (${lowestScore.score.toFixed(1)}/10). Revise a proposta de valor ou segmente melhor.`);
  }
  
  return insights;
}

export function generateInstructorInsight(instructor1: { name: string; avg: number }, instructor2: { name: string; avg: number }): string[] {
  const insights: string[] = [];
  const diff = Math.abs(instructor1.avg - instructor2.avg);
  const better = instructor1.avg > instructor2.avg ? instructor1 : instructor2;
  const lower = instructor1.avg > instructor2.avg ? instructor2 : instructor1;
  
  if (diff < 0.5) {
    insights.push(`⚖️ Ambos instrutores têm avaliações equivalentes. Excelente consistência de ensino.`);
  } else if (diff >= 1) {
    insights.push(`📊 ${better.name} teve avaliação superior (+${diff.toFixed(1)} pontos). Identifique práticas replicáveis.`);
  }
  
  if (better.avg >= 4) {
    insights.push(`⭐ Destaque para ${better.name} com média ${better.avg.toFixed(1)}/5 - referência para próximas turmas.`);
  }
  
  return insights;
}

export function generateSatisfactionInsight(avgPercent: number, distribution: Record<string, number>): string[] {
  const insights: string[] = [];
  
  if (avgPercent >= 90) {
    insights.push(`🌟 Satisfação excepcional (${avgPercent.toFixed(0)}%)! A turma demonstra alto engajamento com o conteúdo.`);
  } else if (avgPercent >= 75) {
    insights.push(`✅ Boa satisfação geral (${avgPercent.toFixed(0)}%). Continue monitorando para manter o padrão.`);
  } else if (avgPercent >= 60) {
    insights.push(`⚠️ Satisfação moderada (${avgPercent.toFixed(0)}%). Investigue os detratores para ações corretivas.`);
  } else {
    insights.push(`🚨 Atenção crítica: satisfação em ${avgPercent.toFixed(0)}%. Priorize feedback individual para entender as causas.`);
  }
  
  return insights;
}

export function generatePromiseMetInsight(promiseData: Record<string, number>): string[] {
  const insights: string[] = [];
  const above = (promiseData['muito_acima'] || 0) + (promiseData['acima'] || 0);
  const below = (promiseData['abaixo'] || 0) + (promiseData['muito_abaixo'] || 0);
  const total = Object.values(promiseData).reduce((a, b) => a + b, 0);
  
  if (total === 0) return ['Dados insuficientes para análise.'];
  
  const abovePercent = (above / total) * 100;
  const belowPercent = (below / total) * 100;
  
  if (abovePercent >= 70) {
    insights.push(`🏆 ${abovePercent.toFixed(0)}% considera que o curso superou expectativas. Marketing alinhado com entrega.`);
  } else if (belowPercent >= 30) {
    insights.push(`⚠️ ${belowPercent.toFixed(0)}% sentiu que a promessa não foi cumprida. Ajuste comunicação pré-curso.`);
  } else {
    insights.push(`📊 Entrega consistente com o prometido. Mantenha o padrão atual.`);
  }
  
  return insights;
}

export function generateRadarInsight(metrics: { metric: string; value: number }[]): string[] {
  const insights: string[] = [];
  const sorted = [...metrics].sort((a, b) => b.value - a.value);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];
  const avg = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  
  if (highest && highest.value >= 8) {
    insights.push(`💪 Ponto forte: "${highest.metric}" com nota ${highest.value.toFixed(1)}/10.`);
  }
  
  if (lowest && lowest.value < 6 && highest.value - lowest.value > 2) {
    insights.push(`📌 Oportunidade de melhoria: "${lowest.metric}" com ${lowest.value.toFixed(1)}/10 precisa de atenção.`);
  }
  
  if (avg >= 7.5) {
    insights.push(`✅ Média geral de ${avg.toFixed(1)}/10 indica excelente desempenho global.`);
  }
  
  return insights;
}

export function generateMonitorInsight(monitors: { name: string; avg: number }[]): string[] {
  const insights: string[] = [];
  const sorted = [...monitors].sort((a, b) => b.avg - a.avg);
  
  if (sorted.length >= 2) {
    const first = sorted[0];
    const second = sorted[1];
    const gap = first.avg - second.avg;
    
    insights.push(`🏅 ${first.name} lidera com ${first.avg.toFixed(1)}/10 de média geral.`);
    
    if (gap < 0.3 && sorted.length >= 2) {
      insights.push(`⚔️ Disputa acirrada entre ${first.name} e ${second.name} - diferença de apenas ${gap.toFixed(1)} pontos.`);
    }
    
    const avgAll = monitors.reduce((sum, m) => sum + m.avg, 0) / monitors.length;
    if (avgAll >= 7) {
      insights.push(`👏 Média geral da equipe de monitores: ${avgAll.toFixed(1)}/10 - alto padrão de qualidade.`);
    }
  }
  
  return insights;
}

export function generateWordCloudInsight(type: 'improvements' | 'highlights', topWords: string[]): string[] {
  if (topWords.length === 0) return [];
  
  const insights: string[] = [];
  const top3 = topWords.slice(0, 3).join(', ');
  
  if (type === 'improvements') {
    insights.push(`🔧 Temas mais citados para melhoria: ${top3}. Use como prioridade para próximas edições.`);
  } else {
    insights.push(`🌟 Destaques mais mencionados: ${top3}. Preserve esses elementos nas próximas turmas.`);
  }
  
  return insights;
}
