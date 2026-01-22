import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Ticket, Clock, AlertCircle, CheckCircle2, Star, 
  ArrowRight, Plus
} from 'lucide-react';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { usePostVenda } from '../hooks/usePostVenda';
import { ETAPA_LABELS } from '../lib/permissions';

type NpsRow = { nota: number | null; respondido_em: string | null; created_at: string | null };

function calcNpsScore(scores: number[]) {
  if (!scores.length) return 0;
  const promoters = scores.filter((s) => s >= 9).length;
  const detractors = scores.filter((s) => s <= 6).length;
  return Math.round(((promoters - detractors) / scores.length) * 100);
}

export default function PostVendaHome() {
  const navigate = useNavigate();
  const { chamados, stats } = usePostVenda();
  const [npsRows, setNpsRows] = useState<NpsRow[]>([]);
  const [isLoadingNps, setIsLoadingNps] = useState(true);

  const etapas = ['triagem', 'atendimento', 'resolucao', 'validacao_paciente', 'nps'] as const;

  // Recent tickets for quick access
  const recentChamados = chamados.slice(0, 5);

  useEffect(() => {
    const fetchNps = async () => {
      setIsLoadingNps(true);
      const { data } = await supabase
        .from('postvenda_nps')
        .select('nota, respondido_em, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);
      setNpsRows((data as unknown as NpsRow[]) || []);
      setIsLoadingNps(false);
    };
    fetchNps();
  }, []);

  const npsKpis = useMemo(() => {
    const scores = npsRows.map((r) => (typeof r.nota === 'number' ? r.nota : null)).filter((n): n is number => n !== null);
    const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
    const nps = calcNpsScore(scores);
    return { nps, avg, answered: scores.length };
  }, [npsRows]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <GlobalBreadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            Dashboard Pós-Venda
          </h1>
          <p className="text-muted-foreground">Gestão de atendimento e suporte ao paciente</p>
        </div>
        <Button onClick={() => navigate('/neoteam/postvenda/chamados')} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Chamado
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/neoteam/postvenda/chamados')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Chamados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/neoteam/postvenda/chamados?filter=sla_ok')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.slaOk}</p>
                <p className="text-xs text-muted-foreground">SLA OK</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/neoteam/postvenda/chamados?filter=sla_warning')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.slaWarning}</p>
                <p className="text-xs text-muted-foreground">SLA Atenção</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/neoteam/postvenda/chamados?filter=sla_danger')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <AlertCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.slaEstourados}</p>
                <p className="text-xs text-muted-foreground">SLA Estourado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/neoteam/postvenda/nps')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{isLoadingNps ? '—' : npsKpis.avg}</p>
                <p className="text-xs text-muted-foreground">NPS Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acessos rápidos */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/neoteam/postvenda/sla')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">Configuração SLA</p>
              <p className="text-sm text-muted-foreground">Definir prazos por tipo e prioridade</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/neoteam/postvenda/nps')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">Relatórios NPS</p>
              <p className="text-sm text-muted-foreground">Tendências e comentários</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Chamados por Etapa - Clickable */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Chamados por Etapa</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/neoteam/postvenda/chamados')}
          >
            Ver todos
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {etapas.map(etapa => (
              <div 
                key={etapa} 
                className="text-center p-4 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => navigate('/neoteam/postvenda/chamados')}
              >
                <p className="text-3xl font-bold">{stats.byEtapa[etapa] || 0}</p>
                <p className="text-sm text-muted-foreground">{ETAPA_LABELS[etapa]}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chamados Recentes */}
      {recentChamados.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Chamados Recentes</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/neoteam/postvenda/chamados')}
            >
              Ver todos
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentChamados.map((chamado) => (
                <div 
                  key={chamado.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/neoteam/postvenda/chamados/${chamado.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{chamado.numero_chamado?.toString().padStart(5, '0')}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{chamado.paciente_nome}</p>
                      <p className="text-xs text-muted-foreground">{chamado.tipo_demanda}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {ETAPA_LABELS[chamado.etapa_atual]}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
