import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Ticket, Clock, AlertCircle, CheckCircle2, Star, 
  ArrowRight, Plus, FileText, Gavel, HeadphonesIcon,
  Settings, BarChart3
} from 'lucide-react';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { usePostVenda } from '../hooks/usePostVenda';
import { useDistratoRequests } from '../hooks/useDistrato';
import { ETAPA_LABELS } from '../lib/permissions';
import { ChamadosTabContent } from '../components/ChamadosTabContent';
import { DistratoKanban } from '../components/DistratoKanban';

type NpsRow = { nota: number | null; respondido_em: string | null; created_at: string | null };

function calcNpsScore(scores: number[]) {
  if (!scores.length) return 0;
  const promoters = scores.filter((s) => s >= 9).length;
  const detractors = scores.filter((s) => s <= 6).length;
  return Math.round(((promoters - detractors) / scores.length) * 100);
}

export default function PostVendaHome() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  
  const { chamados, stats } = usePostVenda();
  const { stats: distratoStats } = useDistratoRequests();
  const [npsRows, setNpsRows] = useState<NpsRow[]>([]);
  const [isLoadingNps, setIsLoadingNps] = useState(true);

  const etapas = ['triagem', 'atendimento', 'resolucao', 'validacao_paciente', 'nps'] as const;

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

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

  // Recent tickets for quick access
  const recentChamados = chamados.slice(0, 5);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <GlobalBreadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HeadphonesIcon className="h-6 w-6 text-primary" />
            Pós-Venda
          </h1>
          <p className="text-muted-foreground">Gestão de atendimento, chamados e distratos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/neoteam/postvenda/sla')}>
            <Settings className="h-4 w-4 mr-2" />
            SLA
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/neoteam/postvenda/nps')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            NPS
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="chamados" className="gap-2">
            <Ticket className="h-4 w-4" />
            <span className="hidden sm:inline">Chamados</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">{stats.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="distrato" className="gap-2">
            <Gavel className="h-4 w-4" />
            <span className="hidden sm:inline">Distrato</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">{distratoStats.total}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-0">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary" onClick={() => handleTabChange('chamados')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Ticket className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Chamados</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-orange-500" onClick={() => handleTabChange('distrato')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Gavel className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{distratoStats.total}</p>
                    <p className="text-xs text-muted-foreground">Distratos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('chamados')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.slaOk}</p>
                    <p className="text-xs text-muted-foreground">SLA OK</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('chamados')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.slaWarning}</p>
                    <p className="text-xs text-muted-foreground">SLA Atenção</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('chamados')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertCircle className="h-5 w-5 text-destructive" />
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
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Star className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{isLoadingNps ? '—' : npsKpis.avg}</p>
                    <p className="text-xs text-muted-foreground">NPS Médio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chamados por Etapa */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Chamados por Etapa</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleTabChange('chamados')}
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
                    onClick={() => handleTabChange('chamados')}
                  >
                    <p className="text-3xl font-bold">{stats.byEtapa[etapa] || 0}</p>
                    <p className="text-sm text-muted-foreground">{ETAPA_LABELS[etapa]}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Chamados Recentes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  Chamados Recentes
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleTabChange('chamados')}
                >
                  Ver todos
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardHeader>
              <CardContent>
                {recentChamados.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum chamado encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentChamados.map((chamado) => (
                      <div 
                        key={chamado.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/neoteam/postvenda/chamados/${chamado.id}`)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono text-muted-foreground">
                            #{chamado.numero_chamado?.toString().padStart(5, '0')}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{chamado.paciente_nome}</p>
                            <p className="text-xs text-muted-foreground truncate">{chamado.tipo_demanda}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {ETAPA_LABELS[chamado.etapa_atual]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Distratos Recentes (Summary) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gavel className="h-4 w-4" />
                  Distratos em Andamento
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleTabChange('distrato')}
                >
                  Ver Kanban
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold">{distratoStats.emAndamento}</p>
                      <p className="text-xs text-muted-foreground">Em Andamento</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold text-destructive">{distratoStats.slaEstourados}</p>
                      <p className="text-xs text-muted-foreground">SLA Estourado</p>
                    </div>
                  </div>
                  <Button 
                    className="w-full gap-2" 
                    variant="outline"
                    onClick={() => handleTabChange('distrato')}
                  >
                    <Plus className="h-4 w-4" />
                    Nova Solicitação de Distrato
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Chamados Tab */}
        <TabsContent value="chamados" className="mt-0">
          <ChamadosTabContent />
        </TabsContent>

        {/* Distrato Tab */}
        <TabsContent value="distrato" className="mt-0">
          <DistratoKanban />
        </TabsContent>
      </Tabs>
    </div>
  );
}
