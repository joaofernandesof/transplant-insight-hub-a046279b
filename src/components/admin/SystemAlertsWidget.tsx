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
  ExternalLink
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  link?: string;
}

export function SystemAlertsWidget() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    
    // Real-time subscription for new notifications
    const channel = supabase
      .channel('admin-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newAlert = mapNotificationToAlert(payload.new as any);
          if (newAlert) {
            setAlerts(prev => [newAlert, ...prev].slice(0, 10));
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
      // Fetch recent system events from notifications
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const mappedAlerts: SystemAlert[] = [];

      // Map notifications
      (notifications || []).forEach((n: any) => {
        mappedAlerts.push({
          id: `notif-${n.id}`,
          type: 'info',
          title: n.title || 'Notificação',
          message: n.message || '',
          timestamp: new Date(n.created_at),
          source: 'Notificações',
        });
      });

      // Add system-generated alerts based on metrics
      const systemAlerts = await generateSystemAlerts();
      mappedAlerts.push(...systemAlerts);

      // Sort by timestamp and take latest 10
      mappedAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setAlerts(mappedAlerts.slice(0, 10));
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSystemAlerts = async (): Promise<SystemAlert[]> => {
    const alerts: SystemAlert[] = [];
    const now = new Date();

    // Check for inactive users
    const { count: inactiveCount } = await supabase
      .from('neohub_users')
      .select('id', { count: 'exact', head: true })
      .lt('last_seen_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq('is_active', true);

    if (inactiveCount && inactiveCount > 10) {
      alerts.push({
        id: 'inactive-users',
        type: 'warning',
        title: 'Usuários Inativos',
        message: `${inactiveCount} usuários não acessam há mais de 7 dias`,
        timestamp: now,
        source: 'Sistema',
        link: '/monitoring'
      });
    }

    // Check for pending enrollments
    const { count: pendingEnrollments } = await supabase
      .from('user_course_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    if (pendingEnrollments && pendingEnrollments > 0) {
      alerts.push({
        id: 'pending-enrollments',
        type: 'info',
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

  const getAlertBadge = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error': return <Badge variant="destructive" className="text-[10px]">Erro</Badge>;
      case 'warning': return <Badge className="bg-amber-100 text-amber-700 text-[10px]">Alerta</Badge>;
      case 'success': return <Badge className="bg-green-100 text-green-700 text-[10px]">OK</Badge>;
      default: return <Badge variant="secondary" className="text-[10px]">Info</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
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
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px]">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
              <p className="text-sm">Nenhum alerta no momento</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{alert.title}</p>
                      {getAlertBadge(alert.type)}
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
