/**
 * Academy Reports - Relatórios do Portal do Aluno
 */
import { ReportsPageTemplate, ReportDefinition } from '@/components/reports/ReportsPageTemplate';
import { BookOpen, Award, Users, GraduationCap, BarChart3, FileCheck } from 'lucide-react';

const reports: ReportDefinition[] = [
  { id: 'progresso', title: 'Progresso nos Cursos', description: 'Aulas assistidas, módulos concluídos e aproveitamento', icon: BookOpen, category: 'Acadêmico' },
  { id: 'certificados', title: 'Certificados Emitidos', description: 'Certificados obtidos com data e curso', icon: Award, category: 'Acadêmico' },
  { id: 'provas', title: 'Resultados de Provas', description: 'Notas, tentativas e aprovações em exames', icon: FileCheck, category: 'Acadêmico' },
  { id: 'frequencia', title: 'Frequência nas Aulas', description: 'Presença nas aulas ao vivo e eventos', icon: GraduationCap, category: 'Acadêmico' },
  { id: 'comunidade', title: 'Participação na Comunidade', description: 'Posts, interações e engajamento social', icon: Users, category: 'Comunidade' },
  { id: 'desempenho', title: 'Desempenho Geral', description: 'Visão consolidada do desempenho do aluno', icon: BarChart3, category: 'Desempenho' },
];

export default function AcademyReports() {
  return (
    <ReportsPageTemplate
      title="Relatórios"
      subtitle="Acompanhe seu progresso acadêmico"
      reports={reports}
      headerGradient="from-indigo-600 to-purple-500"
      headerIcon={GraduationCap}
    />
  );
}
