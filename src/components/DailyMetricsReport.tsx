import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, generateWeeks2026 } from '@/data/metricsData';

interface MetricConfig {
  id: string;
  nome: string;
  icon: string;
}

const keyMetrics: MetricConfig[] = [
  { id: 'leads_novos', nome: 'Leads Novos', icon: '👥' },
  { id: 'tempo_uso_atendente', nome: 'Tempo de Uso (Atendente)', icon: '⏱️' },
  { id: 'atividades_atendente', nome: 'Atividades (Atendente)', icon: '📋' },
  { id: 'atividades_robo', nome: 'Atividades (Robô)', icon: '🤖' },
  { id: 'mensagens_enviadas_atendente', nome: 'Msgs Enviadas (Atendente)', icon: '💬' },
  { id: 'mensagens_enviadas_robo', nome: 'Msgs Enviadas (Robô)', icon: '🤖' },
  { id: 'mensagens_recebidas', nome: 'Mensagens Recebidas', icon: '📩' },
  { id: 'tarefas_realizadas', nome: 'Tarefas Realizadas', icon: '✅' },
  { id: 'tarefas_atrasadas', nome: 'Tarefas Atrasadas', icon: '⚠️' },
  { id: 'agendamentos', nome: 'Agendamentos', icon: '📅' },
  { id: 'vendas_realizadas', nome: 'Vendas Realizadas', icon: '💰' },
  { id: 'leads_descartados', nome: 'Leads Descartados', icon: '❌' },
];

interface DailyMetricsReportProps {
  currentWeekNumber: number;
  getWeekValues: (weekNumber: number) => Record<string, number | string | null>;
  clinicName?: string;
}

