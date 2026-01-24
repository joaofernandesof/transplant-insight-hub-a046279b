import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  LabelList,
  Cell,
} from "recharts";
import {
  Users,
  TrendingUp,
  Award,
  MessageSquare,
  Flame,
  Star,
  CheckCircle2,
  Clock,
  ThumbsUp,
  Lightbulb,
  Search,
  User,
  ArrowUpDown,
  BarChart3,
  ListOrdered,
  FileText,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import { useSurveyAnalytics, type QuestionRating, type StudentDetailedResponse } from "@/neohub/hooks/useSurveyAnalytics";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventSurveyDashboardProps {
  classId: string | null;
}

const NPS_COLORS = { promoters: '#10b981', passives: '#f59e0b', detractors: '#ef4444' };

const ALL_SATISFACTION_LEVELS = [
  { key: 'Muito satisfeito', label: 'Muito satisfeito', color: '#10b981' },
  { key: 'Satisfeito', label: 'Satisfeito', color: '#22c55e' },
  { key: 'Neutro', label: 'Neutro', color: '#f59e0b' },
  { key: 'Insatisfeito', label: 'Insatisfeito', color: '#f97316' },
  { key: 'Muito insatisfeito', label: 'Muito insatisfeito', color: '#ef4444' },
];

const ALL_URGENCY_LEVELS = [
  { key: 'Alta urgência', label: 'Alta urgência', color: '#ef4444' },
  { key: 'Média urgência', label: 'Média urgência', color: '#f59e0b' },
  { key: 'Sem urgência', label: 'Sem urgência', color: '#94a3b8' },
];

const ALL_WEEKLY_TIME = [
  { key: 'Mais de 10 horas', label: 'Mais de 10h', color: '#10b981' },
  { key: 'De 5 a 10 horas', label: '5 a 10h', color: '#3b82f6' },
  { key: 'Até 5 horas', label: 'Até 5h', color: '#94a3b8' },
];

const getWordFrequency = (texts: string[]): { word: string; count: number }[] => {
  const wordCount: Record<string, number> = {};
  const stopWords = ['de', 'da', 'do', 'e', 'a', 'o', 'que', 'em', 'para', 'com', 'um', 'uma', 'os', 'as', 'no', 'na', 'é', 'foi', 'muito', 'mais', 'como', 'se', 'ao', 'por'];
  
  texts.forEach(text => {
    const words = text.toLowerCase().split(/\s+/);
    words.forEach(word => {
      const cleaned = word.replace(/[^a-záàâãéèêíïóôõöúçñ]/gi, '');
      if (cleaned.length > 3 && !stopWords.includes(cleaned)) {
        wordCount[cleaned] = (wordCount[cleaned] || 0) + 1;
      }
    });
  });
  
  return Object.entries(wordCount)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
};

const exportStudentResponsesPDF = (students: StudentDetailedResponse[], eventName?: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 25;

  // Colors (RGB)
  const colors = {
    primary: { r: 22, g: 163, b: 74 },      // Green-600
    primaryLight: { r: 220, g: 252, b: 231 }, // Green-100
    secondary: { r: 59, g: 130, b: 246 },    // Blue-500
    orange: { r: 234, g: 88, b: 12 },        // Orange-600
    gray: { r: 107, g: 114, b: 128 },        // Gray-500
    grayLight: { r: 243, g: 244, b: 246 },   // Gray-100
    grayMedium: { r: 229, g: 231, b: 235 },  // Gray-200
    dark: { r: 31, g: 41, b: 55 },           // Gray-800
    white: { r: 255, g: 255, b: 255 },
  };

  // Helper: Draw rounded rectangle
  const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, fill: boolean, stroke: boolean) => {
    doc.roundedRect(x, y, w, h, r, r, fill ? 'F' : stroke ? 'S' : 'FD');
  };

  // Helper: Get rating color based on sentiment
  const getValueColor = (value: string) => {
    const positiveWords = ['excelente', 'ótimo', 'muito', 'totalmente', 'concordo', 'atendeu', 'perfeito', 'alta', 'bom'];
    const negativeWords = ['ruim', 'péssimo', 'não', 'insatisfeito', 'discordo', 'baixo', 'fraco'];
    
    const lowerValue = value.toLowerCase();
    if (positiveWords.some(w => lowerValue.includes(w))) return colors.primary;
    if (negativeWords.some(w => lowerValue.includes(w))) return colors.orange;
    return colors.secondary;
  };

  // ========== HEADER ==========
  // Top gradient bar
  doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.rect(0, 0, pageWidth, 8, 'F');
  
  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.dark.r, colors.dark.g, colors.dark.b);
  doc.text("Pesquisa de Satisfação", pageWidth / 2, y, { align: "center" });
  y += 8;
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
  doc.text("Respostas Detalhadas por Aluno", pageWidth / 2, y, { align: "center" });
  y += 10;

  // Generation date badge
  const dateText = `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;
  const dateWidth = doc.getTextWidth(dateText) + 12;
  doc.setFillColor(colors.grayLight.r, colors.grayLight.g, colors.grayLight.b);
  drawRoundedRect((pageWidth - dateWidth) / 2, y - 4, dateWidth, 8, 2, true, false);
  doc.setFontSize(9);
  doc.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
  doc.text(dateText, pageWidth / 2, y + 1, { align: "center" });
  y += 18;

  // Summary stats
  const totalStudents = students.length;
  const completedStudents = students.filter(s => s.isCompleted).length;
  const hotLeads = students.filter(s => s.isHotLead).length;
  
  doc.setFontSize(10);
  doc.setTextColor(colors.dark.r, colors.dark.g, colors.dark.b);
  doc.text(`${totalStudents} alunos  •  ${completedStudents} completos  •  ${hotLeads} hot leads`, pageWidth / 2, y, { align: "center" });
  y += 15;

  // Divider line
  doc.setDrawColor(colors.grayMedium.r, colors.grayMedium.g, colors.grayMedium.b);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // ========== STUDENT CARDS ==========
  students.forEach((student, studentIndex) => {
    // Check if we need a new page
    if (y > 240) {
      doc.addPage();
      // Add top bar on new pages
      doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
      doc.rect(0, 0, pageWidth, 5, 'F');
      y = 20;
    }

    // ===== Student Header Card =====
    // Background card
    doc.setFillColor(colors.grayLight.r, colors.grayLight.g, colors.grayLight.b);
    drawRoundedRect(margin, y - 5, pageWidth - margin * 2, 22, 3, true, false);
    
    // Avatar circle with initial
    const avatarX = margin + 10;
    const avatarY = y + 6;
    doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
    doc.circle(avatarX, avatarY, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const initial = student.userName.charAt(0).toUpperCase();
    doc.text(initial, avatarX, avatarY + 3.5, { align: "center" });
    
    // Student name
    doc.setTextColor(colors.dark.r, colors.dark.g, colors.dark.b);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(student.userName, margin + 22, y + 4);
    
    // Completion date
    if (student.completedAt) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
      doc.text(`✓ Completou em ${student.completedAt}`, margin + 22, y + 11);
    } else {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
      doc.text(`Em andamento (${student.progressPercent}%)`, margin + 22, y + 11);
    }
    
    // Status badge
    const statusText = student.isCompleted ? "Completo" : `${student.progressPercent}%`;
    const statusWidth = doc.getTextWidth(statusText) + 10;
    const badgeX = pageWidth - margin - statusWidth - 5;
    
    if (student.isCompleted) {
      doc.setFillColor(colors.primaryLight.r, colors.primaryLight.g, colors.primaryLight.b);
    } else {
      doc.setFillColor(colors.grayMedium.r, colors.grayMedium.g, colors.grayMedium.b);
    }
    drawRoundedRect(badgeX, y - 1, statusWidth, 7, 2, true, false);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    if (student.isCompleted) {
      doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
    } else {
      doc.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
    }
    doc.text(statusText, badgeX + 5, y + 3.5);
    
    // Hot Lead badge
    if (student.isHotLead) {
      const hotLeadText = "🔥 Hot Lead";
      const hotLeadWidth = doc.getTextWidth(hotLeadText) + 8;
      const hotLeadX = badgeX - hotLeadWidth - 5;
      doc.setFillColor(255, 237, 213);
      drawRoundedRect(hotLeadX, y - 1, hotLeadWidth, 7, 2, true, false);
      doc.setFontSize(8);
      doc.setTextColor(colors.orange.r, colors.orange.g, colors.orange.b);
      doc.text(hotLeadText, hotLeadX + 4, y + 3.5);
    }
    
    y += 22;

    // Group responses by category
    const groupedResponses = student.responses.reduce((acc, r) => {
      if (!acc[r.category]) acc[r.category] = [];
      acc[r.category].push(r);
      return acc;
    }, {} as Record<string, typeof student.responses>);

    // ===== Category Sections =====
    Object.entries(groupedResponses).forEach(([category, responses]) => {
      if (y > 265) {
        doc.addPage();
        doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
        doc.rect(0, 0, pageWidth, 5, 'F');
        y = 20;
      }

      // Category header
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.dark.r, colors.dark.g, colors.dark.b);
      doc.text(category, margin, y);
      y += 6;

      // Response rows (zebra striping)
      responses.forEach((r, idx) => {
        if (y > 280) {
          doc.addPage();
          doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
          doc.rect(0, 0, pageWidth, 5, 'F');
          y = 20;
        }

        // Zebra stripe background
        if (idx % 2 === 0) {
          doc.setFillColor(colors.grayLight.r, colors.grayLight.g, colors.grayLight.b);
          doc.rect(margin, y - 4, pageWidth - margin * 2, 7, 'F');
        }

        // Question text (full, with word wrap if needed)
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
        
        const maxQuestionWidth = (pageWidth - margin * 2) * 0.55;
        const questionLines = doc.splitTextToSize(r.questionLabel, maxQuestionWidth);
        doc.text(questionLines[0], margin + 3, y);
        
        // Value text (colored based on sentiment)
        const valueText = r.value || "—";
        const maxValueWidth = (pageWidth - margin * 2) * 0.4;
        const valueColor = r.value ? getValueColor(r.value) : colors.gray;
        doc.setTextColor(valueColor.r, valueColor.g, valueColor.b);
        doc.setFont("helvetica", "bold");
        
        const valueLines = doc.splitTextToSize(valueText, maxValueWidth);
        doc.text(valueLines[0], pageWidth - margin - 3, y, { align: "right" });
        
        y += 7;
      });

      y += 4;
    });

    // Divider between students
    y += 4;
    doc.setDrawColor(colors.grayMedium.r, colors.grayMedium.g, colors.grayMedium.b);
    doc.setLineWidth(0.3);
    doc.line(margin + 20, y, pageWidth - margin - 20, y);
    y += 10;
  });

  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, 290, { align: "center" });
  }

  doc.save(`pesquisa-satisfacao-${new Date().toISOString().split('T')[0]}.pdf`);
};

const getRatingColor = (value: number): string => {
  if (value >= 4.5) return 'text-emerald-600';
  if (value >= 3.5) return 'text-blue-600';
  if (value >= 2.5) return 'text-yellow-600';
  if (value >= 1.5) return 'text-orange-600';
  return 'text-red-600';
};

const getRatingBgColor = (value: number): string => {
  if (value >= 4.5) return 'bg-emerald-100 border-emerald-200';
  if (value >= 3.5) return 'bg-blue-100 border-blue-200';
  if (value >= 2.5) return 'bg-yellow-100 border-yellow-200';
  if (value >= 1.5) return 'bg-orange-100 border-orange-200';
  return 'bg-red-100 border-red-200';
};

const StarRating = ({ value, max = 5 }: { value: number; max?: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < Math.round(value)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{value.toFixed(1)}</span>
    </div>
  );
};

const buildDistributionData = (
  distribution: Record<string, number>,
  allOptions: { key: string; label: string; color: string }[]
) => {
  return allOptions.map(opt => ({
    name: opt.label,
    value: distribution[opt.key] || 0,
    fill: opt.color,
  }));
};

// ============== QUESTION DETAIL COMPONENT ==============
function QuestionDetailView({ question }: { question: QuestionRating }) {
  const distributionData = Object.entries(question.distribution).map(([key, value]) => ({
    name: key,
    value,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="outline" className="mb-1 text-[10px]">{question.category}</Badge>
            <CardTitle className="text-base">{question.questionLabel}</CardTitle>
          </div>
          <div className={`text-3xl font-bold ${getRatingColor(question.avgRating)}`}>
            {question.avgRating.toFixed(1)}
          </div>
        </div>
        <CardDescription>{question.responseCount} respostas</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={distributionData} layout="vertical" margin={{ left: 10, right: 30 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
              <LabelList dataKey="value" position="right" className="text-xs" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============== STUDENT DETAIL COMPONENT ==============
function StudentDetailView({ student }: { student: StudentDetailedResponse }) {
  const groupedResponses = student.responses.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, typeof student.responses>);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className={student.isHotLead ? 'bg-orange-100 text-orange-700' : ''}>
              {student.userName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {student.userName}
              {student.isHotLead && <Flame className="h-4 w-4 text-orange-500" />}
            </CardTitle>
            <CardDescription>
              {student.isCompleted ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Completou em {student.completedAt ? format(parseISO(student.completedAt), "dd/MM 'às' HH:mm", { locale: ptBR }) : ''}
                </span>
              ) : (
                <span className="text-yellow-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {student.answeredQuestions}/{student.totalQuestions} perguntas ({student.progressPercent}%)
                </span>
              )}
            </CardDescription>
          </div>
          {student.satisfaction && (
            <Badge className={`${
              student.satisfaction.toLowerCase().includes('muito satisfeito') ? 'bg-emerald-100 text-emerald-700' :
              student.satisfaction.toLowerCase().includes('satisfeito') ? 'bg-blue-100 text-blue-700' :
              student.satisfaction.toLowerCase().includes('neutro') ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {student.satisfaction}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(groupedResponses).map(([category, responses]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{category}</h4>
              <div className="grid gap-1.5">
                {responses.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-sm">
                    <span className="text-muted-foreground">{r.questionLabel}</span>
                    <span className={`font-medium ${r.numericValue ? getRatingColor(r.numericValue) : ''}`}>
                      {r.value || <span className="text-muted-foreground/50">—</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============== MAIN DASHBOARD ==============
export function EventSurveyDashboard({ classId }: EventSurveyDashboardProps) {
  const { data: analytics, isLoading, error } = useSurveyAnalytics(classId);
  const [questionSearch, setQuestionSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionRating | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetailedResponse | null>(null);
  const [studentSearch, setStudentSearch] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <h3 className="font-semibold mb-1">Nenhuma resposta ainda</h3>
          <p className="text-sm">As respostas da pesquisa de satisfação aparecerão aqui.</p>
        </div>
      </Card>
    );
  }

  // Build chart data
  const satisfactionDistribution: Record<string, number> = {};
  analytics.responsesByStudent.forEach(r => {
    if (r.satisfaction) {
      satisfactionDistribution[r.satisfaction] = (satisfactionDistribution[r.satisfaction] || 0) + 1;
    }
  });

  const satisfactionData = buildDistributionData(satisfactionDistribution, ALL_SATISFACTION_LEVELS);
  const urgencyData = buildDistributionData(analytics.studentProfile.urgencyLevel, ALL_URGENCY_LEVELS);
  const weeklyTimeData = buildDistributionData(analytics.studentProfile.weeklyTime, ALL_WEEKLY_TIME);

  const npsDistribution = [
    { name: 'Promotores', value: analytics.nps.promoters, fill: NPS_COLORS.promoters },
    { name: 'Neutros', value: analytics.nps.passives, fill: NPS_COLORS.passives },
    { name: 'Detratores', value: analytics.nps.detractors, fill: NPS_COLORS.detractors },
  ];

  const infrastructureData = [
    { name: 'Organização', value: analytics.infrastructure.organization },
    { name: 'Conteúdo', value: analytics.infrastructure.contentRelevance },
    { name: 'Professores', value: analytics.infrastructure.teacherCompetence },
    { name: 'Material', value: analytics.infrastructure.materialQuality },
    { name: 'Pontualidade', value: analytics.infrastructure.punctuality },
    { name: 'Infraestrutura', value: analytics.infrastructure.infrastructure },
    { name: 'Equipe', value: analytics.infrastructure.supportTeam },
    { name: 'Coffee Break', value: analytics.infrastructure.coffeeBreak },
  ];

  const instructorRadarData = [
    {
      metric: 'Expectativas',
      'Dr. Hygor': analytics.instructors.hygor.avgExpectations,
      'Dr. Patrick': analytics.instructors.patrick.avgExpectations,
    },
    {
      metric: 'Clareza',
      'Dr. Hygor': analytics.instructors.hygor.avgClarity,
      'Dr. Patrick': analytics.instructors.patrick.avgClarity,
    },
    {
      metric: 'Tempo',
      'Dr. Hygor': analytics.instructors.hygor.avgTime,
      'Dr. Patrick': analytics.instructors.patrick.avgTime,
    },
  ];

  const wordFrequency = getWordFrequency([...analytics.openFeedback.likedMost, ...analytics.openFeedback.suggestions]);

  // Filter questions
  const categories = [...new Set(analytics.allQuestions.map(q => q.category))];
  const filteredQuestions = analytics.allQuestions.filter(q => {
    const matchesSearch = q.questionLabel.toLowerCase().includes(questionSearch.toLowerCase());
    const matchesCategory = categoryFilter === "all" || q.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filter students
  const filteredStudents = analytics.responsesByStudent.filter(s =>
    s.userName.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="grid grid-cols-4 w-full max-w-2xl">
        <TabsTrigger value="overview" className="flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4" />
          Visão Geral
        </TabsTrigger>
        <TabsTrigger value="ranking" className="flex items-center gap-1.5">
          <ListOrdered className="h-4 w-4" />
          Ranking
        </TabsTrigger>
        <TabsTrigger value="questions" className="flex items-center gap-1.5">
          <FileText className="h-4 w-4" />
          Perguntas
        </TabsTrigger>
        <TabsTrigger value="students" className="flex items-center gap-1.5">
          <User className="h-4 w-4" />
          Alunos
        </TabsTrigger>
      </TabsList>

      {/* ============== OVERVIEW TAB ============== */}
      <TabsContent value="overview" className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{analytics.totalResponses}</p>
                  <p className="text-xs text-muted-foreground">Respostas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{analytics.completionRate}%</p>
                  <p className="text-xs text-muted-foreground">Conclusão</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${
            analytics.nps.score >= 50 
              ? 'from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50'
              : analytics.nps.score >= 0
              ? 'from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-200/50'
              : 'from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-red-200/50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${
                  analytics.nps.score >= 50 ? 'bg-emerald-500/20' : analytics.nps.score >= 0 ? 'bg-yellow-500/20' : 'bg-red-500/20'
                }`}>
                  <TrendingUp className={`h-4 w-4 ${
                    analytics.nps.score >= 50 ? 'text-emerald-600' : analytics.nps.score >= 0 ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${
                    analytics.nps.score >= 50 ? 'text-emerald-700 dark:text-emerald-400' :
                    analytics.nps.score >= 0 ? 'text-yellow-700 dark:text-yellow-400' :
                    'text-red-700 dark:text-red-400'
                  }`}>{analytics.nps.score}</p>
                  <p className="text-xs text-muted-foreground">NPS</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Award className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{analytics.overallSatisfaction.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Satisfação</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Flame className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{analytics.hotLeads.length}</p>
                  <p className="text-xs text-muted-foreground">Hot Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Satisfaction Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Distribuição de Satisfação</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={satisfactionData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {satisfactionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="value" position="right" className="text-xs font-medium" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* NPS Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Distribuição NPS</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={npsDistribution} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {npsDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="value" position="right" className="text-xs font-medium" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Infrastructure & Instructors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Infrastructure Radar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Infraestrutura (Médias)</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={infrastructureData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" domain={[0, 5]} hide />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: number) => value.toFixed(1)} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="value" position="right" formatter={(v: number) => v.toFixed(1)} className="text-xs" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Instructor Radar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Comparação de Professores</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={instructorRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 8 }} />
                  <Radar name="Dr. Hygor" dataKey="Dr. Hygor" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Radar name="Dr. Patrick" dataKey="Dr. Patrick" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Feedback Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {wordFrequency.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Palavras Mais Citadas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {wordFrequency.map((item, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-xs"
                      style={{ fontSize: `${Math.max(10, Math.min(14, 10 + item.count))}px` }}
                    >
                      {item.word}
                      <span className="ml-1 text-muted-foreground text-[10px]">({item.count})</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-emerald-500" />
                O Que Mais Gostaram
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-40">
                <div className="space-y-1.5">
                  {analytics.openFeedback.likedMost.length > 0 ? (
                    analytics.openFeedback.likedMost.slice(0, 6).map((text, idx) => (
                      <div key={idx} className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                        <p className="text-xs text-foreground">"{text}"</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Nenhum feedback registrado
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions */}
        {analytics.openFeedback.suggestions.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Sugestões de Melhoria
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {analytics.openFeedback.suggestions.slice(0, 6).map((text, idx) => (
                  <div key={idx} className="p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                    <p className="text-xs text-foreground">"{text}"</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* ============== RANKING TAB ============== */}
      <TabsContent value="ranking" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Ranking de Perguntas (Melhor → Pior)
            </CardTitle>
            <CardDescription>
              Todas as perguntas ordenadas pela média de avaliação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.questionRankings.map((q, idx) => (
                <div
                  key={q.questionKey}
                  className={`flex items-center justify-between p-3 rounded-lg border ${getRatingBgColor(q.avgRating)} cursor-pointer hover:opacity-80 transition-opacity`}
                  onClick={() => {
                    setSelectedQuestion(q);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold w-8 ${
                      idx === 0 ? 'text-yellow-500' :
                      idx === 1 ? 'text-slate-400' :
                      idx === 2 ? 'text-amber-600' :
                      'text-muted-foreground'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{q.questionLabel}</p>
                      <Badge variant="outline" className="text-[10px] mt-0.5">{q.category}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{q.responseCount} respostas</span>
                    <span className={`text-xl font-bold ${getRatingColor(q.avgRating)}`}>
                      {q.avgRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedQuestion && (
          <QuestionDetailView question={selectedQuestion} />
        )}
      </TabsContent>

      {/* ============== QUESTIONS TAB ============== */}
      <TabsContent value="questions" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Análise por Pergunta</CardTitle>
            <CardDescription>Selecione uma pergunta para ver detalhes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pergunta..."
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-1.5">
                {filteredQuestions.map((q) => (
                  <div
                    key={q.questionKey}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                      selectedQuestion?.questionKey === q.questionKey
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedQuestion(q)}
                  >
                    <div>
                      <p className="text-sm font-medium">{q.questionLabel}</p>
                      <Badge variant="outline" className="text-[10px]">{q.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{q.responseCount}</span>
                      <span className={`font-bold ${getRatingColor(q.avgRating)}`}>
                        {q.avgRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {selectedQuestion && (
          <QuestionDetailView question={selectedQuestion} />
        )}
      </TabsContent>

      {/* ============== STUDENTS TAB ============== */}
      <TabsContent value="students" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Análise Individual por Aluno</CardTitle>
              <CardDescription>Selecione um aluno para ver todas as respostas</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportStudentResponsesPDF(analytics.responsesByStudent)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-1.5">
                {filteredStudents.map((student) => (
                  <div
                    key={student.userId}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                      selectedStudent?.userId === student.userId
                        ? 'border-primary bg-primary/5'
                        : student.isHotLead
                        ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 hover:bg-orange-100'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={student.isHotLead ? 'bg-orange-100 text-orange-700' : ''}>
                          {student.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          {student.userName}
                          {student.isHotLead && <Flame className="h-3 w-3 text-orange-500" />}
                          {student.isFirstTime && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">1ª vez</Badge>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {student.isCompleted ? (
                            <span className="text-emerald-600">Completou</span>
                          ) : (
                            <span className="text-yellow-600">
                              {student.answeredQuestions}/{student.totalQuestions} ({student.progressPercent}%)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!student.isCompleted && (
                        <Progress value={student.progressPercent} className="w-12 h-1.5" />
                      )}
                      {student.satisfaction && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            student.satisfaction.toLowerCase().includes('muito satisfeito') ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            student.satisfaction.toLowerCase().includes('satisfeito') ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            student.satisfaction.toLowerCase().includes('neutro') ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                            'bg-red-100 text-red-700 border-red-200'
                          }`}
                        >
                          {student.satisfaction}
                        </Badge>
                      )}
                      {student.isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {selectedStudent && (
          <StudentDetailView student={selectedStudent} />
        )}
      </TabsContent>
    </Tabs>
  );
}
