/**
 * IPROMED - Home do Módulo Jurídico
 * Instituto de Proteção Médica - Controle Jurídico de Alunos
 */

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Scale,
  Users,
  BarChart3,
  FileText,
  BookOpen,
  GraduationCap,
  Shield,
  Gavel,
  FileCheck,
  TrendingUp,
  Calendar,
  Award,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

const quickAccessModules = [
  {
    id: 'dashboard',
    title: 'Dashboard Jurídico',
    description: 'Visão geral das métricas jurídicas',
    icon: BarChart3,
    route: '/ipromed/dashboard',
    color: 'bg-blue-500',
  },
  {
    id: 'students',
    title: 'Alunos',
    description: 'Gestão de alunos e classificação',
    icon: Users,
    route: '/ipromed/students',
    color: 'bg-emerald-500',
  },
  {
    id: 'exams',
    title: 'Provas e Avaliações',
    description: 'Provas de Direito Médico',
    icon: FileCheck,
    route: '/ipromed/exams',
    color: 'bg-purple-500',
  },
  {
    id: 'mentors',
    title: 'Mentoras',
    description: 'Avaliação de Dra. Larissa e Dra. Caroline',
    icon: UserCheck,
    route: '/ipromed/mentors',
    color: 'bg-rose-500',
  },
  {
    id: 'surveys',
    title: 'Pesquisas',
    description: 'Pesquisas de satisfação jurídica',
    icon: FileText,
    route: '/ipromed/surveys',
    color: 'bg-amber-500',
  },
  {
    id: 'leads',
    title: 'Leads Jurídicos',
    description: 'Classificação HOT/WARM/COLD',
    icon: TrendingUp,
    route: '/ipromed/leads',
    color: 'bg-orange-500',
  },
];

const statsCards = [
  { label: 'Total de Alunos', value: '156', icon: Users, trend: '+12%', color: 'text-blue-600' },
  { label: 'Leads HOT', value: '34', icon: AlertTriangle, trend: '+8%', color: 'text-rose-600' },
  { label: 'Provas Aprovadas', value: '89%', icon: FileCheck, trend: '+5%', color: 'text-emerald-600' },
  { label: 'Média Satisfação', value: '8.7', icon: Award, trend: '+0.3', color: 'text-purple-600' },
];

export default function IpromedHome() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
            <Scale className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              IPROMED
            </h1>
            <p className="text-muted-foreground">
              Instituto de Proteção Médica • Controle Jurídico de Alunos
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/ipromed/dashboard')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Ver Dashboard
          </Button>
          <Button onClick={() => navigate('/ipromed/students')}>
            <Users className="h-4 w-4 mr-2" />
            Gerenciar Alunos
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.label} className="border-none shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className="p-3 bg-muted rounded-xl">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <Badge variant="secondary" className="mt-2 text-xs">
                {stat.trend} este mês
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Access Modules */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Módulos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <h3 className="font-semibold">{module.title}</h3>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* About Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Sobre o IPROMED
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            O Instituto de Proteção Médica (IPROMED) é o módulo dedicado à gestão jurídica 
            dos alunos da formação. Aqui você encontra todas as ferramentas para:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <li className="flex items-center gap-2 text-sm">
              <Gavel className="h-4 w-4 text-blue-600" />
              Avaliar conhecimento em Direito Médico
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-blue-600" />
              Classificar alunos por interesse jurídico
            </li>
            <li className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Identificar leads para serviços jurídicos
            </li>
            <li className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-blue-600" />
              Acompanhar desempenho nas avaliações
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
