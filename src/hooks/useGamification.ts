import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Points config
const POINTS = {
  lead_acquired: 10,
  lead_sold: 50,
  lead_in_service: 15,
  fast_response: 25,    // Acquired within 5 min of release
  streak_bonus: 10,     // Per day of streak
};

// Level thresholds
export const LEVELS = [
  { level: 1, name: 'Bronze', minPoints: 0, color: '#CD7F32', icon: '🥉' },
  { level: 2, name: 'Prata', minPoints: 100, color: '#C0C0C0', icon: '🥈' },
  { level: 3, name: 'Ouro', minPoints: 300, color: '#FFD700', icon: '🥇' },
  { level: 4, name: 'Platina', minPoints: 600, color: '#E5E4E2', icon: '💎' },
  { level: 5, name: 'Diamante', minPoints: 1000, color: '#B9F2FF', icon: '👑' },
  { level: 6, name: 'Lendário', minPoints: 2000, color: '#FF6B35', icon: '🔥' },
];

// Achievement definitions
export const ACHIEVEMENTS = [
  { code: 'first_lead', name: 'Primeiro Passo', description: 'Adquiriu o primeiro lead', icon: '🎯', requirement: { action: 'lead_acquired', count: 1 } },
  { code: 'five_leads', name: 'Caçador', description: 'Adquiriu 5 leads', icon: '🏹', requirement: { action: 'lead_acquired', count: 5 } },
  { code: 'twenty_leads', name: 'Veterano', description: 'Adquiriu 20 leads', icon: '⚔️', requirement: { action: 'lead_acquired', count: 20 } },
  { code: 'fifty_leads', name: 'Mestre', description: 'Adquiriu 50 leads', icon: '🏆', requirement: { action: 'lead_acquired', count: 50 } },
  { code: 'first_sale', name: 'Vendedor Nato', description: 'Converteu o primeiro lead', icon: '💰', requirement: { action: 'lead_sold', count: 1 } },
  { code: 'five_sales', name: 'Máquina de Vendas', description: 'Converteu 5 leads', icon: '🚀', requirement: { action: 'lead_sold', count: 5 } },
  { code: 'twenty_sales', name: 'Top Closer', description: 'Converteu 20 leads', icon: '🌟', requirement: { action: 'lead_sold', count: 20 } },
  { code: 'speed_demon', name: 'Raio', description: 'Capturou lead em menos de 5 minutos', icon: '⚡', requirement: { action: 'fast_response', count: 1 } },
  { code: 'streak_3', name: 'Consistente', description: '3 dias consecutivos ativo', icon: '🔥', requirement: { action: 'streak', count: 3 } },
  { code: 'streak_7', name: 'Imparável', description: '7 dias consecutivos ativo', icon: '💪', requirement: { action: 'streak', count: 7 } },
  { code: 'streak_30', name: 'Lendário', description: '30 dias consecutivos ativo', icon: '👑', requirement: { action: 'streak', count: 30 } },
];

export interface GamificationProfile {
  total_points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  achievements_unlocked: string[];
}

