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
  action?: () => void;
}

export function useFirstSteps() {
  const { user } = useAuth();
  const [profileComplete, setProfileComplete] = useState(false);
  const [hasTakenTour, setHasTakenTour] = useState(false);
  const [hasConfiguredNotifications, setHasConfiguredNotifications] = useState(false);
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
          setProfileComplete(filledFields.length >= 5);
        }

        // Check if user has taken the tour
        const tourCompleted = localStorage.getItem(`tour_completed_${user.id}`);
        setHasTakenTour(tourCompleted === "true");

        // Check if user has configured notifications
        const notificationsConfigured = localStorage.getItem(`notifications_configured_${user.id}`);
        setHasConfiguredNotifications(notificationsConfigured === "true");

      } catch (error) {
        console.error("Error checking first steps progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkProgress();
  }, [user?.id]);

  const markTourCompleted = () => {
    if (user?.id) {
      localStorage.setItem(`tour_completed_${user.id}`, "true");
      setHasTakenTour(true);
    }
  };

  const markNotificationsConfigured = () => {
    if (user?.id) {
      localStorage.setItem(`notifications_configured_${user.id}`, "true");
      setHasConfiguredNotifications(true);
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
      id: "tour",
      title: "Fazer tour no sistema",
      description: "Conheça todos os módulos e funcionalidades",
      route: "/home",
      isCompleted: hasTakenTour,
      isLoading,
      action: () => {
        window.dispatchEvent(new CustomEvent('startOnboardingTour'));
      }
    },
    {
      id: "notifications",
      title: "Configurar notificações",
      description: "Escolha como deseja receber avisos",
      route: "/profile",
      isCompleted: hasConfiguredNotifications,
      isLoading
    }
  ], [profileComplete, hasTakenTour, hasConfiguredNotifications, isLoading]);

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
    markTourCompleted,
    markNotificationsConfigured
  };
}
