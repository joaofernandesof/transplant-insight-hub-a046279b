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
  SalaTecnicaMeeting,
  useIsLicensee
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
      "p-2.5 rounded-md border transition-all",
      isToday 
        ? "border-amber-500/30 bg-amber-500/5" 
        : "border-border/50 hover:border-border"
    )}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-md shrink-0",
            isToday ? "bg-amber-500/20" : "bg-muted"
          )}>
            <Video className={cn(
              "h-3.5 w-3.5",
              isToday ? "text-amber-500" : "text-muted-foreground"
            )} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-medium text-xs truncate">{meeting.title}</h4>
              {isToday && (
                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] px-1.5 py-0">
                  Hoje
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-0.5">
                <Calendar className="h-2.5 w-2.5" />
                <span>{format(meetingDate, "d 'de' MMM", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                <span>{meeting.meeting_time.slice(0, 5)}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Users className="h-2.5 w-2.5" />
                <span>{confirmations?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
        
        {userConfirmation ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        ) : (
          <Button 
            size="sm" 
            variant="ghost"
            onClick={handleConfirm}
            disabled={confirmMeeting.isPending}
            className="text-[10px] h-6 px-2"
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
  const isLicensee = useIsLicensee();
  const { data: meetings, isLoading } = useSalaTecnicaMeetings();
  
  const displayMeetings = meetings?.slice(0, limit) || [];

  // Don't render for non-licensees
  if (!isLicensee) {
    return null;
  }

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
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Video className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-sm">Sala Técnica</CardTitle>
              <CardDescription className="text-xs">Mentorias semanais</CardDescription>
            </div>
          </div>
          {showViewAll && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[10px] h-6 px-2"
              onClick={() => navigate('/sala-tecnica')}
            >
              Ver Calendário
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {displayMeetings.length > 0 ? (
          <div className="space-y-1.5">
            {displayMeetings.map(meeting => (
              <MeetingItem key={meeting.id} meeting={meeting} />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Nenhuma reunião agendada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
