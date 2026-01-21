import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Plus,
  RefreshCw,
  Send,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  Smartphone,
  TrendingUp,
  Webhook,
  Wifi,
  WifiOff,
  XCircle,
  Zap
} from "lucide-react";
import { ModuleLayout } from "@/components/ModuleLayout";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Types
interface MonitoredSystem {
  id: string;
  name: string;
  type: 'webhook' | 'api' | 'domain' | 'integration';
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  uptime: number;
  lastCheck: Date;
  responseTime?: number;
  errorCount24h: number;
  url?: string;
  icon: React.ReactNode;
}

interface AlertLog {
  id: string;
  systemId: string;
  systemName: string;
  severity: 'high' | 'medium' | 'low';
  type: 'downtime' | 'ssl' | 'webhook_fail' | 'slow_response' | 'error';
  message: string;
  timestamp: Date;
  resolved: boolean;
  notifiedVia?: ('whatsapp' | 'email')[];
}

// Mock data
const mockSystems: MonitoredSystem[] = [
  {
    id: '1',
    name: 'Neo Folic API',
    type: 'api',
    status: 'healthy',
    uptime: 99.9,
    lastCheck: new Date(),
    responseTime: 145,
    errorCount24h: 0,
    url: 'https://api.neofolic.com',
    icon: <Server className="h-5 w-5" />
  },
  {
    id: '2',
    name: 'Kommo CRM',
    type: 'integration',
    status: 'healthy',
    uptime: 99.5,
    lastCheck: new Date(),
    responseTime: 230,
    errorCount24h: 2,
    icon: <Link2 className="h-5 w-5" />
  },
  {
    id: '3',
    name: 'Zapier Workflows',
    type: 'webhook',
    status: 'warning',
    uptime: 97.2,
    lastCheck: new Date(),
    responseTime: 890,
    errorCount24h: 5,
    icon: <Zap className="h-5 w-5" />
  },
  {
    id: '4',
    name: 'SSL neofolic.com',
    type: 'domain',
    status: 'healthy',
    uptime: 100,
    lastCheck: new Date(),
    errorCount24h: 0,
    url: 'neofolic.com',
    icon: <Shield className="h-5 w-5" />
  },
  {
    id: '5',
    name: 'n8n Automations',
    type: 'webhook',
    status: 'critical',
    uptime: 85.3,
    lastCheck: new Date(),
    responseTime: 2500,
    errorCount24h: 12,
    icon: <Webhook className="h-5 w-5" />
  },
  {
    id: '6',
    name: 'ClickUp Tasks',
    type: 'integration',
    status: 'healthy',
    uptime: 99.8,
    lastCheck: new Date(),
    responseTime: 180,
    errorCount24h: 0,
    icon: <CheckCircle2 className="h-5 w-5" />
  },
  {
    id: '7',
    name: 'SSL ibramec.com.br',
    type: 'domain',
    status: 'warning',
    uptime: 100,
    lastCheck: new Date(),
    errorCount24h: 0,
    url: 'ibramec.com.br',
    icon: <ShieldAlert className="h-5 w-5" />
  },
  {
    id: '8',
    name: 'Panda Video',
    type: 'api',
    status: 'healthy',
    uptime: 99.7,
    lastCheck: new Date(),
    responseTime: 320,
    errorCount24h: 1,
    icon: <Cloud className="h-5 w-5" />
  }
];

const mockAlerts: AlertLog[] = [
  {
    id: '1',
    systemId: '5',
    systemName: 'n8n Automations',
    severity: 'high',
    type: 'downtime',
    message: 'Sistema não responde há 15 minutos',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    resolved: false,
    notifiedVia: ['whatsapp']
  },
  {
    id: '2',
    systemId: '3',
    systemName: 'Zapier Workflows',
    severity: 'medium',
    type: 'slow_response',
    message: 'Tempo de resposta acima do limite (890ms > 500ms)',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    resolved: false,
    notifiedVia: ['whatsapp', 'email']
  },
  {
    id: '3',
    systemId: '7',
    systemName: 'SSL ibramec.com.br',
    severity: 'medium',
    type: 'ssl',
    message: 'Certificado SSL expira em 15 dias',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    resolved: false,
    notifiedVia: ['email']
  },
  {
    id: '4',
    systemId: '2',
    systemName: 'Kommo CRM',
    severity: 'low',
    type: 'error',
    message: 'Webhook retornou erro 429 (rate limit)',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    resolved: true
  }
];

