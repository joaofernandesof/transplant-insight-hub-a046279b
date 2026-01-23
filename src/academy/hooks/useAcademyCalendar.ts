import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { toast } from "sonner";

export interface CalendarCourse {
  id: string;
  code: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  status: 'in_progress' | 'confirmed' | 'pending' | 'completed';
  courseId: string | null;
  courseName: string | null;
  maxStudents: number | null;
  isEnrolled: boolean;
  enrollmentStatus: string | null;
}

export function useAcademyCalendar() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  const { data: classes = [], isLoading, error, refetch } = useQuery({
    queryKey: ["academy-calendar", user?.id],
    queryFn: async () => {
      // First get all classes
      const { data: classesData, error: classesError } = await supabase
        .from("course_classes")
        .select(`
          id,
          code,
          name,
          start_date,
          end_date,
          location,
          status,
          max_students,
          course_id,
          courses (
            id,
            title
          )
        `)
        .in("status", ["active", "in_progress", "confirmed", "pending"])
        .order("start_date", { ascending: true, nullsFirst: false });

      if (classesError) {
        console.error("Error fetching calendar:", classesError);
        return [];
      }

      // Get user enrollments if logged in
      let enrollments: Record<string, string> = {};
      if (user?.id) {
        const { data: enrollData } = await supabase
          .from("class_enrollments")
          .select("class_id, status")
          .eq("user_id", user.id);
        
        if (enrollData) {
          enrollments = enrollData.reduce((acc, e) => {
            acc[e.class_id] = e.status;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      return (classesData || []).map((item): CalendarCourse => {
        const course = item.courses as any;
        const locationParts = item.location?.split(" - ") || [];
        const cityState = locationParts[locationParts.length - 1] || "";
        const cityMatch = cityState.split(",");
        
        return {
          id: item.id,
          code: item.code,
          name: item.name,
          startDate: item.start_date,
          endDate: item.end_date,
          location: item.location,
          city: cityMatch[0]?.trim() || null,
          state: cityMatch[1]?.trim() || null,
          status: mapStatus(item.status),
          courseId: item.course_id,
          courseName: course?.title || null,
          maxStudents: item.max_students,
          isEnrolled: !!enrollments[item.id],
          enrollmentStatus: enrollments[item.id] || null,
        };
      });
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (classId: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("class_enrollments")
        .insert({
          class_id: classId,
          user_id: user.id,
          status: "pending"
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação de matrícula enviada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["academy-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["academy-enrollments"] });
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("Você já está matriculado nesta turma.");
      } else {
        toast.error("Erro ao solicitar matrícula: " + error.message);
      }
    }
  });

  return {
    classes,
    isLoading,
    error,
    refetch,
    enrollInClass: enrollMutation.mutate,
    isEnrolling: enrollMutation.isPending,
  };
}

function mapStatus(status: string): 'in_progress' | 'confirmed' | 'pending' | 'completed' {
  switch (status) {
    case 'in_progress':
      return 'in_progress';
    case 'confirmed':
    case 'active':
      return 'confirmed';
    case 'completed':
      return 'completed';
    default:
      return 'pending';
  }
}
