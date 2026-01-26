import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { 
  BookOpen, Target, Briefcase, Scale, TrendingUp,
  Lightbulb, Sparkles, CheckCircle2, XCircle, MessageSquare, AlertTriangle
} from 'lucide-react';
import { Day3SurveyAnalytics } from '@/academy/hooks/useDay3SurveyAnalytics';

interface ContentAnalysisProps {
  analytics: Day3SurveyAnalytics;
}

// Score colors based on value (0-10)
const getScoreColor = (score: number) => {
  if (score >= 9) return { bg: '#10b981', text: 'Excelente' };
  if (score >= 7.5) return { bg: '#3b82f6', text: 'Bom' };
  if (score >= 5) return { bg: '#eab308', text: 'Regular' };
  if (score >= 2.5) return { bg: '#f97316', text: 'Baixo' };
  return { bg: '#ef4444', text: 'Crítico' };
};

// Content areas configuration
const CONTENT_AREAS = [
  { 
    key: 'foundations', 
    label: 'Fundamentos Técnicos', 
    shortLabel: 'Técnico',
    questionKey: 'q3', 
    icon: BookOpen,
    options: [
      { key: 'muito_fracos', label: 'Muito fracos', score: 0 },
      { key: 'fracos', label: 'Fracos', score: 2.5 },
      { key: 'adequados', label: 'Adequados', score: 5 },
      { key: 'bons', label: 'Bons', score: 7.5 },
      { key: 'excelentes', label: 'Excelentes', score: 10 },
    ]
  },
  { 
    key: 'practical', 
    label: 'Carga Prática', 
    shortLabel: 'Prática',
    questionKey: 'q4', 
    icon: Target,
    options: [
      { key: 'muito_insuficiente', label: 'Muito insuficiente', score: 0 },
      { key: 'insuficiente', label: 'Insuficiente', score: 2.5 },
      { key: 'adequada', label: 'Adequada', score: 5 },
      { key: 'boa', label: 'Boa', score: 7.5 },
      { key: 'excelente', label: 'Excelente', score: 10 },
    ]
  },
  { 
    key: 'management', 
    label: 'Aulas de Gestão', 
    shortLabel: 'Gestão',
    questionKey: 'q8', 
    icon: Briefcase,
    options: [
      { key: 'nada_relevantes', label: 'Nada relevantes', score: 0 },
      { key: 'pouco_relevantes', label: 'Pouco relevantes', score: 2.5 },
      { key: 'relevantes', label: 'Relevantes', score: 5 },
      { key: 'muito_relevantes', label: 'Muito relevantes', score: 7.5 },
      { key: 'essenciais', label: 'Essenciais', score: 10 },
    ]
  },
  { 
    key: 'legal', 
    label: 'Segurança Jurídica', 
    shortLabel: 'Jurídico',
    questionKey: 'q9', 
    icon: Scale,
    options: [
      { key: 'nenhuma', label: 'Nenhuma', score: 0 },
      { key: 'pouca', label: 'Pouca', score: 2.5 },
      { key: 'razoavel', label: 'Razoável', score: 5 },
      { key: 'boa', label: 'Boa', score: 7.5 },
      { key: 'muita', label: 'Muita', score: 10 },
    ]
  },
];

const BALANCE_OPTIONS = [
  { key: 'muito_teorico', label: 'Muito teórico', score: 2.5, color: '#ef4444' },
  { key: 'mais_teoria', label: 'Mais teoria', score: 5, color: '#f97316' },
  { key: 'equilibrado', label: 'Equilibrado', score: 10, color: '#10b981' },
  { key: 'mais_pratica', label: 'Mais prática', score: 7.5, color: '#3b82f6' },
  { key: 'muito_pratico', label: 'Muito prático', score: 5, color: '#8b5cf6' },
];

const SCORE_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#10b981'];

