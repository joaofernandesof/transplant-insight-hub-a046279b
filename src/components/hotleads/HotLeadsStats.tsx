import { useMemo } from 'react';
import { Flame, Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import type { HotLead } from '@/hooks/useHotLeads';

interface HotLeadsStatsProps {
  leads: HotLead[];
  availableCount: number;
  myLeadsCount: number;
  acquiredCount: number;
}

export function HotLeadsStats({ leads, availableCount, myLeadsCount, acquiredCount }: HotLeadsStatsProps) {
  const totalActive = availableCount + myLeadsCount + acquiredCount;

  const pieData = useMemo(() => [
    { name: 'Disponíveis', value: availableCount, color: 'hsl(var(--chart-2))' },
    { name: 'Meus', value: myLeadsCount, color: 'hsl(var(--chart-1))' },
    { name: 'Perdidos', value: acquiredCount, color: 'hsl(var(--muted-foreground))' },
  ].filter(d => d.value > 0), [availableCount, myLeadsCount, acquiredCount]);

  const topStates = useMemo(() => {
    const stateMap: Record<string, number> = {};
    leads.forEach(l => {
      if (l.state) stateMap[l.state] = (stateMap[l.state] || 0) + 1;
    });
    return Object.entries(stateMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([state, count]) => ({ state, count }));
  }, [leads]);

  const stats = [
    { label: 'Total', value: totalActive, icon: Users, color: 'text-orange-500' },
    { label: 'Disponíveis', value: availableCount, icon: Flame, color: 'text-green-500' },
    { label: 'Meus', value: myLeadsCount, icon: UserCheck, color: 'text-blue-500' },
    { label: 'Perdidos', value: acquiredCount, icon: UserX, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-3">
      {/* Compact stat strip on mobile, grid on desktop */}
      <div className="flex lg:grid lg:grid-cols-6 gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
        {/* Macro numbers */}
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-2 border rounded-lg p-2.5 bg-card shrink-0 min-w-[120px] lg:min-w-0">
            <div className={`p-1.5 rounded-md bg-muted ${stat.color}`}>
              <stat.icon className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-lg lg:text-2xl font-bold leading-none">{stat.value.toLocaleString('pt-BR')}</p>
              <p className="text-[10px] lg:text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}

        {/* Charts - hidden on mobile, visible on desktop */}
        <div className="hidden lg:flex border rounded-lg p-2.5 bg-card flex-col">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
            <TrendingUp className="h-3 w-3" /> Distribuição
          </p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={56}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={16} outerRadius={26} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [`${value}`, name]} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-3">Sem dados</p>
          )}
        </div>

        <div className="hidden lg:flex border rounded-lg p-2.5 bg-card flex-col">
          <p className="text-[10px] text-muted-foreground mb-1">Top Estados</p>
          {topStates.length > 0 ? (
            <ResponsiveContainer width="100%" height={56}>
              <BarChart data={topStates} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="state" width={22} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={7} />
                <Tooltip formatter={(value: number) => [`${value} leads`]} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-3">Sem dados</p>
          )}
        </div>
      </div>
    </div>
  );
}
