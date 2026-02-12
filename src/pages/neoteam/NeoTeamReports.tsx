/**
 * NeoTeam Reports - Relatórios do Portal do Colaborador
 */
import { ReportsPageTemplate, ReportDefinition } from '@/components/reports/ReportsPageTemplate';
import { Calendar, Users, ListTodo, Clock, HeadphonesIcon, Stethoscope, ClipboardList, FileText } from 'lucide-react';

const reports: ReportDefinition[] = [
  { id: 'agenda', title: 'Agenda de Atendimentos', description: 'Todos os atendimentos agendados com status e horário', icon: Calendar, category: 'Clínico' },
  { id: 'pacientes', title: 'Pacientes Atendidos', description: 'Lista de pacientes atendidos por período', icon: Users, category: 'Clínico' },
  { id: 'prontuarios', title: 'Prontuários Emitidos', description: 'Prontuários criados e atualizados no período', icon: FileText, category: 'Clínico' },
  { id: 'procedimentos', title: 'Procedimentos Realizados', description: 'Procedimentos realizados com médico e tipo', icon: Stethoscope, category: 'Clínico' },
  { id: 'tarefas', title: 'Relatório de Tarefas', description: 'Todas as tarefas com prazo, status e prioridade', icon: ListTodo, category: 'Operacional' },
  { id: 'sala-espera', title: 'Sala de Espera', description: 'Tempo médio de espera e fluxo de pacientes', icon: Clock, category: 'Operacional' },
  { id: 'checklist', title: 'Checklist Diário', description: 'Atividades de checklist e limpeza realizadas', icon: ClipboardList, category: 'Operacional' },
  { id: 'pos-venda', title: 'Pós-Venda', description: 'Chamados, NPS e satisfação do cliente', icon: HeadphonesIcon, category: 'Pós-Venda' },
];

export default function NeoTeamReports() {
  return (
    <ReportsPageTemplate
      title="Relatórios"
      subtitle="Relatórios operacionais e clínicos da equipe"
      reports={reports}
      headerGradient="from-blue-600 to-blue-500"
      headerIcon={ClipboardList}
    />
  );
}
