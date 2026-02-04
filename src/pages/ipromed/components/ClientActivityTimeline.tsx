/**
 * Linha do Tempo de Atividades do Cliente
 * Exibe histórico completo de todas as interações e ações
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  FileSignature,
  FileText,
  Edit,
  MessageSquare,
  Scale,
  DollarSign,
  Upload,
  Download,
  User,
  CheckCircle,
  Clock,
  Video,
  Mail,
  Phone,
  Plus,
  History,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ClientActivity {
  id: string;
  client_id: string;
  activity_type: string;
  action: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  reference_type?: string;
  reference_id?: string;
  created_by?: string;
  created_at: string;
}

const activityIcons: Record<string, React.ElementType> = {
  meeting: Video,
  contract: FileSignature,
  document: FileText,
  edit: Edit,
  note: MessageSquare,
  process: Scale,
  payment: DollarSign,
  communication: Mail,
  upload: Upload,
  download: Download,
  user: User,
};

const activityColors: Record<string, string> = {
  meeting: "bg-primary text-primary-foreground",
  contract: "bg-emerald-500 text-white",
  document: "bg-blue-500 text-white",
  edit: "bg-amber-500 text-white",
  note: "bg-purple-500 text-white",
  process: "bg-rose-500 text-white",
  payment: "bg-green-500 text-white",
  communication: "bg-cyan-500 text-white",
  upload: "bg-indigo-500 text-white",
  download: "bg-slate-500 text-white",
};

const actionLabels: Record<string, string> = {
  created: "Criado",
  updated: "Atualizado",
  deleted: "Removido",
  signed: "Assinado",
  sent: "Enviado",
  received: "Recebido",
  scheduled: "Agendado",
  completed: "Concluído",
  cancelled: "Cancelado",
  uploaded: "Enviado",
  downloaded: "Baixado",
};

interface ClientActivityTimelineProps {
  clientId: string;
  maxItems?: number;
  showHeader?: boolean;
}

export function ClientActivityTimeline({ 
  clientId, 
  maxItems,
  showHeader = true,
}: ClientActivityTimelineProps) {
  const { data: activities = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['ipromed-client-activities', clientId],
    queryFn: async () => {
      let query = supabase
        .from('ipromed_client_activities' as any)
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (maxItems) {
        query = query.limit(maxItems);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as ClientActivity[];
    },
    enabled: !!clientId,
  });

  // Group activities by date
  const groupedActivities = activities.reduce((acc, activity) => {
    const date = format(new Date(activity.created_at), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, ClientActivity[]>);

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Hoje';
    }
    if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Ontem';
    }
    return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
              <History className="h-4 w-4" />
              Linha do Tempo
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
              <History className="h-4 w-4" />
              Linha do Tempo
            </CardTitle>
            <CardDescription>
              Histórico completo de atividades
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            {isRefetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
      )}
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
            <p className="text-muted-foreground">Nenhuma atividade registrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              As atividades aparecerão aqui conforme você interagir com o cliente
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {Object.entries(groupedActivities).map(([date, dayActivities]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground capitalize">
                      {formatDateLabel(date)}
                    </span>
                  </div>

                  {/* Activities */}
                  <div className="relative pl-6 border-l-2 border-muted space-y-4">
                    {dayActivities.map((activity) => {
                      const Icon = activityIcons[activity.activity_type] || Clock;
                      const colorClass = activityColors[activity.activity_type] || "bg-muted text-muted-foreground";
                      
                      return (
                        <div key={activity.id} className="relative">
                          {/* Timeline dot */}
                          <div className={cn(
                            "absolute -left-[25px] w-4 h-4 rounded-full flex items-center justify-center",
                            colorClass
                          )}>
                            <Icon className="h-2.5 w-2.5" />
                          </div>

                          {/* Activity content */}
                          <div className="bg-muted/30 rounded-lg p-3 ml-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {activity.title}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {actionLabels[activity.action] || activity.action}
                                  </Badge>
                                </div>
                                {activity.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {activity.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {format(new Date(activity.created_at), "HH:mm")}
                              </span>
                            </div>

                            {/* Metadata preview */}
                            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                              <div className="mt-2 pt-2 border-t border-muted flex flex-wrap gap-1">
                                {Object.entries(activity.metadata).slice(0, 3).map(([key, value]) => (
                                  <Badge key={key} variant="secondary" className="text-[10px]">
                                    {key}: {String(value).substring(0, 20)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to log activities
export async function logClientActivity(
  clientId: string,
  activityType: string,
  action: string,
  title: string,
  options?: {
    description?: string;
    metadata?: Record<string, any>;
    referenceType?: string;
    referenceId?: string;
  }
) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    await supabase
      .from('ipromed_client_activities' as any)
      .insert({
        client_id: clientId,
        activity_type: activityType,
        action,
        title,
        description: options?.description,
        metadata: options?.metadata || {},
        reference_type: options?.referenceType,
        reference_id: options?.referenceId,
        created_by: userData.user?.id,
      });
  } catch (error) {
    console.error('Error logging client activity:', error);
  }
}
