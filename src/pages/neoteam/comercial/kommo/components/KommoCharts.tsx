// ====================================
// KommoCharts - Componentes de gráficos Recharts
// ====================================

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  Legend, AreaChart, Area,
} from 'recharts';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 173 58% 39%))',
  'hsl(var(--chart-3, 197 37% 24%))',
  'hsl(var(--chart-4, 43 74% 66%))',
  'hsl(var(--chart-5, 27 87% 67%))',
  'hsl(var(--destructive))',
];

interface ChartProps {
  data: any[];
  height?: number;
  onClick?: (entry: any) => void;
}

// Bar chart for sources, pipeline distribution, etc.
export function KommoBarChart({ data, height = 250, onClick }: ChartProps & {
  xKey: string;
  yKey: string;
  yLabel?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} onClick={(e) => onClick?.(e?.activePayload?.[0]?.payload)}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
        <XAxis dataKey={(data[0] && Object.keys(data[0])[0]) || 'name'} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            borderColor: 'hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        {Object.keys(data[0] || {}).filter(k => k !== (Object.keys(data[0])[0])).slice(0, 3).map((key, i) => (
          <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} cursor={onClick ? 'pointer' : undefined} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// Donut/Pie chart for loss reasons, status distribution, etc.
export function KommoPieChart({ data, height = 250, onClick }: ChartProps & {
  nameKey?: string;
  valueKey?: string;
}) {
  const nameKey = Object.keys(data[0] || {})[0] || 'name';
  const valueKey = Object.keys(data[0] || {})[1] || 'value';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey={valueKey}
          nameKey={nameKey}
          onClick={(entry) => onClick?.(entry)}
          cursor={onClick ? 'pointer' : undefined}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            borderColor: 'hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Area chart for trends over time
export function KommoAreaChart({ data, height = 250, onClick }: ChartProps & {
  xKey?: string;
  yKeys?: string[];
}) {
  const keys = Object.keys(data[0] || {});
  const xKey = keys[0] || 'date';
  const yKeys = keys.slice(1, 4);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} onClick={(e) => onClick?.(e?.activePayload?.[0]?.payload)}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            borderColor: 'hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        {yKeys.map((key, i) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export { COLORS };
