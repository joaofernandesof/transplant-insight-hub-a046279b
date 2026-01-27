/**
 * Legal Response Matrix - Visual grid of Questions × Students
 * Shows all responses in a heatmap-style matrix
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Grid3X3, Search, User } from "lucide-react";
import type { StudentWithScores } from "./types";
import { cn } from "@/lib/utils";

interface LegalResponseMatrixProps {
  students: StudentWithScores[];
}

// Question definitions
const QUESTIONS = [
  { id: "q7", key: "q7_larissa_expectations", label: "Q7", fullLabel: "Expectativas Dra. Larissa", type: "scale" },
  { id: "q8", key: "q8_larissa_clarity", label: "Q8", fullLabel: "Clareza Dra. Larissa", type: "scale" },
  { id: "q9", key: "q9_larissa_time", label: "Q9", fullLabel: "Tempo Dra. Larissa", type: "scale" },
  { id: "q10", key: "q10_larissa_liked_most", label: "Q10", fullLabel: "O que mais gostou", type: "text" },
  { id: "q11", key: "q11_larissa_improve", label: "Q11", fullLabel: "O que pode melhorar", type: "text" },
  { id: "q18", key: "q18_legal_feeling", label: "Q18", fullLabel: "Sentimento Jurídico", type: "feeling" },
  { id: "q19", key: "q19_legal_influence", label: "Q19", fullLabel: "Influência Jurídica", type: "influence" },
  { id: "q20", key: "q20_legal_timing", label: "Q20", fullLabel: "Timing Regularização", type: "timing" },
];

// Color mappings for different response types
const getScaleColor = (value: string | null | undefined): string => {
  if (!value) return "bg-muted";
  const numericMap: Record<string, number> = {
    "1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
    "Péssimo": 1, "Ruim": 2, "Regular": 3, "Bom": 4, "Excelente": 5,
    "Nada satisfeito": 1, "Pouco satisfeito": 2, "Satisfeito": 3, "Muito satisfeito": 4,
    "Muito insatisfeito": 1, "Insatisfeito": 2,
  };
  const num = numericMap[value] || parseInt(value) || 0;
  if (num >= 5) return "bg-emerald-500 text-white";
  if (num >= 4) return "bg-emerald-400 text-white";
  if (num >= 3) return "bg-amber-400 text-white";
  if (num >= 2) return "bg-orange-400 text-white";
  return "bg-rose-500 text-white";
};

const getFeelingColor = (value: string | null | undefined): string => {
  if (!value) return "bg-muted";
  const lower = value.toLowerCase();
  if (lower.includes("tranquilo") || lower.includes("seguro")) return "bg-emerald-500 text-white";
  if (lower.includes("pouco inseguro")) return "bg-amber-400 text-white";
  if (lower.includes("inseguro")) return "bg-orange-400 text-white";
  if (lower.includes("exposto") || lower.includes("risco")) return "bg-rose-500 text-white";
  return "bg-muted";
};

const getInfluenceColor = (value: string | null | undefined): string => {
  if (!value) return "bg-muted";
  const lower = value.toLowerCase();
  if (lower.includes("não influenciam")) return "bg-emerald-500 text-white";
  if (lower.includes("pouco")) return "bg-amber-400 text-white";
  if (lower.includes("bastante")) return "bg-orange-400 text-white";
  if (lower.includes("travaram")) return "bg-rose-500 text-white";
  return "bg-muted";
};

const getTimingColor = (value: string | null | undefined): string => {
  if (!value) return "bg-muted";
  const lower = value.toLowerCase();
  if (lower.includes("não é prioridade")) return "bg-blue-400 text-white";
  if (lower.includes("crescer")) return "bg-amber-400 text-white";
  if (lower.includes("próximos")) return "bg-orange-400 text-white";
  if (lower.includes("quanto antes")) return "bg-rose-500 text-white";
  return "bg-muted";
};

const getTextColor = (value: string | null | undefined): string => {
  if (!value || value.trim() === "" || value === "-") return "bg-muted";
  return "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300";
};

const getCellColor = (type: string, value: string | null | undefined): string => {
  switch (type) {
    case "scale": return getScaleColor(value);
    case "feeling": return getFeelingColor(value);
    case "influence": return getInfluenceColor(value);
    case "timing": return getTimingColor(value);
    case "text": return getTextColor(value);
    default: return "bg-muted";
  }
};

const getDisplayValue = (type: string, value: string | null | undefined): string => {
  if (!value || value.trim() === "") return "—";
  if (type === "text") return value.length > 30 ? value.substring(0, 30) + "…" : value;
  if (type === "scale") {
    const num = parseInt(value);
    if (!isNaN(num)) return String(num);
  }
  // Return short version for categories
  if (value.includes("Tranquilo")) return "😊";
  if (value.includes("Um pouco inseguro")) return "😐";
  if (value.includes("Inseguro")) return "😟";
  if (value.includes("Exposto")) return "😰";
  if (value.includes("Não influenciam")) return "✅";
  if (value.includes("pouco")) return "⚠️";
  if (value.includes("bastante")) return "🔶";
  if (value.includes("Travaram")) return "🚨";
  if (value.includes("prioridade")) return "🔵";
  if (value.includes("crescer")) return "🟡";
  if (value.includes("Próximos")) return "🟠";
  if (value.includes("quanto antes")) return "🔴";
  return value.length > 15 ? value.substring(0, 15) + "…" : value;
};

export function LegalResponseMatrix({ students }: LegalResponseMatrixProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(s => s.name.toLowerCase().includes(term));
  }, [students, searchTerm]);

  const getInitials = (name: string) => {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  const getResponseValue = (student: StudentWithScores, key: string): string | null => {
    if (!student.responses) return null;
    return (student.responses as Record<string, string | null | undefined>)[key] ?? null;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
              <Grid3X3 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Matriz de Respostas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Pergunta × Aluno • {filteredStudents.length} alunos
              </p>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
          <span className="text-xs font-medium mr-2">Legenda:</span>
          <Badge className="bg-emerald-500 text-white text-xs">Ótimo</Badge>
          <Badge className="bg-amber-400 text-white text-xs">Bom</Badge>
          <Badge className="bg-orange-400 text-white text-xs">Regular</Badge>
          <Badge className="bg-rose-500 text-white text-xs">Ruim</Badge>
          <Badge className="bg-muted text-muted-foreground text-xs">Sem resposta</Badge>
        </div>

        {/* Matrix Table */}
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            <TooltipProvider>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="sticky left-0 z-10 bg-background p-2 text-left w-48">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium">Aluno</span>
                      </div>
                    </th>
                    {QUESTIONS.map((q) => (
                      <Tooltip key={q.id}>
                        <TooltipTrigger asChild>
                          <th className="p-2 text-center min-w-[60px]">
                            <Badge variant="outline" className="text-xs cursor-help">
                              {q.label}
                            </Badge>
                          </th>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{q.fullLabel}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    <th className="p-2 text-center min-w-[60px]">
                      <Badge variant="secondary" className="text-xs">Score</Badge>
                    </th>
                    <th className="p-2 text-center min-w-[60px]">
                      <Badge variant="secondary" className="text-xs">Class</Badge>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, idx) => (
                    <tr 
                      key={student.userId} 
                      className={cn(
                        "border-b hover:bg-muted/50 transition-colors",
                        idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                      )}
                    >
                      {/* Student Name (sticky) */}
                      <td className="sticky left-0 z-10 bg-inherit p-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={student.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium truncate max-w-[140px]">
                            {student.name}
                          </span>
                        </div>
                      </td>
                      
                      {/* Response Cells */}
                      {QUESTIONS.map((q) => {
                        const value = getResponseValue(student, q.key);
                        const cellColor = getCellColor(q.type, value);
                        const displayValue = getDisplayValue(q.type, value);
                        
                        return (
                          <Tooltip key={q.id}>
                            <TooltipTrigger asChild>
                              <td className="p-1 text-center">
                                <div 
                                  className={cn(
                                    "w-full h-8 flex items-center justify-center rounded text-xs font-medium cursor-help transition-all hover:scale-105",
                                    cellColor
                                  )}
                                >
                                  {displayValue}
                                </div>
                              </td>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="font-medium text-xs mb-1">{q.fullLabel}</p>
                              <p className="text-sm">{value || "Sem resposta"}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                      
                      {/* Score */}
                      <td className="p-1 text-center">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "font-bold",
                            student.scoreNormalized >= 7 && "border-emerald-500 text-emerald-600",
                            student.scoreNormalized >= 5 && student.scoreNormalized < 7 && "border-amber-500 text-amber-600",
                            student.scoreNormalized < 5 && "border-rose-500 text-rose-600"
                          )}
                        >
                          {student.scoreNormalized.toFixed(1)}
                        </Badge>
                      </td>
                      
                      {/* Classification */}
                      <td className="p-1 text-center">
                        <Badge 
                          className={cn(
                            student.classification === 'hot' && "bg-rose-500",
                            student.classification === 'warm' && "bg-amber-500",
                            student.classification === 'cold' && "bg-blue-500"
                          )}
                        >
                          {student.classification.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TooltipProvider>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {filteredStudents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum aluno encontrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
