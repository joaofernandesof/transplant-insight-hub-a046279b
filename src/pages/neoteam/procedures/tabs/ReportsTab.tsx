/**
 * Reports Tab - KPIs and Analytics
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Package,
  Users,
  AlertTriangle,
  DollarSign
} from 'lucide-react';

export function ReportsTab() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Custo Médio por Procedimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 245,80</div>
            <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
              <TrendingDown className="h-3 w-3" />
              -5% vs mês anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Consumo Real vs Padrão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+8.2%</div>
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              Acima do esperado
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Taxa de Divergência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5%</div>
            <p className="text-xs text-muted-foreground mt-1">
              15 de 120 aplicações
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Aplicações no Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">120</div>
            <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              +15% vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Consumo por Procedimento
            </CardTitle>
            <CardDescription>
              Comparativo de custo real vs padrão
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Gráfico de consumo por procedimento</p>
              <p className="text-sm">Dados serão exibidos com uso real</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top 10 Itens com Divergência
            </CardTitle>
            <CardDescription>
              Itens que mais fogem do padrão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Minoxidil 5%', rate: 25, color: 'bg-red-500' },
                { name: 'Anestésico Local', rate: 18, color: 'bg-orange-500' },
                { name: 'Seringa 5ml', rate: 15, color: 'bg-yellow-500' },
                { name: 'Gel Condutor', rate: 12, color: 'bg-blue-500' },
                { name: 'Luvas Estéreis', rate: 10, color: 'bg-green-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-32 truncate text-sm">{item.name}</div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color}`} 
                      style={{ width: `${item.rate * 4}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm font-medium">
                    {item.rate}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Deviations by User */}
      <Card>
        <CardHeader>
          <CardTitle>Divergências por Colaborador</CardTitle>
          <CardDescription>
            Ranking de divergências registradas por profissional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { name: 'Maria Santos', role: 'Técnica', divergences: 8, total: 45 },
              { name: 'Carlos Silva', role: 'Técnico', divergences: 6, total: 38 },
              { name: 'Ana Costa', role: 'Enfermeira', divergences: 4, total: 52 },
              { name: 'Pedro Lima', role: 'Técnico', divergences: 3, total: 29 },
              { name: 'Julia Rocha', role: 'Enfermeira', divergences: 2, total: 41 },
            ].map((user, i) => (
              <Card key={i} className="bg-muted/50">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <span className="text-sm font-medium">{user.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div className="font-medium text-sm">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.role}</div>
                  <div className="mt-2 text-lg font-bold">
                    {user.divergences}/{user.total}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {((user.divergences / user.total) * 100).toFixed(1)}% taxa
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
