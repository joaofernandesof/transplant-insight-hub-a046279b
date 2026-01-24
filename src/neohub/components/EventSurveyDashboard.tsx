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
  Sparkles,
  AlertTriangle,
  Target,
  Zap,
  Brain,
  RefreshCw,
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
          <div style="flex: 1; background: ${analytics.nps.score >= 50 ? '#ecfdf5' : analytics.nps.score >= 0 ? '#fef9c3' : '#fee2e2'}; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: ${analytics.nps.score >= 50 ? '#059669' : analytics.nps.score >= 0 ? '#ca8a04' : '#dc2626'};">${analytics.nps.score}</div>
            <div style="font-size: 12px; color: #6b7280;">NPS</div>
          </div>
          <div style="flex: 1; background: #f3e8ff; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #7c3aed;">${analytics.overallSatisfaction.toFixed(1)}</div>
            <div style="font-size: 12px; color: #6b7280;">Satisfação</div>
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
          <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">Distribuição NPS</h3>
          <div style="display: flex; gap: 16px;">
            <div style="flex: 1; text-align: center; padding: 16px; background: #ecfdf5; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #10b981;">${analytics.nps.promoters}</div>
              <div style="font-size: 11px; color: #6b7280;">Promotores</div>
            </div>
            <div style="flex: 1; text-align: center; padding: 16px; background: #fef9c3; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${analytics.nps.passives}</div>
              <div style="font-size: 11px; color: #6b7280;">Passivos</div>
            </div>
            <div style="flex: 1; text-align: center; padding: 16px; background: #fee2e2; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${analytics.nps.detractors}</div>
              <div style="font-size: 11px; color: #6b7280;">Detratores</div>
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
  
  const getRatingColorFn = (value: number): string => {
    if (value >= 4.5) return '#10b981';
    if (value >= 3.5) return '#3b82f6';
    if (value >= 2.5) return '#f59e0b';
    if (value >= 1.5) return '#f97316';
    return '#ef4444';
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
  const getRatingColorFn = (value: number): string => {
    if (value >= 4.5) return '#10b981';
    if (value >= 3.5) return '#3b82f6';
    if (value >= 2.5) return '#f59e0b';
    if (value >= 1.5) return '#f97316';
    return '#ef4444';
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
                      <div style="background: ${q.avgRating >= 4.5 ? '#ecfdf5' : q.avgRating >= 3.5 ? '#eff6ff' : q.avgRating >= 2.5 ? '#fef9c3' : '#fee2e2'}; padding: 6px 12px; border-radius: 8px; margin-left: 12px;">
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

  // Get badge colors matching the site exactly
  const getSatisfactionBadgeStyle = (satisfaction: string) => {
    const s = satisfaction.toLowerCase();
    if (s.includes('muito satisfeito')) return { bg: '#dcfce7', color: '#166534', border: '#86efac' };
    if (s.includes('satisfeito')) return { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' };
    if (s.includes('neutro')) return { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' };
    return { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' };
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
          
          const satisfactionStyle = student.satisfaction ? getSatisfactionBadgeStyle(student.satisfaction) : null;

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
                  ${satisfactionStyle ? `
                    <div style="background: ${satisfactionStyle.bg}; color: ${satisfactionStyle.color}; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; border: 1px solid ${satisfactionStyle.border};">
                      ${student.satisfaction}
                    </div>
                  ` : ''}
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
              <div className={`text-4xl font-bold ${getRatingColor(question.avgRating)}`}>
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
                    className={`text-xs ${
                      r.value.toLowerCase().includes('excelente') || r.value.toLowerCase().includes('totalmente') || r.value.toLowerCase().includes('muito satisfeito')
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : r.value.toLowerCase().includes('ruim') || r.value.toLowerCase().includes('insuficiente') || r.value.toLowerCase().includes('não atendeu')
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : r.value.toLowerCase().includes('neutro') || r.value.toLowerCase().includes('parcialmente')
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportingTab, setExportingTab] = useState<string | null>(null);
  
  // AI Insights state
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

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
        npsScore: analytics.nps.score,
        overallSatisfaction: analytics.overallSatisfaction,
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

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="grid grid-cols-5 w-full max-w-3xl">
        <TabsTrigger value="overview" className="flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4" />
          Visão Geral
        </TabsTrigger>
        <TabsTrigger value="insights" className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4" />
          Insights IA
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
            {/* Header with regenerate button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/20">
                  <Brain className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Insights Gerados por IA</h2>
                  <p className="text-xs text-muted-foreground">Baseado em {analytics.totalResponses} respostas analisadas</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateAIInsights}
                disabled={isLoadingInsights}
              >
                {isLoadingInsights ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerar
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
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {analytics.openFeedback.likedMost.length > 0 ? (
                    analytics.openFeedback.likedMost.slice(0, 8).map((feedback, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                        <p className="text-sm text-foreground">"{feedback.text}"</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium">
                          — {feedback.author}
                        </p>
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

              {/* Questions List */}
              <ScrollArea className="h-[500px] pr-2">
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
                          
                          {/* Rating badge */}
                          <div className={`px-3 py-1.5 rounded-lg font-bold text-lg ${
                            q.avgRating >= 4.5 ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                            q.avgRating >= 3.5 ? 'bg-blue-100 dark:bg-blue-900/30' :
                            q.avgRating >= 2.5 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                            q.avgRating >= 1.5 ? 'bg-orange-100 dark:bg-orange-900/30' :
                            'bg-red-100 dark:bg-red-900/30'
                          } ${ratingColorClass}`}>
                            {q.avgRating.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
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
          </CardContent>
        </Card>

        {selectedStudent && (
          <StudentDetailView student={selectedStudent} />
        )}
      </TabsContent>
    </Tabs>
  );
}
