import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  FileText, 
  BookOpen, 
  Clock, 
  Target,
  Settings2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useAllExams, useCourses, useToggleExamStatus, useUpdateExamCourse } from "@/hooks/useExams";
import { toast } from "sonner";

type StatusFilter = 'all' | 'active' | 'inactive';

export function ExamManagementTable() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: exams, isLoading: examsLoading } = useAllExams();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const toggleStatus = useToggleExamStatus();
  const updateCourse = useUpdateExamCourse();
  
  const isLoading = examsLoading || coursesLoading;

  const filteredExams = exams?.filter(exam => {
    if (statusFilter === 'active') return exam.is_active;
    if (statusFilter === 'inactive') return !exam.is_active;
    return true;
  }) || [];

  const activeCount = exams?.filter(e => e.is_active).length || 0;
  const inactiveCount = exams?.filter(e => !e.is_active).length || 0;

  const handleToggleStatus = async (examId: string, currentStatus: boolean) => {
    try {
      await toggleStatus.mutateAsync({ examId, isActive: !currentStatus });
      toast.success(currentStatus ? 'Prova desativada' : 'Prova ativada');
    } catch (error) {
      toast.error('Erro ao alterar status da prova');
    }
  };

  const handleCourseChange = async (examId: string, courseId: string) => {
    try {
      await updateCourse.mutateAsync({ 
        examId, 
        courseId: courseId === 'none' ? null : courseId 
      });
      toast.success('Curso atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar curso');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                <Settings2 className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Gerenciar Provas</CardTitle>
                  <CardDescription className="text-xs">
                    Ative ou desative provas e vincule a cursos
                  </CardDescription>
                </div>
              </div>
            </CollapsibleTrigger>
            
            {isOpen && (
              <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <TabsList>
                  <TabsTrigger value="all" className="gap-2">
                    Todas
                    <Badge variant="secondary" className="ml-1">{exams?.length || 0}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="active" className="gap-2">
                    <Eye className="h-3 w-3" />
                    Ativas
                    <Badge variant="default" className="ml-1 bg-emerald-500">{activeCount}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="inactive" className="gap-2">
                    <EyeOff className="h-3 w-3" />
                    Inativas
                    <Badge variant="secondary" className="ml-1">{inactiveCount}</Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            {filteredExams.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prova</TableHead>
                  <TableHead>Curso Vinculado</TableHead>
                  <TableHead className="text-center">Duração</TableHead>
                  <TableHead className="text-center">Nota Mínima</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{exam.title}</p>
                          {exam.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {exam.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={exam.course_id || 'none'}
                        onValueChange={(value) => handleCourseChange(exam.id, value)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Selecionar curso" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground">Nenhum curso</span>
                          </SelectItem>
                          {courses?.map(course => (
                            <SelectItem key={course.id} value={course.id}>
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-3 w-3" />
                                {course.title}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {exam.duration_minutes} min
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="gap-1">
                        <Target className="h-3 w-3" />
                        {exam.passing_score}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={exam.is_active}
                          onCheckedChange={() => handleToggleStatus(exam.id, exam.is_active)}
                        />
                        <Badge 
                          variant={exam.is_active ? "default" : "secondary"}
                          className={exam.is_active ? "bg-emerald-500" : ""}
                        >
                          {exam.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {statusFilter === 'active' 
                ? 'Nenhuma prova ativa' 
                : statusFilter === 'inactive'
                ? 'Nenhuma prova inativa'
                : 'Nenhuma prova cadastrada'}
            </p>
          </div>
        )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
