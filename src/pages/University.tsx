import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "@/components/ModuleLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  BookOpen,
  Trophy,
  Calendar,
  TrendingUp,
  FileText,
  ChevronRight,
  Stethoscope,
  Megaphone,
  Briefcase,
  MapPin,
  Clock,
  Users
} from "lucide-react";
import { useUniversity } from "@/hooks/useUniversity";

// Trilhas Online disponíveis
const onlineTracks = [
  { id: 'comercial', name: 'Trilha Comercial', description: 'Vendas consultivas e captação', icon: TrendingUp, color: 'from-blue-500 to-indigo-600', lessons: 9, progress: 75 },
  { id: 'medica', name: 'Trilha Médica', description: 'Técnicas e protocolos clínicos', icon: Stethoscope, color: 'from-emerald-500 to-green-600', lessons: 9, progress: 40 },
  { id: 'marketing', name: 'Trilha de Marketing', description: 'Presença digital e captação', icon: Megaphone, color: 'from-purple-500 to-violet-600', lessons: 9, progress: 20, isNew: true },
  { id: 'gestao', name: 'Trilha de Gestão', description: 'Gestão eficiente da clínica', icon: Briefcase, color: 'from-amber-500 to-orange-600', lessons: 9, progress: 0 },
];

// Cursos Presenciais - NÃO são online!
const presentialCourses = [
  { 
    id: 'formacao-360', 
    name: 'Formação 360°', 
    description: 'Curso intensivo de 3 dias que apresenta todo o processo do transplante capilar, do diagnóstico ao pós-operatório.', 
    difficulty: 'Iniciante',
    duration: '3 dias',
    icon: GraduationCap, 
    color: 'from-purple-500 to-indigo-600',
    isFeatured: true
  },
  { 
    id: 'instrumentador', 
    name: 'Instrumentador de Elite', 
    description: 'Capacitação prática em instrumentação para transplante capilar. Treine sua equipe e ganhe autonomia.', 
    difficulty: 'Intermediário',
    duration: '3 dias',
    icon: Users, 
    color: 'from-emerald-500 to-teal-600',
    isFeatured: false
  },
  { 
    id: 'fellowship', 
    name: 'Fellowship Avançado', 
    description: 'Imersão prática completa na rotina da clínica. Acompanhe procedimentos reais e evolua para o nível avançado.', 
    difficulty: 'Avançado',
    duration: '30 dias',
    icon: Trophy, 
    color: 'from-amber-500 to-orange-600',
    isFeatured: true
  },
];

export default function University() {
  const navigate = useNavigate();
  const { isLoading } = useUniversity();

  // Calculate online tracks progress
  const totalProgress = onlineTracks.length > 0
    ? Math.round(onlineTracks.reduce((acc, t) => acc + t.progress, 0) / onlineTracks.length)
    : 0;

  const completedTracks = onlineTracks.filter(t => t.progress === 100).length;
  const inProgressTracks = onlineTracks.filter(t => t.progress > 0 && t.progress < 100).length;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Iniciante': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Intermediário': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Avançado': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <ModuleLayout>
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-4 pl-12 lg:pl-0">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                Universidade ByNeofolic
              </h1>
              <p className="text-sm text-muted-foreground">Cursos presenciais e trilhas online</p>
            </div>
            <Button onClick={() => navigate('/university/exams')} variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Provas</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 overflow-x-hidden w-full space-y-8">
        {/* ==================== SEÇÃO 1: CURSOS PRESENCIAIS ==================== */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Cursos Presenciais</h2>
            <Badge variant="outline" className="ml-2">IBRAMEC</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Formações práticas ministradas em nossa sede. Inscreva-se e participe das próximas turmas.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {presentialCourses.map((course) => (
              <Card 
                key={course.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 group overflow-hidden relative"
                onClick={() => navigate('/academy/schedule')}
              >
                {/* Gradient Header */}
                <div className={`h-24 bg-gradient-to-br ${course.color} flex items-center justify-center relative`}>
                  {course.isFeatured && (
                    <Badge className="absolute top-3 left-3 bg-white/20 text-white border-0">
                      Destaque
                    </Badge>
                  )}
                  <course.icon className="h-10 w-10 text-white/90" />
                </div>
                
                <CardContent className="pt-4">
                  <Badge className={`${getDifficultyColor(course.difficulty)} mb-2`}>
                    {course.difficulty}
                  </Badge>
                  <h3 className="font-semibold mb-1">{course.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {course.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {course.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      Presencial
                    </span>
                  </div>
                </CardContent>
                
                <CardContent className="pt-0">
                  <Button variant="outline" className="w-full">
                    Ver Agenda de Turmas
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ==================== SEÇÃO 2: TRILHAS ONLINE ==================== */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold">Trilhas Online</h2>
            <Badge variant="secondary" className="ml-2">EAD</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Aulas gravadas para assistir no seu ritmo. Complemente sua formação com conteúdo teórico.
          </p>

          {/* Progress Overview - apenas para trilhas online */}
          <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{onlineTracks.length}</div>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">Trilhas Disponíveis</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{completedTracks}</div>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">Concluídas</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{inProgressTracks}</div>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">Em Andamento</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{totalProgress}%</div>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">Progresso Geral</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trilhas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {onlineTracks.map((track) => (
              <Card 
                key={track.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
                onClick={() => navigate(`/university/trilha/${track.id}`)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${track.color} flex items-center justify-center flex-shrink-0`}>
                      <track.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{track.name}</h3>
                        {track.isNew && (
                          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px] px-1.5 py-0">Novo</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{track.description}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{track.lessons} aulas</span>
                          <span className="font-medium">{track.progress}%</span>
                        </div>
                        <Progress value={track.progress} className="h-1.5" />
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ==================== SEÇÃO 3: PRÓXIMOS EVENTOS ==================== */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600" />
                Próximas Turmas Presenciais
              </CardTitle>
              <CardDescription>
                Confira as datas das próximas formações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/academy/schedule')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Ver Calendário Completo
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </ModuleLayout>
  );
}
