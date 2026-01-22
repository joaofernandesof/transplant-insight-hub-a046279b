import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Ticket, Clock, AlertCircle, CheckCircle2, Star, 
  List, Settings, BarChart3, ArrowRight, Plus
} from 'lucide-react';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { usePostVenda } from '../hooks/usePostVenda';
import { ETAPA_LABELS } from '../lib/permissions';

// Quick access modules
const modules = [
  {
    id: 'chamados',
    title: 'Chamados',
    description: 'Kanban de chamados ativos',
    icon: List,
    route: '/neoteam/postvenda/chamados',
    color: 'bg-blue-500',
    stats: (s: any) => `${s.total} chamados`,
  },
  {
    id: 'sla',
    title: 'Configuração SLA',
    description: 'Tempos e alertas por tipo',
    icon: Clock,
    route: '/neoteam/postvenda/sla',
    color: 'bg-amber-500',
    stats: () => 'Configurar',
    disabled: true,
  },
  {
    id: 'nps',
    title: 'Relatórios NPS',
    description: 'Satisfação dos pacientes',
    icon: BarChart3,
    route: '/neoteam/postvenda/nps',
    color: 'bg-emerald-500',
    stats: () => 'Ver relatórios',
    disabled: true,
  },
];

export default function PostVendaHome() {
  const navigate = useNavigate();
  const { chamados, stats, isLoading } = usePostVenda();

  const etapas = ['triagem', 'atendimento', 'resolucao', 'validacao_paciente', 'nps'] as const;

  // Recent tickets for quick access
  const recentChamados = chamados.slice(0, 5);

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
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/neoteam/postvenda/chamados')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Ticket className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Chamados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.slaOk}</p>
                <p className="text-xs text-muted-foreground">SLA OK</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.slaWarning}</p>
                <p className="text-xs text-muted-foreground">Atenção</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.slaEstourados}</p>
                <p className="text-xs text-muted-foreground">SLA Estourado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">--</p>
                <p className="text-xs text-muted-foreground">NPS Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Modules */}
      <div className="grid md:grid-cols-3 gap-4">
        {modules.map((module) => (
          <Card 
            key={module.id}
            className={`cursor-pointer hover:shadow-md transition-all ${
              module.disabled ? 'opacity-60' : ''
            }`}
            onClick={() => !module.disabled && navigate(module.route)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${module.color} text-white`}>
                  <module.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{module.title}</h3>
                    {module.disabled && (
                      <Badge variant="secondary" className="text-xs">Em breve</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">{module.stats(stats)}</span>
                    {!module.disabled && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
