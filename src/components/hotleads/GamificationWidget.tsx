import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy, Star, Zap, Target, Info } from 'lucide-react';
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

const POINTS_EXPLAINED = [
  { action: 'Adquirir lead', points: 10, icon: '🎯' },
  { action: 'Vender lead', points: 50, icon: '💰' },
  { action: 'Lead em atendimento', points: 15, icon: '🩺' },
  { action: 'Captura rápida (<5min)', points: 25, icon: '⚡' },
  { action: 'Bônus por dia consecutivo', points: 10, icon: '🔥' },
];

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
      <Card className="border-0 shadow-lg overflow-hidden">
        <div 
          className="h-2 rounded-t-lg" 
          style={{ background: `linear-gradient(to right, ${current.color}, ${next?.color || current.color})` }} 
        />
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-inner"
                style={{ background: `${current.color}20`, border: `2px solid ${current.color}40` }}
              >
                {current.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="font-bold text-lg" style={{ color: current.color }}>{current.name}</h3>
                  <p className="text-xs text-muted-foreground">Nível {current.level} de {LEVELS.length}</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold">{profile.total_points}</span>
                  <p className="text-[10px] text-muted-foreground">pontos</p>
                </div>
              </div>
              <div className="relative">
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700"
                    style={{ 
                      width: `${progressToNext}%`,
                      background: `linear-gradient(to right, ${current.color}, ${next?.color || current.color})`,
                    }}
                  />
                </div>
              </div>
              {next ? (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Faltam <strong className="text-foreground">{next.minPoints - profile.total_points} pontos</strong> para subir para {next.icon} <strong>{next.name}</strong>
                </p>
              ) : (
                <p className="text-xs mt-1.5" style={{ color: current.color }}>
                  🎉 Você atingiu o nível máximo! Parabéns!
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row - more colorful and descriptive */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200/50 dark:border-orange-800/30">
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mx-auto mb-1.5 shadow-md">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">{profile.current_streak}</p>
            <p className="text-[10px] text-muted-foreground font-medium">dias seguidos</p>
            <p className="text-[9px] text-orange-500/70 mt-0.5">Acesse todo dia para manter!</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-200/50 dark:border-yellow-800/30">
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mx-auto mb-1.5 shadow-md">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{profile.longest_streak}</p>
            <p className="text-[10px] text-muted-foreground font-medium">melhor sequência</p>
            <p className="text-[9px] text-amber-500/70 mt-0.5">Seu recorde pessoal</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-200/50 dark:border-purple-800/30">
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center mx-auto mb-1.5 shadow-md">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{profile.achievements_unlocked.length}</p>
            <p className="text-[10px] text-muted-foreground font-medium">de {ACHIEVEMENTS.length} conquistas</p>
            <p className="text-[9px] text-purple-500/70 mt-0.5">Continue desbloqueando!</p>
          </CardContent>
        </Card>
      </div>

      {/* How to earn points */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
            <Info className="h-3.5 w-3.5" />
            Como ganhar pontos?
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {POINTS_EXPLAINED.map(p => (
              <div key={p.action} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/80 dark:bg-background/50 border border-blue-100 dark:border-blue-900/40 text-xs">
                <span>{p.icon}</span>
                <span className="text-muted-foreground">{p.action}</span>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40">
                  +{p.points}pts
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Conquistas
            <Badge variant="outline" className="text-[10px] font-normal">
              {profile.achievements_unlocked.length}/{ACHIEVEMENTS.length} desbloqueadas
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <TooltipProvider>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {ACHIEVEMENTS.map(achievement => {
                const unlocked = profile.achievements_unlocked.includes(achievement.code);
                return (
                  <Tooltip key={achievement.code}>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all cursor-default ${
                          unlocked
                            ? 'bg-gradient-to-b from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-300 dark:border-yellow-700 shadow-md'
                            : 'bg-muted/20 border-muted/40 opacity-40 grayscale'
                        }`}
                      >
                        <span className="text-2xl">{achievement.icon}</span>
                        <span className="text-[9px] font-semibold text-center leading-tight line-clamp-2">
                          {achievement.name}
                        </span>
                        {unlocked && (
                          <span className="text-[8px] text-green-600 dark:text-green-400 font-medium">✓ Desbloqueado</span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <p className="font-semibold text-sm">{achievement.icon} {achievement.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{achievement.description}</p>
                      {!unlocked && (
                        <p className="text-xs text-amber-500 mt-1 font-medium">🔒 Continue jogando para desbloquear!</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Level roadmap - more visual and explanatory */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            Caminho dos Níveis
            <span className="text-[10px] text-muted-foreground font-normal ml-1">— Acumule pontos para subir de nível!</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {LEVELS.map((lvl) => {
              const reached = profile.total_points >= lvl.minPoints;
              const isCurrent = current.level === lvl.level;
              return (
                <TooltipProvider key={lvl.level}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all cursor-default ${
                          isCurrent
                            ? 'shadow-lg scale-105'
                            : reached
                              ? 'shadow-sm'
                              : 'opacity-50'
                        }`}
                        style={{
                          borderColor: isCurrent ? lvl.color : reached ? `${lvl.color}60` : 'transparent',
                          background: isCurrent
                            ? `linear-gradient(135deg, ${lvl.color}15, ${lvl.color}08)`
                            : reached
                              ? `${lvl.color}08`
                              : undefined,
                        }}
                      >
                        <span className="text-2xl">{lvl.icon}</span>
                        <span className="text-xs font-bold" style={{ color: reached ? lvl.color : undefined }}>
                          {lvl.name}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-medium">
                          {lvl.minPoints === 0 ? 'Início' : `${lvl.minPoints} pts`}
                        </span>
                        {isCurrent && (
                          <Badge className="text-[8px] px-1.5 py-0 h-4 mt-0.5" style={{ background: lvl.color, color: '#fff' }}>
                            VOCÊ ESTÁ AQUI
                          </Badge>
                        )}
                        {reached && !isCurrent && (
                          <span className="text-[8px] text-green-500 font-medium">✓ Alcançado</span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">{lvl.icon} {lvl.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {reached
                          ? `Alcançado! Você já passou de ${lvl.minPoints} pontos.`
                          : `Faltam ${lvl.minPoints - profile.total_points} pontos para chegar aqui.`
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}