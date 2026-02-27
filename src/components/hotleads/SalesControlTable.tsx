/**
 * Tabela colapsável de controle de vendas por região, aluno e procedimento
 */

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShoppingCart, ChevronDown, ChevronUp, MapPin, DollarSign } from 'lucide-react';

interface SoldLead {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  claimed_by: string | null;
  sold_procedure: string | null;
  sold_value: number | null;
  lead_outcome: string | null;
  outcome_at: string | null;
}

interface Licensee {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  state?: string;
}

interface SalesControlTableProps {
  leads: SoldLead[];
  licensees: Licensee[];
}

const STATE_TO_REGION: Record<string, string> = {
  AC: 'Norte', AP: 'Norte', AM: 'Norte', PA: 'Norte', RO: 'Norte', RR: 'Norte', TO: 'Norte',
  AL: 'Nordeste', BA: 'Nordeste', CE: 'Nordeste', MA: 'Nordeste', PB: 'Nordeste', PE: 'Nordeste', PI: 'Nordeste', RN: 'Nordeste', SE: 'Nordeste',
  DF: 'Centro-Oeste', GO: 'Centro-Oeste', MT: 'Centro-Oeste', MS: 'Centro-Oeste',
  ES: 'Sudeste', MG: 'Sudeste', RJ: 'Sudeste', SP: 'Sudeste',
  PR: 'Sul', RS: 'Sul', SC: 'Sul',
};

export function SalesControlTable({ leads, licensees }: SalesControlTableProps) {
  const [isOpen, setIsOpen] = useState(false);

  const soldLeads = useMemo(() => leads.filter(l => l.lead_outcome === 'vendido'), [leads]);

  // By Region
  const byRegion = useMemo(() => {
    const map: Record<string, { count: number; totalValue: number }> = {};
    soldLeads.forEach(l => {
      const region = STATE_TO_REGION[l.state || ''] || 'Não definido';
      if (!map[region]) map[region] = { count: 0, totalValue: 0 };
      map[region].count++;
      map[region].totalValue += l.sold_value || 0;
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [soldLeads]);

  // By Licensee
  const byLicensee = useMemo(() => {
    const map: Record<string, { count: number; totalValue: number }> = {};
    soldLeads.forEach(l => {
      const uid = l.claimed_by || 'unknown';
      if (!map[uid]) map[uid] = { count: 0, totalValue: 0 };
      map[uid].count++;
      map[uid].totalValue += l.sold_value || 0;
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [soldLeads]);

  // By Procedure
  const byProcedure = useMemo(() => {
    const map: Record<string, { count: number; totalValue: number }> = {};
    soldLeads.forEach(l => {
      const proc = l.sold_procedure || 'Não informado';
      if (!map[proc]) map[proc] = { count: 0, totalValue: 0 };
      map[proc].count++;
      map[proc].totalValue += l.sold_value || 0;
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [soldLeads]);

  const totalValue = soldLeads.reduce((s, l) => s + (l.sold_value || 0), 0);

  const getLicenseeName = (uid: string) => {
    const lic = licensees.find(l => l.user_id === uid);
    return lic?.full_name || uid.slice(0, 8);
  };

  const getLicenseeAvatar = (uid: string) => {
    const lic = licensees.find(l => l.user_id === uid);
    return { url: lic?.avatar_url, initials: lic?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?' };
  };

  const formatCurrency = (v: number) => v > 0 ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-green-200 dark:border-green-900">
        <CollapsibleTrigger asChild>
          <button className="w-full text-left">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Controle de Vendas</p>
                  <p className="text-xs text-muted-foreground">
                    {soldLeads.length} venda{soldLeads.length !== 1 ? 's' : ''}
                    {totalValue > 0 && ` · ${formatCurrency(totalValue)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600 border-green-300 dark:border-green-800">
                  {soldLeads.length}
                </Badge>
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </CardContent>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-4">
            {soldLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma venda registrada ainda.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* By Region */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> Por Região
                  </p>
                  <div className="space-y-1.5">
                    {byRegion.map(([region, data]) => (
                      <div key={region} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                        <span className="font-medium">{region}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{data.count}</Badge>
                          {data.totalValue > 0 && (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">{formatCurrency(data.totalValue)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By Licensee */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingCart className="h-3 w-3" /> Por Aluno
                  </p>
                  <div className="space-y-1.5">
                    {byLicensee.map(([uid, data]) => {
                      const avatar = getLicenseeAvatar(uid);
                      return (
                        <div key={uid} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={avatar.url || ''} />
                              <AvatarFallback className="text-[8px] bg-green-100 dark:bg-green-900 text-green-700">{avatar.initials}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium truncate">{getLicenseeName(uid)}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="secondary" className="text-xs">{data.count}</Badge>
                            {data.totalValue > 0 && (
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">{formatCurrency(data.totalValue)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* By Procedure */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="h-3 w-3" /> Por Procedimento
                  </p>
                  <div className="space-y-1.5">
                    {byProcedure.map(([proc, data]) => (
                      <div key={proc} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                        <span className="font-medium">{proc}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{data.count}</Badge>
                          {data.totalValue > 0 && (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">{formatCurrency(data.totalValue)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
