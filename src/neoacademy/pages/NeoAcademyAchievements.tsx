import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Loader2, Star, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const CATEGORY_LABELS: Record<string, string> = {
  learning: '📚 Aprendizado',
  consistency: '🔥 Consistência',
  social: '💬 Social',
  competition: '🏆 Competição',
};

export default function NeoAcademyAchievements() {
  const { user } = useUnifiedAuth();

  const { data: achievements, isLoading } = useQuery({
    queryKey: ['neoacademy-achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoacademy_achievements')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('points');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: unlocked } = useQuery({
    queryKey: ['neoacademy-user-achievements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('neoacademy_user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: userPoints } = useQuery({
    queryKey: ['neoacademy-my-points', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('neoacademy_user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  const unlockedIds = new Set(unlocked?.map(u => u.achievement_id) || []);
  const totalPoints = achievements?.reduce((sum, a) => sum + (a.points || 0), 0) || 0;
  const earnedPoints = achievements?.filter(a => unlockedIds.has(a.id)).reduce((sum, a) => sum + (a.points || 0), 0) || 0;

  // Group by category
  const categories = [...new Set(achievements?.map(a => a.category) || [])];

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-3">
          <Star className="h-5 w-5 text-yellow-400" />
          <h1 className="text-lg font-bold text-white">Conquistas</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 pt-6 space-y-8">
        {/* Overview */}
        <div className="p-5 rounded-xl bg-gradient-to-r from-amber-900/20 to-violet-900/20 border border-amber-500/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-zinc-400">Progresso Total</p>
              <p className="text-2xl font-bold text-white">
                {unlockedIds.size}/{achievements?.length || 0} Conquistas
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400">Pontos Ganhos</p>
              <p className="text-2xl font-bold text-amber-400">{earnedPoints}</p>
            </div>
          </div>
          <Progress value={totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0} className="h-2 bg-white/5" />
        </div>

        {/* By category */}
        {categories.map(cat => {
          const catAchievements = achievements?.filter(a => a.category === cat) || [];
          return (
            <div key={cat}>
              <h2 className="text-sm font-bold text-white mb-4">
                {CATEGORY_LABELS[cat || 'general'] || cat}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {catAchievements.map(ach => {
                  const isUnlocked = unlockedIds.has(ach.id);
                  return (
                    <div
                      key={ach.id}
                      className={cn(
                        "relative p-4 rounded-xl border text-center transition-all",
                        isUnlocked
                          ? 'bg-gradient-to-b from-amber-900/20 to-transparent border-amber-500/30 shadow-lg shadow-amber-500/5'
                          : 'bg-[#14141f] border-white/5 opacity-60'
                      )}
                    >
                      {!isUnlocked && (
                        <div className="absolute top-2 right-2">
                          <Lock className="h-3.5 w-3.5 text-zinc-600" />
                        </div>
                      )}
                      <div className="text-3xl mb-2">{ach.icon}</div>
                      <h3 className={cn(
                        "text-xs font-bold mb-1",
                        isUnlocked ? 'text-white' : 'text-zinc-500'
                      )}>
                        {ach.name}
                      </h3>
                      <p className="text-[10px] text-zinc-600 line-clamp-2">{ach.description}</p>
                      <div className={cn(
                        "mt-2 text-[10px] font-bold",
                        isUnlocked ? 'text-amber-400' : 'text-zinc-700'
                      )}>
                        +{ach.points} pts
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
