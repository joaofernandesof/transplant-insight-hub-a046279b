import { Info, Lightbulb } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface LegalWidgetInsightProps {
  insight: string;
  calculation?: string;
  variant?: 'default' | 'success' | 'warning' | 'info';
  className?: string;
}

const variantStyles = {
  default: 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400',
  success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
};

export function LegalWidgetInsight({ insight, calculation, variant = 'default', className }: LegalWidgetInsightProps) {
  return (
    <div className={cn(`mt-3 p-2.5 rounded-lg border text-xs ${variantStyles[variant]}`, className)}>
      <div className="flex items-start gap-2">
        <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-70" />
        <div className="flex-1 min-w-0">
          <p className="leading-relaxed">{insight}</p>
          {calculation && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="flex items-center gap-1 mt-1.5 text-[10px] opacity-60 hover:opacity-100 transition-opacity">
                    <Info className="h-3 w-3" />
                    <span>Como foi calculado?</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs">
                  <p>{calculation}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions for generating insights
export function generateLarisaOverallInsight(overall: number, totalResponses: number): { insight: string; calculation: string; variant: 'success' | 'warning' | 'info' } {
  const variant = overall >= 8 ? 'success' : overall >= 6.5 ? 'info' : 'warning';
  
  let insight = '';
  if (overall >= 8.5) {
    insight = `🌟 Avaliação excepcional! A Dra. Larissa superou expectativas com nota ${overall.toFixed(1)}/10.`;
  } else if (overall >= 7.5) {
    insight = `✅ Bom desempenho geral. A instrutora mantém padrão de qualidade consistente.`;
  } else if (overall >= 6.5) {
    insight = `📊 Desempenho dentro do esperado, mas há espaço para evolução em pontos específicos.`;
  } else {
    insight = `⚠️ Atenção: avaliação abaixo do ideal. Recomenda-se análise detalhada dos feedbacks.`;
  }
  
  const calculation = `Média aritmética de 3 dimensões: Expectativas, Clareza e Tempo. Cada dimensão é convertida de escala qualitativa (texto) para numérica (0-10), com base em ${totalResponses} avaliações.`;
  
  return { insight, calculation, variant };
}

export function generateLegalScoreInsight(score: number, total: number): { insight: string; calculation: string; variant: 'success' | 'warning' | 'info' } {
  const variant = score >= 7 ? 'success' : score >= 5 ? 'info' : 'warning';
  
  let insight = '';
  if (score >= 7) {
    insight = `🎯 Alto engajamento jurídico! Turma demonstra interesse concreto em serviços de proteção legal.`;
  } else if (score >= 5) {
    insight = `📈 Interesse moderado. Nutra esses leads com conteúdo de autoridade para aumentar conversão.`;
  } else {
    insight = `📉 Baixo engajamento. Considere ajustar a proposta de valor ou revisar qualificação inicial.`;
  }
  
  const calculation = `Score bruto (0-18 pontos) normalizado para escala 0-10. Soma de 3 perguntas sobre segurança, influência e urgência, cada uma valendo 0-6 pontos.`;
  
  return { insight, calculation, variant };
}

export function generateExamInsight(approvalRate: number, average: number): { insight: string; calculation: string; variant: 'success' | 'warning' | 'info' } {
  const variant = approvalRate >= 80 ? 'success' : approvalRate >= 60 ? 'info' : 'warning';
  
  let insight = '';
  if (approvalRate >= 85) {
    insight = `🏆 Excelente absorção do conteúdo! ${approvalRate.toFixed(0)}% de aprovação indica alinhamento didático.`;
  } else if (approvalRate >= 70) {
    insight = `✅ Boa taxa de aprovação. O conteúdo está sendo bem assimilado pela maioria.`;
  } else if (approvalRate >= 50) {
    insight = `📚 Taxa moderada. Considere reforço em tópicos específicos antes da próxima turma.`;
  } else {
    insight = `⚠️ Taxa crítica de reprovação. Revisar metodologia e complexidade das questões.`;
  }
  
  const calculation = `Taxa = (Aprovados ÷ Total) × 100. Aprovação definida por score ≥ 70%. Média = soma das notas ÷ número de tentativas.`;
  
  return { insight, calculation, variant };
}

export function generateLeadsInsight(hot: number, warm: number, cold: number, total: number): { insight: string; calculation: string; variant: 'success' | 'warning' | 'info' } {
  const hotPercent = total > 0 ? (hot / total) * 100 : 0;
  const variant = hotPercent >= 40 ? 'success' : hotPercent >= 25 ? 'info' : 'warning';
  
  let insight = '';
  if (hotPercent >= 50) {
    insight = `🔥 Pipeline excepcional! ${hotPercent.toFixed(0)}% de leads quentes prontos para conversão imediata.`;
  } else if (hotPercent >= 30) {
    insight = `📞 Bom potencial comercial. Priorize contato com os ${hot} leads HOT nas próximas 48h.`;
  } else if (hotPercent >= 15) {
    insight = `📊 Pipeline misto. Foque em nutrir os ${warm} leads WARM para aquecê-los.`;
  } else {
    insight = `❄️ Maioria de leads frios. Revise critérios de qualificação ou ajuste a jornada.`;
  }
  
  const calculation = `Classificação baseada em score total (0-54): HOT ≥ 40 pontos, WARM = 25-39, COLD < 25. Pontuação vem de 3 perguntas BNT (Budget, Need, Timing).`;
  
  return { insight, calculation, variant };
}

export function generateFeelingInsight(feelingDist: Record<string, number>, total: number): { insight: string; calculation: string; variant: 'success' | 'warning' | 'info' } {
  const inseguros = (feelingDist['Exposto a riscos'] || 0) + (feelingDist['Inseguro em pontos'] || 0) + (feelingDist['Um pouco inseguro'] || 0);
  const insegurosPercent = total > 0 ? (inseguros / total) * 100 : 0;
  
  const variant = insegurosPercent >= 60 ? 'warning' : insegurosPercent >= 40 ? 'info' : 'success';
  
  let insight = '';
  if (insegurosPercent >= 70) {
    insight = `🚨 ${insegurosPercent.toFixed(0)}% relatam insegurança jurídica. Oportunidade clara para serviços de proteção.`;
  } else if (insegurosPercent >= 50) {
    insight = `⚠️ Mais da metade sente vulnerabilidade legal. Aborde diretamente nas conversas comerciais.`;
  } else if (insegurosPercent >= 30) {
    insight = `📊 Parcela significativa insegura. Eduque sobre riscos para criar urgência.`;
  } else {
    insight = `✅ Maioria se sente segura. Foque em diferenciação e prevenção proativa.`;
  }
  
  const calculation = `Distribuição baseada na pergunta "Como você se sente em relação à segurança jurídica?". Categorias normalizadas de 4 opções de resposta.`;
  
  return { insight, calculation, variant };
}

export function generateInfluenceInsight(influenceDist: Record<string, number>, total: number): { insight: string; calculation: string; variant: 'success' | 'warning' | 'info' } {
  const travaram = influenceDist['Travaram decisões'] || 0;
  const bastante = influenceDist['Influenciam bastante'] || 0;
  const impactados = travaram + bastante;
  const impactadosPercent = total > 0 ? (impactados / total) * 100 : 0;
  
  const variant = impactadosPercent >= 50 ? 'warning' : impactadosPercent >= 30 ? 'info' : 'success';
  
  let insight = '';
  if (impactadosPercent >= 60) {
    insight = `🔴 ${impactadosPercent.toFixed(0)}% têm decisões travadas por questões legais. Urgência máxima para solução.`;
  } else if (impactadosPercent >= 40) {
    insight = `🟡 Impacto significativo nas decisões de negócio. Use como argumento de venda.`;
  } else {
    insight = `🟢 Baixo impacto relatado. Foque em prevenção e crescimento seguro.`;
  }
  
  const calculation = `Pergunta: "O quanto questões legais influenciam suas decisões de negócio?". Soma de "Travaram decisões" + "Influenciam bastante".`;
  
  return { insight, calculation, variant };
}

export function generateTimingInsight(timingDist: Record<string, number>, total: number): { insight: string; calculation: string; variant: 'success' | 'warning' | 'info' } {
  const urgente = timingDist['O quanto antes'] || 0;
  const proximosMeses = timingDist['Próximos meses'] || 0;
  const imediatos = urgente + proximosMeses;
  const imediatosPercent = total > 0 ? (imediatos / total) * 100 : 0;
  
  const variant = imediatosPercent >= 50 ? 'success' : imediatosPercent >= 30 ? 'info' : 'warning';
  
  let insight = '';
  if (imediatosPercent >= 60) {
    insight = `⚡ ${imediatosPercent.toFixed(0)}% querem resolver agora! Janela de conversão ideal.`;
  } else if (imediatosPercent >= 40) {
    insight = `📅 Boa parcela com timing favorável. Mantenha follow-up ativo.`;
  } else {
    insight = `⏳ Maioria sem pressa. Invista em nutrição de longo prazo.`;
  }
  
  const calculation = `Pergunta: "Quando pretende resolver questões jurídicas?". Soma de "O quanto antes" + "Próximos meses" indica timing imediato.`;
  
  return { insight, calculation, variant };
}
