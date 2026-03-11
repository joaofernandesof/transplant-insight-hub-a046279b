import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Phone, Brain, Copy, CheckCircle2, AlertTriangle,
  TrendingUp, MessageSquare, Loader2, Flame, Snowflake, Sun,
  ThumbsUp, ThumbsDown, ArrowRight, Sparkles,
} from 'lucide-react';

interface CallScore {
  rapport: number;
  escuta_ativa: number;
  identificacao_dor: number;
  apresentacao_solucao: number;
  contorno_objecoes: number;
  fechamento: number;
  clareza_comunicacao: number;
  nota_geral: number;
}

interface Objecao {
  objecao: string;
  como_lidou: string;
  sugestao: string;
}

interface CallAnalysisResult {
  resumo_executivo: string;
  scores: CallScore;
  pontos_fortes: string[];
  pontos_melhoria: string[];
  objecoes_identificadas: Objecao[];
  temperatura_lead: 'frio' | 'morno' | 'quente';
  proximos_passos: string[];
  script_whatsapp: string;
}

const SCORE_LABELS: Record<keyof CallScore, string> = {
  rapport: 'Rapport',
  escuta_ativa: 'Escuta Ativa',
  identificacao_dor: 'Identificação de Dor',
  apresentacao_solucao: 'Apresentação da Solução',
  contorno_objecoes: 'Contorno de Objeções',
  fechamento: 'Fechamento',
  clareza_comunicacao: 'Clareza na Comunicação',
  nota_geral: 'Nota Geral',
};

function scoreColor(score: number) {
  if (score >= 8) return 'text-emerald-600 bg-emerald-50';
  if (score >= 6) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
}

function tempIcon(t: string) {
  if (t === 'quente') return <Flame className="h-4 w-4 text-red-500" />;
  if (t === 'morno') return <Sun className="h-4 w-4 text-amber-500" />;
  return <Snowflake className="h-4 w-4 text-blue-500" />;
}

function tempLabel(t: string) {
  if (t === 'quente') return 'Quente 🔥';
  if (t === 'morno') return 'Morno ☀️';
  return 'Frio ❄️';
}

export default function CallAnalysisPage() {
  const [transcript, setTranscript] = useState('');
  const [context, setContext] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CallAnalysisResult | null>(null);
  const [history, setHistory] = useState<Array<{ date: string; analysis: CallAnalysisResult }>>([]);
  const [copiedWa, setCopiedWa] = useState(false);

  const handleAnalyze = async () => {
    if (!transcript.trim() || transcript.trim().length < 30) {
      toast.error('Cole a transcrição completa da call (mínimo 30 caracteres)');
      return;
    }

    setIsAnalyzing(true);
    toast.loading('Analisando call com IA...', { id: 'call-analysis' });

    try {
      const { data, error } = await supabase.functions.invoke('neoteam-analyze-call', {
        body: { transcript: transcript.trim(), context: context.trim() || undefined },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const result = data.analysis as CallAnalysisResult;
      setAnalysis(result);
      setHistory(prev => [{ date: new Date().toLocaleString('pt-BR'), analysis: result }, ...prev]);
      toast.success('Análise concluída! 🎯', { id: 'call-analysis' });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao analisar call', { id: 'call-analysis' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyWhatsApp = () => {
    if (!analysis?.script_whatsapp) return;
    navigator.clipboard.writeText(analysis.script_whatsapp);
    setCopiedWa(true);
    toast.success('Script copiado!');
    setTimeout(() => setCopiedWa(false), 2000);
  };

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-6">
      <NeoTeamBreadcrumb />

      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Phone className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Análise de Calls</h1>
          <p className="text-muted-foreground text-sm">
            Cole a transcrição da call e receba uma avaliação completa com notas e script de follow-up
          </p>
        </div>
      </div>

      {/* Input Area */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4" /> Transcrição da Call
            </CardTitle>
            <CardDescription>Cole a transcrição completa da ligação comercial</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Cole aqui a transcrição da call..."
              className="min-h-[200px] text-sm"
            />
            <Input
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Contexto adicional (opcional): ex. Lead do Instagram, interessado em harmonização"
            />
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || transcript.trim().length < 30}
              className="w-full gap-2"
            >
              {isAnalyzing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analisando...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Analisar Call com IA</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* History sidebar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma análise ainda</p>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => setAnalysis(h.analysis)}
                      className="w-full text-left p-2 rounded-md hover:bg-muted/50 transition-colors text-sm border"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">
                          {h.analysis.resumo_executivo.substring(0, 40)}...
                        </span>
                        <Badge variant="outline" className="text-xs ml-2 shrink-0">
                          {h.analysis.scores.nota_geral}/10
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{h.date}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Summary + Temperature */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Resumo Executivo</h3>
                  <p className="text-muted-foreground text-sm">{analysis.resumo_executivo}</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 shrink-0">
                  {tempIcon(analysis.temperatura_lead)}
                  <span className="font-semibold">{tempLabel(analysis.temperatura_lead)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scores Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Tabela de Avaliação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Critério</TableHead>
                    <TableHead className="w-[100px] text-center">Nota</TableHead>
                    <TableHead className="w-[200px]">Nível</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(analysis.scores).map(([key, score]) => (
                    <TableRow key={key} className={key === 'nota_geral' ? 'font-semibold bg-muted/30' : ''}>
                      <TableCell>{SCORE_LABELS[key as keyof CallScore]}</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${scoreColor(score)}`}>
                          {score}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${score * 10}%` }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Strengths & Improvements */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-emerald-700">
                  <ThumbsUp className="h-4 w-4" /> Pontos Fortes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.pontos_fortes.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                  <ThumbsDown className="h-4 w-4" /> Pontos a Melhorar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.pontos_melhoria.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Objections */}
          {analysis.objecoes_identificadas.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Objeções Identificadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.objecoes_identificadas.map((o, i) => (
                    <div key={i} className="rounded-lg border p-3 space-y-2">
                      <div className="font-medium text-sm">❓ {o.objecao}</div>
                      <div className="text-sm text-muted-foreground">
                        <strong>Como lidou:</strong> {o.como_lidou}
                      </div>
                      <div className="text-sm text-emerald-700 bg-emerald-50 p-2 rounded">
                        <strong>💡 Sugestão:</strong> {o.sugestao}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRight className="h-4 w-4" /> Próximos Passos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.proximos_passos.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* WhatsApp Script */}
          <Card className="border-green-200 bg-green-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-green-700">
                <MessageSquare className="h-4 w-4" /> Script de Follow-up WhatsApp
              </CardTitle>
              <CardDescription>Mensagem personalizada pronta para enviar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-background rounded-lg p-4 border text-sm whitespace-pre-wrap mb-3">
                {analysis.script_whatsapp}
              </div>
              <Button
                onClick={copyWhatsApp}
                variant="outline"
                className="gap-2 border-green-300 text-green-700 hover:bg-green-100"
              >
                {copiedWa ? (
                  <><CheckCircle2 className="h-4 w-4" /> Copiado!</>
                ) : (
                  <><Copy className="h-4 w-4" /> Copiar Script</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
