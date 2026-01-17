import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Trophy, Star, Calendar } from "lucide-react";
import { useAchievements, type AchievementWithStatus } from "@/hooks/useAchievements";
import AchievementBadge from "./AchievementBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AchievementTimeline() {
  const { achievements, totalPoints, isLoading } = useAchievements();

  // Get unlocked achievements sorted by date (most recent first)
  const unlockedAchievements = achievements
    .filter(a => a.isUnlocked && a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime());

  // Group by month/year
  const groupedByMonth = unlockedAchievements.reduce((acc, achievement) => {
    const date = new Date(achievement.unlockedAt!);
    const key = format(date, 'MMMM yyyy', { locale: ptBR });
    if (!acc[key]) acc[key] = [];
    acc[key].push(achievement);
    return acc;
  }, {} as Record<string, AchievementWithStatus[]>);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-200/50 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/50 via-background to-background dark:from-purple-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <History className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Linha do Tempo
                <Badge variant="secondary" className="text-xs">
                  {unlockedAchievements.length} conquistas
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                <Star className="h-3 w-3 inline mr-1" />
                {totalPoints} pontos acumulados
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {unlockedAchievements.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma conquista ainda</p>
            <p className="text-xs text-muted-foreground">Continue explorando para desbloquear!</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400 via-purple-200 to-transparent" />
              
              {Object.entries(groupedByMonth).map(([month, monthAchievements]) => (
                <div key={month} className="mb-6">
                  {/* Month header */}
                  <div className="flex items-center gap-2 mb-4 pl-12">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold capitalize text-muted-foreground">
                      {month}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {monthAchievements.length}
                    </Badge>
                  </div>
                  
                  {/* Achievements in this month */}
                  <div className="space-y-3">
                    {monthAchievements.map((achievement, index) => (
                      <div key={achievement.id} className="relative flex items-start gap-4 pl-2">
                        {/* Timeline dot */}
                        <div className="relative z-10 flex-shrink-0">
                          <AchievementBadge 
                            achievement={achievement} 
                            size="sm"
                            showTooltip={false}
                          />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0 bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate">
                                {achievement.name}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {achievement.description}
                              </p>
                            </div>
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-xs flex-shrink-0">
                              +{achievement.points} pts
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(achievement.unlockedAt!), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}