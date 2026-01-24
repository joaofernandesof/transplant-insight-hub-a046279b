import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

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
  Award,
  Settings,
  Plus,
  Link as LinkIcon,
  MessageCircle,
  Camera,
  ClipboardList,
  Lock
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useClassDetails } from "../hooks/useClassDetails";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { useAllExams, useUpdateExamClass, useToggleExamStatus } from "@/hooks/useExams";

import { toast } from "sonner";
import { ScheduleTimeline } from "../components/ScheduleTimeline";
import { CourseGalleryViewer } from "../components/CourseGalleryViewer";
import { SatisfactionSurveyDialog } from "../components/SatisfactionSurveyDialog";
import { Day1SurveyDialog } from "../components/Day1SurveyDialog";
import { useSatisfactionSurvey } from "../hooks/useSatisfactionSurvey";
import { useDay1Survey } from "../hooks/useDay1Survey";

export function AcademyClassDetail() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user, activeProfile, isAdmin } = useUnifiedAuth();
  const { classDetails, isLoading, refetch } = useClassDetails(classId || null);
  const { data: allExams = [] } = useAllExams();
  const updateExamClass = useUpdateExamClass();
  const toggleExamStatus = useToggleExamStatus();
  
  // Satisfaction survey state
  const { hasCompleted: hasSurveyCompleted, refetch: refetchSurvey } = useSatisfactionSurvey(classId);
  const { hasCompleted: hasDay1Completed, refetch: refetchDay1 } = useDay1Survey(classId);
  const [surveyDialogOpen, setSurveyDialogOpen] = useState(false);
  const [day1SurveyDialogOpen, setDay1SurveyDialogOpen] = useState(false);
  const [surveyTriggeredByPhotos, setSurveyTriggeredByPhotos] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule');

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


  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <div className="p-4 pt-16 lg:pt-6 pb-8 space-y-6">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 -ml-2">
          <ChevronLeft className="h-4 w-4" />
          Voltar para Meus Cursos
        </Button>

        {/* Header - Simple text only */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold leading-tight">{classDetails.courseName || classDetails.name}</h1>
              <p className="text-muted-foreground text-sm">{classDetails.name}</p>
            </div>
            <Badge 
              className={`${
                classDetails.status === 'in_progress' 
                  ? 'bg-blue-100 text-blue-700' 
                  : classDetails.status === 'confirmed' || classDetails.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              } border-0 flex-shrink-0`}
            >
              {classDetails.status === 'in_progress' ? 'Em Andamento' : 
               classDetails.status === 'confirmed' || classDetails.status === 'active' ? 'Confirmado' : 'Pendente'}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {classDetails.startDate && (
              <Badge variant="outline" className="gap-1 text-xs rounded-full bg-muted/50">
                <Calendar className="h-3 w-3" />
                {format(parseISO(classDetails.startDate), "dd MMM", { locale: ptBR })}
                {classDetails.endDate && classDetails.endDate !== classDetails.startDate && (
                  <> - {format(parseISO(classDetails.endDate), "dd MMM yyyy", { locale: ptBR })}</>
                )}
              </Badge>
            )}
            {classDetails.location && (
              <Badge variant="outline" className="gap-1 text-xs rounded-full bg-muted/50">
                <MapPin className="h-3 w-3" />
                <span className="hidden sm:inline">Presencial - </span>{classDetails.location}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1 text-xs rounded-full bg-muted/50">
              <Users className="h-3 w-3" />
              {classDetails.enrolledCount} alunos
            </Badge>
          </div>
        </div>

        {/* Navigation Buttons - Two rows of pills */}
        <div className="space-y-2">
          {/* First row */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all ${
                activeTab === 'schedule' 
                  ? 'bg-primary border-primary text-primary-foreground shadow-md' 
                  : 'bg-card border-border hover:bg-muted hover:border-muted-foreground/30'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs font-medium">Cronograma</span>
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all ${
                activeTab === 'exams' 
                  ? 'bg-primary border-primary text-primary-foreground shadow-md' 
                  : 'bg-card border-border hover:bg-muted hover:border-muted-foreground/30'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs font-medium">Provas</span>
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all ${
                activeTab === 'photos' 
                  ? 'bg-primary border-primary text-primary-foreground shadow-md' 
                  : 'bg-card border-border hover:bg-muted hover:border-muted-foreground/30'
              }`}
            >
              <Camera className="h-5 w-5" />
              <span className="text-xs font-medium">Fotos</span>
            </button>
          </div>
          
          {/* Second row */}
          <div className={`grid gap-2 ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <button
              onClick={() => setActiveTab('network')}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all ${
                activeTab === 'network' 
                  ? 'bg-primary border-primary text-primary-foreground shadow-md' 
                  : 'bg-card border-border hover:bg-muted hover:border-muted-foreground/30'
              }`}
            >
              <Users className="h-5 w-5" />
              <span className="text-xs font-medium">Network</span>
            </button>
            <button
              onClick={() => setActiveTab('survey')}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all ${
                activeTab === 'survey' 
                  ? 'bg-primary border-primary text-primary-foreground shadow-md' 
                  : 'bg-card border-border hover:bg-muted hover:border-muted-foreground/30'
              }`}
            >
              <ClipboardList className="h-5 w-5" />
              <span className="text-xs font-medium">Pesquisa</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all ${
                  activeTab === 'admin' 
                    ? 'bg-primary border-primary text-primary-foreground shadow-md' 
                    : 'bg-card border-border hover:bg-muted hover:border-muted-foreground/30'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span className="text-xs font-medium">Gestão</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Contents - Use conditional rendering instead of Tabs */}
        <div className="space-y-4">

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              {classDetails.schedule.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Cronograma não disponível</p>
                    <p className="text-sm text-muted-foreground">O cronograma será disponibilizado em breve.</p>
                  </CardContent>
                </Card>
              ) : (
                <ScheduleTimeline schedule={classDetails.schedule} />
              )}
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <CourseGalleryViewer 
                classId={classId || ''} 
                isLocked={!hasDay1Completed && !isAdmin}
                onUnlockRequest={() => setDay1SurveyDialogOpen(true)}
              />
            </div>
          )}
          
          {/* Survey Tab */}
          {activeTab === 'survey' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Pesquisa de Satisfação
                  </CardTitle>
                  <CardDescription>
                    Sua opinião é muito importante para continuarmos evoluindo a formação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasDay1Completed ? (
                    <div className="text-center py-4">
                      <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3" />
                      <p className="font-medium">Pesquisa já respondida</p>
                      <p className="text-sm text-muted-foreground">Obrigado pela sua contribuição!</p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="font-medium mb-2">Responda nossa pesquisa</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        37 perguntas sobre as aulas, professores, monitores e infraestrutura.
                      </p>
                      <Button onClick={() => setDay1SurveyDialogOpen(true)}>
                        Responder Pesquisa
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Exams Tab */}
          {activeTab === 'exams' && (
            <div className="space-y-4">
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
                                className="bg-primary hover:bg-primary/90"
                                onClick={() => navigate(`/academy/exams/${exam.id}/take`)}
                              >
                                {attempted ? 'Refazer' : 'Iniciar'}
                              </Button>
                              {attempted && exam.lastAttemptId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/academy/exams/${exam.id}/results/${exam.lastAttemptId}`)}
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
            </div>
          )}

          {/* Network Tab - Classmates */}
          {activeTab === 'network' && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Network da Turma ({classDetails.students.length} alunos)
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Conheça seus colegas de turma e amplie sua rede de contatos profissionais
                  </p>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  {classDetails.students.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">Nenhum aluno matriculado</p>
                      <p className="text-sm text-muted-foreground">Os alunos aparecerão aqui quando forem matriculados</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {classDetails.students.map((student) => {
                        const isCurrentUser = student.id === user?.id;
                        return (
                          <div 
                            key={student.id} 
                            className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-all"
                          >
                            <Avatar className="h-11 w-11 sm:h-12 sm:w-12 flex-shrink-0">
                              <AvatarImage src={student.avatarUrl || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm">
                                {student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{student.name}</p>
                              {(student.city || student.state) && (
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  {student.city}{student.city && student.state ? ', ' : ''}{student.state}
                                </p>
                              )}
                            </div>
                            {!isCurrentUser && (
                              <Button 
                                size="sm"
                                variant="outline"
                                className="flex-shrink-0 gap-1.5 h-8 px-2 sm:px-3"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/academy/chat/${student.id}?name=${encodeURIComponent(student.name)}`);
                                }}
                              >
                                <MessageCircle className="h-4 w-4" />
                                <span className="hidden sm:inline text-xs">Mensagem</span>
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Admin Tab - Only for administrators */}
          {isAdmin && activeTab === 'admin' && (
            <div className="space-y-4">
              {/* Linked Exams Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
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
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
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
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
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
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{classDetails.schedule.length}</p>
                        <p className="text-xs text-muted-foreground">Dias de Aula</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
        
        {/* Day 1 Survey Dialog */}
        <Day1SurveyDialog
          open={day1SurveyDialogOpen}
          onOpenChange={setDay1SurveyDialogOpen}
          classId={classId || ''}
          onComplete={() => refetchDay1()}
        />
        
        {/* Satisfaction Survey Dialog */}
        <SatisfactionSurveyDialog
          open={surveyDialogOpen}
          onOpenChange={setSurveyDialogOpen}
          classId={classId || ''}
          showPhotosMessage={surveyTriggeredByPhotos}
          onComplete={() => {
            refetchSurvey();
            if (surveyTriggeredByPhotos) {
              setActiveTab('photos');
            }
          }}
        />
      </div>
    </div>
  );
}