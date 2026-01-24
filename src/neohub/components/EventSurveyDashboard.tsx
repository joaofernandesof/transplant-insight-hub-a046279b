import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  TrendingDown,
  Award,
  MessageSquare,
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
  Sparkles,
  AlertTriangle,
  Target,
  Zap,
  Brain,
  RefreshCw,
  Trophy,
  Medal,
  X,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useSurveyAnalytics, type QuestionRating, type StudentDetailedResponse } from "@/neohub/hooks/useSurveyAnalytics";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface EventSurveyDashboardProps {
  classId: string | null;
}

// Drill-down dialog state type
interface DrilldownData {
  title: string;
  category: string;
  students: { name: string; response: string; value?: number | null }[];
}

interface EventSurveyDashboardProps {
  classId: string | null;
}

const NPS_COLORS = { promoters: '#10b981', passives: '#f59e0b', detractors: '#ef4444' };

// Classification labels based on score (0-10)
// 0-6 = Detrator, 7-8 = Neutro, 9-10 = Promotor
const SATISFACTION_CLASS_CONFIG = {
  promotor: { 
    label: 'Promotor', 
    shortLabel: 'Promotor', 
    color: '#10b981', 
    bg: 'bg-emerald-100', 
    text: 'text-emerald-700', 
    border: 'border-emerald-200',
    bgHex: '#dcfce7',
    textHex: '#166534',
    borderHex: '#86efac',
  },
  neutro: { 
    label: 'Neutro', 
    shortLabel: 'Neutro', 
    color: '#f59e0b', 
    bg: 'bg-yellow-100', 
    text: 'text-yellow-700', 
    border: 'border-yellow-200',
    bgHex: '#fef3c7',
    textHex: '#92400e',
    borderHex: '#fcd34d',
  },
  detrator: { 
    label: 'Detrator', 
    shortLabel: 'Detrator', 
    color: '#ef4444', 
    bg: 'bg-red-100', 
    text: 'text-red-700', 
    border: 'border-red-200',
    bgHex: '#fee2e2',
    textHex: '#991b1b',
    borderHex: '#fca5a5',
  },
};

// Get classification config for a student based on their calculated satisfactionClass
const getSatisfactionClassConfig = (satisfactionClass: 'promotor' | 'neutro' | 'detrator') => {
  return SATISFACTION_CLASS_CONFIG[satisfactionClass];
};

