import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { RefreshCw } from "lucide-react";
import { useMetricHistory, MetricSeries } from "@/hooks/useMetricHistory";

interface MetricHistoryChartsProps {
  days?: number;
}

export function MetricHistoryCharts({ days = 7 }: MetricHistoryChartsProps) {
  const { series, isLoading, refetch } = useMetricHistory(days);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (series.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Histórico de Performance</CardTitle>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <p className="text-muted-foreground">
              Nenhum dado histórico registrado ainda.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              As métricas serão registradas automaticamente conforme o sistema opera.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for multi-line chart
  const chartData = mergeSeriesData(series);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Histórico de Performance</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Últimos {days} dias
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {series.map((s) => (
            <Badge
              key={s.key}
              variant="outline"
              style={{ borderColor: s.color, color: s.color }}
            >
              {s.name}
            </Badge>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="time"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Helper to merge multiple series into a single dataset
function mergeSeriesData(series: MetricSeries[]): Record<string, unknown>[] {
  const timeMap = new Map<string, Record<string, unknown>>();

  series.forEach((s) => {
    s.data.forEach((point) => {
      if (!timeMap.has(point.time)) {
        timeMap.set(point.time, { time: point.time });
      }
      const entry = timeMap.get(point.time)!;
      entry[s.key] = point.value;
    });
  });

  return Array.from(timeMap.values()).sort((a, b) =>
    String(a.time).localeCompare(String(b.time))
  );
}
