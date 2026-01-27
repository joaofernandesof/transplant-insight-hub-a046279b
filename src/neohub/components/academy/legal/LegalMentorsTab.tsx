/**
 * Legal Module - Mentors Tab
 * Dedicated analysis for Dra. Larissa and Dra. Caroline
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Legend
} from "recharts";
import { Users, Star, AlertTriangle, CheckCircle2, TrendingUp, Award } from "lucide-react";
import { FeedbackCard, FeedbackGrid, FeedbackEmpty } from "../FeedbackCard";
import type { LarissaMetrics } from "./types";

interface LegalMentorsTabProps {
  larisaMetrics: LarissaMetrics | null;
}

export function LegalMentorsTab({ larisaMetrics }: LegalMentorsTabProps) {
  // Radar data
  const radarData = larisaMetrics ? [
    { dimension: 'Expectativas', Larissa: larisaMetrics.expectations, fullMark: 10 },
    { dimension: 'Clareza', Larissa: larisaMetrics.clarity, fullMark: 10 },
    { dimension: 'Tempo', Larissa: larisaMetrics.time, fullMark: 10 },
  ] : [];

  // Bar data for detailed scores
  const barData = larisaMetrics ? [
    { metric: 'Expectativas', score: larisaMetrics.expectations, color: '#8b5cf6' },
    { metric: 'Clareza', score: larisaMetrics.clarity, color: '#06b6d4' },
    { metric: 'Tempo', score: larisaMetrics.time, color: '#10b981' },
    { metric: 'Média Geral', score: larisaMetrics.overall, color: '#f59e0b' },
  ] : [];

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600';
    if (score >= 6) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 9) return { label: 'Excelente', color: 'bg-emerald-100 text-emerald-700' };
    if (score >= 8) return { label: 'Muito Bom', color: 'bg-emerald-50 text-emerald-600' };
    if (score >= 7) return { label: 'Bom', color: 'bg-amber-100 text-amber-700' };
    if (score >= 6) return { label: 'Regular', color: 'bg-amber-50 text-amber-600' };
    return { label: 'Precisa Melhorar', color: 'bg-rose-100 text-rose-700' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Award className="h-6 w-6 text-violet-500" />
        <div>
          <h2 className="text-lg font-semibold">Avaliação das Mentoras</h2>
          <p className="text-sm text-muted-foreground">Análise detalhada do desempenho no módulo jurídico</p>
        </div>
      </div>

      {/* Mentors Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Dra. Larissa - Full Card */}
        <Card className="border-2 border-violet-200 dark:border-violet-800 lg:row-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-full">
                <Users className="h-6 w-6 text-violet-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">Dra. Larissa</CardTitle>
                <p className="text-sm text-muted-foreground">Direito Médico</p>
              </div>
              {larisaMetrics && (
                <div className="text-right">
                  <p className={`text-3xl font-bold ${getScoreColor(larisaMetrics.overall)}`}>
                    {larisaMetrics.overall.toFixed(1)}
                  </p>
                  <Badge className={getScoreBadge(larisaMetrics.overall).color}>
                    {getScoreBadge(larisaMetrics.overall).label}
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Radar Chart */}
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Radar 
                    name="Dra. Larissa" 
                    dataKey="Larissa" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.5} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Metrics */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-violet-500" />
                    Atendimento às Expectativas
                  </span>
                  <span className={`font-bold ${getScoreColor(larisaMetrics?.expectations || 0)}`}>
                    {larisaMetrics?.expectations.toFixed(1)}/10
                  </span>
                </div>
                <Progress value={(larisaMetrics?.expectations || 0) * 10} className="h-3" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                    Clareza e Didática
                  </span>
                  <span className={`font-bold ${getScoreColor(larisaMetrics?.clarity || 0)}`}>
                    {larisaMetrics?.clarity.toFixed(1)}/10
                  </span>
                </div>
                <Progress value={(larisaMetrics?.clarity || 0) * 10} className="h-3" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Gestão do Tempo
                  </span>
                  <span className={`font-bold ${getScoreColor(larisaMetrics?.time || 0)}`}>
                    {larisaMetrics?.time.toFixed(1)}/10
                  </span>
                </div>
                <Progress value={(larisaMetrics?.time || 0) * 10} className="h-3" />
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
              <p className="text-sm text-violet-700 dark:text-violet-300">
                <strong>{larisaMetrics?.totalResponses || 0} avaliações</strong> recebidas. 
                {larisaMetrics && larisaMetrics.overall >= 8 && " Desempenho excelente com alta satisfação dos alunos."}
                {larisaMetrics && larisaMetrics.overall >= 7 && larisaMetrics.overall < 8 && " Bom desempenho com oportunidades de melhoria."}
                {larisaMetrics && larisaMetrics.overall < 7 && " Requer atenção e ajustes no conteúdo ou abordagem."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dra. Caroline Card */}
        <Card className="border-2 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Dra. Caroline</CardTitle>
                <p className="text-sm text-muted-foreground">Co-instrutora Direito Médico</p>
              </div>
              <Badge variant="outline">Co-instrutora</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <AlertTriangle className="h-12 w-12 text-amber-500 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                Avaliação individual não disponível
              </p>
              <p className="text-xs text-muted-foreground mt-2 max-w-sm">
                Campos específicos de avaliação para a Dra. Caroline não foram configurados no formulário atual.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Métricas Detalhadas - Dra. Larissa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="metric" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => value.toFixed(1)} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedbacks Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Positive Feedbacks */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Pontos Fortes ({larisaMetrics?.feedbacksPositive.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto">
              <FeedbackGrid>
                {larisaMetrics?.feedbacksPositive.map((item, i) => (
                  <FeedbackCard key={i} item={item} variant="positive" />
                ))}
                {(!larisaMetrics?.feedbacksPositive || larisaMetrics.feedbacksPositive.length === 0) && (
                  <FeedbackEmpty message="Nenhum feedback positivo registrado." />
                )}
              </FeedbackGrid>
            </div>
          </CardContent>
        </Card>

        {/* Improvement Suggestions */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              Sugestões de Melhoria ({larisaMetrics?.feedbacksImprove.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto">
              <FeedbackGrid>
                {larisaMetrics?.feedbacksImprove.map((item, i) => (
                  <FeedbackCard key={i} item={item} variant="improvement" />
                ))}
                {(!larisaMetrics?.feedbacksImprove || larisaMetrics.feedbacksImprove.length === 0) && (
                  <FeedbackEmpty message="Nenhuma sugestão de melhoria registrada." />
                )}
              </FeedbackGrid>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
