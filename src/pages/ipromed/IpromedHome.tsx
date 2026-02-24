/**
 * CPG Advocacia Médica - Home do Módulo Jurídico (Aba Início)
 * Foco: Área de trabalho geral com tarefas, prazos, agenda e ações rápidas
 */

import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PortalBanner } from '@/components/shared/PortalBanner';
import { TaskStatsCards } from './components/TaskStatsCards';
import { WorkspaceTaskList } from './components/WorkspaceTaskList';
import { WorkspaceAgenda } from './components/WorkspaceAgenda';

import {
  Scale,
  Users,
  BarChart3,
  FileSignature,
  TrendingUp,
  GraduationCap,
  Building2,
} from "lucide-react";

const quickAccessModules = [
  {
    id: 'dashboard',
    title: 'Dashboard Jurídico',
    description: 'Visão geral das métricas',
    icon: BarChart3,
    route: '/cpg/dashboard',
    color: 'bg-gradient-to-br from-[#00629B] to-[#004d7a]',
  },
  {
    id: 'clients',
    title: 'Clientes',
    description: 'Gestão de clientes e casos',
    icon: Building2,
    route: '/cpg/clients',
    color: 'bg-cyan-500',
  },
  {
    id: 'contracts',
    title: 'Contratos',
    description: 'Gestão e assinatura digital',
    icon: FileSignature,
    route: '/cpg/contracts',
    color: 'bg-emerald-500',
  },
  {
    id: 'journey',
    title: 'Jornada do Cliente',
    description: 'Pipeline e etapas',
    icon: TrendingUp,
    route: '/cpg/journey',
    color: 'bg-purple-500',
  },
  {
    id: 'students',
    title: 'Alunos',
    description: 'Gestão e classificação',
    icon: GraduationCap,
    route: '/cpg/students',
    color: 'bg-indigo-500',
  },
  {
    id: 'legal',
    title: 'Hub Jurídico',
    description: 'Pareceres e documentos',
    icon: Scale,
    route: '/cpg/legal',
    color: 'bg-rose-500',
  },
];

export default function IpromedHome() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-full">
      {/* Portal Banner */}
      <PortalBanner
        portal="ipromed"
        icon={<Scale className="h-6 w-6 text-white" />}
      />

      {/* Task Stats Cards - Resumo visual com filtro de responsável */}
      <TaskStatsCards />

      {/* Área de Trabalho Geral */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">Área de Trabalho</h2>
        
        {/* Tarefas */}
        <WorkspaceTaskList />

        {/* Agenda */}
        <WorkspaceAgenda />
      </div>

    </div>
  );
}
