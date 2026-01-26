import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  PieChart,
  Pie,
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
  Check,
  Eye,
  ChevronLeft,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { SurveyQuestionsManager } from "./SurveyQuestionsManager";
import { Day2SurveyFullDashboard } from "@/academy/components/Day2SurveyFullDashboard";
import { Day3SurveyFullDashboard } from "@/academy/components/Day3SurveyFullDashboard";
import { GlobalSurveyDashboard } from "@/academy/components/GlobalSurveyDashboard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { printCurrentView } from "@/utils/printPdf";
import { exportAllTabsToPdf } from "@/utils/exportAllTabsPdf";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FileStack, Loader2 } from 'lucide-react';
import { useSurveyAnalytics, type QuestionRating, type StudentDetailedResponse } from "@/neohub/hooks/useSurveyAnalytics";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { 
  ChartExecutiveSummary, 
  generateSatisfactionInsight, 
  generateInstructorInsight,
  generateRadarInsight,
  generateMonitorInsight
} from '@/components/surveys/ChartExecutiveSummary';

interface EventSurveyDashboardProps {
  classId: string | null;
}

// Survey day filter options
type DayFilter = 'global' | 'day1' | 'day2' | 'day3';

// Drill-down dialog state type
interface DrilldownData {
  title: string;
  category: string;
  students: { name: string; response: string; value?: number | null }[];
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

// PDF Margins in mm
const PDF_MARGIN = 15;

async function createPDFFromHTML(htmlContent: string, filename: string, options?: { fitToSinglePage?: boolean }) {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '750px'; // Slightly narrower for better margins
  container.style.minHeight = '100px'; // Ensure minimum height
  container.style.background = '#ffffff';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  container.style.lineHeight = '1.5';
  container.style.color = '#1f2937';
  container.style.padding = '20px'; // Add internal padding
  container.style.overflow = 'visible'; // Ensure content is visible
  document.body.appendChild(container);
  container.innerHTML = htmlContent;
  
  // Wait for fonts and styles to load - increased timeout for complex content
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    // Get actual content height after rendering
    const contentHeight = container.scrollHeight;
    const contentWidth = container.scrollWidth;
    
    const canvas = await html2canvas(container, {
      scale: 2, // Good quality without being too heavy
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      imageTimeout: 0,
      height: contentHeight, // Explicitly set height
      width: Math.max(contentWidth, 750),
      windowHeight: contentHeight + 100,
      scrollY: 0,
      scrollX: 0,
    });

    // Check if canvas has content
    if (canvas.width === 0 || canvas.height === 0) {
      console.error('Canvas is empty - content may not have rendered');
      throw new Error('Failed to render PDF content');
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Usable area with margins - increased margins
    const usableWidth = pdfWidth - (PDF_MARGIN * 2);
    const usableHeight = pdfHeight - (PDF_MARGIN * 2) - 8; // Extra 8mm for page number
    
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    
    // Calculate aspect ratio to fit within margins
    const canvasAspectRatio = canvas.width / canvas.height;
    const usableAspectRatio = usableWidth / usableHeight;
    
    let imgWidth: number;
    let imgHeight: number;
    
    if (options?.fitToSinglePage) {
      // Scale proportionally to fit entire content in single page
      if (canvasAspectRatio > usableAspectRatio) {
        // Width constrained
        imgWidth = usableWidth;
        imgHeight = imgWidth / canvasAspectRatio;
      } else {
        // Height constrained
        imgHeight = usableHeight;
        imgWidth = imgHeight * canvasAspectRatio;
      }
      
      // Center horizontally within margins
      const xOffset = PDF_MARGIN + (usableWidth - imgWidth) / 2;
      pdf.addImage(imgData, 'JPEG', xOffset, PDF_MARGIN, imgWidth, imgHeight);
      
      // Page number
      pdf.setFontSize(8);
      pdf.setTextColor(156, 163, 175);
      pdf.text('Página 1 de 1', pdfWidth / 2, pdfHeight - 5, { align: 'center' });
    } else {
      // Multi-page logic with proper margins and clipping
      imgWidth = usableWidth;
      imgHeight = (canvas.height * usableWidth) / canvas.width;
      
      // Calculate how many pages we need
      const totalPages = Math.ceil(imgHeight / usableHeight);
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        
        // Calculate the y position for this page's slice
        const srcY = page * usableHeight;
        const position = PDF_MARGIN - srcY;
        
        // Add the image, offset to show the correct portion
        pdf.addImage(imgData, 'JPEG', PDF_MARGIN, position, imgWidth, imgHeight);
        
        // Draw white rectangles to hide content outside margins (clip effect)
        pdf.setFillColor(255, 255, 255);
        // Top margin area
        pdf.rect(0, 0, pdfWidth, PDF_MARGIN, 'F');
        // Bottom margin area (including page number space)
        pdf.rect(0, pdfHeight - PDF_MARGIN - 8, pdfWidth, PDF_MARGIN + 8, 'F');
        // Left margin
        pdf.rect(0, 0, PDF_MARGIN, pdfHeight, 'F');
        // Right margin
        pdf.rect(pdfWidth - PDF_MARGIN, 0, PDF_MARGIN, pdfHeight, 'F');
        
        // Page number
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text(`Página ${page + 1} de ${totalPages}`, pdfWidth / 2, pdfHeight - 5, { align: 'center' });
      }
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
            <div style="font-size: 32px; font-weight: bold; color: #7c3aed;">${analytics.overallSatisfaction.toFixed(1)}/10</div>
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
  
  await createPDFFromHTML(html, `visao-geral-${new Date().toISOString().split('T')[0]}.pdf`, { fitToSinglePage: true });
}

// RANKING PDF
async function exportRankingPDF(analytics: NonNullable<SurveyAnalyticsData>) {
  const sortedRankings = [...analytics.questionRankings].sort((a, b) => b.avgRating - a.avgRating);
  
  // Gradient color function for PDF (0-10 scale)
  const getRatingColorFn = (value: number): string => {
    // Convert 0-10 scale to 0-100 percentage
    const percent = Math.max(0, Math.min(100, (value / 10) * 100));
    // HSL: 0° = Red, 60° = Yellow, 120° = Green
    const hue = (percent / 100) * 120;
    return `hsl(${hue}, 70%, 45%)`;
  };
  
  // Background color gradient
  const getRatingBgFn = (value: number): string => {
    const percent = Math.max(0, Math.min(100, (value / 10) * 100));
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
  
  await createPDFFromHTML(html, `ranking-perguntas-${new Date().toISOString().split('T')[0]}.pdf`, { fitToSinglePage: true });
}

// QUESTIONS PDF - Shows each student's answer next to their name
async function exportQuestionsPDF(analytics: NonNullable<SurveyAnalyticsData>) {
  // Gradient color function for PDF (0-10 scale)
  const getRatingColorFn = (value: number): string => {
    const percent = Math.max(0, Math.min(100, (value / 10) * 100));
    const hue = (percent / 100) * 120;
    return `hsl(${hue}, 70%, 45%)`;
  };
  
  // Background color gradient
  const getRatingBgFn = (value: number): string => {
    const percent = Math.max(0, Math.min(100, (value / 10) * 100));
    const hue = (percent / 100) * 120;
    return `hsl(${hue}, 70%, 92%)`;
  };

  // Get semantic color for response value
  const getValueColor = (value: string): string => {
    const key = value.toLowerCase().trim();
    // Excellent - Dark Green (truly exceptional)
    const excellentWords = ['excelente', 'superou expectativas', 'superou', 'perfeito', 'alta urgência'];
    if (excellentWords.some(w => key.includes(w))) return '#10b981';
    // Very Good - Light Green
    const veryGoodWords = ['muito bom', 'muito satisfeito', 'mais de 10', 'ótimo'];
    if (veryGoodWords.some(w => key.includes(w))) return '#4ade80';
    // Good - Blue (met expectations fully)
    const goodWords = ['satisfeito', 'adequado', 'bom', 'concordo', 'atendeu plenamente', 'atendeu totalmente', 'totalmente', 'de 5 a 10', 'suficiente', 'média urgência', 'sim', 'mais do que suficiente', 'concordo totalmente'];
    if (goodWords.some(w => key.includes(w))) return '#3b82f6';
    // Medium - Orange (partially met)
    const mediumWords = ['neutro', 'parcialmente', 'atendeu parcialmente', 'regular', 'médio', 'até 5', 'razoável', 'moderado', 'indiferente'];
    if (mediumWords.some(w => key.includes(w))) return '#f59e0b';
    // Bad - Red (did not meet)
    const badWords = ['insuficiente', 'insatisfeito', 'muito insatisfeito', 'ruim', 'péssimo', 'não atendeu', 'discordo', 'fraco', 'baixo', 'nunca', 'sem urgência', 'não concordo'];
    if (badWords.some(w => key.includes(w))) return '#ef4444';
    return '#64748b';
  };
  
  const categories = [...new Set(analytics.allQuestions.map(q => q.category))];

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #8b5cf6, #6366f1); padding: 24px 32px;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
          <span style="font-size: 28px;">📝</span>
          <h1 style="color: white; font-size: 22px; font-weight: 700; margin: 0;">Análise por Perguntas</h1>
        </div>
        <p style="text-align: center; color: rgba(255,255,255,0.85); font-size: 12px; margin: 8px 0 0 0;">
          Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
          <br/>${analytics.allQuestions.length} perguntas analisadas
        </p>
      </div>
      
      <div style="padding: 24px 32px;">
        ${categories.map(category => {
          const questionsInCategory = analytics.allQuestions.filter(q => q.category === category);
          return `
            <div style="margin-bottom: 32px;">
              <h2 style="font-size: 16px; font-weight: 700; color: #1f2937; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 3px solid #8b5cf6;">
                ${category}
              </h2>
              ${questionsInCategory.map((q, idx) => {
                // Get all respondents with their specific answers
                const respondents = analytics.responsesByStudent
                  .map(student => {
                    const response = student.responses.find(r => r.questionKey === q.questionKey);
                    return response ? { name: student.userName, value: response.value || '' } : null;
                  })
                  .filter((r): r is { name: string; value: string } => r !== null && r.value !== '');
                
                return `
                  <div style="background: ${idx % 2 === 0 ? '#f9fafb' : '#ffffff'}; padding: 16px; border-radius: 10px; margin-bottom: 12px; border: 1px solid #e5e7eb;">
                    <!-- Question header with score -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937; flex: 1;">${q.questionLabel}</p>
                      <div style="background: ${getRatingBgFn(q.avgRating)}; padding: 8px 14px; border-radius: 10px; margin-left: 12px; min-width: 50px; text-align: center;">
                        <span style="font-size: 20px; font-weight: 800; color: ${getRatingColorFn(q.avgRating)};">${q.avgRating.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <!-- Summary distribution -->
                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
                      ${Object.entries(q.distribution).map(([key, value]) => `
                        <span style="background: #f3e8ff; padding: 4px 10px; border-radius: 12px; font-size: 11px; color: #7c3aed; border: 1px solid #e9d5ff;">
                          ${key}: <strong>${value}</strong>
                        </span>
                      `).join('')}
                    </div>
                    
                    <!-- Student answers table -->
                    ${respondents.length > 0 ? `
                      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 600; color: #6b7280;">Quem respondeu:</p>
                        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                          <tbody>
                            ${respondents.map((r, rIdx) => `
                              <tr style="background: ${rIdx % 2 === 0 ? '#faf5ff' : '#ffffff'};">
                                <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 500; color: #374151; width: 45%;">
                                  ${r.name}
                                </td>
                                <td style="padding: 6px 10px; border: 1px solid #e5e7eb; color: ${getValueColor(r.value)}; font-weight: 600;">
                                  ${r.value}
                                </td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }).join('')}
      </div>
      
      <!-- Footer -->
      <div style="background: #f8fafc; padding: 12px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="margin: 0; font-size: 10px; color: #94a3b8;">Relatório de Análise por Perguntas • Sistema de Pesquisa de Satisfação</p>
      </div>
    </div>
  `;
  
  await createPDFFromHTML(html, `perguntas-${new Date().toISOString().split('T')[0]}.pdf`);
}

// STUDENTS PDF - All students in a single PDF (sequential)
const exportStudentResponsesPDF = async (students: StudentDetailedResponse[]) => {
  // Helper function to get semantic color for responses
  const getValueColor = (value: string): string => {
    const key = value.toLowerCase().trim();
    
    // Excellent - Dark Green (truly exceptional)
    const excellentWords = ['excelente', 'superou expectativas', 'superou', 'perfeito', 'alta urgência'];
    if (excellentWords.some(w => key.includes(w))) return '#10b981';
    
    // Very Good - Light Green
    const veryGoodWords = ['muito bom', 'muito satisfeito', 'mais de 10', 'ótimo'];
    if (veryGoodWords.some(w => key.includes(w))) return '#4ade80';
    
    // Good - Blue (met expectations fully)
    const goodWords = ['satisfeito', 'adequado', 'bom', 'concordo', 'atendeu plenamente', 'atendeu totalmente', 'totalmente', 'de 5 a 10', 'suficiente', 'média urgência', 'sim', 'mais do que suficiente', 'concordo totalmente'];
    if (goodWords.some(w => key.includes(w))) return '#3b82f6';
    
    // Medium - Orange (partially met)
    const mediumWords = ['neutro', 'parcialmente', 'atendeu parcialmente', 'regular', 'médio', 'até 5', 'razoável', 'moderado', 'indiferente'];
    if (mediumWords.some(w => key.includes(w))) return '#f59e0b';
    
    // Bad - Red (did not meet)
    const badWords = ['insuficiente', 'insatisfeito', 'muito insatisfeito', 'ruim', 'péssimo', 'não atendeu', 'discordo', 'fraco', 'baixo', 'nunca', 'sem urgência', 'não concordo'];
    if (badWords.some(w => key.includes(w))) return '#ef4444';
    
    return '#64748b';
  };

  // Render per-page to avoid html2canvas max canvas height (which leads to blank PDFs when many students)
  const filename = `relatorios-alunos-${new Date().toISOString().split('T')[0]}.pdf`;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const usableWidth = pdfWidth - (PDF_MARGIN * 2);
  const usableHeight = pdfHeight - (PDF_MARGIN * 2) - 8;

  const waitForDOMStabilize = async () => {
    // Let layout settle + fonts load (when available)
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // ignore
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 80));
  };

  const appendHtmlToPdf = async (html: string, startOnNewPage: boolean) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '750px';
    container.style.minHeight = '100px';
    container.style.background = '#ffffff';
    container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    container.style.lineHeight = '1.5';
    container.style.color = '#1f2937';
    container.style.padding = '20px';
    container.style.overflow = 'visible';

    document.body.appendChild(container);
    container.innerHTML = html;

    try {
      await waitForDOMStabilize();

      const contentHeight = container.scrollHeight;
      const contentWidth = container.scrollWidth;

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        imageTimeout: 0,
        height: contentHeight,
        width: Math.max(contentWidth, 750),
        windowHeight: contentHeight + 100,
        scrollY: 0,
        scrollX: 0,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * usableWidth) / canvas.width;
      const totalPages = Math.max(1, Math.ceil(imgHeight / usableHeight));

      let needsNewPage = startOnNewPage;
      for (let page = 0; page < totalPages; page++) {
        if (needsNewPage) {
          pdf.addPage();
        }
        needsNewPage = true; // next loop always adds a new page

        const srcY = page * usableHeight;
        const position = PDF_MARGIN - srcY;

        pdf.addImage(imgData, 'JPEG', PDF_MARGIN, position, imgWidth, imgHeight);

        // Clip by painting margins white (prevents bleed from the full-height image)
        pdf.setFillColor(255, 255, 255);
        // Top margin
        pdf.rect(0, 0, pdfWidth, PDF_MARGIN, 'F');
        // Bottom margin (+ page number space)
        pdf.rect(0, pdfHeight - PDF_MARGIN - 8, pdfWidth, PDF_MARGIN + 8, 'F');
        // Left margin
        pdf.rect(0, 0, PDF_MARGIN, pdfHeight, 'F');
        // Right margin
        pdf.rect(pdfWidth - PDF_MARGIN, 0, PDF_MARGIN, pdfHeight, 'F');
      }
    } finally {
      document.body.removeChild(container);
    }
  };

  // Cover + index (usually 1-2 pages)
  const coverAndIndexHtml = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); min-height: 200px; padding: 40px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
        <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0 0 12px 0;">
          Relatórios Individuais - Pesquisa de Satisfação
        </h1>
        <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">
          ${students.length} alunos • Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
        </p>
      </div>
      <div style="padding: 24px 32px; background: #f8fafc;">
        <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin: 0 0 16px 0;">📋 Índice de Alunos</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
          ${students.map((s, i) => `
            <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
              <span style="font-size: 12px; font-weight: 600; color: #6366f1;">#${i + 1}</span>
              <span style="font-size: 13px; color: #374151;">${s.userName}</span>
              <span style="margin-left: auto; font-size: 12px; font-weight: 700; color: #6366f1;">${s.overallScore.toFixed(1)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  await appendHtmlToPdf(coverAndIndexHtml, false);

  // Each student starts on a new page (and may span multiple pages if needed)
  for (let studentIndex = 0; studentIndex < students.length; studentIndex++) {
    const student = students[studentIndex];
    const groupedResponses = student.responses.reduce((acc, r) => {
      if (!acc[r.category]) acc[r.category] = [];
      acc[r.category].push(r);
      return acc;
    }, {} as Record<string, typeof student.responses>);

    const totalResponded = student.responses.filter(r => r.value).length;
    const totalQuestions = student.responses.length;

    const studentHtml = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; min-height: 100vh;">
        <div style="max-width: 900px; margin: 0 auto; padding: 32px;">
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 16px; padding: 32px 40px; margin-bottom: 24px; text-align: center;">
            <div style="font-size: 28px; margin-bottom: 8px;">📋</div>
            <h1 style="color: white; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px;">
              Relatório Individual #${studentIndex + 1}
            </h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 500; margin: 0;">
              ${student.userName}
            </p>
          </div>

          <div style="display: flex; gap: 16px; margin-bottom: 32px;">
            <div style="flex: 1; background: #f1f5f9; border-radius: 16px; padding: 24px; text-align: center;">
              <div style="font-size: 42px; font-weight: 800; color: #6366f1; line-height: 1;">
                ${student.overallScore.toFixed(1)}
              </div>
              <div style="font-size: 13px; color: #64748b; font-weight: 500; margin-top: 8px;">Nota Média</div>
            </div>
            <div style="flex: 1; background: #f1f5f9; border-radius: 16px; padding: 24px; text-align: center;">
              <div style="font-size: 42px; font-weight: 800; color: #6366f1; line-height: 1;">
                ${totalResponded}/${totalQuestions}
              </div>
              <div style="font-size: 13px; color: #64748b; font-weight: 500; margin-top: 8px;">Perguntas Respondidas</div>
            </div>
          </div>

          ${Object.entries(groupedResponses).map(([category, responses]) => `
            <div style="margin-bottom: 28px;">
              <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0;">${category}</h2>
              <div style="background: #ffffff; border-radius: 12px; overflow: hidden;">
                ${(responses as typeof student.responses).map((r, idx) => `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'}; ${idx > 0 ? 'border-top: 1px solid #f1f5f9;' : ''}">
                    <span style="font-size: 14px; color: #475569; font-weight: 400;">${r.questionLabel}</span>
                    <span style="font-size: 14px; font-weight: 600; color: ${r.value ? getValueColor(r.value) : '#94a3b8'}; text-align: right;">${r.value || '—'}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    await appendHtmlToPdf(studentHtml, true);
  }

  // Add page numbers globally (consistent total)
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175);
    pdf.text(`Página ${p} de ${totalPages}`, pdfWidth / 2, pdfHeight - 5, { align: 'center' });
  }

  pdf.save(filename);
};

// MATRIX PDF - High-fidelity heatmap export
async function exportMatrixPDF(analytics: NonNullable<SurveyAnalyticsData>) {
  // Color scale function (0-10 scale)
  const getCellColor = (value: number): string => {
    const percent = Math.max(0, Math.min(100, (value / 10) * 100));
    const hue = (percent / 100) * 120;
    return `hsl(${hue}, 70%, 45%)`;
  };
  
  const getCellBg = (value: number): string => {
    const percent = Math.max(0, Math.min(100, (value / 10) * 100));
    const hue = (percent / 100) * 120;
    return `hsl(${hue}, 70%, 92%)`;
  };

  const students = analytics.responsesByStudent;
  const questions = analytics.allQuestions;
  
  const getScore = (studentId: string, questionKey: string): number | null => {
    const student = students.find(s => s.userId === studentId);
    if (!student) return null;
    const response = student.responses.find(r => r.questionKey === questionKey);
    return response?.numericValue ?? null;
  };
  
  const getQuestionAvg = (questionKey: string): number => {
    const scores = students
      .map(s => getScore(s.userId, questionKey))
      .filter((v): v is number => v !== null);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  };

  // Build student headers
  const studentHeaders = students.map(s => 
    `<th style="text-align: center; padding: 6px 4px; border: 1px solid #e2e8f0; font-weight: 600; color: #374151; min-width: 55px; max-width: 70px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.userName.split(' ').slice(0, 2).join(' ')}</th>`
  ).join('');

  // Build rows
  const rows = questions.map((q, qIdx) => {
    const avg = getQuestionAvg(q.questionKey);
    const cells = students.map(s => {
      const score = getScore(s.userId, q.questionKey);
      if (score === null) {
        return `<td style="text-align: center; padding: 4px; border: 1px solid #e2e8f0; color: #9ca3af;">—</td>`;
      }
      return `<td style="text-align: center; padding: 4px; border: 1px solid #e2e8f0; background: ${getCellBg(score)}; color: ${getCellColor(score)}; font-weight: 700;">${score.toFixed(0)}</td>`;
    }).join('');
    
    return `
      <tr style="background: ${qIdx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: 500; color: #1f2937;">
          <div style="max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${q.questionLabel}">${q.questionLabel}</div>
          <div style="font-size: 8px; color: #9ca3af; margin-top: 2px;">${q.category}</div>
        </td>
        ${cells}
        <td style="text-align: center; padding: 4px; border: 1px solid #e2e8f0; background: ${getCellBg(avg)}; color: ${getCellColor(avg)}; font-weight: 800;">${avg.toFixed(1)}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 24px 32px;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
          <span style="font-size: 28px;">📊</span>
          <h1 style="color: white; font-size: 22px; font-weight: 700; margin: 0;">MATRIZ DE NOTAS - Matriz Completa</h1>
        </div>
        <p style="text-align: center; color: rgba(255,255,255,0.85); font-size: 12px; margin: 8px 0 0 0;">
          Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} • ${students.length} alunos • ${questions.length} perguntas
        </p>
      </div>
      
      <div style="padding: 16px; overflow-x: auto;">
        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-bottom: 12px; font-size: 11px;">
          <span style="color: #6b7280;">Legenda:</span>
          <div style="width: 14px; height: 14px; border-radius: 3px; background: hsl(0, 70%, 50%);"></div>
          <span style="color: #6b7280;">0</span>
          <div style="width: 80px; height: 14px; border-radius: 3px; background: linear-gradient(to right, hsl(0, 70%, 50%), hsl(60, 70%, 50%), hsl(120, 70%, 50%));"></div>
          <div style="width: 14px; height: 14px; border-radius: 3px; background: hsl(120, 70%, 50%);"></div>
          <span style="color: #6b7280;">10</span>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="text-align: left; padding: 8px 6px; border: 1px solid #e2e8f0; font-weight: 600; color: #374151; min-width: 140px; max-width: 180px;">Pergunta</th>
              ${studentHeaders}
              <th style="text-align: center; padding: 6px 4px; border: 1px solid #e2e8f0; font-weight: 700; color: #374151; background: #e0f2fe; min-width: 50px;">Média</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      
      <div style="background: #f8fafc; padding: 12px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="margin: 0; font-size: 10px; color: #94a3b8;">Relatório de Matriz de Notas • Sistema de Pesquisa de Satisfação</p>
      </div>
    </div>
  `;
  
  await createPDFFromHTML(html, `matriz-notas-${new Date().toISOString().split('T')[0]}.pdf`);
}

// TIMING PDF
async function exportTimingPDF(analytics: NonNullable<SurveyAnalyticsData>) {
  const formatTimeFn = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };
  
  const timing = analytics.timingAnalytics;
  const students = analytics.responsesByStudent
    .filter(s => s.totalTimeSeconds !== null && s.totalTimeSeconds !== undefined)
    .sort((a, b) => (a.totalTimeSeconds ?? 0) - (b.totalTimeSeconds ?? 0));

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 24px 32px;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
          <span style="font-size: 28px;">⏱️</span>
          <h1 style="color: white; font-size: 22px; font-weight: 700; margin: 0;">ANÁLISE DE TEMPOS DE RESPOSTA</h1>
        </div>
        <p style="text-align: center; color: rgba(255,255,255,0.85); font-size: 12px; margin: 8px 0 0 0;">
          Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
        </p>
      </div>
      
      <div style="padding: 24px 32px;">
        <!-- Summary Stats -->
        <div style="display: flex; gap: 16px; margin-bottom: 24px;">
          <div style="flex: 1; background: #f1f5f9; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">Menor Tempo</p>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #475569;">${formatTimeFn(timing.minTotalTime)}</p>
          </div>
          <div style="flex: 1; background: #dbeafe; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #1d4ed8;">Tempo Médio</p>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #1d4ed8;">${formatTimeFn(timing.avgTotalTime)}</p>
          </div>
          <div style="flex: 1; background: #f3e8ff; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #7c3aed;">Maior Tempo</p>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #7c3aed;">${formatTimeFn(timing.maxTotalTime)}</p>
          </div>
          <div style="flex: 1; background: #dcfce7; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #16a34a;">Respostas Genuínas</p>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #16a34a;">${timing.genuineCount}</p>
          </div>
          <div style="flex: 1; background: #fee2e2; border-radius: 12px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #dc2626;">Suspeitas/Apressadas</p>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #dc2626;">${timing.suspiciousCount}</p>
          </div>
        </div>
        
        <!-- Student Time Table -->
        <h2 style="font-size: 16px; font-weight: 600; margin: 0 0 12px 0; color: #1f2937;">Tempo por Aluno</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="text-align: left; padding: 10px 12px; border: 1px solid #e2e8f0;">#</th>
              <th style="text-align: left; padding: 10px 12px; border: 1px solid #e2e8f0;">Aluno</th>
              <th style="text-align: center; padding: 10px 12px; border: 1px solid #e2e8f0;">Tempo Total</th>
              <th style="text-align: center; padding: 10px 12px; border: 1px solid #e2e8f0;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${students.map((s, idx) => {
              const time = s.totalTimeSeconds ?? 0;
              const isSuspicious = time < 60;
              return `
                <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #6b7280;">${idx + 1}</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 500;">${s.userName}</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center; font-weight: 600; color: ${isSuspicious ? '#dc2626' : '#059669'};">${formatTimeFn(time)}</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center;">
                    <span style="background: ${isSuspicious ? '#fee2e2' : '#dcfce7'}; color: ${isSuspicious ? '#dc2626' : '#16a34a'}; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 500;">
                      ${isSuspicious ? '⚠️ Apressada' : '✓ Genuína'}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      
      <div style="background: #f8fafc; padding: 12px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="margin: 0; font-size: 10px; color: #94a3b8;">Relatório de Análise de Tempos • Sistema de Pesquisa de Satisfação</p>
      </div>
    </div>
  `;
  
  await createPDFFromHTML(html, `tempos-resposta-${new Date().toISOString().split('T')[0]}.pdf`);
}

// AI INSIGHTS PDF
interface AIInsightsData {
  scoreGeral?: number;
  pontosCriticos?: { area: string; descricao: string; urgencia: string; impacto: string }[];
  acoesSugeridas?: { acao: string; responsavel: string; prazo: string; prioridade: number }[];
  pontosPositivos?: string[];
  analiseGeral?: string;
}

async function exportInsightsPDF(analytics: NonNullable<SurveyAnalyticsData>, insights: AIInsightsData, generatedAt: Date | null) {
  const score = insights.scoreGeral ?? 0;
  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';
  const scoreBg = score >= 80 ? '#dcfce7' : score >= 60 ? '#dbeafe' : score >= 40 ? '#fef3c7' : '#fee2e2';
  
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); padding: 24px 32px;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
          <span style="font-size: 28px;">🤖</span>
          <h1 style="color: white; font-size: 22px; font-weight: 700; margin: 0;">INSIGHTS GERADOS POR IA</h1>
        </div>
        <p style="text-align: center; color: rgba(255,255,255,0.85); font-size: 12px; margin: 8px 0 0 0;">
          Baseado em ${analytics.totalResponses} respostas • ${generatedAt ? `Gerado em ${generatedAt.toLocaleDateString('pt-BR')} às ${generatedAt.toLocaleTimeString('pt-BR')}` : 'Data não disponível'}
        </p>
      </div>
      
      <div style="padding: 24px 32px;">
        <!-- Score Geral -->
        <div style="background: ${scoreBg}; border-radius: 16px; padding: 24px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">Score Geral da Turma</p>
            <p style="margin: 0; font-size: 48px; font-weight: 800; color: ${scoreColor};">${score}/100</p>
          </div>
          <div style="font-size: 48px;">${score >= 80 ? '👍' : score >= 60 ? '📈' : '⚠️'}</div>
        </div>
        
        <!-- Two columns -->
        <div style="display: flex; gap: 24px;">
          <!-- Pontos Críticos -->
          <div style="flex: 1;">
            <h2 style="font-size: 16px; font-weight: 600; margin: 0 0 12px 0; color: #dc2626; display: flex; align-items: center; gap: 8px;">
              ⚠️ Pontos Críticos
              <span style="background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 10px; font-size: 11px;">${insights.pontosCriticos?.length || 0}</span>
            </h2>
            ${insights.pontosCriticos?.map(p => `
              <div style="background: #fef2f2; border-radius: 10px; padding: 12px; margin-bottom: 10px; border-left: 3px solid #dc2626;">
                <div style="display: flex; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
                  <span style="background: #fecaca; color: #991b1b; padding: 2px 8px; border-radius: 8px; font-size: 10px;">${p.area}</span>
                  <span style="background: ${p.urgencia === 'Urgente' ? '#dc2626' : '#f97316'}; color: white; padding: 2px 8px; border-radius: 8px; font-size: 10px;">${p.urgencia}</span>
                  <span style="background: #fee2e2; color: #b91c1c; padding: 2px 8px; border-radius: 8px; font-size: 10px;">Impacto ${p.impacto}</span>
                </div>
                <p style="margin: 0; font-size: 12px; color: #374151;">${p.descricao}</p>
              </div>
            `).join('') || '<p style="color: #6b7280; font-size: 12px;">Nenhum ponto crítico identificado</p>'}
          </div>
          
          <!-- Ações Sugeridas -->
          <div style="flex: 1;">
            <h2 style="font-size: 16px; font-weight: 600; margin: 0 0 12px 0; color: #16a34a; display: flex; align-items: center; gap: 8px;">
              ✅ Ações Sugeridas
              <span style="background: #dcfce7; color: #16a34a; padding: 2px 8px; border-radius: 10px; font-size: 11px;">${insights.acoesSugeridas?.length || 0}</span>
            </h2>
            ${insights.acoesSugeridas?.map((a, idx) => `
              <div style="background: #f0fdf4; border-radius: 10px; padding: 12px; margin-bottom: 10px; border-left: 3px solid #16a34a;">
                <div style="display: flex; align-items: start; gap: 10px;">
                  <span style="background: #16a34a; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0;">${a.prioridade || idx + 1}</span>
                  <div style="flex: 1;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #374151;">${a.acao}</p>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                      <span style="background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 8px; font-size: 10px;">👤 ${a.responsavel}</span>
                      <span style="background: ${a.prazo === 'Imediato' ? '#fef3c7' : '#e0e7ff'}; color: ${a.prazo === 'Imediato' ? '#d97706' : '#4f46e5'}; padding: 2px 8px; border-radius: 8px; font-size: 10px;">📅 ${a.prazo}</span>
                    </div>
                  </div>
                </div>
              </div>
            `).join('') || '<p style="color: #6b7280; font-size: 12px;">Nenhuma ação sugerida</p>'}
          </div>
        </div>
        
        ${insights.pontosPositivos && insights.pontosPositivos.length > 0 ? `
          <!-- Pontos Positivos -->
          <div style="margin-top: 24px;">
            <h2 style="font-size: 16px; font-weight: 600; margin: 0 0 12px 0; color: #059669;">🌟 Pontos Positivos</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${insights.pontosPositivos.map(p => `
                <span style="background: #d1fae5; color: #065f46; padding: 6px 12px; border-radius: 10px; font-size: 12px;">${p}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${insights.analiseGeral ? `
          <!-- Análise Geral -->
          <div style="margin-top: 24px; background: #f8fafc; border-radius: 12px; padding: 16px;">
            <h2 style="font-size: 16px; font-weight: 600; margin: 0 0 8px 0; color: #374151;">📝 Análise Geral</h2>
            <p style="margin: 0; font-size: 13px; color: #4b5563; line-height: 1.6;">${insights.analiseGeral}</p>
          </div>
        ` : ''}
      </div>
      
      <div style="background: #f8fafc; padding: 12px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="margin: 0; font-size: 10px; color: #94a3b8;">Relatório de Insights IA • Sistema de Pesquisa de Satisfação</p>
      </div>
    </div>
  `;
  
  await createPDFFromHTML(html, `insights-ia-${new Date().toISOString().split('T')[0]}.pdf`);
}

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
  // For 0-10 scale, convert to gradient
  const percent = (value / 10) * 100;
  if (percent >= 90) return 'text-emerald-600';
  if (percent >= 70) return 'text-lime-600';
  if (percent >= 50) return 'text-yellow-600';
  if (percent >= 30) return 'text-orange-600';
  return 'text-red-600';
};

const getRatingBgColor = (value: number): string => {
  const percent = (value / 10) * 100;
  if (percent >= 90) return 'bg-emerald-100 border-emerald-200';
  if (percent >= 70) return 'bg-lime-100 border-lime-200';
  if (percent >= 50) return 'bg-yellow-100 border-yellow-200';
  if (percent >= 30) return 'bg-orange-100 border-orange-200';
  return 'bg-red-100 border-red-200';
};

const StarRating = ({ value, max = 10 }: { value: number; max?: number }) => {
  // Display 5 stars but scale value from 0-10 to 0-5
  const scaledValue = (value / max) * 5;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < Math.round(scaledValue)
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
  
  // EXCELLENT - DARK GREEN (truly exceptional)
  const excellentWords = [
    'excelente', 'superou expectativas', 'superou', 'perfeito', 'alta urgência'
  ];
  if (excellentWords.some(w => key.includes(w))) return '#10b981'; // emerald-500
  
  // VERY GOOD - LIGHT GREEN
  const veryGoodWords = [
    'muito bom', 'muito satisfeito', 'mais de 10', 'ótimo'
  ];
  if (veryGoodWords.some(w => key.includes(w))) return '#4ade80'; // green-400 (lighter)
  
  // GOOD - BLUE (met expectations fully)
  const goodWords = [
    'satisfeito', 'adequado', 'bom', 'concordo', 'atendeu plenamente',
    'atendeu totalmente', 'totalmente', 'de 5 a 10', 'suficiente', 
    'média urgência', 'sim', 'mais do que suficiente', 'concordo totalmente'
  ];
  if (goodWords.some(w => key.includes(w))) return '#3b82f6'; // blue-500
  
  // MEDIUM / NEUTRAL - ORANGE (partially met or neutral)
  const mediumWords = [
    'neutro', 'parcialmente', 'atendeu parcialmente', 'regular', 'médio', 
    'até 5', 'razoável', 'moderado', 'indiferente'
  ];
  if (mediumWords.some(w => key.includes(w))) return '#f59e0b'; // amber-500
  
  // BAD / POOR - RED (did not meet)
  const badWords = [
    'insuficiente', 'insatisfeito', 'muito insatisfeito', 'ruim', 'péssimo', 
    'não atendeu', 'discordo', 'fraco', 'baixo', 'nunca', 'sem urgência',
    'não concordo'
  ];
  if (badWords.some(w => key.includes(w))) return '#ef4444'; // red-500
  
  // Default fallback - neutral gray/slate
  return '#64748b'; // slate-500
};

// Possible options for different question types (order matters - best to worst for display)
const OPTION_TEMPLATES: Record<string, string[]> = {
  satisfaction: ['Muito Satisfeito', 'Satisfeito', 'Neutro', 'Insatisfeito', 'Muito Insatisfeito'],
  expectations: ['Superou Expectativas', 'Atendeu Plenamente', 'Atendeu Parcialmente', 'Não Atendeu'],
  time: ['Mais do que suficiente', 'Adequado', 'Insuficiente'],
  quality: ['Excelente', 'Muito Bom', 'Bom', 'Regular', 'Ruim'],
  agreement: ['Concordo Totalmente', 'Concordo', 'Neutro', 'Discordo', 'Discordo Totalmente'],
  level: ['Muito Alto', 'Alto', 'Médio', 'Baixo', 'Muito Baixo'],
  urgency: ['Alta Urgência', 'Média Urgência', 'Sem Urgência'],
  hunger: ['Mais de 10 horas', 'De 5 a 10 horas', 'Até 5 horas'],
  investment: ['Alto Investimento', 'Médio Investimento', 'Baixo Investimento'],
};

// Detect question type from questionKey or category
const detectQuestionType = (question: QuestionRating): string => {
  const key = question.questionKey.toLowerCase();
  const label = question.questionLabel.toLowerCase();
  
  if (key.includes('time') || key.includes('tempo') || label.includes('tempo')) return 'time';
  if (key.includes('expectat') || label.includes('expectativa')) return 'expectations';
  if (key.includes('satisfaction') || key.includes('satisfacao') || label.includes('satisfação')) return 'satisfaction';
  if (key.includes('urgency') || key.includes('urgencia') || label.includes('urgência')) return 'urgency';
  if (key.includes('hunger') || key.includes('fome') || label.includes('fome')) return 'hunger';
  if (key.includes('investment') || key.includes('investimento') || label.includes('investimento')) return 'investment';
  if (key.includes('clarity') || key.includes('clareza') || key.includes('technical') || key.includes('tecnico')) return 'quality';
  
  // Default based on distribution keys present
  const keys = Object.keys(question.distribution).join(' ').toLowerCase();
  if (keys.includes('adequado') || keys.includes('suficiente') || keys.includes('insuficiente')) return 'time';
  if (keys.includes('superou') || keys.includes('atendeu') || keys.includes('plenamente')) return 'expectations';
  if (keys.includes('urgência') || keys.includes('urgencia')) return 'urgency';
  if (keys.includes('satisfeito')) return 'satisfaction';
  if (keys.includes('excelente') || keys.includes('bom') || keys.includes('ruim')) return 'quality';
  
  return 'quality'; // fallback
};

// Inline question card with chart and expandable respondents
function QuestionInlineCard({ 
  question, 
  respondents,
  index
}: { 
  question: QuestionRating;
  respondents?: { name: string; value: string }[];
  index: number;
}) {
  const [showRespondents, setShowRespondents] = useState(false);
  
  // Detect question type and get all possible options
  const safeRespondents = (respondents ?? []).filter((r) => (r.value ?? '').trim() !== "");
  const inferredType = (() => {
    const joined = safeRespondents.map((r) => r.value).join(" ").toLowerCase();
    if (joined.includes('concordo') || joined.includes('discordo')) return 'agreement';
    if (joined.includes('superou') || joined.includes('atendeu')) return 'expectations';
    if (joined.includes('satisfeito')) return 'satisfaction';
    if (joined.includes('suficiente') || joined.includes('adequado') || joined.includes('insuficiente')) return 'time';
    if (joined.includes('excelente') || joined.includes('muito bom') || joined.includes('regular') || joined.includes('ruim')) return 'quality';
    return null;
  })();
  const questionType = inferredType ?? detectQuestionType(question);
  const allOptions = OPTION_TEMPLATES[questionType] || [];
  
  // Build distribution primarily from actual textual answers (respondents), falling back to precomputed distribution
  // Enhanced normalization: handles underscores, case differences, and accents
  const normalizeText = (s: string) =>
    s.toLowerCase()
      .replace(/_/g, ' ')  // Convert underscores to spaces (muito_satisfeito → muito satisfeito)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const distributionData = (() => {
    // Prefer respondents because some questions store distribution as numeric keys (0..10) but UI expects textual options.
    if (safeRespondents.length > 0) {
      const counts: Record<string, number> = {};
      const extras: string[] = [];

      const matchOption = (value: string) => {
        const nv = normalizeText(value);
        // First try exact match
        const exactMatch = allOptions.find((opt) => normalizeText(opt) === nv);
        if (exactMatch) return exactMatch;
        // Then try partial match, but prefer shorter matches to avoid "Bom" matching "Muito Bom"
        return allOptions
          .filter((opt) => {
            const no = normalizeText(opt);
            return no.includes(nv) || nv.includes(no);
          })
          .sort((a, b) => a.length - b.length)[0];
      };

      for (const r of safeRespondents) {
        const raw = (r.value ?? '').trim();
        if (!raw) continue;

        const matched = allOptions.length > 0 ? matchOption(raw) : undefined;
        const label = matched ?? raw;
        counts[label] = (counts[label] ?? 0) + 1;

        if (!matched && allOptions.length > 0) {
          const exists = extras.some((e) => normalizeText(e) === normalizeText(raw));
          if (!exists) extras.push(raw);
        }
      }

      const displayOptions = allOptions.length > 0
        ? [...allOptions, ...extras]
        : Object.keys(counts).sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0));

      // Standard semantic colors: green=excellent, blue=good, yellow=neutral, red=bad
      const getSatisfactionColor = (label: string) => {
        const norm = normalizeText(label);
        if (norm.includes('muito satisfeito') || norm.includes('excelente')) return '#10b981'; // green
        if (norm.includes('satisfeito') || norm.includes('bom')) return '#3b82f6'; // blue
        if (norm.includes('neutro') || norm.includes('regular') || norm.includes('parcial')) return '#eab308'; // yellow
        if (norm.includes('insatisfeito') || norm.includes('ruim')) return '#ef4444'; // red
        return getSemanticColor(label);
      };

      return displayOptions.map((label) => ({
        name: label,
        value: counts[label] ?? 0,
        fill: getSatisfactionColor(label),
      }));
    }

    // Fallback: use question.distribution as-is
    if (allOptions.length > 0) {
      return allOptions.map((option) => {
        const normalizedOption = normalizeText(option);
        const matchingKey = Object.keys(question.distribution).find((key) => {
          const normalizedKey = normalizeText(key);
          return normalizedKey.includes(normalizedOption) || normalizedOption.includes(normalizedKey);
        });

        return {
          name: matchingKey || option,
          value: matchingKey ? question.distribution[matchingKey] : 0,
          fill: getSemanticColor(option),
        };
      });
    }

    return Object.entries(question.distribution).map(([key, value]) => ({
      name: key,
      value,
      fill: getSemanticColor(key),
    }));
  })();

  const totalResponses = safeRespondents.length > 0
    ? safeRespondents.length
    : distributionData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="border hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[10px] shrink-0">
                {question.category}
              </Badge>
              <span className="text-[10px] text-muted-foreground">#{index + 1}</span>
            </div>
            <CardTitle className="text-sm font-medium leading-tight">
              {question.questionLabel}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {totalResponses} respostas
              </span>
            </div>
          </div>
          <div 
            className="px-3 py-1.5 rounded-lg font-bold text-lg shrink-0"
            style={{ 
              backgroundColor: getGradientBgStyle(question.avgRating, 0, 10),
              color: getGradientColorStyle(question.avgRating, 0, 10)
            }}
          >
            {question.avgRating.toFixed(1)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        {/* Only show chart when there are responses */}
        {totalResponses > 0 ? (
          <>
            {/* Pie chart with percentages */}
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="w-full lg:w-1/2">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={distributionData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {distributionData.filter(d => d.value > 0).map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number, name: string) => [
                        `${value} (${((value / totalResponses) * 100).toFixed(0)}%)`, 
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend with percentages */}
              <div className="w-full lg:w-1/2 space-y-1">
                {distributionData.map((item, idx) => {
                  const percent = totalResponses > 0 ? ((item.value / totalResponses) * 100).toFixed(0) : '0';
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="truncate text-muted-foreground">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-semibold" style={{ color: item.fill }}>
                          {percent}%
                        </span>
                        <span className="text-muted-foreground text-[10px]">
                          ({item.value})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Sem respostas ainda</p>
          </div>
        )}

        {/* Button to show respondents */}
        {respondents && respondents.length > 0 && (
          <div className="mt-3 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs h-7"
              onClick={() => setShowRespondents(!showRespondents)}
            >
              <Eye className="h-3 w-3 mr-1.5" />
              {showRespondents ? 'Ocultar' : 'Ver'} votos individuais ({respondents.length})
            </Button>
            
            {showRespondents && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {respondents.map((r, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-1.5 rounded text-xs ${
                      idx % 2 === 0 ? 'bg-muted/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-medium text-primary">
                          {r.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="truncate">{r.name}</span>
                    </div>
                    <Badge 
                      variant="secondary"
                      className="text-[9px] shrink-0 ml-1"
                      style={{
                        backgroundColor: `${getSemanticColor(r.value)}20`,
                        color: getSemanticColor(r.value)
                      }}
                    >
                      {r.value || '—'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Keep old component for backward compatibility if needed elsewhere
function QuestionDetailView({ 
  question, 
  respondents 
}: { 
  question: QuestionRating;
  respondents?: { name: string; value: string }[];
}) {
  return <QuestionInlineCard question={question} respondents={respondents} index={0} />;
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
          <Badge 
            className="font-bold text-base px-3"
            style={{ 
              backgroundColor: getGradientBgStyle(student.overallScore, 0, 10),
              color: getGradientColorStyle(student.overallScore, 0, 10)
            }}
          >
            {student.overallScore.toFixed(1)}
          </Badge>
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
  // Filter states
  const [dayFilter, setDayFilter] = useState<DayFilter>('global');
  const [classFilter, setClassFilter] = useState<string>(classId || 'all');
  
  // Fetch all classes for the filter dropdown
  const { data: allClasses } = useQuery({
    queryKey: ['all-classes-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_classes')
        .select('id, name, code')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
  
  // Determine effective classId based on filter
  const effectiveClassId = classFilter === 'all' ? null : classFilter;
  const isGlobalMode = classFilter === 'all';
  
  // Use analytics hook
  const { data: analytics, isLoading, error } = useSurveyAnalytics(
    effectiveClassId,
    { globalMode: isGlobalMode }
  );
  
  const [questionSearch, setQuestionSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionRating | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetailedResponse | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentSortBy, setStudentSortBy] = useState<'name' | 'score' | 'date'>('name');
  const [questionSortBy, setQuestionSortBy] = useState<'original' | 'name' | 'score'>('original');
  const [isExporting, setIsExporting] = useState(false);
  const [showQuestionsManager, setShowQuestionsManager] = useState(false);
  const [exportingTab, setExportingTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // AI Insights state
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [aiInsightsGeneratedAt, setAiInsightsGeneratedAt] = useState<Date | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Load persisted AI insights on mount
  useEffect(() => {
    const loadPersistedInsights = async () => {
      if (!classId) return;
      
      try {
        const { data, error } = await supabase
          .from('survey_ai_insights')
          .select('insights, generated_at')
          .eq('class_id', classId)
          .maybeSingle();
        
        if (error) {
          console.error('Error loading persisted insights:', error);
          return;
        }
        
        if (data) {
          setAiInsights(data.insights);
          setAiInsightsGeneratedAt(new Date(data.generated_at));
        }
      } catch (err) {
        console.error('Error loading insights:', err);
      }
    };
    
    loadPersistedInsights();
  }, [classId]);
  
  // Drill-down dialog state
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownData, setDrilldownData] = useState<DrilldownData | null>(null);
  
  // Matrix sorting state
  const [matrixSortColumn, setMatrixSortColumn] = useState<string | null>(null); // 'avg' or student.userId or 'question'
  const [matrixSortDir, setMatrixSortDir] = useState<'asc' | 'desc'>('desc');
  
  // Accepted suspicious responses (persisted in localStorage)
  const [acceptedSuspiciousResponses, setAcceptedSuspiciousResponses] = useState<string[]>(() => {
    const storageKey = `accepted-suspicious-${classId || 'all'}`;
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  });
  
  // Persist accepted responses to localStorage
  useEffect(() => {
    const storageKey = `accepted-suspicious-${classFilter || 'all'}`;
    localStorage.setItem(storageKey, JSON.stringify(acceptedSuspiciousResponses));
  }, [acceptedSuspiciousResponses, classFilter]);
  
  const handleAcceptSuspiciousResponse = (userId: string) => {
    setAcceptedSuspiciousResponses(prev => [...prev, userId]);
    toast.success('Resposta aceita como válida');
  };

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

  const handleExportPDF = async (tab: 'overview' | 'ranking' | 'questions' | 'students' | 'matrix' | 'timing' | 'insights') => {
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
        case 'matrix':
          await exportMatrixPDF(analytics);
          break;
        case 'timing':
          await exportTimingPDF(analytics);
          break;
        case 'insights':
          if (aiInsights) await exportInsightsPDF(analytics, aiInsights, aiInsightsGeneratedAt);
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
      const generatedAt = new Date();
      setAiInsightsGeneratedAt(generatedAt);
      
      // Persist insights to database
      if (classId) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
          .from('survey_ai_insights')
          .upsert({
            class_id: classId,
            insights: data.insights,
            generated_at: generatedAt.toISOString(),
            generated_by: user?.id || null,
          }, { onConflict: 'class_id' });
      }
      
      toast.success("Insights gerados com sucesso!");
    } catch (err) {
      console.error("Error generating insights:", err);
      toast.error("Erro ao gerar insights. Tente novamente.");
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Reusable filter component
  const SurveyFilterBar = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <FileText className="h-4 w-4" />
        Filtros:
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {/* Day Filter */}
        <Select value={dayFilter} onValueChange={(v) => setDayFilter(v as DayFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o dia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="global">🌐 Resumo Global</SelectItem>
            <SelectItem value="day1">📋 Pesquisa Dia 1</SelectItem>
            <SelectItem value="day2">📊 Pesquisa Dia 2</SelectItem>
            <SelectItem value="day3">🏆 Pesquisa Final (Dia 3)</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Class Filter */}
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Selecione a turma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">🌐 Todas as turmas</SelectItem>
            {allClasses?.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.code} - {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // For Day 2, we'll show both the lead ranking AND the standard analytics
  // The useSurveyAnalytics hook handles day1 data, so for day2 we need a different approach
  // Show the lead ranking section within the main dashboard instead of replacing it entirely

  if (isLoading && dayFilter === 'day1') {
    return (
      <div className="space-y-4">
        <SurveyFilterBar />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  // For Global Summary, show consolidated dashboard
  if (dayFilter === 'global') {
    return (
      <div className="space-y-4">
        <SurveyFilterBar />
        <GlobalSurveyDashboard classId={effectiveClassId} />
      </div>
    );
  }

  // For Day 2, show the full dashboard with all 7 tabs
  if (dayFilter === 'day2') {
    return (
      <div className="space-y-4">
        <SurveyFilterBar />
        <Day2SurveyFullDashboard classId={effectiveClassId} />
      </div>
    );
  }

  // For Day 3 (Final Survey), show the full dashboard
  if (dayFilter === 'day3') {
    return (
      <div className="space-y-4">
        <SurveyFilterBar />
        <Day3SurveyFullDashboard classId={effectiveClassId} />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="space-y-4">
        <SurveyFilterBar />
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <h3 className="font-semibold mb-1">Nenhuma resposta ainda</h3>
            <p className="text-sm">
              {isGlobalMode 
                ? 'Nenhuma pesquisa de satisfação foi respondida em nenhuma turma.' 
                : 'As respostas da pesquisa de satisfação aparecerão aqui.'}
            </p>
          </div>
        </Card>
      </div>
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

  // Build monitor radar data from all available monitors (dynamic from monitorsByName)
  // NOTE: Dr. Eder and Dr. Eder M are the same person - merge their data
  const MONITOR_COLORS = [
    { key: 'eder', name: 'Dr. Eder', stroke: 'hsl(262, 83%, 58%)', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
    { key: 'patrickM', name: 'Dr. Patrick M', stroke: 'hsl(25, 95%, 53%)', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
    { key: 'gleyldes', name: 'Dra. Gleyldes', stroke: 'hsl(330, 80%, 50%)', bg: 'bg-pink-50 dark:bg-pink-950/30', border: 'border-pink-200 dark:border-pink-800', text: 'text-pink-700 dark:text-pink-400', dot: 'bg-pink-500' },
    { key: 'elenilton', name: 'Dr. Elenilton', stroke: 'hsl(190, 70%, 45%)', bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-700 dark:text-cyan-400', dot: 'bg-cyan-500' },
  ];

  // Helper to merge two monitor metrics by averaging
  const mergeMonitorMetrics = (m1: any, m2: any) => {
    if (!m1) return m2;
    if (!m2) return m1;
    return {
      avgTechnical: (m1.avgTechnical + m2.avgTechnical) / 2,
      avgInterest: (m1.avgInterest + m2.avgInterest) / 2,
      avgEngagement: (m1.avgEngagement + m2.avgEngagement) / 2,
      avgPosture: (m1.avgPosture + m2.avgPosture) / 2,
      avgCommunication: (m1.avgCommunication + m2.avgCommunication) / 2,
      avgContribution: (m1.avgContribution + m2.avgContribution) / 2,
      overallAvg: (m1.overallAvg + m2.overallAvg) / 2,
    };
  };

  // Merge Eder and Eder M into single "Dr. Eder"
  const mergedEderMetrics = mergeMonitorMetrics(analytics.monitors.eder, analytics.monitors.ederM);

  // Build monitors data with merged Eder
  const fixedMonitorsData = [
    { ...MONITOR_COLORS[0], metrics: mergedEderMetrics },  // Dr. Eder (merged with Eder M)
    { ...MONITOR_COLORS[1], metrics: analytics.monitors.patrickM },
    { ...MONITOR_COLORS[2], metrics: analytics.monitors.gleyldes },
    { ...MONITOR_COLORS[3], metrics: analytics.monitors.elenilton },
  ].filter(m => m.metrics && !isNaN(m.metrics.overallAvg) && m.metrics.overallAvg > 0);

  // Add monitors from monitorsByName (excluding Eder M since it's merged)
  const dynamicMonitors = Object.entries(analytics.monitorsByName || {})
    .filter(([name, metrics]) => {
      const normalized = name.toLowerCase();
      // Skip Eder M since we merged it into Eder
      if (normalized.includes('eder m') || normalized === 'dr. eder m') return false;
      return metrics && !isNaN(metrics.overallAvg) && metrics.overallAvg > 0;
    })
    .map(([name, metrics]) => {
      const normalized = name.toLowerCase();
      const colorConfig = MONITOR_COLORS.find(c => normalized.includes(c.key)) || 
        { key: name, name, stroke: 'hsl(220, 70%, 50%)', bg: 'bg-slate-50 dark:bg-slate-950/30', border: 'border-slate-200 dark:border-slate-800', text: 'text-slate-700 dark:text-slate-400', dot: 'bg-slate-500' };
      return { ...colorConfig, name, metrics };
    });

  // Combine and dedupe by key - prioritize dynamic data
  const allMonitorsUnsorted = [...fixedMonitorsData];
  dynamicMonitors.forEach(dm => {
    const dmNameNormalized = dm.name.toLowerCase().replace(/[^a-z]/g, '');
    const existingIdx = allMonitorsUnsorted.findIndex(m => {
      const mNameNormalized = m.name.toLowerCase().replace(/[^a-z]/g, '');
      return mNameNormalized === dmNameNormalized || m.key === dm.key;
    });
    if (existingIdx === -1) {
      allMonitorsUnsorted.push(dm);
    } else {
      allMonitorsUnsorted[existingIdx] = { ...allMonitorsUnsorted[existingIdx], metrics: dm.metrics, name: dm.name };
    }
  });

  // SORT by average score (highest first) - RANKING
  const allMonitors = allMonitorsUnsorted.sort((a, b) => 
    (b.metrics?.overallAvg || 0) - (a.metrics?.overallAvg || 0)
  );

  // Build radar data with all monitors
  const monitorRadarData = [
    { metric: 'Técnica', ...Object.fromEntries(allMonitors.map(m => [m.name, m.metrics?.avgTechnical || 0])) },
    { metric: 'Interesse', ...Object.fromEntries(allMonitors.map(m => [m.name, m.metrics?.avgInterest || 0])) },
    { metric: 'Engajamento', ...Object.fromEntries(allMonitors.map(m => [m.name, m.metrics?.avgEngagement || 0])) },
    { metric: 'Postura', ...Object.fromEntries(allMonitors.map(m => [m.name, m.metrics?.avgPosture || 0])) },
    { metric: 'Comunicação', ...Object.fromEntries(allMonitors.map(m => [m.name, m.metrics?.avgCommunication || 0])) },
    { metric: 'Contribuição', ...Object.fromEntries(allMonitors.map(m => [m.name, m.metrics?.avgContribution || 0])) },
  ];

  const wordFrequency = getWordFrequency([
    ...analytics.openFeedback.likedMost.map(f => f.text), 
    ...analytics.openFeedback.suggestions.map(f => f.text)
  ]);

  // Filter questions
  const categories = [...new Set(analytics.allQuestions.map(q => q.category))];
  const filteredQuestions = analytics.allQuestions
    .filter(q => {
      const matchesSearch = q.questionLabel.toLowerCase().includes(questionSearch.toLowerCase());
      const matchesCategory = categoryFilter === "all" || q.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (questionSortBy) {
        case 'name':
          return a.questionLabel.localeCompare(b.questionLabel, 'pt-BR');
        case 'score':
          return b.avgRating - a.avgRating; // Highest first
        case 'original':
        default:
          return 0; // Keep original order from analytics
      }
    });

  // Filter and sort students
  const filteredStudents = analytics.responsesByStudent
    .filter(s => s.userName.toLowerCase().includes(studentSearch.toLowerCase()))
    .sort((a, b) => {
      switch (studentSortBy) {
        case 'name':
          return a.userName.localeCompare(b.userName, 'pt-BR');
        case 'score':
          return b.overallScore - a.overallScore; // Highest first
        case 'date':
          // Sort by completedAt (most recent first), incomplete surveys at the end
          if (!a.completedAt && !b.completedAt) return 0;
          if (!a.completedAt) return 1;
          if (!b.completedAt) return -1;
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
        default:
          return 0;
      }
    });

  // Format time helper
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <>
    <SurveyQuestionsManager open={showQuestionsManager} onOpenChange={setShowQuestionsManager} />
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      {/* Sticky header with filter bar and tabs */}
      <div className="sticky top-0 z-30 bg-background pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 pt-1 border-b">
        {/* Survey Filter Bar */}
        <SurveyFilterBar />

        <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
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
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => printCurrentView('Relatório de Pesquisa de Satisfação')} 
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                const TAB_NAMES_DAY1: Record<string, string> = {
                  overview: 'Visão Geral',
                  matrix: 'Matriz',
                  ranking: 'Ranking',
                  questions: 'Perguntas',
                  students: 'Alunos',
                  timing: 'Tempos',
                  insights: 'Insights IA',
                };
                await exportAllTabsToPdf({
                  tabs: ['overview', 'matrix', 'ranking', 'questions', 'students', 'timing', 'insights'],
                  tabNames: TAB_NAMES_DAY1,
                  setActiveTab,
                  setIsExporting,
                  filename: 'Pesquisa-Dia1-Completa',
                });
              }}
              className="gap-2"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <FileStack className="h-4 w-4" />
                  Exportar Tudo (PDF)
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowQuestionsManager(true)} className="gap-2">
              <Settings2 className="h-4 w-4" />
              Gerenciar Perguntas
            </Button>
          </div>
        </div>
      </div>

      {/* ============== MATRIX HEATMAP TAB ============== */}
      <TabsContent value="matrix" className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5 text-primary" />
                  MATRIZ DE NOTAS
                </CardTitle>
                <CardDescription>
                  Visualize todas as notas por aluno e pergunta em formato de matriz
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF('matrix')}
                  disabled={exportingTab === 'matrix'}
                  className="gap-2"
                >
                  {exportingTab === 'matrix' ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Baixar PDF
                </Button>
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
                  
                  // Sort questions - FILTER OUT QUESTIONS WITH NO DATA
                  const questionsWithData = analytics.allQuestions.filter(q => {
                    const hasAnyData = analytics.responsesByStudent.some(s => {
                      const response = s.responses.find(r => r.questionKey === q.questionKey);
                      return response?.numericValue !== null && response?.numericValue !== undefined;
                    });
                    return hasAnyData;
                  });
                  
                  const sortedQuestions = [...questionsWithData].sort((a, b) => {
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
                        className="text-left p-2 font-semibold border-b min-w-[200px] sticky left-0 bg-muted z-20 cursor-pointer hover:bg-muted/90"
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
                          <td className="p-2 border-b font-medium sticky left-0 z-10 bg-background dark:bg-background">
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
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleExportPDF('insights')}
                  disabled={exportingTab === 'insights'}
                  className="gap-2"
                >
                  {exportingTab === 'insights' ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Gerando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Exportar PDF
                    </>
                  )}
                </Button>
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

            {/* Grid Pontos Críticos + Ações Sugeridas */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pontos Críticos */}
              {aiInsights.pontosCriticos && aiInsights.pontosCriticos.length > 0 && (
                <Card className="border-red-300 bg-red-50/60 dark:bg-red-950/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <CardTitle className="text-base text-red-700 dark:text-red-400">Pontos Críticos</CardTitle>
                      <Badge className="bg-red-200 text-red-800 border-red-300">{aiInsights.pontosCriticos.length}</Badge>
                    </div>
                    <CardDescription>Áreas que precisam de atenção imediata</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[...aiInsights.pontosCriticos]
                      .sort((a: any, b: any) => {
                        const impactOrder: Record<string, number> = { alto: 0, medio: 1, baixo: 2 };
                        return (impactOrder[a.impacto] ?? 3) - (impactOrder[b.impacto] ?? 3);
                      })
                      .map((ponto: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-white dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300">
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
                  </CardContent>
                </Card>
              )}

              {/* Ações Sugeridas */}
              {aiInsights.acoesSugeridas && aiInsights.acoesSugeridas.length > 0 && (
                <Card className="border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-emerald-600" />
                      <CardTitle className="text-base text-emerald-700 dark:text-emerald-400">Ações Sugeridas</CardTitle>
                      <Badge className="bg-emerald-200 text-emerald-800 border-emerald-300">{aiInsights.acoesSugeridas.length}</Badge>
                    </div>
                    <CardDescription>Passos concretos para melhorar a experiência</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[...aiInsights.acoesSugeridas]
                      .sort((a: any, b: any) => {
                        const prazoOrder: Record<string, number> = { imediato: 0, proximo_dia: 1, fim_curso: 2 };
                        return (prazoOrder[a.prazo] ?? 3) - (prazoOrder[b.prazo] ?? 3);
                      })
                      .slice(0, 8)
                      .map((acao: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-white dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-200 text-emerald-700 font-bold text-sm shrink-0">
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
                                  acao.prazo === 'imediato' ? 'bg-red-100 text-red-600 border-red-300' :
                                  acao.prazo === 'proximo_dia' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                  'bg-blue-100 text-blue-600 border-blue-300'
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
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Pontos Fortes */}
              {aiInsights.pontosFortes && aiInsights.pontosFortes.length > 0 && (
                <Card className="border-blue-300 bg-blue-50/60 dark:bg-blue-950/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-base text-blue-700 dark:text-blue-400">Pontos Fortes</CardTitle>
                      <Badge className="bg-blue-200 text-blue-800 border-blue-300">{aiInsights.pontosFortes.length}</Badge>
                    </div>
                    <CardDescription>Destaques positivos do curso</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {aiInsights.pontosFortes.map((ponto: string, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-white dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 shadow-sm">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                          <p className="text-sm">{ponto}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Tendências */}
              {aiInsights.tendencias && aiInsights.tendencias.length > 0 && (
                <Card className="border-purple-300 bg-purple-50/60 dark:bg-purple-950/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <CardTitle className="text-base text-purple-700 dark:text-purple-400">Tendências Identificadas</CardTitle>
                      <Badge className="bg-purple-200 text-purple-800 border-purple-300">{aiInsights.tendencias.length}</Badge>
                    </div>
                    <CardDescription>Padrões observados nas respostas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {aiInsights.tendencias.map((tendencia: string, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-white dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 shadow-sm">
                        <div className="flex items-start gap-3">
                          <Zap className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                          <p className="text-sm">{tendencia}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Resumo Executivo - junto com os demais resumos */}
            {aiInsights.resumoExecutivo && (
              <Card className="border-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                    <FileText className="h-5 w-5" />
                    Resumo Executivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm leading-relaxed">{aiInsights.resumoExecutivo}</p>
                </CardContent>
              </Card>
            )}

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
        
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Users className="h-5 w-5 text-blue-600" />
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
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
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
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  analytics.overallSatisfactionPercent >= 80 ? 'bg-emerald-500/20' : analytics.overallSatisfactionPercent >= 60 ? 'bg-yellow-500/20' : 'bg-red-500/20'
                }`}>
                  <TrendingUp className={`h-5 w-5 ${
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
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{analytics.overallSatisfaction.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Nota Média</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suspicious Responses Alert */}
        {(() => {
          // Detect suspicious responses: very fast completion OR all same answers
          const suspiciousResponses = analytics.responsesByStudent.filter(student => {
            // Check 1: Very low credibility (fast completion)
            const isFastCompletion = student.credibilityLevel === 'suspicious' || student.credibilityLevel === 'low';
            
            // Check 2: All answers are the same (uniform pattern)
            const numericResponses = student.responses
              .filter(r => r.numericValue !== null)
              .map(r => r.numericValue as number);
            
            const allSamePositive = numericResponses.length >= 5 && numericResponses.every(v => v >= 9);
            const allSameNegative = numericResponses.length >= 5 && numericResponses.every(v => v <= 2.5);
            const isUniformPattern = allSamePositive || allSameNegative;
            
            return isFastCompletion || isUniformPattern;
          })
          // Filter out accepted responses
          .filter(student => !acceptedSuspiciousResponses.includes(student.userId));

          if (suspiciousResponses.length === 0) return null;

          return (
            <Card className="border-amber-400 bg-amber-50/80 dark:bg-amber-950/40">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <CardTitle className="text-base text-amber-800 dark:text-amber-300">
                      Respostas Potencialmente Inválidas
                    </CardTitle>
                    <Badge className="bg-amber-200 text-amber-800 border-amber-400">{suspiciousResponses.length}</Badge>
                  </div>
                </div>
                <CardDescription className="text-amber-700 dark:text-amber-400">
                  Detectamos respostas que podem ser testes (preenchimento muito rápido ou padrão uniforme). 
                  Revise e exclua para não distorcer os dados.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {suspiciousResponses.map(student => {
                    // Determine reasons
                    const reasons: string[] = [];
                    if (student.credibilityLevel === 'suspicious') {
                      reasons.push(`⚡ Muito rápido (${student.avgTimePerQuestion || 0}s/pergunta)`);
                    } else if (student.credibilityLevel === 'low') {
                      reasons.push(`⏱️ Tempo baixo (${student.avgTimePerQuestion || 0}s/pergunta)`);
                    }
                    
                    const numericResponses = student.responses
                      .filter(r => r.numericValue !== null)
                      .map(r => r.numericValue as number);
                    const allPositive = numericResponses.length >= 5 && numericResponses.every(v => v >= 9);
                    const allNegative = numericResponses.length >= 5 && numericResponses.every(v => v <= 2.5);
                    if (allPositive) reasons.push('✅ Todas respostas positivas (máximo)');
                    if (allNegative) reasons.push('❌ Todas respostas negativas (mínimo)');

                    return (
                      <div 
                        key={student.userId} 
                        className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700/50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-amber-300">
                            <AvatarFallback className="text-xs bg-amber-100 text-amber-700">
                              {student.userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{student.userName}</p>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {reasons.map((reason, i) => (
                                <Badge 
                                  key={i} 
                                  variant="outline" 
                                  className="text-[10px] bg-amber-100/80 text-amber-700 border-amber-300"
                                >
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              student.overallScore >= 9 ? 'bg-emerald-100 text-emerald-700' :
                              student.overallScore <= 3 ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-700'
                            }`}
                          >
                            Nota: {student.overallScore.toFixed(1)}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => handleAcceptSuspiciousResponse(student.userId)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Aceitar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={async () => {
                              if (!confirm(`Excluir resposta de "${student.userName}"? Esta ação não pode ser desfeita.`)) return;
                              
                              try {
                                const { error } = await supabase
                                  .from('day1_satisfaction_surveys')
                                  .delete()
                                  .eq('user_id', student.userId)
                                  .eq('class_id', classId);
                                
                                if (error) throw error;
                                
                                toast.success(`Resposta de ${student.userName} excluída`);
                                // Trigger refetch
                                window.location.reload();
                              } catch (err) {
                                console.error('Error deleting survey:', err);
                                toast.error('Erro ao excluir resposta');
                              }
                            }}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })()}

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
                {(() => {
                  // Color by score ranges: 0-6.99 red, 7-7.99 yellow, 8-10 green
                  const getBarColor = (value: number): string => {
                    if (value >= 8) return '#22c55e'; // green-500
                    if (value >= 7) return '#eab308'; // yellow-500
                    return '#ef4444'; // red-500
                  };
                  
                  const getScoreColor = (value: number) => {
                    // 0-6.99 = red, 7-7.99 = yellow, 8-10 = green
                    if (value >= 8) {
                      return {
                        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                        text: 'text-emerald-700 dark:text-emerald-400',
                        border: 'border-emerald-200 dark:border-emerald-800',
                      };
                    } else if (value >= 7) {
                      return {
                        bg: 'bg-amber-100 dark:bg-amber-900/30',
                        text: 'text-amber-700 dark:text-amber-400',
                        border: 'border-amber-200 dark:border-amber-800',
                      };
                    } else {
                      return {
                        bg: 'bg-red-100 dark:bg-red-900/30',
                        text: 'text-red-700 dark:text-red-400',
                        border: 'border-red-200 dark:border-red-800',
                      };
                    }
                  };
                  
                  const avgColor = getScoreColor(infrastructureAvg);
                  
                  return (
                    <>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart 
                          data={infrastructureRadarData}
                          margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
                        >
                          <XAxis 
                            dataKey="metric" 
                            tick={{ fontSize: 11, fontWeight: 500 }}
                            angle={-35}
                            textAnchor="end"
                            interval={0}
                            height={70}
                          />
                          <YAxis 
                            domain={[0, 10]} 
                            tick={{ fontSize: 11 }}
                            tickCount={6}
                          />
                          <Tooltip 
                            formatter={(value: number) => [value.toFixed(2), 'Média']}
                            contentStyle={{ borderRadius: 8 }}
                          />
                          <Bar 
                            dataKey="value" 
                            radius={[6, 6, 0, 0]}
                            maxBarSize={50}
                          >
                            {infrastructureRadarData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
                            ))}
                            <LabelList 
                              dataKey="value" 
                              position="top" 
                              formatter={(value: number) => value.toFixed(1)}
                              style={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--foreground))' }}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-3 w-full lg:w-[240px] flex-shrink-0">
                        <div className={`p-4 rounded-xl ${avgColor.bg} border ${avgColor.border}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Target className={`h-4 w-4 ${avgColor.text}`} />
                            <span className={`font-semibold ${avgColor.text}`}>Média Geral</span>
                          </div>
                          <div className={`text-3xl font-bold ${avgColor.text}`}>
                            {infrastructureAvg.toFixed(1)}/10
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Todas as dimensões</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {infrastructureRadarData.map((d, i) => {
                            const color = getScoreColor(d.value);
                            return (
                              <div key={i} className={`p-2 rounded-lg ${color.bg} border ${color.border} text-center`}>
                                <div className={`text-lg font-bold ${color.text}`}>{d.value.toFixed(1)}</div>
                                <p className="text-[10px] text-muted-foreground truncate">{d.metric}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Instructor Comparison - Ranking Cards with Scores */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Comparação de Professores
              </CardTitle>
              <CardDescription>Avaliação comparativa entre Dr. Patrick e Dr. Hygor</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Ranking Cards - Ordered by Score (highest first) */}
              {(() => {
                const patrickAvg = analytics.instructors.patrick.overallAvg;
                const hygorAvg = analytics.instructors.hygor.overallAvg;
                const patrickIsFirst = patrickAvg >= hygorAvg;
                
                const instructors = [
                  {
                    name: 'Dr. Patrick',
                    avg: patrickAvg,
                    expectations: analytics.instructors.patrick.avgExpectations,
                    clarity: analytics.instructors.patrick.avgClarity,
                    time: analytics.instructors.patrick.avgTime,
                    color: 'emerald',
                    isFirst: patrickIsFirst,
                  },
                  {
                    name: 'Dr. Hygor',
                    avg: hygorAvg,
                    expectations: analytics.instructors.hygor.avgExpectations,
                    clarity: analytics.instructors.hygor.avgClarity,
                    time: analytics.instructors.hygor.avgTime,
                    color: 'blue',
                    isFirst: !patrickIsFirst,
                  },
                ].sort((a, b) => b.avg - a.avg);

                return (
                  <div className="grid md:grid-cols-2 gap-6">
                    {instructors.map((instructor, index) => (
                      <div 
                        key={instructor.name}
                        className={`p-5 rounded-xl border relative transition-all ${
                          index === 0 
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 ring-2 ring-emerald-300 dark:ring-emerald-700' 
                            : 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {index === 0 && (
                          <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-md">
                            1º
                          </div>
                        )}
                        {index === 1 && (
                          <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-slate-400 text-white flex items-center justify-center text-xs font-bold shadow-md">
                            2º
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mb-4 ml-2">
                          <div className={`w-3 h-3 rounded-full ${instructor.color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                          <span className={`font-semibold text-lg ${instructor.color === 'emerald' ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-700 dark:text-blue-400'}`}>
                            {instructor.name}
                          </span>
                        </div>
                        
                        <div className={`text-3xl font-bold ml-2 mb-4 ${index === 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                          {instructor.avg.toFixed(1)}/10
                          <span className="text-sm font-normal text-muted-foreground ml-2">Média Geral</span>
                        </div>
                        
                        {/* Individual Scores Table */}
                        <div className="space-y-2 ml-2">
                          <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-sm text-muted-foreground">Expectativas</span>
                            <span className={`font-bold ${instructor.expectations >= 8 ? 'text-emerald-600' : instructor.expectations >= 7 ? 'text-amber-600' : 'text-red-600'}`}>
                              {instructor.expectations.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-sm text-muted-foreground">Clareza</span>
                            <span className={`font-bold ${instructor.clarity >= 8 ? 'text-emerald-600' : instructor.clarity >= 7 ? 'text-amber-600' : 'text-red-600'}`}>
                              {instructor.clarity.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-muted-foreground">Tempo</span>
                            <span className={`font-bold ${instructor.time >= 8 ? 'text-emerald-600' : instructor.time >= 7 ? 'text-amber-600' : 'text-red-600'}`}>
                              {instructor.time.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <ChartExecutiveSummary 
                insights={generateInstructorInsight(
                  { name: 'Dr. Patrick', avg: analytics.instructors.patrick.overallAvg },
                  { name: 'Dr. Hygor', avg: analytics.instructors.hygor.overallAvg }
                )}
                variant="info"
              />
            </CardContent>
          </Card>
        </div>

        {/* Monitor Comparison - Bar Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Chart 1: Each Monitor with All Metrics */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-600" />
                Desempenho por Monitor
              </CardTitle>
              <CardDescription>Todas as dimensões de cada monitor</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div style={{ height: Math.max(300, allMonitors.length * 120) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={allMonitors.map(m => ({
                      name: m.name,
                      'Técnica': m.metrics?.avgTechnical || 0,
                      'Interesse': m.metrics?.avgInterest || 0,
                      'Engajamento': m.metrics?.avgEngagement || 0,
                      'Postura': m.metrics?.avgPosture || 0,
                      'Comunicação': m.metrics?.avgCommunication || 0,
                      'Contribuição': m.metrics?.avgContribution || 0,
                    }))} 
                    layout="vertical"
                    barCategoryGap="20%"
                  >
                    <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fontWeight: 500 }} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}/10`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Técnica" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="Interesse" fill="#10b981" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="Engajamento" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="Postura" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="Comunicação" fill="#ec4899" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="Contribuição" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ChartExecutiveSummary 
                insights={generateMonitorInsight(allMonitors.map(m => ({ name: m.name, avg: m.metrics?.overallAvg || 0 })))}
                variant="info"
              />
            </CardContent>
          </Card>

          {/* Chart 2: Each Metric with All Monitors */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Comparativo por Dimensão
              </CardTitle>
              <CardDescription>Todos os monitores em cada dimensão</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[
                      { metric: 'Técnica', ...Object.fromEntries(allMonitors.map(m => [m.name, m.metrics?.avgTechnical || 0])) },
                      { metric: 'Interesse', ...Object.fromEntries(allMonitors.map(m => [m.name, m.metrics?.avgInterest || 0])) },
                      { metric: 'Engajamento', ...Object.fromEntries(allMonitors.map(m => [m.name, m.metrics?.avgEngagement || 0])) },
                      { metric: 'Postura', ...Object.fromEntries(allMonitors.map(m => [m.name, m.metrics?.avgPosture || 0])) },
                      { metric: 'Comunicação', ...Object.fromEntries(allMonitors.map(m => [m.name, m.metrics?.avgCommunication || 0])) },
                      { metric: 'Contribuição', ...Object.fromEntries(allMonitors.map(m => [m.name, m.metrics?.avgContribution || 0])) },
                    ]}
                    layout="horizontal"
                    barCategoryGap="20%"
                    barGap={4}
                  >
                    <XAxis 
                      dataKey="metric" 
                      type="category" 
                      tick={{ fontSize: 11, fontWeight: 500 }} 
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}/10`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {allMonitors.map((monitor) => (
                      <Bar 
                        key={monitor.name} 
                        dataKey={monitor.name} 
                        fill={monitor.stroke} 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ranking Cards */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Ranking Geral por Média
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {allMonitors.map((monitor, index) => (
                <div 
                  key={monitor.name}
                  className={`p-4 rounded-xl ${monitor.bg} border ${monitor.border} relative`}
                >
                  <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-amber-400 text-amber-900' : 
                    index === 1 ? 'bg-slate-300 text-slate-700' : 
                    index === 2 ? 'bg-amber-600 text-amber-100' : 
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {index + 1}º
                  </div>
                  <div className="flex items-center gap-2 mb-2 ml-2">
                    <div className={`w-3 h-3 rounded-full ${monitor.dot}`} />
                    <span className={`font-semibold ${monitor.text}`}>{monitor.name}</span>
                  </div>
                  <div className={`text-2xl font-bold ${monitor.text} ml-2`}>
                    {monitor.metrics?.overallAvg?.toFixed(1) || 'N/A'}/10
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-2">Média Geral</p>
                </div>
              ))}
            </div>
            {allMonitors.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum monitor avaliado</p>
              </div>
            )}
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
        {/* Header with export button */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Análise de Tempos</h3>
            <p className="text-sm text-muted-foreground">Tempo de resposta e credibilidade</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportPDF('timing')}
            disabled={exportingTab === 'timing'}
            className="flex items-center gap-2"
          >
            {exportingTab === 'timing' ? (
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

        {/* Summary Stats - Single Row with all metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/30 dark:to-slate-900/20 border-slate-200 dark:border-slate-800">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-500/20 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Menor Tempo</p>
                  <p className="text-xl font-bold text-slate-600 dark:text-slate-400">
                    {formatTime(analytics.timingAnalytics.minTotalTime)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tempo Médio</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
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
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Maior Tempo</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {formatTime(analytics.timingAnalytics.maxTotalTime)}
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
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
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
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
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
          {(() => {
            const maxValue = analytics.questionRankings.length > 0 
              ? Math.max(...analytics.questionRankings.map(q => q.avgRating))
              : 0;
            const gradientColor = getGradientColorStyle(maxValue, 0, 10);
            const gradientBg = getGradientBgStyle(maxValue, 0, 10);
            
            return (
              <Card 
                className="border"
                style={{ 
                  background: `linear-gradient(135deg, ${gradientBg}, ${gradientBg}80)`,
                  borderColor: gradientColor + '40'
                }}
              >
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: gradientColor + '30' }}
                    >
                      <TrendingUp className="h-5 w-5" style={{ color: gradientColor }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Nota Máxima</p>
                      <p className="text-2xl font-bold" style={{ color: gradientColor }}>
                        {maxValue > 0 ? maxValue.toFixed(1) : '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
          
          {(() => {
            const avgValue = analytics.questionRankings.length > 0 
              ? analytics.questionRankings.reduce((acc, q) => acc + q.avgRating, 0) / analytics.questionRankings.length
              : 0;
            const gradientColor = getGradientColorStyle(avgValue, 0, 10);
            const gradientBg = getGradientBgStyle(avgValue, 0, 10);
            
            return (
              <Card 
                className="border"
                style={{ 
                  background: `linear-gradient(135deg, ${gradientBg}, ${gradientBg}80)`,
                  borderColor: gradientColor + '40'
                }}
              >
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: gradientColor + '30' }}
                    >
                      <BarChart3 className="h-5 w-5" style={{ color: gradientColor }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Média Geral</p>
                      <p className="text-2xl font-bold" style={{ color: gradientColor }}>
                        {avgValue > 0 ? avgValue.toFixed(1) : '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
          
          {(() => {
            const minValue = analytics.questionRankings.length > 0 
              ? Math.min(...analytics.questionRankings.map(q => q.avgRating))
              : 0;
            const gradientColor = getGradientColorStyle(minValue, 0, 10);
            const gradientBg = getGradientBgStyle(minValue, 0, 10);
            
            return (
              <Card 
                className="border"
                style={{ 
                  background: `linear-gradient(135deg, ${gradientBg}, ${gradientBg}80)`,
                  borderColor: gradientColor + '40'
                }}
              >
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: gradientColor + '30' }}
                    >
                      <TrendingDown className="h-5 w-5" style={{ color: gradientColor }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Nota Mínima</p>
                      <p className="text-2xl font-bold" style={{ color: gradientColor }}>
                        {minValue > 0 ? minValue.toFixed(1) : '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
          
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
              // Ordered from lowest to highest
              const ranges = [
                { label: '< 1', min: 0, max: 0.99, pct: 5 },
                { label: '1-2', min: 1.0, max: 1.99, pct: 15 },
                { label: '2-3', min: 2.0, max: 2.99, pct: 25 },
                { label: '3-4', min: 3.0, max: 3.99, pct: 35 },
                { label: '4-5', min: 4.0, max: 4.99, pct: 45 },
                { label: '5-6', min: 5.0, max: 5.99, pct: 55 },
                { label: '6-7', min: 6.0, max: 6.99, pct: 65 },
                { label: '7-8', min: 7.0, max: 7.99, pct: 75 },
                { label: '8-9', min: 8.0, max: 8.99, pct: 85 },
                { label: '9-10', min: 9.0, max: 9.99, pct: 95 },
                { label: '10', min: 10.0, max: 10.0, pct: 100 },
              ];
              
              const distribution = ranges.map(range => ({
                ...range,
                count: analytics.questionRankings.filter(q => 
                  q.avgRating >= range.min && q.avgRating <= range.max
                ).length
              }));
              
              const maxCount = Math.max(...distribution.map(d => d.count), 1);
              
              return (
                <div className="flex items-end justify-between gap-2 h-48 px-2">
                  {distribution.map((range) => {
                    const barColor = getGradientColorStyle(range.pct, 0, 100);
                    const heightPercent = range.count > 0 ? (range.count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={range.label} className="flex flex-col items-center gap-1 flex-1">
                        {/* Count label on top */}
                        <span 
                          className="text-xs font-bold"
                          style={{ color: barColor }}
                        >
                          {range.count}
                        </span>
                        {/* Vertical bar */}
                        <div className="w-full h-36 bg-muted/30 rounded-t-lg overflow-hidden flex flex-col justify-end">
                          {range.count > 0 && (
                            <div 
                              className="w-full rounded-t-lg transition-all duration-500"
                              style={{ 
                                height: `${heightPercent}%`,
                                minHeight: '4px',
                                backgroundColor: barColor
                              }}
                            />
                          )}
                        </div>
                        {/* Range label below */}
                        <span 
                          className="text-[10px] font-medium text-center"
                          style={{ color: barColor }}
                        >
                          {range.label}
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
        
        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pergunta..."
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={questionSortBy} onValueChange={(v) => setQuestionSortBy(v as 'original' | 'name' | 'score')}>
              <SelectTrigger className="w-[130px]">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Sequência</SelectItem>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="score">Média</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {filteredQuestions.length} perguntas encontradas
          </div>
        </Card>

        {/* Questions Grid - All charts visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredQuestions.map((q, idx) => {
            const respondents = analytics.responsesByStudent
              .map(student => {
                const response = student.responses.find(r => r.questionKey === q.questionKey);
                return response ? { name: student.userName, value: response.value || '' } : null;
              })
              .filter((r): r is { name: string; value: string } => r !== null && r.value !== '');
            
            return (
              <QuestionInlineCard 
                key={q.questionKey}
                question={q} 
                respondents={respondents}
                index={idx}
              />
            );
          })}
        </div>

        {filteredQuestions.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">
                Nenhuma pergunta encontrada
              </h3>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Ajuste os filtros para ver mais resultados
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* ============== STUDENTS TAB ============== */}
      <TabsContent value="students" className="space-y-4">
        {/* Header with export button */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Análise Individual por Aluno</h3>
            <p className="text-sm text-muted-foreground">Todas as respostas de cada aluno</p>
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
        </div>

        {/* Search and Sort controls */}
        <div className="flex gap-3 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={studentSortBy} onValueChange={(v) => setStudentSortBy(v as 'name' | 'score' | 'date')}>
            <SelectTrigger className="w-[120px] h-9">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="score">Média</SelectItem>
              <SelectItem value="date">Data</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Two-column layout: student list + all responses */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT - Student List (compact, scrollable) */}
          <Card className="lg:col-span-1">
            <CardContent className="p-3">
              <ScrollArea className="h-[600px]">
                <div className="space-y-1 pr-2">
                  {filteredStudents.map((student, idx) => {
                    const isSelected = selectedStudent?.userId === student.userId;
                    
                    return (
                      <div
                        key={student.userId}
                        className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-l-2 border-primary'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedStudent(student)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-muted-foreground w-5 shrink-0">
                            {idx + 1}.
                          </span>
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="text-xs">
                              {student.userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`text-sm truncate ${isSelected ? 'font-medium' : ''}`}>
                            {student.userName}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] shrink-0 ml-2 border-0 font-semibold"
                          style={{ 
                            backgroundColor: getGradientBgStyle(student.overallScore, 0, 10),
                            color: getGradientColorStyle(student.overallScore, 0, 10)
                          }}
                        >
                          {student.overallScore.toFixed(1)}
                        </Badge>
                      </div>
                    );
                  })}
                  
                  {filteredStudents.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      Nenhum aluno encontrado
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* RIGHT - Selected Student Full Form with Navigation */}
          <Card className="lg:col-span-2">
            <CardContent className="p-4">
              {selectedStudent ? (() => {
                const currentIndex = filteredStudents.findIndex(s => s.userId === selectedStudent.userId);
                const canGoPrev = currentIndex > 0;
                const canGoNext = currentIndex < filteredStudents.length - 1;
                
                const goToPrev = () => {
                  if (canGoPrev) setSelectedStudent(filteredStudents[currentIndex - 1]);
                };
                const goToNext = () => {
                  if (canGoNext) setSelectedStudent(filteredStudents[currentIndex + 1]);
                };
                
                const groupedResponses = selectedStudent.responses.reduce((acc, r) => {
                  if (!acc[r.category]) acc[r.category] = [];
                  acc[r.category].push(r);
                  return acc;
                }, {} as Record<string, typeof selectedStudent.responses>);

                return (
                  <>
                    {/* Navigation Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!canGoPrev}
                        onClick={goToPrev}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground font-medium">
                        {currentIndex + 1} / {filteredStudents.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!canGoNext}
                        onClick={goToNext}
                        className="gap-1"
                      >
                        Próximo
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <ScrollArea className="h-[550px]">
                      <div className="pr-4">
                        {/* Student Header */}
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl px-5 py-4 mb-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12 border-2 border-primary/20">
                                <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                                  {selectedStudent.userName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-lg flex items-center gap-2">
                                  {selectedStudent.userName}
                                  {selectedStudent.isFirstTime && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">1ª vez</Badge>
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {selectedStudent.answeredQuestions}/{selectedStudent.totalQuestions} perguntas
                                  {selectedStudent.isCompleted ? (
                                    <span className="ml-2 text-emerald-600 font-medium">• Completou</span>
                                  ) : (
                                    <span className="ml-2 text-yellow-600 font-medium">• {selectedStudent.progressPercent}%</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div 
                              className="text-3xl font-extrabold px-4 py-2 rounded-xl"
                              style={{ 
                                backgroundColor: getGradientBgStyle(selectedStudent.overallScore, 0, 10),
                                color: getGradientColorStyle(selectedStudent.overallScore, 0, 10)
                              }}
                            >
                              {selectedStudent.overallScore.toFixed(1)}
                            </div>
                          </div>
                        </div>

                        {/* All Responses by Category */}
                        <div className="space-y-5">
                          {Object.entries(groupedResponses).map(([category, responses]) => (
                            <div key={category}>
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 pb-1 border-b">
                                {category}
                              </p>
                              <div className="space-y-1">
                                {responses.map((r, rIdx) => (
                                  <div 
                                    key={rIdx} 
                                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                                    style={{ backgroundColor: rIdx % 2 === 0 ? 'hsl(var(--muted) / 0.3)' : 'transparent' }}
                                  >
                                    <span className="text-sm text-muted-foreground flex-1 pr-4">
                                      {r.questionLabel}
                                    </span>
                                    <span 
                                      className="font-semibold text-sm shrink-0 text-right"
                                      style={{
                                        color: r.numericValue !== null && r.numericValue !== undefined
                                          ? getGradientColorStyle(r.numericValue, 0, 10)
                                          : r.value ? getSemanticColor(r.value) : undefined
                                      }}
                                    >
                                      {r.value || '—'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                  </>
                );
              })() : (
                <div className="flex flex-col items-center justify-center h-[600px] text-center">
                  <User className="h-16 w-16 text-muted-foreground/20 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Selecione um aluno
                  </h3>
                  <p className="text-sm text-muted-foreground/70 max-w-xs">
                    Clique em um aluno na lista à esquerda para ver todas as respostas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Student detail is shown inline in the right panel - no dialog needed */}

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
    </>
  );
}
