import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar_url: string | null;
  clinic_name: string | null;
  total_points: number;
  rank: number;
}

interface LeaderboardProps {
  limit?: number;
  showCurrentUser?: boolean;
}

export default function Leaderboard({ limit = 10, showCurrentUser = true }: LeaderboardProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        // Fetch top profiles ordered by total_points
        const { data, error } = await supabase
          .from("profiles")
          .select("user_id, name, avatar_url, clinic_name, total_points")
          .order("total_points", { ascending: false })
          .limit(limit);

        if (error) throw error;

        const rankedEntries: LeaderboardEntry[] = (data || []).map((entry, index) => ({
          ...entry,
          total_points: entry.total_points || 0,
          rank: index + 1
        }));

        setEntries(rankedEntries);

        // Find current user's rank if not in top list
        if (showCurrentUser && user?.id) {
          const currentUserInList = rankedEntries.find(e => e.user_id === user.id);
          
          if (!currentUserInList) {
            // Fetch all profiles to calculate rank
            const { data: allData, error: allError } = await supabase
              .from("profiles")
              .select("user_id, name, avatar_url, clinic_name, total_points")
              .order("total_points", { ascending: false });

            if (!allError && allData) {
              const userIndex = allData.findIndex(p => p.user_id === user.id);
              if (userIndex !== -1) {
                setCurrentUserRank({
                  ...allData[userIndex],
                  total_points: allData[userIndex].total_points || 0,
                  rank: userIndex + 1
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, [limit, showCurrentUser, user?.id]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-amber-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-slate-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
    }
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return "bg-primary/10 border-primary/30";
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800/50";
      case 2:
        return "bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/20 border-slate-200 dark:border-slate-800/50";
      case 3:
        return "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 border-orange-200 dark:border-orange-800/50";
      default:
        return "bg-muted/20 border-transparent hover:bg-muted/40";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Ranking de Pontos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <CardTitle className="text-sm">Ranking de Pontos</CardTitle>
            <p className="text-xs text-muted-foreground">
              Licenciados com mais pontos
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 px-3 pb-3">
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhum ranking disponível ainda
          </p>
        ) : (
          <>
            {entries.map((entry) => {
              const isCurrentUser = entry.user_id === user?.id;
              
              return (
                <div
                  key={entry.user_id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md border transition-all",
                    getRankBg(entry.rank, isCurrentUser),
                    isCurrentUser && "ring-1 ring-primary/20"
                  )}
                >
                  <div className="flex items-center justify-center w-5">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <Avatar className="h-7 w-7 ring-1 ring-background">
                    <AvatarImage src={entry.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                      {entry.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate">
                      {entry.name}
                      {isCurrentUser && (
                        <Badge variant="outline" className="ml-1.5 text-[9px] px-1 py-0 h-4">
                          Você
                        </Badge>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-amber-500" />
                    <span className="font-bold text-xs">
                      {entry.total_points}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Current user position if not in top list */}
            {currentUserRank && !entries.find(e => e.user_id === user?.id) && (
              <>
                <div className="flex items-center justify-center py-1">
                  <span className="text-[10px] text-muted-foreground">• • •</span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md border transition-all",
                    "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                  )}
                >
                  <div className="flex items-center justify-center w-5">
                    <span className="text-xs font-bold text-primary">{currentUserRank.rank}</span>
                  </div>
                  
                  <Avatar className="h-7 w-7 ring-1 ring-primary/30">
                    <AvatarImage src={currentUserRank.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                      {currentUserRank.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate">
                      {currentUserRank.name}
                      <Badge variant="outline" className="ml-1.5 text-[9px] px-1 py-0 h-4 border-primary text-primary">
                        Você
                      </Badge>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-amber-500" />
                    <span className="font-bold text-xs">
                      {currentUserRank.total_points}
                    </span>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}