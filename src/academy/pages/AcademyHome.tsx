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
import { GlobalBreadcrumb } from "@/components/GlobalBreadcrumb";

export function AcademyHome() {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const { courses, enrollments, isLoading } = useUniversity();

  // Stats
  const enrolledCourses = courses.filter(c => c.enrollment);
  const completedCourses = courses.filter(c => c.enrollment?.status === 'completed');
  const inProgressCourses = courses.filter(c => c.enrollment && c.enrollment.status !== 'completed');
  const totalProgress = enrolledCourses.length > 0
    ? Math.round(enrolledCourses.reduce((acc, c) => acc + (c.enrollment?.progress_percent || 0), 0) / enrolledCourses.length)
    : 0;

  // Get last accessed course
  const lastCourse = inProgressCourses[0];

  // Upcoming events mock
  const upcomingEvents = [
    { id: 1, title: 'Aula ao Vivo: Técnicas Avançadas', date: '28 Jan 2026', time: '19:00', type: 'live' },
    { id: 2, title: 'Mentoria em Grupo', date: '30 Jan 2026', time: '10:00', type: 'mentorship' },
    { id: 3, title: 'Prazo: Prova Módulo 2', date: '02 Fev 2026', time: '23:59', type: 'exam' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="px-4 py-4">
          <div className="pl-12 lg:pl-0">
            <GlobalBreadcrumb />
            <h1 className="text-2xl font-bold mt-2">
              Olá, {user?.fullName?.split(' ')[0] || 'Aluno'}! 👋
            </h1>
            <p className="text-muted-foreground">Continue sua jornada de aprendizado</p>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-6 space-y-6">
        {/* Progress Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 dark:from-emerald-950/50 dark:to-green-950/50 dark:border-emerald-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{enrolledCourses.length}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">Cursos Matriculados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/50 dark:to-indigo-950/50 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{totalProgress}%</p>
                  <p className="text-xs text-blue-600 dark:text-blue-500">Progresso Geral</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-950/50 dark:to-yellow-950/50 dark:border-amber-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{completedCourses.length}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">Cursos Concluídos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 dark:from-purple-950/50 dark:to-violet-950/50 dark:border-purple-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{completedCourses.length}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-500">Certificados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Continue Learning */}
        {lastCourse && (
          <Card className="border-2 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Play className="h-4 w-4 text-emerald-600" />
                  Continue de onde parou
                </CardTitle>
                <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                  Em Andamento
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{lastCourse.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{lastCourse.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <Progress value={lastCourse.enrollment?.progress_percent || 0} className="flex-1 h-2" />
                    <span className="text-sm font-medium text-emerald-600">{lastCourse.enrollment?.progress_percent || 0}%</span>
                  </div>
                </div>
                <Button onClick={() => navigate('/academy/courses')} className="bg-emerald-600 hover:bg-emerald-700">
                  Continuar
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grid Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acesso Rápido</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950/50"
                onClick={() => navigate('/academy/courses')}
              >
                <BookOpen className="h-6 w-6 text-emerald-600" />
                <span className="text-sm">Meus Cursos</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/50"
                onClick={() => navigate('/academy/exams')}
              >
                <FileText className="h-6 w-6 text-blue-600" />
                <span className="text-sm">Provas</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2 hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-950/50"
                onClick={() => navigate('/academy/certificates')}
              >
                <Award className="h-6 w-6 text-amber-600" />
                <span className="text-sm">Certificados</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-950/50"
                onClick={() => navigate('/academy/community')}
              >
                <Star className="h-6 w-6 text-purple-600" />
                <span className="text-sm">Comunidade</span>
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                Próximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    event.type === 'live' ? 'bg-red-100 dark:bg-red-950' : 
                    event.type === 'mentorship' ? 'bg-blue-100 dark:bg-blue-950' : 
                    'bg-amber-100 dark:bg-amber-950'
                  }`}>
                    {event.type === 'live' ? (
                      <Play className={`h-4 w-4 ${event.type === 'live' ? 'text-red-600' : 'text-blue-600'}`} />
                    ) : event.type === 'mentorship' ? (
                      <Clock className="h-4 w-4 text-blue-600" />
                    ) : (
                      <FileText className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.date} às {event.time}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.type === 'live' ? 'Ao Vivo' : event.type === 'mentorship' ? 'Mentoria' : 'Prova'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Available Courses Preview */}
        {courses.filter(c => !c.enrollment).length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  Cursos Disponíveis
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/academy/courses')}>
                  Ver todos
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {courses.filter(c => !c.enrollment).slice(0, 3).map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/academy/courses')}>
                    <CardContent className="pt-4">
                      <div className="w-full h-24 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 flex items-center justify-center mb-3">
                        <GraduationCap className="h-10 w-10 text-emerald-600" />
                      </div>
                      <h4 className="font-medium text-sm truncate">{course.title}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {course.duration_hours || 0}h
                        </Badge>
                        <Badge variant="outline" className="text-xs">
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
