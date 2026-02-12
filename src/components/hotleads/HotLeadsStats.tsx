import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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

  // Top 5 states by lead count
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
    { label: 'Total de Leads', value: totalActive, icon: Users, color: 'text-orange-500' },
    { label: 'Disponíveis', value: availableCount, icon: Flame, color: 'text-green-500' },
    { label: 'Meus Leads', value: myLeadsCount, icon: UserCheck, color: 'text-blue-500' },
    { label: 'Perdidos', value: acquiredCount, icon: UserX, color: 'text-muted-foreground' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
      {/* Macro numbers */}
      {stats.map((stat) => (
        <Card key={stat.label} className="border">
          <CardContent className="p-3 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{stat.value.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Pie chart - Distribution */}
      <Card className="border">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Distribuição
          </p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={64}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={18}
                  outerRadius={30}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value}`, name]}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
          )}
        </CardContent>
      </Card>

      {/* Bar chart - Top States */}
      <Card className="border">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground mb-1">Top Estados</p>
          {topStates.length > 0 ? (
            <ResponsiveContainer width="100%" height={64}>
              <BarChart data={topStates} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="state" width={24} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={8} />
                <Tooltip
                  formatter={(value: number) => [`${value} leads`]}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