export function getLevelInfo(points: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }
  const progressToNext = next
    ? ((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100
    : 100;
  return { current, next, progressToNext: Math.min(100, progressToNext) };
}

export function useGamification() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentPoints, setRecentPoints] = useState<{ action: string; points: number; created_at: string }[]>([]);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('hotlead_gamification_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          total_points: data.total_points,
          level: data.level,
          current_streak: data.current_streak,
          longest_streak: data.longest_streak,
          last_active_date: data.last_active_date,
          achievements_unlocked: data.achievements_unlocked || [],
        });
      } else {
        // Create profile
        const { data: newProfile, error: insertError } = await supabase
          .from('hotlead_gamification_profiles')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (!insertError && newProfile) {
          setProfile({
            total_points: 0,
            level: 1,
            current_streak: 0,
            longest_streak: 0,
            last_active_date: null,
            achievements_unlocked: [],
          });
        }
      }
    } catch (err) {
      console.error('Error fetching gamification profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const fetchRecentPoints = useCallback(async () => {
    if (!user?.id) return;
    
    const { data } = await supabase
      .from('hotlead_gamification_points')
      .select('action, points, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    setRecentPoints(data || []);
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
    fetchRecentPoints();
  }, [fetchProfile, fetchRecentPoints]);

  const awardPoints = useCallback(async (
    action: string,
    leadId?: string,
    metadata?: Record<string, any>
  ) => {
    if (!user?.id || !profile) return;

    const points = POINTS[action as keyof typeof POINTS] || 0;
    if (points === 0) return;

    try {
      // Insert points record
      await supabase
        .from('hotlead_gamification_points')
        .insert({
          user_id: user.id,
          action,
          points,
          lead_id: leadId || null,
          metadata: metadata || {},
        });

      // Update streak
      const today = new Date().toISOString().split('T')[0];
      let newStreak = profile.current_streak;
      let longestStreak = profile.longest_streak;

      if (profile.last_active_date) {
        const lastDate = new Date(profile.last_active_date);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
        // diffDays === 0: same day, keep streak
      } else {
        newStreak = 1;
      }
      
      longestStreak = Math.max(longestStreak, newStreak);

      // Calculate new total and level
      const newTotal = profile.total_points + points;
      const levelInfo = getLevelInfo(newTotal);
      const newLevel = levelInfo.current.level;

      // Check for new achievements
      const newAchievements = [...profile.achievements_unlocked];
      
      // Count actions for achievement checks
      const { count: acquiredCount } = await supabase
        .from('hotlead_gamification_points')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', 'lead_acquired');

      const { count: soldCount } = await supabase
        .from('hotlead_gamification_points')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', 'lead_sold');

      const { count: fastCount } = await supabase
        .from('hotlead_gamification_points')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', 'fast_response');

      for (const achievement of ACHIEVEMENTS) {
        if (newAchievements.includes(achievement.code)) continue;

        let unlocked = false;
        const req = achievement.requirement;
        
        if (req.action === 'lead_acquired' && (acquiredCount || 0) >= req.count) unlocked = true;
        if (req.action === 'lead_sold' && (soldCount || 0) >= req.count) unlocked = true;
        if (req.action === 'fast_response' && (fastCount || 0) >= req.count) unlocked = true;
        if (req.action === 'streak' && newStreak >= req.count) unlocked = true;

        if (unlocked) {
          newAchievements.push(achievement.code);
          toast.success(`🏅 Conquista desbloqueada: ${achievement.icon} ${achievement.name}!`, {
            description: achievement.description,
            duration: 5000,
          });
        }
      }

      // Level up notification
      if (newLevel > profile.level) {
        const lvl = LEVELS.find(l => l.level === newLevel);
        toast.success(`⬆️ Level Up! ${lvl?.icon} ${lvl?.name}`, {
          description: `Você alcançou o nível ${newLevel}!`,
          duration: 5000,
        });
      }

      // Update profile
      await supabase
        .from('hotlead_gamification_profiles')
        .update({
          total_points: newTotal,
          level: newLevel,
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_active_date: today,
          achievements_unlocked: newAchievements,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // Update local state
      setProfile({
        total_points: newTotal,
        level: newLevel,
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_active_date: today,
        achievements_unlocked: newAchievements,
      });

      // Show points popup
      const actionLabels: Record<string, string> = {
        lead_acquired: 'Lead adquirido',
        lead_sold: 'Lead vendido',
        lead_in_service: 'Em atendimento',
        fast_response: 'Resposta rápida',
        streak_bonus: 'Bônus de streak',
      };

      toast(`+${points} pontos! ${actionLabels[action] || action}`, {
        duration: 3000,
      });

      fetchRecentPoints();
    } catch (err) {
      console.error('Error awarding points:', err);
    }
  }, [user?.id, profile, fetchRecentPoints]);

  return {
    profile,
    isLoading,
    recentPoints,
    awardPoints,
    refreshProfile: fetchProfile,
  };
}
