import { useState } from 'react';
import { useTabFromUrl } from '@/hooks/useTabFromUrl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { useSystemMetrics, formatDurationShort } from '@/hooks/useSystemMetrics';
import { queryClient, CACHE_TIMES } from '@/lib/queryClient';
import { MetricHistoryCharts } from '@/components/MetricHistoryCharts';
import { AlertsConfigPanel } from '@/components/AlertsConfigPanel';
import { 
  Database, 
  Cpu, 
  HardDrive, 
  Activity, 
  Users, 
  Clock, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  TrendingUp,
  Server,
  Layers,
  BarChart3,
  Trash2,
  Bell,
  LineChart
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function SystemMetrics() {
  const { metrics, isLoading, lastUpdated, refresh } = useSystemMetrics();
  const [isClearing, setIsClearing] = useState(false);
  
  const { activeTab, setActiveTab } = useTabFromUrl({
    defaultTab: "database",
    validTabs: ["database", "cache", "usage", "performance"],
  });

  const clearCache = async () => {
    setIsClearing(true);
    queryClient.clear();
    toast.success('Cache limpo com sucesso!');
    setIsClearing(false);
    refresh();
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="p-4 pt-16 lg:pt-4 lg:p-6 flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
            <p className="text-slate-400">Carregando métricas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="p-4 pt-16 lg:pt-4 lg:p-6">
          <p className="text-slate-400">Sem permissão para acessar métricas do sistema.</p>
        </div>
      </div>
    );
  }

  const totalRows = Object.values(metrics.database.totalRows).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="p-4 pt-6 lg:p-6 overflow-x-hidden w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Server className="h-6 w-6 text-primary" />
              Métricas do Sistema
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitoramento de performance e recursos
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Atualizado às {format(lastUpdated, 'HH:mm:ss', { locale: ptBR })}
              </span>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Health Status Banner */}
        <Card className={`border-2 ${
          metrics.health.status === 'healthy' ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' :
          metrics.health.status === 'degraded' ? 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20' :
          'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
        }`}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getHealthIcon(metrics.health.status)}
                <div>
                  <p className="font-semibold capitalize">
                    Sistema {metrics.health.status === 'healthy' ? 'Saudável' : 
                            metrics.health.status === 'degraded' ? 'Degradado' : 'Crítico'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Uptime: {metrics.health.uptime}
                  </p>
                </div>
              </div>
              {metrics.health.issues.length > 0 && (
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metrics.health.issues.length} alerta(s)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.health.issues[0]}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalRows.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Registros</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{metrics.usage.activeUsers24h}</p>
                  <p className="text-xs text-muted-foreground">Usuários 24h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{metrics.cache.cacheHitRate}%</p>
                  <p className="text-xs text-muted-foreground">Cache Hit</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{metrics.performance.avgQueryTime.toFixed(0)}ms</p>
                  <p className="text-xs text-muted-foreground">Latência Média</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="database" className="gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Database</span>
            </TabsTrigger>
            <TabsTrigger value="cache" className="gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Cache</span>
            </TabsTrigger>
            <TabsTrigger value="usage" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Uso</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <Cpu className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
          </TabsList>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Armazenamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Estimativa de uso</span>
                    <span className="font-medium">{metrics.database.storageUsed}</span>
                  </div>
                  <Progress value={35} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{metrics.database.totalTables} tabelas monitoradas</span>
                    <span>{metrics.database.activeConnections} conexões ativas</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tabelas por Tamanho</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto">
                    {Object.entries(metrics.database.totalRows)
                      .sort((a, b) => b[1] - a[1])
                      .map(([table, count]) => (
                        <div key={table} className="flex items-center justify-between">
                          <span className="text-sm font-mono">{table}</span>
                          <Badge variant="secondary">{count.toLocaleString()}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cache Tab */}
          <TabsContent value="cache" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${metrics.cache.cacheHitRate * 2.51} 251`}
                          className="text-primary"
                        />
                      </svg>
                      <span className="absolute text-2xl font-bold">
                        {metrics.cache.cacheHitRate}%
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium">Cache Hit Rate</p>
                    <p className="text-xs text-muted-foreground">Taxa de acerto do cache</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Queries em cache</span>
                    <Badge variant="outline">{metrics.cache.queriesInCache}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600">Queries fresh</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {metrics.cache.freshQueries}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-yellow-600">Queries stale</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {metrics.cache.stalequeries}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuração do Cache</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>SHORT</span>
                    <span className="text-muted-foreground">{CACHE_TIMES.SHORT.staleTime / 1000}s stale</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MEDIUM</span>
                    <span className="text-muted-foreground">{CACHE_TIMES.MEDIUM.staleTime / 60000}min stale</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LONG</span>
                    <span className="text-muted-foreground">{CACHE_TIMES.LONG.staleTime / 60000}min stale</span>
                  </div>
                  <div className="flex justify-between">
                    <span>STATIC</span>
                    <span className="text-muted-foreground">{CACHE_TIMES.STATIC.staleTime / 3600000}h stale</span>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full mt-4 gap-2"
                    onClick={clearCache}
                    disabled={isClearing}
                  >
                    <Trash2 className="h-4 w-4" />
                    Limpar Todo o Cache
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Atividade de Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-3xl font-bold">{metrics.usage.activeUsers24h}</p>
                      <p className="text-xs text-muted-foreground">Usuários Ativos (24h)</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-3xl font-bold">{metrics.usage.totalSessions}</p>
                      <p className="text-xs text-muted-foreground">Total de Sessões</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Duração média da sessão</span>
                      <Badge variant="outline">
                        {formatDurationShort(metrics.usage.avgSessionDuration)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Horário de pico</span>
                      <Badge variant="outline">{metrics.usage.peakHour}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Volume de Requisições
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <p className="text-5xl font-bold text-primary">
                      {metrics.usage.requestsToday.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Requisições estimadas hoje
                    </p>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm">
                      ~{Math.round(metrics.usage.requestsToday / 24)} req/hora
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Clock className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="text-3xl font-bold">
                      {metrics.performance.avgQueryTime.toFixed(0)}ms
                    </p>
                    <p className="text-sm text-muted-foreground">Latência Média</p>
                    <Badge 
                      variant="outline" 
                      className={`mt-2 ${
                        metrics.performance.avgQueryTime < 50 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : metrics.performance.avgQueryTime < 100
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {metrics.performance.avgQueryTime < 50 ? 'Excelente' : 
                       metrics.performance.avgQueryTime < 100 ? 'Bom' : 'Lento'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <AlertTriangle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                    <p className="text-3xl font-bold">
                      {metrics.performance.slowQueries}
                    </p>
                    <p className="text-sm text-muted-foreground">Queries Lentas</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Acima de 1 segundo
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <XCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                    <p className="text-3xl font-bold">
                      {metrics.performance.errorRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Taxa de Erro</p>
                    <Badge 
                      variant="outline" 
                      className={`mt-2 ${
                        metrics.performance.errorRate < 1 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : metrics.performance.errorRate < 5
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {metrics.performance.errorRate < 1 ? 'Saudável' : 
                       metrics.performance.errorRate < 5 ? 'Atenção' : 'Crítico'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {metrics.health.issues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Alertas e Recomendações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {metrics.health.issues.map((issue, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