// Status helpers
const getStatusConfig = (status: MonitoredSystem['status']) => {
  const configs = {
    healthy: { 
      label: 'Operacional', 
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      iconColor: 'text-green-500',
      icon: CheckCircle2
    },
    warning: { 
      label: 'Atenção', 
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      iconColor: 'text-amber-500',
      icon: AlertTriangle
    },
    critical: { 
      label: 'Crítico', 
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      iconColor: 'text-red-500',
      icon: XCircle
    },
    unknown: { 
      label: 'Desconhecido', 
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
      iconColor: 'text-slate-500',
      icon: WifiOff
    }
  };
  return configs[status];
};

const getSeverityConfig = (severity: AlertLog['severity']) => {
  const configs = {
    high: { 
      label: 'Alto', 
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      emoji: '🔥'
    },
    medium: { 
      label: 'Médio', 
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      emoji: '⚠️'
    },
    low: { 
      label: 'Baixo', 
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      emoji: 'ℹ️'
    }
  };
  return configs[severity];
};

const getAlertTypeLabel = (type: AlertLog['type']) => {
  const labels = {
    downtime: 'Indisponível',
    ssl: 'SSL',
    webhook_fail: 'Webhook Falhou',
    slow_response: 'Lento',
    error: 'Erro'
  };
  return labels[type];
};

