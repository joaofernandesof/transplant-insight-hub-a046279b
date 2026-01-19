import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Video, 
  Clock, 
  CheckCircle2, 
  X,
  Users,
  ExternalLink
} from 'lucide-react';
import { 
  useTodaysMeeting, 
  useUserConfirmation, 
  useConfirmMeeting,
  useMeetingConfirmations,
  useIsThursday
} from '@/hooks/useSalaTecnica';
import { cn } from '@/lib/utils';

interface SalaTecnicaNotificationProps {
  className?: string;
}

export function SalaTecnicaNotification({ className }: SalaTecnicaNotificationProps) {
  const [dismissed, setDismissed] = useState(false);
  const isThursday = useIsThursday();
  const { data: todaysMeeting, isLoading } = useTodaysMeeting();
  const { data: userConfirmation } = useUserConfirmation(todaysMeeting?.id);
  const { data: confirmations } = useMeetingConfirmations(todaysMeeting?.id);
  const confirmMeeting = useConfirmMeeting();

  // Check if notification was already dismissed today
  useEffect(() => {
    const dismissedDate = localStorage.getItem('sala-tecnica-dismissed');
    const today = new Date().toISOString().split('T')[0];
    if (dismissedDate === today) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('sala-tecnica-dismissed', today);
    setDismissed(true);
  };

  const handleConfirm = () => {
    if (todaysMeeting) {
      confirmMeeting.mutate(todaysMeeting.id);
    }
  };

  // Don't show if not Thursday, no meeting today, already dismissed, or loading
  if (!isThursday || !todaysMeeting || dismissed || isLoading) {
    return null;
  }

  return (
    <Card className={cn(
      "border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-amber-600/5",
      "animate-in slide-in-from-top-2 duration-500",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-amber-500/10 shrink-0">
            <Video className="h-6 w-6 text-amber-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-amber-700 dark:text-amber-300">
                  🎯 Sala Técnica Hoje!
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {todaysMeeting.title} - Mentoria semanal com os especialistas
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0 -mt-1 -mr-1 h-8 w-8"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{todaysMeeting.meeting_time.slice(0, 5)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{confirmations?.length || 0} confirmados</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              {userConfirmation ? (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg bg-emerald-500/10">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Presença confirmada</span>
                </div>
              ) : (
                <Button 
                  onClick={handleConfirm}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600"
                  disabled={confirmMeeting.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  {confirmMeeting.isPending ? 'Confirmando...' : 'Confirmar Presença'}
                </Button>
              )}

              {todaysMeeting.google_meet_link && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(todaysMeeting.google_meet_link!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  Entrar na Reunião
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
