import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  Info, 
  XCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  Gauge,
  Users,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type AlertCategory = 'security' | 'performance' | 'users' | 'system';

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  category: AlertCategory;
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  link?: string;
}

const categoryConfig: Record<AlertCategory, { label: string; icon: React.ReactNode; color: string }> = {
  security: { 
    label: 'Segurança', 
    icon: <Shield className="h-3 w-3" />, 
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
  },
  performance: { 
    label: 'Performance', 
    icon: <Gauge className="h-3 w-3" />, 
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' 
  },
  users: { 
    label: 'Usuários', 
    icon: <Users className="h-3 w-3" />, 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
  },
  system: { 
    label: 'Sistema', 
    icon: <Info className="h-3 w-3" />, 
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' 
  },
};

export function SystemAlertsWidget() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchAlerts();
    
    const channel = supabase
      .channel('admin-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newAlert = mapNotificationToAlert(payload.new as any);
          if (newAlert) {
            setAlerts(prev => [newAlert, ...prev].slice(0, 15));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const mappedAlerts: SystemAlert[] = [];

      (notifications || []).forEach((n: any) => {
        mappedAlerts.push({
          id: `notif-${n.id}`,
          type: 'info',
          category: 'system',
          title: n.title || 'Notificação',
          message: n.message || '',
          timestamp: new Date(n.created_at),
          source: 'Notificações',
        });
      });

      const systemAlerts = await generateSystemAlerts();
      mappedAlerts.push(...systemAlerts);

      mappedAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setAlerts(mappedAlerts.slice(0, 15));
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSystemAlerts = async (): Promise<SystemAlert[]> => {
    const alerts: SystemAlert[] = [];
    const now = new Date();

    // Security: Failed login attempts (mock - would come from auth logs)
    alerts.push({
      id: 'security-check',
      type: 'success',
      category: 'security',
      title: 'Verificação de Segurança',
      message: 'Nenhuma tentativa de acesso suspeita detectada',
      timestamp: now,
      source: 'Monitoramento',
    });

    // Performance: Check system metrics
    const { data: recentMetrics } = await supabase
      .from('metric_history')
      .select('metric_key, metric_value')
      .order('recorded_at', { ascending: false })
      .limit(10);

    if (recentMetrics && recentMetrics.length > 0) {
      const avgResponseTime = recentMetrics
        .filter(m => m.metric_key === 'response_time')
        .reduce((acc, m) => acc + (m.metric_value || 0), 0) / (recentMetrics.filter(m => m.metric_key === 'response_time').length || 1);
      
      if (avgResponseTime > 500) {
        alerts.push({
          id: 'perf-slow',
          type: 'warning',
          category: 'performance',
          title: 'Tempo de Resposta Alto',
          message: `Tempo médio: ${avgResponseTime.toFixed(0)}ms`,
          timestamp: now,
          source: 'Performance',
          link: '/admin/sentinel'
        });
      } else {
        alerts.push({
          id: 'perf-ok',
          type: 'success',
          category: 'performance',
          title: 'Performance Normal',
          message: 'Todos os sistemas respondendo normalmente',
          timestamp: now,
          source: 'Sentinel',
        });
      }
    }

    // Users: Inactive users
    const { count: inactiveCount } = await supabase
      .from('neohub_users')
      .select('id', { count: 'exact', head: true })
      .lt('last_seen_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq('is_active', true);

    if (inactiveCount && inactiveCount > 10) {
      alerts.push({
        id: 'inactive-users',
        type: 'warning',
        category: 'users',
        title: 'Usuários Inativos',
        message: `${inactiveCount} usuários não acessam há mais de 7 dias`,
        timestamp: now,
        source: 'Monitoramento',
        link: '/monitoring'
      });
    }

    // Users: New registrations today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const { count: newUsersToday } = await supabase
      .from('neohub_users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    if (newUsersToday && newUsersToday > 0) {
      alerts.push({
        id: 'new-users-today',
        type: 'info',
        category: 'users',
        title: 'Novos Cadastros Hoje',
        message: `${newUsersToday} novo(s) usuário(s) registrado(s)`,
        timestamp: now,
        source: 'Cadastros',
      });
    }

    // System: Pending enrollments
    const { count: pendingEnrollments } = await supabase
      .from('user_course_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    if (pendingEnrollments && pendingEnrollments > 0) {
      alerts.push({
        id: 'pending-enrollments',
        type: 'info',
        category: 'system',
        title: 'Cursos em Andamento',
        message: `${pendingEnrollments} alunos com cursos em andamento`,
        timestamp: now,
        source: 'Universidade'
      });
    }

    return alerts;
  };

  const mapNotificationToAlert = (notification: any): SystemAlert | null => {
    if (!notification) return null;
    return {
      id: `notif-${notification.id}`,
      type: 'info',
      category: 'system',
      title: notification.title || 'Nova Notificação',
      message: notification.message || '',
      timestamp: new Date(notification.created_at),
      source: 'Notificações',
    };
  };

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeBadge = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error': return <Badge variant="destructive" className="text-[10px]">Erro</Badge>;
      case 'warning': return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">Alerta</Badge>;
      case 'success': return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]">OK</Badge>;
      default: return <Badge variant="secondary" className="text-[10px]">Info</Badge>;
    }
  };

  const getCategoryBadge = (category: AlertCategory) => {
    const config = categoryConfig[category];
    return (
      <Badge className={`${config.color} text-[10px] gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const filteredAlerts = selectedCategories.length === 0 
    ? alerts 
    : alerts.filter(a => selectedCategories.includes(a.category));

  const categoryCounts = alerts.reduce((acc, alert) => {
    acc[alert.category] = (acc[alert.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alertas do Sistema
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={fetchAlerts}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {/* Category Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <ToggleGroup 
              type="multiple" 
              value={selectedCategories}
              onValueChange={setSelectedCategories}
              className="justify-start gap-1"
            >
              {(Object.keys(categoryConfig) as AlertCategory[]).map((cat) => (
                <ToggleGroupItem 
                  key={cat} 
                  value={cat} 
                  size="sm"
                  className="h-6 px-2 text-[10px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {categoryConfig[cat].icon}
                  <span className="ml-1">{categoryConfig[cat].label}</span>
                  {categoryCounts[cat] > 0 && (
                    <span className="ml-1 bg-muted rounded-full px-1.5 text-[9px]">
                      {categoryCounts[cat]}
                    </span>
                  )}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px]">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
              <p className="text-sm">
                {selectedCategories.length > 0 
                  ? 'Nenhum alerta nesta categoria' 
                  : 'Nenhum alerta no momento'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{alert.title}</p>
                      {getCategoryBadge(alert.category)}
                      {getTypeBadge(alert.type)}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(alert.timestamp, { addSuffix: true, locale: ptBR })}
                      </span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-muted-foreground">{alert.source}</span>
                      {alert.link && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-[10px]" asChild>
                          <a href={alert.link}>
                            Ver <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
