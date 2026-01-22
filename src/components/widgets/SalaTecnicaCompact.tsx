import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Clock, ChevronRight } from 'lucide-react';
import { useSalaTecnicaMeetings, useIsLicensee } from '@/hooks/useSalaTecnica';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export function SalaTecnicaCompact() {
  const navigate = useNavigate();
  const isLicensee = useIsLicensee();
  const { data: meetings, isLoading } = useSalaTecnicaMeetings();
  
  const nextMeeting = meetings?.[0];

  if (!isLicensee) return null;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isToday = nextMeeting?.meeting_date === new Date().toISOString().split('T')[0];

  return (
    <Card 
      className={cn(
        "h-full cursor-pointer transition-all hover:shadow-md",
        isToday && "border-amber-500/50 bg-amber-500/5"
      )}
      onClick={() => navigate('/sala-tecnica')}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-lg",
              isToday ? "bg-amber-500/20" : "bg-amber-100 dark:bg-amber-900/30"
            )}>
              <Video className={cn(
                "h-4 w-4",
                isToday ? "text-amber-600" : "text-amber-500"
              )} />
            </div>
            <span className="font-medium text-sm">Sala Técnica</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        
        {nextMeeting ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium truncate flex-1">
                {nextMeeting.title}
              </span>
              {isToday && (
                <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">
                  Hoje
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(parseISO(nextMeeting.meeting_date), "d MMM", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{nextMeeting.meeting_time.slice(0, 5)}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhuma reunião agendada</p>
        )}
      </CardContent>
    </Card>
  );
}
