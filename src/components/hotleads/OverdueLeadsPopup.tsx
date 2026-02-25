import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { HotLead } from '@/hooks/useHotLeads';

interface OverdueLeadsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overdueLeads: HotLead[];
  onGoToTab: (tab: 'acquired' | 'in_progress') => void;
}

function getDaysSinceDeadline(lead: HotLead): number {
  const OVERDUE_DAYS = 7;
  let refTime: number;
  if (lead.lead_outcome === 'em_atendimento' && lead.outcome_at) {
    refTime = new Date(lead.outcome_at).getTime();
  } else {
    refTime = lead.claimed_at ? new Date(lead.claimed_at).getTime() : new Date(lead.created_at).getTime();
  }
  const deadline = refTime + OVERDUE_DAYS * 24 * 60 * 60 * 1000;
  return Math.floor((Date.now() - deadline) / (24 * 60 * 60 * 1000));
}

function getRequiredAction(lead: HotLead): string {
  if (!lead.lead_outcome) {
    return 'Informe: Vendido, Em Atendimento ou Descartado';
  }
  if (lead.lead_outcome === 'em_atendimento') {
    return 'Atualize: Vendido, continue Em Atendimento ou Descartado';
  }
  return 'Atualize o status';
}

function getRefDate(lead: HotLead): string {
  if (lead.lead_outcome === 'em_atendimento' && lead.outcome_at) {
    return format(new Date(lead.outcome_at), "dd/MM/yyyy", { locale: ptBR });
  }
  if (lead.claimed_at) {
    return format(new Date(lead.claimed_at), "dd/MM/yyyy", { locale: ptBR });
  }
  return format(new Date(lead.created_at), "dd/MM/yyyy", { locale: ptBR });
}

export function OverdueLeadsPopup({ open, onOpenChange, overdueLeads, onGoToTab }: OverdueLeadsPopupProps) {
  const acquiredOverdue = overdueLeads.filter(l => !l.lead_outcome);
  const inProgressOverdue = overdueLeads.filter(l => l.lead_outcome === 'em_atendimento');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5" />
            Leads pendentes de atualização
          </DialogTitle>
          <DialogDescription>
            Você possui <strong>{overdueLeads.length}</strong> lead{overdueLeads.length > 1 ? 's' : ''} sem atualização há mais de 7 dias. 
            Atualize o status de cada um para desbloquear novas aquisições.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {acquiredOverdue.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  Adquiridos ({acquiredOverdue.length})
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-blue-600 hover:text-blue-700"
                  onClick={() => { onGoToTab('acquired'); onOpenChange(false); }}
                >
                  Ir para aba <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <div className="space-y-2">
                {acquiredOverdue.map(lead => {
                  const daysOver = getDaysSinceDeadline(lead);
                  return (
                    <div key={lead.id} className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{lead.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Adquirido em {getRefDate(lead)}
                            </span>
                            <span className="text-[11px] font-bold text-red-600">
                              {daysOver > 0 ? `${daysOver}d atrasado` : 'Expirado hoje'}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-medium">
                            → {getRequiredAction(lead)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {inProgressOverdue.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Em Atendimento ({inProgressOverdue.length})
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-amber-600 hover:text-amber-700"
                  onClick={() => { onGoToTab('in_progress'); onOpenChange(false); }}
                >
                  Ir para aba <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <div className="space-y-2">
                {inProgressOverdue.map(lead => {
                  const daysOver = getDaysSinceDeadline(lead);
                  return (
                    <div key={lead.id} className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{lead.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Último update em {getRefDate(lead)}
                            </span>
                            <span className="text-[11px] font-bold text-red-600">
                              {daysOver > 0 ? `${daysOver}d atrasado` : 'Expirado hoje'}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-medium">
                            → {getRequiredAction(lead)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
