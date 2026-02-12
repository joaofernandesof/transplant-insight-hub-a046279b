/**
 * NeoLicense Reports - Relatórios do Portal do Licenciado
 */
import { ReportsPageTemplate, ReportDefinition } from '@/components/reports/ReportsPageTemplate';
import { BarChart3, DollarSign, Calendar, TrendingUp, Flame, Trophy, CreditCard, Users } from 'lucide-react';

const reports: ReportDefinition[] = [
  { id: 'vendas', title: 'Relatório de Vendas', description: 'Vendas realizadas com VGV, entrada e saldo', icon: TrendingUp, category: 'Comercial' },
  { id: 'cirurgias', title: 'Cirurgias Realizadas', description: 'Cirurgias agendadas e realizadas por período', icon: Calendar, category: 'Comercial' },
  { id: 'hotleads', title: 'HotLeads', description: 'Leads quentes recebidos e taxa de conversão', icon: Flame, category: 'Comercial' },
  { id: 'financeiro', title: 'Extrato Financeiro', description: 'Receitas, despesas e fluxo de caixa', icon: DollarSign, category: 'Financeiro' },
  { id: 'pagamentos-licenca', title: 'Pagamentos da Licença', description: 'Parcelas e status dos pagamentos', icon: CreditCard, category: 'Financeiro' },
  { id: 'desempenho', title: 'Desempenho Consolidado', description: 'Métricas e indicadores do período', icon: BarChart3, category: 'Desempenho' },
  { id: 'conquistas', title: 'Conquistas e Ranking', description: 'Conquistas desbloqueadas e posição no ranking', icon: Trophy, category: 'Desempenho' },
  { id: 'indicacoes', title: 'Indicações Realizadas', description: 'Indicações feitas e status de conversão', icon: Users, category: 'Desempenho' },
];

export default function NeoLicenseReports() {
  return (
    <ReportsPageTemplate
      title="Relatórios"
      subtitle="Acompanhe o desempenho da sua licença"
      reports={reports}
      headerGradient="from-amber-600 to-orange-500"
      headerIcon={BarChart3}
    />
  );
}
