import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Flame, 
  GraduationCap, 
  TrendingUp, 
  Calendar,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface QuickStatsData {
  leadsThisMonth: number;
  coursesCompleted: number;
  totalPoints: number;
  daysAsMember: number;
}

export default function QuickStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<QuickStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!user?.id) return;

      try {
        // Get start of current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Fetch leads claimed this month
        const { count: leadsCount } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("claimed_by", user.id)
          .gte("claimed_at", startOfMonth);

        // Fetch completed courses
        const { count: coursesCount } = await supabase
          .from("user_course_enrollments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed");

        // Fetch profile for points and created_at
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_points, created_at")
          .eq("user_id", user.id)
          .single();

        // Calculate days as member
        const createdAt = profile?.created_at ? new Date(profile.created_at) : now;
        const daysAsMember = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

        setStats({
          leadsThisMonth: leadsCount || 0,
          coursesCompleted: coursesCount || 0,
          totalPoints: profile?.total_points || 0,
          daysAsMember: Math.max(1, daysAsMember)
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats({
          leadsThisMonth: 0,
          coursesCompleted: 0,
          totalPoints: 0,
          daysAsMember: 1
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [user?.id]);

  const statItems = [
    {
      label: "Leads no mês",
      value: stats?.leadsThisMonth || 0,
      icon: Flame,
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400"
    },
    {
      label: "Cursos concluídos",
      value: stats?.coursesCompleted || 0,
      icon: GraduationCap,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
      label: "Pontos",
      value: stats?.totalPoints || 0,
      icon: TrendingUp,
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400"
    },
    {
      label: "Dias como membro",
      value: stats?.daysAsMember || 0,
      icon: Calendar,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400"
    }
  ];

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="py-6 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {statItems.map((item, index) => (
        <Card key={index} className="border hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-2 rounded-lg ${item.iconBg} flex-shrink-0`}>
                <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${item.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold truncate">{item.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {item.label}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}