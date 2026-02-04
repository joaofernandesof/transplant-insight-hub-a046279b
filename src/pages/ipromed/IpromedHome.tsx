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
import { WorkspaceDeadlines } from './components/WorkspaceDeadlines';
import { WorkspaceAgenda } from './components/WorkspaceAgenda';
import { WorkspaceQuickActions } from './components/WorkspaceQuickActions';

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
    route: '/ipromed/dashboard',
    color: 'bg-gradient-to-br from-[#00629B] to-[#004d7a]',
  },
  {
    id: 'clients',
    title: 'Clientes',
    description: 'Gestão de clientes e casos',
    icon: Building2,
    route: '/ipromed/clients',
    color: 'bg-cyan-500',
  },
  {
    id: 'contracts',
    title: 'Contratos',
    description: 'Gestão e assinatura digital',
    icon: FileSignature,
    route: '/ipromed/contracts',
    color: 'bg-emerald-500',
  },
  {
    id: 'journey',
    title: 'Jornada do Cliente',
    description: 'Pipeline e etapas',
    icon: TrendingUp,
    route: '/ipromed/journey',
    color: 'bg-purple-500',
  },
  {
    id: 'students',
    title: 'Alunos',
    description: 'Gestão e classificação',
    icon: GraduationCap,
    route: '/ipromed/students',
    color: 'bg-indigo-500',
  },
  {
    id: 'legal',
    title: 'Hub Jurídico',
    description: 'Pareceres e documentos',
    icon: Scale,
    route: '/ipromed/legal',
    color: 'bg-rose-500',
  },
];

export default function IpromedHome() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Portal Banner */}
      <PortalBanner
        portal="ipromed"
        icon={<Scale className="h-6 w-6 text-white" />}
        rightContent={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/ipromed/legal')}>
              <Scale className="h-4 w-4 mr-2" />
              Abrir Legal Hub
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/ipromed/clients')}>
              <Users className="h-4 w-4 mr-2" />
              Gerenciar Clientes
            </Button>
          </div>
        }
      />

      {/* Task Stats Cards - Resumo visual */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Resumo de Tarefas</h2>
        <TaskStatsCards />
      </div>

      {/* Área de Trabalho Geral */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Área de Trabalho</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal - Tarefas */}
          <div className="lg:col-span-2 space-y-6">
            <WorkspaceTaskList />
            <WorkspaceDeadlines />
          </div>

          {/* Coluna Lateral - Agenda e Ações */}
          <div className="space-y-6">
            <WorkspaceAgenda />
            <WorkspaceQuickActions />
          </div>
        </div>
      </div>

      {/* Quick Access Modules */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Módulos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickAccessModules.map((module) => (
            <Card 
              key={module.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-none"
              onClick={() => navigate(module.route)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 ${module.color} rounded-xl shadow-md`}>
                    <module.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{module.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
