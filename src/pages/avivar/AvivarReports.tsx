/**
 * Avivar Reports - Relatórios do Portal CRM Avivar
 */
import { ReportsPageTemplate, ReportDefinition } from '@/components/reports/ReportsPageTemplate';
import { Users, MessageSquare, RefreshCw, ListTodo, CalendarDays, Kanban, TrendingUp, BarChart3 } from 'lucide-react';

const reports: ReportDefinition[] = [
  { id: 'leads-funil', title: 'Leads por Funil', description: 'Quantidade de leads por funil e coluna', icon: Kanban, category: 'Comercial' },
  { id: 'conversoes', title: 'Taxa de Conversão', description: 'Conversões entre etapas do funil', icon: TrendingUp, category: 'Comercial' },
  { id: 'leads-origem', title: 'Leads por Origem', description: 'De onde vêm seus leads (fonte/campanha)', icon: Users, category: 'Comercial' },
  { id: 'chats', title: 'Relatório de Chats', description: 'Mensagens enviadas, recebidas e tempo de resposta', icon: MessageSquare, category: 'Atendimento' },
  { id: 'followup', title: 'Follow-ups', description: 'Follow-ups agendados, enviados e respondidos', icon: RefreshCw, category: 'Atendimento' },
  { id: 'agendamentos', title: 'Agendamentos', description: 'Consultas agendadas, confirmadas e realizadas', icon: CalendarDays, category: 'Atendimento' },
  { id: 'tarefas', title: 'Relatório de Tarefas', description: 'Tarefas com prazo, status e responsável', icon: ListTodo, category: 'Operacional' },
  { id: 'desempenho-equipe', title: 'Desempenho da Equipe', description: 'Produtividade e métricas por membro', icon: BarChart3, category: 'Operacional' },
];

export default function AvivarReports() {
  return (
    <ReportsPageTemplate
      title="Relatórios"
      subtitle="Métricas e dados do seu CRM"
      reports={reports}
      headerGradient="from-purple-700 to-violet-600"
      headerIcon={BarChart3}
    />
  );
}
