import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Clock,
  Play,
  MapPin,
  Video
} from "lucide-react";
import { useUniversity, CourseWithProgress } from "@/hooks/useUniversity";
import { CourseCard } from "@/components/CourseCard";
import { CourseViewer } from "@/components/CourseViewer";

import { ConectaCapilarCard } from "../components/ConectaCapilarCard";
import { PresentialCourseCard, PresentialCourse } from "../components/PresentialCourseCard";
import { useAcademyEnrollments } from "../hooks/useAcademyEnrollments";

export function AcademyCourses() {
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

  const { presentialCourses, isLoading: isLoadingPresential } = useAcademyEnrollments();
  const [activeTab, setActiveTab] = useState('presencial');

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

  const handleViewPresentialDetails = (course: PresentialCourse) => {
    // Navigate to course details or open modal
    navigate('/academy/schedule');
  };

  const handleSelectTrack = (trackId: string) => {
    // Navigate to specific track within Conecta Capilar
    console.log('Selected track:', trackId);
  };

  // If viewing a specific course
  if (selectedCourse) {
    return (
      <div className="min-h-screen bg-background">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 pt-16 lg:pt-6 pb-6 overflow-x-hidden w-full space-y-6">
        {/* Page Title */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              Meus Cursos
            </h1>
            <p className="text-sm text-muted-foreground">Trilhas de capacitação e aulas gravadas</p>
          </div>
          <Button onClick={() => navigate('/academy/schedule')} variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Agenda</span>
          </Button>
        </div>
        {/* Progress Overview */}
        <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 dark:from-emerald-950/30 dark:to-green-950/30 dark:border-emerald-800">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                  {presentialCourses.length + (enrolledCourses.length > 0 ? 1 : 0)}
                </div>
                <p className="text-sm text-emerald-600 dark:text-emerald-500">Cursos Matriculados</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{completedCourses.length}</div>
                <p className="text-sm text-emerald-600 dark:text-emerald-500">Concluídos</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                  {presentialCourses.filter(c => c.status === 'confirmed').length}
                </div>
                <p className="text-sm text-emerald-600 dark:text-emerald-500">Turmas Confirmadas</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{totalProgress}%</div>
                <p className="text-sm text-emerald-600 dark:text-emerald-500">Progresso Online</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-emerald-50 dark:bg-emerald-950/30 grid w-full grid-cols-2">
            <TabsTrigger value="presencial" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900">
              <GraduationCap className="h-4 w-4" />
              Cursos Presenciais
            </TabsTrigger>
            <TabsTrigger value="online" className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900">
              <Video className="h-4 w-4" />
              Trilhas Online
            </TabsTrigger>
          </TabsList>

          <TabsContent value="presencial" className="mt-6 space-y-6">
            {isLoadingPresential ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-64 w-full rounded-lg" />
                ))}
              </div>
            ) : presentialCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {presentialCourses.map((course) => (
                  <PresentialCourseCard
                    key={course.id}
                    course={course as PresentialCourse}
                    onViewDetails={handleViewPresentialDetails}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Nenhum curso presencial matriculado</p>
                <p className="text-sm">Entre em contato para se matricular em uma turma.</p>
              </div>
            )}

            {/* Info Card */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Cursos Presenciais IBRAMEC</p>
                    <p className="text-sm text-muted-foreground">
                      Os cursos presenciais acontecem em diferentes cidades do Brasil. 
                      Confira sua <button onClick={() => navigate('/academy/schedule')} className="text-emerald-600 hover:underline font-medium">Agenda do Aluno</button> para ver as datas da sua turma.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Online Courses Tab */}
          <TabsContent value="online" className="mt-6 space-y-6">
            {/* Conecta Capilar - Main Online Course */}
            <ConectaCapilarCard onSelectTrack={handleSelectTrack} />

            {/* Additional Online Courses from Database */}
            {enrolledCourses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                    Outros Cursos Online
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enrolledCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        onSelect={handleSelectCourse}
                        onEnroll={handleEnroll}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Card */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Video className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Conecta Capilar</p>
                    <p className="text-sm text-muted-foreground">
                      Confira sua trilha completa no Conecta Capilar. Todas as suas jornadas de aprendizado online 
                      estão centralizadas aqui: Comercial, Médica, Marketing e muito mais.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 1, title: 'Formação 360° - SP', date: '20-25 Jan 2026', type: 'Presencial' },
                { id: 2, title: 'Mentoria em Grupo', date: '30 Jan 2026', type: 'Online' },
                { id: 3, title: 'Webinar: Tendências 2026', date: '10 Fev 2026', type: 'Online' },
              ].map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-all duration-200 hover:shadow-md"
                  onClick={() => navigate('/academy/schedule')}
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-emerald-600" />
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
    </div>
  );
}
