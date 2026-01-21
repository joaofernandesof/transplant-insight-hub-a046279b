import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Cloud,
  ExternalLink,
  Globe,
  Link2,
  MessageSquare,
  RefreshCw,
  Send,
  Server,
  Settings,
  Shield,
  Smartphone,
  TrendingUp,
  Webhook,
  Wifi,
  WifiOff,
  XCircle,
  BarChart3,
} from "lucide-react";
import { ModuleLayout } from "@/components/ModuleLayout";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  useMonitoredSystems,
  useSystemAlerts,
  useWhatsAppConfig,
  useSentinelMutations,
  useSentinelStats,
  useRealtimeAlerts,
  type SystemAlert,
} from "@/hooks/useSystemSentinel";
import { AddSystemDialog, SentinelExportPanel, SentinelMetricsChart, SentinelScheduler } from "@/components/sentinel";

// Icon mapper for system types
const getSystemIcon = (type: string) => {
  const icons: Record<string, React.ReactNode> = {
    api: <Server className="h-5 w-5" />,
    webhook: <Webhook className="h-5 w-5" />,
    domain: <Shield className="h-5 w-5" />,
    integration: <Link2 className="h-5 w-5" />,
  };
  return icons[type] || <Cloud className="h-5 w-5" />;
};

// Status helpers
const getStatusConfig = (status?: string) => {
  const configs: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    healthy: { 
      label: 'Operacional', 
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      icon: CheckCircle2
    },
    warning: { 
      label: 'Atenção', 
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      icon: AlertTriangle
    },
    critical: { 
      label: 'Crítico', 
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      icon: XCircle
    },
    unknown: { 
      label: 'Desconhecido', 
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
      icon: WifiOff
    }
  };
  return configs[status || 'unknown'] || configs.unknown;
};

