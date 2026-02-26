import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface LeadDetail {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  claimed_by?: string;
  claimed_at?: string;
  lead_outcome?: string;
  created_at?: string;
}

interface LicenseeInfo {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  email?: string;
}

interface ChartDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  leads: LeadDetail[];
  licensees?: LicenseeInfo[];
  isLoading?: boolean;
}

const OUTCOME_LABELS: Record<string, { label: string; color: string }> = {
  vendido: { label: 'Vendido', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  em_atendimento: { label: 'Em Atendimento', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  descartado: { label: 'Descartado', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

export function ChartDetailDialog({ open, onOpenChange, title, subtitle, leads, licensees = [], isLoading }: ChartDetailDialogProps) {
  const findLicensee = (userId?: string) => licensees.find(l => l.user_id === userId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {title}
            {subtitle && <Badge variant="outline" className="text-[10px] font-normal">{subtitle}</Badge>}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : leads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum lead encontrado</p>
        ) : (
          <div className="overflow-auto flex-1 rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur">
                <tr>
                  <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground">Nome</th>
                  <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground">Telefone</th>
                  <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground hidden md:table-cell">Cidade/UF</th>
                  <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground">Status</th>
                  <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground hidden sm:table-cell">Licenciado</th>
                  <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground hidden sm:table-cell">Data</th>
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 200).map(lead => {
                  const lic = findLicensee(lead.claimed_by);
                  const outcome = lead.lead_outcome ? OUTCOME_LABELS[lead.lead_outcome] : null;
                  return (
                    <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-3 font-medium truncate max-w-[180px]">{lead.name}</td>
                      <td className="py-2 px-3 text-muted-foreground text-xs">{lead.phone || '—'}</td>
                      <td className="py-2 px-3 text-muted-foreground text-xs hidden md:table-cell">
                        {[lead.city, lead.state].filter(Boolean).join('/') || '—'}
                      </td>
                      <td className="py-2 px-3">
                        {outcome ? (
                          <Badge className={`text-[10px] border-0 ${outcome.color}`}>{outcome.label}</Badge>
                        ) : lead.claimed_by ? (
                          <Badge variant="outline" className="text-[10px]">Adquirido</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Disponível</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3 hidden sm:table-cell">
                        {lic ? (
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={lic.avatar_url || ''} />
                              <AvatarFallback className="text-[8px] bg-muted">
                                {lic.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs truncate max-w-[100px]">{lic.full_name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-xs text-muted-foreground hidden sm:table-cell">
                        {lead.created_at ? format(new Date(lead.created_at), 'dd/MM/yy', { locale: ptBR }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {leads.length > 200 && (
              <p className="text-center text-xs text-muted-foreground py-2">
                Mostrando 200 de {leads.length} leads
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
