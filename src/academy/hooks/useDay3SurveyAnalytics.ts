import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Day3SurveyAnalytics {
  totalResponses: number;
  completedResponses: number;
  completionRate: number;
  avgEffectiveTime: number;
  
  // Satisfaction Overview (0-10 scale)
  satisfaction: {
    avgLevel: number; // 0-10 scale
    promiseMet: Record<string, number>;
  };
  
  // Technical Content
  technicalContent: {
    avgFoundations: number;
    avgPracticalLoad: number;
    balanceDistribution: Record<string, number>;
  };
  
  // Confidence & Clarity
  confidence: {
    avgClarity: number;
    avgConfidence: number;
  };
  
  // Business Content
  businessContent: {
    avgManagement: number;
    avgLegalSecurity: number;
  };
  
  // Experience
  experience: {
    avgOrganization: number;
    avgSupport: number;
  };
  
  // Monitor Rankings
  monitorRankings: {
    technicalDomain: Record<string, number>;
    caringAttention: Record<string, number>;
  };
  
  // Open Feedback
  improvements: string[];
  highlights: string[];
  monitorComments: string[];
  
  // Student Responses
  responsesByStudent: {
    userId: string;
    studentName: string;
    completedAt: string | null;
    effectiveTime: number | null;
    overallScore: number;
    satisfactionLevel: string | null;
    responses: Record<string, string | null>;
  }[];
}

// Normalized to 0-10 scale (5 options: 0, 2.5, 5, 7.5, 10)
const VALUE_TO_SCORE: Record<string, Record<string, number>> = {
  q1_satisfaction_level: {
    muito_insatisfeito: 0, insatisfeito: 2.5, neutro: 5, satisfeito: 7.5, muito_satisfeito: 10
  },
  q2_promise_met: {
    muito_abaixo: 0, abaixo: 2.5, dentro: 5, acima: 7.5, muito_acima: 10
  },
  q3_technical_foundations: {
    muito_fracos: 0, fracos: 2.5, adequados: 5, bons: 7.5, excelentes: 10
  },
  q4_practical_load: {
    muito_insuficiente: 0, insuficiente: 2.5, adequada: 5, boa: 7.5, excelente: 10
  },
  q5_theory_practice_balance: {
    muito_teorico: 2.5, mais_teoria: 5, equilibrado: 10, mais_pratica: 7.5, muito_pratico: 5
  },
  q6_execution_clarity: {
    nenhuma: 0, pouca: 2.5, razoavel: 5, boa: 7.5, total: 10
  },
  q7_confidence_level: {
    nenhuma: 0, baixa: 2.5, moderada: 5, boa: 7.5, alta: 10
  },
  q8_management_classes: {
    nada_relevantes: 0, pouco_relevantes: 2.5, relevantes: 5, muito_relevantes: 7.5, essenciais: 10
  },
  q9_legal_security: {
    nenhuma: 0, pouca: 2.5, razoavel: 5, boa: 7.5, muita: 10
  },
  q10_organization: {
    muito_ruim: 0, ruim: 2.5, regular: 5, boa: 7.5, excelente: 10
  },
  q11_support_quality: {
    muito_fraco: 0, fraco: 2.5, adequado: 5, bom: 7.5, excelente: 10
  },
};

const MONITOR_LABELS: Record<string, string> = {
  elenilton: 'Dr. Elenilton',
  patrick: 'Dr. Patrick',
  eder: 'Dr. Eder',
  gleyldes: 'Dra. Gleyldes',
};

function getScore(key: string, value: string | null): number {
  if (!value || !VALUE_TO_SCORE[key]) return 0;
  return VALUE_TO_SCORE[key][value] || 0;
}

