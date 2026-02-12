/**
 * IPROMED Reports - Relatórios do Portal IPROMED
 */
import { ReportsPageTemplate, ReportDefinition } from '@/components/reports/ReportsPageTemplate';
import { Users, FileText, DollarSign, Scale, Target, GraduationCap, BarChart3, TrendingUp } from 'lucide-react';

const reports: ReportDefinition[] = [
  { id: 'clientes', title: 'Relatório de Clientes', description: 'Listagem completa com status e plano', icon: Users, category: 'Comercial' },
  { id: 'contratos', title: 'Contratos Ativos', description: 'Contratos vigentes com valor e vencimento', icon: FileText, category: 'Comercial' },
  { id: 'propostas', title: 'Propostas Emitidas', description: 'Propostas enviadas e taxa de aceite', icon: Target, category: 'Comercial' },
  { id: 'funil', title: 'Funil de Vendas', description: 'Leads e conversões no funil comercial', icon: TrendingUp, category: 'Comercial' },
  { id: 'dre', title: 'DRE - Demonstrativo', description: 'Receitas, custos e resultado do período', icon: DollarSign, category: 'Financeiro' },
  { id: 'faturamento', title: 'Faturamento por Cliente', description: 'Receita gerada por cada cliente', icon: BarChart3, category: 'Financeiro' },
  { id: 'inadimplencia', title: 'Contas em Atraso', description: 'Transações pendentes com vencimento ultrapassado', icon: DollarSign, category: 'Financeiro' },
  { id: 'processos', title: 'Processos Jurídicos', description: 'Processos ativos com status e prazos', icon: Scale, category: 'Jurídico' },
  { id: 'alunos', title: 'Alunos Matriculados', description: 'Alunos na universidade com progresso', icon: GraduationCap, category: 'Educacional' },
];

export default function IpromedReports() {
  return (
    <ReportsPageTemplate
      title="Relatórios"
      subtitle="Dados do escritório e operação jurídica"
      reports={reports}
      headerGradient="from-slate-700 to-slate-600"
      headerIcon={Scale}
    />
  );
}
