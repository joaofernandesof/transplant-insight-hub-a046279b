import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Target, Flame, UserCheck, Clock, Award } from 'lucide-react';
import type { HotLead } from '@/hooks/useHotLeads';

interface HotLeadsOverviewProps {
  leads: HotLead[];
  myLeads: HotLead[];
  availableLeads: HotLead[];
  acquiredLeads: HotLead[];
}

export function HotLeadsOverview({ leads, myLeads, availableLeads, acquiredLeads }: HotLeadsOverviewProps) {
  const stats = useMemo(() => {
    const total = leads.length;
    const claimed = leads.filter(l => l.claimed_by).length;
    const available = availableLeads.length;
    const mine = myLeads.length;
    
    // Simulated opportunity value (each lead = R$ 15.000 average)
    const avgLeadValue = 15000;
    const totalOpportunity = total * avgLeadValue;
    const myOpportunity = mine * avgLeadValue;
    
    // Calculate states distribution
    const byState: Record<string, number> = {};
    leads.forEach(l => {
      const state = l.state || 'N/A';
      byState[state] = (byState[state] || 0) + 1;
    });
    
    // Top states
    const topStates = Object.entries(byState)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Today's leads
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLeads = leads.filter(l => new Date(l.created_at) >= today).length;
    
    // This week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekLeads = leads.filter(l => new Date(l.created_at) >= weekAgo).length;
    
    // Acquisition rate
    const acquisitionRate = total > 0 ? ((claimed / total) * 100).toFixed(1) : '0';
    
    return {
      total,
      claimed,
      available,
      mine,
      totalOpportunity,
      myOpportunity,
      byState,
      topStates,
      todayLeads,
      weekLeads,
      acquisitionRate,
    };
  }, [leads, myLeads, availableLeads]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return `R$ ${value}`;
  };

  return (
    <div className="space-y-6">
      {/* Hero Stats - Big Impact Numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads - Main Hero */}
        <Card className="col-span-2 lg:col-span-1 bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Total de Leads</p>
                <p className="text-5xl font-bold mt-1">{stats.total}</p>
                <p className="text-orange-100 text-xs mt-2">
                  +{stats.weekLeads} esta semana
                </p>
              </div>
              <Flame className="h-16 w-16 text-orange-200/50" />
            </div>
          </CardContent>
        </Card>

        {/* Opportunity Value */}
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Oportunidades</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(stats.totalOpportunity)}</p>
                <p className="text-emerald-100 text-xs mt-2">
                  Potencial total
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-emerald-200/50" />
            </div>
          </CardContent>
        </Card>

        {/* Available Leads */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Disponíveis</p>
                <p className="text-3xl font-bold mt-1">{stats.available}</p>
                <p className="text-blue-100 text-xs mt-2">
                  Aguardando você
                </p>
              </div>
              <Target className="h-12 w-12 text-blue-200/50" />
            </div>
          </CardContent>
        </Card>

        {/* My Leads */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Meus Leads</p>
                <p className="text-3xl font-bold mt-1">{stats.mine}</p>
                <p className="text-purple-100 text-xs mt-2">
                  {formatCurrency(stats.myOpportunity)} em potencial
                </p>
              </div>
              <UserCheck className="h-12 w-12 text-purple-200/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.todayLeads}</p>
                <p className="text-xs text-muted-foreground">Leads hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.weekLeads}</p>
                <p className="text-xs text-muted-foreground">Última semana</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.claimed}</p>
                <p className="text-xs text-muted-foreground">Adquiridos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.acquisitionRate}%</p>
                <p className="text-xs text-muted-foreground">Taxa captação</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top States Quick View */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Top Regiões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats.topStates.map(([state, count]) => (
              <div
                key={state}
                className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full"
              >
                <span className="font-semibold">{state}</span>
                <span className="text-sm text-muted-foreground">{count} leads</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
