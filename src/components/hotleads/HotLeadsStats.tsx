import { useMemo } from 'react';
import { Flame, Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
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
    { name: 'Disponíveis', value: availableCount, color: '#22c55e' },
    { name: 'Meus', value: myLeadsCount, color: '#3b82f6' },
    { name: 'Perdidos', value: acquiredCount, color: '#94a3b8' },
  ].filter(d => d.value > 0), [availableCount, myLeadsCount, acquiredCount]);

  const topStates = useMemo(() => {
    const stateMap: Record<string, number> = {};
    leads.forEach(l => {
      if (l.state) stateMap[l.state] = (stateMap[l.state] || 0) + 1;
    });
    return Object.entries(stateMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([state, count]) => ({ state, count }));
  }, [leads]);

  const stats = [
    { label: 'Total de Leads', value: totalActive, icon: Users, bg: 'bg-orange-50 dark:bg-orange-950', iconColor: 'text-orange-500', border: 'border-orange-200 dark:border-orange-800' },
    { label: 'Disponíveis', value: availableCount, icon: Flame, bg: 'bg-green-50 dark:bg-green-950', iconColor: 'text-green-500', border: 'border-green-200 dark:border-green-800' },
    { label: 'Meus Leads', value: myLeadsCount, icon: UserCheck, bg: 'bg-blue-50 dark:bg-blue-950', iconColor: 'text-blue-500', border: 'border-blue-200 dark:border-blue-800' },
    { label: 'Perdidos', value: acquiredCount, icon: UserX, bg: 'bg-slate-50 dark:bg-slate-900', iconColor: 'text-slate-400', border: 'border-slate-200 dark:border-slate-700' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
      {/* Macro number cards */}
      {stats.map((stat) => (
        <div key={stat.label} className={`rounded-xl border-2 ${stat.border} ${stat.bg} p-4 flex flex-col justify-center`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-white dark:bg-background shadow-sm ${stat.iconColor}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl lg:text-4xl font-extrabold leading-none tracking-tight">{stat.value.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Pie chart */}
      <div className="rounded-xl border-2 border-border bg-card p-4 flex flex-col">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
          <TrendingUp className="h-3.5 w-3.5" /> Distribuição
        </p>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={100}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={42}
                dataKey="value"
                strokeWidth={2}
                stroke="hsl(var(--card))"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value}`, name]}
                contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-6">Sem dados</p>
        )}
      </div>

      {/* Bar chart */}
      <div className="rounded-xl border-2 border-border bg-card p-4 flex flex-col">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Top Estados</p>
        {topStates.length > 0 ? (
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={topStates} layout="vertical" margin={{ left: 0, right: 4, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="state" width={26} tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={12} />
              <Tooltip
                formatter={(value: number) => [`${value} leads`]}
                contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-6">Sem dados</p>
        )}
      </div>
    </div>
  );
}
