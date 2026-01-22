import { useState, useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameDay, isBefore, startOfDay } from 'date-fns';
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
  CalendarDays,
  GraduationCap,
  MapPin
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

// Upcoming courses data
const upcomingCourses = [
  { id: 'c1', title: 'Formação 360', city: 'São Paulo', startDate: '2026-01-23', endDate: '2026-01-25', status: 'confirmado' },
  { id: 'c2', title: 'Formação 360 + Brows Transplant 360', city: 'São Paulo', startDate: '2026-03-20', endDate: '2026-03-22', status: 'confirmado' },
  { id: 'c3', title: 'Formação 360 + Brows Transplant 360', city: 'São Paulo', startDate: '2026-05-22', endDate: '2026-05-24', status: 'confirmado' },
  { id: 'c4', title: 'Formação 360 + Brows Transplant 360', city: 'São Paulo', startDate: '2026-07-01', endDate: '2026-07-03', status: 'a_confirmar' },
  { id: 'c5', title: 'Formação 360 + Brows Transplant 360', city: 'São Paulo', startDate: '2026-09-01', endDate: '2026-09-03', status: 'a_confirmar' },
  { id: 'c6', title: 'Formação 360 + Brows Transplant 360', city: 'São Paulo', startDate: '2026-11-01', endDate: '2026-11-03', status: 'a_confirmar' },
];

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

  // Combine all upcoming events (sala tecnica + courses)
  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date());
    const events: Array<{
      id: string;
      type: 'sala_tecnica' | 'curso';
      title: string;
      date: Date;
      endDate?: Date;
      city?: string;
      status?: string;
      meeting?: SalaTecnicaMeeting;
    }> = [];

    meetings?.forEach(m => {
      const meetingDate = parseISO(m.meeting_date);
      if (!isBefore(meetingDate, today)) {
        events.push({
          id: m.id,
          type: 'sala_tecnica',
          title: 'Sala Técnica',
          date: meetingDate,
          meeting: m
        });
      }
    });

    upcomingCourses.forEach(c => {
      const courseDate = parseISO(c.startDate);
      if (!isBefore(courseDate, today)) {
        events.push({
          id: c.id,
          type: 'curso',
          title: c.title,
          date: courseDate,
          endDate: parseISO(c.endDate),
          city: c.city,
          status: c.status
        });
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 10);
  }, [meetings]);

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
                <CardTitle className="text-lg">Agenda</CardTitle>
                <CardDescription>Eventos, cursos e mentorias exclusivas</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center capitalize">
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
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {days.map(day => {
              const meeting = getMeetingForDay(day);
              const isThursday = getDay(day) === 4;
              const isPast = isBefore(day, startOfDay(new Date())) && !isToday(day);
              const todayHighlight = isToday(day);
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  disabled={!meeting}
                  className={cn(
                    "aspect-square p-1 rounded-lg text-sm transition-all relative",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20",
                    todayHighlight && "bg-primary text-primary-foreground font-bold ring-2 ring-primary ring-offset-2",
                    isPast && "opacity-40 text-muted-foreground",
                    meeting && !isPast && !todayHighlight && "bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer",
                    meeting && isPast && "bg-muted/30",
                    selectedMeeting && isSameDay(parseISO(selectedMeeting.meeting_date), day) && "ring-2 ring-amber-500",
                    !meeting && !todayHighlight && !isPast && "hover:bg-muted/50",
                    !meeting && "cursor-default"
                  )}
                >
                  <span className={cn(
                    "block text-center",
                    isThursday && !todayHighlight && !isPast && "text-amber-600 dark:text-amber-400 font-medium"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {meeting && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        todayHighlight ? "bg-primary-foreground" : "bg-amber-500"
                      )} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary" />
              <span>Hoje</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Sala Técnica</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events List */}
      <Card className="border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-500" />
            Próximos Eventos
          </CardTitle>
          <CardDescription>Agenda completa de atividades</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="space-y-1 p-4 pt-0">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum evento próximo
                </p>
              ) : (
                upcomingEvents.map(event => (
                  <div 
                    key={event.id}
                    onClick={() => event.meeting && setSelectedMeeting(event.meeting)}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      event.type === 'sala_tecnica' 
                        ? "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 cursor-pointer"
                        : "bg-emerald-500/5 border-emerald-500/20"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        event.type === 'sala_tecnica' ? "bg-amber-500/10" : "bg-emerald-500/10"
                      )}>
                        {event.type === 'sala_tecnica' ? (
                          <Video className="h-4 w-4 text-amber-500" />
                        ) : (
                          <GraduationCap className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(event.date, "d MMM", { locale: ptBR })}
                            {event.endDate && ` a ${format(event.endDate, "d MMM", { locale: ptBR })}`}
                          </span>
                        </div>
                        {event.city && (
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{event.city}</span>
                          </div>
                        )}
                        {event.status && (
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "mt-2 text-xs",
                              event.status === 'confirmado' 
                                ? "bg-emerald-500/10 text-emerald-600" 
                                : "bg-yellow-500/10 text-yellow-600"
                            )}
                          >
                            {event.status === 'confirmado' ? 'Data Confirmada' : 'A Confirmar'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Meeting details dialog */}
      {selectedMeeting && (
        <Card className="lg:col-span-3 border-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Video className="h-4 w-4 text-amber-500" />
              Detalhes da Reunião
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
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
              </div>

              <div className="space-y-2">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
