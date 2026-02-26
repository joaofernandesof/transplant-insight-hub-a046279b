import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Megaphone, Target, FileText, BarChart3 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const UTM_COLORS = [
  '#a855f7', '#7c3aed', '#6366f1', '#3b82f6', '#0ea5e9',
  '#14b8a6', '#22c55e', '#eab308', '#f97316', '#ef4444',
];

export function UtmMetricsCard() {
  const [isOpen, setIsOpen] = useState(false);
  const { accountId } = useAvivarAccount();

  const { data, isLoading } = useQuery({
    queryKey: ['avivar-utm-metrics', accountId],
    queryFn: async () => {
      if (!accountId) return null;

      const { data: leads, error } = await supabase
        .from('avivar_kanban_leads')
        .select('utm_source, utm_medium, utm_campaign')
        .eq('account_id', accountId);

      if (error) throw error;

      const allLeads = leads || [];
      const withUtm = allLeads.filter(l => l.utm_source);
      const withoutUtm = allLeads.length - withUtm.length;

      // Group by source
      const bySource: Record<string, number> = {};
      const byMedium: Record<string, number> = {};
      const byCampaign: Record<string, number> = {};

      withUtm.forEach(l => {
        const src = l.utm_source || 'Desconhecido';
        bySource[src] = (bySource[src] || 0) + 1;

        if (l.utm_medium) {
          byMedium[l.utm_medium] = (byMedium[l.utm_medium] || 0) + 1;
        }
        if (l.utm_campaign) {
          byCampaign[l.utm_campaign] = (byCampaign[l.utm_campaign] || 0) + 1;
        }
      });

      const toSorted = (obj: Record<string, number>) =>
        Object.entries(obj)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

      return {
        total: allLeads.length,
        withUtm: withUtm.length,
        withoutUtm,
        bySource: toSorted(bySource),
        byMedium: toSorted(byMedium),
        byCampaign: toSorted(byCampaign),
      };
    },
    enabled: !!accountId,
    staleTime: 60000,
  });

  const coveragePercent = data && data.total > 0 ? ((data.withUtm / data.total) * 100).toFixed(0) : '0';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-[hsl(var(--avivar-primary)/0.03)] transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--avivar-primary)/0.1)] flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                </div>
                <div>
                  <CardTitle className="text-base text-[hsl(var(--avivar-foreground))]">
                    Métricas de UTM
                  </CardTitle>
                  <CardDescription className="text-[hsl(var(--avivar-muted-foreground))]">
                    Análise de origem e campanhas dos leads
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!isLoading && data && (
                  <Badge className="bg-[hsl(var(--avivar-primary)/0.15)] text-[hsl(var(--avivar-primary))] border-[hsl(var(--avivar-primary)/0.3)]">
                    {data.withUtm} de {data.total} ({coveragePercent}%)
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-[hsl(var(--avivar-muted-foreground))]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-[hsl(var(--avivar-muted-foreground))]" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[200px] w-full rounded-lg" />
                <Skeleton className="h-[200px] w-full rounded-lg" />
              </div>
            ) : data && data.withUtm > 0 ? (
              <>
                {/* UTM Source */}
                <div>
                  <h4 className="text-sm font-semibold text-[hsl(var(--avivar-foreground))] flex items-center gap-2 mb-3">
                    <Megaphone className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                    Por Fonte (utm_source)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={data.bySource.slice(0, 8)} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={2}>
                            {data.bySource.slice(0, 8).map((_, i) => (
                              <Cell key={i} fill={UTM_COLORS[i % UTM_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--avivar-card))', borderRadius: '12px', border: '1px solid hsl(var(--avivar-border))', color: 'hsl(var(--avivar-foreground))' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {data.bySource.slice(0, 8).map((item, i) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: UTM_COLORS[i % UTM_COLORS.length] }} />
                            <span className="text-[hsl(var(--avivar-foreground))] truncate max-w-[140px]">{item.name}</span>
                          </div>
                          <span className="font-medium text-[hsl(var(--avivar-foreground))]">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* UTM Medium */}
                {data.byMedium.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[hsl(var(--avivar-foreground))] flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                      Por Meio (utm_medium)
                    </h4>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.byMedium.slice(0, 6)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-[hsl(var(--avivar-border))]" />
                          <XAxis type="number" stroke="currentColor" fontSize={10} />
                          <YAxis dataKey="name" type="category" stroke="currentColor" fontSize={10} width={100} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--avivar-card))', borderRadius: '12px', border: '1px solid hsl(var(--avivar-border))', color: 'hsl(var(--avivar-foreground))' }} />
                          <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} name="Leads" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* UTM Campaign */}
                {data.byCampaign.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[hsl(var(--avivar-foreground))] flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                      Por Campanha (utm_campaign)
                    </h4>
                    <div className="space-y-2">
                      {data.byCampaign.slice(0, 10).map((item) => (
                        <div key={item.name} className="flex items-center justify-between p-2.5 rounded-lg border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-secondary))]">
                          <span className="text-sm text-[hsl(var(--avivar-foreground))] truncate max-w-[60%]">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[hsl(var(--avivar-foreground))]">{item.count}</span>
                            <div className="w-20 h-2 bg-[hsl(var(--avivar-border))] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[hsl(var(--avivar-primary))] rounded-full"
                                style={{ width: `${(item.count / (data.bySource[0]?.count || 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-center text-[hsl(var(--avivar-muted-foreground))] py-8">
                Nenhum lead com dados de UTM encontrado
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
