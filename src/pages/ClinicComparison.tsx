import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Header } from '@/components/Header';
import { metrics, getLastAvailableWeek, generateWeeks2026 } from '@/data/metricsData';
import { calculateMetrics, getMetricStatus, formatMetricValue } from '@/utils/metricCalculations';
import { 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  AlertTriangle, 
  BarChart3,
  ArrowLeft,
  Crown,
  Target,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const clinicsList = [
  { id: 'clinic-1', name: 'Clínica Capilar SP' },
  { id: 'clinic-2', name: 'Hair Center RJ' },
  { id: 'clinic-3', name: 'Transplante Capilar BH' }
];

// Key metrics for comparison
const keyMetrics = [
  'CTR', 'CPC', 'CPL', 'LPCR', 'Atend', 'TAgend', 'TShow', 'TFech', 'Tick', 'ROI'
];

export default function ClinicComparison() {
  const { isAdmin } = useAuth();
  const { getClinicData } = useData();
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState<string>('CTR');

  // Get the last available week for comparison
  const weeks = generateWeeks2026();
  const lastAvailableWeek = getLastAvailableWeek(weeks);
  const weekNumber = lastAvailableWeek?.weekNumber || 1;

  // Calculate metrics for all clinics
  const clinicsMetrics = useMemo(() => {
    return clinicsList.map(clinic => {
      const clinicData = getClinicData(clinic.id);
      const week = clinicData.weeks.find(w => w.weekNumber === weekNumber);
      const values = week?.values || {};
      const calculated = calculateMetrics(values);
      
      return {
        ...clinic,
        values,
        calculated,
        hasData: Object.keys(values).length > 0
      };
    });
  }, [weekNumber, getClinicData]);

  // Get metric comparison data
  const getMetricComparison = (sigla: string) => {
    const metric = metrics.find(m => m.sigla === sigla);
    if (!metric) return [];

    return clinicsMetrics.map(clinic => {
      let value: number | null = null;
      
      if (metric.tipo === 'auto') {
        const v = clinic.calculated[sigla];
        value = typeof v === 'number' ? v : null;
      } else {
        const v = clinic.values[sigla];
        value = typeof v === 'number' ? v : null;
      }
      
      const status = value !== null ? getMetricStatus(sigla, value) : null;
      
      return {
        clinicId: clinic.id,
        clinicName: clinic.name,
        value,
        status,
        hasData: clinic.hasData
      };
    });
  };

  // Get best performer for a metric
  const getBestPerformer = (sigla: string) => {
    const comparison = getMetricComparison(sigla);
    const metric = metrics.find(m => m.sigla === sigla);
    if (!metric) return null;

    const withValues = comparison.filter(c => c.value !== null);
    if (withValues.length === 0) return null;

    // Determine if higher is better based on metric type
    const higherIsBetter = !['CPC', 'CPL', 'CPM', 'Freq', 'Bounce', 'AbForm', 'PageSpeed', 'TAb'].includes(sigla);
    
    return withValues.reduce((best, current) => {
      if (best.value === null) return current;
      if (current.value === null) return best;
      
      if (higherIsBetter) {
        return current.value > best.value ? current : best;
      } else {
        return current.value < best.value ? current : best;
      }
    });
  };

  // Calculate overall scores
  const clinicScores = useMemo(() => {
    return clinicsMetrics.map(clinic => {
      let score = 0;
      let total = 0;
      
      keyMetrics.forEach(sigla => {
        const metric = metrics.find(m => m.sigla === sigla);
        if (!metric) return;
        
        let value: number | null = null;
        if (metric.tipo === 'auto') {
          const v = clinic.calculated[sigla];
          value = typeof v === 'number' ? v : null;
        } else {
          const v = clinic.values[sigla];
          value = typeof v === 'number' ? v : null;
        }
        
        if (value !== null) {
          const status = getMetricStatus(sigla, value);
          if (status === 'great') score += 4;
          else if (status === 'good') score += 3;
          else if (status === 'medium') score += 2;
          else if (status === 'bad') score += 1;
          total += 4;
        }
      });
      
      return {
        ...clinic,
        score,
        maxScore: total,
        percentage: total > 0 ? Math.round((score / total) * 100) : 0
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [clinicsMetrics]);

  // Get best practices from top performer
  const bestPractices = useMemo(() => {
    const practices: { metric: string; clinicName: string; value: number; tip: string }[] = [];
    
    keyMetrics.forEach(sigla => {
      const best = getBestPerformer(sigla);
      const metric = metrics.find(m => m.sigla === sigla);
      
      if (best && best.value !== null && best.status === 'great' && metric) {
        practices.push({
          metric: sigla,
          clinicName: best.clinicName,
          value: best.value,
          tip: metric.seBom
        });
      }
    });
    
    return practices;
  }, [clinicsMetrics]);

  // Get areas needing improvement across all clinics
  const areasToImprove = useMemo(() => {
    const issues: { metric: string; clinics: string[]; tip: string }[] = [];
    
    keyMetrics.forEach(sigla => {
      const comparison = getMetricComparison(sigla);
      const metric = metrics.find(m => m.sigla === sigla);
      
      if (!metric) return;
      
      const badClinics = comparison.filter(c => c.status === 'bad').map(c => c.clinicName);
      
      if (badClinics.length > 0) {
        issues.push({
          metric: sigla,
          clinics: badClinics,
          tip: metric.acoesCorretivas
        });
      }
    });
    
    return issues;
  }, [clinicsMetrics]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-status-bad mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground">Esta página é exclusiva para administradores.</p>
        </div>
      </div>
    );
  }

  const selectedMetricData = metrics.find(m => m.sigla === selectedMetric);
  const selectedComparison = getMetricComparison(selectedMetric);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-screen-2xl mx-auto p-4 lg:p-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Comparativo entre Clínicas</h1>
          </div>
          <p className="text-muted-foreground">
            Análise comparativa da {lastAvailableWeek?.weekLabel || 'última semana disponível'} - 
            Identifique melhores práticas e benchmarks
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Rankings */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Overall Ranking */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h2 className="font-semibold text-foreground">Ranking Geral</h2>
              </div>
              
              <div className="space-y-4">
                {clinicScores.map((clinic, index) => (
                  <div key={clinic.id} className="flex items-center gap-4">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                      index === 0 && 'bg-yellow-500/20 text-yellow-600',
                      index === 1 && 'bg-gray-300/20 text-gray-500',
                      index === 2 && 'bg-amber-600/20 text-amber-700',
                      index > 2 && 'bg-muted text-muted-foreground'
                    )}>
                      {index === 0 ? <Crown className="w-4 h-4" /> : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{clinic.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              'h-full rounded-full transition-all',
                              clinic.percentage >= 75 ? 'bg-status-great' :
                              clinic.percentage >= 50 ? 'bg-status-good' :
                              clinic.percentage >= 25 ? 'bg-status-medium' :
                              'bg-status-bad'
                            )}
                            style={{ width: `${clinic.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {clinic.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {clinicScores.every(c => !c.hasData) && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Nenhuma clínica preencheu dados ainda
                </p>
              )}
            </div>

            {/* Best Practices */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-status-great" />
                <h2 className="font-semibold text-foreground">Melhores Práticas</h2>
              </div>
              
              {bestPractices.length > 0 ? (
                <div className="space-y-4">
                  {bestPractices.slice(0, 5).map((practice, index) => (
                    <div key={index} className="p-3 bg-status-great/5 border border-status-great/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-status-great">{practice.metric}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{practice.clinicName}</span>
                      </div>
                      <p className="text-xs text-foreground/80">{practice.tip}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Preencha dados para ver melhores práticas
                </p>
              )}
            </div>

            {/* Areas to Improve */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-status-bad" />
                <h2 className="font-semibold text-foreground">Pontos de Atenção</h2>
              </div>
              
              {areasToImprove.length > 0 ? (
                <div className="space-y-4">
                  {areasToImprove.slice(0, 5).map((issue, index) => (
                    <div key={index} className="p-3 bg-status-bad/5 border border-status-bad/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-status-bad">{issue.metric}</span>
                        <span className="text-xs text-muted-foreground">
                          ({issue.clinics.length} clínica{issue.clinics.length > 1 ? 's' : ''})
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80">{issue.tip}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Nenhum ponto crítico identificado
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Metric Comparison */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Metric Selector */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-4">Comparar Indicador</h2>
              <div className="flex flex-wrap gap-2">
                {keyMetrics.map(sigla => (
                  <button
                    key={sigla}
                    onClick={() => setSelectedMetric(sigla)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      selectedMetric === sigla
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {sigla}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Metric Comparison */}
            {selectedMetricData && (
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-foreground">{selectedMetricData.nome}</h2>
                  <p className="text-sm text-muted-foreground">{selectedMetricData.oQueMede}</p>
                </div>

                {/* Comparison Bars */}
                <div className="space-y-4 mb-6">
                  {selectedComparison.map(clinic => {
                    const maxValue = Math.max(
                      ...selectedComparison.filter(c => c.value !== null).map(c => c.value as number),
                      1
                    );
                    const percentage = clinic.value !== null ? (clinic.value / maxValue) * 100 : 0;
                    const best = getBestPerformer(selectedMetric);
                    const isBest = best?.clinicId === clinic.clinicId;

                    return (
                      <div key={clinic.clinicId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground text-sm">{clinic.clinicName}</span>
                            {isBest && <Crown className="w-4 h-4 text-yellow-500" />}
                          </div>
                          <div className="flex items-center gap-2">
                            {clinic.value !== null ? (
                              <>
                                <span className={cn(
                                  'font-semibold',
                                  clinic.status === 'great' && 'text-status-great',
                                  clinic.status === 'good' && 'text-status-good',
                                  clinic.status === 'medium' && 'text-status-medium',
                                  clinic.status === 'bad' && 'text-status-bad'
                                )}>
                                  {formatMetricValue(clinic.value, selectedMetricData.formato)}
                                </span>
                                <div className={cn(
                                  'w-2 h-2 rounded-full',
                                  clinic.status === 'great' && 'bg-status-great',
                                  clinic.status === 'good' && 'bg-status-good',
                                  clinic.status === 'medium' && 'bg-status-medium',
                                  clinic.status === 'bad' && 'bg-status-bad'
                                )} />
                              </>
                            ) : (
                              <span className="text-muted-foreground text-sm">Sem dados</span>
                            )}
                          </div>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              clinic.status === 'great' && 'bg-status-great',
                              clinic.status === 'good' && 'bg-status-good',
                              clinic.status === 'medium' && 'bg-status-medium',
                              clinic.status === 'bad' && 'bg-status-bad',
                              !clinic.status && 'bg-muted-foreground/20'
                            )}
                            style={{ width: clinic.value !== null ? `${Math.max(percentage, 5)}%` : '0%' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Benchmarks */}
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Faixas de Referência</h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-2 bg-status-bad/10 rounded-lg text-center">
                      <p className="text-xs text-status-bad font-medium">Ruim</p>
                      <p className="text-sm font-semibold text-foreground">{selectedMetricData.ruim}</p>
                    </div>
                    <div className="p-2 bg-status-medium/10 rounded-lg text-center">
                      <p className="text-xs text-status-medium font-medium">Médio</p>
                      <p className="text-sm font-semibold text-foreground">{selectedMetricData.medio}</p>
                    </div>
                    <div className="p-2 bg-status-good/10 rounded-lg text-center">
                      <p className="text-xs text-status-good font-medium">Bom</p>
                      <p className="text-sm font-semibold text-foreground">{selectedMetricData.bom}</p>
                    </div>
                    <div className="p-2 bg-status-great/10 rounded-lg text-center">
                      <p className="text-xs text-status-great font-medium">Ótimo</p>
                      <p className="text-sm font-semibold text-foreground">{selectedMetricData.otimo}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All Key Metrics Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Tabela Comparativa - Indicadores Chave</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Indicador</th>
                      {clinicsList.map(clinic => (
                        <th key={clinic.id} className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                          {clinic.name}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Benchmark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keyMetrics.map(sigla => {
                      const metric = metrics.find(m => m.sigla === sigla);
                      const comparison = getMetricComparison(sigla);
                      const best = getBestPerformer(sigla);
                      
                      if (!metric) return null;
                      
                      return (
                        <tr key={sigla} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div>
                              <span className="font-semibold text-foreground text-sm">{sigla}</span>
                              <p className="text-xs text-muted-foreground">{metric.nome}</p>
                            </div>
                          </td>
                          {comparison.map(clinic => (
                            <td key={clinic.clinicId} className="px-4 py-3 text-center">
                              {clinic.value !== null ? (
                                <div className="flex items-center justify-center gap-1">
                                  <span className={cn(
                                    'font-medium text-sm',
                                    clinic.status === 'great' && 'text-status-great',
                                    clinic.status === 'good' && 'text-status-good',
                                    clinic.status === 'medium' && 'text-status-medium',
                                    clinic.status === 'bad' && 'text-status-bad'
                                  )}>
                                    {formatMetricValue(clinic.value, metric.formato)}
                                  </span>
                                  {best?.clinicId === clinic.clinicId && (
                                    <Crown className="w-3 h-3 text-yellow-500" />
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-center">
                            <span className="text-xs text-status-great font-medium">{metric.otimo}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
