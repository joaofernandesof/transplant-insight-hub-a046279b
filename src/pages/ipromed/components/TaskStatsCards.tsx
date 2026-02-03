/**
 * IPROMED - Task Stats Cards
 * Visualização de estatísticas de tarefas com cards coloridos
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListTodo, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskStats {
  total: number;
  dueToday: number;
  overdue: number;
  completed: number;
  completionRate: number;
}

export function TaskStatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['ipromed-task-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Get all tasks
      const { data: tasks, error } = await supabase
        .from('ipromed_legal_tasks')
        .select('id, status, due_date');

      if (error) throw error;

      const allTasks = tasks || [];
      const pendingTasks = allTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
      const completedTasks = allTasks.filter(t => t.status === 'completed');
      
      // Due today (pending tasks with due_date = today)
      const dueToday = pendingTasks.filter(t => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        return dueDate >= today && dueDate <= todayEnd;
      });

      // Overdue (pending tasks with due_date < today)
      const overdue = pendingTasks.filter(t => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        return dueDate < today;
      });

      const total = pendingTasks.length;
      const completionRate = allTasks.length > 0 
        ? Math.round((completedTasks.length / allTasks.length) * 100)
        : 0;

      return {
        total,
        dueToday: dueToday.length,
        overdue: overdue.length,
        completed: completedTasks.length,
        completionRate,
      } as TaskStats;
    },
  });

  const cards = [
    {
      label: 'Tarefas a fazer',
      value: stats?.total ?? 0,
      icon: ListTodo,
      borderColor: 'border-l-slate-400',
      bgColor: 'bg-white',
      textColor: 'text-slate-700',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-500',
      badge: stats?.total ?? 0,
      badgeBg: 'bg-slate-100 text-slate-600',
    },
    {
      label: 'Vencem hoje',
      value: stats?.dueToday ?? 0,
      icon: Clock,
      borderColor: 'border-l-slate-400',
      bgColor: 'bg-white',
      textColor: 'text-slate-700',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-500',
      badge: stats?.dueToday ?? 0,
      badgeBg: 'bg-emerald-500 text-white',
    },
    {
      label: 'Em atraso',
      value: stats?.overdue ?? 0,
      icon: AlertCircle,
      borderColor: 'border-l-red-400',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-500',
      badge: 'Atenção',
      badgeBg: 'bg-red-500 text-white',
      showBadge: (stats?.overdue ?? 0) > 0,
    },
    {
      label: 'Concluídas',
      value: stats?.completed ?? 0,
      icon: CheckCircle2,
      borderColor: 'border-l-emerald-400',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-500',
      badge: `${stats?.completionRate ?? 0}%`,
      badgeBg: 'bg-emerald-500 text-white',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-l-4 border-l-slate-200">
            <CardContent className="pt-4 pb-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card 
          key={card.label} 
          className={cn(
            "border-l-4 border-none shadow-sm",
            card.borderColor,
            card.bgColor
          )}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between">
              <div className={cn("p-2 rounded-lg", card.iconBg)}>
                <card.icon className={cn("h-5 w-5", card.iconColor)} />
              </div>
              {(card.showBadge !== false && (index === 2 || index === 3 || card.badge)) && (
                <Badge className={cn("text-xs font-medium", card.badgeBg)}>
                  {index === 0 || index === 1 ? card.badge : card.badge}
                </Badge>
              )}
            </div>
            <div className="mt-3">
              <p className={cn("text-3xl font-bold", card.textColor)}>
                {card.value}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {card.label}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
