import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Loader2, Trophy, Medal, Flame, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const LEVEL_NAMES: Record<number, { name: string; color: string }> = {
  1: { name: 'Iniciante', color: 'text-zinc-400' },
  2: { name: 'Aprendiz', color: 'text-emerald-400' },
  3: { name: 'Dedicado', color: 'text-blue-400' },
  4: { name: 'Avançado', color: 'text-violet-400' },
  5: { name: 'Expert', color: 'text-amber-400' },
  6: { name: 'Mestre', color: 'text-rose-400' },
};

export default function NeoAcademyRanking() {
  const { user } = useUnifiedAuth();

  const { data: ranking, isLoading } = useQuery({
    queryKey: ['neoacademy-ranking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoacademy_user_points')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  const myRank = ranking?.findIndex(r => r.user_id === user?.id);
  const myData = myRank !== undefined && myRank >= 0 ? ranking?.[myRank] : null;

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <h1 className="text-lg font-bold text-white">Ranking</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-6 space-y-6">
        {/* My stats card */}
        {myData && (
          <div className="p-5 rounded-xl bg-gradient-to-r from-violet-900/30 to-fuchsia-900/30 border border-violet-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 mb-1">Sua Posição</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-white">#{(myRank ?? 0) + 1}</span>
                  <div>
                    <p className={cn("text-sm font-semibold", LEVEL_NAMES[myData.level || 1]?.color || 'text-white')}>
                      Nível {myData.level} - {LEVEL_NAMES[myData.level || 1]?.name || 'Iniciante'}
                    </p>
                    <p className="text-xs text-zinc-500">{myData.total_points} pontos</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <Flame className="h-5 w-5 text-orange-400 mx-auto" />
                  <p className="text-lg font-bold text-white">{myData.streak_days}</p>
                  <p className="text-[10px] text-zinc-500">Sequência</p>
                </div>
                <div>
                  <TrendingUp className="h-5 w-5 text-emerald-400 mx-auto" />
                  <p className="text-lg font-bold text-white">{myData.lessons_completed}</p>
                  <p className="text-[10px] text-zinc-500">Aulas</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Podium */}
        {ranking && ranking.length >= 3 && (
          <div className="flex items-end justify-center gap-3 py-6">
            {[ranking[1], ranking[0], ranking[2]].map((r, idx) => {
              const position = idx === 0 ? 2 : idx === 1 ? 1 : 3;
              const heights = { 1: 'h-28', 2: 'h-20', 3: 'h-16' };
              const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
              return (
                <div key={r?.user_id || idx} className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">
                    {r?.user_id?.slice(0, 2).toUpperCase() || '?'}
                  </div>
                  <span className="text-lg">{medals[position as keyof typeof medals]}</span>
                  <div className={cn(
                    "w-20 rounded-t-lg flex items-center justify-center",
                    heights[position as keyof typeof heights],
                    position === 1 ? 'bg-gradient-to-t from-amber-500/30 to-amber-500/10 border border-amber-500/30' :
                    position === 2 ? 'bg-gradient-to-t from-zinc-400/20 to-zinc-400/5 border border-zinc-400/20' :
                    'bg-gradient-to-t from-amber-700/20 to-amber-700/5 border border-amber-700/20'
                  )}>
                    <span className="text-sm font-bold text-white">{r?.total_points || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full ranking list */}
        <div className="space-y-2">
          {ranking?.map((r: any, idx: number) => (
            <div
              key={r.id}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl transition",
                r.user_id === user?.id
                  ? 'bg-violet-500/10 border border-violet-500/20'
                  : 'bg-[#14141f] border border-white/5'
              )}
            >
              <span className={cn(
                "w-8 text-center font-bold text-sm",
                idx < 3 ? 'text-amber-400' : 'text-zinc-600'
              )}>
                {idx + 1}
              </span>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500/50 to-fuchsia-500/50 flex items-center justify-center text-white text-xs font-bold">
                {r.user_id?.slice(0, 2).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {r.user_id === user?.id ? 'Você' : `Aluno ${idx + 1}`}
                </p>
                <p className={cn("text-[10px] font-medium", LEVEL_NAMES[r.level || 1]?.color || 'text-zinc-500')}>
                  Nível {r.level} - {LEVEL_NAMES[r.level || 1]?.name || 'Iniciante'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{r.total_points}</p>
                <p className="text-[10px] text-zinc-600">pts</p>
              </div>
              {r.streak_days > 0 && (
                <div className="flex items-center gap-1 text-xs text-orange-400">
                  <Flame className="h-3.5 w-3.5" />
                  {r.streak_days}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
