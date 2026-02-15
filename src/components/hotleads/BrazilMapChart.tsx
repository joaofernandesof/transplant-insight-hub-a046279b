import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import type { HotLead } from '@/hooks/useHotLeads';

interface BrazilMapChartProps {
  leads?: HotLead[];
  byState?: { state: string; total: number }[];
}

// Simplified SVG paths for Brazilian states
const STATE_PATHS: Record<string, string> = {
  AC: 'M95,280 L95,310 L120,310 L120,295 L110,280 Z',
  AM: 'M100,200 L100,270 L170,270 L200,250 L220,250 L220,200 L180,180 L140,185 Z',
  RR: 'M160,140 L155,175 L180,180 L195,160 L185,140 Z',
  AP: 'M260,155 L250,180 L270,195 L285,175 L275,155 Z',
  PA: 'M200,180 L190,200 L195,245 L230,250 L270,245 L290,220 L285,195 L270,195 L250,180 L220,200 Z',
  MA: 'M290,220 L280,245 L290,260 L310,255 L320,235 L310,220 Z',
  PI: 'M310,235 L305,260 L310,280 L325,285 L330,260 L325,240 Z',
  CE: 'M330,230 L325,250 L340,260 L350,245 L345,230 Z',
  RN: 'M350,240 L345,255 L360,258 L362,242 Z',
  PB: 'M345,258 L340,268 L362,270 L362,258 Z',
  PE: 'M325,270 L320,280 L360,280 L362,270 L340,268 Z',
  AL: 'M345,282 L342,295 L358,295 L360,282 Z',
  SE: 'M340,295 L338,308 L352,308 L355,295 Z',
  BA: 'M280,270 L275,310 L290,350 L310,370 L340,370 L345,340 L340,310 L338,295 L325,285 L310,280 Z',
  TO: 'M260,250 L255,310 L280,310 L280,270 L270,250 Z',
  GO: 'M245,320 L240,360 L270,370 L280,350 L280,315 L260,315 Z',
  DF: 'M270,340 L268,350 L278,350 L280,340 Z',
  MT: 'M170,270 L170,340 L230,345 L245,320 L260,315 L255,270 L220,250 L200,250 Z',
  MS: 'M195,345 L195,400 L230,410 L240,380 L240,360 L230,345 Z',
  MG: 'M275,340 L270,370 L280,400 L310,410 L340,390 L345,370 L340,370 L310,370 L290,350 L280,350 Z',
  ES: 'M340,370 L340,395 L355,395 L355,370 Z',
  RJ: 'M310,400 L305,418 L330,420 L340,410 L340,395 Z',
  SP: 'M240,380 L240,420 L280,430 L305,418 L310,400 L280,400 L270,380 Z',
  PR: 'M220,420 L220,450 L265,450 L280,435 L280,430 L240,420 Z',
  SC: 'M235,452 L235,470 L270,470 L270,452 Z',
  RS: 'M220,470 L215,520 L245,530 L270,510 L275,470 Z',
  RO: 'M125,280 L125,320 L170,340 L170,300 L155,280 Z',
};

const STATE_CENTERS: Record<string, [number, number]> = {
  AC: [107, 295], AM: [160, 230], RR: [172, 158], AP: [267, 175],
  PA: [240, 215], MA: [300, 240], PI: [318, 260], CE: [340, 242],
  RN: [355, 248], PB: [352, 264], PE: [342, 275], AL: [352, 288],
  SE: [346, 301], BA: [310, 320], TO: [267, 280], GO: [258, 345],
  DF: [274, 345], MT: [210, 300], MS: [218, 380], MG: [305, 375],
  ES: [348, 382], RJ: [322, 410], SP: [262, 410], PR: [250, 438],
  SC: [252, 462], RS: [245, 500], RO: [145, 305],
};

export function BrazilMapChart({ leads, byState: byStateProp }: BrazilMapChartProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const { stateData, maxCount } = useMemo(() => {
    const data: Record<string, number> = {};

    if (byStateProp) {
      byStateProp.forEach(s => {
        const key = s.state?.toUpperCase();
        if (key && STATE_PATHS[key]) data[key] = s.total;
      });
    } else if (leads) {
      leads.forEach(l => {
        const state = l.state?.toUpperCase() || '';
        if (state && STATE_PATHS[state]) {
          data[state] = (data[state] || 0) + 1;
        }
      });
    }

    const max = Math.max(...Object.values(data), 1);
    return { stateData: data, maxCount: max };
  }, [leads, byStateProp]);

  const getStateColor = (state: string) => {
    const count = stateData[state] || 0;
    if (count === 0) return 'hsl(var(--muted))';
    const intensity = Math.min(count / maxCount, 1);
    const lightness = 80 - intensity * 45;
    const saturation = 70 + intensity * 25;
    return `hsl(25, ${saturation}%, ${lightness}%)`;
  };

  const activeStates = Object.keys(stateData).filter(s => stateData[s] > 0).length;
  const totalMapped = Object.values(stateData).reduce((a, b) => a + b, 0);
  const hoveredCount = hoveredState ? stateData[hoveredState] || 0 : null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-orange-500" />
            Mapa de Calor — Leads por Estado
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {activeStates} estados ativos
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        {hoveredState && (
          <div className="absolute top-2 right-4 z-10 bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
            <span className="font-bold">{hoveredState}</span>
            <span className="text-muted-foreground ml-2">{hoveredCount} leads</span>
          </div>
        )}

        <svg
          viewBox="80 130 310 420"
          className="w-full max-h-[400px]"
          style={{ aspectRatio: '310/420' }}
        >
          {Object.entries(STATE_PATHS).map(([state, path]) => (
            <g key={state}>
              <path
                d={path}
                fill={getStateColor(state)}
                stroke={hoveredState === state ? 'hsl(var(--foreground))' : 'hsl(var(--border))'}
                strokeWidth={hoveredState === state ? 2 : 0.8}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredState(state)}
                onMouseLeave={() => setHoveredState(null)}
                style={{
                  filter: hoveredState === state ? 'brightness(1.15)' : undefined,
                }}
              />
              {STATE_CENTERS[state] && (
                <text
                  x={STATE_CENTERS[state][0]}
                  y={STATE_CENTERS[state][1]}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                  style={{
                    fontSize: state === 'DF' ? 6 : 8,
                    fontWeight: (stateData[state] || 0) > 0 ? 700 : 400,
                    fill: (stateData[state] || 0) > maxCount * 0.5
                      ? 'white'
                      : 'hsl(var(--foreground))',
                  }}
                >
                  {state}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-1 mt-2">
          <span className="text-[10px] text-muted-foreground mr-1">0</span>
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity, i) => (
            <div
              key={i}
              className="w-6 h-3 rounded-sm"
              style={{
                backgroundColor: `hsl(25, ${70 + intensity * 25}%, ${80 - intensity * 45}%)`,
              }}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-1">{maxCount.toLocaleString('pt-BR')}</span>
        </div>
        <p className="text-center text-[11px] text-muted-foreground mt-1">
          {totalMapped.toLocaleString('pt-BR')} leads mapeados em {activeStates} estados
        </p>
      </CardContent>
    </Card>
  );
}