export default function SystemSentinel() {
  const [systems] = useState<MonitoredSystem[]>(mockSystems);
  const [alerts] = useState<AlertLog[]>(mockAlerts);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Calculated stats
  const healthySystems = systems.filter(s => s.status === 'healthy').length;
  const warningSystems = systems.filter(s => s.status === 'warning').length;
  const criticalSystems = systems.filter(s => s.status === 'critical').length;
  const overallUptime = systems.reduce((acc, s) => acc + s.uptime, 0) / systems.length;
  const activeAlerts = alerts.filter(a => !a.resolved).length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const handleTestWhatsApp = () => {
    // Will integrate with Uazapi
    console.log('Testing WhatsApp alert...');
  };

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
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Atualizar
            </Button>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Sistema
            </Button>
          </div>
        </div>

        {/* Health Summary Banner */}
        <Card className={cn(
          "mb-6 border-l-4",
          criticalSystems > 0 ? "border-l-red-500 bg-red-50 dark:bg-red-950/20" :
          warningSystems > 0 ? "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20" :
          "border-l-green-500 bg-green-50 dark:bg-green-950/20"
        )}>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  criticalSystems > 0 ? "bg-red-100 dark:bg-red-900/50" :
                  warningSystems > 0 ? "bg-amber-100 dark:bg-amber-900/50" :
                  "bg-green-100 dark:bg-green-900/50"
                )}>
                  {criticalSystems > 0 ? (
                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  ) : warningSystems > 0 ? (
                    <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    {criticalSystems > 0 
                      ? `${criticalSystems} sistema${criticalSystems > 1 ? 's' : ''} em estado crítico`
                      : warningSystems > 0 
                        ? `${warningSystems} sistema${warningSystems > 1 ? 's' : ''} requer atenção`
                        : "Tudo funcionando perfeitamente 🚀"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {healthySystems} de {systems.length} sistemas operacionais • Uptime médio: {overallUptime.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>{healthySystems}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>{warningSystems}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span>{criticalSystems}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="dashboard" className="gap-1">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1 relative">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alertas</span>
              {activeAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {activeAlerts}
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
                      <p className="text-2xl font-bold">{overallUptime.toFixed(1)}%</p>
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
                      <p className="text-2xl font-bold">{systems.length}</p>
                      <p className="text-xs text-muted-foreground">Sistemas Monitorados</p>
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
                      <p className="text-2xl font-bold">{activeAlerts}</p>
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
                      <p className="text-2xl font-bold">24</p>
                      <p className="text-xs text-muted-foreground">Notificações/24h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Systems Grid */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Sistemas Monitorados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {systems.map((system) => {
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
                            system.status === 'unknown' && "bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400"
                          )}>
                            {system.icon}
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
                            <span className="font-medium">{system.uptime}%</span>
                          </div>
                          <Progress 
                            value={system.uptime} 
                            className={cn(
                              "h-1.5",
                              system.uptime >= 99 && "[&>div]:bg-green-500",
                              system.uptime >= 95 && system.uptime < 99 && "[&>div]:bg-amber-500",
                              system.uptime < 95 && "[&>div]:bg-red-500"
                            )}
                          />
                          
                          {system.responseTime && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Latência</span>
                              <span className={cn(
                                "font-medium",
                                system.responseTime > 500 && "text-amber-600 dark:text-amber-400",
                                system.responseTime > 1000 && "text-red-600 dark:text-red-400"
                              )}>
                                {system.responseTime}ms
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                            <span>Erros (24h): {system.errorCount24h}</span>
                            <span>Check: {format(system.lastCheck, 'HH:mm', { locale: ptBR })}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
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

            <div className="space-y-3">
              {alerts.map((alert) => {
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
                            <span className="font-medium">{alert.systemName}</span>
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
                            <span>{format(alert.timestamp, "dd/MM HH:mm", { locale: ptBR })}</span>
                            {alert.notifiedVia && alert.notifiedVia.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Send className="h-3 w-3" />
                                {alert.notifiedVia.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        {!alert.resolved && (
                          <Button variant="outline" size="sm">
                            Resolver
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
                  whatsappConnected 
                    ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/30"
                    : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/30"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      whatsappConnected ? "bg-green-100 dark:bg-green-900" : "bg-slate-100 dark:bg-slate-800"
                    )}>
                      {whatsappConnected ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Smartphone className="h-5 w-5 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {whatsappConnected ? "WhatsApp Conectado" : "WhatsApp Desconectado"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {whatsappConnected 
                          ? "Pronto para enviar alertas" 
                          : "Configure sua instância Uazapi para receber alertas"}
                      </p>
                    </div>
                    <Button 
                      variant={whatsappConnected ? "outline" : "default"}
                      onClick={() => setWhatsappConnected(!whatsappConnected)}
                    >
                      {whatsappConnected ? "Desconectar" : "Conectar"}
                    </Button>
                  </div>
                </div>

                {/* Configuration */}
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="uazapi-url">URL da Instância Uazapi</Label>
                    <Input 
                      id="uazapi-url" 
                      placeholder="https://sua-instancia.uazapi.com" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="uazapi-token">Token de Acesso</Label>
                    <Input 
                      id="uazapi-token" 
                      type="password"
                      placeholder="Seu token de autenticação" 
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
                    {[
                      { label: 'Alertas Críticos (🔥 Alto)', description: 'Sistema fora do ar, falhas graves', defaultOn: true },
                      { label: 'Alertas de Atenção (⚠️ Médio)', description: 'Lentidão, erros intermitentes', defaultOn: true },
                      { label: 'Alertas Informativos (ℹ️ Baixo)', description: 'Avisos gerais, SSL próximo de expirar', defaultOn: false },
                      { label: 'Resumo Diário', description: 'Enviar resumo às 8h', defaultOn: true },
                    ].map((pref, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                        <div>
                          <p className="font-medium text-sm">{pref.label}</p>
                          <p className="text-xs text-muted-foreground">{pref.description}</p>
                        </div>
                        <Switch defaultChecked={pref.defaultOn} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Test Button */}
                <div className="flex gap-3">
                  <Button onClick={handleTestWhatsApp} className="gap-2">
                    <Send className="h-4 w-4" />
                    Enviar Teste
                  </Button>
                  <Button variant="outline">
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
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
                        value="https://api.lovable.app/sentinel/webhook/abc123" 
                        className="text-xs"
                      />
                      <Button variant="outline" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use este endpoint para receber alertas de sistemas externos
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Conexões Ativas</h4>
                    <div className="space-y-2">
                      {['Zapier', 'n8n', 'ClickUp'].map((service) => (
                        <div key={service} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <span className="text-sm font-medium">{service}</span>
                          <Badge variant="outline" className="text-xs">Ativo</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Export Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Exportação & BI</CardTitle>
                  <CardDescription>Exporte dados para ferramentas de análise</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Chave de API</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="password"
                        value="sk-sentinel-xxxxxxxxxxxx" 
                        readOnly
                      />
                      <Button variant="outline" size="sm">Regenerar</Button>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t space-y-2">
                    <h4 className="font-medium mb-3">Exportar Para</h4>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Globe className="h-4 w-4" />
                      Power BI
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Globe className="h-4 w-4" />
                      Looker Studio
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Globe className="h-4 w-4" />
                      CSV/Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Monitoring Config */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Configurações de Monitoramento</CardTitle>
                  <CardDescription>Defina intervalos e limites de alerta</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="grid gap-2">
                      <Label>Intervalo de Verificação</Label>
                      <Input type="number" defaultValue={60} />
                      <p className="text-xs text-muted-foreground">Segundos entre cada check</p>
                    </div>
                    <div className="grid gap-2">
                      <Label>Limite de Latência (ms)</Label>
                      <Input type="number" defaultValue={500} />
                      <p className="text-xs text-muted-foreground">Alerta se ultrapassar</p>
                    </div>
                    <div className="grid gap-2">
                      <Label>Tentativas antes de Alerta</Label>
                      <Input type="number" defaultValue={3} />
                      <p className="text-xs text-muted-foreground">Falhas consecutivas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
}
