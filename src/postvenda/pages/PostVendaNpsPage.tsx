import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { Loader2, MessageCircle, Star, TrendingUp, Users } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

type NpsRow = {
  id: string;
  chamado_id: string;
  canal_envio?: string | null;
  nota?: number | null;
  comentario?: string | null;
  enviado_em?: string | null;
  respondido_em?: string | null;
  // Join (se existir)
  postvenda_chamados?: {
    paciente_nome?: string | null;
    tipo_demanda?: string | null;
  } | null;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function calcNpsScore(scores: number[]) {
  if (!scores.length) return 0;
  const promoters = scores.filter((s) => s >= 9).length;
  const detractors = scores.filter((s) => s <= 6).length;
  return Math.round(((promoters - detractors) / scores.length) * 100);
}

export default function PostVendaNpsPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<NpsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchNps = async () => {
      setIsLoading(true);
      try {
        // Tentamos join com chamados (se houver relação no backend)
        const { data, error } = await supabase
          .from('postvenda_nps')
          .select('*, postvenda_chamados(paciente_nome, tipo_demanda)')
          .order('enviado_em', { ascending: false, nullsFirst: false })
          .limit(1000);

        if (error) throw error;
        setRows((data as unknown as NpsRow[]) || []);
      } catch (e) {
        console.error(e);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados de NPS.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchNps();
  }, [toast]);

  const answered = useMemo(() => {
    return rows
      .filter((r) => typeof r.nota === 'number')
      .map((r) => ({ ...r, nota: clamp(Number(r.nota), 0, 10) }));
  }, [rows]);

  const kpis = useMemo(() => {
    const scores = answered.map((r) => r.nota as number);
    const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
    const nps = calcNpsScore(scores);
    const promoters = scores.filter((s) => s >= 9).length;
    const passives = scores.filter((s) => s >= 7 && s <= 8).length;
    const detractors = scores.filter((s) => s <= 6).length;
    return {
      answered: scores.length,
      avg,
      nps,
      promoters,
      passives,
      detractors,
    };
  }, [answered]);

  const trend = useMemo(() => {
    // Agrupar por dia usando respondido_em (fallback enviado_em)
    const map = new Map<string, { day: string; count: number; sum: number }>();
    for (const r of answered) {
      const base = r.respondido_em || r.enviado_em;
      if (!base) continue;
      const day = format(new Date(base), 'dd/MM', { locale: ptBR });
      const prev = map.get(day) || { day, count: 0, sum: 0 };
      map.set(day, { day, count: prev.count + 1, sum: prev.sum + (r.nota as number) });
    }
    const arr = Array.from(map.values())
      .map((d) => ({
        day: d.day,
        media: d.count ? Math.round((d.sum / d.count) * 10) / 10 : 0,
        respostas: d.count,
      }))
      .slice(0, 14)
      .reverse();
    return arr;
  }, [answered]);

  const distribution = useMemo(() => {
    const dist = Array.from({ length: 11 }, (_, i) => ({ nota: i, count: 0 }));
    for (const r of answered) {
      const n = clamp(Number(r.nota), 0, 10);
      dist[n].count += 1;
    }
    return dist;
  }, [answered]);

  const filteredComments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return answered.filter((r) => (r.comentario || '').trim().length > 0);
    return answered.filter((r) => {
      const paciente = (r.postvenda_chamados?.paciente_nome || '').toLowerCase();
      const tipo = (r.postvenda_chamados?.tipo_demanda || '').toLowerCase();
      const comentario = (r.comentario || '').toLowerCase();
      return paciente.includes(q) || tipo.includes(q) || comentario.includes(q) || String(r.nota ?? '').includes(q);
    });
  }, [answered, search]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <GlobalBreadcrumb />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Relatórios NPS
          </h1>
          <p className="text-muted-foreground">Satisfação, tendências e comentários dos pacientes</p>
        </div>
        <Badge variant="secondary" className="w-fit">
          {kpis.answered} respostas
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{kpis.nps}</p>
                    <p className="text-xs text-muted-foreground">NPS</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{kpis.avg}</p>
                    <p className="text-xs text-muted-foreground">Nota média</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{kpis.promoters}</p>
                    <p className="text-xs text-muted-foreground">Promotores (9–10)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{filteredComments.filter((c) => (c.comentario || '').trim().length > 0).length}</p>
                    <p className="text-xs text-muted-foreground">Comentários</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Visão geral</TabsTrigger>
              <TabsTrigger value="comments">Comentários</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tendência (nota média)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="media" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Distribuição de notas</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nota" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Detratores (0–6)</p>
                      <p className="text-xl font-bold">{kpis.detractors}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Neutros (7–8)</p>
                      <p className="text-xl font-bold">{kpis.passives}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Promotores (9–10)</p>
                      <p className="text-xl font-bold">{kpis.promoters}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    <div className="flex-1">
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por paciente, tipo, nota ou comentário..."
                      />
                    </div>
                    <Badge variant="secondary" className="w-fit">
                      {filteredComments.length} resultados
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {filteredComments.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      Nenhum comentário encontrado.
                    </CardContent>
                  </Card>
                ) : (
                  filteredComments
                    .filter((r) => (r.comentario || '').trim().length > 0)
                    .slice(0, 100)
                    .map((r) => (
                      <Card key={r.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {r.postvenda_chamados?.paciente_nome || 'Paciente'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(r.postvenda_chamados?.tipo_demanda || '—').toString()}
                                {r.respondido_em ? ` • ${format(new Date(r.respondido_em), 'dd/MM/yyyy', { locale: ptBR })}` : ''}
                              </p>
                            </div>
                            <Badge variant="outline">Nota {r.nota}</Badge>
                          </div>
                          <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{r.comentario}</p>
                          <div className="mt-3 flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Leva ao chamado (rota já existe)
                                if (r.chamado_id) {
                                  window.location.href = `/neoteam/postvenda/chamados/${r.chamado_id}`;
                                }
                              }}
                            >
                              Ver chamado
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
