/**
 * NeoPay Reports - Relatórios do Portal NeoPay
 */
import { ReportsPageTemplate, ReportDefinition } from '@/components/reports/ReportsPageTemplate';
import { ArrowLeftRight, Receipt, RefreshCw, AlertTriangle, RotateCcw, ShieldAlert, CreditCard, BarChart3 } from 'lucide-react';

const reports: ReportDefinition[] = [
  { id: 'transacoes', title: 'Relatório de Transações', description: 'Todas as transações com status e valor', icon: ArrowLeftRight, category: 'Financeiro' },
  { id: 'cobrancas', title: 'Cobranças Emitidas', description: 'Cobranças criadas com status de pagamento', icon: Receipt, category: 'Financeiro' },
  { id: 'assinaturas', title: 'Assinaturas Ativas', description: 'Assinaturas recorrentes e valores', icon: RefreshCw, category: 'Financeiro' },
  { id: 'receita', title: 'Receita por Período', description: 'Faturamento consolidado por mês', icon: BarChart3, category: 'Financeiro' },
  { id: 'inadimplencia', title: 'Inadimplência', description: 'Cobranças vencidas e em atraso', icon: AlertTriangle, category: 'Operacional' },
  { id: 'reembolsos', title: 'Reembolsos', description: 'Reembolsos processados com motivo', icon: RotateCcw, category: 'Operacional' },
  { id: 'chargebacks', title: 'Chargebacks', description: 'Disputas e chargebacks com status', icon: ShieldAlert, category: 'Operacional' },
  { id: 'split', title: 'Split de Pagamentos', description: 'Divisões de pagamento e repasses', icon: CreditCard, category: 'Operacional' },
];

export default function NeoPayReports() {
  return (
    <ReportsPageTemplate
      title="Relatórios"
      subtitle="Dados financeiros e operacionais do gateway"
      reports={reports}
      headerGradient="from-emerald-700 to-teal-600"
      headerIcon={CreditCard}
    />
  );
}
