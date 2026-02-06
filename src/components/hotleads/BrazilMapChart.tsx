import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { HotLead } from '@/hooks/useHotLeads';

interface BrazilMapChartProps {
  leads: HotLead[];
}

// Brazil states SVG paths - simplified representation
const BRAZIL_STATES: Record<string, { path: string; center: { x: number; y: number }; name: string }> = {
  AC: { path: 'M45,200 L80,190 L85,220 L50,225 Z', center: { x: 62, y: 210 }, name: 'Acre' },
  AM: { path: 'M80,120 L200,100 L220,180 L180,220 L80,200 Z', center: { x: 140, y: 160 }, name: 'Amazonas' },
  AP: { path: 'M290,80 L330,60 L350,100 L310,120 Z', center: { x: 315, y: 90 }, name: 'Amapá' },
  PA: { path: 'M220,100 L350,100 L370,180 L280,220 L200,180 Z', center: { x: 280, y: 150 }, name: 'Pará' },
  RO: { path: 'M120,220 L180,220 L190,280 L130,290 Z', center: { x: 155, y: 255 }, name: 'Rondônia' },
  RR: { path: 'M180,40 L230,30 L240,90 L190,100 Z', center: { x: 210, y: 65 }, name: 'Roraima' },
  TO: { path: 'M300,220 L340,210 L350,320 L310,330 Z', center: { x: 325, y: 270 }, name: 'Tocantins' },
  MA: { path: 'M350,180 L420,160 L430,240 L370,250 Z', center: { x: 390, y: 210 }, name: 'Maranhão' },
  PI: { path: 'M400,240 L450,230 L460,320 L410,330 Z', center: { x: 430, y: 280 }, name: 'Piauí' },
  CE: { path: 'M460,200 L510,190 L520,260 L470,270 Z', center: { x: 490, y: 230 }, name: 'Ceará' },
  RN: { path: 'M520,210 L560,200 L565,240 L525,250 Z', center: { x: 542, y: 225 }, name: 'Rio Grande do Norte' },
  PB: { path: 'M520,250 L570,245 L575,280 L525,285 Z', center: { x: 547, y: 265 }, name: 'Paraíba' },
  PE: { path: 'M490,285 L570,280 L575,320 L495,325 Z', center: { x: 532, y: 302 }, name: 'Pernambuco' },
  AL: { path: 'M530,325 L570,322 L572,355 L532,358 Z', center: { x: 551, y: 340 }, name: 'Alagoas' },
  SE: { path: 'M530,358 L560,355 L562,385 L532,388 Z', center: { x: 546, y: 372 }, name: 'Sergipe' },
  BA: { path: 'M400,320 L530,310 L540,450 L410,460 Z', center: { x: 465, y: 385 }, name: 'Bahia' },
  MT: { path: 'M190,280 L300,260 L320,380 L200,400 Z', center: { x: 250, y: 330 }, name: 'Mato Grosso' },
  GO: { path: 'M320,340 L400,330 L410,430 L330,440 Z', center: { x: 365, y: 385 }, name: 'Goiás' },
  DF: { path: 'M370,380 L395,378 L397,400 L372,402 Z', center: { x: 383, y: 390 }, name: 'Distrito Federal' },
  MS: { path: 'M230,400 L320,390 L330,490 L240,500 Z', center: { x: 280, y: 445 }, name: 'Mato Grosso do Sul' },
  MG: { path: 'M380,430 L500,420 L510,520 L390,530 Z', center: { x: 445, y: 475 }, name: 'Minas Gerais' },
  ES: { path: 'M510,460 L550,455 L555,510 L515,515 Z', center: { x: 532, y: 485 }, name: 'Espírito Santo' },
  RJ: { path: 'M480,520 L550,515 L555,560 L485,565 Z', center: { x: 517, y: 540 }, name: 'Rio de Janeiro' },
  SP: { path: 'M340,490 L480,480 L490,570 L350,580 Z', center: { x: 415, y: 530 }, name: 'São Paulo' },
  PR: { path: 'M300,540 L400,530 L410,600 L310,610 Z', center: { x: 355, y: 570 }, name: 'Paraná' },
  SC: { path: 'M320,610 L400,605 L405,660 L325,665 Z', center: { x: 362, y: 635 }, name: 'Santa Catarina' },
  RS: { path: 'M280,665 L390,660 L400,750 L290,755 Z', center: { x: 340, y: 708 }, name: 'Rio Grande do Sul' },
};

export function BrazilMapChart({ leads }: BrazilMapChartProps) {
  const stateData = useMemo(() => {
    const byState: Record<string, number> = {};
    leads.forEach(l => {
      const state = l.state?.toUpperCase() || 'N/A';
      byState[state] = (byState[state] || 0) + 1;
    });
    
    const maxCount = Math.max(...Object.values(byState), 1);
    return { byState, maxCount };
  }, [leads]);

  const getStateColor = (stateCode: string) => {
    const count = stateData.byState[stateCode] || 0;
    if (count === 0) return 'hsl(var(--muted))';
    
    const intensity = Math.min(count / stateData.maxCount, 1);
    // Orange gradient from light to dark
    const lightness = 80 - (intensity * 45); // 80% to 35%
    return `hsl(25, 95%, ${lightness}%)`;
  };

  const sortedStates = useMemo(() => {
    return Object.entries(stateData.byState)
      .filter(([state]) => state !== 'N/A')
      .sort((a, b) => b[1] - a[1]);
  }, [stateData.byState]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span>Distribuição Geográfica</span>
          <span className="text-sm font-normal text-muted-foreground">
            {sortedStates.length} estados ativos
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Map */}
          <TooltipProvider delayDuration={0}>
            <div className="relative">
              <svg
                viewBox="0 0 600 800"
                className="w-full h-auto max-h-[400px]"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              >
                {Object.entries(BRAZIL_STATES).map(([code, state]) => {
                  const count = stateData.byState[code] || 0;
                  return (
                    <Tooltip key={code}>
                      <TooltipTrigger asChild>
                        <g className="cursor-pointer transition-all hover:opacity-80">
                          <path
                            d={state.path}
                            fill={getStateColor(code)}
                            stroke="hsl(var(--background))"
                            strokeWidth="2"
                            className="transition-colors duration-200"
                          />
                          {count > 0 && (
                            <text
                              x={state.center.x}
                              y={state.center.y}
                              textAnchor="middle"
                              dominantBaseline="central"
                              className="text-[10px] font-bold fill-foreground pointer-events-none"
                            >
                              {count}
                            </text>
                          )}
                        </g>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="z-50">
                        <div className="text-center">
                          <p className="font-semibold">{state.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {count} {count === 1 ? 'lead' : 'leads'}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </svg>
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="text-xs text-muted-foreground">Menos</span>
                <div className="flex h-3 rounded-full overflow-hidden">
                  {[80, 65, 50, 35].map((lightness) => (
                    <div
                      key={lightness}
                      className="w-6 h-full"
                      style={{ backgroundColor: `hsl(25, 95%, ${lightness}%)` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">Mais</span>
              </div>
            </div>
          </TooltipProvider>

          {/* State Ranking */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Ranking por Estado</h4>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-2">
              {sortedStates.slice(0, 15).map(([state, count], index) => {
                const percentage = ((count / leads.length) * 100).toFixed(1);
                const barWidth = (count / stateData.maxCount) * 100;
                
                return (
                  <div key={state} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-5 text-muted-foreground">
                      {index + 1}º
                    </span>
                    <span className="text-sm font-medium w-8">{state}</span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-10 text-right">{count}</span>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
