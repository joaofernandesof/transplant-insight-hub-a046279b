import { useState, useEffect } from 'react';
import { Zap, Users, Timer, Sparkles, Flame, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLeadRelease } from '@/hooks/useLeadRelease';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NextLeadReleaseBannerProps {
  onLeadReleased?: () => void;
}

export function NextLeadReleaseBanner({ onLeadReleased }: NextLeadReleaseBannerProps) {
  const { isAdmin } = useAuth();
  const {
    info,
    countdown,
    formatCountdown,
    isReleasing,
    releaseNow,
    newlyReleasedLeadId,
    clearNewLead,
  } = useLeadRelease();

  const [justReleased, setJustReleased] = useState(false);

  // Show "released" state for 3s when a new lead appears
  useEffect(() => {
    if (newlyReleasedLeadId) {
      setJustReleased(true);
      const timer = setTimeout(() => {
        setJustReleased(false);
        clearNewLead();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [newlyReleasedLeadId, clearNewLead]);

  const handleReleaseNow = async () => {
    try {
      const result = await releaseNow();
      if (result?.success) {
        toast.success(`Lead liberado! (${result.daily_released}/${info?.daily_target || 50} hoje)`);
        onLeadReleased?.();
      } else {
        toast.warning(result?.reason === 'no_queued_leads' 
          ? 'Nenhum lead na fila para liberar' 
          : 'Limite diário atingido');
      }
    } catch {
      toast.error('Erro ao liberar lead');
    }
  };

  if (!isAdmin || !info || info.queued_count === 0) return null;

  const isUrgent = countdown > 0 && countdown <= 10;
  const isAboutToRelease = countdown === 0 && info.next_release_at && !justReleased;

  return (
    <div
      className={cn(
        "relative rounded-lg border p-4 mb-4 transition-all duration-500 overflow-hidden",
        justReleased
          ? "border-green-500/40 bg-gradient-to-r from-green-500/15 via-emerald-500/10 to-green-500/15"
          : isReleasing || isAboutToRelease
            ? "border-orange-500/40 bg-gradient-to-r from-orange-500/15 via-amber-500/15 to-orange-500/15"
            : isUrgent
              ? "border-red-500/30 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10"
              : "border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10"
      )}
    >
      {/* Animated background pulse when releasing */}
      {(isReleasing || isAboutToRelease) && (
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-amber-400/20 to-orange-500/10 animate-pulse pointer-events-none" />
      )}

      {/* Success glow */}
      {justReleased && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-400/15 to-green-500/10 animate-pulse pointer-events-none" />
      )}

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left: Status + Lead preview */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "rounded-full p-2.5 transition-all duration-500",
              justReleased
                ? "bg-green-500/20 scale-110"
                : isReleasing || isAboutToRelease
                  ? "bg-orange-500/30 animate-pulse"
                  : isUrgent
                    ? "bg-red-500/20 animate-bounce"
                    : "bg-orange-500/20"
            )}
          >
            {justReleased ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 animate-scale-in" />
            ) : isReleasing ? (
              <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
            ) : (
              <Sparkles className="h-5 w-5 text-orange-500" />
            )}
          </div>

          <div>
            {justReleased ? (
              <div className="animate-fade-in">
                <span className="font-semibold text-sm text-green-600">
                  🎉 Novo lead disponível!
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Corra para adquirir antes dos outros!
                </p>
              </div>
            ) : isReleasing ? (
              <div className="animate-fade-in">
                <span className="font-semibold text-sm text-orange-600">
                  Liberando lead...
                </span>
                <div className="flex gap-1 mt-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="h-1.5 w-6 rounded-full bg-orange-500/40 overflow-hidden"
                    >
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{
                          animation: `shimmer 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Próximo Lead</span>
                  {info.next_lead_preview && (
                    <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-600">
                      {info.next_lead_preview.masked_name}
                      {info.next_lead_preview.city && ` • ${info.next_lead_preview.city}`}
                      {info.next_lead_preview.state && `/${info.next_lead_preview.state}`}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {info.queued_count.toLocaleString()} na fila
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {info.daily_released}/{info.daily_target} liberados hoje
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Countdown + Admin button */}
        <div className="flex items-center gap-3">
          {countdown > 0 && !isReleasing && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 border transition-all duration-300",
                isUrgent
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-background/80 border-border"
              )}
            >
              <Timer className={cn(
                "h-4 w-4 transition-colors",
                isUrgent ? "text-red-500" : "text-orange-500"
              )} />
              <span
                className={cn(
                  "font-mono text-lg font-bold tabular-nums transition-colors",
                  isUrgent ? "text-red-600" : "text-orange-600"
                )}
              >
                {formatCountdown(countdown)}
              </span>
            </div>
          )}

          {isAboutToRelease && !isReleasing && (
            <div className="flex items-center gap-2 bg-orange-500/15 rounded-lg px-3 py-2 border border-orange-500/30 animate-pulse">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-600">
                Em instantes...
              </span>
            </div>
          )}

          {isAdmin && !justReleased && (
            <Button
              size="sm"
              variant="default"
              onClick={handleReleaseNow}
              disabled={isReleasing}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Zap className="h-4 w-4 mr-1" />
              {isReleasing ? 'Liberando...' : 'Liberar agora'}
            </Button>
          )}
        </div>
      </div>

      {/* Inline keyframes for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { width: 0%; opacity: 0.5; }
          50% { width: 100%; opacity: 1; }
          100% { width: 0%; opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}