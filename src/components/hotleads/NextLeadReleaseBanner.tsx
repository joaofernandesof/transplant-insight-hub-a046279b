import { Clock, Zap, Users, Timer, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLeadRelease } from '@/hooks/useLeadRelease';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ConfettiEffect } from './ConfettiEffect';

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
    showConfetti,
  } = useLeadRelease();

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

  if (!info || info.queued_count === 0) return null;

  return (
    <>
      <ConfettiEffect active={showConfetti} />
      <div className="rounded-lg border bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10 border-orange-500/20 p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Left: Next lead preview */}
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-orange-500/20 p-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
            </div>
            <div>
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
            </div>
          </div>

          {/* Right: Countdown + Admin button */}
          <div className="flex items-center gap-3">
            {countdown > 0 && (
              <div className="flex items-center gap-2 bg-background/80 rounded-md px-3 py-1.5 border">
                <Timer className="h-4 w-4 text-orange-500" />
                <span className="font-mono text-lg font-bold text-orange-600">
                  {formatCountdown(countdown)}
                </span>
              </div>
            )}
            {countdown === 0 && info.next_release_at && (
              <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                <Clock className="h-3 w-3 mr-1" />
                Em breve...
              </Badge>
            )}
            {isAdmin && (
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
      </div>
    </>
  );
}
