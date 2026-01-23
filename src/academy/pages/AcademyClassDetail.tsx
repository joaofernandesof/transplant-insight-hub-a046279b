import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Award,
  Settings,
  Plus,
  Link as LinkIcon
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useClassDetails, ScheduleItem } from "../hooks/useClassDetails";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { useAllExams, useUpdateExamClass, useToggleExamStatus } from "@/hooks/useExams";
import logoFormacao360 from "@/assets/logo-formacao-360-white.png";
import { toast } from "sonner";

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
  const { user, activeProfile } = useUnifiedAuth();
  const { classDetails, isLoading, refetch } = useClassDetails(classId || null);
  const { data: allExams = [] } = useAllExams();
  const updateExamClass = useUpdateExamClass();
  const toggleExamStatus = useToggleExamStatus();

  const isAdmin = activeProfile === 'administrador';

  // Exams not linked to this class (for admin to add)
  const availableExams = allExams.filter(
    exam => !exam.class_id || exam.class_id !== classId
  );

  const handleLinkExam = async (examId: string) => {
    try {
      await updateExamClass.mutateAsync({ examId, classId: classId || null });
      toast.success("Prova vinculada à turma com sucesso!");
      refetch();
    } catch (error) {
      toast.error("Erro ao vincular prova");
    }
  };

  const handleUnlinkExam = async (examId: string) => {
    try {
      await updateExamClass.mutateAsync({ examId, classId: null });
      toast.success("Prova desvinculada da turma!");
      refetch();
    } catch (error) {
      toast.error("Erro ao desvincular prova");
    }
  };

  const handleToggleExamStatus = async (examId: string, isActive: boolean) => {
    try {
      await toggleExamStatus.mutateAsync({ examId, isActive });
      toast.success(isActive ? "Prova ativada!" : "Prova desativada!");
      refetch();
    } catch (error) {
      toast.error("Erro ao alterar status da prova");
    }
  };

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
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Cronograma</span>
            </TabsTrigger>
            <TabsTrigger value="exams" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Provas</span>
            </TabsTrigger>
            <TabsTrigger value="network" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Network</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Gestão</span>
              </TabsTrigger>
            )}
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
              <div className="space-y-3">
                {classDetails.exams.map((exam) => {
                  const passed = exam.bestScore !== null && exam.bestScore >= (exam.passingScore || 70);
                  const attempted = exam.attemptCount > 0;
                  
                  return (
                    <Card key={exam.id} className="hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            passed
                              ? 'bg-gradient-to-br from-emerald-400 to-green-500'
                              : attempted
                              ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                              : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                          }`}>
                            {passed ? (
                              <Award className="h-6 w-6 text-white" />
                            ) : (
                              <FileText className="h-6 w-6 text-white" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold">{exam.title}</h3>
                              {exam.bestScore !== null && (
                                <Badge className={
                                  passed 
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                                    : 'bg-red-500 text-white hover:bg-red-600'
                                }>
                                  {passed ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Aprovado • {exam.bestScore}%
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Reprovado • {exam.bestScore}% — Tente novamente
                                    </>
                                  )}
                                </Badge>
                              )}
                            </div>

                            {exam.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{exam.description}</p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {exam.durationMinutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {exam.durationMinutes} min
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Award className="h-3 w-3" />
                                Mínimo: {exam.passingScore || 70}%
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <Button 
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => navigate(`/academy/exams/${exam.id}/take`)}
                            >
                              {attempted ? 'Refazer' : 'Iniciar'}
                            </Button>
                            {attempted && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/academy/exams/${exam.id}/results`)}
                              >
                                Ver Resultado
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Network Tab - Classmates */}
          <TabsContent value="network" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Network da Turma ({classDetails.students.length} alunos)
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Conheça seus colegas de turma e amplie sua rede de contatos profissionais
                </p>
              </CardHeader>
              <CardContent>
                {classDetails.students.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Nenhum aluno matriculado</p>
                    <p className="text-sm text-muted-foreground">Os alunos aparecerão aqui quando forem matriculados</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {classDetails.students.map((student) => (
                      <div 
                        key={student.id} 
                        className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={student.avatarUrl || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                            {student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{student.name}</p>
                          {(student.city || student.state) && (
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {student.city}{student.city && student.state ? ', ' : ''}{student.state}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Tab - Only for administrators */}
          {isAdmin && (
            <TabsContent value="admin" className="space-y-4">
              {/* Linked Exams Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-600" />
                    Provas Vinculadas à Turma ({classDetails.exams.length})
                  </CardTitle>
                  <CardDescription>Gerencie as provas disponíveis para esta turma</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {classDetails.exams.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg">
                      <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Nenhuma prova vinculada</p>
                      <p className="text-xs text-muted-foreground">Use a seção abaixo para vincular provas</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {classDetails.exams.map((exam) => (
                        <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{exam.title}</h4>
                            <p className="text-sm text-muted-foreground">{exam.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {exam.durationMinutes && <span>{exam.durationMinutes} min</span>}
                              {exam.passingScore && <span>Mínimo: {exam.passingScore}%</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`exam-active-${exam.id}`}
                                checked={exam.isActive}
                                onCheckedChange={(checked) => handleToggleExamStatus(exam.id, checked)}
                              />
                              <Label htmlFor={`exam-active-${exam.id}`} className="text-sm">
                                {exam.isActive ? 'Ativa' : 'Inativa'}
                              </Label>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnlinkExam(exam.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Desvincular
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Available exams to link */}
                  {availableExams.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Vincular Nova Prova
                      </h4>
                      <div className="grid gap-2 max-h-60 overflow-y-auto">
                        {availableExams.map((exam) => (
                          <div key={exam.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                            <div>
                              <p className="font-medium text-sm">{exam.title}</p>
                              {exam.courses?.title && (
                                <p className="text-xs text-muted-foreground">
                                  Curso: {exam.courses.title}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLinkExam(exam.id)}
                              className="gap-1"
                            >
                              <LinkIcon className="h-3 w-3" />
                              Vincular
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                        <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{classDetails.enrolledCount}</p>
                        <p className="text-xs text-muted-foreground">Alunos Matriculados</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{classDetails.exams.length}</p>
                        <p className="text-xs text-muted-foreground">Provas Vinculadas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{classDetails.schedule.length}</p>
                        <p className="text-xs text-muted-foreground">Dias de Aula</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}