export function Day3ContentAnalysisTab({ analytics }: ContentAnalysisProps) {
  // Calculate response distribution for each content area
  const contentDistributions = useMemo(() => {
    return CONTENT_AREAS.map(area => {
      const counts: Record<string, number> = {};
      let total = 0;
      
      area.options.forEach(opt => {
        counts[opt.key] = 0;
      });
      
      analytics.responsesByStudent.forEach(student => {
        const response = student.responses[area.questionKey];
        if (response && counts.hasOwnProperty(response)) {
          counts[response]++;
          total++;
        }
      });
      
      return {
        ...area,
        distribution: area.options.map((opt, idx) => ({
          ...opt,
          count: counts[opt.key] || 0,
          percentage: total > 0 ? Math.round((counts[opt.key] / total) * 100) : 0,
          color: SCORE_COLORS[idx],
        })),
        total,
      };
    });
  }, [analytics.responsesByStudent]);

  // Calculate balance distribution
  const balanceData = useMemo(() => {
    let total = 0;
    const counts: Record<string, number> = {};
    
    BALANCE_OPTIONS.forEach(opt => {
      counts[opt.key] = analytics.technicalContent.balanceDistribution[opt.key] || 0;
      total += counts[opt.key];
    });
    
    return BALANCE_OPTIONS.map(opt => ({
      ...opt,
      count: counts[opt.key],
      percentage: total > 0 ? Math.round((counts[opt.key] / total) * 100) : 0,
    }));
  }, [analytics.technicalContent.balanceDistribution]);

  // Radar chart data
  const radarData = [
    { metric: 'Técnico', value: analytics.technicalContent.avgFoundations, fullMark: 10 },
    { metric: 'Prática', value: analytics.technicalContent.avgPracticalLoad, fullMark: 10 },
    { metric: 'Gestão', value: analytics.businessContent.avgManagement, fullMark: 10 },
    { metric: 'Jurídico', value: analytics.businessContent.avgLegalSecurity, fullMark: 10 },
    { metric: 'Clareza', value: analytics.confidence.avgClarity, fullMark: 10 },
    { metric: 'Confiança', value: analytics.confidence.avgConfidence, fullMark: 10 },
  ];

  // Heatmap data
  const heatmapData = useMemo(() => {
    return CONTENT_AREAS.map(area => {
      const row = area.options.map((opt, idx) => {
        const dist = contentDistributions.find(d => d.key === area.key);
        const optData = dist?.distribution.find(d => d.key === opt.key);
        return {
          label: opt.label,
          score: opt.score,
          count: optData?.count || 0,
          percentage: optData?.percentage || 0,
        };
      });
      return { area: area.shortLabel, options: row };
    });
  }, [contentDistributions]);

  // Extract keywords from comments
  const contentKeywords = useMemo(() => {
    const allText = [...analytics.highlights, ...analytics.improvements].join(' ').toLowerCase();
    const contentWords: Record<string, number> = {};
    
    // Keywords related to content
    const relevantWords = [
      'prática', 'teoria', 'técnica', 'hands-on', 'execução', 'conteúdo',
      'gestão', 'jurídico', 'legal', 'negócio', 'marketing', 'vendas',
      'didático', 'clareza', 'organização', 'material', 'apostila',
      'profundo', 'superficial', 'completo', 'básico', 'avançado'
    ];
    
    relevantWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      const matches = allText.match(regex);
      if (matches) {
        contentKeywords[word] = matches.length;
      }
    });
    
    return Object.entries(contentKeywords)
      .filter(([_, count]) => (count as number) > 0)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 10) as [string, number][];
  }, [analytics.highlights, analytics.improvements]);

  // Identify strengths and weaknesses
  const { strengths, weaknesses } = useMemo(() => {
    const areas = [
      { name: 'Fundamentos Técnicos', score: analytics.technicalContent.avgFoundations },
      { name: 'Carga Prática', score: analytics.technicalContent.avgPracticalLoad },
      { name: 'Aulas de Gestão', score: analytics.businessContent.avgManagement },
      { name: 'Segurança Jurídica', score: analytics.businessContent.avgLegalSecurity },
      { name: 'Clareza para Executar', score: analytics.confidence.avgClarity },
      { name: 'Confiança Adquirida', score: analytics.confidence.avgConfidence },
    ].sort((a, b) => b.score - a.score);
    
    return {
      strengths: areas.filter(a => a.score >= 7.5),
      weaknesses: areas.filter(a => a.score < 7.5),
    };
  }, [analytics]);

  // Generate insights
  const insights = useMemo(() => {
    const result: string[] = [];
    
    const avgAll = (analytics.technicalContent.avgFoundations + analytics.technicalContent.avgPracticalLoad + 
      analytics.businessContent.avgManagement + analytics.businessContent.avgLegalSecurity) / 4;
    
    if (avgAll >= 8.5) {
      result.push('✨ O conteúdo do curso está sendo muito bem avaliado de forma geral.');
    }
    
    if (analytics.technicalContent.avgFoundations > analytics.technicalContent.avgPracticalLoad + 1) {
      result.push('⚠️ A teoria está melhor avaliada que a prática. Considere aumentar exercícios práticos.');
    }
    
    if (analytics.businessContent.avgManagement < 7) {
      result.push('📊 As aulas de gestão precisam de mais relevância prática para o dia-a-dia.');
    }
    
    if (analytics.businessContent.avgLegalSecurity < 7) {
      result.push('⚖️ O conteúdo jurídico pode ser reforçado para maior segurança dos alunos.');
    }
    
    const equilibrado = analytics.technicalContent.balanceDistribution['equilibrado'] || 0;
    const total = Object.values(analytics.technicalContent.balanceDistribution).reduce((a, b) => a + b, 0);
    if (total > 0 && equilibrado / total < 0.5) {
      result.push('⚖️ Menos de 50% consideram o equilíbrio teoria/prática ideal.');
    }
    
    if (result.length === 0) {
      result.push('📈 Todos os indicadores de conteúdo estão dentro do esperado.');
    }
    
    return result;
  }, [analytics]);

  return (
    <div className="space-y-4">
      {/* Comparison Cards - Side by Side */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CONTENT_AREAS.map((area) => {
          const Icon = area.icon;
          const score = area.key === 'foundations' ? analytics.technicalContent.avgFoundations
            : area.key === 'practical' ? analytics.technicalContent.avgPracticalLoad
            : area.key === 'management' ? analytics.businessContent.avgManagement
            : analytics.businessContent.avgLegalSecurity;
          const scoreInfo = getScoreColor(score);
          
          return (
            <Card key={area.key} className="overflow-hidden">
              <div className="h-1" style={{ backgroundColor: scoreInfo.bg }} />
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded" style={{ backgroundColor: scoreInfo.bg + '20' }}>
                    <Icon className="h-4 w-4" style={{ color: scoreInfo.bg }} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{area.label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{score.toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm">/ 10</span>
                </div>
                <Badge 
                  variant="secondary" 
                  className="mt-2 text-xs"
                  style={{ backgroundColor: scoreInfo.bg + '20', color: scoreInfo.bg }}
                >
                  {scoreInfo.text}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Radar + Balance Distribution */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Radar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Comparativo de Conteúdo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} tickCount={6} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Balance Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Equilíbrio Teoria/Prática
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={balanceData}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ label, percentage }) => percentage > 0 ? `${percentage}%` : ''}
                  labelLine={false}
                >
                  {balanceData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} respostas`, name]} />
                <Legend 
                  layout="horizontal" 
                  align="center"
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Percentage Distribution for Each Area */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Distribuição de Respostas por Área
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {contentDistributions.map(area => (
              <div key={area.key} className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <area.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{area.label}</span>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={area.distribution} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="label" 
                      width={100} 
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${props.payload.count} (${props.payload.percentage}%)`,
                        ''
                      ]}
                    />
                    <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                      {area.distribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Mapa de Calor - Avaliações por Área
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Área</th>
                  {['Ruim', 'Baixo', 'Regular', 'Bom', 'Excelente'].map(level => (
                    <th key={level} className="text-center py-2 px-3 font-medium text-muted-foreground text-xs">
                      {level}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map(row => (
                  <tr key={row.area} className="border-t">
                    <td className="py-2 px-3 font-medium">{row.area}</td>
                    {row.options.map((opt, idx) => {
                      const intensity = opt.percentage / 100;
                      const bgColor = SCORE_COLORS[idx];
                      return (
                        <td 
                          key={idx} 
                          className="text-center py-2 px-3"
                          style={{ 
                            backgroundColor: intensity > 0 ? `${bgColor}${Math.round(intensity * 0.5 * 255).toString(16).padStart(2, '0')}` : 'transparent'
                          }}
                        >
                          <span className="font-semibold">{opt.count}</span>
                          {opt.percentage > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">({opt.percentage}%)</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Escala:</span>
            {SCORE_COLORS.map((color, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                <span>{['0', '2.5', '5', '7.5', '10'][idx]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Keywords + Insights */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Keywords Cloud */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Palavras-chave nos Comentários
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contentKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {contentKeywords.map(([word, count], idx) => (
                  <Badge 
                    key={word} 
                    variant="secondary"
                    className="text-sm py-1 px-3"
                    style={{ 
                      fontSize: `${Math.min(14 + count * 2, 20)}px`,
                      opacity: Math.max(0.5, 1 - idx * 0.08)
                    }}
                  >
                    {word} ({count})
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhum comentário relacionado a conteúdo encontrado.</p>
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Insights Automáticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                  <span className="text-sm">{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Strengths */}
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Pontos Fortes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strengths.length > 0 ? (
              <div className="space-y-2">
                {strengths.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                    <span className="font-medium text-sm">{item.name}</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      {item.score.toFixed(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhum ponto com score ≥ 7.5</p>
            )}
          </CardContent>
        </Card>

        {/* Weaknesses */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Pontos a Melhorar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weaknesses.length > 0 ? (
              <div className="space-y-2">
                {weaknesses.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <span className="font-medium text-sm">{item.name}</span>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                      {item.score.toFixed(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-700 dark:text-emerald-300">
                  Todos os indicadores estão acima de 7.5!
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
