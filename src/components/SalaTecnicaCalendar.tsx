import { useState } from 'react';
import { format, parseISO, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Video, 
  Users, 
  Clock, 
  CheckCircle2,
  ExternalLink,
  CalendarDays
} from 'lucide-react';
import { 
  useSalaTecnicaMeetings, 
  useUserConfirmation, 
  useConfirmMeeting,
  useMeetingConfirmations,
  SalaTecnicaMeeting
} from '@/hooks/useSalaTecnica';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function SalaTecnicaCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedMeeting, setSelectedMeeting] = useState<SalaTecnicaMeeting | null>(null);
  
  const { data: meetings, isLoading } = useSalaTecnicaMeetings();
  const { data: userConfirmation } = useUserConfirmation(selectedMeeting?.id);
  const { data: confirmations } = useMeetingConfirmations(selectedMeeting?.id);
  const confirmMeeting = useConfirmMeeting();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startingDayOfWeek = getDay(monthStart);

  const getMeetingForDay = (day: Date) => {
    return meetings?.find(m => isSameDay(parseISO(m.meeting_date), day));
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDayClick = (day: Date) => {
    const meeting = getMeetingForDay(day);
    if (meeting) {
      setSelectedMeeting(meeting);
    }
  };

  const handleConfirm = () => {
    if (selectedMeeting) {
      confirmMeeting.mutate(selectedMeeting.id);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-primary/10">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendar */}
      <Card className="lg:col-span-2 border-primary/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <CalendarDays className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Sala Técnica</CardTitle>
                <CardDescription>Mentoria semanal às quintas-feiras</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month start */}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {/* Days of the month */}
            {days.map(day => {
              const meeting = getMeetingForDay(day);
              const isThursday = getDay(day) === 4;
              const isPast = day < new Date() && !isToday(day);
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  disabled={!meeting}
                  className={cn(
                    "aspect-square p-1 rounded-lg text-sm transition-all relative",
                    "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                    isToday(day) && "bg-primary/10 font-bold",
                    meeting && !isPast && "bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer",
                    meeting && isPast && "bg-muted/30 opacity-60",
                    selectedMeeting && isSameDay(parseISO(selectedMeeting.meeting_date), day) && 
                      "ring-2 ring-amber-500",
                    !meeting && "cursor-default"
                  )}
                >
                  <span className={cn(
                    "block text-center",
                    isThursday && "text-amber-600 dark:text-amber-400 font-medium"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {meeting && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Sala Técnica agendada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Hoje</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meeting details */}
      <Card className="border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="h-4 w-4 text-amber-500" />
            Detalhes da Reunião
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedMeeting ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedMeeting.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedMeeting.description}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(parseISO(selectedMeeting.meeting_date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {selectedMeeting.meeting_time.slice(0, 5)} ({selectedMeeting.duration_minutes} min)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{confirmations?.length || 0} confirmados</span>
                </div>
              </div>

              {selectedMeeting.mentor_names && selectedMeeting.mentor_names.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Mentores</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedMeeting.mentor_names.map(mentor => (
                      <Badge key={mentor} variant="secondary" className="text-xs">
                        {mentor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-2">
                {userConfirmation ? (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-medium">Presença confirmada!</span>
                  </div>
                ) : (
                  <Button 
                    onClick={handleConfirm} 
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    disabled={confirmMeeting.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {confirmMeeting.isPending ? 'Confirmando...' : 'Confirmar Presença'}
                  </Button>
                )}

                {selectedMeeting.google_meet_link && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(selectedMeeting.google_meet_link!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Google Meet
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Selecione uma data com reunião para ver os detalhes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
