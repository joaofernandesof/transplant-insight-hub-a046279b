// KommoReports - Relatórios com exportação CSV funcional
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileBarChart, Download, Filter } from 'lucide-react';
import { useFilteredLeads } from '../hooks/useFilteredKommoData';
import { useKommoUsers, useKommoTasks, useKommoPipelines } from '../hooks/useKommoData';
import { exportLeadsCSV, exportPerformanceCSV, exportToCSV } from '../utils/csvExport';
import { toast } from 'sonner';

export default function KommoReports() {
  const { data: leads = [] } = useFilteredLeads();
  const { data: users = [] } = useKommoUsers();
  const { data: tasks = [] } = useKommoTasks();
  const { data: pipelines = [] } = useKommoPipelines();
  const hasData = leads.length > 0;

  const handleExport = (reportId: string) => {
    switch (reportId) {
      case '1': // Resumo executivo
      case '2': // Por funil
        exportLeadsCSV(leads);
        break;
      case '3': // Por usuário
        exportPerformanceCSV(
          users.map(u => {
            const uLeads = leads.filter(l => l.responsible_user_kommo_id === u.kommo_id);
            const won = uLeads.filter(l => l.is_won);
            return {
              name: u.name,
              role: u.role || 'user',
              leadsReceived: uLeads.length,
              won: won.length,
              lost: uLeads.filter(l => l.is_lost).length,
              conversionRate: uLeads.length > 0 ? ((won.length / uLeads.length) * 100).toFixed(1) : '0',
              revenue: won.reduce((s, l) => s + (l.price || 0), 0),
              tasksCompleted: tasks.filter(t => t.responsible_user_kommo_id === u.kommo_id && t.is_completed).length,
              tasksPending: tasks.filter(t => t.responsible_user_kommo_id === u.kommo_id && !t.is_completed).length,
            };
          })
        );
        break;
      case '4': { // Por origem
        const map = new Map<string, { leads: number; won: number; revenue: number }>();
        leads.forEach(l => {
          const src = l.source_name || l.source || 'Desconhecida';
          const e = map.get(src) || { leads: 0, won: 0, revenue: 0 };
          e.leads++;
          if (l.is_won) { e.won++; e.revenue += l.price || 0; }
          map.set(src, e);
        });
        exportToCSV(
          Array.from(map.entries()).map(([name, d]) => ({
            Origem: name,
            Leads: d.leads,
            Convertidos: d.won,
            'Conv %': d.leads > 0 ? ((d.won / d.leads) * 100).toFixed(1) : '0',
            Receita: d.revenue,
          })),
          'kommo_origens'
        );
        break;
      }
      case '5': { // Perdas
        const lostLeads = leads.filter(l => l.is_lost);
        exportToCSV(
          lostLeads.map(l => ({
            Nome: l.name || '',
            Motivo: l.loss_reason || 'Não informado',
            Valor: l.price || 0,
            Origem: l.source_name || l.source || '',
            Responsável: l.responsible_user_kommo_id || '',
            Data: l.closed_at || '',
          })),
          'kommo_perdas'
        );
        break;
      }
      case '6': // Tarefas
        exportToCSV(
          tasks.map(t => ({
            ID: t.kommo_id,
            Texto: t.text || '',
            Tipo: t.task_type || '',
            Concluída: t.is_completed ? 'Sim' : 'Não',
            Resultado: t.result_text || '',
            Prazo: t.complete_till || '',
            Criado: t.created_at_kommo || '',
          })),
          'kommo_tarefas'
        );
        break;
      default:
        exportLeadsCSV(leads);
    }
    toast.success('Relatório exportado com sucesso');
  };

  const REPORTS = [
    { id: '1', name: 'Resumo Executivo', description: 'Visão geral de KPIs, funis, conversão e receita do período', category: 'Executivo' },
    { id: '2', name: 'Relatório por Funil', description: 'Detalhamento completo de cada funil com etapas, leads e conversão', category: 'Funis' },
    { id: '3', name: 'Relatório por Usuário', description: 'Performance individual de cada responsável com métricas comparativas', category: 'Performance' },
    { id: '4', name: 'Relatório por Origem', description: 'Análise completa de origens, canais e campanhas com ROI', category: 'Marketing' },
    { id: '5', name: 'Relatório de Perdas', description: 'Motivos de perda, padrões de objeção e desperdício comercial', category: 'Comercial' },
    { id: '6', name: 'Relatório de Tarefas', description: 'Produtividade, atrasos e correlação entre tarefas e conversão', category: 'Operacional' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground flex-1">
          {hasData
            ? `Exporte relatórios com base nos ${leads.length} leads sincronizados.`
            : 'Sincronize com o Kommo para habilitar exportações com dados reais.'}
        </p>
        {hasData && (
          <Button variant="outline" size="sm" className="gap-1" onClick={() => exportLeadsCSV(leads)}>
            <Download className="h-3.5 w-3.5" />
            Exportar Todos
          </Button>
        )}
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
              <Button
                variant="default"
                size="sm"
                className="text-xs gap-1 w-fit"
                disabled={!hasData}
                onClick={() => handleExport(r.id)}
              >
                <Download className="h-3 w-3" /> Exportar CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
