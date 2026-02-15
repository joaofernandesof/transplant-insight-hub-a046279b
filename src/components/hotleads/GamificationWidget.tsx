import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Flame, Trophy, Star, Zap, Target } from 'lucide-react';
import {
  GamificationProfile,
  LEVELS,
  ACHIEVEMENTS,
  getLevelInfo,
} from '@/hooks/useGamification';

interface GamificationWidgetProps {
  profile: GamificationProfile;
  compact?: boolean;
}

export function GamificationWidget({ profile, compact = false }: GamificationWidgetProps) {
  const { current, next, progressToNext } = getLevelInfo(profile.total_points);

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
        <div className="text-2xl">{current.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{current.name}</span>
            <span className="text-xs text-muted-foreground">{profile.total_points} pts</span>
          </div>
          <Progress value={progressToNext} className="h-1.5 mt-1" />
          {next && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {next.minPoints - profile.total_points} pts para {next.name}
            </p>
          )}
        </div>
        {profile.current_streak > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Flame className="h-3 w-3 text-orange-500" />
            <span className="text-xs font-bold text-orange-600">{profile.current_streak}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Level & XP Card */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div 
          className="h-1.5" 
          style={{ background: `linear-gradient(to right, ${current.color}, ${next?.color || current.color})` }} 
        />
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{current.icon}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="font-bold text-lg">{current.name}</h3>
                  <p className="text-xs text-muted-foreground">Nível {current.level}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold">{profile.total_points}</span>
                  <p className="text-xs text-muted-foreground">pontos</p>
                </div>
              </div>
              <Progress value={progressToNext} className="h-2" />
              {next && (
                <p className="text-xs text-muted-foreground mt-1">
                  {next.minPoints - profile.total_points} pontos para <strong>{next.icon} {next.name}</strong>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Streak */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" />
            <p className="text-2xl font-bold">{profile.current_streak}</p>
            <p className="text-[10px] text-muted-foreground">dias seguidos</p>
          </CardContent>
        </Card>

        {/* Longest streak */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <Zap className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-2xl font-bold">{profile.longest_streak}</p>
            <p className="text-[10px] text-muted-foreground">melhor streak</p>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <Trophy className="h-5 w-5 mx-auto text-purple-500 mb-1" />
            <p className="text-2xl font-bold">{profile.achievements_unlocked.length}</p>
            <p className="text-[10px] text-muted-foreground">de {ACHIEVEMENTS.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Grid */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <TooltipProvider>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {ACHIEVEMENTS.map(achievement => {
                const unlocked = profile.achievements_unlocked.includes(achievement.code);
                return (
                  <Tooltip key={achievement.code}>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                          unlocked
                            ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 shadow-sm'
                            : 'bg-muted/30 border-transparent opacity-40 grayscale'
                        }`}
                      >
                        <span className="text-xl">{achievement.icon}</span>
                        <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">
                          {achievement.name}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">{achievement.icon} {achievement.name}</p>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      {!unlocked && (
                        <p className="text-xs text-amber-500 mt-1">🔒 Não desbloqueado</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Level roadmap */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            Caminho dos Níveis
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-center gap-1">
            {LEVELS.map((lvl, i) => {
              const reached = profile.total_points >= lvl.minPoints;
              const isCurrent = current.level === lvl.level;
              return (
                <React.Fragment key={lvl.level}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`flex flex-col items-center gap-0.5 flex-1 p-1.5 rounded-lg border transition-all ${
                            isCurrent
                              ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
                              : reached
                                ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800'
                                : 'border-transparent bg-muted/30 opacity-50'
                          }`}
                        >
                          <span className="text-lg">{lvl.icon}</span>
                          <span className="text-[9px] font-medium">{lvl.name}</span>
                          <span className="text-[8px] text-muted-foreground">{lvl.minPoints}pts</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{lvl.icon} {lvl.name} — {lvl.minPoints} pontos</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
