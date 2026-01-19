import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  variant?: "default" | "primary" | "accent";
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
}: MetricCardProps) {
  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
      ? TrendingDown
      : Minus
    : null;

  return (
    <Card
      className={cn(
        "border-marketplace-border transition-all hover:shadow-md",
        variant === "primary" && "bg-marketplace text-marketplace-foreground",
        variant === "accent" && "bg-marketplace-accent text-marketplace-accent-foreground"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p
              className={cn(
                "text-sm font-medium",
                variant === "default" ? "text-muted-foreground" : "opacity-80"
              )}
            >
              {title}
            </p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p
                className={cn(
                  "text-xs",
                  variant === "default" ? "text-muted-foreground" : "opacity-70"
                )}
              >
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {icon && (
              <div
                className={cn(
                  "p-2 rounded-lg",
                  variant === "default"
                    ? "bg-marketplace/10 text-marketplace"
                    : "bg-white/20"
                )}
              >
                {icon}
              </div>
            )}
            {trend && TrendIcon && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  variant === "default"
                    ? trend.isPositive ?? trend.value > 0
                      ? "text-marketplace-accent"
                      : "text-marketplace-error"
                    : "opacity-80"
                )}
              >
                <TrendIcon className="h-3 w-3" />
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
