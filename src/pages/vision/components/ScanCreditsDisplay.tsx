import { useState, useEffect } from "react";
import { Coins, Sparkles, Zap, Crown, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

interface UserCredits {
  plan: 'free' | 'starter' | 'professional' | 'unlimited';
  daily_credits: number;
  credits_used_today: number;
  monthly_credits: number;
  credits_used_month: number;
}

interface ScanCreditsDisplayProps {
  userId?: string;
  onUpgradeClick: () => void;
  refreshTrigger?: number;
}

const planConfig = {
  free: {
    name: "Grátis",
    color: "bg-muted text-muted-foreground",
    icon: Coins,
    dailyLimit: 3,
    monthlyLimit: 0,
  },
  starter: {
    name: "Starter",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Zap,
    dailyLimit: 5,
    monthlyLimit: 50,
  },
  professional: {
    name: "Professional",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: Sparkles,
    dailyLimit: 10,
    monthlyLimit: 150,
  },
  unlimited: {
    name: "Unlimited",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: Crown,
    dailyLimit: 999,
    monthlyLimit: 9999,
  },
};

export function ScanCreditsDisplay({ userId, onUpgradeClick, refreshTrigger }: ScanCreditsDisplayProps) {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useUnifiedAuth();

  useEffect(() => {
    if (userId) {
      fetchCredits();
    }
  }, [userId, refreshTrigger]);

  const fetchCredits = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase.rpc('check_and_reset_daily_credits', {
        _user_id: userId
      });

      if (error) throw error;
      if (data) {
        setCredits(data as unknown as UserCredits);
      }
    } catch (err) {
      console.error("Error fetching credits:", err);
      // Default to free plan
      setCredits({
        plan: 'free',
        daily_credits: 3,
        credits_used_today: 0,
        monthly_credits: 0,
        credits_used_month: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Admin users have unlimited access
  if (isAdmin) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/80 border border-purple-500/30">
        <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30 gap-1">
          <Shield className="w-3 h-3" />
          Administrador
        </Badge>
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-300">
            Acesso Ilimitado
          </span>
        </div>
      </div>
    );
  }

  if (loading || !credits) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm animate-pulse">
        <Coins className="w-4 h-4" />
        <span>Carregando créditos...</span>
      </div>
    );
  }

  const plan = planConfig[credits.plan];
  const PlanIcon = plan.icon;
  
  const dailyRemaining = Math.max(0, credits.daily_credits - credits.credits_used_today);
  const monthlyRemaining = credits.plan !== 'free' 
    ? Math.max(0, plan.monthlyLimit - credits.credits_used_month)
    : 0;
  const totalRemaining = dailyRemaining + monthlyRemaining;
  
  const dailyProgress = (dailyRemaining / credits.daily_credits) * 100;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`${plan.color} gap-1`}>
          <PlanIcon className="w-3 h-3" />
          {plan.name}
        </Badge>
      </div>

      <div className="flex-1 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {totalRemaining} crédito{totalRemaining !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="hidden sm:flex items-center gap-2 flex-1 max-w-32">
          <Progress value={dailyProgress} className="h-2" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {dailyRemaining}/{credits.daily_credits} hoje
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onUpgradeClick}
        className="gap-1 text-primary border-primary/30 hover:bg-primary/10"
      >
        {credits.plan === 'free' ? (
          <>
            <Sparkles className="w-3 h-3" />
            Upgrade
            <ArrowRight className="w-3 h-3" />
          </>
        ) : (
          <>
            <Crown className="w-3 h-3" />
            Gerenciar Plano
          </>
        )}
      </Button>
    </div>
  );
}
