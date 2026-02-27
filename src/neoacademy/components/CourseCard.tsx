import React from 'react';
import { Play, Clock, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

type CardType = 'course' | 'module' | 'lesson';

interface CourseCardProps {
  id: string;
  title: string;
  thumbnail?: string | null;
  category?: string | null;
  totalLessons?: number;
  totalDuration?: number;
  progress?: number;
  variant?: 'featured' | 'default' | 'continue';
  cardType?: CardType;
}

const TYPE_LABELS: Record<CardType, string> = {
  course: 'Curso Online',
  module: 'Módulo',
  lesson: 'Aula',
};

const TYPE_COLORS: Record<CardType, string> = {
  course: 'bg-violet-500/80',
  module: 'bg-fuchsia-500/80',
  lesson: 'bg-sky-500/80',
};

export function CourseCard({ 
  id, title, thumbnail, category, 
  totalLessons = 0, totalDuration = 0, 
  progress, variant = 'default',
  cardType = 'course',
}: CourseCardProps) {
  const navigate = useNavigate();
  const durationHours = Math.floor(totalDuration / 60);
  const durationMin = totalDuration % 60;

  return (
    <button
      onClick={() => navigate(`/neoacademy/course/${id}`)}
      className={cn(
        "group relative rounded-xl overflow-hidden text-left transition-all duration-300",
        "hover:scale-[1.03] hover:shadow-2xl hover:shadow-violet-500/10",
        "bg-[#14141f] border border-white/5 w-full",
        variant === 'continue' ? "flex flex-row h-28" : "flex flex-col"
      )}
    >
      {/* Thumbnail — fixed aspect ratio for consistency */}
      <div className={cn(
        "relative overflow-hidden bg-gradient-to-br from-violet-900/40 to-fuchsia-900/40 shrink-0",
        variant === 'continue' ? "w-44 h-full" : "aspect-[4/3] w-full"
      )}>
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-violet-400/50" />
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <div className="h-12 w-12 rounded-full bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Category badge */}
        {category && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-violet-500/80 text-[10px] font-bold uppercase text-white tracking-wider">
            {category}
          </div>
        )}

        {/* Type tag — always visible */}
        <div className={cn(
          "absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase text-white tracking-wider",
          TYPE_COLORS[cardType]
        )}>
          {TYPE_LABELS[cardType]}
        </div>
      </div>

      {/* Info — fixed height for uniform cards */}
      <div className={cn(
        "p-3 flex flex-col gap-1.5",
        variant === 'continue' ? "flex-1 justify-center" : "h-[72px] justify-between"
      )}>
        <h3 className={cn(
          "font-semibold text-white line-clamp-2 text-sm leading-tight"
        )}>
          {title}
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          {totalLessons > 0 && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> {totalLessons} aulas
            </span>
          )}
          {totalDuration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {durationHours > 0 ? `${durationHours}h ` : ''}{durationMin}min
            </span>
          )}
        </div>
        
        {/* Progress bar */}
        {progress !== undefined && progress > 0 && (
          <div className="mt-1">
            <Progress value={progress} className="h-1 bg-white/5" />
            <span className="text-[10px] text-zinc-500 mt-0.5">{Math.round(progress)}% concluído</span>
          </div>
        )}
      </div>
    </button>
  );
}
