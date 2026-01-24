import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, TrendingUp, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';

interface ZoneInfo {
  name: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  duration: string;
}

const zones: Record<string, ZoneInfo> = {
  comfortable: {
    name: 'Estoque Confortável',
    description: 'Nível ideal de estoque. Produtos disponíveis para atender à demanda sem excesso.',
    color: 'bg-emerald-500',
    icon: <TrendingUp className="h-4 w-4" />,
    duration: '2 meses de cobertura'
  },
  safety: {
    name: 'Estoque de Segurança',
    description: 'Nível de alerta. Hora de planejar a reposição para evitar rupturas.',
    color: 'bg-amber-500',
    icon: <ShieldCheck className="h-4 w-4" />,
    duration: '15 dias a 1 mês'
  },
  critical: {
    name: 'Zona Crítica',
    description: 'Atenção urgente! Risco de ruptura de estoque. Ação imediata necessária.',
    color: 'bg-red-500',
    icon: <AlertTriangle className="h-4 w-4" />,
    duration: 'Menos de 15 dias'
  },
  empty: {
    name: 'Estoque Zero',
    description: 'Ruptura de estoque. Impacto direto nas operações.',
    color: 'bg-zinc-500',
    icon: <XCircle className="h-4 w-4" />,
    duration: 'Sem estoque'
  }
};

