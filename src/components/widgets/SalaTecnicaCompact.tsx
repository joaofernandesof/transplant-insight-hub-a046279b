import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Clock, ChevronRight, Users, CheckCircle2 } from 'lucide-react';
import { 
  useSalaTecnicaMeetings, 
  useUserConfirmation,
  useMeetingConfirmations,
  useConfirmMeeting,
  useIsLicensee 
} from '@/hooks/useSalaTecnica';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export function SalaTecnicaCompact() {
  const navigate = useNavigate();
  const isLicensee = useIsLicensee();
  const { data: meetings, isLoading } = useSalaTecnicaMeetings();
  
  const nextMeetings = meetings?.slice(0, 3) || [];
  const nextMeeting = nextMeetings[0];
  
  const { data: userConfirmation } = useUserConfirmation(nextMeeting?.id || '');
  const { data: confirmations } = useMeetingConfirmations(nextMeeting?.id || '');
  const confirmMeeting = useConfirmMeeting();

  // Admins can still see the widget when viewing dashboard for management purposes
  // The useIsLicensee now properly handles admin profile simulation

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-5">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleConfirm = (e: React.MouseEvent, meetingId: string) => {
    e.stopPropagation();
    confirmMeeting.mutate(meetingId);
  };

  return (
    <Card 
      className="h-full cursor-pointer transition-all hover:shadow-md group"
      onClick={() => navigate('/sala-tecnica')}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Video className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Agenda do Licenciado</h3>
              <p className="text-xs text-muted-foreground">Eventos e Mentorias</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        
        {nextMeetings.length > 0 ? (
          <div className="space-y-2">
            {nextMeetings.map((meeting, index) => {
              const isToday = meeting.meeting_date === new Date().toISOString().split('T')[0];
              const meetingDate = parseISO(meeting.meeting_date);
              
              return (
                <div 
                  key={meeting.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    isToday 
                      ? "border-amber-500/50 bg-amber-50 dark:bg-amber-900/20" 
                      : "border-border/50 bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{meeting.title}</span>
                        {isToday && (
                          <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">
                            Hoje
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(meetingDate, "d 'de' MMM", { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{meeting.meeting_time.slice(0, 5)}</span>
                        </div>
                        {index === 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>{confirmations?.length || 0} confirmados</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {index === 0 && (
                      userConfirmation ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => handleConfirm(e, meeting.id)}
                          disabled={confirmMeeting.isPending}
                          className="text-xs h-7 px-2"
                        >
                          Confirmar
                        </Button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhuma reunião agendada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
