import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Ticket, Clock, AlertCircle, CheckCircle2, Star, 
  ArrowRight, Plus, Gavel, HeadphonesIcon,
  Settings, BarChart3, Target, Flame, Calendar
} from 'lucide-react';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { usePostVenda } from '../hooks/usePostVenda';
import { ETAPA_LABELS } from '../lib/permissions';
import { ChamadosTabContent } from '../components/ChamadosTabContent';
import {
  DashboardKpiCard,
  DashboardProgressCard,
  DashboardPriorityList,
  DashboardDeadlineList,
} from '@/neohub/components/dashboard';

type NpsRow = { nota: number | null; respondido_em: string | null; enviado_em: string | null };

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
  const tipoFilter = searchParams.get('tipo') || undefined;
  
  const { chamados, stats } = usePostVenda();
  const [npsRows, setNpsRows] = useState<NpsRow[]>([]);
  const [isLoadingNps, setIsLoadingNps] = useState(true);

  const etapas = ['triagem', 'atendimento', 'resolucao', 'validacao_paciente', 'nps'] as const;

  // Count distrato chamados
  const distratoCount = useMemo(() => 
    chamados.filter(c => c.tipo_demanda === 'distrato').length
  , [chamados]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams();
    params.set('tab', value);
    setSearchParams(params);
  };

  const handleFilterDistrato = () => {
    const params = new URLSearchParams();
    params.set('tab', 'chamados');
    params.set('tipo', 'distrato');
    setSearchParams(params);
  };

  useEffect(() => {
    const fetchNps = async () => {
      setIsLoadingNps(true);
      const { data } = await supabase
        .from('postvenda_nps')
        .select('nota, respondido_em, enviado_em')
        .order('enviado_em', { ascending: false, nullsFirst: false })
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

  // SLA estourados como lista de prazos - baseado nos chamados com prioridade urgente ou atrasados
  const slaEstouradosList = useMemo(() => {
    // Filtrar chamados que parecem estar atrasados (usando uma lógica simplificada)
    const atrasados = chamados.filter(c => 
      c.prioridade === 'urgente' || c.prioridade === 'alta'
    ).slice(0, 5);
    
    return atrasados.map(c => ({
      id: c.id,
      title: `${c.paciente_nome}: ${c.tipo_demanda}`,
      status: 'overdue' as const,
      onClick: () => navigate(`/neoteam/postvenda/chamados/${c.id}`),
    }));
  }, [chamados, navigate]);

  // Prioridades como contadores
  const prioridadesCounts = useMemo(() => {
    const counts = { urgent: 0, high: 0, normal: 0, low: 0 };
    chamados.forEach(c => {
      if (c.prioridade === 'urgente') counts.urgent++;
      else if (c.prioridade === 'alta') counts.high++;
      else if (c.prioridade === 'normal') counts.normal++;
      else if (c.prioridade === 'baixa') counts.low++;
    });
    return counts;
  }, [chamados]);

  // Chamados recentes
  const recentChamados = chamados.slice(0, 5);

  // Calculo de taxa de resolução
  const resolvidos = chamados.filter(c => c.status === 'resolvido' || c.status === 'fechado').length;
  const taxaResolucao = chamados.length > 0 ? Math.round((resolvidos / chamados.length) * 100) : 0;

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
          <p className="text-muted-foreground">Gestão de chamados e atendimento ao paciente</p>
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
        <TabsList className="inline-flex">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="chamados" className="gap-2">
            <Ticket className="h-4 w-4" />
            Chamados
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">{stats.total}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-0">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardKpiCard
              icon={Ticket}
              value={stats.total}
              label="Total de Chamados"
              badge={String(distratoCount)}
              onClick={() => handleTabChange('chamados')}
            />
            <DashboardKpiCard
              icon={Gavel}
              value={distratoCount}
              label="Distratos"
              badge="Atenção"
              badgeVariant={distratoCount > 0 ? 'warning' : 'default'}
              variant={distratoCount > 0 ? 'info' : 'default'}
              onClick={handleFilterDistrato}
            />
            <DashboardKpiCard
              icon={AlertCircle}
              value={stats.slaEstourados}
              label="SLA Estourado"
              badge="Crítico"
              badgeVariant="warning"
              variant={stats.slaEstourados > 0 ? 'warning' : 'default'}
              onClick={() => handleTabChange('chamados')}
            />
            <DashboardKpiCard
              icon={Star}
              value={isLoadingNps ? '—' : npsKpis.avg}
              label="NPS Médio"
              badge={`${npsKpis.answered} respostas`}
              badgeVariant="success"
              variant="success"
              onClick={() => navigate('/neoteam/postvenda/nps')}
            />
          </div>

          {/* Progress and Priority Row */}
          <div className="grid lg:grid-cols-2 gap-4">
            <DashboardProgressCard
              icon={Target}
              title="Taxa de Resolução"
              subtitle="Chamados resolvidos vs total"
              current={resolvidos}
              total={chamados.length}
              metrics={[
                { value: stats.byEtapa.triagem || 0, label: 'Triagem', color: 'default' },
                { value: stats.byEtapa.atendimento || 0, label: 'Atendimento', color: 'primary' },
                { value: stats.byEtapa.resolucao || 0, label: 'Resolução', color: 'warning' },
                { value: resolvidos, label: 'Resolvido', color: 'success' },
              ]}
            />
            <DashboardPriorityList
              icon={Flame}
              title="Prioridades Pendentes"
              subtitle="Distribuição por nível de urgência"
              items={[
                { level: 'urgent', count: prioridadesCounts.urgent },
                { level: 'high', count: prioridadesCounts.high },
                { level: 'normal', count: prioridadesCounts.normal },
                { level: 'low', count: prioridadesCounts.low },
              ]}
            />
          </div>

          {/* SLA e Chamados Recentes */}
          <div className="grid lg:grid-cols-2 gap-4">
            <DashboardDeadlineList
              icon={Clock}
              title="SLA Estourados"
              subtitle="Chamados que ultrapassaram o prazo"
              items={slaEstouradosList}
              emptyMessage="Nenhum SLA estourado 🎉"
            />

            {/* Chamados Recentes Card */}
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
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
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
                        <div className="flex items-center gap-2">
                          {chamado.tipo_demanda === 'distrato' && (
                            <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                              <Gavel className="h-3 w-3 mr-1" />
                              Distrato
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {ETAPA_LABELS[chamado.etapa_atual]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Atalhos Rápidos */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Button 
              className="h-auto py-4 flex flex-col items-center gap-2" 
              variant="outline"
              onClick={() => handleTabChange('chamados')}
            >
              <Plus className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Novo Chamado</span>
            </Button>
            <Button 
              className="h-auto py-4 flex flex-col items-center gap-2" 
              variant="outline"
              onClick={handleFilterDistrato}
            >
              <Gavel className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium">Ver Distratos</span>
            </Button>
            <Button 
              className="h-auto py-4 flex flex-col items-center gap-2" 
              variant="outline"
              onClick={() => navigate('/neoteam/postvenda/sla')}
            >
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Configurar SLA</span>
            </Button>
            <Button 
              className="h-auto py-4 flex flex-col items-center gap-2" 
              variant="outline"
              onClick={() => navigate('/neoteam/postvenda/nps')}
            >
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Relatórios NPS</span>
            </Button>
          </div>
        </TabsContent>

        {/* Chamados Tab */}
        <TabsContent value="chamados" className="mt-0">
          <ChamadosTabContent initialTipoFilter={tipoFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
