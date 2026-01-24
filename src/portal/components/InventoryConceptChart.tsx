import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';

interface ZoneInfo {
  name: string;
  description: string;
  bgColor: string;
  textColor: string;
  icon: React.ReactNode;
  duration: string;
}

const zones: Record<string, ZoneInfo> = {
  comfortable: {
    name: 'Estoque Confortável',
    description: 'Nível ideal de estoque. Produtos disponíveis para atender à demanda sem excesso.',
    bgColor: 'bg-emerald-500',
    textColor: 'text-emerald-600',
    icon: <TrendingUp className="h-4 w-4" />,
    duration: '2 meses de cobertura'
  },
  safety: {
    name: 'Estoque de Segurança',
    description: 'Nível de alerta. Hora de planejar a reposição para evitar rupturas.',
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-600',
    icon: <ShieldCheck className="h-4 w-4" />,
    duration: '15 dias a 1 mês'
  },
  critical: {
    name: 'Zona Crítica',
    description: 'Atenção urgente! Risco de ruptura de estoque. Ação imediata necessária.',
    bgColor: 'bg-red-500',
    textColor: 'text-red-600',
    icon: <AlertTriangle className="h-4 w-4" />,
    duration: 'Menos de 15 dias'
  }
};

export function InventoryConceptChart() {
  const [activeZone, setActiveZone] = useState<string | null>(null);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Info className="h-5 w-5 text-primary" />
          Gestão Eficiente de Estoque
        </CardTitle>
        <CardDescription>
          Entenda os níveis de estoque e quando agir para manter a operação fluindo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend - Zones */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(zones).map(([key, zone]) => (
            <Badge
              key={key}
              variant="outline"
              className={`cursor-pointer transition-all gap-1.5 ${
                activeZone === key 
                  ? `${zone.bgColor} text-white border-transparent` 
                  : 'hover:bg-muted'
              }`}
              onClick={() => setActiveZone(activeZone === key ? null : key)}
            >
              {zone.icon}
              <span>{zone.name}</span>
            </Badge>
          ))}
        </div>

        {/* Zone Description when active */}
        {activeZone && (
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full ${zones[activeZone].bgColor}`} />
              <span className="font-medium text-sm">{zones[activeZone].name}</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {zones[activeZone].duration}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {zones[activeZone].description}
            </p>
          </div>
        )}

        {/* Visual Chart - Simplified with divs */}
        <div className="relative bg-muted/30 rounded-xl p-4 overflow-hidden">
          {/* Y-Axis Labels */}
          <div className="absolute left-0 top-4 bottom-12 w-16 flex flex-col justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-emerald-600">2 meses</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-amber-600">1 mês</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-red-600">15 dias</span>
            </div>
            <div>
              <span className="text-muted-foreground">Zero</span>
            </div>
          </div>

          {/* Chart Area */}
          <div className="ml-16 mr-4">
            {/* Reference Lines */}
            <div className="relative h-48 border-l-2 border-b-2 border-muted-foreground/30">
              {/* Horizontal reference lines */}
              <div className="absolute top-0 left-0 right-0 h-px border-t-2 border-dashed border-emerald-400" />
              <div className="absolute top-1/3 left-0 right-0 h-px border-t-2 border-dashed border-amber-400" />
              <div className="absolute top-2/3 left-0 right-0 h-px border-t-2 border-dashed border-red-400" />
              
              {/* Right side labels */}
              <div className="absolute -right-2 top-0 transform translate-x-full text-xs text-emerald-600 font-medium whitespace-nowrap">
                Máximo
              </div>
              <div className="absolute -right-2 top-1/3 transform translate-x-full text-xs text-amber-600 font-medium whitespace-nowrap">
                Ponto de Reposição
              </div>
              <div className="absolute -right-2 top-2/3 transform translate-x-full text-xs text-red-600 font-medium whitespace-nowrap">
                Estoque de Segurança
              </div>

              {/* SVG Sawtooth Chart */}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                {/* First cycle - Green zone */}
                <polygon 
                  points="0,0 0,33 17,33" 
                  fill="#10b981" 
                  opacity={activeZone && activeZone !== 'comfortable' ? 0.3 : 0.8}
                  className="transition-opacity duration-300"
                />
                {/* First cycle - Yellow zone */}
                <polygon 
                  points="0,33 17,33 0,66 33,66" 
                  fill="#f59e0b" 
                  opacity={activeZone && activeZone !== 'safety' ? 0.3 : 0.8}
                  className="transition-opacity duration-300"
                />
                {/* First cycle - Red zone */}
                <polygon 
                  points="0,66 33,66 0,100 50,100" 
                  fill="#ef4444" 
                  opacity={activeZone && activeZone !== 'critical' ? 0.3 : 0.8}
                  className="transition-opacity duration-300"
                />

                {/* Second cycle - Green zone */}
                <polygon 
                  points="50,0 50,33 67,33" 
                  fill="#10b981" 
                  opacity={activeZone && activeZone !== 'comfortable' ? 0.3 : 0.8}
                  className="transition-opacity duration-300"
                />
                {/* Second cycle - Yellow zone */}
                <polygon 
                  points="50,33 67,33 50,66 83,66" 
                  fill="#f59e0b" 
                  opacity={activeZone && activeZone !== 'safety' ? 0.3 : 0.8}
                  className="transition-opacity duration-300"
                />
                {/* Second cycle - Red zone */}
                <polygon 
                  points="50,66 83,66 50,100 100,100" 
                  fill="#ef4444" 
                  opacity={activeZone && activeZone !== 'critical' ? 0.3 : 0.8}
                  className="transition-opacity duration-300"
                />

                {/* Consumption lines */}
                <line x1="0" y1="0" x2="50" y2="100" stroke="#1f2937" strokeWidth="2" />
                <line x1="50" y1="0" x2="100" y2="100" stroke="#1f2937" strokeWidth="2" />
                
                {/* Reorder vertical lines */}
                <line x1="50" y1="0" x2="50" y2="100" stroke="#1f2937" strokeWidth="1.5" strokeDasharray="4 2" />
              </svg>

              {/* Zone labels on chart */}
              <div className="absolute top-[10%] left-[5%] text-white text-xs font-medium drop-shadow-sm pointer-events-none">
                Confortável
              </div>
              <div className="absolute top-[40%] left-[8%] text-white text-xs font-medium drop-shadow-sm pointer-events-none">
                Segurança
              </div>
              <div className="absolute top-[75%] left-[12%] text-white text-xs font-medium drop-shadow-sm pointer-events-none">
                Crítico
              </div>

              {/* Reorder point indicator */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-lg" />
              </div>
            </div>

            {/* X-Axis */}
            <div className="flex justify-between mt-6 text-xs text-muted-foreground">
              <span>Início</span>
              <div className="flex flex-col items-center">
                <span className="text-emerald-600 font-semibold">Reposição</span>
              </div>
              <span>Tempo →</span>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <TrendingUp className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Ideal</p>
              <p className="text-xs text-muted-foreground">Mantenha entre o máximo e o ponto de reposição</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Atenção</p>
              <p className="text-xs text-muted-foreground">Faça pedidos ao atingir o ponto de reposição</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
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
