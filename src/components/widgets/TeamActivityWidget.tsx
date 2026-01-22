import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Users, Activity, Clock, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfDay } from 'date-fns';
import { Progress } from '@/components/ui/progress';

export function TeamActivityWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: activityData, isLoading } = useQuery({
    queryKey: ['team-activity-summary'],
    queryFn: async () => {
      // Get unique profiles with activity
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, role')
        .not('role', 'eq', 'patient');

      if (profilesError) throw profilesError;

      // Get recent tasks from lead_tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('lead_tasks')
        .select('id, completed_at, created_at')
        .gte('created_at', format(subDays(new Date(), 7), 'yyyy-MM-dd'));

      if (tasksError) throw tasksError;

      // Get recent leads
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, created_at')
        .gte('created_at', format(subDays(new Date(), 7), 'yyyy-MM-dd'));

      if (leadsError) throw leadsError;

      const totalTeam = profiles?.length || 0;
      const completedTasks = tasks?.filter(t => t.completed_at !== null).length || 0;
      const totalTasks = tasks?.length || 0;
      const newLeadsWeek = leads?.length || 0;

      return {
        totalTeam,
        completedTasks,
        totalTasks,
        newLeadsWeek,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      };
    },
    enabled: !!user,
    staleTime: 60000
  });

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-5">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="h-full cursor-pointer transition-all hover:shadow-md group"
      onClick={() => navigate('/user-monitoring')}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-base">Equipe & Atividades</h3>
            <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{activityData?.totalTeam || 0}</p>
            <p className="text-[10px] text-muted-foreground">Colaboradores</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <CheckSquare className="h-5 w-5 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
            <p className="text-lg font-bold">{activityData?.completedTasks || 0}</p>
            <p className="text-[10px] text-muted-foreground">Tarefas</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <Activity className="h-5 w-5 mx-auto mb-1 text-accent-foreground" />
            <p className="text-lg font-bold">{activityData?.newLeadsWeek || 0}</p>
            <p className="text-[10px] text-muted-foreground">Leads</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Taxa de conclusão de tarefas</span>
            <span className="font-medium">{activityData?.completionRate || 0}%</span>
          </div>
          <Progress 
            value={activityData?.completionRate || 0} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}