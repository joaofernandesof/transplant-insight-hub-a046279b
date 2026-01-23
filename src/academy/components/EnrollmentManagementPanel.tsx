import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  Users,
  Search,
  UserPlus,
  Trash2,
  Calendar,
  GraduationCap,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useEnrollmentManagement,
  ClassEnrollmentWithDetails,
  AvailableStudent,
  CourseClass,
} from "../hooks/useEnrollmentManagement";

function getStatusBadge(status: string) {
  switch (status) {
    case "in_progress":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0">
          <Clock className="h-3 w-3 mr-1" />
          Em Andamento
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
          A Confirmar
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          {status}
        </Badge>
      );
  }
}

export function EnrollmentManagementPanel() {
  const {
    classes,
    isLoadingClasses,
    getClassEnrollments,
    getAvailableStudents,
    enrollStudent,
    bulkEnrollStudents,
    removeEnrollment,
    isEnrolling,
  } = useEnrollmentManagement();

  const [selectedClass, setSelectedClass] = useState<CourseClass | null>(null);
  const [enrollments, setEnrollments] = useState<ClassEnrollmentWithDetails[]>([]);
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  // Load enrollments when class is selected
  useEffect(() => {
    if (selectedClass) {
      setIsLoadingEnrollments(true);
      getClassEnrollments(selectedClass.id)
        .then(setEnrollments)
        .finally(() => setIsLoadingEnrollments(false));
    }
  }, [selectedClass]);

  // Load available students when dialog opens
  useEffect(() => {
    if (showEnrollDialog && selectedClass) {
      setIsLoadingStudents(true);
      getAvailableStudents(selectedClass.id)
        .then(setAvailableStudents)
        .finally(() => setIsLoadingStudents(false));
    }
  }, [showEnrollDialog, selectedClass]);

  const handleSelectClass = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    setSelectedClass(cls || null);
  };

  const handleEnrollSelected = () => {
    if (!selectedClass || selectedStudents.size === 0) return;
    bulkEnrollStudents({
      userIds: Array.from(selectedStudents),
      classId: selectedClass.id,
    });
    setShowEnrollDialog(false);
    setSelectedStudents(new Set());
    // Refresh enrollments
    setTimeout(() => {
      getClassEnrollments(selectedClass.id).then(setEnrollments);
    }, 500);
  };

  const handleRemoveEnrollment = (enrollmentId: string) => {
    if (confirm("Tem certeza que deseja remover esta matrícula?")) {
      removeEnrollment(enrollmentId);
      setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
    }
  };

  const toggleStudent = (userId: string) => {
    const newSet = new Set(selectedStudents);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedStudents(newSet);
  };

  const selectAllNotEnrolled = () => {
    const notEnrolled = availableStudents.filter(s => !s.isEnrolled);
    setSelectedStudents(new Set(notEnrolled.map(s => s.userId)));
  };

  const filteredStudents = availableStudents.filter(
    s =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Class Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
            Gerenciar Matrículas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedClass?.id || ""} onValueChange={handleSelectClass}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma turma..." />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  <div className="flex items-center gap-2">
                    <span>{cls.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {cls.enrolledCount} alunos
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Selected Class Details */}
      {selectedClass && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">{selectedClass.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedClass.courseName} • {selectedClass.code}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(selectedClass.status)}
              <Button onClick={() => setShowEnrollDialog(true)} size="sm" className="gap-1.5">
                <UserPlus className="h-4 w-4" />
                Matricular Alunos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 rounded-lg bg-muted">
                <div className="text-2xl font-bold">{enrollments.length}</div>
                <p className="text-xs text-muted-foreground">Matriculados</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <div className="text-2xl font-bold">{selectedClass.maxStudents || "∞"}</div>
                <p className="text-xs text-muted-foreground">Capacidade</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <div className="text-2xl font-bold">
                  {selectedClass.startDate
                    ? format(parseISO(selectedClass.startDate), "dd/MM", { locale: ptBR })
                    : "—"}
                </div>
                <p className="text-xs text-muted-foreground">Início</p>
              </div>
            </div>

            {/* Enrollments Table */}
            {isLoadingEnrollments ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : enrollments.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">{enrollment.studentName}</TableCell>
                        <TableCell className="text-muted-foreground">{enrollment.studentEmail}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {enrollment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveEnrollment(enrollment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum aluno matriculado nesta turma</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enroll Students Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Matricular Alunos</DialogTitle>
            <DialogDescription>
              Selecione os alunos para matricular em {selectedClass?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Search and Select All */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm" onClick={selectAllNotEnrolled}>
                Selecionar Todos
              </Button>
            </div>

            {/* Selected count */}
            {selectedStudents.size > 0 && (
              <Badge className="w-fit">
                {selectedStudents.size} aluno(s) selecionado(s)
              </Badge>
            )}

            {/* Students List */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              {isLoadingStudents ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredStudents.map((student) => (
                    <label
                      key={student.userId}
                      className={`flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer ${
                        student.isEnrolled ? "opacity-50" : ""
                      }`}
                    >
                      <Checkbox
                        checked={selectedStudents.has(student.userId) || student.isEnrolled}
                        disabled={student.isEnrolled}
                        onCheckedChange={() => toggleStudent(student.userId)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{student.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                      </div>
                      {student.isEnrolled && (
                        <Badge variant="secondary" className="text-xs">
                          Já matriculado
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnrollDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEnrollSelected}
              disabled={selectedStudents.size === 0 || isEnrolling}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Matricular {selectedStudents.size > 0 ? `(${selectedStudents.size})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
