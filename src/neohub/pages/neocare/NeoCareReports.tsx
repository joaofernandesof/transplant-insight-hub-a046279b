/**
 * NeoCare Reports - Relatórios do Portal do Paciente
 */
import { ReportsPageTemplate, ReportDefinition } from '@/components/reports/ReportsPageTemplate';
import { Calendar, FileText, CreditCard, Heart, Stethoscope, ClipboardList } from 'lucide-react';

const reports: ReportDefinition[] = [
  { id: 'consultas', title: 'Histórico de Consultas', description: 'Todas as consultas realizadas com data e médico', icon: Calendar, category: 'Clínico' },
  { id: 'procedimentos', title: 'Procedimentos Realizados', description: 'Procedimentos e tratamentos com detalhes', icon: Stethoscope, category: 'Clínico' },
  { id: 'documentos', title: 'Documentos Médicos', description: 'Laudos, receitas e atestados emitidos', icon: FileText, category: 'Clínico' },
  { id: 'pagamentos', title: 'Pagamentos Realizados', description: 'Histórico de pagamentos e faturas', icon: CreditCard, category: 'Financeiro' },
  { id: 'tratamento', title: 'Evolução do Tratamento', description: 'Progresso e resultados dos tratamentos', icon: Heart, category: 'Tratamento' },
];

export default function NeoCareReports() {
  return (
    <ReportsPageTemplate
      title="Relatórios"
      subtitle="Seu histórico clínico e financeiro"
      reports={reports}
      headerGradient="from-teal-600 to-emerald-500"
      headerIcon={Heart}
    />
  );
}
