import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  icon: string;
  points: number;
  requirement_type: string;
  requirement_value: number | null;
  is_active: boolean;
  order_index: number | null;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export interface AchievementWithStatus extends Achievement {
  isUnlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  progressMax?: number;
}

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [recentUnlock, setRecentUnlock] = useState<Achievement | null>(null);

  const fetchAchievements = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .eq("is_active", true)
        .order("order_index");

      if (achievementsError) throw achievementsError;

      // Fetch user's unlocked achievements
      const { data: userAchievements, error: userError } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id);

      if (userError) throw userError;

      // Fetch progress data
      const [lessonsResult, enrollmentsResult, leadsResult, referralsResult, profileResult] = await Promise.all([
        supabase.from("user_lesson_progress").select("id").eq("user_id", user.id),
        supabase.from("user_course_enrollments").select("id, status").eq("user_id", user.id),
        supabase.from("leads").select("id, status").eq("claimed_by", user.id),
        supabase.from("referral_leads").select("id").eq("referrer_user_id", user.id),
        supabase.from("profiles").select("created_at, onboarding_completed, name, email, phone, clinic_name, city, state").eq("user_id", user.id).maybeSingle()
      ]);

      const lessonsCompleted = lessonsResult.data?.length || 0;
      const coursesEnrolled = enrollmentsResult.data?.length || 0;
      const coursesCompleted = enrollmentsResult.data?.filter(e => e.status === "completed").length || 0;
      const leadsClaimed = leadsResult.data?.length || 0;
      const leadsConverted = leadsResult.data?.filter(l => l.status === "converted").length || 0;
      const referralsMade = referralsResult.data?.length || 0;
      const onboardingComplete = profileResult.data?.onboarding_completed || false;
      const materialsViewed = localStorage.getItem(`materials_viewed_${user.id}`) === "true";
      
      // Profile completeness check
      const profile = profileResult.data;
      const profileFields = [profile?.name, profile?.email, profile?.phone, profile?.clinic_name, profile?.city, profile?.state];
      const profileComplete = profileFields.filter(f => f && f.trim() !== "").length >= 5;

      // Days as member
      const createdAt = profileResult.data?.created_at ? new Date(profileResult.data.created_at) : new Date();
      const daysMember = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // Create progress map
      const progressMap: Record<string, { current: number; max: number }> = {
        onboarding_complete: { current: onboardingComplete ? 1 : 0, max: 1 },
        profile_complete: { current: profileComplete ? 1 : 0, max: 1 },
        materials_viewed: { current: materialsViewed ? 1 : 0, max: 1 },
        courses_enrolled: { current: coursesEnrolled, max: 0 },
        lessons_completed: { current: lessonsCompleted, max: 0 },
        courses_completed: { current: coursesCompleted, max: 0 },
        leads_claimed: { current: leadsClaimed, max: 0 },
        leads_converted: { current: leadsConverted, max: 0 },
        referrals_made: { current: referralsMade, max: 0 },
        days_member: { current: daysMember, max: 0 }
      };

      // Map unlocked achievements
      const unlockedMap = new Map(userAchievements?.map(ua => [ua.achievement_id, ua.unlocked_at]) || []);

      // Combine achievements with status
      const achievementsWithStatus: AchievementWithStatus[] = (allAchievements || []).map(achievement => {
        const progress = progressMap[achievement.requirement_type];
        const requirementValue = achievement.requirement_value || 1;
        
        return {
          ...achievement,
          isUnlocked: unlockedMap.has(achievement.id),
          unlockedAt: unlockedMap.get(achievement.id),
          progress: progress?.current || 0,
          progressMax: requirementValue
        };
      });

      setAchievements(achievementsWithStatus);

      // Calculate total points
      const points = achievementsWithStatus
        .filter(a => a.isUnlocked)
        .reduce((sum, a) => sum + a.points, 0);
      setTotalPoints(points);

    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const unlockAchievement = useCallback(async (achievementCode: string) => {
    if (!user?.id) return false;

    try {
      // Find the achievement
      const achievement = achievements.find(a => a.code === achievementCode);
      if (!achievement || achievement.isUnlocked) return false;

      // Insert user achievement
      const { error } = await supabase
        .from("user_achievements")
        .insert({
          user_id: user.id,
          achievement_id: achievement.id
        });

      if (error) {
        if (error.code === "23505") return false; // Already exists
        throw error;
      }

      // Update local state
      setAchievements(prev => prev.map(a => 
        a.code === achievementCode 
          ? { ...a, isUnlocked: true, unlockedAt: new Date().toISOString() }
          : a
      ));

      // Update total points
      setTotalPoints(prev => prev + achievement.points);

      // Update profile total_points
      await supabase
        .from("profiles")
        .update({ total_points: totalPoints + achievement.points })
        .eq("user_id", user.id);

      // Show notification
      setRecentUnlock(achievement);
      toast.success(`🏆 Conquista desbloqueada: ${achievement.name}!`, {
        description: `+${achievement.points} pontos`
      });

      return true;
    } catch (error) {
      console.error("Error unlocking achievement:", error);
      return false;
    }
  }, [user?.id, achievements, totalPoints]);

  const checkAndUnlockAchievements = useCallback(async () => {
    if (!user?.id || isLoading) return;

    for (const achievement of achievements) {
      if (achievement.isUnlocked) continue;

      const progress = achievement.progress || 0;
      const required = achievement.progressMax || 1;

      if (progress >= required) {
        await unlockAchievement(achievement.code);
      }
    }
  }, [user?.id, achievements, isLoading, unlockAchievement]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Auto-check achievements when data loads
  useEffect(() => {
    if (!isLoading && achievements.length > 0) {
      checkAndUnlockAchievements();
    }
  }, [isLoading, achievements.length]);

  const dismissRecentUnlock = () => setRecentUnlock(null);

  const getAchievementsByCategory = (category: string) => 
    achievements.filter(a => a.category === category);

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;

  return {
    achievements,
    totalPoints,
    unlockedCount,
    totalCount: achievements.length,
    isLoading,
    recentUnlock,
    dismissRecentUnlock,
    unlockAchievement,
    checkAndUnlockAchievements,
    getAchievementsByCategory,
    refreshAchievements: fetchAchievements
  };
}
