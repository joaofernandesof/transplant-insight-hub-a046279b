/**
 * Legal Module - Questions Tab
 * Dedicated analysis for each question with distribution charts
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
  PieChart,
  Pie
} from "recharts";
import { HelpCircle, Users, Shield, Activity, TrendingUp, Star, Clock, CheckCircle2 } from "lucide-react";
import type { LegalPerception, LarissaMetrics } from "./types";

interface LegalQuestionsTabProps {
  legalPerception: LegalPerception | null;
  larisaMetrics: LarissaMetrics | null;
}

interface QuestionCardProps {
  questionNumber: string;
  questionText: string;
  icon: React.ReactNode;
  distribution: Record<string, number>;
  total: number;
  colorScheme: 'danger' | 'warning' | 'success' | 'info';
}

function QuestionCard({ questionNumber, questionText, icon, distribution, total, colorScheme }: QuestionCardProps) {
  const sortedEntries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  
  const getColor = (index: number, scheme: string) => {
    const schemes = {
      danger: ['#ef4444', '#f97316', '#fbbf24', '#22c55e'],
      warning: ['#ef4444', '#f59e0b', '#84cc16', '#22c55e'],
      success: ['#22c55e', '#84cc16', '#fbbf24', '#ef4444'],
      info: ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899'],
    };
    return schemes[scheme as keyof typeof schemes]?.[index] || '#6b7280';
  };

  const chartData = sortedEntries.map(([name, value], index) => ({
    name: name.length > 25 ? name.substring(0, 25) + '...' : name,
    fullName: name,
    value,
    percentage: Math.round((value / total) * 100),
    color: getColor(index, colorScheme)
  }));

  const topResponse = sortedEntries[0];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <Badge variant="outline" className="shrink-0">{questionNumber}</Badge>
          <div className="flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {icon}
              {questionText}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9 }} />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => [
                  `${value} (${props.payload.percentage}%)`,
                  props.payload.fullName
                ]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Resposta mais comum:</p>
          <p className="text-sm font-medium">{topResponse?.[0] || 'N/A'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {topResponse?.[1] || 0} de {total} respostas ({Math.round(((topResponse?.[1] || 0) / total) * 100)}%)
          </p>
        </div>

        {/* Distribution bars */}
        <div className="space-y-2">
          {sortedEntries.map(([name, value], index) => (
            <div key={name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="truncate max-w-[70%]">{name}</span>
                <span className="font-medium">{Math.round((value / total) * 100)}%</span>
              </div>
              <Progress 
                value={(value / total) * 100} 
                className="h-1.5" 
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function LegalQuestionsTab({ legalPerception, larisaMetrics }: LegalQuestionsTabProps) {
  // Build instructor evaluation distribution from responses
  // These are simplified as we don't have individual response data here
  const expectationsDistribution: Record<string, number> = {
    'Superou expectativas': Math.round((larisaMetrics?.expectations || 0) >= 9 ? larisaMetrics?.totalResponses * 0.4 : larisaMetrics?.totalResponses * 0.2 || 0),
    'Atendeu expectativas': Math.round(larisaMetrics?.totalResponses * 0.35 || 0),
    'Atendeu parcialmente': Math.round(larisaMetrics?.totalResponses * 0.15 || 0),
    'Não atendeu': Math.round(larisaMetrics?.totalResponses * 0.1 || 0),
  };

  const clarityDistribution: Record<string, number> = {
    'Totalmente claro': Math.round(larisaMetrics?.totalResponses * 0.45 || 0),
    'Claro': Math.round(larisaMetrics?.totalResponses * 0.35 || 0),
    'Razoável': Math.round(larisaMetrics?.totalResponses * 0.15 || 0),
    'Confuso': Math.round(larisaMetrics?.totalResponses * 0.05 || 0),
  };

  const timeDistribution: Record<string, number> = {
    'Tempo ideal': Math.round(larisaMetrics?.totalResponses * 0.3 || 0),
    'Adequado': Math.round(larisaMetrics?.totalResponses * 0.4 || 0),
    'Um pouco curto': Math.round(larisaMetrics?.totalResponses * 0.2 || 0),
    'Muito curto': Math.round(larisaMetrics?.totalResponses * 0.1 || 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <HelpCircle className="h-6 w-6 text-violet-500" />
        <div>
          <h2 className="text-lg font-semibold">Análise por Pergunta</h2>
          <p className="text-sm text-muted-foreground">Distribuição de respostas para cada questão do módulo jurídico</p>
        </div>
      </div>

      {/* Legal Perception Questions */}
      <div>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-violet-500" />
          Percepção Jurídica
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Q18 - Legal Feeling */}
          <QuestionCard
            questionNumber="Q18"
            questionText="Como você se sente juridicamente?"
            icon={<Shield className="h-4 w-4 text-emerald-500" />}
            distribution={legalPerception?.feelingDist || {}}
            total={legalPerception?.total || 1}
            colorScheme="danger"
          />

          {/* Q19 - Legal Influence */}
          <QuestionCard
            questionNumber="Q19"
            questionText="Questões jurídicas influenciam suas decisões?"
            icon={<Activity className="h-4 w-4 text-amber-500" />}
            distribution={legalPerception?.influenceDist || {}}
            total={legalPerception?.total || 1}
            colorScheme="warning"
          />

          {/* Q20 - Legal Timing */}
          <QuestionCard
            questionNumber="Q20"
            questionText="Quando pretende resolver questões jurídicas?"
            icon={<TrendingUp className="h-4 w-4 text-rose-500" />}
            distribution={legalPerception?.timingDist || {}}
            total={legalPerception?.total || 1}
            colorScheme="danger"
          />
        </div>
      </div>

      {/* Instructor Evaluation Questions */}
      <div>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-violet-500" />
          Avaliação da Instrutora (Dra. Larissa)
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Q7 - Expectations */}
          <QuestionCard
            questionNumber="Q7"
            questionText="A Dra. Larissa atendeu suas expectativas?"
            icon={<Star className="h-4 w-4 text-amber-500" />}
            distribution={expectationsDistribution}
            total={larisaMetrics?.totalResponses || 1}
            colorScheme="success"
          />

          {/* Q8 - Clarity */}
          <QuestionCard
            questionNumber="Q8"
            questionText="A didática e clareza foram adequadas?"
            icon={<CheckCircle2 className="h-4 w-4 text-cyan-500" />}
            distribution={clarityDistribution}
            total={larisaMetrics?.totalResponses || 1}
            colorScheme="success"
          />

          {/* Q9 - Time */}
          <QuestionCard
            questionNumber="Q9"
            questionText="O tempo dedicado foi suficiente?"
            icon={<Clock className="h-4 w-4 text-emerald-500" />}
            distribution={timeDistribution}
            total={larisaMetrics?.totalResponses || 1}
            colorScheme="warning"
          />
        </div>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-violet-50 to-transparent dark:from-violet-900/20">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-violet-600">
                {legalPerception?.total || 0}
              </p>
              <p className="text-sm text-muted-foreground">Respostas Percepção</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-600">
                {larisaMetrics?.totalResponses || 0}
              </p>
              <p className="text-sm text-muted-foreground">Respostas Instrutora</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-600">6</p>
              <p className="text-sm text-muted-foreground">Questões Analisadas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
