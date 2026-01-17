import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Target, 
  Flame, 
  GraduationCap, 
  TrendingUp,
  Settings2,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface GoalsData {
  leads_goal: number;
  courses_goal: number;
  points_goal: number;
}

interface CurrentProgress {
  leadsThisMonth: number;
  coursesCompleted: number;
  totalPoints: number;
}

export default function MonthlyGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<GoalsData>({ leads_goal: 10, courses_goal: 2, points_goal: 100 });
  const [progress, setProgress] = useState<CurrentProgress>({ leadsThisMonth: 0, coursesCompleted: 0, totalPoints: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editGoals, setEditGoals] = useState<GoalsData>(goals);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  useEffect(() => {
    if (user?.id) {
      fetchGoalsAndProgress();
    }
  }, [user?.id]);

  async function fetchGoalsAndProgress() {
    try {
      // Fetch goals for current month
      const { data: goalsData } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user!.id)
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .single();

      if (goalsData) {
        setGoals({
          leads_goal: goalsData.leads_goal,
          courses_goal: goalsData.courses_goal,
          points_goal: goalsData.points_goal
        });
        setEditGoals({
          leads_goal: goalsData.leads_goal,
          courses_goal: goalsData.courses_goal,
          points_goal: goalsData.points_goal
        });
      }

      // Fetch current progress
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString();

      const { count: leadsCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("claimed_by", user!.id)
        .gte("claimed_at", startOfMonth);

      const { count: coursesCount } = await supabase
        .from("user_course_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("status", "completed");

      const { data: profile } = await supabase
        .from("profiles")
        .select("total_points")
        .eq("user_id", user!.id)
        .single();

      setProgress({
        leadsThisMonth: leadsCount || 0,
        coursesCompleted: coursesCount || 0,
        totalPoints: profile?.total_points || 0
      });
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveGoals() {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("user_goals")
        .upsert({
          user_id: user.id,
          month: currentMonth,
          year: currentYear,
          leads_goal: editGoals.leads_goal,
          courses_goal: editGoals.courses_goal,
          points_goal: editGoals.points_goal
        }, {
          onConflict: "user_id,month,year"
        });

      if (error) throw error;

      setGoals(editGoals);
      setIsDialogOpen(false);
      toast.success("Metas atualizadas com sucesso!");
    } catch (error) {
      console.error("Error saving goals:", error);
      toast.error("Erro ao salvar metas");
    } finally {
      setIsSaving(false);
    }
  }

  const getProgressPercent = (current: number, goal: number) => {
    return Math.min(Math.round((current / goal) * 100), 100);
  };

  const goalItems = [
    {
      label: "Leads",
      current: progress.leadsThisMonth,
      goal: goals.leads_goal,
      icon: Flame,
      color: "text-red-500",
      bgColor: "bg-red-100 dark:bg-red-900/30"
    },
    {
      label: "Cursos",
      current: progress.coursesCompleted,
      goal: goals.courses_goal,
      icon: GraduationCap,
      color: "text-purple-500",
      bgColor: "bg-purple-100 dark:bg-purple-900/30"
    },
    {
      label: "Pontos",
      current: progress.totalPoints,
      goal: goals.points_goal,
      icon: TrendingUp,
      color: "text-amber-500",
      bgColor: "bg-amber-100 dark:bg-amber-900/30"
    }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">
              Metas de {monthNames[currentMonth - 1]}
            </CardTitle>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Definir Metas Mensais</DialogTitle>
                <DialogDescription>
                  Configure suas metas para {monthNames[currentMonth - 1]} de {currentYear}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="leads">Meta de Leads</Label>
                  <Input
                    id="leads"
                    type="number"
                    min="1"
                    value={editGoals.leads_goal}
                    onChange={(e) => setEditGoals({ ...editGoals, leads_goal: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courses">Meta de Cursos</Label>
                  <Input
                    id="courses"
                    type="number"
                    min="1"
                    value={editGoals.courses_goal}
                    onChange={(e) => setEditGoals({ ...editGoals, courses_goal: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points">Meta de Pontos</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    value={editGoals.points_goal}
                    onChange={(e) => setEditGoals({ ...editGoals, points_goal: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={saveGoals} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Salvar Metas
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {goalItems.map((item, index) => {
          const percent = getProgressPercent(item.current, item.goal);
          const isComplete = percent >= 100;
          
          return (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${item.bgColor}`}>
                    <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    {item.current}/{item.goal}
                  </span>
                  {isComplete && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
              <Progress 
                value={percent} 
                className={`h-2 ${isComplete ? "[&>div]:bg-green-500" : ""}`}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}