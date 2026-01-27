/**
 * Legal Module Dashboard Types
 */

import type { FeedbackWithAuthor } from "../FeedbackCard";

export interface LarissaMetrics {
  expectations: number;
  clarity: number;
  time: number;
  overall: number;
  totalResponses: number;
  feedbacksPositive: FeedbackWithAuthor[];
  feedbacksImprove: FeedbackWithAuthor[];
}

export interface LegalPerception {
  feelingDist: Record<string, number>;
  influenceDist: Record<string, number>;
  timingDist: Record<string, number>;
  averageScore: number;
  normalizedScore: number;
  leads: { hot: number; warm: number; cold: number };
  total: number;
}

export interface ExamMetrics {
  title: string;
  average: number;
  min: number;
  max: number;
  approved: number;
  total: number;
  approvalRate: number;
}

export interface StudentWithScores {
  userId: string;
  name: string;
  avatarUrl: string | null;
  scoreLegal: number;
  scoreNormalized: number;
  classification: 'hot' | 'warm' | 'cold';
  examScore: number | null;
  examPassed: boolean;
  feeling: string | null;
  influence: string | null;
  timing: string | null;
  // Full survey responses
  responses?: {
    q18_legal_feeling?: string | null;
    q19_legal_influence?: string | null;
    q20_legal_timing?: string | null;
    q7_larissa_expectations?: string | null;
    q8_larissa_clarity?: string | null;
    q9_larissa_time?: string | null;
    q10_larissa_liked_most?: string | null;
    q11_larissa_improve?: string | null;
  };
}

export interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  questionKey: string;
  distribution: Record<string, number>;
  total: number;
  averageScore: number;
}

// Response labels for display
export const FEELING_LABELS: Record<string, string> = {
  'Tranquilo e seguro': '😊 Tranquilo e seguro',
  'Um pouco inseguro': '😐 Um pouco inseguro',
  'Inseguro em pontos': '😟 Inseguro em alguns pontos',
  'Exposto a riscos': '😰 Exposto a riscos',
};

export const INFLUENCE_LABELS: Record<string, string> = {
  'Não influenciam': '✅ Não influenciam',
  'Influenciam pouco': '⚠️ Influenciam pouco',
  'Influenciam bastante': '🔶 Influenciam bastante',
  'Travaram decisões': '🚨 Travaram decisões',
};

export const TIMING_LABELS: Record<string, string> = {
  'Não é prioridade': '🔵 Não é prioridade',
  'Quando crescer': '🟡 Quando o negócio crescer',
  'Próximos meses': '🟠 Nos próximos meses',
  'O quanto antes': '🔴 O quanto antes',
};

export const CLASSIFICATION_COLORS = {
  hot: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300' },
  warm: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300' },
  cold: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300' },
};
