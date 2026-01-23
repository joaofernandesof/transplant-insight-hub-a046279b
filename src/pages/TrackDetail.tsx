import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ModuleLayout } from "@/components/ModuleLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Clock,
  BookOpen,
  Video,
  ChevronDown,
  ChevronRight,
  Lock
} from "lucide-react";

// Track definitions with modules and lessons
const trackData: Record<string, {
  id: string;
  name: string;
  description: string;
  color: string;
  modules: Array<{
    id: string;
    title: string;
    lessons: Array<{
      id: string;
      title: string;
      duration: string;
      videoUrl?: string;
      completed: boolean;
    }>;
  }>;
}> = {
  comercial: {
    id: 'comercial',
    name: 'Trilha Comercial',
    description: 'Domine as vendas consultivas e aumente sua captação de pacientes',
    color: 'from-blue-500 to-indigo-600',
    modules: [
      {
        id: 'mod1',
        title: 'Fundamentos de Vendas',
        lessons: [
          { id: 'l1', title: 'Psicologia do Consumidor', duration: '30min', completed: false },
          { id: 'l2', title: 'Jornada do Paciente', duration: '35min', completed: false },
          { id: 'l3', title: 'Qualificação de Leads', duration: '25min', completed: false },
        ]
      },
      {
        id: 'mod2',
        title: 'Scripts de Atendimento',
        lessons: [
          { id: 'l4', title: 'Script de Primeira Consulta', duration: '40min', completed: false },
          { id: 'l5', title: 'Script de Follow-up', duration: '30min', completed: false },
          { id: 'l6', title: 'Prática de Roleplay', duration: '35min', completed: false },
        ]
      },
      {
        id: 'mod3',
        title: 'Técnicas de Fechamento',
        lessons: [
          { id: 'l7', title: 'Superando Objeções', duration: '40min', completed: false },
          { id: 'l8', title: 'Negociação de Valores', duration: '35min', completed: false },
          { id: 'l9', title: 'Fechamento Consultivo', duration: '30min', completed: false },
        ]
      },
    ]
  },
  medica: {
    id: 'medica',
    name: 'Trilha Médica',
    description: 'Aprofunde-se nas técnicas e protocolos clínicos',
    color: 'from-emerald-500 to-green-600',
    modules: [
      {
        id: 'mod1',
        title: 'Anatomia Capilar',
        lessons: [
          { id: 'l1', title: 'Estrutura do Folículo', duration: '45min', completed: false },
          { id: 'l2', title: 'Ciclo de Crescimento', duration: '40min', completed: false },
          { id: 'l3', title: 'Tipos de Alopecia', duration: '50min', completed: false },
        ]
      },
      {
        id: 'mod2',
        title: 'Técnicas FUE',
        lessons: [
          { id: 'l4', title: 'Fundamentos da Técnica FUE', duration: '60min', completed: false },
          { id: 'l5', title: 'Extração Manual vs Motorizada', duration: '45min', completed: false },
          { id: 'l6', title: 'Implantação com DHI', duration: '55min', completed: false },
        ]
      },
      {
        id: 'mod3',
        title: 'Protocolos Clínicos',
        lessons: [
          { id: 'l7', title: 'Avaliação Pré-operatória', duration: '35min', completed: false },
          { id: 'l8', title: 'Anestesia Local', duration: '40min', completed: false },
          { id: 'l9', title: 'Cuidados Pós-operatórios', duration: '30min', completed: false },
        ]
      },
    ]
  },
  marketing: {
    id: 'marketing',
    name: 'Trilha de Marketing',
    description: 'Construa sua presença digital e atraia pacientes qualificados',
    color: 'from-purple-500 to-violet-600',
    modules: [
      {
        id: 'mod1',
        title: 'Marketing Digital Básico',
        lessons: [
          { id: 'l1', title: 'Fundamentos do Marketing Digital', duration: '35min', completed: false },
          { id: 'l2', title: 'Criação de Conteúdo', duration: '40min', completed: false },
          { id: 'l3', title: 'Redes Sociais para Médicos', duration: '45min', completed: false },
        ]
      },
      {
        id: 'mod2',
        title: 'Tráfego Pago',
        lessons: [
          { id: 'l4', title: 'Google Ads para Clínicas', duration: '50min', completed: false },
          { id: 'l5', title: 'Meta Ads (Facebook/Instagram)', duration: '55min', completed: false },
          { id: 'l6', title: 'Remarketing Estratégico', duration: '40min', completed: false },
        ]
      },
      {
        id: 'mod3',
        title: 'Autoridade e Branding',
        lessons: [
          { id: 'l7', title: 'Construindo sua Marca Pessoal', duration: '45min', completed: false },
          { id: 'l8', title: 'Cases e Depoimentos', duration: '35min', completed: false },
          { id: 'l9', title: 'Ética no Marketing Médico', duration: '30min', completed: false },
        ]
      },
    ]
  },
  gestao: {
    id: 'gestao',
    name: 'Trilha de Gestão',
    description: 'Aprenda a gerenciar sua clínica com eficiência',
    color: 'from-amber-500 to-orange-600',
    modules: [
      {
        id: 'mod1',
        title: 'Gestão Financeira',
        lessons: [
          { id: 'l1', title: 'Fluxo de Caixa', duration: '40min', completed: false },
          { id: 'l2', title: 'Precificação de Procedimentos', duration: '35min', completed: false },
          { id: 'l3', title: 'Indicadores Financeiros', duration: '45min', completed: false },
        ]
      },
      {
        id: 'mod2',
        title: 'Gestão de Equipe',
        lessons: [
          { id: 'l4', title: 'Contratação e Treinamento', duration: '50min', completed: false },
          { id: 'l5', title: 'Liderança na Clínica', duration: '40min', completed: false },
          { id: 'l6', title: 'Cultura Organizacional', duration: '35min', completed: false },
        ]
      },
      {
        id: 'mod3',
        title: 'Processos e Sistemas',
        lessons: [
          { id: 'l7', title: 'Automatização de Processos', duration: '45min', completed: false },
          { id: 'l8', title: 'Sistemas de Gestão', duration: '40min', completed: false },
          { id: 'l9', title: 'Métricas e KPIs', duration: '35min', completed: false },
        ]
      },
    ]
  },
};

interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string;
  completed: boolean;
}

export default function TrackDetail() {
  const navigate = useNavigate();
  const { trackId } = useParams<{ trackId: string }>();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const track = trackId ? trackData[trackId] : null;

  // Initialize all modules as expanded
  useEffect(() => {
    if (track) {
      const initialExpanded: Record<string, boolean> = {};
      track.modules.forEach(mod => {
        initialExpanded[mod.id] = true;
      });
      setExpandedModules(initialExpanded);
    }
  }, [track]);

  if (!track) {
    return (
      <ModuleLayout>
        <div className="p-6 text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Trilha não encontrada</h2>
          <p className="text-muted-foreground mb-4">A trilha solicitada não existe.</p>
          <Button onClick={() => navigate('/university')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos cursos
          </Button>
        </div>
      </ModuleLayout>
    );
  }

  // Calculate stats
  const totalLessons = track.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
  const completedLessons = track.modules.reduce(
    (acc, mod) => acc + mod.lessons.filter(l => l.completed).length, 
    0
  );
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
  };

  return (
    <ModuleLayout>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Left Panel - Modules and Lessons */}
        <div className="w-full lg:w-96 border-r bg-card overflow-y-auto">
          <Card className="border-0 rounded-none shadow-none">
            <CardContent className="p-4">
              {/* Back Button */}
              <Button 
                variant="ghost" 
                className="gap-2 mb-4 -ml-2"
                onClick={() => navigate('/university')}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar aos cursos
              </Button>

              {/* Track Header */}
              <h2 className="text-xl font-bold mb-2">{track.name}</h2>
              
              {/* Progress */}
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">{completedLessons}/{totalLessons} aulas</span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2 mb-6" />

              {/* Modules */}
              <div className="space-y-3">
                {track.modules.map((module, moduleIndex) => (
                  <Collapsible
                    key={module.id}
                    open={expandedModules[module.id]}
                    onOpenChange={() => toggleModule(module.id)}
                  >
                    <Card className="overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <button className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left">
                          <div>
                            <span className="text-xs text-muted-foreground">Módulo {moduleIndex + 1}</span>
                            <h3 className="font-medium text-sm">{module.title}</h3>
                          </div>
                          {expandedModules[module.id] ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t">
                          {module.lessons.map((lesson) => (
                            <button
                              key={lesson.id}
                              onClick={() => handleSelectLesson(lesson)}
                              className={`w-full p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0 ${
                                selectedLesson?.id === lesson.id ? 'bg-muted' : ''
                              }`}
                            >
                              <div className={`mt-0.5 flex-shrink-0 ${
                                lesson.completed ? 'text-green-500' : 'text-muted-foreground'
                              }`}>
                                {lesson.completed ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <div className="h-4 w-4 rounded-full border-2" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{lesson.title}</p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Video className="h-3 w-3" />
                                  {lesson.duration}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Video Player */}
        <div className="flex-1 flex items-center justify-center bg-muted/30 p-6">
          {selectedLesson ? (
            <div className="w-full max-w-4xl">
              {/* Video Placeholder */}
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center mb-4">
                <div className="text-center text-white">
                  <Play className="h-16 w-16 mx-auto mb-4 opacity-80" />
                  <p className="text-lg font-medium">{selectedLesson.title}</p>
                  <p className="text-sm opacity-70">{selectedLesson.duration}</p>
                </div>
              </div>
              
              {/* Lesson Info */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedLesson.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duração: {selectedLesson.duration}
                  </p>
                </div>
                <Button className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Marcar como concluída
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">Selecione uma aula</h3>
              <p className="text-sm">Escolha uma aula na lista ao lado para começar</p>
            </div>
          )}
        </div>
      </div>
    </ModuleLayout>
  );
}
