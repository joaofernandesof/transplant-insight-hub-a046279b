import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, ChevronDown, ChevronUp, User, Clock, MessageSquare, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface StudentFullAnswer {
  id: string;
  name: string;
  avatarUrl?: string | null;
  completedAt?: string | null;
  effectiveTimeSeconds?: number | null;
  overallScore?: number;
  classification?: 'hot' | 'warm' | 'cold' | 'promotor' | 'neutro' | 'detrator';
  responses: {
    key: string;
    question: string;
    answer: string | null;
    category?: string;
    numericValue?: number | null;
  }[];
}

interface SurveyFullAnswersTabProps {
  students: StudentFullAnswer[];
  surveyName?: string;
  questionLabels?: Record<string, string>;
  categoryLabels?: Record<string, string>;
}

const formatTime = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const getClassificationBadge = (classification?: string) => {
  if (!classification) return null;
  
  const configs: Record<string, { label: string; className: string }> = {
    hot: { label: 'Quente', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    warm: { label: 'Morno', className: 'bg-warning/10 text-warning border-warning/20' },
    cold: { label: 'Frio', className: 'bg-accent/30 text-accent-foreground border-accent/20' },
    promotor: { label: 'Promotor', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    neutro: { label: 'Neutro', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    detrator: { label: 'Detrator', className: 'bg-red-100 text-red-700 border-red-200' },
  };
  
  const config = configs[classification];
  if (!config) return null;
  
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};

const getScoreBadge = (score?: number) => {
  if (score === undefined || score === null) return null;
  
  let className = 'bg-muted text-muted-foreground';
  if (score >= 8) className = 'bg-emerald-100 text-emerald-700';
  else if (score >= 6) className = 'bg-blue-100 text-blue-700';
  else if (score >= 4) className = 'bg-yellow-100 text-yellow-700';
  else className = 'bg-red-100 text-red-700';
  
  return (
    <Badge variant="outline" className={className}>
      {score.toFixed(1)}/10
    </Badge>
  );
};

export function SurveyFullAnswersTab({ 
  students, 
  surveyName = 'Pesquisa',
  questionLabels = {},
  categoryLabels = {}
}: SurveyFullAnswersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const toggleStudent = (id: string) => {
    setExpandedStudents(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  const expandAll = () => {
    setExpandedStudents(new Set(filteredStudents.map(s => s.id)));
  };
  
  const collapseAll = () => {
    setExpandedStudents(new Set());
  };
  
  // Group responses by category
  const groupByCategory = (responses: StudentFullAnswer['responses']) => {
    const grouped: Record<string, typeof responses> = {};
    responses.forEach(r => {
      const cat = r.category || 'Geral';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(r);
    });
    return grouped;
  };
  
  if (students.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <h3 className="font-semibold mb-1">Nenhuma resposta encontrada</h3>
          <p className="text-sm">As respostas completas aparecerão aqui quando houver dados.</p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Respostas Completas
              </CardTitle>
              <CardDescription>
                {filteredStudents.length} aluno(s) • Clique para expandir e ver todas as respostas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Button variant="outline" size="sm" onClick={expandAll}>
                <ChevronDown className="h-4 w-4 mr-1" />
                Expandir
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                <ChevronUp className="h-4 w-4 mr-1" />
                Recolher
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Students List */}
      <div className="space-y-3">
        {filteredStudents.map((student) => {
          const isExpanded = expandedStudents.has(student.id);
          const groupedResponses = groupByCategory(student.responses);
          
          return (
            <Collapsible key={student.id} open={isExpanded} onOpenChange={() => toggleStudent(student.id)}>
              <Card className={cn(
                "transition-all",
                isExpanded && "ring-2 ring-primary/20"
              )}>
                {/* Student Header - Always Visible */}
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={student.avatarUrl || undefined} alt={student.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {student.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{student.name}</span>
                            {getClassificationBadge(student.classification)}
                            {getScoreBadge(student.overallScore)}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                            {student.completedAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(parseISO(student.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            )}
                            {student.effectiveTimeSeconds && student.effectiveTimeSeconds > 0 && (
                              <span>• {formatTime(student.effectiveTimeSeconds)}</span>
                            )}
                            <span>• {student.responses.filter(r => r.answer).length}/{student.responses.length} respostas</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                {/* Expanded Content */}
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-6">
                      <div className="space-y-6">
                        {Object.entries(groupedResponses).map(([category, responses]) => (
                          <div key={category}>
                            <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                              <div className="h-1 w-1 rounded-full bg-primary" />
                              {categoryLabels[category] || category}
                            </h4>
                            <div className="space-y-2">
                              {responses.map((response, idx) => {
                                const isTextAnswer = response.answer && response.answer.length > 50;
                                const hasValue = response.numericValue !== null && response.numericValue !== undefined;
                                
                                return (
                                  <div 
                                    key={response.key || idx}
                                    className={cn(
                                      "p-3 rounded-lg border",
                                      !response.answer && "bg-muted/30 border-dashed",
                                      hasValue && response.numericValue! >= 8 && "border-l-4 border-l-emerald-500",
                                      hasValue && response.numericValue! >= 4 && response.numericValue! < 8 && "border-l-4 border-l-amber-500",
                                      hasValue && response.numericValue! < 4 && "border-l-4 border-l-red-500"
                                    )}
                                  >
                                    <p className="text-sm text-muted-foreground mb-1">
                                      {questionLabels[response.key] || response.question}
                                    </p>
                                    {response.answer ? (
                                      isTextAnswer ? (
                                        <p className="text-sm bg-muted/50 p-2 rounded italic">
                                          "{response.answer}"
                                        </p>
                                      ) : (
                                        <p className="font-medium">{response.answer}</p>
                                      )
                                    ) : (
                                      <p className="text-sm text-muted-foreground italic">Não respondido</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
