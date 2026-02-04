/**
 * CPG Advocacia Médica - Task Stats Cards
 * Visualização de estatísticas de tarefas com cards coloridos
 * Com filtro por responsável
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ListTodo, Clock, AlertCircle, CheckCircle2, Users, ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { ipromedTeam } from "./IpromedTeamProfiles";

interface TaskStats {
  total: number;
  dueToday: number;
  overdue: number;
  completed: number;
  completionRate: number;
}

export function TaskStatsCards() {
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['ipromed-task-stats', selectedAssignees],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Get all tasks
      let query = supabase
        .from('ipromed_legal_tasks')
        .select('id, status, due_date, assigned_to_name');

      const { data: tasks, error } = await query;

      if (error) throw error;

      let allTasks = tasks || [];

      // Filter by selected assignees if any
      if (selectedAssignees.length > 0) {
        allTasks = allTasks.filter(t => {
          if (!t.assigned_to_name) return false;
          // Check if the task's assignee name contains any of the selected names
          return selectedAssignees.some(name => 
            t.assigned_to_name?.toLowerCase().includes(name.toLowerCase())
          );
        });
      }

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

  const toggleAssignee = (name: string) => {
    setSelectedAssignees(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const clearFilter = () => {
    setSelectedAssignees([]);
  };

  const selectAll = () => {
    setSelectedAssignees(ipromedTeam.map(m => m.name));
  };

  const getFilterLabel = () => {
    if (selectedAssignees.length === 0) {
      return "Todos";
    }
    if (selectedAssignees.length === 1) {
      return selectedAssignees[0].split(' ')[0];
    }
    if (selectedAssignees.length === ipromedTeam.length) {
      return "Toda equipe";
    }
    return `${selectedAssignees.length} selecionados`;
  };

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

  return (
    <div className="space-y-4">
      {/* Header with Title and Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Resumo de Tarefas</h2>
        
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "gap-2 h-9",
                selectedAssignees.length > 0 && "border-primary text-primary"
              )}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Responsável:</span>
              <span className="font-medium">{getFilterLabel()}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Filtrar por responsável</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAll}>
                    Todos
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilter}>
                    Limpar
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-2 space-y-1 max-h-64 overflow-auto">
              {ipromedTeam.map((member) => (
                <div
                  key={member.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors",
                    selectedAssignees.includes(member.name) && "bg-primary/5"
                  )}
                  onClick={() => toggleAssignee(member.name)}
                >
                  <Checkbox 
                    checked={selectedAssignees.includes(member.name)}
                    className="pointer-events-none"
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.photo} alt={member.name} className="object-cover" />
                    <AvatarFallback className={member.color}>
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedAssignees.length > 0 && (
              <div className="p-2 border-t bg-muted/50">
                <p className="text-xs text-muted-foreground text-center">
                  {selectedAssignees.length === 1 
                    ? `Exibindo tarefas de ${selectedAssignees[0].split(' ')[0]}`
                    : `Exibindo tarefas de ${selectedAssignees.length} pessoas`
                  }
                </p>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
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
      ) : (
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
      )}
    </div>
  );
}
