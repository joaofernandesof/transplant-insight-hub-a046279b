/**
 * Legal Module - Full Surveys Tab
 * Shows complete survey responses without truncation
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  User,
  Flame,
  Thermometer,
  Snowflake,
  Shield,
  Users,
  Clock,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudentWithScores } from "./types";

interface LegalFullSurveysTabProps {
  students: StudentWithScores[];
}

interface SurveyResponseCardProps {
  student: StudentWithScores;
  isExpanded: boolean;
  onToggle: () => void;
}

function SurveyResponseCard({ student, isExpanded, onToggle }: SurveyResponseCardProps) {
  const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  const classColors = {
    hot: { bg: 'bg-rose-100', text: 'text-rose-700', icon: <Flame className="h-3 w-3" /> },
    warm: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Thermometer className="h-3 w-3" /> },
    cold: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Snowflake className="h-3 w-3" /> },
  };

  const colors = classColors[student.classification];

  // Questions and answers mapping
  const questions = [
    {
      category: 'Percepção Jurídica',
      icon: <Shield className="h-4 w-4 text-violet-500" />,
      items: [
        { q: 'Q18 - Como você se sente do ponto de vista jurídico?', a: student.responses?.q18_legal_feeling },
        { q: 'Q19 - As questões jurídicas influenciam suas decisões?', a: student.responses?.q19_legal_influence },
        { q: 'Q20 - Quando pretende resolver questões jurídicas?', a: student.responses?.q20_legal_timing },
      ]
    },
    {
      category: 'Avaliação Dra. Larissa',
      icon: <Users className="h-4 w-4 text-violet-500" />,
      items: [
        { q: 'Q7 - A Dra. Larissa atendeu às suas expectativas?', a: student.responses?.q7_larissa_expectations },
        { q: 'Q8 - A didática e clareza foram adequadas?', a: student.responses?.q8_larissa_clarity },
        { q: 'Q9 - O tempo dedicado foi suficiente?', a: student.responses?.q9_larissa_time },
        { q: 'Q10 - O que você mais gostou na aula?', a: student.responses?.q10_larissa_liked_most },
        { q: 'Q11 - O que poderia ser melhorado?', a: student.responses?.q11_larissa_improve },
      ]
    }
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={student.avatarUrl || undefined} alt={student.name} />
              <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{student.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-xs", colors.bg, colors.text)}>
                  {colors.icon}
                  <span className="ml-1">{student.classification.toUpperCase()}</span>
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Score: {student.scoreNormalized.toFixed(1)}/10
                </span>
                {student.examScore !== null && (
                  <span className="text-xs text-muted-foreground">
                    | Prova: {student.examScore}%
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          
          <div className="space-y-6">
            {questions.map((category, catIndex) => (
              <div key={catIndex}>
                <div className="flex items-center gap-2 mb-3">
                  {category.icon}
                  <h4 className="text-sm font-semibold">{category.category}</h4>
                </div>
                
                <div className="space-y-4 pl-6">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">{item.q}</p>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">
                          {item.a || <span className="text-muted-foreground italic">Não respondido</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function LegalFullSurveysTab({ students }: LegalFullSurveysTabProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const expandAll = () => {
    setExpandedIds(new Set(filteredStudents.map(s => s.userId)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const filteredStudents = filter === 'all' 
    ? students 
    : students.filter(s => s.classification === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-violet-500" />
          <div>
            <h2 className="text-lg font-semibold">Pesquisas na Íntegra</h2>
            <p className="text-sm text-muted-foreground">
              Respostas completas de {filteredStudents.length} alunos
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expandir Todos
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Recolher Todos
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todos ({students.length})
        </Button>
        <Button 
          variant={filter === 'hot' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('hot')}
          className={filter === 'hot' ? 'bg-rose-500 hover:bg-rose-600' : ''}
        >
          <Flame className="h-3 w-3 mr-1" />
          HOT ({students.filter(s => s.classification === 'hot').length})
        </Button>
        <Button 
          variant={filter === 'warm' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('warm')}
          className={filter === 'warm' ? 'bg-amber-500 hover:bg-amber-600' : ''}
        >
          <Thermometer className="h-3 w-3 mr-1" />
          WARM ({students.filter(s => s.classification === 'warm').length})
        </Button>
        <Button 
          variant={filter === 'cold' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('cold')}
          className={filter === 'cold' ? 'bg-blue-500 hover:bg-blue-600' : ''}
        >
          <Snowflake className="h-3 w-3 mr-1" />
          COLD ({students.filter(s => s.classification === 'cold').length})
        </Button>
      </div>

      {/* Survey Cards */}
      <div className="space-y-4">
        {filteredStudents.map((student) => (
          <SurveyResponseCard
            key={student.userId}
            student={student}
            isExpanded={expandedIds.has(student.userId)}
            onToggle={() => toggleExpanded(student.userId)}
          />
        ))}
        
        {filteredStudents.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma pesquisa encontrada para o filtro selecionado.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
