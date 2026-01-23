import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  GraduationCap,
  FileText,
  CheckCircle2,
  AlertCircle,
  User,
  Coffee,
  Utensils,
  Stethoscope,
  BookOpen,
  Award
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useClassDetails, ScheduleItem } from "../hooks/useClassDetails";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import logoFormacao360 from "@/assets/logo-formacao-360-white.png";

function getActivityIcon(activity: string) {
  const lower = activity.toLowerCase();
  if (lower.includes('coffee') || lower.includes('break')) return <Coffee className="h-4 w-4" />;
  if (lower.includes('almoço') || lower.includes('almoco')) return <Utensils className="h-4 w-4" />;
  if (lower.includes('prática') || lower.includes('cirúrgico') || lower.includes('cirurgico')) return <Stethoscope className="h-4 w-4" />;
  if (lower.includes('aula') || lower.includes('workshop')) return <BookOpen className="h-4 w-4" />;
  if (lower.includes('neoconnect') || lower.includes('confraternização')) return <Users className="h-4 w-4" />;
  return <Clock className="h-4 w-4" />;
}

function formatTime(time: string): string {
  return time.substring(0, 5);
}

export function AcademyClassDetail() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const { classDetails, isLoading } = useClassDetails(classId || null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background w-full">
        <div className="p-4 pt-16 lg:pt-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!classDetails) {
    return (
      <div className="min-h-screen bg-background w-full">
        <div className="p-4 pt-16 lg:pt-6 space-y-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Turma não encontrada</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isFormacao360 = classDetails.name.toLowerCase().includes('formação') || 
                        classDetails.name.toLowerCase().includes('formacao');

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <div className="p-4 pt-16 lg:pt-6 pb-8 space-y-6">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 -ml-2">
          <ChevronLeft className="h-4 w-4" />
          Voltar para Meus Cursos
        </Button>

        {/* Header Card */}
        <Card className="overflow-hidden">
          <div className={`h-40 bg-gradient-to-br ${isFormacao360 ? 'from-emerald-600 to-green-700' : 'from-blue-600 to-indigo-700'} p-6 flex flex-col items-center justify-center relative`}>
            {isFormacao360 ? (
              <img src={logoFormacao360} alt="Formação 360" className="h-16 object-contain" />
            ) : (
              <GraduationCap className="h-16 w-16 text-white/80" />
            )}
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{classDetails.courseName || classDetails.name}</h1>
                <p className="text-muted-foreground mt-1">{classDetails.name}</p>
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  {classDetails.startDate && (
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(parseISO(classDetails.startDate), "dd MMM", { locale: ptBR })}
                      {classDetails.endDate && classDetails.endDate !== classDetails.startDate && (
                        <> - {format(parseISO(classDetails.endDate), "dd MMM yyyy", { locale: ptBR })}</>
                      )}
                    </Badge>
                  )}
                  {classDetails.location && (
                    <Badge variant="outline" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {classDetails.location}
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {classDetails.enrolledCount} alunos
                  </Badge>
                </div>
              </div>
              <Badge 
                className={`${
                  classDetails.status === 'in_progress' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' 
                    : classDetails.status === 'confirmed' || classDetails.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                } border-0`}
              >
                {classDetails.status === 'in_progress' ? 'Em Andamento' : 
                 classDetails.status === 'confirmed' || classDetails.status === 'active' ? 'Confirmado' : 'Pendente'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="schedule" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Cronograma</span>
            </TabsTrigger>
            <TabsTrigger value="exams" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Provas</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Alunos</span>
            </TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            {classDetails.schedule.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">Cronograma não disponível</p>
                  <p className="text-sm text-muted-foreground">O cronograma será disponibilizado em breve.</p>
                </CardContent>
              </Card>
            ) : (
              classDetails.schedule.map((day) => (
                <Card key={day.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{day.dayTitle}</CardTitle>
                        {day.dayDate && (
                          <CardDescription>
                            {format(parseISO(day.dayDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant="outline">Dia {day.dayNumber}</Badge>
                    </div>
                    {day.dayTheme && (
                      <p className="text-sm text-muted-foreground mt-2 italic">{day.dayTheme}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {day.items.map((item, index) => (
                        <div 
                          key={item.id} 
                          className={`flex items-start gap-4 p-3 rounded-lg border ${
                            item.activity.toLowerCase().includes('coffee') || 
                            item.activity.toLowerCase().includes('almoço') ||
                            item.activity.toLowerCase().includes('almoco')
                              ? 'bg-muted/30 border-dashed'
                              : 'bg-background'
                          }`}
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            {getActivityIcon(item.activity)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-primary">
                                {formatTime(item.startTime)} - {formatTime(item.endTime)}
                              </span>
                              {item.location && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.location}
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium">{item.activity}</p>
                            {item.instructor && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <User className="h-3 w-3" />
                                {item.instructor}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Exams Tab */}
          <TabsContent value="exams" className="space-y-4">
            {classDetails.exams.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">Nenhuma prova disponível</p>
                  <p className="text-sm text-muted-foreground">As provas serão liberadas durante o curso.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {classDetails.exams.map((exam) => (
                  <Card key={exam.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-semibold">{exam.title}</h3>
                          {exam.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{exam.description}</p>
                          )}
                        </div>
                        {exam.passed ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Aprovado
                          </Badge>
                        ) : exam.attemptCount > 0 ? (
                          <Badge variant="secondary">
                            {exam.attemptCount} tentativa(s)
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        {exam.durationMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {exam.durationMinutes} min
                          </span>
                        )}
                        {exam.passingScore && (
                          <span className="flex items-center gap-1">
                            <Award className="h-3.5 w-3.5" />
                            Mínimo: {exam.passingScore}%
                          </span>
                        )}
                      </div>
                      {exam.bestScore !== null && (
                        <div className="mb-3 p-2 bg-muted rounded-lg">
                          <p className="text-sm">
                            Melhor nota: <span className="font-semibold">{exam.bestScore}%</span>
                          </p>
                        </div>
                      )}
                      <Button 
                        className="w-full"
                        onClick={() => navigate(`/academy/exams/${exam.id}`)}
                      >
                        {exam.attemptCount > 0 ? 'Tentar Novamente' : 'Iniciar Prova'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Alunos Matriculados ({classDetails.students.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {classDetails.students.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Nenhum aluno matriculado</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {classDetails.students.map((student) => (
                      <div 
                        key={student.id} 
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={student.avatarUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{student.name}</p>
                          {student.city && (
                            <p className="text-xs text-muted-foreground truncate">
                              {student.city}{student.state ? `, ${student.state}` : ''}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            student.enrollmentStatus === 'enrolled' || student.enrollmentStatus === 'confirmed'
                              ? 'border-emerald-300 text-emerald-700 dark:text-emerald-400'
                              : 'border-amber-300 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {student.enrollmentStatus === 'enrolled' || student.enrollmentStatus === 'confirmed' 
                            ? 'Confirmado' 
                            : 'Pendente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
