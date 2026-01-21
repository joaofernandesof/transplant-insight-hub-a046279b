import React, { useRef, useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Loader2, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Users,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ShoppingCart,
  XCircle,
  Activity,
  Bot
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { generateWeeks2026, formatDate } from '@/data/metricsData';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface MetricConfig {
  id: string;
  nome: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const keyMetrics: MetricConfig[] = [
  { id: 'leads_novos', nome: 'Leads Novos', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { id: 'tempo_uso_atendente', nome: 'Tempo de Uso (Atendente)', icon: Clock, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { id: 'atividades_atendente', nome: 'Atividades (Atendente)', icon: Activity, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  { id: 'atividades_robo', nome: 'Atividades (Robô)', icon: Bot, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { id: 'mensagens_enviadas_atendente', nome: 'Msgs Enviadas (Atendente)', icon: MessageSquare, color: 'text-green-600', bgColor: 'bg-green-100' },
  { id: 'mensagens_enviadas_robo', nome: 'Msgs Enviadas (Robô)', icon: Bot, color: 'text-teal-600', bgColor: 'bg-teal-100' },
  { id: 'mensagens_recebidas', nome: 'Mensagens Recebidas', icon: MessageSquare, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  { id: 'tarefas_realizadas', nome: 'Tarefas Realizadas', icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  { id: 'tarefas_atrasadas', nome: 'Tarefas Atrasadas', icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
  { id: 'agendamentos', nome: 'Agendamentos', icon: Calendar, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  { id: 'vendas_realizadas', nome: 'Vendas Realizadas', icon: ShoppingCart, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  { id: 'leads_descartados', nome: 'Leads Descartados', icon: XCircle, color: 'text-slate-600', bgColor: 'bg-slate-100' },
];

interface DailyMetricsReportPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWeekNumber: number;
  getWeekValues: (weekNumber: number) => Record<string, number | string | null>;
  clinicName?: string;
}

export function DailyMetricsReportPreview({
  open,
  onOpenChange,
  currentWeekNumber,
  getWeekValues,
  clinicName = 'Clínica'
}: DailyMetricsReportPreviewProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const allWeeks = useMemo(() => generateWeeks2026(), []);
  
  // Show last 7 weeks for the report
  const reportWeeks = useMemo(() => {
    const startWeek = Math.max(1, currentWeekNumber - 6);
    return allWeeks.slice(startWeek - 1, currentWeekNumber);
  }, [allWeeks, currentWeekNumber]);

  // Calculate metrics data
  const metricsData = useMemo(() => {
    return keyMetrics.map(metric => {
      const values = reportWeeks.map(week => {
        const weekValues = getWeekValues(week.weekNumber);
        return typeof weekValues[metric.id] === 'number' ? weekValues[metric.id] as number : 0;
      });
      
      const total = values.reduce((sum, v) => sum + v, 0);
      const nonZeroValues = values.filter(v => v > 0);
      const avg = nonZeroValues.length > 0 ? total / nonZeroValues.length : 0;
      
      const lastValue = values[values.length - 1] ?? 0;
      const prevValue = values[values.length - 2] ?? 0;
      const trend = lastValue > prevValue ? 'up' : lastValue < prevValue ? 'down' : 'stable';
      const change = lastValue - prevValue;
      
      return {
        ...metric,
        values,
        total,
        avg,
        trend,
        change
      };
    });
  }, [reportWeeks, getWeekValues]);

  // Fetch AI analysis
  const fetchAnalysis = useCallback(async () => {
    if (aiAnalysis) return;
    
    setIsAnalyzing(true);
    try {
      const metricsForAI = metricsData.map(m => ({
        id: m.id,
        nome: m.nome,
        values: m.values,
        weekLabels: reportWeeks.map(w => `S${w.weekNumber}`)
      }));

      const { data, error } = await supabase.functions.invoke('analyze-daily-metrics', {
        body: { metrics: metricsForAI, clinicName }
      });

      if (error) throw error;
      setAiAnalysis(data?.analysis || 'Análise não disponível.');
    } catch (error) {
      console.error('Error fetching analysis:', error);
      setAiAnalysis('Não foi possível gerar a análise no momento. Tente novamente mais tarde.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [metricsData, reportWeeks, clinicName, aiAnalysis]);

  // Fetch analysis when dialog opens
  React.useEffect(() => {
    if (open && !aiAnalysis) {
      fetchAnalysis();
    }
  }, [open, fetchAnalysis, aiAnalysis]);

  // Export to PDF using html2canvas
  const exportToPDF = useCallback(async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    toast.info('Gerando PDF...');
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const today = new Date();
      const fileName = `relatorio-indicadores-S${currentWeekNumber}-${today.toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erro ao exportar PDF. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  }, [currentWeekNumber]);

  const today = new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Pré-visualização do Relatório</DialogTitle>
          <Button
            onClick={exportToPDF}
            disabled={isExporting || isAnalyzing}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exportar PDF
              </>
            )}
          </Button>
        </DialogHeader>

        {/* Report Content - This is what gets captured */}
        <div 
          ref={reportRef} 
          className="bg-white p-6 rounded-lg"
          style={{ minWidth: '800px' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6 rounded-t-lg -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Relatório de Indicadores Operacionais</h1>
                <p className="text-primary-foreground/80 mt-1">{clinicName} | Semana {currentWeekNumber} de 2026</p>
              </div>
              <div className="text-right text-sm text-primary-foreground/80">
                <p>Gerado em: {today.toLocaleDateString('pt-BR')}</p>
                <p>às {today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Análise Inteligente</h2>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border">
              {isAnalyzing ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando análise com IA...
                </div>
              ) : (
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {aiAnalysis || 'Análise não disponível.'}
                </div>
              )}
            </div>
          </div>

          {/* Metrics Table */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground mb-3">📊 Dados da Semana</h2>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold border-r">Indicador</th>
                    {reportWeeks.map(week => (
                      <th 
                        key={week.weekNumber} 
                        className={cn(
                          "text-center px-2 py-2 font-semibold border-r",
                          week.weekNumber === currentWeekNumber && "bg-primary/20"
                        )}
                      >
                        <div className="flex flex-col">
                          <span>S{week.weekNumber}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {formatDate(week.startDate).split('/').slice(0, 2).join('/')}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="text-center px-2 py-2 font-semibold border-r bg-emerald-100">Total</th>
                    <th className="text-center px-2 py-2 font-semibold border-r bg-blue-100">Média</th>
                    <th className="text-center px-2 py-2 font-semibold bg-slate-100">Tendência</th>
                  </tr>
                </thead>
                <tbody>
                  {metricsData.map((metric, idx) => {
                    const Icon = metric.icon;
                    return (
                      <tr key={metric.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-muted/30'}>
                        <td className={cn("px-3 py-2 border-r", metric.bgColor)}>
                          <div className="flex items-center gap-2">
                            <Icon className={cn("w-4 h-4", metric.color)} />
                            <span className="font-medium text-xs">{metric.nome}</span>
                          </div>
                        </td>
                        {metric.values.map((value, i) => (
                          <td 
                            key={i} 
                            className={cn(
                              "text-center px-2 py-2 border-r font-medium",
                              reportWeeks[i]?.weekNumber === currentWeekNumber && "bg-primary/10"
                            )}
                          >
                            {value || '-'}
                          </td>
                        ))}
                        <td className="text-center px-2 py-2 border-r font-bold bg-emerald-50 text-emerald-700">
                          {metric.total}
                        </td>
                        <td className="text-center px-2 py-2 border-r font-bold bg-blue-50 text-blue-700">
                          {metric.avg.toFixed(1)}
                        </td>
                        <td className="text-center px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            {metric.trend === 'up' && (
                              <>
                                <TrendingUp className={cn(
                                  "w-4 h-4",
                                  metric.id === 'tarefas_atrasadas' || metric.id === 'leads_descartados' 
                                    ? "text-red-600" 
                                    : "text-green-600"
                                )} />
                                <span className={cn(
                                  "text-xs font-bold",
                                  metric.id === 'tarefas_atrasadas' || metric.id === 'leads_descartados' 
                                    ? "text-red-600" 
                                    : "text-green-600"
                                )}>
                                  +{metric.change}
                                </span>
                              </>
                            )}
                            {metric.trend === 'down' && (
                              <>
                                <TrendingDown className={cn(
                                  "w-4 h-4",
                                  metric.id === 'tarefas_atrasadas' || metric.id === 'leads_descartados' 
                                    ? "text-green-600" 
                                    : "text-red-600"
                                )} />
                                <span className={cn(
                                  "text-xs font-bold",
                                  metric.id === 'tarefas_atrasadas' || metric.id === 'leads_descartados' 
                                    ? "text-green-600" 
                                    : "text-red-600"
                                )}>
                                  {metric.change}
                                </span>
                              </>
                            )}
                            {metric.trend === 'stable' && (
                              <>
                                <Minus className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-bold text-slate-500">0</span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-muted/50 rounded-lg p-3 text-center text-xs text-muted-foreground border-t">
            Relatório gerado automaticamente pelo Sistema de Gestão de Indicadores | Powered by IA
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