export function DailyMetricsReport({
  currentWeekNumber,
  getWeekValues,
  clinicName = 'Clínica'
}: DailyMetricsReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      const allWeeks = generateWeeks2026();
      
      // Get last 7 weeks of data
      const startWeek = Math.max(1, currentWeekNumber - 6);
      const weeksToInclude = allWeeks.slice(startWeek - 1, currentWeekNumber);
      
      // Collect metric data for AI analysis
      const metricsData = keyMetrics.map(metric => {
        const values = weeksToInclude.map(week => {
          const weekValues = getWeekValues(week.weekNumber);
          return typeof weekValues[metric.id] === 'number' ? weekValues[metric.id] as number : 0;
        });
        
        return {
          id: metric.id,
          nome: metric.nome,
          values,
          weekLabels: weeksToInclude.map(w => `S${w.weekNumber}`)
        };
      });

      // Call AI for analysis
      toast.info('Gerando análise com IA...');
      
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'analyze-daily-metrics',
        {
          body: { metrics: metricsData, clinicName }
        }
      );

      if (analysisError) {
        console.error('Analysis error:', analysisError);
        throw new Error('Erro ao gerar análise');
      }

      const aiAnalysis = analysisData?.analysis || 'Análise não disponível no momento.';

      // Generate PDF
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = 20;

      // Header
      doc.setFillColor(99, 102, 241); // Primary color
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Indicadores Operacionais', margin, 18);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`${clinicName} | Semana ${currentWeekNumber} de 2026`, margin, 28);
      
      const today = new Date();
      doc.text(`Gerado em: ${today.toLocaleDateString('pt-BR')} às ${today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin - 60, 28);

      yPos = 45;

      // AI Analysis Section
      doc.setTextColor(99, 102, 241);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('🤖 Análise Inteligente', margin, yPos);
      yPos += 8;

      doc.setFillColor(249, 250, 251);
      doc.roundedRect(margin, yPos - 2, pageWidth - 2 * margin, 80, 3, 3, 'F');

      doc.setTextColor(55, 65, 81);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      // Split analysis into lines that fit the page
      const analysisLines = doc.splitTextToSize(aiAnalysis, pageWidth - 2 * margin - 10);
      doc.text(analysisLines.slice(0, 25), margin + 5, yPos + 6); // Limit lines to fit box
      
      yPos += 88;

      // Metrics Table
      doc.setTextColor(99, 102, 241);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('📊 Dados da Semana', margin, yPos);
      yPos += 6;

      // Build table data
      const weekHeaders = ['Indicador', ...weeksToInclude.map(w => `S${w.weekNumber}`), 'Total', 'Média'];
      
      const tableData = metricsData.map(metric => {
        const total = metric.values.reduce((sum, v) => sum + v, 0);
        const avg = metric.values.length > 0 ? total / metric.values.filter(v => v > 0).length || 0 : 0;
        
        return [
          `${keyMetrics.find(k => k.id === metric.id)?.icon || ''} ${metric.nome}`,
          ...metric.values.map(v => v.toString()),
          total.toString(),
          avg.toFixed(1)
        ];
      });

      autoTable(doc, {
        head: [weekHeaders],
        body: tableData,
        startY: yPos,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        columnStyles: {
          0: { cellWidth: 50 },
        },
      });

      // Get final Y position after table
      const finalY = (doc as any).lastAutoTable?.finalY || yPos + 100;

      // Trend indicators section
      if (finalY < 240) {
        let trendY = finalY + 15;
        
        doc.setTextColor(99, 102, 241);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('📈 Tendências', margin, trendY);
        trendY += 8;

        doc.setFontSize(9);
        doc.setTextColor(55, 65, 81);
        doc.setFont('helvetica', 'normal');

        // Calculate trends for each metric
        const trends = metricsData.map(metric => {
          const lastValue = metric.values[metric.values.length - 1] ?? 0;
          const prevValue = metric.values[metric.values.length - 2] ?? 0;
          const change = lastValue - prevValue;
          const percentChange = prevValue > 0 ? ((change / prevValue) * 100).toFixed(1) : '0';
          
          let trendIcon = '→';
          let trendColor = [107, 114, 128]; // gray
          
          if (change > 0) {
            trendIcon = '↑';
            // For "tarefas_atrasadas" and "leads_descartados", up is bad
            if (metric.id === 'tarefas_atrasadas' || metric.id === 'leads_descartados') {
              trendColor = [239, 68, 68]; // red
            } else {
              trendColor = [34, 197, 94]; // green
            }
          } else if (change < 0) {
            trendIcon = '↓';
            if (metric.id === 'tarefas_atrasadas' || metric.id === 'leads_descartados') {
              trendColor = [34, 197, 94]; // green (down is good for these)
            } else {
              trendColor = [239, 68, 68]; // red
            }
          }

          return {
            nome: metric.nome,
            trendIcon,
            trendColor,
            change,
            percentChange
          };
        });

        // Display trends in two columns
        const col1X = margin;
        const col2X = pageWidth / 2 + 5;
        let col1Y = trendY;
        let col2Y = trendY;

        trends.forEach((trend, idx) => {
          const x = idx < 6 ? col1X : col2X;
          const y = idx < 6 ? col1Y : col2Y;

          doc.setTextColor(trend.trendColor[0], trend.trendColor[1], trend.trendColor[2]);
          doc.text(`${trend.trendIcon} ${trend.nome}: ${trend.change >= 0 ? '+' : ''}${trend.change} (${trend.percentChange}%)`, x, y);

          if (idx < 6) {
            col1Y += 6;
          } else {
            col2Y += 6;
          }
        });
      }

      // Footer
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 285, pageWidth, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Relatório gerado automaticamente pelo Sistema de Gestão de Indicadores | Powered by IA', pageWidth / 2, 292, { align: 'center' });

      // Save PDF
      const fileName = `relatorio-indicadores-S${currentWeekNumber}-${today.toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  }, [currentWeekNumber, getWeekValues, clinicName]);

  return (
    <Button
      onClick={generateReport}
      disabled={isGenerating}
      variant="default"
      size="sm"
      className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="hidden sm:inline">Gerando...</span>
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Relatório PDF</span>
        </>
      )}
    </Button>
  );
}
