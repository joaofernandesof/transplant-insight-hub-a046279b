import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking onboarding status:", error);
          setIsLoading(false);
          return;
        }

        // Show onboarding if not completed
        if (data && !data.onboarding_completed) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user?.id]);

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  const resetOnboarding = async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from("profiles")
        .update({ 
          onboarding_completed: false,
          onboarding_completed_at: null
        })
        .eq("user_id", user.id);

      setShowOnboarding(true);
    } catch (error) {
      console.error("Error resetting onboarding:", error);
    }
  };

  return {
    showOnboarding,
    isLoading,
    completeOnboarding,
    resetOnboarding
  };
}
