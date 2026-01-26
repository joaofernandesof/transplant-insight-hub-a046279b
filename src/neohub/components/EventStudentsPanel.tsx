import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Users,
  Search,
  UserPlus,
  Trash2,
  GraduationCap,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  MapPin,
  Phone,
  Building2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import {
  useEnrollmentManagement,
  ClassEnrollmentWithDetails,
  AvailableStudent,
} from "@/academy/hooks/useEnrollmentManagement";
import { StudentDetailDialog } from "./StudentDetailDialog";

interface EventStudentsPanelProps {
  classId: string | null;
}

interface EnrichedEnrollment extends ClassEnrollmentWithDetails {
  avatarUrl?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  clinicName?: string | null;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "enrolled":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Matriculado
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-0">
          <AlertCircle className="h-3 w-3 mr-1" />
          Aguardando
        </Badge>
      );
    case "confirmed":
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-0">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Confirmado
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function EventStudentsPanel({ classId }: EventStudentsPanelProps) {
  const {
    getClassEnrollments,
    getAvailableStudents,
    bulkEnrollStudents,
    removeEnrollment,
    isEnrolling,
  } = useEnrollmentManagement();

  const [enrollments, setEnrollments] = useState<EnrichedEnrollment[]>([]);
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedStudent, setSelectedStudent] = useState<EnrichedEnrollment | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Load enriched enrollments when classId changes
  useEffect(() => {
    if (classId) {
      loadEnrichedEnrollments(classId);
    }
  }, [classId]);

  const loadEnrichedEnrollments = async (classId: string) => {
    setIsLoading(true);
    try {
      const baseEnrollments = await getClassEnrollments(classId);
      
      // Fetch additional user details
      const userIds = baseEnrollments.map(e => e.userId);
      if (userIds.length > 0) {
        const { data: userDetails } = await supabase
          .from("neohub_users")
          .select("user_id, avatar_url, phone, address_city, address_state, clinic_name")
          .in("user_id", userIds);

        const detailsMap = new Map(
          (userDetails || []).map(u => [u.user_id, u])
        );

        const enriched = baseEnrollments.map((e): EnrichedEnrollment => {
          const details = detailsMap.get(e.userId);
          return {
            ...e,
            avatarUrl: details?.avatar_url,
            phone: details?.phone,
            city: details?.address_city,
            state: details?.address_state,
            clinicName: details?.clinic_name,
          };
        });

        setEnrollments(enriched);
      } else {
        setEnrollments([]);
      }
    } catch (error) {
      console.error("Error loading enrollments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load available students when dialog opens
  useEffect(() => {
    if (showEnrollDialog && classId) {
      setIsLoadingStudents(true);
      getAvailableStudents(classId)
        .then(setAvailableStudents)
        .finally(() => setIsLoadingStudents(false));
    }
  }, [showEnrollDialog, classId]);

  const handleEnrollSelected = () => {
    if (!classId || selectedStudents.size === 0) return;
    bulkEnrollStudents({
      userIds: Array.from(selectedStudents),
      classId: classId,
    });
    setShowEnrollDialog(false);
    setSelectedStudents(new Set());
    // Refresh enrollments
    setTimeout(() => {
      loadEnrichedEnrollments(classId);
    }, 500);
  };

  const handleRemoveEnrollment = (enrollmentId: string) => {
    if (confirm("Tem certeza que deseja remover esta matrícula?")) {
      removeEnrollment(enrollmentId);
      setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
    }
  };

  const handleViewStudent = (enrollment: EnrichedEnrollment) => {
    setSelectedStudent(enrollment);
    setShowDetailDialog(true);
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

  const filteredEnrollments = enrollments.filter(
    e =>
      e.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.clinicName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Alunos Matriculados</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os alunos deste evento
          </p>
        </div>
        <Button onClick={() => setShowEnrollDialog(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Matricular Alunos
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{enrollments.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {enrollments.filter(e => e.status === "enrolled" || e.status === "confirmed").length}
              </p>
              <p className="text-xs text-muted-foreground">Confirmados</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {enrollments.filter(e => e.status === "pending").length}
              </p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <GraduationCap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{availableStudents.filter(s => !s.isEnrolled).length}</p>
              <p className="text-xs text-muted-foreground">Disponíveis</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email, cidade ou clínica..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Enrollments Table */}
      {filteredEnrollments.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Aluno</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((enrollment) => (
                  <TableRow 
                    key={enrollment.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewStudent(enrollment)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={enrollment.avatarUrl || undefined} alt={enrollment.studentName} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(enrollment.studentName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{enrollment.studentName}</p>
                          {enrollment.clinicName && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {enrollment.clinicName}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{enrollment.studentEmail}</p>
                        {enrollment.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {enrollment.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {enrollment.city || enrollment.state ? (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[enrollment.city, enrollment.state].filter(Boolean).join("/")}
                        </p>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(parseISO(enrollment.enrolledAt), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewStudent(enrollment);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveEnrollment(enrollment.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhum aluno matriculado</p>
            <p className="text-sm text-muted-foreground">Clique em "Matricular Alunos" para adicionar</p>
          </CardContent>
        </Card>
      )}

      {/* Student Detail Dialog */}
      <StudentDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        userId={selectedStudent?.userId || null}
        enrollmentInfo={selectedStudent ? {
          status: selectedStudent.status,
          enrolledAt: selectedStudent.enrolledAt,
          className: selectedStudent.className,
        } : undefined}
      />

      {/* Enroll Students Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Matricular Alunos</DialogTitle>
            <DialogDescription>
              Selecione os alunos para matricular neste evento
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
            >
              Matricular {selectedStudents.size > 0 ? `(${selectedStudents.size})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}