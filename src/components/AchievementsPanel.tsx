import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, Star, ChevronRight, Sparkles, BookOpen, Flame, 
  Gift, Calendar, Lock
} from "lucide-react";
import { useAchievements, type AchievementWithStatus } from "@/hooks/useAchievements";
import AchievementBadge from "./AchievementBadge";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const categories = [
  { id: "all", name: "Todas", icon: Trophy },
  { id: "onboarding", name: "Início", icon: Sparkles },
  { id: "university", name: "Cursos", icon: BookOpen },
  { id: "leads", name: "Leads", icon: Flame },
  { id: "referral", name: "Indicação", icon: Gift },
  { id: "loyalty", name: "Fidelidade", icon: Calendar }
];

interface AchievementsPanelProps {
  compact?: boolean;
}

export default function AchievementsPanel({ compact = false }: AchievementsPanelProps) {
  const navigate = useNavigate();
  const { achievements, totalPoints, unlockedCount, totalCount, isLoading } = useAchievements();
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredAchievements = activeCategory === "all" 
    ? achievements 
    : achievements.filter(a => a.category === activeCategory);

  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="w-14 h-14 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    // Show only a summary with recent achievements
    const recentUnlocked = achievements
      .filter(a => a.isUnlocked)
      .sort((a, b) => new Date(b.unlockedAt || 0).getTime() - new Date(a.unlockedAt || 0).getTime())
      .slice(0, 5);

    const nextToUnlock = achievements
      .filter(a => !a.isUnlocked && (a.progress || 0) > 0)
      .sort((a, b) => {
        const progressA = (a.progress || 0) / (a.progressMax || 1);
        const progressB = (b.progress || 0) / (b.progressMax || 1);
        return progressB - progressA;
      })
      .slice(0, 3);

    return (
      <Card className="border border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-amber-50/50 via-background to-background dark:from-amber-950/20">
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  Conquistas
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {unlockedCount}/{totalCount}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  <Star className="h-3 w-3 inline mr-0.5" />
                  {totalPoints} pontos
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/achievements")} className="gap-1 h-7 text-xs px-2">
              Ver todas
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 px-3 pb-3">
          {/* Progress */}
          <div className="space-y-1">
            <Progress value={progressPercent} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground text-right">
              {Math.round(progressPercent)}% concluído
            </p>
          </div>

          {/* Recent achievements */}
          {recentUnlocked.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Recentes</p>
              <div className="flex flex-wrap gap-1.5">
                {recentUnlocked.map(achievement => (
                  <AchievementBadge 
                    key={achievement.id} 
                    achievement={achievement} 
                    size="sm"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Next to unlock */}
          {nextToUnlock.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Próximas</p>
              <div className="space-y-1.5">
                {nextToUnlock.map(achievement => (
                  <div 
                    key={achievement.id} 
                    className="flex items-center gap-2 p-1.5 rounded-md bg-muted/30"
                  >
                    <AchievementBadge 
                      achievement={achievement} 
                      size="sm" 
                      showProgress
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{achievement.name}</p>
                      <div className="flex items-center gap-1.5">
                        <Progress 
                          value={(achievement.progress || 0) / (achievement.progressMax || 1) * 100} 
                          className="h-1 flex-1" 
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {achievement.progress}/{achievement.progressMax}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full achievements panel
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Suas Conquistas</CardTitle>
              <p className="text-sm text-muted-foreground">
                {unlockedCount} de {totalCount} desbloqueadas • {totalPoints} pontos
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {totalPoints}
            </div>
            <p className="text-xs text-muted-foreground">pontos totais</p>
          </div>
        </div>
        <Progress value={progressPercent} className="h-2 mt-4" />
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto gap-1 mb-4 p-1">
            {categories.map(cat => {
              const count = cat.id === "all" 
                ? achievements.length 
                : achievements.filter(a => a.category === cat.id).length;
              const unlocked = cat.id === "all"
                ? unlockedCount
                : achievements.filter(a => a.category === cat.id && a.isUnlocked).length;
              
              return (
                <TabsTrigger 
                  key={cat.id} 
                  value={cat.id}
                  className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs"
                >
                  <cat.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{cat.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1 h-4">
                    {unlocked}/{count}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredAchievements.map(achievement => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function AchievementCard({ achievement }: { achievement: AchievementWithStatus }) {
  const progress = achievement.progress || 0;
  const progressMax = achievement.progressMax || 1;
  const progressPercent = Math.min((progress / progressMax) * 100, 100);

  return (
    <div 
      className={`relative p-4 rounded-xl border-2 text-center transition-all ${
        achievement.isUnlocked 
          ? "bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-background border-amber-200 dark:border-amber-800/50 shadow-sm"
          : "bg-muted/20 border-muted-foreground/10"
      }`}
    >
      {/* Lock icon for locked achievements */}
      {!achievement.isUnlocked && (
        <div className="absolute top-2 right-2">
          <Lock className="h-3 w-3 text-muted-foreground/40" />
        </div>
      )}

      <div className="flex justify-center mb-3">
        <AchievementBadge 
          achievement={achievement} 
          size="lg" 
          showTooltip={false}
          showProgress
        />
      </div>

      <h4 className={`font-semibold text-sm mb-1 ${!achievement.isUnlocked && "text-muted-foreground"}`}>
        {achievement.name}
      </h4>
      
      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
        {achievement.description}
      </p>

      {!achievement.isUnlocked && (
        <div className="space-y-1">
          <Progress value={progressPercent} className="h-1" />
          <p className="text-[10px] text-muted-foreground">
            {progress}/{progressMax}
          </p>
        </div>
      )}

      {achievement.isUnlocked && (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-[10px]">
          +{achievement.points} pts
        </Badge>
      )}
    </div>
  );
}
