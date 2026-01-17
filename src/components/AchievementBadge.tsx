import { 
  Trophy, Star, Award, Crown, Gift, Target, Flame, BookOpen, 
  GraduationCap, Users, Calendar, CalendarCheck, DollarSign,
  TrendingUp, Medal, Sparkles, UserCheck, PlayCircle, Book
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AchievementWithStatus } from "@/hooks/useAchievements";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  star: Star,
  award: Award,
  crown: Crown,
  gift: Gift,
  target: Target,
  flame: Flame,
  "book-open": BookOpen,
  "graduation-cap": GraduationCap,
  users: Users,
  calendar: Calendar,
  "calendar-check": CalendarCheck,
  "dollar-sign": DollarSign,
  "trending-up": TrendingUp,
  medal: Medal,
  sparkles: Sparkles,
  "user-check": UserCheck,
  "play-circle": PlayCircle,
  book: Book
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  onboarding: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", border: "border-purple-300 dark:border-purple-700" },
  university: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", border: "border-blue-300 dark:border-blue-700" },
  leads: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", border: "border-red-300 dark:border-red-700" },
  referral: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-600 dark:text-rose-400", border: "border-rose-300 dark:border-rose-700" },
  loyalty: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400", border: "border-amber-300 dark:border-amber-700" },
  general: { bg: "bg-slate-100 dark:bg-slate-900/30", text: "text-slate-600 dark:text-slate-400", border: "border-slate-300 dark:border-slate-700" }
};

interface AchievementBadgeProps {
  achievement: AchievementWithStatus;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  showProgress?: boolean;
}

export default function AchievementBadge({ 
  achievement, 
  size = "md", 
  showTooltip = true,
  showProgress = false 
}: AchievementBadgeProps) {
  const Icon = iconMap[achievement.icon] || Trophy;
  const colors = categoryColors[achievement.category] || categoryColors.general;

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20"
  };

  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  const progress = achievement.progress || 0;
  const progressMax = achievement.progressMax || 1;
  const progressPercent = Math.min((progress / progressMax) * 100, 100);

  const badge = (
    <div className="relative inline-flex flex-col items-center">
      <div
        className={cn(
          "rounded-full flex items-center justify-center border-2 transition-all relative overflow-hidden",
          sizeClasses[size],
          achievement.isUnlocked 
            ? `${colors.bg} ${colors.border} ${colors.text} shadow-md` 
            : "bg-muted/50 border-muted-foreground/20 text-muted-foreground/40"
        )}
      >
        {/* Progress ring for locked achievements */}
        {!achievement.isUnlocked && showProgress && progressPercent > 0 && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              strokeWidth="3"
              className="stroke-muted-foreground/10"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              strokeWidth="3"
              strokeDasharray={`${progressPercent * 2.83} 283`}
              className="stroke-primary/50"
            />
          </svg>
        )}
        
        <Icon className={cn(iconSizes[size], "relative z-10")} />
        
        {/* Locked overlay */}
        {!achievement.isUnlocked && (
          <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px]" />
        )}
      </div>

      {/* Points badge */}
      {achievement.isUnlocked && size !== "sm" && (
        <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
          +{achievement.points}
        </span>
      )}
    </div>
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px]">
        <div className="text-center">
          <p className="font-semibold">{achievement.name}</p>
          <p className="text-xs text-muted-foreground">{achievement.description}</p>
          {!achievement.isUnlocked && (
            <p className="text-xs text-primary mt-1">
              {progress}/{progressMax} • +{achievement.points} pts
            </p>
          )}
          {achievement.isUnlocked && achievement.unlockedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
