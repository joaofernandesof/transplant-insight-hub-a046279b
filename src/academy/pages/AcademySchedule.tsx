import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { GlobalBreadcrumb } from "@/components/GlobalBreadcrumb";
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  GraduationCap,
  Users,
  Video,
  CalendarDays
} from "lucide-react";
import { format, isPast, isFuture, isToday, parseISO, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ScheduleEvent {
  id: string;
  title: string;
  courseName: string;
  courseType: 'presencial' | 'online';
  startDate: string | null;
  endDate: string | null;
  city: string | null;
  state: string | null;
  status: 'confirmed' | 'pending' | 'completed';
  description?: string;
  duration?: string;
}

// Mock data - in production this would come from database based on student's enrollment
const mockSchedule: ScheduleEvent[] = [
  {
    id: '1',
    title: 'Formação 360° - Turma Janeiro/2026',
    courseName: 'Formação 360°',
    courseType: 'presencial',
    startDate: '2026-01-20',
    endDate: '2026-01-25',
    city: 'São Paulo',
    state: 'SP',
    status: 'confirmed',
    description: 'Imersão completa de transplante capilar',
    duration: '60h'
  },
  {
    id: '2',
    title: 'Mentoria em Grupo - Módulo 2',
    courseName: 'Conecta Capilar',
    courseType: 'online',
    startDate: '2026-01-30',
    endDate: '2026-01-30',
    city: null,
    state: null,
    status: 'confirmed',
    description: 'Mentoria ao vivo sobre técnicas avançadas',
    duration: '2h'
  },
  {
    id: '3',
    title: 'Fellowship Avançado - Turma Março/2026',
    courseName: 'Fellowship',
    courseType: 'presencial',
    startDate: null,
    endDate: null,
    city: 'Fortaleza',
    state: 'CE',
    status: 'pending',
    description: 'Aprofundamento em técnicas FUE/FUT',
    duration: '180h'
  },
  {
    id: '4',
    title: 'Instrumentador de Elite - Dezembro/2025',
    courseName: 'Instrumentador de Elite',
    courseType: 'presencial',
    startDate: '2025-12-15',
    endDate: '2025-12-20',
    city: 'São Paulo',
    state: 'SP',
    status: 'completed',
    description: 'Curso prático de instrumentação cirúrgica',
    duration: '40h'
  },
  {
    id: '5',
    title: 'Webinar: Tendências 2026',
    courseName: 'Conecta Capilar',
    courseType: 'online',
    startDate: '2026-02-10',
    endDate: '2026-02-10',
    city: null,
    state: null,
    status: 'confirmed',
    description: 'Panorama do mercado de transplante capilar',
    duration: '1h30'
  }
];

function getEventStatus(event: ScheduleEvent): { label: string; color: string; icon: React.ReactNode } {
  if (event.status === 'completed') {
    return {
      label: 'Concluído',
      color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
      icon: <CheckCircle2 className="h-4 w-4" />
    };
  }
  
  if (event.status === 'pending' || !event.startDate) {
    return {
      label: 'A Definir',
      color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-700',
      icon: <AlertCircle className="h-4 w-4" />
    };
  }
  
  const startDate = parseISO(event.startDate);
  
  if (isPast(startDate)) {
    return {
      label: 'Em Andamento',
      color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-700',
      icon: <Clock className="h-4 w-4" />
    };
  }
  
  return {
    label: 'Confirmado',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-700',
    icon: <CheckCircle2 className="h-4 w-4" />
  };
}

function formatDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate) return 'Data a definir';
  
  const start = parseISO(startDate);
  const formattedStart = format(start, "dd 'de' MMMM", { locale: ptBR });
  
  if (!endDate || startDate === endDate) {
    return `${formattedStart}, ${format(start, 'yyyy')}`;
  }
  
  const end = parseISO(endDate);
  const formattedEnd = format(end, "dd 'de' MMMM", { locale: ptBR });
  
  return `${formattedStart} a ${formattedEnd}, ${format(end, 'yyyy')}`;
}

