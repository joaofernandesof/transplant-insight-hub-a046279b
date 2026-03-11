import type { SalesCall, CallAnalysisRecord } from '@/hooks/useCallIntelligence';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Brain, Loader2, Copy, CheckCircle2, AlertTriangle,
  Flame, Snowflake, Sun, MessageSquare, Target, TrendingUp,
  ThumbsUp, ThumbsDown, ArrowRight, BarChart3,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  call: SalesCall | null;
  analysis: CallAnalysisRecord | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

function BantBar({ label, score, icon }: { label: string; score: number; icon: string }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? 'bg-emerald-500' : score >= 4 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = score >= 7 ? 'text-emerald-700' : score >= 4 ? 'text-amber-700' : 'text-red-700';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{icon} {label}</span>
        <span className={`font-bold ${textColor}`}>{score}/10</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2.5">
        <div className={`h-2.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CallAnalysisView({ call, analysis, isAnalyzing, onAnalyze }: Props) {
  const [copiedWa, setCopiedWa] = useState(false);

  if (!call) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Selecione uma call para ver a análise.
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <Brain className="h-16 w-16 mx-auto text-muted-foreground/30" />
          <div>
            <h3 className="font-semibold text-lg">Call sem análise</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Lead: <strong>{call.lead_nome}</strong> • {call.closer_name}
            </p>
          </div>
          <Button
            onClick={onAnalyze}
            disabled={isAnalyzing || !(call.transcricao || call.resumo_manual)}
            className="gap-2"
          >
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            Gerar Análise com IA
          </Button>
          {!(call.transcricao || call.resumo_manual) && (
            <p className="text-xs text-destructive">Esta call não possui transcrição ou resumo.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  const copyWhatsApp = () => {
    if (!analysis.whatsapp_report) return;
    navigator.clipboard.writeText(analysis.whatsapp_report);
    setCopiedWa(true);
    toast.success('Relatório copiado para o clipboard!');
    setTimeout(() => setCopiedWa(false), 2000);
  };

  const tempConfig = {
    quente: { icon: <Flame className="h-4 w-4" />, label: 'Quente 🔥', color: 'text-red-600 bg-red-50' },
    morno: { icon: <Sun className="h-4 w-4" />, label: 'Morno ☀️', color: 'text-amber-600 bg-amber-50' },
    frio: { icon: <Snowflake className="h-4 w-4" />, label: 'Frio ❄️', color: 'text-blue-600 bg-blue-50' },
  };
  const temp = tempConfig[analysis.classificacao_lead] || tempConfig.morno;

  const urgConfig = {
    alta: { label: '🚨 Alta', color: 'bg-red-100 text-red-800' },
    media: { label: '⚡ Média', color: 'bg-amber-100 text-amber-800' },
    baixa: { label: '🟢 Baixa', color: 'bg-emerald-100 text-emerald-800' },
  };
  const urg = urgConfig[analysis.urgencia] || urgConfig.media;

  return (
    <div className="space-y-4">
      {/* Header with key metrics */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{analysis.bant_total}<span className="text-sm text-muted-foreground">/40</span></div>
            <div className="text-xs text-muted-foreground mt-1">Score BANT</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{analysis.probabilidade_fechamento}%</div>
            <div className="text-xs text-muted-foreground mt-1">Prob. Fechamento</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className={`p-4 text-center rounded-lg ${temp.color}`}>
            <div className="flex items-center justify-center gap-1">{temp.icon}<span className="font-bold">{temp.label}</span></div>
            <div className="text-xs mt-1">Classificação</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Badge className={`text-sm ${urg.color}`}>{urg.label}</Badge>
            <div className="text-xs text-muted-foreground mt-2">Urgência</div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Resumo da Call</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{analysis.resumo_call}</CardContent>
      </Card>

      {/* Perfil do lead + Dor principal */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">👤 Perfil do Lead</CardTitle></CardHeader>
          <CardContent className="text-sm">{analysis.perfil_lead}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base"><Target className="h-4 w-4 inline mr-1" />Dor Principal</CardTitle></CardHeader>
          <CardContent className="text-sm">{analysis.dor_principal}</CardContent>
        </Card>
      </div>

      {/* Objeções */}
      {analysis.objecoes && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">❓ Principais Objeções</CardTitle></CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{analysis.objecoes}</CardContent>
        </Card>
      )}

      {/* Pontos fortes/fracos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-700">
              <ThumbsUp className="h-4 w-4" /> Pontos Fortes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{analysis.pontos_fortes_closer}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700">
              <ThumbsDown className="h-4 w-4" /> Pontos Fracos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{analysis.pontos_fracos_closer}</CardContent>
        </Card>
      </div>

      {/* BANT Scores */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Qualificação BANT
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <BantBar label="Budget" score={analysis.bant_budget} icon="💰" />
          <BantBar label="Authority" score={analysis.bant_authority} icon="👑" />
          <BantBar label="Need" score={analysis.bant_need} icon="🎯" />
          <BantBar label="Timeline" score={analysis.bant_timeline} icon="⏰" />
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total BANT</span>
            <span>{analysis.bant_total}/40</span>
          </div>
        </CardContent>
      </Card>

      {/* Motivo não fechamento + Estratégia */}
      {analysis.motivo_nao_fechamento && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">🚫 Motivo do Não Fechamento</CardTitle></CardHeader>
          <CardContent className="text-sm">{analysis.motivo_nao_fechamento}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">🎯 Estratégia de Follow-up</CardTitle></CardHeader>
        <CardContent className="text-sm whitespace-pre-wrap">{analysis.estrategia_followup}</CardContent>
      </Card>

      {/* Ações + Próximos passos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">✅ Ações Realizadas</CardTitle></CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{analysis.acoes_realizadas}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRight className="h-4 w-4" /> Próximos Passos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{analysis.proximos_passos}</CardContent>
        </Card>
      </div>

      {/* Conclusão */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">📋 Conclusão</CardTitle></CardHeader>
        <CardContent className="text-sm">{analysis.conclusao}</CardContent>
      </Card>

      {/* WhatsApp Report */}
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-green-700">
            <MessageSquare className="h-4 w-4" /> Relatório WhatsApp
          </CardTitle>
          <CardDescription>Versão formatada pronta para copiar e enviar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-background rounded-lg p-4 border text-sm whitespace-pre-wrap mb-3 max-h-[400px] overflow-y-auto">
            {analysis.whatsapp_report}
          </div>
          <Button onClick={copyWhatsApp} variant="outline" className="gap-2 border-green-300 text-green-700 hover:bg-green-100">
            {copiedWa ? <><CheckCircle2 className="h-4 w-4" /> Copiado!</> : <><Copy className="h-4 w-4" /> Copiar para WhatsApp</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
