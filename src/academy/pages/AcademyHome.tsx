import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { useUniversity } from "@/hooks/useUniversity";
import {
  BookOpen,
  Trophy,
  GraduationCap,
  Clock,
  Play,
  Calendar,
  TrendingUp,
  Award,
  ChevronRight,
  Star,
  FileText
} from "lucide-react";



export function AcademyHome() {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const { courses, enrollments, isLoading } = useUniversity();

  // Filter out hidden courses (Formação 360 is presential, Instrumentador de Elite is deprecated)
  const visibleCourses = courses.filter(c => {
    const title = c.title.toLowerCase();
    return !title.includes('formação 360') && 
           !title.includes('formacao 360') &&
           !title.includes('instrumentador de elite');
  });

  // Stats
  const enrolledCourses = visibleCourses.filter(c => c.enrollment);
  const completedCourses = visibleCourses.filter(c => c.enrollment?.status === 'completed');
  const inProgressCourses = visibleCourses.filter(c => c.enrollment && c.enrollment.status !== 'completed');
  const totalProgress = enrolledCourses.length > 0
    ? Math.round(enrolledCourses.reduce((acc, c) => acc + (c.enrollment?.progress_percent || 0), 0) / enrolledCourses.length)
    : 0;

  // Get last accessed course
  const lastCourse = inProgressCourses[0];

  // Upcoming events - only real events from database, no mocks
  const upcomingEvents: { id: number; title: string; date: string; time: string; type: string }[] = [];

  return (
    <div className="min-h-screen bg-background w-full max-w-full overflow-x-hidden">
      <main className="px-3 sm:px-4 lg:px-6 pt-16 lg:pt-6 pb-6 space-y-4 sm:space-y-6 w-full max-w-full">
        {/* Progress Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 dark:from-emerald-950/50 dark:to-green-950/50 dark:border-emerald-800">
            <CardContent className="p-2.5 sm:p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-400">{enrolledCourses.length}</p>
                  <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-500 truncate">Cursos Matriculados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/50 dark:to-indigo-950/50 dark:border-blue-800">
            <CardContent className="p-2.5 sm:p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-400">{totalProgress}%</p>
                  <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-500 truncate">Progresso Geral</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-950/50 dark:to-yellow-950/50 dark:border-amber-800">
            <CardContent className="p-2.5 sm:p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-xl font-bold text-amber-700 dark:text-amber-400">{completedCourses.length}</p>
                  <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-500 truncate">Cursos Concluídos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 dark:from-purple-950/50 dark:to-violet-950/50 dark:border-purple-800">
            <CardContent className="p-2.5 sm:p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                  <Award className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-xl font-bold text-purple-700 dark:text-purple-400">{completedCourses.length}</p>
                  <p className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-500 truncate">Certificados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Continue Learning */}
        {lastCourse && (
          <Card className="border-2 border-emerald-200 dark:border-emerald-800 overflow-hidden">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Play className="h-4 w-4 text-emerald-600" />
                  Continue de onde parou
                </CardTitle>
                <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-xs">
                  Em Andamento
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <h3 className="font-semibold text-sm sm:text-base truncate">{lastCourse.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{lastCourse.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={lastCourse.enrollment?.progress_percent || 0} className="flex-1 h-2" />
                    <span className="text-xs font-medium text-emerald-600 flex-shrink-0">{lastCourse.enrollment?.progress_percent || 0}%</span>
                  </div>
                </div>
                <Button onClick={() => navigate('/academy/courses')} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto" size="sm">
                  Continuar
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Quick Actions */}
          <Card className="overflow-hidden">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">Acesso Rápido</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 p-3 pt-0">
              <Button 
                variant="outline" 
                className="h-auto py-3 flex flex-col gap-1 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950/50"
                onClick={() => navigate('/academy/courses')}
              >
                <BookOpen className="h-5 w-5 text-emerald-600" />
                <span className="text-xs">Cursos</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-3 flex flex-col gap-1 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/50"
                onClick={() => navigate('/academy/exams')}
              >
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-xs">Provas</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-3 flex flex-col gap-1 hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-950/50"
                onClick={() => navigate('/academy/certificates')}
              >
                <Award className="h-5 w-5 text-amber-600" />
                <span className="text-xs">Certificados</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-3 flex flex-col gap-1 hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-950/50"
                onClick={() => navigate('/academy/community')}
              >
                <Star className="h-5 w-5 text-purple-600" />
                <span className="text-xs">Comunidade</span>
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="overflow-hidden">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                Próximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-0">
              {upcomingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum evento agendado</p>
                  <p className="text-xs text-muted-foreground/70">Os próximos eventos aparecerão aqui</p>
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      event.type === 'live' ? 'bg-red-100 dark:bg-red-950' : 
                      event.type === 'mentorship' ? 'bg-blue-100 dark:bg-blue-950' : 
                      'bg-amber-100 dark:bg-amber-950'
                    }`}>
                      {event.type === 'live' ? (
                        <Play className="h-3.5 w-3.5 text-red-600" />
                      ) : event.type === 'mentorship' ? (
                        <Clock className="h-3.5 w-3.5 text-blue-600" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{event.title}</p>
                      <p className="text-[10px] text-muted-foreground">{event.date} às {event.time}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] flex-shrink-0">
                      {event.type === 'live' ? 'Ao Vivo' : event.type === 'mentorship' ? 'Mentoria' : 'Prova'}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Available Courses Preview */}
        {visibleCourses.filter(c => !c.enrollment).length > 0 && (
          <Card className="overflow-hidden">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  Cursos Disponíveis
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/academy/courses')} className="text-xs h-7">
                  Ver todos
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {visibleCourses.filter(c => !c.enrollment).slice(0, 3).map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/academy/courses')}>
                    <CardContent className="p-3">
                      <div className="w-full h-16 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 flex items-center justify-center mb-2">
                        <GraduationCap className="h-8 w-8 text-emerald-600" />
                      </div>
                      <h4 className="font-medium text-xs truncate">{course.title}</h4>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          <Clock className="h-2.5 w-2.5 mr-0.5" />
                          {course.duration_hours || 0}h
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {course.difficulty || 'Básico'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
          </CardContent>
        </Card>
      )}

    </main>
  </div>
);
}
