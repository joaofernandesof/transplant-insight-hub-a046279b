/**
 * CPG Advocacia Médica University - Módulo de Aulas Gravadas
 * Plataforma de educação continuada em Direito Médico
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Play, 
  Clock, 
  BookOpen, 
  GraduationCap,
  CheckCircle2,
  Lock,
  ChevronRight,
  Search,
  Filter,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { IpromedUniversityCourse } from "./components/IpromedUniversityCourse";

// Mock data para os cursos
const mockCourses = [
  {
    id: "1",
    title: "Fundamentos do Direito Médico",
    description: "Introdução completa aos conceitos fundamentais do Direito Médico brasileiro",
    instructor: "Dra. Larissa Guerreiro",
    duration: "8h 30min",
    lessons: 12,
    completedLessons: 8,
    thumbnail: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400",
    category: "Fundamentos",
    level: "Iniciante",
    rating: 4.9,
    students: 234,
    isNew: false,
    isLocked: false,
    modules: [
      {
        id: "m1",
        title: "Introdução ao Direito Médico",
        lessons: [
          { id: "l1", title: "O que é Direito Médico?", duration: "15:30", completed: true },
          { id: "l2", title: "Histórico e evolução", duration: "22:15", completed: true },
          { id: "l3", title: "Princípios fundamentais", duration: "18:45", completed: true },
        ]
      },
      {
        id: "m2",
        title: "Responsabilidade Civil",
        lessons: [
          { id: "l4", title: "Conceitos básicos", duration: "25:00", completed: true },
          { id: "l5", title: "Responsabilidade objetiva vs subjetiva", duration: "30:20", completed: true },
          { id: "l6", title: "Jurisprudência aplicada", duration: "28:10", completed: false },
        ]
      },
      {
        id: "m3",
        title: "Documentação Médica",
        lessons: [
          { id: "l7", title: "Prontuário médico", duration: "20:00", completed: false },
          { id: "l8", title: "TCLE - Termo de Consentimento", duration: "35:00", completed: false },
          { id: "l9", title: "Laudos e pareceres", duration: "25:30", completed: false },
        ]
      }
    ]
  },
  {
    id: "2",
    title: "Gestão de Riscos Jurídicos",
    description: "Estratégias preventivas para minimizar riscos legais na prática médica",
    instructor: "Dra. Caroline Parahyba",
    duration: "6h 45min",
    lessons: 10,
    completedLessons: 0,
    thumbnail: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400",
    category: "Gestão",
    level: "Intermediário",
    rating: 4.8,
    students: 189,
    isNew: true,
    isLocked: false,
    modules: [
      {
        id: "m1",
        title: "Identificação de Riscos",
        lessons: [
          { id: "l1", title: "Mapeamento de vulnerabilidades", duration: "20:00", completed: false },
          { id: "l2", title: "Análise de casos reais", duration: "25:00", completed: false },
        ]
      }
    ]
  },
  {
    id: "3",
    title: "Processos Ético-Disciplinares",
    description: "Como atuar em processos no CRM e demais órgãos reguladores",
    instructor: "Dra. Isabele Cartaxo",
    duration: "5h 20min",
    lessons: 8,
    completedLessons: 0,
    thumbnail: "https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=400",
    category: "Ético",
    level: "Avançado",
    rating: 4.7,
    students: 156,
    isNew: false,
    isLocked: true,
    modules: []
  },
  {
    id: "4",
    title: "Defesa em Ações Judiciais",
    description: "Estratégias de defesa em ações cíveis e criminais contra médicos",
    instructor: "Dra. Larissa Guerreiro",
    duration: "10h 15min",
    lessons: 15,
    completedLessons: 0,
    thumbnail: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400",
    category: "Contencioso",
    level: "Avançado",
    rating: 4.9,
    students: 98,
    isNew: true,
    isLocked: true,
    modules: []
  }
];

const categories = ["Todos", "Fundamentos", "Gestão", "Ético", "Contencioso"];

export default function IpromedUniversity() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedCourse, setSelectedCourse] = useState<typeof mockCourses[0] | null>(null);

  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalProgress = Math.round(
    (mockCourses.reduce((acc, c) => acc + c.completedLessons, 0) / 
     mockCourses.reduce((acc, c) => acc + c.lessons, 0)) * 100
  );

  if (selectedCourse) {
    return (
      <IpromedUniversityCourse 
        course={selectedCourse} 
        onBack={() => setSelectedCourse(null)} 
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            Universidade IPROMED
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Educação continuada em Direito Médico
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cursos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Stats Cards - Grid responsivo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary/20 rounded-lg">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">{mockCourses.length}</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Cursos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-emerald-500/20 rounded-lg">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">{totalProgress}%</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Progresso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">30h</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Conteúdo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-violet-500/20 rounded-lg">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">0</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Certificados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Filter - Scroll horizontal */}
      <div className="overflow-x-auto -mx-3 px-3 pb-2 sm:overflow-visible sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap text-xs sm:text-sm"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card 
            key={course.id} 
            className={cn(
              "group cursor-pointer transition-all hover:shadow-lg hover:border-primary/30",
              course.isLocked && "opacity-75"
            )}
            onClick={() => !course.isLocked && setSelectedCourse(course)}
          >
            <div className="relative">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-40 object-cover rounded-t-lg"
              />
              {course.isNew && (
                <Badge className="absolute top-3 left-3 bg-emerald-500">
                  Novo
                </Badge>
              )}
              {course.isLocked && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              )}
              <div className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded text-white text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {course.duration}
              </div>
            </div>

            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="outline" className="text-xs">
                  {course.category}
                </Badge>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="text-xs font-medium">{course.rating}</span>
                </div>
              </div>

              <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                {course.title}
              </h3>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {course.description}
              </p>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                <span>{course.instructor}</span>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    {course.completedLessons}/{course.lessons} aulas
                  </span>
                  <span className="font-medium">
                    {Math.round((course.completedLessons / course.lessons) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(course.completedLessons / course.lessons) * 100} 
                  className="h-2"
                />
              </div>

              {!course.isLocked && (
                <Button className="w-full gap-2" variant="outline">
                  {course.completedLessons > 0 ? (
                    <>
                      <Play className="h-4 w-4" />
                      Continuar
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Começar
                    </>
                  )}
                </Button>
              )}

              {course.isLocked && (
                <Button className="w-full gap-2" variant="secondary" disabled>
                  <Lock className="h-4 w-4" />
                  Bloqueado
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Nenhum curso encontrado</h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou termo de busca
          </p>
        </div>
      )}
    </div>
  );
}
