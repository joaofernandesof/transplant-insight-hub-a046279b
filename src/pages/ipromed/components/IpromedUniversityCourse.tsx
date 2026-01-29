/**
 * IPROMED University Course View - Visualização de curso com player
 */

import { useState } from "react";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  CheckCircle2, 
  Circle,
  Clock,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Download,
  MessageSquare,
  Share2,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  lessons: number;
  completedLessons: number;
  thumbnail: string;
  category: string;
  level: string;
  rating: number;
  students: number;
  modules: Module[];
}

interface IpromedUniversityCourseProps {
  course: Course;
  onBack: () => void;
}

export function IpromedUniversityCourse({ course, onBack }: IpromedUniversityCourseProps) {
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(
    course.modules[0]?.lessons[0] || null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [openModules, setOpenModules] = useState<string[]>([course.modules[0]?.id || ""]);

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const progress = Math.round((course.completedLessons / course.lessons) * 100);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold line-clamp-1">{course.title}</h1>
            <p className="text-sm text-muted-foreground">{course.instructor}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{progress}% concluído</Badge>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Video Player Area */}
        <div className="flex-1 flex flex-col">
          {/* Video */}
          <div className="relative bg-black aspect-video">
            <img 
              src={course.thumbnail} 
              alt={currentLesson?.title || course.title}
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button 
                size="lg" 
                className="rounded-full w-16 h-16"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </Button>
            </div>
            
            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center gap-4 text-white">
                <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/20">
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <div className="flex-1">
                  <Progress value={35} className="h-1 bg-white/30" />
                </div>
                <span className="text-sm">05:30 / {currentLesson?.duration || "15:30"}</span>
                <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/20">
                  <Maximize2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Lesson Info & Tabs */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">
                {currentLesson?.title || "Selecione uma aula"}
              </h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {currentLesson?.duration || "00:00"}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {course.category}
                </span>
              </div>
            </div>

            <Tabs defaultValue="about" className="p-4">
              <TabsList>
                <TabsTrigger value="about">Sobre</TabsTrigger>
                <TabsTrigger value="materials">Materiais</TabsTrigger>
                <TabsTrigger value="notes">Anotações</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-4 space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Descrição</h3>
                  <p className="text-muted-foreground">{course.description}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Instrutor</h3>
                  <p className="text-muted-foreground">{course.instructor}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Nível</h3>
                  <Badge variant="outline">{course.level}</Badge>
                </div>
              </TabsContent>

              <TabsContent value="materials" className="mt-4">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Download className="h-4 w-4" />
                    Apostila - Fundamentos.pdf
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Download className="h-4 w-4" />
                    Slides - Aula 01.pdf
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Download className="h-4 w-4" />
                    Checklist - Documentação.pdf
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <textarea 
                  className="w-full h-40 p-3 rounded-lg border bg-muted/50 resize-none"
                  placeholder="Faça suas anotações aqui..."
                />
                <Button className="mt-2">Salvar Anotações</Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar - Lesson List */}
        <div className="w-80 border-l bg-card flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Conteúdo do Curso</h3>
            <p className="text-sm text-muted-foreground">
              {course.completedLessons}/{course.lessons} aulas concluídas
            </p>
            <Progress value={progress} className="h-2 mt-2" />
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {course.modules.map((module, moduleIndex) => (
                <Collapsible 
                  key={module.id}
                  open={openModules.includes(module.id)}
                  onOpenChange={() => toggleModule(module.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      {openModules.includes(module.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">
                          Módulo {moduleIndex + 1}: {module.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {module.lessons.length} aulas
                        </p>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="ml-6 space-y-1">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <button
                          key={lesson.id}
                          onClick={() => setCurrentLesson(lesson)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                            currentLesson?.id === lesson.id 
                              ? "bg-primary/10 border border-primary/20" 
                              : "hover:bg-muted/50"
                          )}
                        >
                          {lesson.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                          ) : currentLesson?.id === lesson.id ? (
                            <Play className="h-5 w-5 text-primary shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm truncate",
                              lesson.completed && "text-muted-foreground"
                            )}>
                              {lessonIndex + 1}. {lesson.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {lesson.duration}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
