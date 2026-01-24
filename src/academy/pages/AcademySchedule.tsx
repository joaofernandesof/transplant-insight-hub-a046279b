import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { useAcademyEnrollments } from "@/academy/hooks/useAcademyEnrollments";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  GraduationCap,
  CalendarDays
} from "lucide-react";
import { format, isPast, isFuture, parseISO, differenceInDays, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

function getEventStatus(startDate: string | null, endDate: string | null, classStatus: string): { label: string; color: string; icon: React.ReactNode } {
  // If class status is completed
  if (classStatus === 'completed' || classStatus === 'concluída') {
    return {
      label: 'Concluído',
      color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
      icon: <CheckCircle2 className="h-4 w-4" />
    };
  }
  
  // No date defined
  if (!startDate) {
    return {
      label: 'Data a Confirmar',
      color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-700',
      icon: <AlertCircle className="h-4 w-4" />
    };
  }
  
  const start = parseISO(startDate);
  const end = endDate ? parseISO(endDate) : start;
  const today = new Date();
  
  // Ongoing - between start and end date
  if ((isPast(start) || isToday(start)) && (isFuture(end) || isToday(end))) {
    return {
      label: 'Em Andamento',
      color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-400 dark:border-green-700',
      icon: <Clock className="h-4 w-4" />
    };
  }
  
  // Past event
  if (isPast(end)) {
    return {
      label: 'Concluído',
      color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
      icon: <CheckCircle2 className="h-4 w-4" />
    };
  }
  
  // Future event - confirmed
  return {
    label: 'Data Confirmada',
    color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-700',
    icon: <CheckCircle2 className="h-4 w-4" />
  };
}

function formatDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate) return 'Data a definir';
  
  const start = parseISO(startDate);
  const formattedStart = format(start, "dd/MM", { locale: ptBR });
  
  if (!endDate || startDate === endDate) {
    return `${formattedStart}/${format(start, 'yyyy')}`;
  }
  
  const end = parseISO(endDate);
  const formattedEnd = format(end, "dd/MM", { locale: ptBR });
  
  return `${formattedStart} a ${formattedEnd}/${format(end, 'yyyy')}`;
}

interface PresentialCourse {
  id: string;
  classId: string;
  name: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  city: string | null;
  state: string | null;
  status: 'confirmed' | 'pending' | 'completed' | 'in_progress';
  type?: 'formacao360' | 'instrumentador' | 'fellowship' | 'licenca' | 'monitor' | 'brows';
}

// Get gradient color based on course type
function getCourseGradient(courseName: string): string {
  const name = courseName.toLowerCase();
  if (name.includes("brows")) return "from-zinc-700 to-zinc-900";
  if (name.includes("fellowship")) return "from-purple-500 to-violet-600";
  if (name.includes("instrumentador")) return "from-blue-500 to-indigo-600";
  if (name.includes("licença") || name.includes("licenca")) return "from-amber-500 to-orange-600";
  if (name.includes("monitor")) return "from-pink-500 to-rose-600";
  return "from-emerald-500 to-green-600"; // Default for Formação 360
}

