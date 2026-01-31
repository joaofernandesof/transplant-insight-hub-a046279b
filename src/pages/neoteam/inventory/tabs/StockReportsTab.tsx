/**
 * Stock Reports Tab - Relatórios de estoque
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Download,
  FileText,
  TrendingUp,
  Package,
  DollarSign
} from 'lucide-react';

const REPORTS = [
  {
    id: 'inventory-value',
    title: 'Valor do Estoque',
    description: 'Relatório com valor total do estoque por categoria',
    icon: DollarSign,
  },
  {
    id: 'consumption-analysis',
    title: 'Análise de Consumo',
    description: 'Consumo médio por período e previsão de reposição',
    icon: TrendingUp,
  },
  {
    id: 'movement-history',
    title: 'Histórico de Movimentações',
    description: 'Todas as entradas, saídas e ajustes do período',
    icon: BarChart3,
  },
  {
    id: 'critical-items',
    title: 'Itens Críticos',
    description: 'Relatório de itens com estoque crítico e pendências',
    icon: Package,
  },
];

export function StockReportsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios Disponíveis
          </CardTitle>
          <CardDescription>
            Selecione um relatório para gerar e exportar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {REPORTS.map((report) => (
              <Card key={report.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <report.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{report.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {report.description}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total do Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 45.230,00</div>
            <p className="text-xs text-muted-foreground mt-1">
              Atualizado em tempo real
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Consumo Mensal Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 12.450,00</div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimos 3 meses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Giro de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.6x</div>
            <p className="text-xs text-muted-foreground mt-1">
              Renovação anual
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
