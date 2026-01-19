import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Video, 
  Clock, 
  CheckCircle2,
  Calendar,
  Users,
  ChevronRight
} from 'lucide-react';
import { 
  useSalaTecnicaMeetings, 
  useUserConfirmation, 
  useConfirmMeeting,
  useMeetingConfirmations,
  SalaTecnicaMeeting
} from '@/hooks/useSalaTecnica';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface MeetingItemProps {
  meeting: SalaTecnicaMeeting;
}

function MeetingItem({ meeting }: MeetingItemProps) {
  const { data: userConfirmation } = useUserConfirmation(meeting.id);
  const { data: confirmations } = useMeetingConfirmations(meeting.id);
  const confirmMeeting = useConfirmMeeting();

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    confirmMeeting.mutate(meeting.id);
  };

  const isToday = meeting.meeting_date === new Date().toISOString().split('T')[0];
  const meetingDate = parseISO(meeting.meeting_date);

  return (
    <div className={cn(
      "p-4 rounded-lg border transition-all",
      isToday 
        ? "border-amber-500/30 bg-amber-500/5" 
        : "border-border/50 hover:border-border"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg shrink-0",
            isToday ? "bg-amber-500/20" : "bg-muted"
          )}>
            <Video className={cn(
              "h-4 w-4",
              isToday ? "text-amber-500" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">{meeting.title}</h4>
              {isToday && (
                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                  Hoje
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(meetingDate, "d 'de' MMM", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{meeting.meeting_time.slice(0, 5)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{confirmations?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
        
        {userConfirmation ? (
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        ) : (
          <Button 
            size="sm" 
            variant="ghost"
            onClick={handleConfirm}
            disabled={confirmMeeting.isPending}
            className="text-xs h-7"
          >
            Confirmar
          </Button>
        )}
      </div>
    </div>
  );
}

interface SalaTecnicaUpcomingProps {
  limit?: number;
  showViewAll?: boolean;
  className?: string;
}

export function SalaTecnicaUpcoming({ limit = 4, showViewAll = true, className }: SalaTecnicaUpcomingProps) {
  const navigate = useNavigate();
  const { data: meetings, isLoading } = useSalaTecnicaMeetings();
  
  const displayMeetings = meetings?.slice(0, limit) || [];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-primary/10", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Video className="h-4 w-4 text-amber-500" />
              Sala Técnica
            </CardTitle>
            <CardDescription>Próximas mentorias semanais</CardDescription>
          </div>
          {showViewAll && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => navigate('/sala-tecnica')}
            >
              Ver Calendário
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayMeetings.length > 0 ? (
          <div className="space-y-3">
            {displayMeetings.map(meeting => (
              <MeetingItem key={meeting.id} meeting={meeting} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhuma reunião agendada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
