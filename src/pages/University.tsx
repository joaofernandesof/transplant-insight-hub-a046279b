import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Video,
  Play,
  Clock,
  CheckCircle2,
  Lock,
  GraduationCap,
  Stethoscope,
  DollarSign,
  Palette,
  Users,
  Calendar
} from "lucide-react";
import logoByNeofolic from "@/assets/logo-byneofolic.png";

const tracks = [
  {
    id: 'medical',
    title: 'Trilha Médica',
    description: 'Técnicas cirúrgicas, protocolos clínicos e anamnese',
    icon: Stethoscope,
    color: 'bg-red-100 text-red-600',
    modules: 12,
    completed: 4,
    hours: 24
  },
  {
    id: 'commercial',
    title: 'Trilha Comercial',
    description: 'Vendas, objeções, fechamento e scripts',
    icon: DollarSign,
    color: 'bg-green-100 text-green-600',
    modules: 8,
    completed: 2,
    hours: 16
  },
  {
    id: 'marketing',
    title: 'Trilha Marketing',
    description: 'Tráfego, conteúdo, branding e redes sociais',
    icon: Palette,
    color: 'bg-pink-100 text-pink-600',
    modules: 10,
    completed: 5,
    hours: 20
  },
  {
    id: 'management',
    title: 'Trilha Gestão',
    description: 'Financeiro, administrativo e operacional',
    icon: Users,
    color: 'bg-blue-100 text-blue-600',
    modules: 6,
    completed: 1,
    hours: 12
  }
];

const recentClasses = [
  { id: 1, title: 'Técnica FUE Avançada', track: 'Médica', duration: '45min', completed: true },
  { id: 2, title: 'Script de Fechamento', track: 'Comercial', duration: '30min', completed: true },
  { id: 3, title: 'Anamnese Completa', track: 'Médica', duration: '60min', completed: false },
  { id: 4, title: 'Campanha de Tráfego', track: 'Marketing', duration: '40min', completed: false },
  { id: 5, title: 'Controle de Caixa', track: 'Gestão', duration: '35min', completed: false },
];

const upcomingEvents = [
  { id: 1, title: 'Imersão Presencial', date: '15-20 Fev 2026', type: 'Presencial' },
  { id: 2, title: 'Mentoria em Grupo', date: '25 Jan 2026', type: 'Online' },
  { id: 3, title: 'Webinar: Tendências 2026', date: '30 Jan 2026', type: 'Online' },
];

export default function University() {
  const navigate = useNavigate();

  const totalModules = tracks.reduce((acc, t) => acc + t.modules, 0);
  const totalCompleted = tracks.reduce((acc, t) => acc + t.completed, 0);
  const overallProgress = Math.round((totalCompleted / totalModules) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={logoByNeofolic} alt="ByNeofolic" className="h-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                Universidade ByNeofolic
              </h1>
              <p className="text-sm text-muted-foreground">Trilhas de capacitação e aulas gravadas</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Progress Overview */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-purple-900">Seu Progresso</h2>
                <p className="text-purple-700">{totalCompleted} de {totalModules} módulos concluídos</p>
              </div>
              <div className="w-full md:w-64">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-900">{overallProgress}% completo</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trilhas */}
        <h3 className="text-lg font-semibold mb-4">Trilhas de Capacitação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {tracks.map((track) => {
            const progress = Math.round((track.completed / track.modules) * 100);
            return (
              <Card key={track.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-xl ${track.color} flex items-center justify-center mb-2`}>
                    <track.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-base">{track.title}</CardTitle>
                  <CardDescription className="text-xs">{track.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{track.completed}/{track.modules} módulos</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {track.hours}h
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-4 w-4 text-purple-600" />
                Aulas Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentClasses.map((cls) => (
                <div 
                  key={cls.id} 
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cls.completed ? 'bg-green-100' : 'bg-muted'}`}>
                    {cls.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Play className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{cls.title}</p>
                    <p className="text-xs text-muted-foreground">{cls.track} • {cls.duration}</p>
                  </div>
                  <Badge variant={cls.completed ? "default" : "outline"} className="text-xs">
                    {cls.completed ? 'Concluído' : 'Assistir'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600" />
                Próximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.date}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.type}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
