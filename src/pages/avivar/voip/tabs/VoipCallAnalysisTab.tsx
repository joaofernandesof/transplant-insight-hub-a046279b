/**
 * VoipCallAnalysisTab - AI Sales Agent: Análise Inteligente de Calls
 * SPIN Selling methodology with premium Apple-style UI
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Target,
  AlertTriangle,
  MessageSquare,
  Flame,
  Snowflake,
  Thermometer,
  TrendingUp,
  Clock,
  Zap,
  Copy,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  FileText,
  Shield,
  HelpCircle,
  Lightbulb,
  Phone,
  Upload,
  Play,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { useVoiceCalls, type VoiceCall } from '@/hooks/useVoiceCalls';
import { useCallAnalysis, type CallAnalysis, type SpinItem, type Objection } from '@/hooks/useCallAnalysis';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import { toast } from 'sonner';

// ---------- Sub-components ----------

function TemperatureGauge({ temperature, probability }: { temperature: string; probability: number }) {
  const config = {
    cold: { icon: Snowflake, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Frio' },
    warm: { icon: Thermometer, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Morno' },
    hot: { icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Quente' },
  };
  const c = config[temperature as keyof typeof config] || config.cold;
  const Icon = c.icon;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl ${c.bg} border ${c.border}`}>
      <Icon className={`h-8 w-8 ${c.color}`} />
      <div className="flex-1">
        <p className={`font-bold text-lg ${c.color}`}>{c.label}</p>
        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
          {probability}% de probabilidade de fechamento
        </p>
        <Progress value={probability} className="h-2 mt-1" />
      </div>
    </div>
  );
}

function SpinCard({ title, letter, items, color }: {
  title: string; letter: string; items: SpinItem[]; color: string;
}) {
  const qualityColors = {
    excellent: 'bg-green-500/10 text-green-500 border-green-500/20',
    good: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    weak: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white font-bold text-lg`}>
            {letter}
          </div>
          <div>
            <CardTitle className="text-base text-[hsl(var(--avivar-foreground))]">{title}</CardTitle>
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
              {items.length} {items.length === 1 ? 'ponto identificado' : 'pontos identificados'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] italic">
            Nenhum ponto identificado nesta categoria
          </p>
        ) : (
          items.map((item, i) => (
            <div key={i} className="p-3 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))] space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-[hsl(var(--avivar-foreground))] italic">"{item.quote}"</p>
                <Badge className={`${qualityColors[item.quality]} shrink-0 text-xs`}>
                  {item.quality === 'excellent' ? 'Excelente' : item.quality === 'good' ? 'Bom' : 'Fraco'}
                </Badge>
              </div>
              <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                💡 {item.insight}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ObjectionCard({ objection }: { objection: Objection }) {
  const categoryLabels: Record<string, string> = {
    price: '💰 Preço', timing: '⏰ Timing', trust: '🛡️ Confiança',
    need: '❓ Necessidade', competition: '⚔️ Concorrência', other: '📋 Outro',
  };
  const severityColors = {
    low: 'bg-green-500/10 text-green-500 border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    high: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <div className="p-4 rounded-xl bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))] space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
            {categoryLabels[objection.category] || objection.category}
          </p>
          <p className="font-medium text-[hsl(var(--avivar-foreground))]">{objection.text}</p>
        </div>
        <Badge className={`${severityColors[objection.severity]} shrink-0`}>
          {objection.severity === 'low' ? 'Leve' : objection.severity === 'medium' ? 'Média' : 'Alta'}
        </Badge>
      </div>
      <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mb-1 flex items-center gap-1">
          <Lightbulb className="h-3 w-3" /> Resposta sugerida
        </p>
        <p className="text-sm text-[hsl(var(--avivar-foreground))]">{objection.suggested_response}</p>
      </div>
    </div>
  );
}

// ---------- Detail Dialog ----------

function AnalysisDetailDialog({ analysis, call, open, onOpenChange }: {
  analysis: CallAnalysis; call?: VoiceCall; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copiado!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-3 text-[hsl(var(--avivar-foreground))]">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)]">
              <Brain className="h-5 w-5 text-white" />
            </div>
            Análise SPIN - {call?.lead_name || 'Lead'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-100px)] px-6 pb-6">
          <Tabs defaultValue="overview" className="space-y-4 mt-4">
            <TabsList className="bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))]">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
                Resumo
              </TabsTrigger>
              <TabsTrigger value="spin" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
                SPIN
              </TabsTrigger>
              <TabsTrigger value="objections" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
                Objeções
              </TabsTrigger>
              <TabsTrigger value="followup" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
                Follow-up
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <TemperatureGauge temperature={analysis.temperature} probability={analysis.close_probability} />

              <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))] mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[hsl(var(--avivar-primary))]" /> Resumo Executivo
                  </p>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] leading-relaxed">
                    {analysis.executive_summary}
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {analysis.dominant_pain && (
                  <div className="p-3 rounded-xl bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                    <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">🎯 Dor Dominante</p>
                    <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))] mt-1">{analysis.dominant_pain}</p>
                  </div>
                )}
                {analysis.emotional_trigger && (
                  <div className="p-3 rounded-xl bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                    <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">💡 Gatilho Emocional</p>
                    <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))] mt-1">{analysis.emotional_trigger}</p>
                  </div>
                )}
                {analysis.interest_area && (
                  <div className="p-3 rounded-xl bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                    <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">⭐ Interesse</p>
                    <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))] mt-1">{analysis.interest_area}</p>
                  </div>
                )}
                {analysis.discussed_value && (
                  <div className="p-3 rounded-xl bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                    <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">💰 Valor Discutido</p>
                    <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))] mt-1">{analysis.discussed_value}</p>
                  </div>
                )}
              </div>

              {analysis.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {analysis.keywords.map((kw, i) => (
                    <Badge key={i} variant="outline" className="bg-[hsl(var(--avivar-primary)/0.05)] border-[hsl(var(--avivar-primary)/0.2)]">
                      {kw}
                    </Badge>
                  ))}
                </div>
              )}

              {analysis.next_action && (
                <div className="p-4 rounded-xl bg-[hsl(var(--avivar-primary)/0.05)] border border-[hsl(var(--avivar-primary)/0.2)]">
                  <p className="text-xs text-[hsl(var(--avivar-primary))] font-medium mb-1 flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" /> Próxima Ação Recomendada
                  </p>
                  <p className="text-sm text-[hsl(var(--avivar-foreground))]">{analysis.next_action}</p>
                </div>
              )}
            </TabsContent>

            {/* SPIN Tab */}
            <TabsContent value="spin" className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))]">
                <div className="text-center">
                  <p className={`text-3xl font-bold ${
                    analysis.spin_score >= 70 ? 'text-green-500' :
                    analysis.spin_score >= 40 ? 'text-yellow-500' : 'text-red-500'
                  }`}>{analysis.spin_score}</p>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Score SPIN</p>
                </div>
                <div className="flex-1 grid grid-cols-4 gap-2">
                  {[
                    { label: 'S', count: analysis.spin_situation.length, color: 'bg-blue-500' },
                    { label: 'P', count: analysis.spin_problem.length, color: 'bg-orange-500' },
                    { label: 'I', count: analysis.spin_implication.length, color: 'bg-red-500' },
                    { label: 'N', count: analysis.spin_need.length, color: 'bg-green-500' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className={`w-8 h-8 mx-auto rounded-lg ${s.color} text-white font-bold text-sm flex items-center justify-center`}>
                        {s.label}
                      </div>
                      <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">{s.count}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SpinCard title="Situação" letter="S" items={analysis.spin_situation} color="bg-blue-500" />
                <SpinCard title="Problema" letter="P" items={analysis.spin_problem} color="bg-orange-500" />
                <SpinCard title="Implicação" letter="I" items={analysis.spin_implication} color="bg-red-500" />
                <SpinCard title="Necessidade" letter="N" items={analysis.spin_need} color="bg-green-500" />
              </div>

              {analysis.spin_missing.length > 0 && (
                <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" /> O que faltou explorar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {analysis.spin_missing.map((m, i) => (
                        <li key={i} className="text-sm text-[hsl(var(--avivar-muted-foreground))] flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {analysis.spin_suggested_questions.length > 0 && (
                <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-[hsl(var(--avivar-primary))]" /> Perguntas Sugeridas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.spin_suggested_questions.map((q, i) => (
                        <li key={i} className="text-sm text-[hsl(var(--avivar-foreground))] p-2 rounded-lg bg-[hsl(var(--avivar-background))] flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                          {q}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Objections Tab */}
            <TabsContent value="objections" className="space-y-4">
              {analysis.objections.length === 0 ? (
                <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
                  <CardContent className="p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-[hsl(var(--avivar-foreground))] font-medium">Nenhuma objeção detectada</p>
                    <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">O lead não apresentou resistências significativas</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                    {analysis.objections.length} {analysis.objections.length === 1 ? 'objeção identificada' : 'objeções identificadas'}
                  </p>
                  {analysis.objections.map((obj, i) => (
                    <ObjectionCard key={i} objection={obj} />
                  ))}
                </>
              )}

              {analysis.barriers.length > 0 && (
                <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-500" /> Barreiras Detectadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.barriers.map((b, i) => (
                        <Badge key={i} variant="outline" className="bg-red-500/5 border-red-500/20 text-red-500">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Follow-up Tab */}
            <TabsContent value="followup" className="space-y-4">
              {analysis.followup_script && (
                <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[hsl(var(--avivar-primary))]" /> Roteiro para Próxima Abordagem
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] leading-relaxed whitespace-pre-wrap">
                      {analysis.followup_script}
                    </p>
                  </CardContent>
                </Card>
              )}

              {analysis.followup_whatsapp_message && (
                <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-green-500" /> Mensagem WhatsApp Sugerida
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(analysis.followup_whatsapp_message!, 'whatsapp')}
                        className="h-7 text-xs"
                      >
                        {copiedField === 'whatsapp' ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Copiado</>
                        ) : (
                          <><Copy className="h-3 w-3 mr-1" /> Copiar</>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                      <p className="text-sm text-[hsl(var(--avivar-foreground))] whitespace-pre-wrap">
                        {analysis.followup_whatsapp_message}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {analysis.followup_timing && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                  <Clock className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                  <div>
                    <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Timing Ideal para Retorno</p>
                    <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">{analysis.followup_timing}</p>
                  </div>
                </div>
              )}

              {analysis.followup_arguments.length > 0 && (
                <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" /> Argumentos Baseados nas Objeções
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.followup_arguments.map((arg, i) => (
                        <li key={i} className="text-sm text-[hsl(var(--avivar-foreground))] p-2 rounded-lg bg-[hsl(var(--avivar-background))] flex items-start gap-2">
                          <span className="text-[hsl(var(--avivar-primary))] font-bold shrink-0">{i + 1}.</span>
                          {arg}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Main Tab ----------

export default function VoipCallAnalysisTab() {
  const { accountId } = useAvivarAccount();
  const { calls } = useVoiceCalls(accountId || undefined);
  const { analyses, isLoading, isAnalyzing, analyzeCall, getAnalysisForCall } = useCallAnalysis(accountId || undefined);
  const [selectedAnalysis, setSelectedAnalysis] = useState<CallAnalysis | null>(null);
  const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null);

  const completedCalls = calls.filter(c => c.status === 'completed' && c.transcript);

  const handleAnalyze = async (call: VoiceCall) => {
    const result = await analyzeCall(call.id);
    if (result) {
      setSelectedAnalysis(result);
      setSelectedCall(call);
    }
  };

  const handleViewAnalysis = (call: VoiceCall) => {
    const analysis = getAnalysisForCall(call.id);
    if (analysis) {
      setSelectedAnalysis(analysis);
      setSelectedCall(call);
    }
  };

  // Stats
  const avgScore = analyses.length > 0
    ? Math.round(analyses.reduce((sum, a) => sum + a.spin_score, 0) / analyses.length)
    : 0;
  const hotLeads = analyses.filter(a => a.temperature === 'hot').length;
  const totalObjections = analyses.reduce((sum, a) => sum + (a.objections?.length || 0), 0);
  const avgProbability = analyses.length > 0
    ? Math.round(analyses.reduce((sum, a) => sum + a.close_probability, 0) / analyses.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--avivar-primary)/0.1)]">
                <Brain className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{analyses.length}</p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Calls Analisadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Target className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${avgScore >= 70 ? 'text-green-500' : avgScore >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {avgScore}
                </p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Score SPIN Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Flame className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{hotLeads}</p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Leads Quentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <TrendingUp className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{avgProbability}%</p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Prob. Fechamento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calls Available for Analysis */}
        <Card className="lg:col-span-2 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <Brain className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
              Ligações para Análise
            </CardTitle>
            <CardDescription>
              Clique em "Analisar" para a IA processar a call com SPIN Selling
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : completedCalls.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="h-12 w-12 text-[hsl(var(--avivar-muted-foreground))] mx-auto mb-3 opacity-30" />
                <p className="text-[hsl(var(--avivar-foreground))] font-medium">Nenhuma ligação com transcrição</p>
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  Realize ligações via VoIP para começar a analisar
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {completedCalls.map((call) => {
                    const analysis = getAnalysisForCall(call.id);
                    return (
                      <div
                        key={call.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-[hsl(var(--avivar-primary)/0.1)] text-[hsl(var(--avivar-primary))]">
                              {(call.lead_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-[hsl(var(--avivar-foreground))]">{call.lead_name || call.phone_number}</p>
                            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                              {new Date(call.created_at).toLocaleDateString('pt-BR')} · {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}:${(call.duration_seconds % 60).toString().padStart(2, '0')}` : '--'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {analysis ? (
                            <>
                              <Badge className={`${
                                analysis.temperature === 'hot' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                analysis.temperature === 'warm' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              }`}>
                                {analysis.temperature === 'hot' ? '🔥 Quente' :
                                 analysis.temperature === 'warm' ? '🟡 Morno' : '❄️ Frio'}
                              </Badge>
                              <Badge variant="outline">{analysis.spin_score} SPIN</Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewAnalysis(call)}
                              >
                                <BarChart3 className="h-4 w-4 mr-1" /> Ver
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
                              onClick={() => handleAnalyze(call)}
                              disabled={isAnalyzing}
                            >
                              {isAnalyzing ? (
                                <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Analisando...</>
                              ) : (
                                <><Sparkles className="h-4 w-4 mr-1" /> Analisar</>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Recent Analyses Sidebar */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
              Análises Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyses.length === 0 ? (
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] text-center py-8">
                Nenhuma análise realizada ainda
              </p>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {analyses.slice(0, 10).map((analysis) => {
                    const call = calls.find(c => c.id === analysis.call_id);
                    return (
                      <div
                        key={analysis.id}
                        onClick={() => {
                          setSelectedAnalysis(analysis);
                          setSelectedCall(call || null);
                        }}
                        className="p-3 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))] cursor-pointer hover:border-[hsl(var(--avivar-primary)/0.5)] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm text-[hsl(var(--avivar-foreground))]">
                            {call?.lead_name || 'Lead'}
                          </p>
                          <Badge className={`text-xs ${
                            analysis.temperature === 'hot' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            analysis.temperature === 'warm' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}>
                            {analysis.close_probability}%
                          </Badge>
                        </div>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] line-clamp-2">
                          {analysis.executive_summary}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">SPIN {analysis.spin_score}</Badge>
                          {analysis.objections?.length > 0 && (
                            <Badge variant="outline" className="text-xs bg-yellow-500/5">
                              {analysis.objections.length} objeções
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      {selectedAnalysis && (
        <AnalysisDetailDialog
          analysis={selectedAnalysis}
          call={selectedCall || undefined}
          open={!!selectedAnalysis}
          onOpenChange={(open) => { if (!open) { setSelectedAnalysis(null); setSelectedCall(null); } }}
        />
      )}
    </div>
  );
}
