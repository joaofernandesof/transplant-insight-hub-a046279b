// KommoReports - Dashboard de Relatórios com dados reais
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileBarChart, Download, Filter } from 'lucide-react';
import { useKommoLeads } from '../hooks/useKommoData';

const REPORTS = [
  { id: '1', name: 'Resumo Executivo', description: 'Visão geral de KPIs, funis, conversão e receita do período', category: 'Executivo' },
  { id: '2', name: 'Relatório por Funil', description: 'Detalhamento completo de cada funil com etapas, leads e conversão', category: 'Funis' },
  { id: '3', name: 'Relatório por Usuário', description: 'Performance individual de cada responsável com métricas comparativas', category: 'Performance' },
  { id: '4', name: 'Relatório por Origem', description: 'Análise completa de origens, canais e campanhas com ROI', category: 'Marketing' },
  { id: '5', name: 'Relatório de Perdas', description: 'Motivos de perda, padrões de objeção e desperdício comercial', category: 'Comercial' },
  { id: '6', name: 'Relatório de Tarefas', description: 'Produtividade, atrasos e correlação entre tarefas e conversão', category: 'Operacional' },
  { id: '7', name: 'Relatório de Pós-Vendas', description: 'Retenção, churn, reativação e acompanhamento de clientes', category: 'Pós-Vendas' },
  { id: '8', name: 'Relatório por Período', description: 'Comparativo entre períodos com variações e tendências', category: 'Analítico' },
];

export default function KommoReports() {
  const { data: leads = [] } = useKommoLeads();
  const hasData = leads.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground flex-1">
          {hasData 
            ? `Exporte relatórios com base nos ${leads.length} leads sincronizados.`
            : 'Sincronize com o Kommo para habilitar exportações com dados reais.'
          }
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {REPORTS.map(r => (
          <Card key={r.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileBarChart className="h-4 w-4 text-muted-foreground" />
                  {r.name}
                </CardTitle>
                <Badge variant="outline" className="text-xs">{r.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-3">
              <p className="text-xs text-muted-foreground">{r.description}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs gap-1" disabled={!hasData}>
                  <Filter className="h-3 w-3" /> Filtrar
                </Button>
                <Button variant="default" size="sm" className="text-xs gap-1" disabled={!hasData}>
                  <Download className="h-3 w-3" /> Exportar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
