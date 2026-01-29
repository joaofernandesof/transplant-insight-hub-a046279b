/**
 * IPROMED Students - Gestão de Alunos Jurídicos
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Users, 
  Search, 
  Filter, 
  Download,
  Flame,
  Thermometer,
  Snowflake,
  Eye,
  Loader2,
  FileText,
  Phone,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

interface StudentData {
  userId: string;
  name: string;
  avatarUrl: string | null;
  email: string | null;
  scoreLegal: number;
  classification: 'hot' | 'warm' | 'cold';
  examScore: number | null;
  feeling: string | null;
  influence: string | null;
  timing: string | null;
}

const classificationConfig = {
  hot: { 
    label: 'HOT', 
    icon: Flame, 
    bg: 'bg-rose-100 dark:bg-rose-900/30', 
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300'
  },
  warm: { 
    label: 'WARM', 
    icon: Thermometer, 
    bg: 'bg-amber-100 dark:bg-amber-900/30', 
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300'
  },
  cold: { 
    label: 'COLD', 
    icon: Snowflake, 
    bg: 'bg-blue-100 dark:bg-blue-900/30', 
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300'
  },
};

export default function IpromedStudents() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClassification, setFilterClassification] = useState<string>('all');
  const [viewStudent, setViewStudent] = useState<StudentData | null>(null);

  // Export students to CSV
  const handleExport = () => {
    if (!students || students.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }
    
    const headers = ['Nome', 'Email', 'Classificação', 'Score Legal', 'Nota Prova', 'Sentimento'];
    const rows = students.map(s => [
      s.name,
      s.email || '',
      s.classification.toUpperCase(),
      `${s.scoreLegal}/18`,
      s.examScore !== null ? `${s.examScore}%` : '-',
      s.feeling || '-',
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alunos-ipromed-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Dados exportados com sucesso!');
  };

  // View student details
  const handleViewStudent = (student: StudentData) => {
    setViewStudent(student);
  };

  // Fetch students with legal survey data
  const { data: students, isLoading } = useQuery({
    queryKey: ['ipromed-students'],
    queryFn: async () => {
      // Get surveys with legal scores
      const { data: surveys, error: surveyError } = await supabase
        .from('day2_satisfaction_surveys')
        .select(`
          user_id,
          score_legal,
          lead_classification,
          q18_legal_feeling,
          q19_legal_influence,
          q20_legal_timing
        `)
        .eq('is_completed', true);
      
      if (surveyError) throw surveyError;

      // Get profiles
      const userIds = [...new Set(surveys?.map(s => s.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Get exam scores
      const { data: exams } = await supabase
        .from('exams')
        .select('id')
        .ilike('title', '%direito%')
        .single();

      let examScoreMap = new Map<string, number>();
      if (exams?.id) {
        const { data: attempts } = await supabase
          .from('exam_attempts')
          .select('user_id, score')
          .eq('exam_id', exams.id)
          .eq('status', 'submitted');
        
        examScoreMap = new Map(attempts?.map(a => [a.user_id, a.score || 0]) || []);
      }

      // Build student data
      return surveys?.map(s => ({
        userId: s.user_id,
        name: profileMap.get(s.user_id)?.name || 'Anônimo',
        avatarUrl: profileMap.get(s.user_id)?.avatar_url || null,
        email: profileMap.get(s.user_id)?.email || null,
        scoreLegal: s.score_legal || 0,
        classification: (s.lead_classification as 'hot' | 'warm' | 'cold') || 'cold',
        examScore: examScoreMap.get(s.user_id) ?? null,
        feeling: s.q18_legal_feeling,
        influence: s.q19_legal_influence,
        timing: s.q20_legal_timing,
      })) || [];
    }
  });

  // Filter students
  const filteredStudents = students?.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterClassification === 'all' || student.classification === filterClassification;
    return matchesSearch && matchesFilter;
  }) || [];

  // Stats
  const stats = {
    total: students?.length || 0,
    hot: students?.filter(s => s.classification === 'hot').length || 0,
    warm: students?.filter(s => s.classification === 'warm').length || 0,
    cold: students?.filter(s => s.classification === 'cold').length || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/ipromed')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          IPROMED
        </Button>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-medium">Alunos</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Alunos</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie os alunos por classificação jurídica
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterClassification('all')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {(['hot', 'warm', 'cold'] as const).map((type) => {
          const config = classificationConfig[type];
          return (
            <Card 
              key={type} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${filterClassification === type ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setFilterClassification(type)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${config.bg} rounded-lg`}>
                    <config.icon className={`h-5 w-5 ${config.text}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{config.label}</p>
                    <p className="text-xl font-bold">{stats[type]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterClassification} onValueChange={setFilterClassification}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="hot">HOT</SelectItem>
            <SelectItem value="warm">WARM</SelectItem>
            <SelectItem value="cold">COLD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead className="text-center">Classificação</TableHead>
                <TableHead className="text-center">Score Legal</TableHead>
                <TableHead className="text-center">Prova</TableHead>
                <TableHead className="text-center">Sentimento</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => {
                const config = classificationConfig[student.classification];
                return (
                  <TableRow key={student.userId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.avatarUrl || undefined} />
                          <AvatarFallback>
                            {student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{student.name}</p>
                          {student.email && (
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${config.bg} ${config.text} border ${config.border}`}>
                        <config.icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {student.scoreLegal}/18
                    </TableCell>
                    <TableCell className="text-center">
                      {student.examScore !== null ? (
                        <Badge variant={student.examScore >= 70 ? "default" : "destructive"}>
                          {student.examScore}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm text-muted-foreground truncate max-w-[120px] block">
                        {student.feeling || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => handleViewStudent(student)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum aluno encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Student Details Dialog */}
      <Dialog open={!!viewStudent} onOpenChange={(open) => !open && setViewStudent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Detalhes do Aluno
            </DialogTitle>
          </DialogHeader>
          {viewStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={viewStudent.avatarUrl || undefined} />
                  <AvatarFallback className="text-lg">
                    {viewStudent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{viewStudent.name}</h3>
                  {viewStudent.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {viewStudent.email}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Classificação</p>
                  <Badge className={`mt-1 ${classificationConfig[viewStudent.classification].bg} ${classificationConfig[viewStudent.classification].text}`}>
                    {classificationConfig[viewStudent.classification].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Score Legal</p>
                  <p className="text-xl font-bold">{viewStudent.scoreLegal}/18</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nota da Prova</p>
                  <p className="text-xl font-bold">
                    {viewStudent.examScore !== null ? `${viewStudent.examScore}%` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timing</p>
                  <p className="text-sm">{viewStudent.timing || '-'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Sentimento Jurídico</p>
                <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{viewStudent.feeling || 'Não informado'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Influência nas Decisões</p>
                <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{viewStudent.influence || 'Não informado'}</p>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setViewStudent(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
