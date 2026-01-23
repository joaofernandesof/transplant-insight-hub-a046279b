import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle2,
  Clock,
  BookOpen,
  TrendingUp,
  Megaphone,
  Stethoscope,
  Briefcase,
  Lock,
  ExternalLink
} from "lucide-react";

interface Track {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  isLocked: boolean;
  isNew?: boolean;
}

interface ConectaCapilarCardProps {
  onSelectTrack?: (trackId: string) => void;
}

const tracks: Track[] = [
  {
    id: 'comercial',
    name: 'Trilha Comercial',
    description: 'Domine as vendas consultivas e aumente sua captação de pacientes',
    icon: <TrendingUp className="h-5 w-5" />,
    color: 'from-blue-500 to-indigo-600',
    progress: 75,
    totalLessons: 12,
    completedLessons: 9,
    isLocked: false
  },
  {
    id: 'medica',
    name: 'Trilha Médica',
    description: 'Aprofunde-se nas técnicas e protocolos clínicos',
    icon: <Stethoscope className="h-5 w-5" />,
    color: 'from-emerald-500 to-green-600',
    progress: 40,
    totalLessons: 20,
    completedLessons: 8,
    isLocked: false
  },
  {
    id: 'marketing',
    name: 'Trilha de Marketing',
    description: 'Construa sua presença digital e atraia pacientes qualificados',
    icon: <Megaphone className="h-5 w-5" />,
    color: 'from-purple-500 to-violet-600',
    progress: 20,
    totalLessons: 15,
    completedLessons: 3,
    isLocked: false,
    isNew: true
  },
  {
    id: 'gestao',
    name: 'Trilha de Gestão',
    description: 'Aprenda a gerenciar sua clínica com eficiência',
    icon: <Briefcase className="h-5 w-5" />,
    color: 'from-amber-500 to-orange-600',
    progress: 0,
    totalLessons: 10,
    completedLessons: 0,
    isLocked: false
  }
];

function TrackItem({ track, onSelect }: { track: Track; onSelect?: () => void }) {
  const handleClick = () => {
    if (track.isLocked) return;
    // Open Conecta Capilar platform in new tab
    window.open('https://conectacapilar.com.br', '_blank');
  };

  return (
    <div 
      className={`flex items-center gap-4 p-3 rounded-lg border transition-all duration-200 ${
        track.isLocked 
          ? 'opacity-60 cursor-not-allowed bg-muted/50' 
          : 'hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer'
      }`}
      onClick={handleClick}
    >
      {/* Track Icon */}
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${track.color} flex items-center justify-center flex-shrink-0 text-white`}>
        {track.isLocked ? <Lock className="h-5 w-5" /> : track.icon}
      </div>
      
      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">{track.name}</h4>
          {track.isNew && (
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs px-1.5 py-0">
              Novo
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{track.description}</p>
        
        {/* Progress */}
        {!track.isLocked && (
          <div className="flex items-center gap-2 mt-1.5">
            <Progress value={track.progress} className="flex-1 h-1.5" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {track.completedLessons}/{track.totalLessons} aulas
            </span>
          </div>
        )}
      </div>
      
      {/* Action */}
      {!track.isLocked && (
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}

export function ConectaCapilarCard({ onSelectTrack }: ConectaCapilarCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Calculate overall progress
  const unlockedTracks = tracks.filter(t => !t.isLocked);
  const overallProgress = unlockedTracks.length > 0
    ? Math.round(unlockedTracks.reduce((acc, t) => acc + t.progress, 0) / unlockedTracks.length)
    : 0;
  
  const totalLessons = tracks.reduce((acc, t) => acc + t.totalLessons, 0);
  const completedLessons = tracks.reduce((acc, t) => acc + t.completedLessons, 0);

  // Find the next recommended track (incomplete with highest progress)
  const recommendedTrack = unlockedTracks
    .filter(t => t.progress < 100)
    .sort((a, b) => b.progress - a.progress)[0];

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Conecta Capilar</h3>
              <p className="text-sm text-blue-100">Plataforma Online de Formação Contínua</p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
            <BookOpen className="h-3 w-3 mr-1" />
            {totalLessons} aulas
          </Badge>
        </div>
        
        {/* Overall Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-blue-100">Progresso Geral</span>
            <span className="font-semibold">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2 bg-white/20 [&>div]:bg-white" />
          <p className="text-xs text-blue-100 mt-1.5">
            {completedLessons} de {totalLessons} aulas concluídas
          </p>
        </div>
      </div>
      
      {/* AI Recommendation */}
      {recommendedTrack && (
        <div className="mx-4 -mt-2 relative z-10">
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Sugestão para você
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">
                  Continue na {recommendedTrack.name} — você está em {recommendedTrack.progress}%!
                </p>
              </div>
              <Button 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs gap-1"
                onClick={() => window.open('https://conectacapilar.com.br', '_blank')}
              >
                Continuar
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tracks List */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <button className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium hover:bg-muted/50 transition-colors">
            <span>Ver todas as trilhas ({tracks.length})</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-2">
            {tracks.map((track) => (
              <TrackItem 
                key={track.id} 
                track={track} 
                onSelect={() => onSelectTrack?.(track.id)}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
