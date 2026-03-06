import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { useAcademyEnrollments } from "@/academy/hooks/useAcademyEnrollments";
import { useNavigate, useLocation } from "react-router-dom";
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

function getEventStatus(startDate: string | null, endDate: string | null, classStatus: string): { label: string; color: string; darkColor: string; icon: React.ReactNode } {
  if (classStatus === 'completed' || classStatus === 'concluída') {
    return {
      label: 'Concluído',
      color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
      darkColor: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
      icon: <CheckCircle2 className="h-4 w-4" />
    };
  }
  
  if (!startDate) {
    return {
      label: 'Data a Confirmar',
      color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-700',
      darkColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      icon: <AlertCircle className="h-4 w-4" />
    };
  }
  
  const start = parseISO(startDate);
  const end = endDate ? parseISO(endDate) : start;
  
  if ((isPast(start) || isToday(start)) && (isFuture(end) || isToday(end))) {
    return {
      label: 'Em Andamento',
      color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-400 dark:border-green-700',
      darkColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      icon: <Clock className="h-4 w-4" />
    };
  }
  
  if (isPast(end)) {
    return {
      label: 'Concluído',
      color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
      darkColor: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
      icon: <CheckCircle2 className="h-4 w-4" />
    };
  }
  
  return {
    label: 'Data Confirmada',
    color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-700',
    darkColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
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

function getCourseGradient(courseName: string): string {
  const name = courseName.toLowerCase();
  if (name.includes("brows")) return "from-zinc-700 to-zinc-900";
  if (name.includes("fellowship")) return "from-purple-500 to-violet-600";
  if (name.includes("instrumentador")) return "from-blue-500 to-indigo-600";
  if (name.includes("licença") || name.includes("licenca")) return "from-amber-500 to-orange-600";
  if (name.includes("monitor")) return "from-pink-500 to-rose-600";
  return "from-emerald-500 to-green-600";
}

function ScheduleCard({ classData, onClick, isDark }: { classData: PresentialCourse; onClick: () => void; isDark: boolean }) {
  const status = getEventStatus(classData.startDate, classData.endDate, classData.status);
  const gradientColor = getCourseGradient(classData.name);
  const city = classData.city || 'São Paulo';
  
  return (
    <Card className={`transition-all duration-200 hover:shadow-lg cursor-pointer ${
      status.label === 'Concluído' ? 'opacity-70' : ''
    } ${isDark ? 'bg-[#14141f] border-white/5 hover:border-blue-500/20' : ''}`} onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${gradientColor}`}>
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className={`font-semibold text-sm sm:text-base ${isDark ? 'text-white' : ''}`}>{classData.name}</h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge className={`text-[10px] sm:text-xs ${isDark ? status.darkColor : status.color}`}>
                  {status.icon}
                  <span className="ml-1">{status.label}</span>
                </Badge>
                {status.label !== 'Concluído' && (
                  <ChevronRight className={`h-4 w-4 hidden sm:block ${isDark ? 'text-zinc-600' : 'text-muted-foreground'}`} />
                )}
              </div>
            </div>
            
            <p className={`text-xs sm:text-sm line-clamp-2 mb-2 ${isDark ? 'text-zinc-400' : 'text-muted-foreground'}`}>
              {classData.description}
            </p>
            
            <div className={`flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm ${isDark ? 'text-zinc-500' : ''}`}>
              <div className={`flex items-center gap-1 ${isDark ? 'text-zinc-500' : 'text-muted-foreground'}`}>
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDateRange(classData.startDate, classData.endDate)}</span>
              </div>
              
              <div className={`flex items-center gap-1 ${isDark ? 'text-zinc-500' : 'text-muted-foreground'}`}>
                <MapPin className="h-3.5 w-3.5" />
                <span>{city}</span>
              </div>
              
              <Badge variant="outline" className={`text-[10px] sm:text-xs ${isDark ? 'border-white/10 text-zinc-400' : ''}`}>
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
  const location = useLocation();
  const isDark = location.pathname.startsWith('/neoacademy');
  const [activeTab, setActiveTab] = useState('upcoming');
  
  const { presentialCourses, isLoading } = useAcademyEnrollments();
  
  const presentialClasses = presentialCourses || [];
  
  const upcomingEvents = presentialClasses.filter(c => {
    if (!c.startDate) return true;
    const endDate = c.endDate ? parseISO(c.endDate) : parseISO(c.startDate);
    return isFuture(endDate) || isToday(endDate);
  });
  
  const pastEvents = presentialClasses.filter(c => {
    if (!c.startDate) return false;
    const endDate = c.endDate ? parseISO(c.endDate) : parseISO(c.startDate);
    return isPast(endDate) && !isToday(endDate);
  });
  
  const nextEvent = upcomingEvents.find(c => c.startDate && isFuture(parseISO(c.startDate)));
  
  const daysUntilNext = nextEvent?.startDate 
    ? differenceInDays(parseISO(nextEvent.startDate), new Date())
    : null;
  
  const handleClassClick = (classData: PresentialCourse) => {
    navigate(`/academy/classes/${classData.classId}`);
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0f] text-white' : 'bg-background'}`}>
        <main className="px-4 pt-16 lg:pt-6 pb-6 lg:px-6 space-y-6">
          <div>
            <h1 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
              <CalendarDays className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-emerald-600'}`} />
              Agenda do Aluno
            </h1>
          </div>
          <div className="space-y-4">
            <Skeleton className={`h-24 w-full ${isDark ? 'bg-white/5' : ''}`} />
            <Skeleton className={`h-20 w-full ${isDark ? 'bg-white/5' : ''}`} />
            <Skeleton className={`h-20 w-full ${isDark ? 'bg-white/5' : ''}`} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0f] text-white' : 'bg-background'}`}>
      <main className="px-4 pt-16 lg:pt-6 pb-6 lg:px-6 space-y-6">
        {/* Page Title */}
        <div>
          <h1 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
            <CalendarDays className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-emerald-600'}`} />
            Agenda do Aluno
          </h1>
          <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-muted-foreground'}`}>
            Acompanhe suas turmas presenciais aqui.
          </p>
        </div>

        {/* Next Event Highlight */}
        {nextEvent && (
          <Card className={isDark 
            ? 'border-blue-500/20 bg-[#14141f]' 
            : 'border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 dark:border-emerald-800'
          }>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-blue-500 to-sky-600' : 'bg-gradient-to-br from-emerald-500 to-green-600'}`}>
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>Próxima Turma</p>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : ''}`}>{nextEvent.name}</h3>
                  <div className={`flex items-center gap-3 mt-1 text-sm ${isDark ? 'text-zinc-400' : 'text-muted-foreground'}`}>
                    <span>{formatDateRange(nextEvent.startDate, nextEvent.endDate)}</span>
                    <span>•</span>
                    <span>{nextEvent.city || 'São Paulo'}{nextEvent.state ? `, ${nextEvent.state}` : ''}</span>
                  </div>
                </div>
                {daysUntilNext !== null && daysUntilNext > 0 && (
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${isDark ? 'text-blue-400' : 'text-emerald-700 dark:text-emerald-400'}`}>{daysUntilNext}</div>
                    <p className={`text-xs ${isDark ? 'text-blue-400/70' : 'text-emerald-600 dark:text-emerald-500'}`}>dias restantes</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className={isDark ? 'bg-[#14141f] border-white/5' : ''}>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                  {presentialClasses.length}
                </div>
                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-muted-foreground'}`}>Matrículas</p>
              </div>
            </CardContent>
          </Card>
          <Card className={isDark ? 'bg-[#14141f] border-white/5' : ''}>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${isDark ? 'text-sky-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {upcomingEvents.length}
                </div>
                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-muted-foreground'}`}>Próximas</p>
              </div>
            </CardContent>
          </Card>
          <Card className={isDark ? 'bg-[#14141f] border-white/5' : ''}>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${isDark ? 'text-zinc-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {pastEvents.length}
                </div>
                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-muted-foreground'}`}>Concluídas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={isDark ? 'bg-[#14141f] border border-white/5' : 'bg-emerald-50 dark:bg-emerald-950/30'}>
            <TabsTrigger value="upcoming" className={`gap-2 ${isDark ? 'data-[state=active]:bg-blue-500 data-[state=active]:text-white text-zinc-400' : 'data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900'}`}>
              <Calendar className="h-4 w-4" />
              Próximas ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past" className={`gap-2 ${isDark ? 'data-[state=active]:bg-blue-500 data-[state=active]:text-white text-zinc-400' : 'data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900'}`}>
              <CheckCircle2 className="h-4 w-4" />
              Concluídas ({pastEvents.length})
            </TabsTrigger>
            <TabsTrigger value="all" className={`gap-2 ${isDark ? 'data-[state=active]:bg-blue-500 data-[state=active]:text-white text-zinc-400' : 'data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900'}`}>
              <CalendarDays className="h-4 w-4" />
              Todas ({presentialClasses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4 space-y-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(classData => (
                <ScheduleCard key={classData.id} classData={classData} onClick={() => handleClassClick(classData)} isDark={isDark} />
              ))
            ) : (
              <div className={`text-center py-12 ${isDark ? 'text-zinc-500' : 'text-muted-foreground'}`}>
                <Calendar className={`h-12 w-12 mx-auto mb-3 ${isDark ? 'text-zinc-700' : 'opacity-50'}`} />
                <p className="text-lg font-medium">Nenhuma turma próxima</p>
                <p className="text-sm">Suas próximas turmas aparecerão aqui.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4 space-y-4">
            {pastEvents.length > 0 ? (
              pastEvents.map(classData => (
                <ScheduleCard key={classData.id} classData={classData} onClick={() => handleClassClick(classData)} isDark={isDark} />
              ))
            ) : (
              <div className={`text-center py-12 ${isDark ? 'text-zinc-500' : 'text-muted-foreground'}`}>
                <CheckCircle2 className={`h-12 w-12 mx-auto mb-3 ${isDark ? 'text-zinc-700' : 'opacity-50'}`} />
                <p className="text-lg font-medium">Nenhuma turma concluída</p>
                <p className="text-sm">Turmas concluídas aparecerão aqui.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-4 space-y-4">
            {presentialClasses.length > 0 ? (
              presentialClasses.map(classData => (
                <ScheduleCard key={classData.id} classData={classData} onClick={() => handleClassClick(classData)} isDark={isDark} />
              ))
            ) : (
              <div className={`text-center py-12 ${isDark ? 'text-zinc-500' : 'text-muted-foreground'}`}>
                <GraduationCap className={`h-12 w-12 mx-auto mb-3 ${isDark ? 'text-zinc-700' : 'opacity-50'}`} />
                <p className="text-lg font-medium">Nenhuma matrícula encontrada</p>
                <p className="text-sm">Você ainda não está matriculado em turmas presenciais.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Help Card */}
        <Card className={isDark ? 'bg-[#14141f] border-white/5' : 'bg-muted/50'}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className={`h-5 w-5 mt-0.5 ${isDark ? 'text-zinc-600' : 'text-muted-foreground'}`} />
              <div>
                <p className={`font-medium text-sm ${isDark ? 'text-zinc-300' : ''}`}>Sem data definida?</p>
                <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-muted-foreground'}`}>
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