function ScheduleCard({ classData, onClick }: { classData: PresentialCourse; onClick: () => void }) {
  const status = getEventStatus(classData.startDate, classData.endDate, classData.status);
  const gradientColor = getCourseGradient(classData.name);
  
  // Extract city from location
  const city = classData.city || 'São Paulo';
  
  return (
    <Card className={`transition-all duration-200 hover:shadow-lg cursor-pointer ${
      status.label === 'Concluído' ? 'opacity-70' : ''
    }`} onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon */}
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${gradientColor}`}>
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm sm:text-base">{classData.name}</h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge className={`text-[10px] sm:text-xs ${status.color}`}>
                  {status.icon}
                  <span className="ml-1">{status.label}</span>
                </Badge>
                {status.label !== 'Concluído' && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                )}
              </div>
            </div>
            
            {/* Description - limited to 2 lines */}
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">
              {classData.description}
            </p>
            
            {/* Details row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDateRange(classData.startDate, classData.endDate)}</span>
              </div>
              
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{city}</span>
              </div>
              
              <Badge variant="outline" className="text-[10px] sm:text-xs">
                Presencial
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AcademySchedule() {
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  
  const { presentialCourses, isLoading } = useAcademyEnrollments();
  
  // Filter only presential classes (Formação 360, Brows Transplant, etc.)
  const presentialClasses = presentialCourses || [];
  
  // Filter events based on tab
  const upcomingEvents = presentialClasses.filter(c => {
    if (!c.startDate) return true; // Classes without date are "upcoming"
    const endDate = c.endDate ? parseISO(c.endDate) : parseISO(c.startDate);
    return isFuture(endDate) || isToday(endDate);
  });
  
  const pastEvents = presentialClasses.filter(c => {
    if (!c.startDate) return false;
    const endDate = c.endDate ? parseISO(c.endDate) : parseISO(c.startDate);
    return isPast(endDate) && !isToday(endDate);
  });
  
  // Next event with confirmed date
  const nextEvent = upcomingEvents.find(c => c.startDate && isFuture(parseISO(c.startDate)));
  
  // Calculate days until next event
  const daysUntilNext = nextEvent?.startDate 
    ? differenceInDays(parseISO(nextEvent.startDate), new Date())
    : null;
  
  const handleClassClick = (classData: PresentialCourse) => {
    // Use classId (the actual course_classes.id) for navigation, not enrollment id
    navigate(`/academy/classes/${classData.classId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="px-4 pt-16 lg:pt-6 pb-6 lg:px-6 space-y-6">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-emerald-600" />
              Agenda do Aluno
            </h1>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 pt-16 lg:pt-6 pb-6 lg:px-6 space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-emerald-600" />
            Agenda do Aluno
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe suas turmas presenciais aqui.
          </p>
        </div>

        {/* Next Event Highlight */}
        {nextEvent && (
          <Card className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 dark:border-emerald-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Próxima Turma</p>
                  <h3 className="text-lg font-bold">{nextEvent.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>{formatDateRange(nextEvent.startDate, nextEvent.endDate)}</span>
                    <span>•</span>
                    <span>{nextEvent.city || 'São Paulo'}{nextEvent.state ? `, ${nextEvent.state}` : ''}</span>
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
                  {presentialClasses.length}
                </div>
                <p className="text-xs text-muted-foreground">Matrículas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {upcomingEvents.length}
                </div>
                <p className="text-xs text-muted-foreground">Próximas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {pastEvents.length}
                </div>
                <p className="text-xs text-muted-foreground">Concluídas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-emerald-50 dark:bg-emerald-950/30">
            <TabsTrigger value="upcoming" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900">
              <Calendar className="h-4 w-4" />
              Próximas ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900">
              <CheckCircle2 className="h-4 w-4" />
              Concluídas ({pastEvents.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900">
              <CalendarDays className="h-4 w-4" />
              Todas ({presentialClasses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4 space-y-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(classData => (
                <ScheduleCard 
                  key={classData.id} 
                  classData={classData} 
                  onClick={() => handleClassClick(classData)}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Nenhuma turma próxima</p>
                <p className="text-sm">Suas próximas turmas aparecerão aqui.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4 space-y-4">
            {pastEvents.length > 0 ? (
              pastEvents.map(classData => (
                <ScheduleCard 
                  key={classData.id} 
                  classData={classData} 
                  onClick={() => handleClassClick(classData)}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Nenhuma turma concluída</p>
                <p className="text-sm">Turmas concluídas aparecerão aqui.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-4 space-y-4">
            {presentialClasses.length > 0 ? (
              presentialClasses.map(classData => (
                <ScheduleCard 
                  key={classData.id} 
                  classData={classData} 
                  onClick={() => handleClassClick(classData)}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Nenhuma matrícula encontrada</p>
                <p className="text-sm">Você ainda não está matriculado em turmas presenciais.</p>
              </div>
            )}
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
                  Turmas marcadas como "Data a Confirmar" serão atualizadas assim que as datas forem confirmadas pela equipe IBRAMEC.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
