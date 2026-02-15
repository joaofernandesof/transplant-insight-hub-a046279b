import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import type { HotLead } from '@/hooks/useHotLeads';

interface BrazilMapChartProps {
  leads: HotLead[];
}

const ALL_STATES = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA',
  'MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN',
  'RO','RR','RS','SC','SE','SP','TO'
];

export function BrazilMapChart({ leads }: BrazilMapChartProps) {
  const chartData = useMemo(() => {
    const byState: Record<string, number> = {};
    leads.forEach(l => {
      const state = l.state?.toUpperCase() || '';
      if (state && ALL_STATES.includes(state)) {
        byState[state] = (byState[state] || 0) + 1;
      }
    });

    return ALL_STATES
      .map(s => ({ state: s, count: byState[s] || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  const maxCount = useMemo(() => Math.max(...chartData.map(d => d.count), 1), [chartData]);

  const getBarColor = (count: number) => {
    if (count === 0) return 'hsl(var(--muted))';
    const intensity = Math.min(count / maxCount, 1);
    const lightness = 75 - (intensity * 35);
    return `hsl(25, 95%, ${lightness}%)`;
  };

  const activeStates = chartData.filter(d => d.count > 0).length;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span>Leads por Estado</span>
          <span className="text-sm font-normal text-muted-foreground">
            {activeStates} estados ativos
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} layout="horizontal" margin={{ top: 20, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="state"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              interval={0}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '13px',
              }}
              formatter={(value: number) => [`${value} leads`, 'Total']}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={24}>
              <LabelList
                dataKey="count"
                position="top"
                style={{ fontSize: 8, fontWeight: 600, fill: 'hsl(var(--foreground))' }}
                formatter={(v: number) => v > 0 ? v : ''}
              />
              {chartData.map((entry, index) => (
                <Cell key={index} fill={getBarColor(entry.count)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
