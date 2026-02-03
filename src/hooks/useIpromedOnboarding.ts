/**
 * Hook para gerenciar o onboarding/tour do IPROMED
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useIpromedOnboarding() {
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkTourStatus = () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      const tourCompleted = localStorage.getItem(`ipromed_tour_completed_${user.id}`);
      
      // Show tour if not completed
      if (!tourCompleted) {
        setShowTour(true);
      }
      
      setIsLoading(false);
    };

    checkTourStatus();
  }, [user?.id]);

  const completeTour = () => {
    setShowTour(false);
  };

  const resetTour = () => {
    if (user?.id) {
      localStorage.removeItem(`ipromed_tour_completed_${user.id}`);
      setShowTour(true);
    }
  };

  const startTour = () => {
    setShowTour(true);
  };

  return {
    showTour,
    isLoading,
    completeTour,
    resetTour,
    startTour,
  };
}