function ScheduleCard({ event }: { event: ScheduleEvent }) {
  const status = getEventStatus(event);
  const isPresencial = event.courseType === 'presencial';
  
  return (
    <Card className={`transition-all duration-200 hover:shadow-lg ${
      event.status === 'completed' ? 'opacity-70' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isPresencial 
              ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
              : 'bg-gradient-to-br from-blue-500 to-indigo-600'
          }`}>
            {isPresencial ? (
              <GraduationCap className="h-6 w-6 text-white" />
            ) : (
              <Video className="h-6 w-6 text-white" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-base">{event.title}</h3>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </div>
              <Badge className={`flex-shrink-0 ${status.color}`}>
                {status.icon}
                <span className="ml-1">{status.label}</span>
              </Badge>
            </div>
            
            {/* Details */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDateRange(event.startDate, event.endDate)}</span>
              </div>
              
              {event.city && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{event.city}, {event.state}</span>
                </div>
              )}
              
              {event.duration && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{event.duration}</span>
                </div>
              )}
              
              <Badge variant="outline" className="text-xs">
                {isPresencial ? 'Presencial' : 'Online'}
              </Badge>
            </div>
          </div>
          
          {/* Action */}
          {event.status !== 'completed' && (
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AcademySchedule() {
  const { user } = useUnifiedAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Filter events based on tab
  const upcomingEvents = mockSchedule.filter(e => 
    e.status !== 'completed' && (e.status === 'pending' || (e.startDate && isFuture(parseISO(e.startDate))))
  );
  const pastEvents = mockSchedule.filter(e => {
    if (e.status === 'completed') return true;
    if (e.status === 'pending') return false;
    return e.startDate && isPast(parseISO(e.startDate));
  });
  const allEvents = mockSchedule;
  
  // Next event
  const nextEvent = upcomingEvents.find(e => e.startDate && e.status === 'confirmed');
  
  // Calculate days until next event
  const daysUntilNext = nextEvent?.startDate 
    ? Math.ceil((parseISO(nextEvent.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="px-4 py-4">
          <div className="pl-12 lg:pl-0">
            <GlobalBreadcrumb />
            <h1 className="text-xl font-bold flex items-center gap-2 mt-2">
              <CalendarDays className="h-5 w-5 text-emerald-600" />
              Agenda do Aluno
            </h1>
            <p className="text-sm text-muted-foreground">
              Sua próxima turma começa em breve. Acompanhe suas datas aqui.
            </p>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-6 space-y-6">
        {/* Next Event Highlight */}
        {nextEvent && (
          <Card className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 dark:border-emerald-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Próximo Evento</p>
                  <h3 className="text-lg font-bold">{nextEvent.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>{formatDateRange(nextEvent.startDate, nextEvent.endDate)}</span>
                    {nextEvent.city && (
                      <>
                        <span>•</span>
                        <span>{nextEvent.city}, {nextEvent.state}</span>
                      </>
                    )}
                  </div>
                </div>
                {daysUntilNext !== null && daysUntilNext > 0 && (
                  <div className="text-right">
                    <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{daysUntilNext}</div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500">dias restantes</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {mockSchedule.filter(e => e.status === 'confirmed').length}
                </div>
                <p className="text-xs text-muted-foreground">Confirmados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {mockSchedule.filter(e => e.status === 'pending').length}
                </div>
                <p className="text-xs text-muted-foreground">A Definir</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {mockSchedule.filter(e => e.status === 'completed').length}
                </div>
                <p className="text-xs text-muted-foreground">Concluídos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-emerald-50 dark:bg-emerald-950/30">
            <TabsTrigger value="upcoming" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900">
              <Calendar className="h-4 w-4" />
              Próximos ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900">
              <CheckCircle2 className="h-4 w-4" />
              Passados ({pastEvents.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900">
              <CalendarDays className="h-4 w-4" />
              Todos ({allEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4 space-y-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(event => (
                <ScheduleCard key={event.id} event={event} />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Nenhum evento próximo</p>
                <p className="text-sm">Seus próximos eventos aparecerão aqui.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4 space-y-4">
            {pastEvents.length > 0 ? (
              pastEvents.map(event => (
                <ScheduleCard key={event.id} event={event} />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Nenhum evento passado</p>
                <p className="text-sm">Eventos concluídos aparecerão aqui.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-4 space-y-4">
            {allEvents.map(event => (
              <ScheduleCard key={event.id} event={event} />
            ))}
          </TabsContent>
        </Tabs>

        {/* Help Card */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">Sem data definida?</p>
                <p className="text-sm text-muted-foreground">
                  Eventos marcados como "A Definir" serão atualizados assim que as datas forem confirmadas pela equipe IBRAMEC.
                  Você receberá uma notificação quando isso acontecer.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
