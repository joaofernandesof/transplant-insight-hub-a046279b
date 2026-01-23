import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "@/components/ModuleLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  BookOpen,
  Trophy,
  Calendar,
  TrendingUp,
  FileText,
  ChevronRight,
  Stethoscope,
  Megaphone,
  Briefcase
} from "lucide-react";
import { useUniversity, CourseWithProgress } from "@/hooks/useUniversity";
import { CourseCard } from "@/components/CourseCard";
import { CourseViewer } from "@/components/CourseViewer";

const upcomingEvents = [
  { id: 1, title: 'Imersão Presencial', date: '15-20 Fev 2026', type: 'Presencial' },
  { id: 2, title: 'Mentoria em Grupo', date: '25 Jan 2026', type: 'Online' },
  { id: 3, title: 'Webinar: Tendências 2026', date: '30 Jan 2026', type: 'Online' },
];

// Trilhas disponíveis
const availableTracks = [
  { id: 'comercial', name: 'Trilha Comercial', description: 'Vendas consultivas e captação', icon: TrendingUp, color: 'from-blue-500 to-indigo-600', lessons: 9, progress: 75 },
  { id: 'medica', name: 'Trilha Médica', description: 'Técnicas e protocolos clínicos', icon: Stethoscope, color: 'from-emerald-500 to-green-600', lessons: 9, progress: 40 },
  { id: 'marketing', name: 'Trilha de Marketing', description: 'Presença digital e captação', icon: Megaphone, color: 'from-purple-500 to-violet-600', lessons: 9, progress: 20, isNew: true },
  { id: 'gestao', name: 'Trilha de Gestão', description: 'Gestão eficiente da clínica', icon: Briefcase, color: 'from-amber-500 to-orange-600', lessons: 9, progress: 0 },
];

export default function University() {
  const navigate = useNavigate();
  const {
    courses,
    enrollments,
    isLoading,
    selectedCourse,
    selectedLesson,
    setSelectedCourse,
    setSelectedLesson,
    fetchCourseDetails,
    enrollInCourse,
    markLessonCompleted,
    startLesson,
  } = useUniversity();

  const [activeTab, setActiveTab] = useState('all');

  // Calculate overall stats
  const enrolledCourses = courses.filter(c => c.enrollment);
  const completedCourses = courses.filter(c => c.enrollment?.status === 'completed');
  const inProgressCourses = courses.filter(c => c.enrollment && c.enrollment.status !== 'completed');
  const totalProgress = enrolledCourses.length > 0
    ? Math.round(enrolledCourses.reduce((acc, c) => acc + (c.enrollment?.progress_percent || 0), 0) / enrolledCourses.length)
    : 0;

  const handleSelectCourse = async (course: CourseWithProgress) => {
    await fetchCourseDetails(course.id);
  };

  const handleEnroll = async (courseId: string) => {
    const success = await enrollInCourse(courseId);
    if (success) {
      await fetchCourseDetails(courseId);
    }
  };

  const handleSelectLesson = async (lesson: any) => {
    setSelectedLesson(lesson);
    await startLesson(lesson.id);
  };

  const handleMarkComplete = async (lessonId: string) => {
    await markLessonCompleted(lessonId);
  };

  const handleBack = () => {
    setSelectedCourse(null);
    setSelectedLesson(null);
  };

  // If viewing a specific course
  if (selectedCourse) {
    return (
      <ModuleLayout>
        <div className="p-4 pt-16 lg:pt-4 lg:p-6 h-[calc(100vh-2rem)]">
          <CourseViewer
            course={selectedCourse}
            onBack={handleBack}
            onSelectLesson={handleSelectLesson}
            onMarkComplete={handleMarkComplete}
            selectedLesson={selectedLesson}
            isEnrolled={!!selectedCourse.enrollment}
            onEnroll={() => handleEnroll(selectedCourse.id)}
          />
        </div>
      </ModuleLayout>
    );
  }

  // Filter courses based on active tab
  const filteredCourses = activeTab === 'all' 
    ? courses 
    : activeTab === 'enrolled' 
    ? enrolledCourses 
    : courses.filter(c => !c.enrollment);

  return (
    <ModuleLayout>
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-4 pl-12 lg:pl-0">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                Universidade ByNeofolic
              </h1>
              <p className="text-sm text-muted-foreground">Trilhas de capacitação e aulas gravadas</p>
            </div>
            <Button onClick={() => navigate('/university/exams')} variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Provas</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 overflow-x-hidden w-full">
        {/* Progress Overview */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-900">{enrolledCourses.length}</div>
                <p className="text-sm text-purple-700">Cursos Inscritos</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-900">{completedCourses.length}</div>
                <p className="text-sm text-purple-700">Concluídos</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-900">{inProgressCourses.length}</div>
                <p className="text-sm text-purple-700">Em Andamento</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-900">{totalProgress}%</div>
                <p className="text-sm text-purple-700">Progresso Geral</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trilhas de Capacitação */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-purple-600" />
            Trilhas de Capacitação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availableTracks.map((track) => (
              <Card 
                key={track.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
                onClick={() => navigate(`/university/trilha/${track.id}`)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${track.color} flex items-center justify-center flex-shrink-0`}>
                      <track.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{track.name}</h3>
                        {track.isNew && (
                          <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">Novo</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{track.description}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{track.lessons} aulas</span>
                          <span className="font-medium">{track.progress}%</span>
                        </div>
                        <Progress value={track.progress} className="h-1.5" />
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tabs and Courses */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Todos ({courses.length})
            </TabsTrigger>
            <TabsTrigger value="enrolled" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Meus Cursos ({enrolledCourses.length})
            </TabsTrigger>
            <TabsTrigger value="available" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Disponíveis ({courses.length - enrolledCourses.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-40 rounded-t-lg" />
                <CardHeader>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Courses Grid */}
        {!isLoading && (
          <>
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onSelect={handleSelectCourse}
                    onEnroll={handleEnroll}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">
                  {activeTab === 'enrolled' 
                    ? 'Você ainda não está inscrito em nenhum curso' 
                    : 'Nenhum curso disponível'}
                </p>
                <p className="text-sm">
                  {activeTab === 'enrolled' 
                    ? 'Explore os cursos disponíveis e comece sua jornada!' 
                    : 'Em breve novos cursos serão adicionados.'}
                </p>
              </div>
            )}
          </>
        )}

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.date}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </ModuleLayout>
  );
}
