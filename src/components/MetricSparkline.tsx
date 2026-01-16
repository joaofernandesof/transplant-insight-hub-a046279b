import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricSparklineProps {
  data: (number | null)[];
  weeks: number[];
  currentWeekIndex: number;
  status?: 'bad' | 'medium' | 'good' | 'great' | null;
  higherIsBetter?: boolean;
}

const statusColors = {
  bad: '#ef4444',
  medium: '#eab308',
  good: '#3b82f6',
  great: '#22c55e'
};

export function MetricSparkline({ 
  data, 
  weeks, 
  currentWeekIndex,
  status,
  higherIsBetter = true
}: MetricSparklineProps) {
  // Filter out null values and prepare chart data
  const chartData = data.map((value, index) => ({
    week: weeks[index],
    value: value,
    isCurrent: index === currentWeekIndex
  })).filter(d => d.value !== null && d.value !== undefined);
  
  if (chartData.length < 2) {
    return (
      <div className="flex items-center justify-center h-8 text-muted-foreground text-[10px]">
        <Minus className="w-3 h-3" />
      </div>
    );
  }
  
  // Calculate trend
  const validValues = chartData.map(d => d.value as number);
  const firstHalf = validValues.slice(0, Math.floor(validValues.length / 2));
  const secondHalf = validValues.slice(Math.floor(validValues.length / 2));
  
  const avgFirst = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
  const avgSecond = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
  
  const percentChange = avgFirst !== 0 ? ((avgSecond - avgFirst) / Math.abs(avgFirst)) * 100 : 0;
  const isUptrend = percentChange > 5;
  const isDowntrend = percentChange < -5;
  
  // Determine if trend is positive based on metric type
  const isPositiveTrend = higherIsBetter ? isUptrend : isDowntrend;
  const isNegativeTrend = higherIsBetter ? isDowntrend : isUptrend;
  
  const lineColor = status ? statusColors[status] : '#6366f1';
  
  // Calculate average for reference line
  const avgValue = validValues.reduce((a, b) => a + b, 0) / validValues.length;
  
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg px-2 py-1 shadow-lg text-[10px]">
                      <p className="font-semibold">S{data.week}</p>
                      <p className="text-foreground">{typeof data.value === 'number' ? data.value.toFixed(2) : data.value}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine 
              y={avgValue} 
              stroke="#94a3b8" 
              strokeDasharray="2 2" 
              strokeWidth={0.5}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 2, fill: lineColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Trend Indicator */}
      <div className={cn(
        "flex items-center gap-0.5 text-[9px] font-semibold px-1 py-0.5 rounded",
        isPositiveTrend && "bg-green-200 text-gray-900",
        isNegativeTrend && "bg-red-200 text-gray-900",
        !isPositiveTrend && !isNegativeTrend && "bg-slate-200 text-gray-900"
      )}>
        {isUptrend ? (
          <TrendingUp className="w-2.5 h-2.5" />
        ) : isDowntrend ? (
          <TrendingDown className="w-2.5 h-2.5" />
        ) : (
          <Minus className="w-2.5 h-2.5" />
        )}
        <span>{Math.abs(percentChange).toFixed(0)}%</span>
      </div>
    </div>
  );
}
