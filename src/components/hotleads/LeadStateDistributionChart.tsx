import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import type { HotLead } from '@/hooks/useHotLeads';

interface LeadStateDistributionChartProps {
  leads: HotLead[];
  tabLabel: string;
  tabColor: string;
}

const STATE_COLORS: Record<string, string> = {
  CE: '#f97316', SP: '#3b82f6', RJ: '#8b5cf6', MG: '#10b981',
  BA: '#ef4444', PE: '#f59e0b', PR: '#06b6d4', RS: '#ec4899',
  SC: '#14b8a6', GO: '#6366f1', DF: '#84cc16', PA: '#a855f7',
  MA: '#e11d48', MT: '#0ea5e9', MS: '#d946ef', ES: '#22c55e',
  PB: '#f43f5e', RN: '#2dd4bf', PI: '#7c3aed', AL: '#fb923c',
  SE: '#38bdf8', TO: '#4ade80', RO: '#c084fc', AC: '#fbbf24',
  AP: '#a3e635', RR: '#f472b6', AM: '#34d399',
};

function getColor(state: string, index: number): string {
  return STATE_COLORS[state] || `hsl(${(index * 37) % 360}, 70%, 55%)`;
}

export function LeadStateDistributionChart({ leads, tabLabel, tabColor }: LeadStateDistributionChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const stateData = useMemo(() => {
    const map = new Map<string, number>();
    for (const lead of leads) {
      const st = lead.state || 'N/D';
      map.set(st, (map.get(st) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  if (leads.length === 0 || stateData.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-all">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">
            Distribuição por Estado
          </span>
          <span className="text-[10px] text-muted-foreground">
            — {tabLabel} ({leads.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mini inline badges when collapsed */}
          {!isExpanded && (
            <div className="hidden sm:flex items-center gap-1">
              {stateData.slice(0, 5).map((d, i) => (
                <span
                  key={d.state}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={{ backgroundColor: getColor(d.state, i) + '20', color: getColor(d.state, i) }}
                >
                  {d.state} {d.count}
                </span>
              ))}
              {stateData.length > 5 && (
                <span className="text-[10px] text-muted-foreground">+{stateData.length - 5}</span>
              )}
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Bar Chart */}
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="state"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  labelStyle={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`${value} leads`, 'Quantidade']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {stateData.map((entry, index) => (
                    <Cell key={entry.state} fill={getColor(entry.state, index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* State pills summary */}
          <div className="flex flex-wrap gap-1.5">
            {stateData.map((d, i) => (
              <div
                key={d.state}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border"
                style={{
                  borderColor: getColor(d.state, i) + '40',
                  backgroundColor: getColor(d.state, i) + '10',
                  color: getColor(d.state, i),
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: getColor(d.state, i) }}
                />
                {d.state}
                <span className="font-bold">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