export function InventoryConceptChart() {
  const [activeZone, setActiveZone] = useState<string | null>(null);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          Gestão Eficiente de Estoque
        </CardTitle>
        <CardDescription>
          Entenda os níveis de estoque e quando agir para manter a operação fluindo
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {/* Legend - Zones */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(zones).map(([key, zone]) => (
            <Badge
              key={key}
              variant={activeZone === key ? 'default' : 'outline'}
              className={`cursor-pointer transition-all ${
                activeZone === key 
                  ? `${zone.color} text-white border-transparent` 
                  : 'hover:bg-muted'
              }`}
              onClick={() => setActiveZone(activeZone === key ? null : key)}
            >
              {zone.icon}
              <span className="ml-1">{zone.name}</span>
            </Badge>
          ))}
        </div>

        {/* Zone Description when active */}
        {activeZone && (
          <div className={`mb-4 p-3 rounded-lg border ${zones[activeZone].color}/10 bg-muted/50`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full ${zones[activeZone].color}`} />
              <span className="font-medium">{zones[activeZone].name}</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {zones[activeZone].duration}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {zones[activeZone].description}
            </p>
          </div>
        )}

        {/* SVG Chart */}
        <div className="relative w-full aspect-[16/9] bg-gradient-to-b from-muted/30 to-muted/50 rounded-xl overflow-hidden">
          <svg 
            viewBox="0 0 400 225" 
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Defs for gradients */}
            <defs>
              <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.7" />
              </linearGradient>
              <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
              </filter>
            </defs>

            {/* Grid lines */}
            <g className="text-muted-foreground/30">
              {[40, 80, 120, 160].map((y) => (
                <line key={y} x1="50" y1={y} x2="380" y2={y} stroke="currentColor" strokeDasharray="4 4" />
              ))}
            </g>

            {/* Y-Axis */}
            <line x1="50" y1="40" x2="50" y2="200" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" />
            <polygon points="50,35 45,45 55,45" fill="currentColor" className="text-muted-foreground" />
            
            {/* X-Axis */}
            <line x1="50" y1="200" x2="380" y2="200" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" />
            <polygon points="385,200 375,195 375,205" fill="currentColor" className="text-muted-foreground" />

            {/* Axis Labels */}
            <text x="30" y="25" className="fill-muted-foreground text-[10px] font-medium" textAnchor="middle">
              Qtd
            </text>
            <text x="380" y="218" className="fill-muted-foreground text-[10px] font-medium" textAnchor="end">
              Tempo
            </text>

            {/* Level Labels */}
            <text x="45" y="44" className="fill-muted-foreground text-[9px]" textAnchor="end">Máximo</text>
            <text x="45" y="84" className="fill-muted-foreground text-[9px]" textAnchor="end">Médio</text>
            <text x="45" y="124" className="fill-muted-foreground text-[9px]" textAnchor="end">Mínimo</text>
            <text x="45" y="200" className="fill-muted-foreground text-[9px]" textAnchor="end">Zero</text>

            {/* Time Labels (Left side) */}
            <text x="8" y="44" className="fill-primary text-[8px] font-semibold">2 MESES</text>
            <text x="8" y="84" className="fill-amber-500 text-[8px] font-semibold">1 MÊS</text>
            <text x="8" y="124" className="fill-red-500 text-[8px] font-semibold">15 DIAS</text>

            {/* Horizontal Reference Lines */}
            {/* Max line - Estoque confortável */}
            <line x1="50" y1="40" x2="380" y2="40" stroke="#10b981" strokeWidth="1.5" strokeDasharray="8 4" />
            <text x="385" y="44" className="fill-emerald-600 text-[8px]" textAnchor="start">Estoque confortável</text>

            {/* Medium line - Ponto de reposição */}
            <line x1="50" y1="80" x2="380" y2="80" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="8 4" />
            <text x="385" y="84" className="fill-amber-600 text-[8px]" textAnchor="start">Ponto de reposição</text>

            {/* Minimum line - Estoque de segurança */}
            <line x1="50" y1="120" x2="380" y2="120" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="8 4" />
            <text x="385" y="124" className="fill-red-600 text-[8px]" textAnchor="start">Estoque de segurança</text>

            {/* Sawtooth Pattern - First Cycle */}
            <g filter="url(#dropShadow)">
              {/* Green zone (Comfortable) */}
              <polygon
                points="60,40 60,80 100,80"
                fill="url(#greenGradient)"
                className={`transition-opacity duration-300 ${activeZone && activeZone !== 'comfortable' ? 'opacity-30' : 'opacity-100'}`}
                onMouseEnter={() => setActiveZone('comfortable')}
                onMouseLeave={() => setActiveZone(null)}
                style={{ cursor: 'pointer' }}
              />
              
              {/* Yellow zone (Safety) */}
              <polygon
                points="100,80 60,80 60,120 140,120"
                fill="url(#yellowGradient)"
                className={`transition-opacity duration-300 ${activeZone && activeZone !== 'safety' ? 'opacity-30' : 'opacity-100'}`}
                onMouseEnter={() => setActiveZone('safety')}
                onMouseLeave={() => setActiveZone(null)}
                style={{ cursor: 'pointer' }}
              />
              
              {/* Red zone (Critical) */}
              <polygon
                points="140,120 60,120 60,200 200,200"
                fill="url(#redGradient)"
                className={`transition-opacity duration-300 ${activeZone && activeZone !== 'critical' ? 'opacity-30' : 'opacity-100'}`}
                onMouseEnter={() => setActiveZone('critical')}
                onMouseLeave={() => setActiveZone(null)}
                style={{ cursor: 'pointer' }}
              />
            </g>

            {/* Descending line (consumption) */}
            <line x1="60" y1="40" x2="200" y2="200" stroke="currentColor" className="text-foreground" strokeWidth="2.5" strokeLinecap="round" />

            {/* Vertical reorder line */}
            <line x1="200" y1="40" x2="200" y2="200" stroke="currentColor" className="text-foreground" strokeWidth="2" strokeDasharray="6 3" />
            
            {/* Ascending line (resupply) */}
            <line x1="200" y1="200" x2="200" y2="40" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

            {/* Second Cycle (smaller, to show repetition) */}
            <g filter="url(#dropShadow)">
              <polygon
                points="200,40 200,80 240,80"
                fill="url(#greenGradient)"
                className={`transition-opacity duration-300 ${activeZone && activeZone !== 'comfortable' ? 'opacity-30' : 'opacity-100'}`}
              />
              <polygon
                points="240,80 200,80 200,120 280,120"
                fill="url(#yellowGradient)"
                className={`transition-opacity duration-300 ${activeZone && activeZone !== 'safety' ? 'opacity-30' : 'opacity-100'}`}
              />
              <polygon
                points="280,120 200,120 200,200 340,200"
                fill="url(#redGradient)"
                className={`transition-opacity duration-300 ${activeZone && activeZone !== 'critical' ? 'opacity-30' : 'opacity-100'}`}
              />
            </g>

            {/* Second cycle lines */}
            <line x1="200" y1="40" x2="340" y2="200" stroke="currentColor" className="text-foreground" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="340" y1="40" x2="340" y2="200" stroke="currentColor" className="text-foreground" strokeWidth="2" strokeDasharray="6 3" />

            {/* Zone Labels on chart */}
            <text x="75" y="65" className="fill-white text-[9px] font-medium drop-shadow-sm" textAnchor="middle">
              Confortável
            </text>
            <text x="95" y="105" className="fill-white text-[9px] font-medium drop-shadow-sm" textAnchor="middle">
              Segurança
            </text>
            <text x="125" y="165" className="fill-white text-[9px] font-medium drop-shadow-sm" textAnchor="middle">
              Crítico
            </text>

            {/* Reorder point annotation */}
            <g>
              <circle cx="200" cy="200" r="5" fill="#10b981" />
              <text x="200" y="215" className="fill-emerald-600 text-[7px] font-medium" textAnchor="middle">
                Reposição
              </text>
            </g>

            {/* Arrow for alert zone */}
            <g>
              <rect x="255" y="185" width="80" height="18" rx="3" fill="hsl(var(--destructive))" fillOpacity="0.15" />
              <text x="295" y="197" className="fill-red-600 text-[7px] font-semibold" textAnchor="middle">
                ⚠ Período de alerta
              </text>
            </g>
          </svg>
        </div>

        {/* Quick Tips */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Ideal</p>
              <p className="text-xs text-muted-foreground">Mantenha entre o máximo e o ponto de reposição</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Atenção</p>
              <p className="text-xs text-muted-foreground">Faça pedidos ao atingir o ponto de reposição</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Urgente</p>
              <p className="text-xs text-muted-foreground">Evite chegar na zona crítica</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