const getSeverityConfig = (severity: string) => {
  const configs: Record<string, { label: string; color: string; emoji: string }> = {
    high: { label: 'Alto', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', emoji: '🔥' },
    medium: { label: 'Médio', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', emoji: '⚠️' },
    low: { label: 'Baixo', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', emoji: 'ℹ️' }
  };
  return configs[severity] || configs.low;
};

const getAlertTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    downtime: 'Indisponível',
    ssl: 'SSL',
    webhook_fail: 'Webhook Falhou',
    slow_response: 'Lento',
    error: 'Erro'
  };
  return labels[type] || type;
};

export default function SystemSentinel() {
  // Data hooks
  const { data: systems, isLoading: systemsLoading, refetch: refetchSystems } = useMonitoredSystems();
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useSystemAlerts();
  const { data: whatsappConfig } = useWhatsAppConfig();
  const stats = useSentinelStats();
  const mutations = useSentinelMutations();

  // Local state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState(whatsappConfig?.instance_url || '');
  const [whatsappToken, setWhatsappToken] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState(whatsappConfig?.phone_number || '');
  const [notifyHigh, setNotifyHigh] = useState(whatsappConfig?.notify_high ?? true);
  const [notifyMedium, setNotifyMedium] = useState(whatsappConfig?.notify_medium ?? true);
  const [notifyLow, setNotifyLow] = useState(whatsappConfig?.notify_low ?? false);
  const [notifyDaily, setNotifyDaily] = useState(whatsappConfig?.notify_daily_summary ?? true);

  // Real-time alerts
  const handleNewAlert = useCallback((alert: SystemAlert) => {
    toast.error(`Novo alerta: ${alert.message}`, {
      description: `Sistema: ${alert.system_name}`,
    });
    refetchAlerts();
  }, [refetchAlerts]);
  
  useRealtimeAlerts(handleNewAlert);

  // Handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutations.runHealthCheck.mutateAsync(undefined);
      await refetchSystems();
      await refetchAlerts();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestWhatsApp = () => {
    mutations.testWhatsApp.mutate();
  };

  const handleSaveWhatsApp = () => {
    mutations.saveWhatsAppConfig.mutate({
      instance_url: whatsappUrl,
      api_token: whatsappToken,
      phone_number: whatsappNumber,
      notify_high: notifyHigh,
      notify_medium: notifyMedium,
      notify_low: notifyLow,
      notify_daily_summary: notifyDaily,
    });
  };

  const handleResolveAlert = (alertId: string) => {
    mutations.resolveAlert.mutate(alertId);
  };

  // Computed values
  const activeAlerts = alerts?.filter(a => !a.resolved) || [];
  const isLoading = systemsLoading || alertsLoading;

  return (
    <ModuleLayout>
      <div className="p-4 pt-16 lg:pt-4 lg:p-6 overflow-x-hidden w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              System Sentinel
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitoramento unificado de sistemas e integrações
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={isRefreshing || mutations.runHealthCheck.isPending}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Verificar Agora
            </Button>
            <AddSystemDialog />
          </div>
        </div>

        {/* Health Summary Banner */}
        <Card className={cn(
          "mb-6 border-l-4",
          stats.criticalSystems > 0 ? "border-l-red-500 bg-red-50 dark:bg-red-950/20" :
          stats.warningSystems > 0 ? "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20" :
          "border-l-green-500 bg-green-50 dark:bg-green-950/20"
        )}>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  stats.criticalSystems > 0 ? "bg-red-100 dark:bg-red-900/50" :
                  stats.warningSystems > 0 ? "bg-amber-100 dark:bg-amber-900/50" :
                  "bg-green-100 dark:bg-green-900/50"
                )}>
                  {stats.criticalSystems > 0 ? (
                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  ) : stats.warningSystems > 0 ? (
                    <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    {stats.criticalSystems > 0 
                      ? `${stats.criticalSystems} sistema${stats.criticalSystems > 1 ? 's' : ''} em estado crítico`
                      : stats.warningSystems > 0 
                        ? `${stats.warningSystems} sistema${stats.warningSystems > 1 ? 's' : ''} requer atenção`
                        : "Tudo funcionando perfeitamente 🚀"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stats.healthySystems} de {stats.totalSystems} sistemas operacionais • Uptime médio: {stats.avgUptime.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>{stats.healthySystems}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>{stats.warningSystems}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span>{stats.criticalSystems}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="dashboard" className="gap-1">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Métricas</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1 relative">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alertas</span>
              {activeAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                  {activeAlerts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-1">
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.avgUptime.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Uptime Médio</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Wifi className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalSystems}</p>
                      <p className="text-xs text-muted-foreground">Sistemas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.activeAlerts}</p>
                      <p className="text-xs text-muted-foreground">Alertas Ativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{whatsappConfig?.is_connected ? 'ON' : 'OFF'}</p>
                      <p className="text-xs text-muted-foreground">WhatsApp</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Systems Grid */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Sistemas Monitorados</h3>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[1,2,3,4].map(i => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-2 w-full mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {systems?.map((system) => {
                    const statusConfig = getStatusConfig(system.status);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <Card 
                        key={system.id} 
                        className={cn(
                          "hover:shadow-md transition-all cursor-pointer group",
                          system.status === 'critical' && "border-red-200 dark:border-red-800",
                          system.status === 'warning' && "border-amber-200 dark:border-amber-800"
                        )}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              system.status === 'healthy' && "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
                              system.status === 'warning' && "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
                              system.status === 'critical' && "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
                              (!system.status || system.status === 'unknown') && "bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400"
                            )}>
                              {getSystemIcon(system.type)}
                            </div>
                            <Badge className={statusConfig.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                          
                          <h4 className="font-medium mb-1 group-hover:text-primary transition-colors">
                            {system.name}
                          </h4>
                          
                          <div className="space-y-2 mt-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Uptime</span>
                              <span className="font-medium">{(system.uptime_percentage || 100).toFixed(1)}%</span>
                            </div>
                            <Progress 
                              value={system.uptime_percentage || 100} 
                              className={cn(
                                "h-1.5",
                                (system.uptime_percentage || 100) >= 99 && "[&>div]:bg-green-500",
                                (system.uptime_percentage || 100) >= 95 && (system.uptime_percentage || 100) < 99 && "[&>div]:bg-amber-500",
                                (system.uptime_percentage || 100) < 95 && "[&>div]:bg-red-500"
                              )}
                            />
                            
                            {system.response_time_ms && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Latência</span>
                                <span className={cn(
                                  "font-medium",
                                  system.response_time_ms > 500 && "text-amber-600 dark:text-amber-400",
                                  system.response_time_ms > 1000 && "text-red-600 dark:text-red-400"
                                )}>
                                  {system.response_time_ms}ms
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                              <span>Erros (24h): {system.error_count_24h || 0}</span>
                              {system.last_check && (
                                <span>Check: {format(new Date(system.last_check), 'HH:mm', { locale: ptBR })}</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Métricas Históricas</h3>
                <p className="text-sm text-muted-foreground">Análise de performance e disponibilidade</p>
              </div>
            </div>
            <SentinelMetricsChart />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Central de Alertas</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Filtrar</Button>
                <Button variant="outline" size="sm">Exportar</Button>
              </div>
            </div>

            {alertsLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <Card key={i}>
                    <CardContent className="py-4">
                      <div className="flex gap-4">
                        <Skeleton className="h-8 w-8" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-48 mb-2" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {alerts?.map((alert) => {
                  const severityConfig = getSeverityConfig(alert.severity);
                  
                  return (
                    <Card 
                      key={alert.id} 
                      className={cn(
                        "transition-all",
                        !alert.resolved && "border-l-4",
                        !alert.resolved && alert.severity === 'high' && "border-l-red-500",
                        !alert.resolved && alert.severity === 'medium' && "border-l-amber-500",
                        !alert.resolved && alert.severity === 'low' && "border-l-blue-500",
                        alert.resolved && "opacity-60"
                      )}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start gap-4">
                          <div className="text-2xl">{severityConfig.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium">{alert.system_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {getAlertTypeLabel(alert.type)}
                              </Badge>
                              <Badge className={cn("text-xs", severityConfig.color)}>
                                {severityConfig.label}
                              </Badge>
                              {alert.resolved && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  Resolvido
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{format(new Date(alert.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                              {alert.notified_via && alert.notified_via.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Send className="h-3 w-3" />
                                  {alert.notified_via.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                          {!alert.resolved && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleResolveAlert(alert.id)}
                              disabled={mutations.resolveAlert.isPending}
                            >
                              Resolver
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {alerts?.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-medium">Nenhum alerta registrado</p>
                      <p className="text-sm text-muted-foreground">Todos os sistemas estão funcionando normalmente</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  Integração WhatsApp (Uazapi)
                </CardTitle>
                <CardDescription>
                  Configure notificações instantâneas via WhatsApp para sua equipe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Connection Status */}
                <div className={cn(
                  "p-4 rounded-lg border-2 border-dashed",
                  whatsappConfig?.is_connected 
                    ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/30"
                    : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/30"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      whatsappConfig?.is_connected ? "bg-green-100 dark:bg-green-900" : "bg-slate-100 dark:bg-slate-800"
                    )}>
                      {whatsappConfig?.is_connected ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Smartphone className="h-5 w-5 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {whatsappConfig?.is_connected ? "WhatsApp Conectado" : "WhatsApp Desconectado"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {whatsappConfig?.is_connected 
                          ? `Última verificação: ${whatsappConfig.last_test_at ? format(new Date(whatsappConfig.last_test_at), "dd/MM HH:mm") : 'Nunca'}`
                          : "Configure sua instância Uazapi para receber alertas"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Configuration */}
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="uazapi-url">URL da Instância Uazapi</Label>
                    <Input 
                      id="uazapi-url" 
                      placeholder="https://sua-instancia.uazapi.com" 
                      value={whatsappUrl}
                      onChange={(e) => setWhatsappUrl(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="uazapi-token">Token de Acesso</Label>
                    <Input 
                      id="uazapi-token" 
                      type="password"
                      placeholder="Seu token de autenticação"
                      value={whatsappToken}
                      onChange={(e) => setWhatsappToken(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="whatsapp-number">Número para Alertas</Label>
                    <Input 
                      id="whatsapp-number" 
                      placeholder="+55 11 99999-9999"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                    />
                  </div>
                </div>

                {/* Alert Preferences */}
                <div className="space-y-4">
                  <h4 className="font-medium">Preferências de Alerta</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">🔥 Alertas Críticos (Alto)</p>
                        <p className="text-xs text-muted-foreground">Sistema fora do ar, falhas graves</p>
                      </div>
                      <Switch checked={notifyHigh} onCheckedChange={setNotifyHigh} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">⚠️ Alertas de Atenção (Médio)</p>
                        <p className="text-xs text-muted-foreground">Lentidão, erros intermitentes</p>
                      </div>
                      <Switch checked={notifyMedium} onCheckedChange={setNotifyMedium} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">ℹ️ Alertas Informativos (Baixo)</p>
                        <p className="text-xs text-muted-foreground">Avisos gerais, SSL próximo de expirar</p>
                      </div>
                      <Switch checked={notifyLow} onCheckedChange={setNotifyLow} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">📊 Resumo Diário</p>
                        <p className="text-xs text-muted-foreground">Enviar resumo às 8h</p>
                      </div>
                      <Switch checked={notifyDaily} onCheckedChange={setNotifyDaily} />
                    </div>
                  </div>
                </div>

                {/* Test Button */}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleTestWhatsApp} 
                    className="gap-2"
                    disabled={mutations.testWhatsApp.isPending || !whatsappConfig?.instance_url}
                  >
                    <Send className="h-4 w-4" />
                    {mutations.testWhatsApp.isPending ? 'Enviando...' : 'Enviar Teste'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleSaveWhatsApp}
                    disabled={mutations.saveWhatsAppConfig.isPending}
                  >
                    {mutations.saveWhatsAppConfig.isPending ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Scheduler Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Agendamento e Automação</h3>
              <SentinelScheduler />
            </div>

            {/* Export Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Exportação e BI</h3>
              <SentinelExportPanel />
            </div>

            {/* Quick Settings */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Integration Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Integrações Externas</CardTitle>
                  <CardDescription>Configure webhooks e APIs de terceiros</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Webhook de Entrada</Label>
                    <div className="flex gap-2">
                      <Input 
                        readOnly 
                        value={`https://tubzywibnielhcjeswww.supabase.co/functions/v1/sentinel-check`}
                        className="text-xs"
                      />
                      <Button variant="outline" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use este endpoint para disparar verificações manualmente
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Sistemas Ativos</h4>
                    <div className="space-y-2">
                      {systems?.slice(0, 4).map((system) => (
                        <div key={system.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <span className="text-sm font-medium">{system.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {system.type}
                          </Badge>
                        </div>
                      ))}
                      {(!systems || systems.length === 0) && (
                        <p className="text-sm text-muted-foreground">Nenhum sistema cadastrado</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ações Rápidas</CardTitle>
                  <CardDescription>Gerencie sistemas e alertas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AddSystemDialog>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Server className="h-4 w-4" />
                      Adicionar Novo Sistema
                    </Button>
                  </AddSystemDialog>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    Verificar Todos os Sistemas
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => mutations.resolveAlert.mutate('all')}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Resolver Todos os Alertas
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
}
