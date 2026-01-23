import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

export interface ScheduleItem {
  id: string;
  startTime: string;
  endTime: string;
  activity: string;
  location: string | null;
  instructor: string | null;
  notes: string | null;
}

export interface ScheduleDay {
  id: string;
  dayNumber: number;
  dayDate: string | null;
  dayTitle: string;
  dayTheme: string | null;
  items: ScheduleItem[];
}

export interface ClassExam {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  passingScore: number | null;
  availableFrom: string | null;
  availableUntil: string | null;
  isActive: boolean;
  attemptCount: number;
  bestScore: number | null;
  passed: boolean;
  lastAttemptId: string | null;
}

export interface ClassStudent {
  id: string;
  name: string;
  avatarUrl: string | null;
  city: string | null;
  state: string | null;
  enrollmentStatus: string;
  enrolledAt: string;
}

export interface ClassDetails {
  id: string;
  code: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  status: string;
  maxStudents: number | null;
  courseId: string | null;
  courseName: string | null;
  courseDescription: string | null;
  schedule: ScheduleDay[];
  exams: ClassExam[];
  students: ClassStudent[];
  enrolledCount: number;
}

export function useClassDetails(classId: string | null) {
  const { user } = useUnifiedAuth();

  const { data: classDetails, isLoading, error, refetch } = useQuery({
    queryKey: ["class-details", classId],
    queryFn: async (): Promise<ClassDetails | null> => {
      if (!classId) return null;

      // Fetch class info
      const { data: classData, error: classError } = await supabase
        .from("course_classes")
        .select(`
          id, code, name, start_date, end_date, location, status, max_students, course_id,
          courses (id, title, description)
        `)
        .eq("id", classId)
        .single();

      if (classError) {
        console.error("Error fetching class:", classError);
        return null;
      }

      // Fetch schedule
      const { data: scheduleData } = await supabase
        .from("class_schedule")
        .select(`
          id, day_number, day_date, day_title, day_theme,
          class_schedule_items (id, start_time, end_time, activity, location, instructor, notes, order_index)
        `)
        .eq("class_id", classId)
        .order("day_number", { ascending: true });

      // Fetch exams for this class (all exams for admin, only active for students)
      const { data: examsData } = await supabase
        .from("exams")
        .select(`
          id, title, description, duration_minutes, passing_score, 
          available_from, available_until, is_active
        `)
        .eq("class_id", classId);

      // Fetch user's exam attempts
      let examAttempts: Record<string, { count: number; bestScore: number | null; passed: boolean; lastAttemptId: string | null }> = {};
      if (user?.authUserId && examsData) {
        const examIds = examsData.map(e => e.id);
        const { data: attemptsData } = await supabase
          .from("exam_attempts")
          .select("id, exam_id, score, status, submitted_at")
          .eq("user_id", user.authUserId)
          .in("exam_id", examIds)
          .in("status", ["passed", "failed"]) // Only completed attempts
          .order("submitted_at", { ascending: false });

        if (attemptsData) {
          for (const attempt of attemptsData) {
            if (!examAttempts[attempt.exam_id]) {
              examAttempts[attempt.exam_id] = { count: 0, bestScore: null, passed: false, lastAttemptId: attempt.id };
            }
            examAttempts[attempt.exam_id].count++;
            if (attempt.score !== null) {
              if (examAttempts[attempt.exam_id].bestScore === null || attempt.score > examAttempts[attempt.exam_id].bestScore) {
                examAttempts[attempt.exam_id].bestScore = attempt.score;
              }
            }
            if (attempt.status === 'passed') {
              examAttempts[attempt.exam_id].passed = true;
            }
          }
        }
      }

      // Fetch enrolled students with profiles in a single query
      const { data: enrollmentsData } = await supabase
        .from("class_enrollments")
        .select(`
          id, status, enrolled_at, user_id
        `)
        .eq("class_id", classId)
        .order("enrolled_at", { ascending: true });

      // Fetch student profiles - handle large arrays by batching
      let students: ClassStudent[] = [];
      if (enrollmentsData && enrollmentsData.length > 0) {
        const userIds = enrollmentsData.map(e => e.user_id);
        
        // Batch requests in groups of 100 to avoid query size limits
        const batchSize = 100;
        const batches: string[][] = [];
        for (let i = 0; i < userIds.length; i += batchSize) {
          batches.push(userIds.slice(i, i + batchSize));
        }
        
        const profilesResults = await Promise.all(
          batches.map(batch =>
            supabase
              .from("profiles")
              // Only fetch non-sensitive data: no email/phone for privacy
              .select("user_id, name, avatar_url, city, state")
              .in("user_id", batch)
          )
        );
        
        const allProfiles = profilesResults.flatMap(result => result.data || []);
        const profileMap = new Map(allProfiles.map(p => [p.user_id, p]));

        students = enrollmentsData.map(enrollment => {
          const profile = profileMap.get(enrollment.user_id);
          return {
            id: enrollment.id,
            name: profile?.name || "Aluno",
            avatarUrl: profile?.avatar_url || null,
            city: profile?.city || null,
            state: profile?.state || null,
            enrollmentStatus: enrollment.status,
            enrolledAt: enrollment.enrolled_at,
          };
        });
      }

      const course = classData.courses as any;

      return {
        id: classData.id,
        code: classData.code,
        name: classData.name,
        startDate: classData.start_date,
        endDate: classData.end_date,
        location: classData.location,
        status: classData.status,
        maxStudents: classData.max_students,
        courseId: classData.course_id,
        courseName: course?.title || null,
        courseDescription: course?.description || null,
        schedule: (scheduleData || []).map(day => ({
          id: day.id,
          dayNumber: day.day_number,
          dayDate: day.day_date,
          dayTitle: day.day_title,
          dayTheme: day.day_theme,
          items: ((day.class_schedule_items || []) as any[])
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            .map(item => ({
              id: item.id,
              startTime: item.start_time,
              endTime: item.end_time,
              activity: item.activity,
              location: item.location,
              instructor: item.instructor,
              notes: item.notes,
            })),
        })),
        exams: (examsData || []).map(exam => ({
          id: exam.id,
          title: exam.title,
          description: exam.description,
          durationMinutes: exam.duration_minutes,
          passingScore: exam.passing_score,
          availableFrom: exam.available_from,
          availableUntil: exam.available_until,
          isActive: exam.is_active || false,
          attemptCount: examAttempts[exam.id]?.count || 0,
          bestScore: examAttempts[exam.id]?.bestScore || null,
          passed: examAttempts[exam.id]?.passed || false,
          lastAttemptId: examAttempts[exam.id]?.lastAttemptId || null,
        })),
        students,
        enrolledCount: enrollmentsData?.length || 0,
      };
    },
    enabled: !!classId,
  });

  return {
    classDetails,
    isLoading,
    error,
    refetch,
  };
}
