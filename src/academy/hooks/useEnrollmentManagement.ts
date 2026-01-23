import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClassEnrollmentWithDetails {
  id: string;
  userId: string;
  classId: string;
  status: string;
  enrolledAt: string;
  studentName: string;
  studentEmail: string;
  className: string;
  classCode: string;
  courseName: string;
}

export interface AvailableStudent {
  neohubId: string;
  userId: string;
  fullName: string;
  email: string;
  isEnrolled: boolean;
}

export interface CourseClass {
  id: string;
  name: string;
  code: string;
  courseName: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  enrolledCount: number;
  maxStudents: number | null;
}

export function useEnrollmentManagement() {
  const queryClient = useQueryClient();

  // Fetch all classes with enrollment counts
  const { data: classes = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ["admin-classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_classes")
        .select(`
          id,
          name,
          code,
          start_date,
          end_date,
          status,
          max_students,
          courses (title)
        `)
        .order("start_date", { ascending: false, nullsFirst: true });

      if (error) throw error;

      // Get enrollment counts
      const classIds = data.map(c => c.id);
      const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("class_id")
        .in("class_id", classIds);

      const countMap = new Map<string, number>();
      (enrollments || []).forEach(e => {
        countMap.set(e.class_id, (countMap.get(e.class_id) || 0) + 1);
      });

      return data.map((c): CourseClass => ({
        id: c.id,
        name: c.name,
        code: c.code,
        courseName: (c.courses as any)?.title || "Curso",
        startDate: c.start_date,
        endDate: c.end_date,
        status: c.status,
        enrolledCount: countMap.get(c.id) || 0,
        maxStudents: c.max_students,
      }));
    },
  });

  // Fetch enrollments for a specific class
  const getClassEnrollments = async (classId: string): Promise<ClassEnrollmentWithDetails[]> => {
    const { data, error } = await supabase
      .from("class_enrollments")
      .select(`
        id,
        user_id,
        class_id,
        status,
        enrolled_at,
        course_classes (
          name,
          code,
          courses (title)
        )
      `)
      .eq("class_id", classId);

    if (error) throw error;

    // Get student details
    const userIds = data.map(e => e.user_id);
    const { data: students } = await supabase
      .from("neohub_users")
      .select("user_id, full_name, email")
      .in("user_id", userIds);

    const studentMap = new Map((students || []).map(s => [s.user_id, s]));

    return data.map((e): ClassEnrollmentWithDetails => {
      const student = studentMap.get(e.user_id);
      const classData = e.course_classes as any;
      return {
        id: e.id,
        userId: e.user_id,
        classId: e.class_id,
        status: e.status,
        enrolledAt: e.enrolled_at,
        studentName: student?.full_name || "Aluno",
        studentEmail: student?.email || "",
        className: classData?.name || "",
        classCode: classData?.code || "",
        courseName: classData?.courses?.title || "",
      };
    }).sort((a, b) => a.studentName.localeCompare(b.studentName));
  };

  // Fetch available students (with aluno profile) for enrollment
  const getAvailableStudents = async (classId: string): Promise<AvailableStudent[]> => {
    // Get users with aluno profile
    const { data: profileAssignments } = await supabase
      .from("user_profile_assignments")
      .select("user_id")
      .eq("profile_id", "15ff5857-30b9-4862-a646-ffce72c200dc"); // aluno profile

    if (!profileAssignments?.length) return [];

    const userIds = profileAssignments.map(pa => pa.user_id);

    // Get neohub user details
    const { data: users } = await supabase
      .from("neohub_users")
      .select("id, user_id, full_name, email")
      .in("id", userIds)
      .eq("is_active", true);

    if (!users?.length) return [];

    // Get current enrollments for this class
    const { data: enrollments } = await supabase
      .from("class_enrollments")
      .select("user_id")
      .eq("class_id", classId);

    const enrolledUserIds = new Set((enrollments || []).map(e => e.user_id));

    return users.map((u): AvailableStudent => ({
      neohubId: u.id,
      userId: u.user_id,
      fullName: u.full_name,
      email: u.email,
      isEnrolled: enrolledUserIds.has(u.user_id),
    })).sort((a, b) => a.fullName.localeCompare(b.fullName));
  };

  // Enroll student in class
  const enrollStudent = useMutation({
    mutationFn: async ({ userId, classId }: { userId: string; classId: string }) => {
      const { error } = await supabase
        .from("class_enrollments")
        .insert({
          user_id: userId,
          class_id: classId,
          status: "enrolled",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Aluno matriculado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
    },
    onError: (error: any) => {
      console.error("Error enrolling student:", error);
      toast.error(error.message?.includes("duplicate") 
        ? "Aluno já está matriculado nesta turma" 
        : "Erro ao matricular aluno");
    },
  });

  // Bulk enroll students
  const bulkEnrollStudents = useMutation({
    mutationFn: async ({ userIds, classId }: { userIds: string[]; classId: string }) => {
      const enrollments = userIds.map(userId => ({
        user_id: userId,
        class_id: classId,
        status: "enrolled",
      }));

      const { error } = await supabase
        .from("class_enrollments")
        .upsert(enrollments, { onConflict: "user_id,class_id" });

      if (error) throw error;
    },
    onSuccess: (_, { userIds }) => {
      toast.success(`${userIds.length} aluno(s) matriculado(s) com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
    },
    onError: (error) => {
      console.error("Error bulk enrolling students:", error);
      toast.error("Erro ao matricular alunos");
    },
  });

  // Remove enrollment
  const removeEnrollment = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from("class_enrollments")
        .delete()
        .eq("id", enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Matrícula removida com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
    },
    onError: (error) => {
      console.error("Error removing enrollment:", error);
      toast.error("Erro ao remover matrícula");
    },
  });

  return {
    classes,
    isLoadingClasses,
    getClassEnrollments,
    getAvailableStudents,
    enrollStudent: enrollStudent.mutate,
    bulkEnrollStudents: bulkEnrollStudents.mutate,
    removeEnrollment: removeEnrollment.mutate,
    isEnrolling: enrollStudent.isPending || bulkEnrollStudents.isPending,
  };
}
