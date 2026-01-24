import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Users
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoFormacao360 from "@/assets/logo-formacao-360-white.png";
import logoBrowsTransplant from "@/assets/logo-brows-transplant-360.png";

export interface PresentialCourse {
  id: string;
  classId?: string; // ID da turma para navegação
  name: string;
  description: string;
  duration: string;
  type: 'formacao360' | 'instrumentador' | 'fellowship' | 'licenca' | 'monitor' | 'brows';
  startDate: string | null;
  endDate: string | null;
  city: string | null;
  state: string | null;
  status: 'confirmed' | 'pending' | 'completed' | 'in_progress';
  spotsAvailable?: number;
  totalSpots?: number;
  imageUrl?: string;
}

interface PresentialCourseCardProps {
  course: PresentialCourse;
  onViewDetails?: (course: PresentialCourse) => void;
}

const courseTypeConfig: Record<string, { color: string; icon: React.ReactNode; logo?: string }> = {
  formacao360: {
    color: 'from-emerald-600 to-green-700',
    icon: <GraduationCap className="h-7 w-7" />,
    logo: logoFormacao360
  },
  brows: {
    color: 'bg-black',
    icon: <GraduationCap className="h-7 w-7" />,
    logo: logoBrowsTransplant
  },
  instrumentador: {
    color: 'from-blue-500 to-indigo-600',
    icon: <Users className="h-7 w-7" />
  },
  fellowship: {
    color: 'from-purple-500 to-violet-600',
    icon: <GraduationCap className="h-7 w-7" />
  },
  licenca: {
    color: 'from-amber-500 to-orange-600',
    icon: <GraduationCap className="h-7 w-7" />
  },
  monitor: {
    color: 'from-pink-500 to-rose-600',
    icon: <Users className="h-7 w-7" />
  }
};

function getStatusBadge(status: PresentialCourse['status']) {
  switch (status) {
    case 'confirmed':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-700">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Confirmado
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-700">
          <AlertCircle className="h-3 w-3 mr-1" />
          Em Definição
        </Badge>
      );
    case 'completed':
      return (
        <Badge className="bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Concluído
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-700">
          <Clock className="h-3 w-3 mr-1" />
          Em Andamento
        </Badge>
      );
    default:
      return null;
  }
}

function formatDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate) return 'Data a definir';
  
  const start = parseISO(startDate);
  const formattedStart = format(start, "dd MMM", { locale: ptBR });
  
  if (!endDate || startDate === endDate) {
    return `${formattedStart} ${format(start, 'yyyy')}`;
  }
  
  const end = parseISO(endDate);
  const formattedEnd = format(end, "dd MMM yyyy", { locale: ptBR });
  
  return `${formattedStart} - ${formattedEnd}`;
}

export function PresentialCourseCard({ course, onViewDetails }: PresentialCourseCardProps) {
  const config = courseTypeConfig[course.type] || courseTypeConfig.formacao360;
  const isCompleted = course.status === 'completed';
  
  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${
      isCompleted ? 'opacity-75' : ''
    }`}>
      {/* Course Header with gradient or solid color */}
      <div className={`h-32 p-4 flex items-center justify-center relative ${config.color.startsWith('bg-') ? config.color : `bg-gradient-to-br ${config.color}`}`}>
        {config.logo ? (
          <img 
            src={config.logo} 
            alt={course.name} 
            className="h-20 object-contain max-w-[85%]"
          />
        ) : (
          <div className="text-white/80">
            {config.icon}
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        {/* Title and Status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="font-semibold text-base leading-tight">{course.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="mb-3">
          {getStatusBadge(course.status)}
        </div>
        
        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDateRange(course.startDate, course.endDate)}</span>
          </div>
          
          {course.city && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{course.city}, {course.state}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{course.duration}</span>
          </div>
        </div>
        
        {/* Action Button */}
        <Button 
          onClick={() => onViewDetails?.(course)}
          variant={isCompleted ? "outline" : "default"}
          className={`w-full ${!isCompleted ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
        >
          Ver detalhes da turma
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
