import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Video,
  BookOpen,
  Lock
} from "lucide-react";
import { CourseWithProgress, ModuleLessonWithProgress } from "@/hooks/useUniversity";
import { sanitizeHtml } from '@/utils/sanitizeHtml';

interface CourseViewerProps {
  course: CourseWithProgress;
  onBack: () => void;
  onSelectLesson: (lesson: ModuleLessonWithProgress) => void;
  onMarkComplete: (lessonId: string) => void;
  selectedLesson: ModuleLessonWithProgress | null;
  isEnrolled: boolean;
  onEnroll: () => void;
}

const contentTypeIcons = {
  video: Video,
  text: FileText,
  pdf: FileText,
  quiz: BookOpen,
};

export function CourseViewer({
  course,
  onBack,
  onSelectLesson,
  onMarkComplete,
  selectedLesson,
  isEnrolled,
  onEnroll,
}: CourseViewerProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>(
    course.modules?.map(m => m.id) || []
  );

  const progress = course.enrollment?.progress_percent || 0;
  const totalLessons = course.totalLessons || 0;
  const completedLessons = course.completedLessons || 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Sidebar - Course Content */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <Card className="h-full">
          <CardContent className="p-4">
            {/* Back button and course info */}
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos cursos
            </Button>

            <h2 className="text-lg font-bold mb-2">{course.title}</h2>
            
            {isEnrolled ? (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    {completedLessons}/{totalLessons} aulas
                  </span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            ) : (
              <Button onClick={onEnroll} className="w-full mb-4">
                Inscrever-se Gratuitamente
              </Button>
            )}

            {/* Modules and Lessons */}
            <ScrollArea className="h-[calc(100vh-350px)]">
              <Accordion 
                type="multiple" 
                value={expandedModules}
                onValueChange={setExpandedModules}
                className="space-y-2"
              >
                {course.modules?.map((module, moduleIndex) => (
                  <AccordionItem 
                    key={module.id} 
                    value={module.id}
                    className="border rounded-lg px-3"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2 text-left">
                        <span className="text-xs font-medium text-muted-foreground">
                          Módulo {moduleIndex + 1}
                        </span>
                        <span className="text-sm font-medium">{module.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="space-y-1">
                        {module.lessons.map((lesson, lessonIndex) => {
                          const Icon = contentTypeIcons[lesson.content_type];
                          const isCompleted = lesson.progress?.is_completed;
                          const isSelected = selectedLesson?.id === lesson.id;
                          const canAccess = isEnrolled || lesson.is_preview;

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => canAccess && onSelectLesson(lesson)}
                              disabled={!canAccess}
                              className={`
                                w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors
                                ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}
                                ${!canAccess ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                              `}
                            >
                              <div className="flex-shrink-0">
                                {isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : canAccess ? (
                                  <Circle className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{lesson.title}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Icon className="h-3 w-3" />
                                  <span>{lesson.duration_minutes}min</span>
                                  {lesson.is_preview && !isEnrolled && (
                                    <Badge variant="outline" className="text-xs py-0">
                                      Preview
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Lesson Viewer */}
      <div className="flex-1">
        <Card className="h-full">
          <CardContent className="p-6">
            {selectedLesson ? (
              <div className="space-y-6">
                {/* Lesson Header */}
                <div>
                  <h3 className="text-xl font-bold mb-2">{selectedLesson.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {selectedLesson.duration_minutes} minutos
                    </span>
                    <Badge variant="outline">
                      {selectedLesson.content_type === 'video' ? 'Vídeo' : 
                       selectedLesson.content_type === 'text' ? 'Texto' :
                       selectedLesson.content_type === 'pdf' ? 'PDF' : 'Quiz'}
                    </Badge>
                    {selectedLesson.progress?.is_completed && (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Concluído
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content Area */}
                <div className="bg-muted rounded-lg aspect-video flex items-center justify-center">
                  {selectedLesson.content_type === 'video' && selectedLesson.content_url ? (
                    <video
                      src={selectedLesson.content_url}
                      controls
                      className="w-full h-full rounded-lg"
                    />
                  ) : selectedLesson.content_html ? (
                    <div 
                      className="prose prose-sm max-w-none p-6 bg-background rounded-lg w-full h-full overflow-auto"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedLesson.content_html) }}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Conteúdo não disponível</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedLesson.description && (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground">{selectedLesson.description}</p>
                  </div>
                )}

                {/* Actions */}
                {isEnrolled && !selectedLesson.progress?.is_completed && (
                  <Button 
                    onClick={() => onMarkComplete(selectedLesson.id)}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Marcar como Concluída
                  </Button>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                <BookOpen className="h-16 w-16 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Selecione uma aula</h3>
                <p className="text-sm">Escolha uma aula na lista ao lado para começar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
