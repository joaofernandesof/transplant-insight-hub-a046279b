import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

// Gerar dados do gráfico serrote (sawtooth)
// O estoque começa no máximo, cai linearmente até zero, e sobe instantaneamente de volta
const generateSawtoothData = () => {
  const data = [];
  const maxStock = 100;
  const cycleLength = 50; // pontos por ciclo
  
  // Primeiro ciclo: máximo -> zero
  for (let i = 0; i <= cycleLength; i++) {
    const stock = maxStock - (maxStock * i / cycleLength);
    data.push({
      time: i,
      stock: Math.max(0, stock),
      label: i === 0 ? 'Início' : i === cycleLength ? 'Reposição' : '',
    });
  }
  
  // Segundo ciclo: máximo -> parcial (para mostrar continuidade)
  for (let i = 1; i <= cycleLength * 0.7; i++) {
    const stock = maxStock - (maxStock * i / cycleLength);
    data.push({
      time: cycleLength + i,
      stock: Math.max(0, stock),
      label: '',
    });
  }
  
  return data;
};

const data = generateSawtoothData();

// Níveis de referência
const LEVELS = {
  max: 100,      // 2 meses
  reorder: 66,   // 1 mês (ponto de reposição)
  safety: 33,    // 15 dias (estoque de segurança)
  zero: 0,
};

export function InventoryConceptChart() {
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

        {/* Gráfico */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              {/* Zona Verde (Confortável): acima do ponto de reposição */}
              <defs>
                <linearGradient id="greenZone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="amberZone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="redZone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2} />
                </linearGradient>
              </defs>

              {/* Eixos */}
              <XAxis 
                dataKey="time" 
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                tick={false}
              />
              <YAxis 
                domain={[0, 100]}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                ticks={[0, 33, 66, 100]}
                tickFormatter={(value) => {
                  if (value === 100) return '2 meses';
                  if (value === 66) return '1 mês';
                  if (value === 33) return '15 dias';
                  return 'Zero';
                }}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                width={60}
              />

              {/* Linhas de referência horizontais */}
              <ReferenceLine 
                y={LEVELS.max} 
                stroke="#10b981" 
                strokeDasharray="6 4" 
                strokeWidth={1.5}
                label={{ value: 'Máximo', position: 'right', fontSize: 10, fill: '#10b981' }}
              />
              <ReferenceLine 
                y={LEVELS.reorder} 
                stroke="#f59e0b" 
                strokeDasharray="6 4" 
                strokeWidth={1.5}
                label={{ value: 'Ponto de Reposição', position: 'right', fontSize: 10, fill: '#f59e0b' }}
              />
              <ReferenceLine 
                y={LEVELS.safety} 
                stroke="#ef4444" 
                strokeDasharray="6 4" 
                strokeWidth={1.5}
                label={{ value: 'Estoque Segurança', position: 'right', fontSize: 10, fill: '#ef4444' }}
              />

              {/* Linha vertical de reposição */}
              <ReferenceLine 
                x={50} 
                stroke="hsl(var(--foreground))" 
                strokeDasharray="4 4" 
                strokeWidth={2}
              />

              {/* Área do estoque */}
              <Area
                type="linear"
                dataKey="stock"
                stroke="#1f2937"
                strokeWidth={2.5}
                fill="url(#greenZone)"
                dot={false}
                activeDot={{ r: 4, fill: '#10b981' }}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const value = payload[0].value as number;
                    let status = 'Crítico';
                    let color = 'text-red-600';
                    if (value > LEVELS.reorder) {
                      status = 'Confortável';
                      color = 'text-emerald-600';
                    } else if (value > LEVELS.safety) {
                      status = 'Segurança';
                      color = 'text-amber-600';
                    }
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-2 text-sm">
                        <p className="font-medium">Nível: {value.toFixed(0)}%</p>
                        <p className={color}>Status: {status}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Labels do eixo X */}
        <div className="flex justify-between px-16 text-xs text-muted-foreground -mt-2">
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
