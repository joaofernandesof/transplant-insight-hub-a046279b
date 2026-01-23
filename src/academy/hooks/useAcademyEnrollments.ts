import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

export interface PresentialEnrollment {
  id: string;
  classId: string;
  className: string;
  classCode: string;
  courseId: string;
  courseName: string;
  courseDescription: string;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  status: string;
  enrollmentStatus: string;
  maxStudents: number | null;
  currentStudents?: number;
}

export function useAcademyEnrollments() {
  const { user } = useUnifiedAuth();
  
  const { data: enrollments = [], isLoading, error, refetch } = useQuery({
    queryKey: ["academy-enrollments", user?.authUserId],
    queryFn: async () => {
      if (!user?.authUserId) return [];
      
      // Get class enrollments with course and class details
      const { data, error } = await supabase
        .from("class_enrollments")
        .select(`
          id,
          status,
          class_id,
          course_classes (
            id,
            code,
            name,
            start_date,
            end_date,
            location,
            status,
            max_students,
            courses (
              id,
              title,
              description,
              thumbnail_url
            )
          )
        `)
        .eq("user_id", user.authUserId);
      
      if (error) {
        console.error("Error fetching enrollments:", error);
        return [];
      }
      
      // Transform data
      return (data || []).map((enrollment): PresentialEnrollment => {
        const classData = enrollment.course_classes as any;
        const courseData = classData?.courses as any;
        
        return {
          id: enrollment.id,
          classId: enrollment.class_id,
          className: classData?.name || "Turma",
          classCode: classData?.code || "",
          courseId: courseData?.id || "",
          courseName: courseData?.title || "Curso",
          courseDescription: courseData?.description || "",
          startDate: classData?.start_date || null,
          endDate: classData?.end_date || null,
          location: classData?.location || null,
          status: classData?.status || "pending",
          enrollmentStatus: enrollment.status || "enrolled",
          maxStudents: classData?.max_students || null,
        };
      });
    },
    enabled: !!user?.authUserId,
  });

  // Map course title to type
  const mapCourseType = (courseName: string): 'formacao360' | 'instrumentador' | 'fellowship' | 'licenca' | 'monitor' => {
    const name = courseName.toLowerCase();
    if (name.includes("formação 360") || name.includes("formacao 360")) return "formacao360";
    if (name.includes("instrumentador")) return "instrumentador";
    if (name.includes("fellowship")) return "fellowship";
    if (name.includes("licença") || name.includes("licenca")) return "licenca";
    if (name.includes("monitor")) return "monitor";
    return "formacao360";
  };

  // Map class status to enrollment status
  const mapStatus = (classStatus: string, enrollmentStatus: string): 'confirmed' | 'pending' | 'completed' | 'in_progress' => {
    if (enrollmentStatus === "completed") return "completed";
    if (classStatus === "active" || classStatus === "confirmed") return "confirmed";
    if (classStatus === "in_progress") return "in_progress";
    return "pending";
  };

  // Transform enrollments to PresentialCourse format for the component
  const presentialCourses = enrollments.map(enrollment => ({
    id: enrollment.id,
    name: enrollment.courseName,
    description: enrollment.courseDescription,
    duration: enrollment.courseName.toLowerCase().includes("fellowship") ? "180h" : "60h",
    type: mapCourseType(enrollment.courseName),
    startDate: enrollment.startDate,
    endDate: enrollment.endDate,
    city: enrollment.location?.split(" - ").pop()?.split(",")[0] || null,
    state: enrollment.location?.match(/\b([A-Z]{2})\b/)?.[1] || null,
    status: mapStatus(enrollment.status, enrollment.enrollmentStatus),
    spotsAvailable: undefined,
    totalSpots: enrollment.maxStudents || undefined,
  }));

  return {
    enrollments,
    presentialCourses,
    isLoading,
    error,
    refetch,
  };
}
