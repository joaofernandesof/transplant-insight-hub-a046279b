import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "@/components/ModuleLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  Trophy, 
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Search,
  Download,
  BarChart3,
  FileText,
  Filter,
  RotateCcw,
  FileSpreadsheet,
  Loader2
} from "lucide-react";
import { useExams, useAllExamAttempts, useCourseClasses, useExamQuestions } from "@/hooks/useExams";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { ExamUploadDialog } from "@/components/admin/ExamUploadDialog";
import { ExamManagementTable } from "@/components/admin/ExamManagementTable";
import { AttemptAnswersDialog } from "@/components/admin/AttemptAnswersDialog";

export default function ExamsAdmin() {
  const navigate = useNavigate();
  
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isExportingGabarito, setIsExportingGabarito] = useState(false);
  
  const { data: exams, isLoading: examsLoading, refetch: refetchExams } = useExams();
  const { data: allAttempts, isLoading: attemptsLoading, refetch: refetchAttempts } = useAllExamAttempts();
  const { data: classes, isLoading: classesLoading } = useCourseClasses();

  const isLoading = examsLoading || attemptsLoading || classesLoading;

  // Filter attempts
  const filteredAttempts = useMemo(() => {
    if (!allAttempts) return [];
    
    return allAttempts.filter(attempt => {
      const matchesExam = selectedExamId === 'all' || attempt.exam_id === selectedExamId;
      const matchesClass = selectedClassId === 'all' || attempt.class_id === selectedClassId;
      const matchesSearch = !searchQuery || 
        attempt.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attempt.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attempt.profiles?.clinic_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesExam && matchesClass && matchesSearch;
    });
  }, [allAttempts, selectedExamId, selectedClassId, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    if (!filteredAttempts.length) return { total: 0, approved: 0, avgScore: 0 };
    
    const approved = filteredAttempts.filter(a => {
      const exam = exams?.find(e => e.id === a.exam_id);
      return a.score && exam && a.score >= exam.passing_score;
    }).length;
    
    const avgScore = filteredAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / filteredAttempts.length;
    
    return {
      total: filteredAttempts.length,
      approved,
      avgScore
    };
  }, [filteredAttempts, exams]);

  const getExamTitle = (examId: string) => {
    return exams?.find(e => e.id === examId)?.title || 'Prova';
  };

  const getExamPassingScore = (examId: string) => {
    return exams?.find(e => e.id === examId)?.passing_score || 70;
  };

  const exportToCSV = () => {
    if (!filteredAttempts.length) return;
    
    const headers = ['Aluno', 'Email', 'Clínica', 'Prova', 'Nota', 'Status', 'Data'];
    const rows = filteredAttempts.map(a => [
      a.profiles?.name || '-',
      a.profiles?.email || '-',
      a.profiles?.clinic_name || '-',
      getExamTitle(a.exam_id),
      a.score?.toFixed(1) || '0',
      (a.score || 0) >= getExamPassingScore(a.exam_id) ? 'Aprovado' : 'Reprovado',
      a.submitted_at ? format(new Date(a.submitted_at), 'dd/MM/yyyy HH:mm') : '-'
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados-provas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Exportar gabarito de todas as provas em Excel
  const exportGabaritoExcel = async () => {
    setIsExportingGabarito(true);
    try {
      // Buscar todas as questões com as provas
      const { data: questions, error } = await supabase
        .from('exam_questions')
        .select(`
          id,
          exam_id,
          order_index,
          correct_answer,
          exams!inner(title)
        `)
        .order('exam_id')
        .order('order_index');

      if (error) throw error;

      if (!questions || questions.length === 0) {
        toast.error('Nenhuma questão encontrada');
        return;
      }

      // Agrupar por prova
      const examGroups = questions.reduce((acc, q) => {
        const examTitle = (q.exams as any)?.title || 'Prova';
        if (!acc[examTitle]) acc[examTitle] = [];
        acc[examTitle].push(q);
        return acc;
      }, {} as Record<string, typeof questions>);

      // Criar workbook
      const wb = XLSX.utils.book_new();

      // Criar uma aba para cada prova - apenas nº e resposta correta
      Object.entries(examGroups).forEach(([examTitle, examQuestions]) => {
        // Ordenar por order_index para garantir ordem correta
        const sortedQuestions = [...examQuestions].sort((a, b) => 
          (a.order_index || 0) - (b.order_index || 0)
        );
        
        const sheetData = sortedQuestions.map((q, idx) => ({
          'Questão': q.order_index || idx + 1,
          'Resposta': q.correct_answer
        }));

        const ws = XLSX.utils.json_to_sheet(sheetData);
        
        // Ajustar largura das colunas
        ws['!cols'] = [
          { wch: 10 },  // Questão
          { wch: 10 },  // Resposta
        ];

        // Nome da aba (max 31 chars)
        const sheetName = examTitle.length > 31 ? examTitle.slice(0, 28) + '...' : examTitle;
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      // Download
      XLSX.writeFile(wb, `gabarito-provas-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success('Gabarito exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar gabarito:', error);
      toast.error('Erro ao exportar gabarito');
    } finally {
      setIsExportingGabarito(false);
    }
  };

  // Reset de todas as tentativas de provas
  const handleResetAllAttempts = async () => {
    setIsResetting(true);
    try {
      // Deletar todas as respostas primeiro (FK constraint)
      // Usando 'id' com not.is.null para pegar todos
      const { error: answersError } = await supabase
        .from('exam_answers')
        .delete()
        .not('id', 'is', null);

      if (answersError) throw answersError;

      // Deletar todas as tentativas
      const { error: attemptsError } = await supabase
        .from('exam_attempts')
        .delete()
        .not('id', 'is', null);

      if (attemptsError) throw attemptsError;

      toast.success('Todas as provas foram resetadas com sucesso!');
      refetchAttempts();
    } catch (error) {
      console.error('Erro ao resetar provas:', error);
      toast.error('Erro ao resetar provas');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <ModuleLayout>
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between pl-12 lg:pl-0">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/university/exams')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Painel de Resultados
                </h1>
                <p className="text-sm text-muted-foreground">
                  Acompanhe as notas dos alunos nas provas
                </p>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <ExamUploadDialog onSuccess={() => refetchExams()} />
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportGabaritoExcel}
                disabled={isExportingGabarito}
              >
                {isExportingGabarito ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">Gabarito Excel</span>
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Resetar Provas</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Resetar todas as provas?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá apagar <strong>todas</strong> as tentativas de provas de <strong>todos</strong> os alunos. 
                      Isso permitirá que eles refaçam as provas novamente. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleResetAllAttempts}
                      disabled={isResetting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isResetting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Resetando...
                        </>
                      ) : (
                        'Sim, resetar tudo'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 w-full overflow-x-hidden">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Provas Realizadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {stats.approved} ({stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(0) : 0}%)
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">Aprovados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {stats.avgScore.toFixed(1)}%
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">Média Geral</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exam Management Table */}
        <div className="mb-6">
          <ExamManagementTable />
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou clínica..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrar por prova" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as provas</SelectItem>
                  {exams?.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrar por turma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as turmas</SelectItem>
                  {classes?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={exportToCSV} disabled={!filteredAttempts.length}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultados dos Alunos</CardTitle>
            <CardDescription>
              {filteredAttempts.length} resultado(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredAttempts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Prova</TableHead>
                      <TableHead className="text-center">Nota</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttempts.map((attempt) => {
                      const passingScore = getExamPassingScore(attempt.exam_id);
                      const passed = (attempt.score || 0) >= passingScore;
                      
                      return (
                        <TableRow key={attempt.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {attempt.profiles?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{attempt.profiles?.name || 'Aluno'}</p>
                                <p className="text-xs text-muted-foreground">{attempt.profiles?.clinic_name || attempt.profiles?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{getExamTitle(attempt.exam_id)}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn(
                              "text-sm font-semibold",
                              passed ? "text-emerald-600" : "text-red-600"
                            )}>
                              {attempt.score?.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={passed ? "default" : "destructive"} className="text-xs">
                              {passed ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Aprovado
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reprovado
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {attempt.submitted_at 
                                ? format(new Date(attempt.submitted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                                : '-'
                              }
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <AttemptAnswersDialog
                              attemptId={attempt.id}
                              studentName={attempt.profiles?.name || 'Aluno'}
                              examTitle={getExamTitle(attempt.exam_id)}
                              score={attempt.score || 0}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum resultado encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </ModuleLayout>
  );
}