import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Settings,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Users,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CourseClass {
  id: string;
  name: string;
  code: string;
  course_id: string | null;
  courseName: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  max_students: number | null;
  location: string | null;
  instructor_notes: string | null;
  enrolledCount: number;
}

interface Course {
  id: string;
  title: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "in_progress":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0">
          <Clock className="h-3 w-3 mr-1" />
          Em Andamento
        </Badge>
      );
    case "active":
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-0">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Ativa
        </Badge>
      );
    case "confirmed":
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-0">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Confirmada
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-0">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pendente
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300 border-0">
          Concluída
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

const initialFormData = {
  name: "",
  code: "",
  course_id: "",
  start_date: "",
  end_date: "",
  status: "pending",
  max_students: "",
  location: "",
  instructor_notes: "",
};

export function ClassSettingsPanel() {
  const queryClient = useQueryClient();
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<CourseClass | null>(null);
  const [deletingClass, setDeletingClass] = useState<CourseClass | null>(null);
  const [formData, setFormData] = useState(initialFormData);

  // Fetch courses for dropdown
  const { data: courses = [] } = useQuery({
    queryKey: ["courses-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title")
        .eq("is_published", true)
        .order("title");
      if (error) throw error;
      return data as Course[];
    },
  });

  // Fetch classes with enrollment counts
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["admin-classes-settings"],
    queryFn: async () => {
      const { data: classesData, error } = await supabase
        .from("course_classes")
        .select(`
          id,
          name,
          code,
          course_id,
          start_date,
          end_date,
          status,
          max_students,
          location,
          instructor_notes,
          courses(title)
        `)
        .order("start_date", { ascending: false, nullsFirst: true });

      if (error) throw error;

      // Get enrollment counts
      const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("class_id");

      const countMap: Record<string, number> = {};
      enrollments?.forEach((e) => {
        countMap[e.class_id] = (countMap[e.class_id] || 0) + 1;
      });

      return classesData.map((c) => ({
        ...c,
        courseName: (c.courses as any)?.title || "Sem curso",
        enrolledCount: countMap[c.id] || 0,
      })) as CourseClass[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        name: data.name,
        code: data.code,
        course_id: data.course_id || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        status: data.status,
        max_students: data.max_students ? parseInt(data.max_students) : null,
        location: data.location || null,
        instructor_notes: data.instructor_notes || null,
      };

      if (editingClass) {
        const { error } = await supabase
          .from("course_classes")
          .update(payload)
          .eq("id", editingClass.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("course_classes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classes-settings"] });
      toast.success(editingClass ? "Turma atualizada!" : "Turma criada!");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (classId: string) => {
      // First delete enrollments
      await supabase.from("class_enrollments").delete().eq("class_id", classId);
      // Then delete the class
      const { error } = await supabase
        .from("course_classes")
        .delete()
        .eq("id", classId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classes-settings"] });
      toast.success("Turma excluída!");
      setShowDeleteDialog(false);
      setDeletingClass(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  const handleOpenCreate = () => {
    setEditingClass(null);
    setFormData(initialFormData);
    setShowFormDialog(true);
  };

  const handleOpenEdit = (cls: CourseClass) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      code: cls.code,
      course_id: cls.course_id || "",
      start_date: cls.start_date || "",
      end_date: cls.end_date || "",
      status: cls.status,
      max_students: cls.max_students?.toString() || "",
      location: cls.location || "",
      instructor_notes: cls.instructor_notes || "",
    });
    setShowFormDialog(true);
  };

  const handleOpenDelete = (cls: CourseClass) => {
    setDeletingClass(cls);
    setShowDeleteDialog(true);
  };

  const handleCloseDialog = () => {
    setShowFormDialog(false);
    setEditingClass(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      toast.error("Nome e código são obrigatórios");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-600" />
            Gerenciar Turmas
          </CardTitle>
          <Button onClick={handleOpenCreate} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nova Turma
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Crie, edite ou exclua turmas. Cada turma pode ser vinculada a um
            curso e ter configurações específicas de datas, capacidade e local.
          </p>
        </CardContent>
      </Card>

      {/* Classes Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma turma cadastrada</p>
              <Button
                onClick={handleOpenCreate}
                variant="outline"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira turma
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turma</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Alunos</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cls.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {cls.code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {cls.courseName}
                      </TableCell>
                      <TableCell>
                        {cls.start_date ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(cls.start_date), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                            {cls.end_date && (
                              <>
                                {" - "}
                                {format(parseISO(cls.end_date), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })}
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            A definir
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(cls.status)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {cls.enrolledCount}
                          {cls.max_students && `/${cls.max_students}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenEdit(cls)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleOpenDelete(cls)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingClass ? "Editar Turma" : "Nova Turma"}
            </DialogTitle>
            <DialogDescription>
              {editingClass
                ? "Atualize as informações da turma"
                : "Preencha os dados para criar uma nova turma"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Turma *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Turma Janeiro 2026"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  placeholder="Ex: F360-JAN26"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course">Curso</Label>
              <Select
                value={formData.course_id}
                onValueChange={(v) =>
                  setFormData({ ...formData, course_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um curso..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data Início</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Data Fim</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="confirmed">Confirmada</SelectItem>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_students">Capacidade Máx.</Label>
                <Input
                  id="max_students"
                  type="number"
                  placeholder="Ex: 25"
                  value={formData.max_students}
                  onChange={(e) =>
                    setFormData({ ...formData, max_students: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Local</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="Ex: Brasília - DF"
                  className="pl-10"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas do Instrutor</Label>
              <Textarea
                id="notes"
                placeholder="Observações internas..."
                rows={3}
                value={formData.instructor_notes}
                onChange={(e) =>
                  setFormData({ ...formData, instructor_notes: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saveMutation.isPending
                  ? "Salvando..."
                  : editingClass
                  ? "Salvar Alterações"
                  : "Criar Turma"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Turma</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a turma{" "}
              <strong>{deletingClass?.name}</strong>?
              {deletingClass && deletingClass.enrolledCount > 0 && (
                <span className="block mt-2 text-red-600">
                  ⚠️ Esta turma possui {deletingClass.enrolledCount} aluno(s)
                  matriculado(s). Todas as matrículas serão removidas.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingClass && deleteMutation.mutate(deletingClass.id)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