const ALL_SATISFACTION_LEVELS = [
  { key: 'promotor', label: 'Promotor (9-10)', color: '#10b981' },
  { key: 'neutro', label: 'Neutro (7-8)', color: '#f59e0b' },
  { key: 'detrator', label: 'Detrator (0-6)', color: '#ef4444' },
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

// ============== PDF EXPORT HELPERS ==============
type SurveyAnalyticsData = ReturnType<typeof useSurveyAnalytics>['data'];

async function createPDFFromHTML(htmlContent: string, filename: string) {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width in pixels at 96dpi
  container.style.background = '#ffffff';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  container.style.lineHeight = '1.5';
  container.style.color = '#1f2937';
  document.body.appendChild(container);
  container.innerHTML = htmlContent;
  
  // Wait for fonts and styles to load
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    const canvas = await html2canvas(container, {
      scale: 2.5, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      imageTimeout: 0,
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
    
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(156, 163, 175);
      pdf.text(`Página ${i} de ${pageCount}`, pdfWidth / 2, pdfHeight - 5, { align: 'center' });
    }
    
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

// OVERVIEW PDF
async function exportOverviewPDF(analytics: NonNullable<SurveyAnalyticsData>) {
  const satisfactionData = [
    { label: 'Muito satisfeito', value: 0, color: '#10b981' },
    { label: 'Satisfeito', value: 0, color: '#22c55e' },
    { label: 'Neutro', value: 0, color: '#f59e0b' },
    { label: 'Insatisfeito', value: 0, color: '#f97316' },
    { label: 'Muito insatisfeito', value: 0, color: '#ef4444' },
  ];
  
  analytics.responsesByStudent.forEach(r => {
    if (r.satisfaction) {
      const item = satisfactionData.find(s => s.label.toLowerCase() === r.satisfaction?.toLowerCase());
      if (item) item.value++;
    }
  });

  const html = `
    <div style="padding: 0;">
      <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); height: 80px; display: flex; align-items: center; justify-content: center;">
        <h1 style="color: white; font-size: 24px; margin: 0;">📊 Visão Geral - Pesquisa de Satisfação</h1>
      </div>
      
      <div style="padding: 30px 40px;">
        <p style="text-align: center; color: #6b7280; font-size: 12px; margin-bottom: 30px;">
          Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
        </p>
        
        <div style="display: flex; gap: 16px; margin-bottom: 30px;">
          <div style="flex: 1; background: #eff6ff; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #1d4ed8;">${analytics.totalResponses}</div>
            <div style="font-size: 12px; color: #6b7280;">Respostas</div>
          </div>
          <div style="flex: 1; background: #ecfdf5; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #059669;">${analytics.completionRate}%</div>
            <div style="font-size: 12px; color: #6b7280;">Conclusão</div>
          </div>
          <div style="flex: 1; background: ${analytics.overallSatisfactionPercent >= 80 ? '#ecfdf5' : analytics.overallSatisfactionPercent >= 60 ? '#fef9c3' : '#fee2e2'}; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: ${analytics.overallSatisfactionPercent >= 80 ? '#059669' : analytics.overallSatisfactionPercent >= 60 ? '#ca8a04' : '#dc2626'};">${analytics.overallSatisfactionPercent.toFixed(0)}%</div>
            <div style="font-size: 12px; color: #6b7280;">Satisfação</div>
          </div>
          <div style="flex: 1; background: #f3e8ff; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #7c3aed;">${analytics.overallSatisfaction.toFixed(1)}/5</div>
            <div style="font-size: 12px; color: #6b7280;">Média</div>
          </div>
        </div>
        
        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">Distribuição de Satisfação</h3>
          ${satisfactionData.map(s => `
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <span style="width: 140px; font-size: 12px; color: #6b7280;">${s.label}</span>
              <div style="flex: 1; height: 24px; background: #e5e7eb; border-radius: 4px; margin-right: 12px; overflow: hidden;">
                <div style="width: ${analytics.totalResponses > 0 ? (s.value / analytics.totalResponses) * 100 : 0}%; height: 100%; background: ${s.color}; border-radius: 4px;"></div>
              </div>
              <span style="font-size: 14px; font-weight: 600; color: #1f2937; width: 30px; text-align: right;">${s.value}</span>
            </div>
          `).join('')}
        </div>
        
        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">Métricas de Satisfação</h3>
          <div style="display: flex; gap: 16px;">
            <div style="flex: 1; text-align: center; padding: 16px; background: #ecfdf5; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #10b981;">${analytics.overallSatisfaction.toFixed(2)}</div>
              <div style="font-size: 11px; color: #6b7280;">Média (1-5)</div>
            </div>
            <div style="flex: 1; text-align: center; padding: 16px; background: #dbeafe; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${analytics.overallSatisfactionPercent.toFixed(0)}%</div>
              <div style="font-size: 11px; color: #6b7280;">Percentual</div>
            </div>
            <div style="flex: 1; text-align: center; padding: 16px; background: #f3e8ff; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #7c3aed;">${analytics.totalResponses}</div>
              <div style="font-size: 11px; color: #6b7280;">Respostas</div>
            </div>
          </div>
        </div>
        
        <div style="display: flex; gap: 20px;">
          <div style="flex: 1; background: #ecfdf5; border-radius: 12px; padding: 20px;">
            <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0; color: #059669;">💚 O Que Mais Gostaram</h3>
            ${analytics.openFeedback.likedMost.slice(0, 5).map(f => `
              <div style="background: white; padding: 10px; border-radius: 8px; margin-bottom: 8px; font-size: 12px;">
                <p style="margin: 0 0 4px 0; color: #1f2937;">"${f.text}"</p>
                <p style="margin: 0; font-size: 11px; color: #059669; font-weight: 500;">— ${f.author}</p>
              </div>
            `).join('') || '<p style="font-size: 12px; color: #6b7280;">Nenhum feedback</p>'}
          </div>
          <div style="flex: 1; background: #fef9c3; border-radius: 12px; padding: 20px;">
            <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 12px 0; color: #ca8a04;">💡 Sugestões de Melhoria</h3>
            ${analytics.openFeedback.suggestions.slice(0, 5).map(f => `
              <div style="background: white; padding: 10px; border-radius: 8px; margin-bottom: 8px; font-size: 12px;">
                <p style="margin: 0 0 4px 0; color: #1f2937;">"${f.text}"</p>
                <p style="margin: 0; font-size: 11px; color: #ca8a04; font-weight: 500;">— ${f.author}</p>
              </div>
            `).join('') || '<p style="font-size: 12px; color: #6b7280;">Nenhuma sugestão</p>'}
          </div>
        </div>
      </div>
    </div>
  `;
  
  await createPDFFromHTML(html, `visao-geral-${new Date().toISOString().split('T')[0]}.pdf`);
}

// RANKING PDF
async function exportRankingPDF(analytics: NonNullable<SurveyAnalyticsData>) {
  const sortedRankings = [...analytics.questionRankings].sort((a, b) => b.avgRating - a.avgRating);
  
  // Gradient color function for PDF (0-5 scale)
  const getRatingColorFn = (value: number): string => {
    // Convert 0-5 scale to 0-100 percentage
    const percent = Math.max(0, Math.min(100, (value / 5) * 100));
    // HSL: 0° = Red, 60° = Yellow, 120° = Green
    const hue = (percent / 100) * 120;
    return `hsl(${hue}, 70%, 45%)`;
  };
  
  // Background color gradient
  const getRatingBgFn = (value: number): string => {
    const percent = Math.max(0, Math.min(100, (value / 5) * 100));
    const hue = (percent / 100) * 120;
    return `hsl(${hue}, 70%, 92%)`;
  };

  const html = `
    <div style="padding: 0;">
      <div style="background: linear-gradient(135deg, #f59e0b, #ea580c); height: 80px; display: flex; align-items: center; justify-content: center;">
        <h1 style="color: white; font-size: 24px; margin: 0;">🏆 Ranking de Perguntas</h1>
      </div>
      
      <div style="padding: 30px 40px;">
        <p style="text-align: center; color: #6b7280; font-size: 12px; margin-bottom: 30px;">
          Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
        </p>
        
        ${sortedRankings.map((q, idx) => `
          <div style="display: flex; align-items: center; padding: 12px 16px; background: ${idx % 2 === 0 ? '#f9fafb' : 'white'}; border-radius: 8px; margin-bottom: 4px;">
            <span style="width: 40px; font-size: 18px; font-weight: bold; color: ${idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#cd7f32' : '#6b7280'};">
              #${idx + 1}
            </span>
            <div style="flex: 1;">
              <p style="margin: 0; font-size: 13px; font-weight: 500; color: #1f2937;">${q.questionLabel}</p>
              <span style="font-size: 11px; color: #6b7280; background: #e5e7eb; padding: 2px 8px; border-radius: 10px;">${q.category}</span>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 11px; color: #6b7280;">${q.responseCount} respostas</span>
              <div style="font-size: 20px; font-weight: bold; color: ${getRatingColorFn(q.avgRating)};">${q.avgRating.toFixed(1)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  await createPDFFromHTML(html, `ranking-perguntas-${new Date().toISOString().split('T')[0]}.pdf`);
}

// QUESTIONS PDF
async function exportQuestionsPDF(analytics: NonNullable<SurveyAnalyticsData>) {
  // Gradient color function for PDF (0-5 scale)
  const getRatingColorFn = (value: number): string => {
    const percent = Math.max(0, Math.min(100, (value / 5) * 100));
    const hue = (percent / 100) * 120;
    return `hsl(${hue}, 70%, 45%)`;
  };
  
  // Background color gradient
  const getRatingBgFn = (value: number): string => {
    const percent = Math.max(0, Math.min(100, (value / 5) * 100));
    const hue = (percent / 100) * 120;
    return `hsl(${hue}, 70%, 92%)`;
  };
  
  const categories = [...new Set(analytics.allQuestions.map(q => q.category))];

  const html = `
    <div style="padding: 0;">
      <div style="background: linear-gradient(135deg, #8b5cf6, #6366f1); height: 80px; display: flex; align-items: center; justify-content: center;">
        <h1 style="color: white; font-size: 24px; margin: 0;">📝 Análise por Perguntas</h1>
      </div>
      
      <div style="padding: 30px 40px;">
        <p style="text-align: center; color: #6b7280; font-size: 12px; margin-bottom: 30px;">
          Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
          <br/>${analytics.allQuestions.length} perguntas analisadas
        </p>
        
        ${categories.map(category => {
          const questionsInCategory = analytics.allQuestions.filter(q => q.category === category);
          return `
            <div style="margin-bottom: 30px;">
              <h2 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">
                ${category}
              </h2>
              ${questionsInCategory.map((q, idx) => {
                const respondents = analytics.responsesByStudent
                  .map(student => {
                    const response = student.responses.find(r => r.questionKey === q.questionKey);
                    return response ? { name: student.userName, value: response.value || '' } : null;
                  })
                  .filter((r): r is { name: string; value: string } => r !== null && r.value !== '');
                
                return `
                  <div style="background: ${idx % 2 === 0 ? '#f9fafb' : 'white'}; padding: 16px; border-radius: 8px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                      <p style="margin: 0; font-size: 13px; font-weight: 500; color: #1f2937; flex: 1;">${q.questionLabel}</p>
                      <div style="background: ${getRatingBgFn(q.avgRating)}; padding: 6px 12px; border-radius: 8px; margin-left: 12px;">
                        <span style="font-size: 18px; font-weight: bold; color: ${getRatingColorFn(q.avgRating)};">${q.avgRating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                      ${Object.entries(q.distribution).map(([key, value]) => `
                        <span style="background: #e5e7eb; padding: 4px 8px; border-radius: 12px; font-size: 11px; color: #374151;">
                          ${key}: <strong>${value}</strong>
                        </span>
                      `).join('')}
                    </div>
                    ${respondents.length > 0 ? `
                      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e5e7eb;">
                        <p style="margin: 0 0 6px 0; font-size: 11px; color: #6b7280;">Quem respondeu:</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                          ${respondents.slice(0, 10).map(r => `
                            <span style="background: #f3e8ff; color: #7c3aed; padding: 2px 8px; border-radius: 10px; font-size: 10px;">
                              ${r.name}
                            </span>
                          `).join('')}
                          ${respondents.length > 10 ? `<span style="font-size: 10px; color: #6b7280;">+${respondents.length - 10} mais</span>` : ''}
                        </div>
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  
  await createPDFFromHTML(html, `perguntas-${new Date().toISOString().split('T')[0]}.pdf`);
}

// STUDENTS PDF - High fidelity site replica
const exportStudentResponsesPDF = async (students: StudentDetailedResponse[]) => {
  // Helper function to get semantic color for responses
  const getValueColor = (value: string): string => {
    const key = value.toLowerCase().trim();
    
    // Excellent - Green
    const excellentWords = ['excelente', 'muito satisfeito', 'totalmente', 'atendeu plenamente', 
      'mais do que suficiente', 'perfeito', 'ótimo', 'mais de 10', 'concordo totalmente', 'muito bom', 'superou'];
    if (excellentWords.some(w => key.includes(w))) return '#059669';
    
    // Good - Blue
    const goodWords = ['satisfeito', 'adequado', 'bom', 'concordo', 'atendeu', 'de 5 a 10', 'suficiente', 'sim'];
    if (goodWords.some(w => key.includes(w))) return '#2563eb';
    
    // Medium - Yellow/Amber
    const mediumWords = ['neutro', 'parcialmente', 'regular', 'médio', 'até 5', 'razoável', 'moderado'];
    if (mediumWords.some(w => key.includes(w))) return '#d97706';
    
    // Bad - Red
    const badWords = ['insuficiente', 'insatisfeito', 'ruim', 'péssimo', 'não', 'discordo', 'fraco', 'baixo', 'nunca'];
    if (badWords.some(w => key.includes(w))) return '#dc2626';
    
    return '#475569';
  };

  // Get badge colors for PDF based on satisfaction class
  const getSatisfactionBadgeStyleForClass = (satisfactionClass: 'promotor' | 'neutro' | 'detrator') => {
    const config = SATISFACTION_CLASS_CONFIG[satisfactionClass];
    return { bg: config.bgHex, color: config.textHex, border: config.borderHex, label: config.label };
  };

  // Stats
  const totalStudents = students.length;
  const completedStudents = students.filter(s => s.isCompleted).length;
  const hotLeads = students.filter(s => s.isHotLead).length;

  // Build high-fidelity HTML matching the site exactly
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #ffffff; color: #0f172a;">
      <!-- Header with gradient -->
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 32px 40px;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
          <span style="font-size: 32px;">👥</span>
          <h1 style="color: white; font-size: 26px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">
            Análise Individual por Aluno
          </h1>
        </div>
        <p style="text-align: center; color: rgba(255,255,255,0.8); font-size: 13px; margin: 10px 0 0 0;">
          Pesquisa de Satisfação • Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
        </p>
      </div>
      
      <div style="padding: 28px 36px;">
        <!-- Stats Cards - exactly like site -->
        <div style="display: flex; gap: 16px; margin-bottom: 32px;">
          <div style="flex: 1; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 16px; padding: 20px; text-align: center; border: 1px solid #bfdbfe;">
            <div style="font-size: 36px; font-weight: 800; color: #1d4ed8; line-height: 1;">${totalStudents}</div>
            <div style="font-size: 12px; color: #3b82f6; font-weight: 600; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Total Alunos</div>
          </div>
          <div style="flex: 1; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 16px; padding: 20px; text-align: center; border: 1px solid #a7f3d0;">
            <div style="font-size: 36px; font-weight: 800; color: #059669; line-height: 1;">${completedStudents}</div>
            <div style="font-size: 12px; color: #10b981; font-weight: 600; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Completos</div>
          </div>
        </div>
        
        <!-- Student Cards - matching site design -->
        ${students.map((student, studentIdx) => {
          const groupedResponses = student.responses.reduce((acc, r) => {
            if (!acc[r.category]) acc[r.category] = [];
            acc[r.category].push(r);
            return acc;
          }, {} as Record<string, typeof student.responses>);
          
          const satisfactionStyle = getSatisfactionBadgeStyleForClass(student.satisfactionClass);

          return `
            <div style="margin-bottom: 24px; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
              <!-- Student header - exactly like Card component -->
              <div style="background: #f8fafc; padding: 18px 24px; border-bottom: 1px solid #e5e7eb;">
                <div style="display: flex; align-items: center;">
                  <!-- Avatar -->
                  <div style="width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #2563eb); display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: 700; margin-right: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${student.userName.charAt(0).toUpperCase()}
                  </div>
                  
                  <!-- Name and status -->
                  <div style="flex: 1;">
                    <div style="font-size: 18px; font-weight: 700; color: #0f172a;">
                      ${student.userName}
                    </div>
                    <div style="font-size: 13px; color: ${student.isCompleted ? '#059669' : '#d97706'}; margin-top: 3px; display: flex; align-items: center; gap: 4px;">
                      ${student.isCompleted 
                        ? '<span style="color: #059669;">✓</span> Completou a pesquisa' 
                        : `<span style="color: #d97706;">⏳</span> Em andamento (${student.progressPercent}%)`}
                    </div>
                  </div>
                  
                  <!-- Satisfaction badge -->
                  <div style="background: ${satisfactionStyle.bg}; color: ${satisfactionStyle.color}; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; border: 1px solid ${satisfactionStyle.border};">
                    ${satisfactionStyle.label} (${student.overallScore.toFixed(1)})
                  </div>
                </div>
              </div>
              
              <!-- Responses section -->
              <div style="padding: 20px 24px; background: #ffffff;">
                ${Object.entries(groupedResponses).map(([category, responses]) => `
                  <div style="margin-bottom: 20px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; gap: 6px;">
                      <span style="width: 4px; height: 4px; background: #94a3b8; border-radius: 50%;"></span>
                      ${category}
                    </div>
                    <div style="border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
                      ${(responses as typeof student.responses).map((r, idx) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'}; ${idx > 0 ? 'border-top: 1px solid #f1f5f9;' : ''}">
                          <span style="font-size: 13px; color: #475569; flex: 1; padding-right: 12px;">${r.questionLabel}</span>
                          <span style="font-size: 13px; font-weight: 600; color: ${r.value ? getValueColor(r.value) : '#94a3b8'}; white-space: nowrap; text-align: right; max-width: 200px;">
                            ${r.value || '—'}
                          </span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <!-- Footer -->
      <div style="background: #f8fafc; padding: 16px 36px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">
          Relatório gerado automaticamente pelo Sistema de Pesquisa de Satisfação
        </p>
      </div>
    </div>
  `;
  
  await createPDFFromHTML(html, `alunos-pesquisa-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Universal gradient color function
 * Creates smooth red→yellow→green gradient based on percentage (0-100%)
 * HSL: Red (0°) → Yellow (60°) → Green (120°)
 */
const getGradientHSL = (value: number, min: number = 0, max: number = 10): { h: number; s: number; l: number } => {
  // Normalize to percentage 0-100
  const percent = max === min ? 50 : Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  
  // HSL: 0° = Red, 60° = Yellow, 120° = Green
  // Map 0% → 0° (red), 50% → 60° (yellow), 100% → 120° (green)
  const hue = (percent / 100) * 120;
  const saturation = 70; // Consistent saturation
  const lightness = 45; // Consistent lightness for text readability
  
  return { h: hue, s: saturation, l: lightness };
};

/**
 * Returns inline CSS color string for gradient coloring
 */
const getGradientColorStyle = (value: number, min: number = 0, max: number = 10): string => {
  const { h, s, l } = getGradientHSL(value, min, max);
  return `hsl(${h}, ${s}%, ${l}%)`;
};

/**
 * Returns inline CSS background color string (lighter version)
 */
const getGradientBgStyle = (value: number, min: number = 0, max: number = 10): string => {
  const { h, s } = getGradientHSL(value, min, max);
  return `hsl(${h}, ${s}%, 92%)`; // Very light for backgrounds
};

/**
 * Returns both background and text colors for styled elements
 */
const getGradientStyles = (value: number, min: number = 0, max: number = 10): { bg: string; text: string; border: string } => {
  const { h, s } = getGradientHSL(value, min, max);
  return {
    bg: `hsl(${h}, ${s}%, 92%)`,
    text: `hsl(${h}, ${s}%, 35%)`,
    border: `hsl(${h}, ${s}%, 80%)`,
  };
};

// Legacy functions that use the new gradient system
const getRatingColor = (value: number): string => {
  // For 0-5 scale, convert to gradient
  const percent = (value / 5) * 100;
  if (percent >= 90) return 'text-emerald-600';
  if (percent >= 70) return 'text-lime-600';
  if (percent >= 50) return 'text-yellow-600';
  if (percent >= 30) return 'text-orange-600';
  return 'text-red-600';
};

const getRatingBgColor = (value: number): string => {
  const percent = (value / 5) * 100;
  if (percent >= 90) return 'bg-emerald-100 border-emerald-200';
  if (percent >= 70) return 'bg-lime-100 border-lime-200';
  if (percent >= 50) return 'bg-yellow-100 border-yellow-200';
  if (percent >= 30) return 'bg-orange-100 border-orange-200';
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

// ============== ENHANCED QUESTION DETAIL COMPONENT ==============
// Semantic color function for response values
// Bad = Red, Medium = Yellow/Orange, Good = Blue, Excellent = Green
const getSemanticColor = (responseKey: string): string => {
  const key = responseKey.toLowerCase().trim();
  
  // EXCELLENT / VERY GOOD - GREEN
  const excellentWords = [
    'excelente', 'muito satisfeito', 'totalmente', 'atendeu plenamente', 
    'mais do que suficiente', 'perfeito', 'ótimo', 'mais de 10', 
    'concordo totalmente', 'alta urgência', 'muito bom', 'superou'
  ];
  if (excellentWords.some(w => key.includes(w))) return '#10b981'; // emerald-500
  
  // GOOD - BLUE
  const goodWords = [
    'satisfeito', 'adequado', 'bom', 'concordo', 'atendeu', 
    'de 5 a 10', 'suficiente', 'média urgência', 'sim'
  ];
  if (goodWords.some(w => key.includes(w))) return '#3b82f6'; // blue-500
  
  // MEDIUM / NEUTRAL - YELLOW/ORANGE
  const mediumWords = [
    'neutro', 'parcialmente', 'regular', 'médio', 'até 5', 
    'razoável', 'moderado', 'indiferente'
  ];
  if (mediumWords.some(w => key.includes(w))) return '#f59e0b'; // amber-500
  
  // BAD / POOR - RED
  const badWords = [
    'insuficiente', 'insatisfeito', 'muito insatisfeito', 'ruim', 'péssimo', 
    'não', 'discordo', 'fraco', 'baixo', 'nunca', 'sem urgência',
    'não atendeu', 'não concordo'
  ];
  if (badWords.some(w => key.includes(w))) return '#ef4444'; // red-500
  
  // Default fallback - neutral gray/slate
  return '#64748b'; // slate-500
};

function QuestionDetailView({ 
  question, 
  respondents 
}: { 
  question: QuestionRating;
  respondents?: { name: string; value: string }[];
}) {
  // Build distribution data with semantic colors
  const distributionData = Object.entries(question.distribution).map(([key, value]) => ({
    name: key,
    value,
    fill: getSemanticColor(key),
  }));

  // Total responses including zeros
  const totalResponses = distributionData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-4">
      {/* Main chart card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Badge 
                variant="secondary" 
                className="bg-primary/10 text-primary border-primary/20 font-medium"
              >
                {question.category}
              </Badge>
              <CardTitle className="text-lg leading-tight">{question.questionLabel}</CardTitle>
            </div>
            <div className="text-right">
              <div 
                className="text-4xl font-bold"
                style={{ color: getGradientColorStyle(question.avgRating, 0, 5) }}
              >
                {question.avgRating.toFixed(1)}
              </div>
              <span className="text-xs text-muted-foreground">média</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {totalResponses} respostas
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={Math.max(180, distributionData.length * 40)}>
            <BarChart 
              data={distributionData} 
              layout="vertical" 
              margin={{ left: 10, right: 40, top: 5, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={140} 
                tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                formatter={(value: number) => [`${value} respostas`, 'Total']}
              />
              <Bar 
                dataKey="value" 
                radius={[0, 8, 8, 0]}
                maxBarSize={35}
              >
                {distributionData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill}
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                  />
                ))}
                <LabelList 
                  dataKey="value" 
                  position="right" 
                  className="text-sm font-semibold fill-foreground"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend with percentages */}
          <div className="mt-4 flex flex-wrap gap-2">
            {distributionData.map((item, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-xs"
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">
                  ({totalResponses > 0 ? Math.round((item.value / totalResponses) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Respondents list */}
      {respondents && respondents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Quem respondeu ({respondents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Full list without scroll */}
            <div className="space-y-1">
              {respondents.map((r, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded-md ${
                    idx % 2 === 0 ? 'bg-muted/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {r.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm">{r.name}</span>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={`text-xs ${(() => {
                      const val = r.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                      // ÓTIMO - Verde (excelente, totalmente, muito satisfeito, mais do que suficiente, superou)
                      if (val.includes('excelente') || val.includes('totalmente') || val.includes('muito satisfeito') || val.includes('mais do que suficiente') || val.includes('superou') || val.includes('otimo') || val.includes('perfeito'))
                        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
                      // RUIM - Vermelho (insuficiente, ruim, péssimo, não atendeu, muito insatisfeito)
                      if (val.includes('ruim') || val.includes('insuficiente') || val.includes('nao atendeu') || val.includes('pessimo') || val.includes('muito insatisfeito') || val.includes('discordo'))
                        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                      // MÉDIO - Amarelo/Laranja (neutro, parcialmente, regular)
                      if (val.includes('neutro') || val.includes('parcialmente') || val.includes('regular') || val.includes('medio'))
                        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
                      // BOM - Azul (adequado, bom, satisfeito, suficiente, concordo)
                      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
                    })()}`}
                  >
                    {r.value || '—'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============== STUDENT DETAIL COMPONENT ==============
function StudentDetailView({ student }: { student: StudentDetailedResponse }) {
  const groupedResponses = student.responses.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, typeof student.responses>);

  const classConfig = getSatisfactionClassConfig(student.satisfactionClass);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback>
              {student.userName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">
              {student.userName}
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
          <div className="flex items-center gap-2">
            <Badge 
              style={{ 
                backgroundColor: getGradientBgStyle(student.overallScore, 0, 10),
                color: getGradientColorStyle(student.overallScore, 0, 10)
              }}
            >
              {classConfig.label}
            </Badge>
            <span 
              className="text-sm font-semibold"
              style={{ color: getGradientColorStyle(student.overallScore, 0, 10) }}
            >
              {student.overallScore.toFixed(1)}
            </span>
          </div>
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
                    <span 
                      className="font-medium"
                      style={r.numericValue ? { color: getGradientColorStyle(r.numericValue, 0, 10) } : undefined}
                    >
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportingTab, setExportingTab] = useState<string | null>(null);
  
  // AI Insights state
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [aiInsightsGeneratedAt, setAiInsightsGeneratedAt] = useState<Date | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  
  // Drill-down dialog state
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownData, setDrilldownData] = useState<DrilldownData | null>(null);
  
  // Matrix sorting state
  const [matrixSortColumn, setMatrixSortColumn] = useState<string | null>(null); // 'avg' or student.userId or 'question'
  const [matrixSortDir, setMatrixSortDir] = useState<'asc' | 'desc'>('desc');

  // Helper to get students who answered a specific satisfaction level
  const getSatisfactionDrilldown = useMemo(() => {
    if (!analytics) return () => [];
    return (satisfactionLevel: string) => {
      return analytics.responsesByStudent
        .filter(s => s.satisfaction?.toLowerCase() === satisfactionLevel.toLowerCase())
        .map(s => ({
          name: s.userName,
          response: s.satisfaction || '',
          value: null
        }));
    };
  }, [analytics]);

  // Helper to get students by NPS category
  const getNPSDrilldown = useMemo(() => {
    if (!analytics) return () => [];
    return (category: 'Promotores' | 'Neutros' | 'Detratores') => {
      return analytics.responsesByStudent.filter(s => {
        if (!s.satisfaction) return false;
        const rating = s.responses.find(r => r.questionKey === 'q1_satisfaction_level')?.numericValue;
        if (rating === null || rating === undefined) return false;
        
        if (category === 'Promotores') return rating >= 4;
        if (category === 'Neutros') return rating === 3;
        if (category === 'Detratores') return rating < 3;
        return false;
      }).map(s => ({
        name: s.userName,
        response: s.satisfaction || '',
        value: s.responses.find(r => r.questionKey === 'q1_satisfaction_level')?.numericValue
      }));
    };
  }, [analytics]);

  // Helper to get students by infrastructure metric
  const getInfrastructureDrilldown = useMemo(() => {
    if (!analytics) return () => [];
    
    const metricKeyMap: Record<string, string> = {
      'Organização': 'q13_organization',
      'Conteúdo': 'q14_content_relevance',
      'Professores': 'q15_teacher_competence',
      'Material': 'q16_material_quality',
      'Pontualidade': 'q17_punctuality',
      'Infraestrutura': 'q18_infrastructure',
      'Equipe': 'q19_support_team',
      'Coffee Break': 'q20_coffee_break',
    };
    
    return (metricName: string) => {
      const questionKey = metricKeyMap[metricName];
      if (!questionKey) return [];
      
      return analytics.responsesByStudent.map(s => {
        const response = s.responses.find(r => r.questionKey === questionKey);
        return {
          name: s.userName,
          response: response?.value || 'Não respondeu',
          value: response?.numericValue
        };
      }).filter(s => s.response !== 'Não respondeu')
        .sort((a, b) => (b.value || 0) - (a.value || 0));
    };
  }, [analytics]);

  // Handle chart bar click
  const handleSatisfactionBarClick = (data: any) => {
    if (!data || !data.name) return;
    const students = getSatisfactionDrilldown(data.name);
    setDrilldownData({
      title: `Satisfação: ${data.name}`,
      category: 'satisfaction',
      students
    });
    setDrilldownOpen(true);
  };

  const handleNPSBarClick = (data: any) => {
    if (!data || !data.name) return;
    const students = getNPSDrilldown(data.name as 'Promotores' | 'Neutros' | 'Detratores');
    setDrilldownData({
      title: `NPS: ${data.name}`,
      category: 'nps',
      students
    });
    setDrilldownOpen(true);
  };

  const handleInfrastructureBarClick = (data: any) => {
    if (!data || !data.name) return;
    const students = getInfrastructureDrilldown(data.name);
    setDrilldownData({
      title: `${data.name} (média: ${data.value?.toFixed(1) || 'N/A'})`,
      category: 'infrastructure',
      students
    });
    setDrilldownOpen(true);
  };

  const handleExportPDF = async (tab: 'overview' | 'ranking' | 'questions' | 'students') => {
    if (!analytics) return;
    setExportingTab(tab);
    try {
      switch (tab) {
        case 'overview':
          await exportOverviewPDF(analytics);
          break;
        case 'ranking':
          await exportRankingPDF(analytics);
          break;
        case 'questions':
          await exportQuestionsPDF(analytics);
          break;
        case 'students':
          await exportStudentResponsesPDF(analytics.responsesByStudent);
          break;
      }
    } finally {
      setExportingTab(null);
    }
  };

  const generateAIInsights = async () => {
    if (!analytics) return;
    
    setIsLoadingInsights(true);
    try {
    const surveyData = {
        totalResponses: analytics.totalResponses,
        completionRate: analytics.completionRate,
        overallSatisfaction: analytics.overallSatisfaction,
        satisfactionPercent: analytics.overallSatisfactionPercent,
        instructorMetrics: {
          hygor: {
            avgExpectations: analytics.instructors.hygor.avgExpectations,
            avgClarity: analytics.instructors.hygor.avgClarity,
            avgTime: analytics.instructors.hygor.avgTime,
            strengths: analytics.instructors.hygor.strengths,
            improvements: analytics.instructors.hygor.improvements,
          },
          patrick: {
            avgExpectations: analytics.instructors.patrick.avgExpectations,
            avgClarity: analytics.instructors.patrick.avgClarity,
            avgTime: analytics.instructors.patrick.avgTime,
            strengths: analytics.instructors.patrick.strengths,
            improvements: analytics.instructors.patrick.improvements,
          },
        },
        infrastructure: analytics.infrastructure,
        openFeedback: {
          likedMost: analytics.openFeedback.likedMost.map(f => f.text),
          suggestions: analytics.openFeedback.suggestions.map(f => f.text),
        },
        studentProfile: analytics.studentProfile,
      };

      const { data, error } = await supabase.functions.invoke('analyze-survey-insights', {
        body: { surveyData, className: 'Formação 360°' }
      });

      if (error) throw error;
      
      setAiInsights(data.insights);
      setAiInsightsGeneratedAt(new Date());
      toast.success("Insights gerados com sucesso!");
    } catch (err) {
      console.error("Error generating insights:", err);
      toast.error("Erro ao gerar insights. Tente novamente.");
    } finally {
      setIsLoadingInsights(false);
    }
  };

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

  // Build chart data - use new classification based on overallScore
  const classificationDistribution: Record<string, number> = { promotor: 0, neutro: 0, detrator: 0 };
  analytics.responsesByStudent.forEach(r => {
    classificationDistribution[r.satisfactionClass] = (classificationDistribution[r.satisfactionClass] || 0) + 1;
  });

  const satisfactionData = [
    { name: 'Promotor (9-10)', value: classificationDistribution.promotor, fill: '#10b981' },
    { name: 'Neutro (7-8)', value: classificationDistribution.neutro, fill: '#f59e0b' },
    { name: 'Detrator (0-6)', value: classificationDistribution.detrator, fill: '#ef4444' },
  ].filter(s => s.value > 0);
  
  const urgencyData = buildDistributionData(analytics.studentProfile.urgencyLevel, ALL_URGENCY_LEVELS);
  const weeklyTimeData = buildDistributionData(analytics.studentProfile.weeklyTime, ALL_WEEKLY_TIME);

  // Satisfação média global (0-10)
  const overallAvgScore = analytics.responsesByStudent.length > 0
    ? analytics.responsesByStudent.reduce((sum, s) => sum + s.overallScore, 0) / analytics.responsesByStudent.length
    : 0;

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

  // Calculate overall infrastructure average
  const infrastructureAvg = infrastructureData.length > 0
    ? infrastructureData.reduce((sum, d) => sum + (d.value || 0), 0) / infrastructureData.length
    : 0;

  // Radar chart format for infrastructure
  const infrastructureRadarData = infrastructureData.map(d => ({
    metric: d.name,
    value: d.value || 0,
  }));

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

  // Build monitor radar data from all available monitors
  const monitorRadarData = [
    {
      metric: 'Técnica',
      'Dr. Eder': analytics.monitors.eder?.avgTechnical || 0,
      'Dr. Patrick M': analytics.monitors.patrickM?.avgTechnical || 0,
    },
    {
      metric: 'Interesse',
      'Dr. Eder': analytics.monitors.eder?.avgInterest || 0,
      'Dr. Patrick M': analytics.monitors.patrickM?.avgInterest || 0,
    },
    {
      metric: 'Engajamento',
      'Dr. Eder': analytics.monitors.eder?.avgEngagement || 0,
      'Dr. Patrick M': analytics.monitors.patrickM?.avgEngagement || 0,
    },
    {
      metric: 'Postura',
      'Dr. Eder': analytics.monitors.eder?.avgPosture || 0,
      'Dr. Patrick M': analytics.monitors.patrickM?.avgPosture || 0,
    },
    {
      metric: 'Comunicação',
      'Dr. Eder': analytics.monitors.eder?.avgCommunication || 0,
      'Dr. Patrick M': analytics.monitors.patrickM?.avgCommunication || 0,
    },
    {
      metric: 'Contribuição',
      'Dr. Eder': analytics.monitors.eder?.avgContribution || 0,
      'Dr. Patrick M': analytics.monitors.patrickM?.avgContribution || 0,
    },
  ];

  const wordFrequency = getWordFrequency([
    ...analytics.openFeedback.likedMost.map(f => f.text), 
    ...analytics.openFeedback.suggestions.map(f => f.text)
  ]);

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

  // Format time helper
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="grid grid-cols-7 w-full max-w-4xl">
        <TabsTrigger value="overview" className="flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Visão Geral</span>
        </TabsTrigger>
        <TabsTrigger value="matrix" className="flex items-center gap-1.5">
          <ArrowUpDown className="h-4 w-4" />
          <span className="hidden sm:inline">Matriz</span>
        </TabsTrigger>
        <TabsTrigger value="ranking" className="flex items-center gap-1.5">
          <ListOrdered className="h-4 w-4" />
          <span className="hidden sm:inline">Ranking</span>
        </TabsTrigger>
        <TabsTrigger value="questions" className="flex items-center gap-1.5">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Perguntas</span>
        </TabsTrigger>
        <TabsTrigger value="students" className="flex items-center gap-1.5">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Alunos</span>
        </TabsTrigger>
        <TabsTrigger value="timing" className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Tempos</span>
        </TabsTrigger>
        <TabsTrigger value="insights" className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Insights IA</span>
        </TabsTrigger>
      </TabsList>

      {/* ============== MATRIX HEATMAP TAB ============== */}
      <TabsContent value="matrix" className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5 text-primary" />
                  Mapa de Notas
                </CardTitle>
                <CardDescription>
                  Visualize todas as notas por aluno e pergunta em formato de matriz
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Legenda:</span>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(0, 70%, 50%)' }} />
                  <span className="text-[10px]">0%</span>
                </div>
                <div 
                  className="w-24 h-3 rounded" 
                  style={{ background: 'linear-gradient(to right, hsl(0, 70%, 50%), hsl(60, 70%, 50%), hsl(120, 70%, 50%))' }} 
                />
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(120, 70%, 50%)' }} />
                  <span className="text-[10px]">100%</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto scrollbar-visible" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--muted-foreground)) hsl(var(--muted))' }}>
              <div className="min-w-max">
                {/* Sorting helper function */}
                {(() => {
                  const handleSort = (columnId: string) => {
                    if (matrixSortColumn === columnId) {
                      setMatrixSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setMatrixSortColumn(columnId);
                      setMatrixSortDir('desc');
                    }
                  };
                  
                  const SortIndicator = ({ columnId }: { columnId: string }) => (
                    matrixSortColumn === columnId ? (
                      matrixSortDir === 'desc' ? 
                        <TrendingDown className="h-3 w-3" /> : 
                        <TrendingUp className="h-3 w-3" />
                    ) : <ArrowUpDown className="h-3 w-3 opacity-40" />
                  );
                  
                  // Calculate scores for sorting
                  const getQuestionScoreForStudent = (question: QuestionRating, studentUserId: string) => {
                    const student = analytics.responsesByStudent.find(s => s.userId === studentUserId);
                    if (!student) return null;
                    const response = student.responses.find(r => r.questionKey === question.questionKey);
                    return response?.numericValue ?? null;
                  };
                  
                  const getQuestionAvg = (question: QuestionRating) => {
                    const scores = analytics.responsesByStudent
                      .map(s => getQuestionScoreForStudent(question, s.userId))
                      .filter((v): v is number => v !== null);
                    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                  };
                  
                  // Sort questions
                  const sortedQuestions = [...analytics.allQuestions].sort((a, b) => {
                    if (!matrixSortColumn) return 0;
                    
                    let aVal: number | string;
                    let bVal: number | string;
                    
                    if (matrixSortColumn === 'avg') {
                      aVal = getQuestionAvg(a);
                      bVal = getQuestionAvg(b);
                    } else if (matrixSortColumn === 'question') {
                      aVal = a.questionLabel;
                      bVal = b.questionLabel;
                    } else {
                      aVal = getQuestionScoreForStudent(a, matrixSortColumn) ?? -1;
                      bVal = getQuestionScoreForStudent(b, matrixSortColumn) ?? -1;
                    }
                    
                    if (typeof aVal === 'string') {
                      return matrixSortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
                    }
                    return matrixSortDir === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal;
                  });
                  
                  return (
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0 z-10">
                    <tr>
                      <th 
                        className="text-left p-2 font-semibold border-b min-w-[200px] sticky left-0 bg-muted/80 z-20 cursor-pointer hover:bg-muted"
                        onClick={() => handleSort('question')}
                      >
                        <div className="flex items-center gap-1">
                          Pergunta
                          <SortIndicator columnId="question" />
                        </div>
                      </th>
                      {analytics.responsesByStudent.map((student) => (
                        <th 
                          key={student.userId} 
                          className="p-2 font-medium border-b text-center w-[130px] max-w-[130px] cursor-pointer hover:bg-muted/70 transition-colors"
                          title={`Clique para ordenar por ${student.userName}`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <div 
                              className="flex items-center gap-1 cursor-pointer"
                              onClick={() => handleSort(student.userId)}
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px]">
                                  {student.userName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <SortIndicator columnId={student.userId} />
                            </div>
                            <span className="text-xs text-center leading-tight break-words w-full max-w-[110px]">
                              {student.userName}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-5 px-1.5 text-[10px]"
                              onClick={(e) => { e.stopPropagation(); setSelectedStudent(student); }}
                            >
                              <Eye className="h-3 w-3 mr-0.5" />
                              Ver
                            </Button>
                          </div>
                        </th>
                      ))}
                      <th 
                        className="p-2 font-semibold border-b text-center min-w-[60px] bg-muted/50 cursor-pointer hover:bg-muted/70"
                        onClick={() => handleSort('avg')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Média
                          <SortIndicator columnId="avg" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Sorted questions */}
                    {sortedQuestions.map((question, qIdx) => {
                      const rowValues: (number | null)[] = [];
                      
                      return (
                        <tr key={question.questionKey} className={qIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                          <td className="p-2 border-b font-medium sticky left-0 bg-inherit z-10">
                            <div className="flex flex-col">
                              <span className="truncate max-w-[190px]" title={question.questionLabel}>
                                {question.questionLabel}
                              </span>
                              <Badge variant="outline" className="text-[9px] w-fit mt-0.5">
                                {question.category}
                              </Badge>
                            </div>
                          </td>
                          {analytics.responsesByStudent.map((student) => {
                            const response = student.responses.find(r => r.questionKey === question.questionKey);
                            const score = response?.numericValue;
                            rowValues.push(score);
                            
                            // Use gradient color based on 0-10 scale
                            const hasScore = score !== null && score !== undefined;
                            const bgStyle = hasScore ? getGradientColorStyle(score, 0, 10) : undefined;
                            
                            return (
                              <td 
                                key={student.userId} 
                                className="p-1 border-b text-center"
                              >
                                <div 
                                  className="w-full h-8 rounded flex items-center justify-center font-bold text-white transition-all hover:scale-110 hover:shadow-lg cursor-default"
                                  style={{ 
                                    backgroundColor: hasScore ? bgStyle : 'hsl(var(--muted))',
                                    color: hasScore ? 'white' : 'hsl(var(--muted-foreground))'
                                  }}
                                  title={`${student.userName}: ${response?.value || 'Sem resposta'}`}
                                >
                                  {hasScore ? score.toFixed(0) : '—'}
                                </div>
                              </td>
                            );
                          })}
                          {/* Row average */}
                          <td className="p-1 border-b text-center bg-muted/30">
                            {(() => {
                              const validScores = rowValues.filter((v): v is number => v !== null);
                              if (validScores.length === 0) return '—';
                              const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length;
                              return (
                                <span 
                                  className="font-bold"
                                  style={{ color: getGradientColorStyle(avg, 0, 10) }}
                                >
                                  {avg.toFixed(1)}
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Footer row with student averages */}
                    <tr className="bg-muted/50 font-semibold sticky bottom-0">
                      <td className="p-2 border-t sticky left-0 bg-muted/80 z-10">
                        <span className="font-bold">Média do Aluno</span>
                      </td>
                      {analytics.responsesByStudent.map((student) => {
                        const score = student.overallScore;
                        const config = getSatisfactionClassConfig(student.satisfactionClass);
                        
                        return (
                          <td key={student.userId} className="p-1 border-t text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span 
                                className="font-bold text-sm"
                                style={{ color: getGradientColorStyle(score, 0, 10) }}
                              >
                                {score.toFixed(1)}
                              </span>
                              <Badge 
                                className="text-[8px] px-1 py-0"
                                style={{ 
                                  backgroundColor: getGradientBgStyle(score, 0, 10),
                                  color: getGradientColorStyle(score, 0, 10)
                                }}
                              >
                                {config.shortLabel}
                              </Badge>
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-1 border-t text-center bg-muted/50">
                        <span 
                          className="font-bold"
                          style={{ color: getGradientColorStyle(overallAvgScore, 0, 10) }}
                        >
                          {overallAvgScore.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ============== AI INSIGHTS TAB ============== */}
      <TabsContent value="insights" className="space-y-6">
        {!aiInsights ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/20 flex items-center justify-center mb-6">
                <Brain className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Análise Inteligente com IA</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Gere insights acionáveis baseados em todas as respostas da pesquisa. 
                A IA analisará padrões, identificará pontos críticos e sugerirá ações concretas para melhorar o curso.
              </p>
              <Button 
                onClick={generateAIInsights}
                disabled={isLoadingInsights}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
              >
                {isLoadingInsights ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analisando dados...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Insights com IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Header with regenerate button and timestamp */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/20">
                  <Brain className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Insights Gerados por IA</h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Baseado em {analytics.totalResponses} respostas</span>
                    {aiInsightsGeneratedAt && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Gerado em {format(aiInsightsGeneratedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateAIInsights}
                disabled={isLoadingInsights}
                className="gap-2"
              >
                {isLoadingInsights ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Regenerando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Regenerar Análise
                  </>
                )}
              </Button>
            </div>

            {/* Score Geral */}
            {aiInsights.scoreGeral && (
              <Card className={`border-2 ${
                aiInsights.scoreGeral >= 80 ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10' :
                aiInsights.scoreGeral >= 60 ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-900/10' :
                aiInsights.scoreGeral >= 40 ? 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10' :
                'border-red-200 bg-red-50/50 dark:bg-red-900/10'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Score Geral da Turma</p>
                      <p className="text-4xl font-bold mt-1">{aiInsights.scoreGeral}/100</p>
                    </div>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      aiInsights.scoreGeral >= 80 ? 'bg-emerald-100 text-emerald-600' :
                      aiInsights.scoreGeral >= 60 ? 'bg-blue-100 text-blue-600' :
                      aiInsights.scoreGeral >= 40 ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {aiInsights.scoreGeral >= 80 ? <ThumbsUp className="h-8 w-8" /> :
                       aiInsights.scoreGeral >= 60 ? <TrendingUp className="h-8 w-8" /> :
                       <AlertTriangle className="h-8 w-8" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resumo Executivo */}
            {aiInsights.resumoExecutivo && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Resumo Executivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{aiInsights.resumoExecutivo}</p>
                </CardContent>
              </Card>
            )}

            {/* Pontos Críticos */}
            {aiInsights.pontosCriticos && aiInsights.pontosCriticos.length > 0 && (
              <Card className="border-red-200/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    Pontos Críticos ({aiInsights.pontosCriticos.length})
                  </CardTitle>
                  <CardDescription>Áreas que precisam de atenção imediata</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiInsights.pontosCriticos.map((ponto: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-100">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-200">
                                {ponto.area}
                              </Badge>
                              {ponto.urgencia === 'alta' && (
                                <Badge className="text-xs bg-red-600">Urgente</Badge>
                              )}
                            </div>
                            <p className="text-sm">{ponto.problema}</p>
                          </div>
                          <Badge variant="outline" className={`shrink-0 ${
                            ponto.impacto === 'alto' ? 'bg-red-100 text-red-700' :
                            ponto.impacto === 'medio' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            Impacto {ponto.impacto}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ações Sugeridas */}
            {aiInsights.acoesSugeridas && aiInsights.acoesSugeridas.length > 0 && (
              <Card className="border-emerald-200/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-emerald-700">
                    <Target className="h-4 w-4" />
                    Ações Sugeridas ({aiInsights.acoesSugeridas.length})
                  </CardTitle>
                  <CardDescription>Passos concretos para melhorar a experiência</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiInsights.acoesSugeridas.slice(0, 8).map((acao: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm shrink-0">
                            {acao.prioridade || idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{acao.acao}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {acao.responsavel && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" /> {acao.responsavel}
                                </span>
                              )}
                              {acao.prazo && (
                                <Badge variant="outline" className={`text-[10px] ${
                                  acao.prazo === 'imediato' ? 'bg-red-50 text-red-600' :
                                  acao.prazo === 'proximo_dia' ? 'bg-yellow-50 text-yellow-600' :
                                  'bg-blue-50 text-blue-600'
                                }`}>
                                  {acao.prazo === 'imediato' ? '⚡ Imediato' :
                                   acao.prazo === 'proximo_dia' ? '📅 Próximo dia' :
                                   '🎯 Fim do curso'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Grid com análises */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pontos Fortes */}
              {aiInsights.pontosFortes && aiInsights.pontosFortes.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                      <ThumbsUp className="h-4 w-4" />
                      Pontos Fortes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiInsights.pontosFortes.map((ponto: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{ponto}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Tendências */}
              {aiInsights.tendencias && aiInsights.tendencias.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-purple-700">
                      <TrendingUp className="h-4 w-4" />
                      Tendências Identificadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiInsights.tendencias.map((tendencia: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Zap className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                          <span>{tendencia}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Análise dos Professores */}
            {aiInsights.analiseProfessores && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-600" />
                    Análise dos Professores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{aiInsights.analiseProfessores}</p>
                </CardContent>
              </Card>
            )}

            {/* Análise da Infraestrutura */}
            {aiInsights.analiseInfra && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    Análise da Infraestrutura
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{aiInsights.analiseInfra}</p>
                </CardContent>
              </Card>
            )}

            {/* Raw content fallback */}
            {aiInsights.rawContent && (
              <Card>
                <CardHeader>
                  <CardTitle>Análise Completa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                    {aiInsights.rawContent}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </TabsContent>

      {/* ============== OVERVIEW TAB ============== */}
      <TabsContent value="overview" className="space-y-6">
        {/* Header with export button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportPDF('overview')}
            disabled={exportingTab === 'overview'}
            className="flex items-center gap-2"
          >
            {exportingTab === 'overview' ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exportar PDF
              </>
            )}
          </Button>
        </div>
        
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
            analytics.overallSatisfactionPercent >= 80 
              ? 'from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50'
              : analytics.overallSatisfactionPercent >= 60
              ? 'from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-200/50'
              : 'from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-red-200/50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${
                  analytics.overallSatisfactionPercent >= 80 ? 'bg-emerald-500/20' : analytics.overallSatisfactionPercent >= 60 ? 'bg-yellow-500/20' : 'bg-red-500/20'
                }`}>
                  <TrendingUp className={`h-4 w-4 ${
                    analytics.overallSatisfactionPercent >= 80 ? 'text-emerald-600' : analytics.overallSatisfactionPercent >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${
                    analytics.overallSatisfactionPercent >= 80 ? 'text-emerald-700 dark:text-emerald-400' :
                    analytics.overallSatisfactionPercent >= 60 ? 'text-yellow-700 dark:text-yellow-400' :
                    'text-red-700 dark:text-red-400'
                  }`}>{analytics.overallSatisfactionPercent.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Satisfação</p>
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
                  <p className="text-xs text-muted-foreground">Nota Média</p>
                </div>
              </div>
            </CardContent>
          </Card>


        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Satisfaction Distribution */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Distribuição por Nota
                <Badge variant="outline" className="text-[10px] font-normal">Clique para detalhar</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={satisfactionData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 4, 4, 0]} 
                    onClick={(data) => handleSatisfactionBarClick(data)}
                    style={{ cursor: 'pointer' }}
                  >
                    {satisfactionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="value" position="right" className="text-xs font-medium" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Satisfaction Distribution */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
            setDrilldownData({
              title: 'Distribuição de Notas',
              category: 'satisfaction',
              students: analytics.responsesByStudent
                .map(s => ({
                  name: s.userName,
                  response: s.overallScore.toFixed(1),
                  value: s.overallScore
                }))
                .sort((a, b) => (b.value || 0) - (a.value || 0))
            });
            setDrilldownOpen(true);
          }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Distribuição por Nota
                <Badge variant="outline" className="text-[10px] font-normal">Clique para detalhar</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={satisfactionData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 4, 4, 0]}
                    style={{ cursor: 'pointer' }}
                  >
                    {satisfactionData.map((entry, index) => (
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
        <div className="grid grid-cols-1 gap-4">
          {/* Infrastructure Radar Chart */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Avaliação do Evento
              </CardTitle>
              <CardDescription>Métricas de infraestrutura e organização em 8 dimensões</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={infrastructureRadarData} outerRadius="75%">
                    <PolarGrid strokeDasharray="3 3" />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fontSize: 12, fontWeight: 500 }} 
                    />
                    <PolarRadiusAxis 
                      domain={[0, 5]} 
                      tick={{ fontSize: 10 }} 
                      tickCount={6}
                      axisLine={false}
                    />
                    <Radar 
                      name="Avaliação" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: 13, fontWeight: 500, paddingTop: 20 }}
                      iconSize={14}
                    />
                    <Tooltip 
                      formatter={(value: number) => value.toFixed(2)}
                      contentStyle={{ borderRadius: 8 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3 min-w-[220px]">
                  {(() => {
                    // Color scale function: red (0) → yellow (2.5) → green (5)
                    const getScoreColor = (value: number) => {
                      const ratio = value / 5; // 0-1 scale
                      if (ratio < 0.5) {
                        // Red to Yellow
                        return {
                          bg: ratio < 0.3 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30',
                          text: ratio < 0.3 ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400',
                          border: ratio < 0.3 ? 'border-red-200 dark:border-red-800' : 'border-amber-200 dark:border-amber-800',
                        };
                      } else {
                        // Yellow to Green
                        return {
                          bg: ratio >= 0.8 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-lime-100 dark:bg-lime-900/30',
                          text: ratio >= 0.8 ? 'text-emerald-700 dark:text-emerald-400' : 'text-lime-700 dark:text-lime-400',
                          border: ratio >= 0.8 ? 'border-emerald-200 dark:border-emerald-800' : 'border-lime-200 dark:border-lime-800',
                        };
                      }
                    };
                    const avgColor = getScoreColor(infrastructureAvg);
                    
                    return (
                      <>
                        <div className={`p-4 rounded-xl ${avgColor.bg} border ${avgColor.border}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Target className={`h-4 w-4 ${avgColor.text}`} />
                            <span className={`font-semibold ${avgColor.text}`}>Média Geral</span>
                          </div>
                          <div className={`text-3xl font-bold ${avgColor.text}`}>
                            {infrastructureAvg.toFixed(1)}/5
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Todas as dimensões</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {infrastructureRadarData.slice(0, 4).map((d, i) => {
                            const color = getScoreColor(d.value);
                            return (
                              <div key={i} className={`p-2 rounded-lg ${color.bg} border ${color.border} text-center`}>
                                <div className={`text-lg font-bold ${color.text}`}>{d.value.toFixed(1)}</div>
                                <p className="text-[10px] text-muted-foreground truncate">{d.metric}</p>
                              </div>
                            );
                          })}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {infrastructureRadarData.slice(4).map((d, i) => {
                            const color = getScoreColor(d.value);
                            return (
                              <div key={i} className={`p-2 rounded-lg ${color.bg} border ${color.border} text-center`}>
                                <div className={`text-lg font-bold ${color.text}`}>{d.value.toFixed(1)}</div>
                                <p className="text-[10px] text-muted-foreground truncate">{d.metric}</p>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructor Radar - Full Width */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Comparação de Professores
              </CardTitle>
              <CardDescription>Avaliação comparativa entre Dr. Hygor e Dr. Patrick</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={instructorRadarData} outerRadius="80%">
                    <PolarGrid strokeDasharray="3 3" />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fontSize: 13, fontWeight: 500 }} 
                    />
                    <PolarRadiusAxis 
                      domain={[0, 5]} 
                      tick={{ fontSize: 10 }} 
                      tickCount={6}
                      axisLine={false}
                    />
                    <Radar 
                      name="Dr. Hygor" 
                      dataKey="Dr. Hygor" 
                      stroke="hsl(217, 91%, 60%)" 
                      fill="transparent" 
                      fillOpacity={0}
                      strokeWidth={3}
                    />
                    <Radar 
                      name="Dr. Patrick" 
                      dataKey="Dr. Patrick" 
                      stroke="hsl(160, 84%, 39%)" 
                      fill="transparent" 
                      fillOpacity={0}
                      strokeWidth={3}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: 13, fontWeight: 500, paddingTop: 20 }}
                      iconSize={14}
                    />
                    <Tooltip 
                      formatter={(value: number) => value.toFixed(2)}
                      contentStyle={{ borderRadius: 8 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-4 min-w-[200px]">
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="font-semibold text-blue-700 dark:text-blue-400">Dr. Hygor</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.instructors.hygor.overallAvg.toFixed(1)}/5
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Média Geral</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">Dr. Patrick</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {analytics.instructors.patrick.overallAvg.toFixed(1)}/5
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Média Geral</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monitor Comparison Chart */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-600" />
              Comparação de Monitores
            </CardTitle>
            <CardDescription>Avaliação detalhada dos monitores em 6 dimensões</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={monitorRadarData} outerRadius="75%">
                  <PolarGrid strokeDasharray="3 3" />
                  <PolarAngleAxis 
                    dataKey="metric" 
                    tick={{ fontSize: 12, fontWeight: 500 }} 
                  />
                  <PolarRadiusAxis 
                    domain={[0, 5]} 
                    tick={{ fontSize: 10 }} 
                    tickCount={6}
                    axisLine={false}
                  />
                  <Radar 
                    name="Dr. Eder" 
                    dataKey="Dr. Eder" 
                    stroke="hsl(262, 83%, 58%)" 
                    fill="transparent" 
                    fillOpacity={0}
                    strokeWidth={3}
                  />
                  <Radar 
                    name="Dr. Patrick M" 
                    dataKey="Dr. Patrick M" 
                    stroke="hsl(25, 95%, 53%)" 
                    fill="transparent" 
                    fillOpacity={0}
                    strokeWidth={3}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: 13, fontWeight: 500, paddingTop: 20 }}
                    iconSize={14}
                  />
                  <Tooltip 
                    formatter={(value: number) => value.toFixed(2)}
                    contentStyle={{ borderRadius: 8 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-4 min-w-[200px]">
                <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-violet-500" />
                    <span className="font-semibold text-violet-700 dark:text-violet-400">Dr. Eder</span>
                  </div>
                  <div className="text-2xl font-bold text-violet-600">
                    {analytics.monitors.eder?.overallAvg?.toFixed(1) || 'N/A'}/5
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Média Geral</p>
                </div>
                <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="font-semibold text-orange-700 dark:text-orange-400">Dr. Patrick M</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {analytics.monitors.patrickM?.overallAvg?.toFixed(1) || 'N/A'}/5
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Média Geral</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Word Cloud - Full Width */}
        {wordFrequency.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Nuvem de Palavras
              </CardTitle>
              <CardDescription>
                O tamanho de cada palavra representa sua frequência nos feedbacks
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {(() => {
                const maxCount = Math.max(...wordFrequency.map(w => w.count));
                const minCount = Math.min(...wordFrequency.map(w => w.count));
                
                // Calculate font size based on relative frequency
                const getFontSize = (count: number) => {
                  if (maxCount === minCount) return 20;
                  const normalized = (count - minCount) / (maxCount - minCount);
                  return Math.round(14 + (normalized * 32)); // Range: 14px to 46px
                };
                
                // Get color intensity based on frequency
                const getColorClass = (count: number) => {
                  const normalized = maxCount === minCount ? 0.5 : (count - minCount) / (maxCount - minCount);
                  if (normalized >= 0.8) return 'text-primary font-bold';
                  if (normalized >= 0.6) return 'text-primary/90 font-semibold';
                  if (normalized >= 0.4) return 'text-primary/75 font-medium';
                  if (normalized >= 0.2) return 'text-primary/60 font-medium';
                  return 'text-muted-foreground font-normal';
                };
                
                return (
                  <div className="min-h-[200px] py-6 px-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                    {wordFrequency.map((item, idx) => (
                      <span
                        key={idx}
                        className={`inline-block transition-transform hover:scale-110 cursor-default ${getColorClass(item.count)}`}
                        style={{ 
                          fontSize: `${getFontSize(item.count)}px`,
                          lineHeight: 1.2,
                        }}
                        title={`"${item.word}" apareceu ${item.count} vez${item.count > 1 ? 'es' : ''}`}
                      >
                        {item.word}
                      </span>
                    ))}
                  </div>
                );
              })()}
              <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Menos citado</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-primary/30" />
                    <div className="w-4 h-4 rounded bg-primary/50" />
                    <div className="w-5 h-5 rounded bg-primary/70" />
                    <div className="w-6 h-6 rounded bg-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Mais citado</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback Section - O Que Mais Gostaram */}
        {analytics.openFeedback.likedMost.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-emerald-500" />
                O Que Mais Gostaram
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analytics.openFeedback.likedMost.slice(0, 9).map((feedback, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                    <p className="text-sm text-foreground">"{feedback.text}"</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium">
                      — {feedback.author}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analytics.openFeedback.suggestions.slice(0, 9).map((feedback, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                    <p className="text-sm text-foreground">"{feedback.text}"</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
                      — {feedback.author}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* ============== TIMING ANALYSIS TAB ============== */}
      <TabsContent value="timing" className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tempo Médio Total</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatTime(analytics.timingAnalytics.avgTotalTime)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Média por Pergunta</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatTime(analytics.timingAnalytics.avgTimePerQuestion)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Respostas Genuínas</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {analytics.timingAnalytics.genuineCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Suspeitas/Apressadas</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {analytics.timingAnalytics.suspiciousCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Credibility Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Análise de Credibilidade
            </CardTitle>
            <CardDescription>
              Classificação baseada no tempo médio por pergunta: &lt;3s = Suspeito, 3-6s = Baixo, 6-12s = Médio, &gt;12s = Alto
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const credibilityLevels = [
                { label: 'Alta Credibilidade', level: 'high' as const, color: 'bg-emerald-500', textColor: 'text-emerald-600', description: 'Leu e respondeu com cuidado (>12s/pergunta)' },
                { label: 'Média Credibilidade', level: 'medium' as const, color: 'bg-blue-500', textColor: 'text-blue-600', description: 'Provavelmente leu as perguntas (6-12s/pergunta)' },
                { label: 'Baixa Credibilidade', level: 'low' as const, color: 'bg-amber-500', textColor: 'text-amber-600', description: 'Respostas apressadas (3-6s/pergunta)' },
                { label: 'Suspeito', level: 'suspicious' as const, color: 'bg-red-500', textColor: 'text-red-600', description: 'Apenas clicou para finalizar (<3s/pergunta)' },
              ];
              
              const distribution = credibilityLevels.map(c => ({
                ...c,
                count: analytics.timingAnalytics.studentsByCredibility.filter(s => s.credibilityLevel === c.level).length
              }));
              
              const maxCount = Math.max(...distribution.map(d => d.count), 1);
              const total = analytics.timingAnalytics.studentsByCredibility.length;
              
              return (
                <div className="space-y-4">
                  {distribution.map((item) => (
                    <div key={item.level} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`font-medium ${item.textColor}`}>{item.label}</span>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                        <span className="text-lg font-bold">{item.count}</span>
                      </div>
                      <div className="h-4 bg-muted/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} transition-all duration-500`}
                          style={{ width: `${(item.count / maxCount) * 100}%`, minWidth: item.count > 0 ? '1rem' : '0' }}
                        />
                      </div>
                      <p className="text-right text-xs text-muted-foreground">
                        {total > 0 ? ((item.count / total) * 100).toFixed(0) : 0}% do total
                      </p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Student Credibility Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Ranking de Credibilidade por Aluno
            </CardTitle>
            <CardDescription>
              Ordenado do mais confiável ao mais suspeito
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.timingAnalytics.studentsByCredibility.map((student, idx) => {
                const levelConfig = {
                  high: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle2, label: 'Genuíno' },
                  medium: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: Clock, label: 'OK' },
                  low: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: AlertTriangle, label: 'Apressado' },
                  suspicious: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: AlertTriangle, label: 'Suspeito' },
                }[student.credibilityLevel];
                
                const IconComponent = levelConfig.icon;
                
                return (
                  <div
                    key={student.userId}
                    className={`flex items-center justify-between p-3 rounded-xl border ${levelConfig.bg} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 text-center">
                        {idx === 0 ? (
                          <Trophy className="h-5 w-5 text-yellow-500 mx-auto" />
                        ) : idx === 1 ? (
                          <Medal className="h-5 w-5 text-slate-400 mx-auto" />
                        ) : idx === 2 ? (
                          <Medal className="h-5 w-5 text-amber-600 mx-auto" />
                        ) : (
                          <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>
                        )}
                      </div>
                      
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{student.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <p className="font-medium text-sm">{student.userName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Tempo total: {formatTime(student.totalTimeSeconds)}</span>
                          <span>•</span>
                          <span>Média/pergunta: {formatTime(student.avgTimePerQuestion)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Credibility Score Bar - Fixed width column */}
                      <div className="w-28 flex-shrink-0 hidden sm:block">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              student.credibilityScore >= 80 ? 'bg-emerald-500' :
                              student.credibilityScore >= 60 ? 'bg-blue-500' :
                              student.credibilityScore >= 30 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${student.credibilityScore}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground mt-0.5">
                          {student.credibilityScore}%
                        </p>
                      </div>
                      
                      {/* Badge - Fixed width column for alignment */}
                      <div className="w-24 flex-shrink-0 flex justify-center">
                        <Badge variant="secondary" className={`${levelConfig.bg} ${levelConfig.text} border-0 text-xs`}>
                          <IconComponent className="h-3 w-3 mr-1" />
                          {levelConfig.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {analytics.timingAnalytics.studentsByCredibility.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum dado de timing disponível
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Time Range Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3">
                  <TrendingDown className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm text-muted-foreground">Menor Tempo</p>
                <p className="text-2xl font-bold">{formatTime(analytics.timingAnalytics.minTotalTime)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-3">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">{formatTime(analytics.timingAnalytics.avgTotalTime)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-3">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm text-muted-foreground">Maior Tempo</p>
                <p className="text-2xl font-bold">{formatTime(analytics.timingAnalytics.maxTotalTime)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* ============== RANKING TAB ============== */}
      <TabsContent value="ranking" className="space-y-4">
        {/* Header with export button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportPDF('ranking')}
            disabled={exportingTab === 'ranking'}
            className="flex items-center gap-2"
          >
            {exportingTab === 'ranking' ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exportar PDF
              </>
            )}
          </Button>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nota Máxima</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {analytics.questionRankings.length > 0 
                      ? Math.max(...analytics.questionRankings.map(q => q.avgRating)).toFixed(1)
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Média Geral</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {analytics.questionRankings.length > 0 
                      ? (analytics.questionRankings.reduce((acc, q) => acc + q.avgRating, 0) / analytics.questionRankings.length).toFixed(1)
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nota Mínima</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {analytics.questionRankings.length > 0 
                      ? Math.min(...analytics.questionRankings.map(q => q.avgRating)).toFixed(1)
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Perguntas</p>
                  <p className="text-2xl font-bold text-primary">
                    {analytics.questionRankings.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribution Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Distribuição por Faixa de Nota
            </CardTitle>
            <CardDescription>
              Quantidade de perguntas em cada faixa de avaliação
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              // Define ranges with percentage values for gradient calculation (scale 0-10)
              const ranges = [
                { label: '10.0', min: 10.0, max: 10.0, pct: 100 },
                { label: '9.0-9.9', min: 9.0, max: 9.99, pct: 95 },
                { label: '8.0-8.9', min: 8.0, max: 8.99, pct: 85 },
                { label: '7.0-7.9', min: 7.0, max: 7.99, pct: 75 },
                { label: '6.0-6.9', min: 6.0, max: 6.99, pct: 65 },
                { label: '5.0-5.9', min: 5.0, max: 5.99, pct: 55 },
                { label: '4.0-4.9', min: 4.0, max: 4.99, pct: 45 },
                { label: '3.0-3.9', min: 3.0, max: 3.99, pct: 35 },
                { label: '2.0-2.9', min: 2.0, max: 2.99, pct: 25 },
                { label: '1.0-1.9', min: 1.0, max: 1.99, pct: 15 },
                { label: '< 1.0', min: 0, max: 0.99, pct: 5 },
              ];
              
              const distribution = ranges.map(range => ({
                ...range,
                count: analytics.questionRankings.filter(q => 
                  q.avgRating >= range.min && q.avgRating <= range.max
                ).length
              })).filter(d => d.count > 0 || ['10.0', '8.0-8.9', '6.0-6.9', '< 1.0'].includes(d.label));
              
              const maxCount = Math.max(...distribution.map(d => d.count), 1);
              
              return (
                <div className="space-y-3">
                  {distribution.map((range) => {
                    const barColor = getGradientColorStyle(range.pct, 0, 100);
                    const textColor = getGradientColorStyle(range.pct, 0, 100);
                    
                    return (
                      <div key={range.label} className="flex items-center gap-3">
                        <span 
                          className="w-20 text-sm font-medium"
                          style={{ color: textColor }}
                        >
                          {range.label}
                        </span>
                        <div className="flex-1 h-8 bg-muted/50 rounded-lg overflow-hidden relative">
                          <div 
                            className="h-full transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ 
                              width: `${(range.count / maxCount) * 100}%`, 
                              minWidth: range.count > 0 ? '2rem' : '0',
                              backgroundColor: barColor
                            }}
                          >
                            {range.count > 0 && (
                              <span className="text-sm font-bold text-white">{range.count}</span>
                            )}
                          </div>
                          {range.count === 0 && (
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">0</span>
                          )}
                        </div>
                        <span className="w-16 text-xs text-muted-foreground text-right">
                          {analytics.questionRankings.length > 0 
                            ? ((range.count / analytics.questionRankings.length) * 100).toFixed(0) 
                            : 0}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Ranking List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Ranking Completo
            </CardTitle>
            <CardDescription>
              Clique em uma pergunta para ver quem deu cada nota
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.questionRankings.map((q, idx) => {
                // Calculate distribution percentages (scale 0-10)
                const totalResponses = q.responseCount;
                const dist = q.distribution || {};
                // High: 8-10, Medium: 5-7, Low: 0-4
                const highRatings = (dist['10'] || 0) + (dist['9'] || 0) + (dist['8'] || 0) + (dist['7.5'] || 0);
                const medRatings = (dist['7'] || 0) + (dist['6'] || 0) + (dist['5'] || 0);
                const lowRatings = (dist['4'] || 0) + (dist['3'] || 0) + (dist['2.5'] || 0) + (dist['2'] || 0) + (dist['1'] || 0) + (dist['0'] || 0);
                
                const highPercent = totalResponses > 0 ? (highRatings / totalResponses) * 100 : 0;
                const medPercent = totalResponses > 0 ? (medRatings / totalResponses) * 100 : 0;
                const lowPercent = totalResponses > 0 ? (lowRatings / totalResponses) * 100 : 0;
                
                return (
                  <div
                    key={q.questionKey}
                    className="group p-4 rounded-xl border bg-card hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setSelectedQuestion(q)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Ranking Medal/Position */}
                      <div className="flex-shrink-0">
                        {idx === 0 ? (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shadow-lg">
                            <Trophy className="h-6 w-6 text-yellow-800" />
                          </div>
                        ) : idx === 1 ? (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-lg">
                            <Medal className="h-6 w-6 text-slate-700" />
                          </div>
                        ) : idx === 2 ? (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg">
                            <Medal className="h-6 w-6 text-amber-100" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm leading-tight mb-1">{q.questionLabel}</h4>
                            <Badge variant="secondary" className="text-[10px]">{q.category}</Badge>
                          </div>
                          
                          {/* Score with gradient */}
                          <div className="text-right flex-shrink-0">
                            <div 
                              className="text-2xl font-bold"
                              style={{ color: getGradientColorStyle(q.avgRating, 0, 10) }}
                            >
                              {q.avgRating.toFixed(1)}
                            </div>
                            <p className="text-[10px] text-muted-foreground">{q.responseCount} respostas</p>
                          </div>
                        </div>
                        
                        {/* Distribution Bar */}
                        <div className="mt-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-muted-foreground">Distribuição:</span>
                          </div>
                          <div className="h-3 rounded-full overflow-hidden flex bg-muted/50">
                            {highPercent > 0 && (
                              <div 
                                className="h-full bg-emerald-500 transition-all"
                                style={{ width: `${highPercent}%` }}
                                title={`Notas 7.5-10: ${highRatings} (${highPercent.toFixed(0)}%)`}
                              />
                            )}
                            {medPercent > 0 && (
                              <div 
                                className="h-full bg-amber-400 transition-all"
                                style={{ width: `${medPercent}%` }}
                                title={`Notas 5-7: ${medRatings} (${medPercent.toFixed(0)}%)`}
                              />
                            )}
                            {lowPercent > 0 && (
                              <div 
                                className="h-full bg-red-400 transition-all"
                                style={{ width: `${lowPercent}%` }}
                                title={`Notas 0-4: ${lowRatings} (${lowPercent.toFixed(0)}%)`}
                              />
                            )}
                          </div>
                          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>{highPercent.toFixed(0)}% (7.5-10)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-amber-400" />
                              <span>{medPercent.toFixed(0)}% (5-7)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-red-400" />
                              <span>{lowPercent.toFixed(0)}% (0-4)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {selectedQuestion && (
          <QuestionDetailView 
            question={selectedQuestion} 
            respondents={analytics.responsesByStudent
              .map(student => {
                const response = student.responses.find(r => r.questionKey === selectedQuestion.questionKey);
                return response ? { name: student.userName, value: response.value || '' } : null;
              })
              .filter((r): r is { name: string; value: string } => r !== null && r.value !== '')
            }
          />
        )}
      </TabsContent>

      {/* ============== QUESTIONS TAB ============== */}
      <TabsContent value="questions" className="space-y-4">
        {/* Header with export button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportPDF('questions')}
            disabled={exportingTab === 'questions'}
            className="flex items-center gap-2"
          >
            {exportingTab === 'questions' ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exportar PDF
              </>
            )}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* LEFT SIDE - Questions List */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Perguntas da Pesquisa
              </CardTitle>
              <CardDescription>
                Clique em uma pergunta para ver os detalhes à direita
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
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

              {/* Questions List - Full list without scroll limit */}
              <div className="space-y-2">
                  {filteredQuestions.map((q, idx) => {
                    const isSelected = selectedQuestion?.questionKey === q.questionKey;
                    const ratingColorClass = getRatingColor(q.avgRating);
                    
                    return (
                      <div
                        key={q.questionKey}
                        className={`group relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-transparent bg-muted/30 hover:bg-muted/50 hover:border-muted-foreground/20'
                        }`}
                        onClick={() => setSelectedQuestion(q)}
                      >
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                        )}
                        
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] shrink-0 ${
                                  isSelected ? 'bg-primary/10 border-primary/30 text-primary' : ''
                                }`}
                              >
                                {q.category}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                #{idx + 1}
                              </span>
                            </div>
                            <p className={`text-sm font-medium leading-tight ${
                              isSelected ? 'text-foreground' : 'text-foreground/80'
                            }`}>
                              {q.questionLabel}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>{q.responseCount} respostas</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Rating badge with gradient */}
                          <div 
                            className="px-3 py-1.5 rounded-lg font-bold text-lg"
                            style={{ 
                              backgroundColor: getGradientBgStyle(q.avgRating, 0, 5),
                              color: getGradientColorStyle(q.avgRating, 0, 5)
                            }}
                          >
                            {q.avgRating.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
            </CardContent>
          </Card>

          {/* RIGHT SIDE - Question Details */}
          <div className="h-fit sticky top-4">
            {selectedQuestion ? (
              <QuestionDetailView 
                question={selectedQuestion} 
                respondents={analytics.responsesByStudent
                  .map(student => {
                    const response = student.responses.find(r => r.questionKey === selectedQuestion.questionKey);
                    return response ? { name: student.userName, value: response.value || '' } : null;
                  })
                  .filter((r): r is { name: string; value: string } => r !== null && r.value !== '')
                }
              />
            ) : (
              <Card className="border-2 border-dashed border-muted-foreground/20">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Selecione uma pergunta
                  </h3>
                  <p className="text-sm text-muted-foreground/70 max-w-xs">
                    Clique em uma pergunta à esquerda para visualizar o gráfico de distribuição de respostas e quem respondeu
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
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
              onClick={() => handleExportPDF('students')}
              disabled={exportingTab === 'students'}
              className="flex items-center gap-2"
            >
              {exportingTab === 'students' ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </>
              )}
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

            {/* Students List - Full list without scroll */}
            <div className="space-y-1.5">
              {filteredStudents.map((student) => (
                <div
                  key={student.userId}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedStudent?.userId === student.userId
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {student.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        {student.userName}
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
                    {(() => {
                      const classConfig = getSatisfactionClassConfig(student.satisfactionClass);
                      return (
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${classConfig.bg} ${classConfig.text} ${classConfig.border}`}
                        >
                          {classConfig.label} ({student.overallScore.toFixed(1)})
                        </Badge>
                      );
                    })()}
                    {student.isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Student Detail Dialog */}
        <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {selectedStudent?.userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span>{selectedStudent?.userName}</span>
                  <p className="text-sm text-muted-foreground font-normal">
                    {selectedStudent?.isCompleted ? 'Pesquisa completa' : `${selectedStudent?.progressPercent}% concluído`}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {selectedStudent && (
              <ScrollArea className="flex-1 max-h-[70vh] pr-4">
                <StudentDetailView student={selectedStudent} />
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </TabsContent>

      {/* Drilldown Dialog */}
      <Dialog open={drilldownOpen} onOpenChange={setDrilldownOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {drilldownData?.title}
            </DialogTitle>
            <DialogDescription>
              {drilldownData?.students.length || 0} aluno(s) nesta categoria
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 max-h-[60vh]">
            <div className="space-y-2 pr-4">
              {drilldownData?.students.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum aluno nesta categoria
                </p>
              ) : (
                drilldownData?.students.map((student, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{student.name}</span>
                    </div>
                    {/* Show numeric score with gradient color */}
                    {student.value !== null && student.value !== undefined && (
                      <Badge 
                        className="font-bold px-3"
                        style={{ 
                          backgroundColor: getGradientBgStyle(student.value, 0, 10),
                          color: getGradientColorStyle(student.value, 0, 10)
                        }}
                      >
                        {student.value.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
