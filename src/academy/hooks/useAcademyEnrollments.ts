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
  const { user, isAdmin } = useUnifiedAuth();
  
  // Use authUserId consistently (maps to auth.uid() for RLS)
  const userId = user?.authUserId || user?.userId;
  
  const { data: enrollments = [], isLoading, error, refetch } = useQuery({
    queryKey: ["academy-enrollments", userId, isAdmin],
    queryFn: async () => {
      if (!userId) {
        console.log("[useAcademyEnrollments] No userId available");
        return [];
      }
      
      console.log("[useAcademyEnrollments] Fetching enrollments for userId:", userId, "isAdmin:", isAdmin);
      
      // Admin sees ALL classes, regular users see only their enrollments
      if (isAdmin) {
        // Admin: Fetch all classes directly
        const { data: allClasses, error: classesError } = await supabase
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
            courses (
              id,
              title,
              description,
              thumbnail_url
            )
          `)
          .order("start_date", { ascending: false });
        
        if (classesError) {
          console.error("[useAcademyEnrollments] Admin - Error fetching all classes:", classesError);
          return [];
        }
        
        console.log("[useAcademyEnrollments] Admin - All classes:", allClasses?.length);
        
        // Transform to enrollment format for consistency
        return (allClasses || []).map((classData: any): PresentialEnrollment => {
          const courseData = classData.courses as any;
          return {
            id: classData.id,
            classId: classData.id,
            className: classData.name || "Turma",
            classCode: classData.code || "",
            courseId: courseData?.id || "",
            courseName: courseData?.title || "Curso",
            courseDescription: courseData?.description || "",
            startDate: classData.start_date || null,
            endDate: classData.end_date || null,
            location: classData.location || null,
            status: classData.status || "pending",
            enrollmentStatus: "admin", // Special status for admin view
            maxStudents: classData.max_students || null,
          };
        });
      }
      
      // Regular user: Get only their class enrollments
      const { data, error } = await supabase
        .from("class_enrollments")
        .select(`
          id,
          status,
          class_id,
          user_id,
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
        .eq("user_id", userId);
      
      if (error) {
        console.error("[useAcademyEnrollments] Error fetching enrollments:", error);
        return [];
      }
      
      console.log("[useAcademyEnrollments] Raw data:", data);
      
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
    enabled: !!userId,
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
    // Admin viewing all classes - map based on class status
    if (enrollmentStatus === "admin") {
      if (classStatus === "in_progress") return "in_progress";
      if (classStatus === "active" || classStatus === "confirmed") return "confirmed";
      if (classStatus === "completed") return "completed";
      return "confirmed"; // Default for admin view
    }
    if (enrollmentStatus === "completed") return "completed";
    if (classStatus === "active" || classStatus === "confirmed") return "confirmed";
    if (classStatus === "in_progress") return "in_progress";
    return "pending";
  };

  // Transform enrollments to PresentialCourse format for the component
  // Sort by start_date (oldest to newest), nulls at the end
  const presentialCourses = enrollments
    .map(enrollment => ({
      id: enrollment.id,
      classId: enrollment.classId, // Adiciona o classId para navegação
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
    }))
    .sort((a, b) => {
      // Courses with null dates go to the end
      if (!a.startDate && !b.startDate) return 0;
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      // Sort by start date (oldest first)
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

  return {
    enrollments,
    presentialCourses,
    isLoading,
    error,
    refetch,
  };
}
