import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, Play, CheckCircle2, Award } from "lucide-react";
import { CourseWithProgress } from "@/hooks/useUniversity";
import { CertificateDownloadButton } from "@/components/CertificateDownloadButton";
import { useAuth } from "@/contexts/AuthContext";

interface CourseCardProps {
  course: CourseWithProgress;
  onSelect: (course: CourseWithProgress) => void;
  onEnroll?: (courseId: string) => void;
}

const difficultyLabels = {
  beginner: { label: 'Iniciante', color: 'bg-green-100 text-green-700' },
  intermediate: { label: 'Intermediário', color: 'bg-yellow-100 text-yellow-700' },
  advanced: { label: 'Avançado', color: 'bg-red-100 text-red-700' },
};

export function CourseCard({ course, onSelect, onEnroll }: CourseCardProps) {
  const { user } = useAuth();
  const isEnrolled = !!course.enrollment;
  const progress = course.enrollment?.progress_percent || 0;
  const isCompleted = course.enrollment?.status === 'completed';
  const difficulty = difficultyLabels[course.difficulty];

  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
      onClick={() => onSelect(course)}
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-purple-500 to-indigo-600 overflow-hidden">
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url} 
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-white/50" />
          </div>
        )}
        {course.is_featured && (
          <Badge className="absolute top-3 left-3 bg-yellow-500 text-yellow-900">
            Destaque
          </Badge>
        )}
        {isCompleted && (
          <div className="absolute top-3 right-3 bg-green-500 rounded-full p-1">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className={difficulty.color}>
            {difficulty.label}
          </Badge>
        </div>
        <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm">
          {course.description || 'Sem descrição'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {course.duration_hours}h
          </span>
          {isEnrolled && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {progress}% completo
            </span>
          )}
        </div>

        {isEnrolled ? (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            {isCompleted ? (
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button className="flex-1 gap-2" size="sm" variant="outline">
                  <Play className="h-4 w-4" />
                  Rever
                </Button>
                <CertificateDownloadButton
                  studentName={user?.name || 'Aluno'}
                  courseName={course.title}
                  completionDate={course.enrollment?.completed_at || new Date()}
                  courseHours={course.duration_hours}
                  variant="default"
                  size="sm"
                  showIcon={true}
                  className="flex-1"
                />
              </div>
            ) : (
              <Button className="w-full gap-2" size="sm">
                <Play className="h-4 w-4" />
                {progress > 0 ? 'Continuar' : 'Iniciar'}
              </Button>
            )}
          </div>
        ) : (
          <Button 
            className="w-full" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEnroll?.(course.id);
            }}
          >
            Inscrever-se
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
