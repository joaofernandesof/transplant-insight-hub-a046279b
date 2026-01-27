/**
 * IPROMED - Home do Módulo Jurídico
 * Instituto de Proteção Médica - Portal Jurídico Completo
 */

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Award,
  UserCheck,
  AlertTriangle,
  FileSignature,
  MessageSquare,
  LayoutGrid,
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
    title: 'Clientes Jurídicos',
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

const statsCards = [
  { label: 'Processos Ativos', value: '24', icon: Gavel, trend: '-2', color: 'text-blue-600' },
  { label: 'Contratos Ativos', value: '156', icon: FileText, trend: '+8%', color: 'text-emerald-600' },
  { label: 'Solicitações Pendentes', value: '18', icon: MessageSquare, trend: '-15%', color: 'text-amber-600' },
  { label: 'Aguard. Assinatura', value: '7', icon: FileSignature, trend: '+3', color: 'text-purple-600' },
];

export default function IpromedHome() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-[#00629B] to-[#004d7a] rounded-2xl shadow-lg">
            <Scale className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00629B] to-[#004d7a] bg-clip-text text-transparent">
              IPROMED
            </h1>
            <p className="text-muted-foreground">
              Instituto de Proteção Médica • Portal Jurídico
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/ipromed/legal-hub')}>
            <Scale className="h-4 w-4 mr-2" />
            Abrir Legal Hub
          </Button>
          <Button onClick={() => navigate('/ipromed/clients')}>
            <Users className="h-4 w-4 mr-2" />
            Gerenciar Clientes
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
