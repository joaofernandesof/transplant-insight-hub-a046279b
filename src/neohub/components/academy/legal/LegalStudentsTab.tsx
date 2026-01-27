/**
 * Legal Module - Students Tab
 * Shows students grouped by classification (HOT/WARM/COLD) with full details
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Flame,
  Thermometer,
  Snowflake,
  Users,
  GraduationCap,
  Shield,
  CheckCircle2,
  XCircle,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudentWithScores, LegalPerception } from "./types";

interface LegalStudentsTabProps {
  students: StudentWithScores[];
  legalPerception: LegalPerception | null;
}

function StudentCard({ student }: { student: StudentWithScores }) {
  const classColors = {
    hot: { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-600' },
    warm: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-600' },
    cold: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600' },
  };

  const colors = classColors[student.classification];
  const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <Card className={cn("border-l-4", colors.border, colors.bg)}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={student.avatarUrl || undefined} alt={student.name} />
            <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium truncate">{student.name}</p>
              <Badge 
                variant="outline" 
                className={cn("shrink-0 text-xs", colors.text)}
              >
                {student.classification.toUpperCase()}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-violet-500" />
                <span>Score: <strong>{student.scoreNormalized.toFixed(1)}/10</strong></span>
              </div>
              <div className="flex items-center gap-1">
                {student.examPassed ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-rose-500" />
                )}
                <span>Prova: <strong>{student.examScore !== null ? `${student.examScore}%` : 'N/A'}</strong></span>
              </div>
            </div>

            <div className="mt-2 space-y-1">
              {student.feeling && (
                <p className="text-xs text-muted-foreground truncate">
                  💭 {student.feeling}
                </p>
              )}
              {student.timing && (
                <p className="text-xs text-muted-foreground truncate">
                  ⏰ {student.timing}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LegalStudentsTab({ students, legalPerception }: LegalStudentsTabProps) {
  const hotStudents = students.filter(s => s.classification === 'hot');
  const warmStudents = students.filter(s => s.classification === 'warm');
  const coldStudents = students.filter(s => s.classification === 'cold');

  const ClassificationSection = ({ 
    title, 
    icon, 
    students, 
    color,
    description 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    students: StudentWithScores[]; 
    color: string;
    description: string;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className={cn("font-semibold", color)}>{title}</h3>
          <Badge variant="outline">{students.length}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      
      {students.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {students.map((student) => (
            <StudentCard key={student.userId} student={student} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum aluno nesta categoria
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Summary stats
  const avgScore = students.length > 0 
    ? students.reduce((a, s) => a + s.scoreNormalized, 0) / students.length 
    : 0;
  const examPassRate = students.length > 0
    ? (students.filter(s => s.examPassed).length / students.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header - print-section */}
      <div className="print-section flex items-center justify-between bg-background p-2 rounded-lg">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-violet-500" />
          <div>
            <h2 className="text-lg font-semibold">Classificação de Alunos</h2>
            <p className="text-sm text-muted-foreground">
              {students.length} alunos agrupados por potencial comercial
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPIs - print-section */}
      <div className="print-section grid grid-cols-2 md:grid-cols-5 gap-3 bg-background p-2 rounded-lg">
        <Card className="text-center bg-rose-50 dark:bg-rose-900/20">
          <CardContent className="pt-4">
            <Flame className="h-5 w-5 mx-auto text-rose-500 mb-1" />
            <p className="text-2xl font-bold text-rose-600">{hotStudents.length}</p>
            <p className="text-xs text-muted-foreground">HOT</p>
          </CardContent>
        </Card>
        <Card className="text-center bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="pt-4">
            <Thermometer className="h-5 w-5 mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold text-amber-600">{warmStudents.length}</p>
            <p className="text-xs text-muted-foreground">WARM</p>
          </CardContent>
        </Card>
        <Card className="text-center bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-4">
            <Snowflake className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold text-blue-600">{coldStudents.length}</p>
            <p className="text-xs text-muted-foreground">COLD</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <Shield className="h-5 w-5 mx-auto text-violet-500 mb-1" />
            <p className="text-2xl font-bold">{avgScore.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Score Médio</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <GraduationCap className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-2xl font-bold">{examPassRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Aprovação Prova</p>
          </CardContent>
        </Card>
      </div>

      {/* Classification Sections - each as print-section */}
      <div className="print-section bg-background p-2 rounded-lg">
        <ClassificationSection
          title="Leads HOT"
          icon={<Flame className="h-5 w-5 text-rose-500" />}
          students={hotStudents}
          color="text-rose-600"
          description="Score ≥ 40 pontos • Prioridade máxima"
        />
      </div>

      <div className="print-section bg-background p-2 rounded-lg">
        <ClassificationSection
          title="Leads WARM"
          icon={<Thermometer className="h-5 w-5 text-amber-500" />}
          students={warmStudents}
          color="text-amber-600"
          description="Score 25-39 pontos • Nutrição ativa"
        />
      </div>

      <div className="print-section bg-background p-2 rounded-lg">
        <ClassificationSection
          title="Leads COLD"
          icon={<Snowflake className="h-5 w-5 text-blue-500" />}
          students={coldStudents}
          color="text-blue-600"
          description="Score < 25 pontos • Acompanhamento"
        />
      </div>

      {/* Legend */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <h4 className="text-sm font-medium mb-2">Como é calculado o Score?</h4>
          <p className="text-xs text-muted-foreground">
            O score jurídico (0-18 pontos) soma as respostas de 3 perguntas: Segurança Jurídica (Q18), 
            Influência nas Decisões (Q19) e Urgência (Q20). Cada resposta contribui de 0 a 6 pontos.
            O score é normalizado para escala 0-10 para exibição. A classificação HOT/WARM/COLD considera 
            o score total combinado de todos os módulos (IA + Licença + Jurídico).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
