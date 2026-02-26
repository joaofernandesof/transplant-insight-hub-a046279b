import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PartyPopper, DollarSign, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SaleNotification {
  id: string;
  lead_name: string;
  licensee_name: string | null;
  procedure_name: string | null;
  sale_value: number | null;
  created_at: string;
}

export function SaleCelebrationPopup() {
  const { user, isAdmin } = useAuth();
  const [notification, setNotification] = useState<SaleNotification | null>(null);

  useEffect(() => {
    if (!isAdmin || !user?.id) return;

    // Listen for new sale notifications via realtime
    const channel = supabase
      .channel('sale-celebrations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hotlead_sale_notifications',
        },
        (payload) => {
          const n = payload.new as SaleNotification;
          // Only show if admin hasn't seen it
          if (!(payload.new as any).seen_by?.includes(user.id)) {
            setNotification(n);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, user?.id]);

  const handleClose = async () => {
    if (notification && user?.id) {
      // Mark as seen
      await supabase
        .from('hotlead_sale_notifications' as any)
        .update({ seen_by: supabase.rpc ? [user.id] : [user.id] } as any)
        .eq('id', notification.id);
    }
    setNotification(null);
  };

  if (!notification) return null;

  const formattedValue = notification.sale_value
    ? notification.sale_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;

  return (
    <Dialog open={!!notification} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-lg text-center border-0 overflow-hidden">
        {/* Celebratory header */}
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-green-600" />
        
        <div className="pt-6 pb-4 space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-bounce">
                <Trophy className="h-10 w-10 text-green-600" />
              </div>
              <PartyPopper className="h-8 w-8 text-amber-500 absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">
              🎉 Nova Venda! 🎉
            </h2>
            <p className="text-muted-foreground mt-1">Uma venda acaba de ser registrada!</p>
          </div>

          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4 space-y-3 mx-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Lead</span>
              <span className="font-semibold">{notification.lead_name}</span>
            </div>
            {notification.licensee_name && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Licenciado</span>
                <span className="font-semibold">{notification.licensee_name}</span>
              </div>
            )}
            {notification.procedure_name && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Procedimento</span>
                <span className="font-semibold">{notification.procedure_name}</span>
              </div>
            )}
            {formattedValue && (
              <div className="flex justify-between items-center pt-2 border-t border-green-200 dark:border-green-800">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-4 w-4" /> Valor
                </span>
                <span className="text-xl font-bold text-green-700 dark:text-green-400">{formattedValue}</span>
              </div>
            )}
          </div>

          <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700 mt-2">
            Entendido! 🚀
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
