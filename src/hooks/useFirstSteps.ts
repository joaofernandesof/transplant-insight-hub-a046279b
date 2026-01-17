import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FirstStep {
  id: string;
  title: string;
  description: string;
  route: string;
  isCompleted: boolean;
  isLoading: boolean;
}

export function useFirstSteps() {
  const { user } = useAuth();
  const [profileComplete, setProfileComplete] = useState(false);
  const [hasWatchedLesson, setHasWatchedLesson] = useState(false);
  const [hasViewedMaterials, setHasViewedMaterials] = useState(false);
  const [hasEnrolledCourse, setHasEnrolledCourse] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkProgress = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Check profile completeness
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, email, phone, clinic_name, city, state, avatar_url, crm")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile) {
          const requiredFields = [profile.name, profile.email, profile.phone, profile.clinic_name, profile.city, profile.state];
          const filledFields = requiredFields.filter(field => field && field.trim() !== "");
          setProfileComplete(filledFields.length >= 5); // At least 5 of 6 required fields
        }

        // Check if user has watched any lesson
        const { data: lessonProgress } = await supabase
          .from("user_lesson_progress")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        setHasWatchedLesson(lessonProgress && lessonProgress.length > 0);

        // Check if user has enrolled in any course
        const { data: enrollments } = await supabase
          .from("user_course_enrollments")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        setHasEnrolledCourse(enrollments && enrollments.length > 0);

        // For materials, we'll use localStorage to track if user visited the page
        const viewedMaterials = localStorage.getItem(`materials_viewed_${user.id}`);
        setHasViewedMaterials(viewedMaterials === "true");

      } catch (error) {
        console.error("Error checking first steps progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkProgress();
  }, [user?.id]);

  const markMaterialsViewed = () => {
    if (user?.id) {
      localStorage.setItem(`materials_viewed_${user.id}`, "true");
      setHasViewedMaterials(true);
    }
  };

  const steps: FirstStep[] = useMemo(() => [
    {
      id: "profile",
      title: "Completar seu perfil",
      description: "Adicione sua foto, dados da clínica e contato",
      route: "/profile",
      isCompleted: profileComplete,
      isLoading
    },
    {
      id: "course",
      title: "Iniciar um curso",
      description: "Matricule-se em um curso da Universidade",
      route: "/university",
      isCompleted: hasEnrolledCourse,
      isLoading
    },
    {
      id: "lesson",
      title: "Assistir primeira aula",
      description: "Complete sua primeira lição",
      route: "/university",
      isCompleted: hasWatchedLesson,
      isLoading
    },
    {
      id: "materials",
      title: "Explorar materiais",
      description: "Conheça POPs, scripts e documentos",
      route: "/materials",
      isCompleted: hasViewedMaterials,
      isLoading
    }
  ], [profileComplete, hasEnrolledCourse, hasWatchedLesson, hasViewedMaterials, isLoading]);

  const completedCount = steps.filter(s => s.isCompleted).length;
  const totalSteps = steps.length;
  const progressPercent = (completedCount / totalSteps) * 100;
  const allCompleted = completedCount === totalSteps;

  return {
    steps,
    completedCount,
    totalSteps,
    progressPercent,
    allCompleted,
    isLoading,
    markMaterialsViewed
  };
}
