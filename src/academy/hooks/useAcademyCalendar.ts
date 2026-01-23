import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
}

export function useAcademyCalendar() {
  const { data: classes = [], isLoading, error, refetch } = useQuery({
    queryKey: ["academy-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
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

      if (error) {
        console.error("Error fetching calendar:", error);
        return [];
      }

      return (data || []).map((item): CalendarCourse => {
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
        };
      });
    },
  });

  return {
    classes,
    isLoading,
    error,
    refetch,
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