export function useDay3SurveyAnalytics(classId?: string | null) {
  return useQuery({
    queryKey: ['day3-survey-analytics', classId],
    queryFn: async (): Promise<Day3SurveyAnalytics | null> => {
      let query = supabase
        .from('day3_satisfaction_surveys')
        .select('*');
      
      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      const { data: surveys, error } = await query;
      
      if (error) {
        console.error('Error fetching day3 surveys:', error);
        return null;
      }
      
      if (!surveys || surveys.length === 0) {
        return null;
      }
      
      // Get user names
      const userIds = surveys.map(s => s.user_id);
      const { data: users } = await supabase
        .from('neohub_users')
        .select('user_id, full_name, email')
        .in('user_id', userIds);
      
      const userMap = new Map(users?.map(u => [u.user_id, u.full_name || u.email || 'Aluno']) || []);
      
      const completed = surveys.filter(s => s.is_completed);
      
      // Calculate averages
      const avgCalc = (key: string) => {
        const vals = completed.map(s => getScore(key, s[key as keyof typeof s] as string)).filter(v => v > 0);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      };
      
      const countDist = (key: string) => {
        const dist: Record<string, number> = {};
        completed.forEach(s => {
          const val = s[key as keyof typeof s] as string;
          if (val) dist[val] = (dist[val] || 0) + 1;
        });
        return dist;
      };
      
      // Monitor rankings
      const technicalDomain: Record<string, number> = {};
      const caringAttention: Record<string, number> = {};
      
      completed.forEach(s => {
        if (s.q14_best_technical_monitor) {
          const label = MONITOR_LABELS[s.q14_best_technical_monitor] || s.q14_best_technical_monitor;
          technicalDomain[label] = (technicalDomain[label] || 0) + 1;
        }
        if (s.q15_best_caring_monitor) {
          const label = MONITOR_LABELS[s.q15_best_caring_monitor] || s.q15_best_caring_monitor;
          caringAttention[label] = (caringAttention[label] || 0) + 1;
        }
      });
      
      // Open feedback
      const improvements = completed.map(s => s.q12_improvements).filter(Boolean) as string[];
      const highlights = completed.map(s => s.q13_highlights).filter(Boolean) as string[];
      const monitorComments = completed.map(s => s.q16_monitor_comments).filter(Boolean) as string[];
      
      // Student responses
      const responsesByStudent = surveys.map(s => {
        const scores = [
          getScore('q1_satisfaction_level', s.q1_satisfaction_level),
          getScore('q2_promise_met', s.q2_promise_met),
          getScore('q3_technical_foundations', s.q3_technical_foundations),
          getScore('q4_practical_load', s.q4_practical_load),
          getScore('q5_theory_practice_balance', s.q5_theory_practice_balance),
          getScore('q6_execution_clarity', s.q6_execution_clarity),
          getScore('q7_confidence_level', s.q7_confidence_level),
          getScore('q8_management_classes', s.q8_management_classes),
          getScore('q9_legal_security', s.q9_legal_security),
          getScore('q10_organization', s.q10_organization),
          getScore('q11_support_quality', s.q11_support_quality),
        ].filter(v => v > 0);
        
        const overallScore = scores.length > 0 
          ? scores.reduce((a, b) => a + b, 0) / scores.length // Already 0-10 scale
          : 0;
        
        return {
          userId: s.user_id,
          studentName: userMap.get(s.user_id) || 'Aluno',
          completedAt: s.completed_at,
          effectiveTime: s.effective_time_seconds,
          overallScore: Math.round(overallScore * 10) / 10,
          satisfactionLevel: s.q1_satisfaction_level,
          responses: {
            q1: s.q1_satisfaction_level,
            q2: s.q2_promise_met,
            q3: s.q3_technical_foundations,
            q4: s.q4_practical_load,
            q5: s.q5_theory_practice_balance,
            q6: s.q6_execution_clarity,
            q7: s.q7_confidence_level,
            q8: s.q8_management_classes,
            q9: s.q9_legal_security,
            q10: s.q10_organization,
            q11: s.q11_support_quality,
            q12: s.q12_improvements,
            q13: s.q13_highlights,
            q14: s.q14_best_technical_monitor,
            q15: s.q15_best_caring_monitor,
            q16: s.q16_monitor_comments,
          },
        };
      });
      
      const avgTime = completed.filter(s => s.effective_time_seconds).map(s => s.effective_time_seconds!);
      
      return {
        totalResponses: surveys.length,
        completedResponses: completed.length,
        completionRate: surveys.length > 0 ? (completed.length / surveys.length) * 100 : 0,
        avgEffectiveTime: avgTime.length > 0 ? avgTime.reduce((a, b) => a + b, 0) / avgTime.length : 0,
        
        satisfaction: {
          avgLevel: avgCalc('q1_satisfaction_level'),
          promiseMet: countDist('q2_promise_met'),
        },
        
        technicalContent: {
          avgFoundations: avgCalc('q3_technical_foundations'),
          avgPracticalLoad: avgCalc('q4_practical_load'),
          balanceDistribution: countDist('q5_theory_practice_balance'),
        },
        
        confidence: {
          avgClarity: avgCalc('q6_execution_clarity'),
          avgConfidence: avgCalc('q7_confidence_level'),
        },
        
        businessContent: {
          avgManagement: avgCalc('q8_management_classes'),
          avgLegalSecurity: avgCalc('q9_legal_security'),
        },
        
        experience: {
          avgOrganization: avgCalc('q10_organization'),
          avgSupport: avgCalc('q11_support_quality'),
        },
        
        monitorRankings: {
          technicalDomain,
          caringAttention,
        },
        
        improvements,
        highlights,
        monitorComments,
        responsesByStudent,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
