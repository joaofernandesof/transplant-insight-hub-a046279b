/**
 * Vision Reports - Relatórios do Portal Vision
 */
import { ReportsPageTemplate, ReportDefinition } from '@/components/reports/ReportsPageTemplate';
import { ScanFace, History, BarChart3, TrendingUp } from 'lucide-react';

const reports: ReportDefinition[] = [
  { id: 'analises', title: 'Histórico de Análises', description: 'Todas as análises capilares realizadas', icon: ScanFace, category: 'Análises' },
  { id: 'evolucao', title: 'Evolução Capilar', description: 'Progresso e comparação entre análises', icon: TrendingUp, category: 'Análises' },
  { id: 'estatisticas', title: 'Estatísticas de Uso', description: 'Quantidade de análises e créditos utilizados', icon: BarChart3, category: 'Uso' },
  { id: 'historico', title: 'Relatório Detalhado', description: 'Relatório completo com todas as métricas', icon: History, category: 'Uso' },
];

export default function VisionReports() {
  return (
    <ReportsPageTemplate
      title="Relatórios"
      subtitle="Dados das suas análises capilares"
      reports={reports}
      headerGradient="from-fuchsia-600 to-purple-600"
      headerIcon={ScanFace}
    />
  );
}
