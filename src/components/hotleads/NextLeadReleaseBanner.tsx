import { useState, useEffect, useRef } from 'react';
import { Zap, Users, Timer, Sparkles, Flame, CheckCircle2, Pencil, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLeadRelease, isNightPauseBRT, getNextMorningBRT } from '@/hooks/useLeadRelease';
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
    defaultInterval,
    setDefaultInterval,
    newlyReleasedLeadId,
    clearNewLead,
  } = useLeadRelease();

  const [justReleased, setJustReleased] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editMinutes, setEditMinutes] = useState('');
  const [editSeconds, setEditSeconds] = useState('');
  const [nightPause, setNightPause] = useState(isNightPauseBRT());
  const [nightCountdown, setNightCountdown] = useState('');
  const minutesRef = useRef<HTMLInputElement>(null);

  // Check night pause every 30s
  useEffect(() => {
    const check = () => {
      const isPaused = isNightPauseBRT();
      setNightPause(isPaused);
      if (isPaused) {
        const morning = getNextMorningBRT();
        const diff = Math.max(0, Math.floor((morning.getTime() - Date.now()) / 1000));
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        setNightCountdown(`${h}h${String(m).padStart(2, '0')}m`);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const startEditing = () => {
    if (!isAdmin) return;
    const m = Math.floor(defaultInterval / 60);
    const s = defaultInterval % 60;
    setEditMinutes(String(m).padStart(2, '0'));
    setEditSeconds(String(s).padStart(2, '0'));
    setIsEditingTime(true);
    setTimeout(() => minutesRef.current?.select(), 50);
  };

  const confirmEdit = async () => {
    const totalSeconds = (parseInt(editMinutes) || 0) * 60 + (parseInt(editSeconds) || 0);
    if (totalSeconds < 5) {
      toast.error('Mínimo de 5 segundos');
      return;
    }
    try {
      await setDefaultInterval(totalSeconds);
      toast.success(`Intervalo padrão: ${formatCountdown(totalSeconds)}`);
    } catch {
      toast.error('Erro ao atualizar intervalo');
    }
    setIsEditingTime(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') confirmEdit();
    if (e.key === 'Escape') setIsEditingTime(false);
  };

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

  // Night pause is visible to ALL users
  if (nightPause) {
    return (
      <div className="relative rounded-lg border p-3 sm:p-4 mb-3 sm:mb-4 border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 sm:p-2.5 bg-indigo-500/20 shrink-0">
              <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-sm">Liberação pausada</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Leads são liberados das 06:00 às 21:00. Retorna em <strong>{nightCountdown}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-indigo-500/30 bg-indigo-500/10 self-start">
            <Moon className="h-4 w-4 text-indigo-400" />
            <span className="font-mono text-base sm:text-lg font-bold tabular-nums tracking-wider text-indigo-400">
              {nightCountdown}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Non-night content is admin-only
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
      {(isReleasing || isAboutToRelease) && (
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-amber-400/20 to-orange-500/10 animate-pulse pointer-events-none" />
      )}
      {justReleased && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-400/15 to-green-500/10 animate-pulse pointer-events-none" />
      )}

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                <span className="font-semibold text-sm text-green-600">🎉 Novo lead disponível!</span>
                <p className="text-xs text-muted-foreground mt-0.5">Corra para adquirir antes dos outros!</p>
              </div>
            ) : isReleasing ? (
              <div className="animate-fade-in">
                <span className="font-semibold text-sm text-orange-600">Liberando lead...</span>
                <div className="flex gap-1 mt-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="h-1.5 w-6 rounded-full bg-orange-500/40 overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ animation: `shimmer 1.2s ease-in-out ${i * 0.2}s infinite` }} />
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
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{info.queued_count.toLocaleString()} na fila</span>
                  <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{info.daily_released}/{info.daily_target} liberados hoje</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {countdown > 0 && !isReleasing && !justReleased && (
            <div className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 border-2 transition-all duration-300",
              isUrgent
                ? "border-red-500/50 bg-red-500/10"
                : "border-orange-500/30 bg-orange-500/10"
            )}>
              <Timer className={cn("h-5 w-5", isUrgent ? "text-red-500 animate-pulse" : "text-orange-500")} />
              <span className={cn(
                "font-mono text-2xl font-bold tabular-nums tracking-wider",
                isUrgent ? "text-red-600" : "text-orange-600"
              )}>
                {formatCountdown(countdown)}
              </span>
            </div>
          )}

          {!isReleasing && !justReleased && isAdmin && (
            isEditingTime ? (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 border bg-background/80 border-border">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Intervalo</span>
                <span className="flex items-center gap-0.5">
                  <input
                    ref={minutesRef}
                    value={editMinutes}
                    onChange={e => setEditMinutes(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    onKeyDown={handleEditKeyDown} 
                    onBlur={confirmEdit}
                    className="w-7 text-center font-mono text-lg font-bold bg-transparent border-b-2 border-orange-400 outline-none tabular-nums"
                    maxLength={2}
                  />
                  <span className="font-mono text-lg font-bold">:</span>
                  <input
                    value={editSeconds}
                    onChange={e => setEditSeconds(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    onKeyDown={handleEditKeyDown}
                    onBlur={confirmEdit}
                    className="w-7 text-center font-mono text-lg font-bold bg-transparent border-b-2 border-orange-400 outline-none tabular-nums"
                    maxLength={2}
                  />
                </span>
              </div>
            ) : (
              <button
                onClick={startEditing}
                className="text-muted-foreground hover:text-orange-600 transition-colors p-1.5 rounded-md hover:bg-orange-500/10"
                title={`Intervalo: ${formatCountdown(defaultInterval)} — clique para editar`}
              >
                <Pencil className="h-4 w-4" />
              </button>
            )
          )}

          {isAboutToRelease && !isReleasing && (
            <div className="flex items-center gap-2 bg-orange-500/15 rounded-lg px-3 py-2 border border-orange-500/30 animate-pulse">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-600">Em instantes...</span>
            </div>
          )}

          {isAdmin && !justReleased && (
            <Button size="sm" variant="default" onClick={handleReleaseNow} disabled={isReleasing} className="bg-orange-600 hover:bg-orange-700 text-white">
              <Zap className="h-4 w-4 mr-1" />
              {isReleasing ? 'Liberando...' : 'Liberar agora'}
            </Button>
          )}

        </div>
      </div>

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