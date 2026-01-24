import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';

// Níveis de referência (em porcentagem)
const LEVELS = {
  max: 100,      // Máximo
  reorder: 66,   // Ponto de reposição
  safety: 33,    // Estoque de segurança
  zero: 0,
};

export function InventoryConceptChart() {
  // Dimensões do gráfico
  const chartWidth = 100;
  const chartHeight = 100;
  
  // Primeiro ciclo: 100 -> 0 (60% do gráfico)
  const cycle1EndX = 55;
  // Segundo ciclo: 100 -> ~30 (40% restante)
  const cycle2EndX = 95;
  const cycle2EndY = 30;

  // Pontos da linha serrote (coordenadas SVG onde Y cresce pra baixo)
  // Convertemos: Y real = chartHeight - (valor em %)
  const sawtoothPath = `
    M 5,${chartHeight - LEVELS.max}
    L ${cycle1EndX},${chartHeight - LEVELS.zero}
    L ${cycle1EndX},${chartHeight - LEVELS.max}
    L ${cycle2EndX},${chartHeight - cycle2EndY}
  `;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Info className="h-5 w-5 text-primary" />
          Gestão Eficiente de Estoque
        </CardTitle>
        <CardDescription>
          O gráfico "serrote" mostra como o estoque diminui com o consumo e é reposto periodicamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legenda */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1.5 border-emerald-300 text-emerald-700 dark:text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Estoque Confortável
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-amber-300 text-amber-700 dark:text-amber-400">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            Estoque de Segurança
          </Badge>
          <Badge variant="outline" className="gap-1.5 border-red-300 text-red-700 dark:text-red-400">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            Zona Crítica
          </Badge>
        </div>

        {/* Área do Gráfico */}
        <div className="relative">
          {/* Eixo Y - Labels à esquerda */}
          <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-muted-foreground pr-2">
            <span className="text-right">2 meses</span>
            <span className="text-right">1 mês</span>
            <span className="text-right">15 dias</span>
            <span className="text-right">Zero</span>
          </div>

          {/* Container do Gráfico SVG */}
          <div className="ml-16 mr-16">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-64 border-l-2 border-b-2 border-foreground/20"
              preserveAspectRatio="none"
            >
              {/* Faixa Verde (Confortável): de 100% até 66% */}
              <rect 
                x="0" 
                y={chartHeight - LEVELS.max} 
                width={chartWidth} 
                height={LEVELS.max - LEVELS.reorder}
                fill="#10b981"
                opacity="0.15"
              />
              
              {/* Faixa Amarela (Segurança): de 66% até 33% */}
              <rect 
                x="0" 
                y={chartHeight - LEVELS.reorder} 
                width={chartWidth} 
                height={LEVELS.reorder - LEVELS.safety}
                fill="#f59e0b"
                opacity="0.15"
              />
              
              {/* Faixa Vermelha (Crítica): de 33% até 0% */}
              <rect 
                x="0" 
                y={chartHeight - LEVELS.safety} 
                width={chartWidth} 
                height={LEVELS.safety}
                fill="#ef4444"
                opacity="0.15"
              />

              {/* Linhas horizontais tracejadas */}
              {/* Máximo (Verde) */}
              <line 
                x1="0" y1={chartHeight - LEVELS.max} 
                x2={chartWidth} y2={chartHeight - LEVELS.max}
                stroke="#10b981" 
                strokeWidth="0.8" 
                strokeDasharray="3 2"
              />
              {/* Ponto de Reposição (Amarelo) */}
              <line 
                x1="0" y1={chartHeight - LEVELS.reorder} 
                x2={chartWidth} y2={chartHeight - LEVELS.reorder}
                stroke="#f59e0b" 
                strokeWidth="0.8" 
                strokeDasharray="3 2"
              />
              {/* Estoque de Segurança (Vermelho) */}
              <line 
                x1="0" y1={chartHeight - LEVELS.safety} 
                x2={chartWidth} y2={chartHeight - LEVELS.safety}
                stroke="#ef4444" 
                strokeWidth="0.8" 
                strokeDasharray="3 2"
              />

              {/* Área preenchida sob a linha serrote */}
              <defs>
                <clipPath id="sawtoothClip">
                  <path d={`${sawtoothPath} L ${cycle2EndX},${chartHeight} L 5,${chartHeight} Z`} />
                </clipPath>
              </defs>
              
              {/* Preenchimento verde claro da área do estoque */}
              <rect 
                x="0" y="0" 
                width={chartWidth} height={chartHeight}
                fill="#10b981"
                opacity="0.3"
                clipPath="url(#sawtoothClip)"
              />

              {/* Linha vertical tracejada de reposição */}
              <line 
                x1={cycle1EndX} y1="0" 
                x2={cycle1EndX} y2={chartHeight}
                stroke="currentColor" 
                strokeWidth="0.8" 
                strokeDasharray="2 2"
                opacity="0.5"
              />

              {/* Linha serrote principal */}
              <path 
                d={sawtoothPath}
                fill="none"
                stroke="#1f2937"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="dark:stroke-gray-300"
              />
            </svg>
          </div>

          {/* Eixo Y - Labels à direita */}
          <div className="absolute right-0 top-0 bottom-8 w-14 flex flex-col justify-between text-xs pl-2">
            <span className="text-emerald-600 font-medium">Máximo</span>
            <span className="text-amber-600 font-medium">Ponto</span>
            <span className="text-red-600 font-medium">Estoque</span>
            <span className="text-muted-foreground"></span>
          </div>
        </div>

        {/* Labels do eixo X */}
        <div className="flex justify-between ml-16 mr-16 text-xs text-muted-foreground">
          <span>Início</span>
          <span className="text-emerald-600 font-semibold">↑ Reposição</span>
          <span>Tempo →</span>
        </div>

        {/* Cards de dicas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
            <TrendingUp className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Ideal</p>
              <p className="text-xs text-muted-foreground">Mantenha entre máximo e ponto de reposição</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
            <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Atenção</p>
              <p className="text-xs text-muted-foreground">Faça pedidos ao atingir o ponto de reposição</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
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
