/**
 * Tabela colapsável de ranking de descartes com motivos
 */

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { XCircle, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DiscardLead {
  id: string;
  name: string;
  claimed_by: string | null;
  discard_reason: string | null;
  lead_outcome: string | null;
}

interface Licensee {
  user_id: string;
  full_name: string;
  avatar_url?: string;
}

interface DiscardRankingTableProps {
  leads: DiscardLead[];
  licensees: Licensee[];
}

export function DiscardRankingTable({ leads, licensees }: DiscardRankingTableProps) {
  const [isOpen, setIsOpen] = useState(false);

  const discardedLeads = useMemo(() => leads.filter(l => l.lead_outcome === 'descartado'), [leads]);

  // By reason
  const byReason = useMemo(() => {
    const map: Record<string, number> = {};
    discardedLeads.forEach(l => {
      const reason = l.discard_reason || 'Sem motivo informado';
      map[reason] = (map[reason] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [discardedLeads]);

  // By licensee (ranking of who discards most)
  const byLicensee = useMemo(() => {
    const map: Record<string, { count: number; reasons: Record<string, number> }> = {};
    discardedLeads.forEach(l => {
      const uid = l.claimed_by || 'unknown';
      if (!map[uid]) map[uid] = { count: 0, reasons: {} };
      map[uid].count++;
      const reason = l.discard_reason || 'Sem motivo';
      map[uid].reasons[reason] = (map[uid].reasons[reason] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [discardedLeads]);

  const getLicenseeName = (uid: string) => {
    const lic = licensees.find(l => l.user_id === uid);
    return lic?.full_name || uid.slice(0, 8);
  };

  const getLicenseeAvatar = (uid: string) => {
    const lic = licensees.find(l => l.user_id === uid);
    return { url: lic?.avatar_url, initials: lic?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?' };
  };

  const maxReasonCount = byReason.length > 0 ? byReason[0][1] : 1;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-red-200 dark:border-red-900">
        <CollapsibleTrigger asChild>
          <button className="w-full text-left">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Ranking de Descartes</p>
                  <p className="text-xs text-muted-foreground">
                    {discardedLeads.length} lead{discardedLeads.length !== 1 ? 's' : ''} descartado{discardedLeads.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-red-600 border-red-300 dark:border-red-800">
                  {discardedLeads.length}
                </Badge>
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </CardContent>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-4">
            {discardedLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum descarte registrado ainda.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* By Reason */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3" /> Motivos de Descarte
                  </p>
                  <div className="space-y-2">
                    {byReason.map(([reason, count]) => (
                      <div key={reason} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate">{reason}</span>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">{count} ({((count / discardedLeads.length) * 100).toFixed(0)}%)</span>
                        </div>
                        <Progress value={(count / maxReasonCount) * 100} className="h-1.5 [&>div]:bg-red-500" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* By Licensee */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <XCircle className="h-3 w-3" /> Ranking por Aluno
                  </p>
                  <div className="space-y-1.5">
                    {byLicensee.map(([uid, data], i) => {
                      const avatar = getLicenseeAvatar(uid);
                      const topReason = Object.entries(data.reasons).sort((a, b) => b[1] - a[1])[0];
                      return (
                        <div key={uid} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-muted-foreground w-5 text-center">{i + 1}º</span>
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={avatar.url || ''} />
                              <AvatarFallback className="text-[8px] bg-red-100 dark:bg-red-900 text-red-700">{avatar.initials}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <span className="font-medium truncate block">{getLicenseeName(uid)}</span>
                              {topReason && (
                                <span className="text-[10px] text-muted-foreground truncate block">
                                  Principal: {topReason[0]} ({topReason[1]})
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant="destructive" className="text-xs shrink-0">
                            {data.count}
                          </Badge>
                        </div>
                      );
                    })}
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
