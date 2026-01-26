import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Day2SurveyResponse {
  id: string;
  user_id: string;
  class_id: string | null;
  created_at: string;
  completed_at: string | null;
  is_completed: boolean;
  current_section: number;
  effective_time_seconds: number | null;
  // Satisfaction
  q1_satisfaction_level: string | null;
  // João evaluation
  q2_joao_expectations: string | null;
  q3_joao_clarity: string | null;
  q4_joao_time: string | null;
  q5_joao_liked_most: string | null;
  q6_joao_improve: string | null;
  // Larissa evaluation
  q7_larissa_expectations: string | null;
  q8_larissa_clarity: string | null;
  q9_larissa_time: string | null;
  q10_larissa_liked_most: string | null;
  q11_larissa_improve: string | null;
  // IA Avivar
  q12_avivar_current_process: string | null;
  q13_avivar_opportunity_loss: string | null;
  q14_avivar_timing: string | null;
  // License
  q15_license_path: string | null;
  q16_license_pace: string | null;
  q17_license_timing: string | null;
  // Legal
  q18_legal_feeling: string | null;
  q19_legal_influence: string | null;
  q20_legal_timing: string | null;
  // Scores
  score_ia_avivar: number | null;
  score_license: number | null;
  score_legal: number | null;
  score_total: number | null;
  lead_classification: string | null;
}

interface Day2SurveyWithUser extends Day2SurveyResponse {
  neohub_users: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export interface Day2QuestionRating {
  questionKey: string;
  questionLabel: string;
  category: string;
  avgRating: number;
  totalResponses: number;
  responseBreakdown: Record<string, number>;
}

export interface Day2StudentResponse {
  id: string;
  surveyId: string;
  userId: string;
  userName: string;
  email: string;
  avatarUrl: string | null;
  satisfaction: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  effectiveTimeSeconds: number | null;
  scores: {
    ia: number;
    license: number;
    legal: number;
    total: number;
  };
  classification: 'hot' | 'warm' | 'cold';
  responses: {
    questionKey: string;
    value: string | null;
    numericValue?: number;
  }[];
}

export interface Day2InstructorMetrics {
  name: string;
  avgExpectations: number;
  avgClarity: number;
  avgTime: number;
  overallAvg: number;
  totalResponses: number;
  strengths: string[];
  improvements: string[];
}

// Rating scale mapping (Day 2 uses similar scale)
const RATING_MAP: Record<string, number> = {
  'Superou totalmente minhas expectativas': 5,
  'Superou minhas expectativas': 4,
  'Atendeu minhas expectativas': 3,
  'Atendeu parcialmente': 2,
  'Não atendeu': 1,
  // Clarity scale
  'Extremamente claro e didático': 5,
  'Muito claro': 4,
  'Claro o suficiente': 3,
  'Um pouco confuso': 2,
  'Difícil de acompanhar': 1,
  // Time scale
  'Ideal, passou rápido': 5,
  'Bom, equilibrado': 4,
  'Razoável': 3,
  'Um pouco arrastado': 2,
  'Muito longo': 1,
};

// Satisfaction scale
const SATISFACTION_MAP: Record<string, number> = {
  'Muito satisfeito': 10,
  'Satisfeito': 8,
  'Parcialmente satisfeito': 6,
  'Insatisfeito': 3,
  'Muito insatisfeito': 1,
};

// BNT Questions score mapping
const BNT_SCORE_MAP: Record<string, number> = {
  // IA Avivar Q12
  'Tudo depende de pessoas e memória': 0,
  'Tenho organização básica, mas com falhas frequentes': 2,
  'Consigo organizar, mas sinto limites claros': 4,
  'Tenho estrutura e quero ganhar escala e previsibilidade': 6,
  // IA Avivar Q13
  'Funciona bem do jeito que está': 0,
  'Funciona, mas gera desgaste': 2,
  'Funciona com perda de oportunidades': 4,
  'É um gargalo claro no crescimento': 6,
  // IA Avivar Q14
  'Não é prioridade agora': 0,
  'Quando tiver mais tempo': 2,
  'Nos próximos meses': 4,
  'O quanto antes': 6,
  // License Q15
  'Não é viável para mim hoje': 0,
  'Seria viável apenas com muito planejamento': 2,
  'É viável se o modelo fizer sentido': 4,
  'É totalmente viável para mim': 6,
  // License Q16
  'Não me expõe': 0,
  'Me expõe pouco': 2,
  'Me expõe bastante': 4,
  'É um dos meus principais gargalos': 6,
  // License Q17
  'Não penso nisso no momento': 0,
  'Talvez em um futuro distante': 2,
  // 'Nos próximos meses': 4, // already defined
  'Agora é o momento certo': 6,
  // Legal Q18
  'Tranquilo e seguro': 0,
  'Um pouco inseguro': 2,
  'Inseguro em alguns pontos': 4,
  'Exposto a riscos que me preocupam': 6,
  // Legal Q19
  'Não influenciam': 0,
  'Influenciam pouco': 2,
  'Influenciam bastante': 4,
  'Travaram ou quase travaram decisões importantes': 6,
  // Legal Q20
  'Não vejo isso como prioridade': 0,
  'Quando o negócio estiver maior': 2,
  // 'Nos próximos meses': 4, // already defined
  // 'O quanto antes': 6, // already defined
};

const QUESTION_LABELS: Record<string, { label: string; category: string }> = {
  q1_satisfaction_level: { label: 'Nível de satisfação geral', category: 'Geral' },
  q2_joao_expectations: { label: 'João - Expectativas', category: 'Dr. João' },
  q3_joao_clarity: { label: 'João - Clareza', category: 'Dr. João' },
  q4_joao_time: { label: 'João - Tempo', category: 'Dr. João' },
  q5_joao_liked_most: { label: 'João - O que mais gostou', category: 'Dr. João' },
  q6_joao_improve: { label: 'João - O que melhorar', category: 'Dr. João' },
  q7_larissa_expectations: { label: 'Larissa - Expectativas', category: 'Dra. Larissa' },
  q8_larissa_clarity: { label: 'Larissa - Clareza', category: 'Dra. Larissa' },
  q9_larissa_time: { label: 'Larissa - Tempo', category: 'Dra. Larissa' },
  q10_larissa_liked_most: { label: 'Larissa - O que mais gostou', category: 'Dra. Larissa' },
  q11_larissa_improve: { label: 'Larissa - O que melhorar', category: 'Dra. Larissa' },
  q12_avivar_current_process: { label: 'Processo atual de gestão', category: 'IA Avivar' },
  q13_avivar_opportunity_loss: { label: 'Perda de oportunidades', category: 'IA Avivar' },
  q14_avivar_timing: { label: 'Timing para IA', category: 'IA Avivar' },
  q15_license_path: { label: 'Viabilidade da licença', category: 'Licença' },
  q16_license_pace: { label: 'Exposição ao ritmo', category: 'Licença' },
  q17_license_timing: { label: 'Timing para licença', category: 'Licença' },
  q18_legal_feeling: { label: 'Sensação jurídica', category: 'Jurídico' },
  q19_legal_influence: { label: 'Influência jurídica', category: 'Jurídico' },
  q20_legal_timing: { label: 'Timing para assessoria', category: 'Jurídico' },
};

function parseNumericValue(value: string | null): number | undefined {
  if (!value) return undefined;
  // Check rating maps
  if (RATING_MAP[value] !== undefined) return RATING_MAP[value];
  if (SATISFACTION_MAP[value] !== undefined) return SATISFACTION_MAP[value];
  if (BNT_SCORE_MAP[value] !== undefined) return BNT_SCORE_MAP[value];
  return undefined;
}

function calculateScores(survey: Day2SurveyResponse) {
  const iaScore = (BNT_SCORE_MAP[survey.q12_avivar_current_process || ''] || 0) +
    (BNT_SCORE_MAP[survey.q13_avivar_opportunity_loss || ''] || 0) +
    (BNT_SCORE_MAP[survey.q14_avivar_timing || ''] || 0);
  
  const licenseScore = (BNT_SCORE_MAP[survey.q15_license_path || ''] || 0) +
    (BNT_SCORE_MAP[survey.q16_license_pace || ''] || 0) +
    (BNT_SCORE_MAP[survey.q17_license_timing || ''] || 0);
  
  const legalScore = (BNT_SCORE_MAP[survey.q18_legal_feeling || ''] || 0) +
    (BNT_SCORE_MAP[survey.q19_legal_influence || ''] || 0) +
    (BNT_SCORE_MAP[survey.q20_legal_timing || ''] || 0);
  
  const total = iaScore + licenseScore + legalScore;
  const classification: 'hot' | 'warm' | 'cold' = total >= 40 ? 'hot' : total >= 25 ? 'warm' : 'cold';
  
  return { ia: iaScore, license: licenseScore, legal: legalScore, total, classification };
}

function calculateInstructorMetrics(surveys: Day2SurveyWithUser[], prefix: 'joao' | 'larissa'): Day2InstructorMetrics {
  const name = prefix === 'joao' ? 'Dr. João' : 'Dra. Larissa';
  const expKey = prefix === 'joao' ? 'q2_joao_expectations' : 'q7_larissa_expectations';
  const clarityKey = prefix === 'joao' ? 'q3_joao_clarity' : 'q8_larissa_clarity';
  const timeKey = prefix === 'joao' ? 'q4_joao_time' : 'q9_larissa_time';
  const likedKey = prefix === 'joao' ? 'q5_joao_liked_most' : 'q10_larissa_liked_most';
  const improveKey = prefix === 'joao' ? 'q6_joao_improve' : 'q11_larissa_improve';
  
  let expSum = 0, expCount = 0;
  let claritySum = 0, clarityCount = 0;
  let timeSum = 0, timeCount = 0;
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  surveys.forEach(s => {
    const expVal = parseNumericValue((s as any)[expKey]);
    if (expVal !== undefined) { expSum += expVal; expCount++; }
    
    const clarityVal = parseNumericValue((s as any)[clarityKey]);
    if (clarityVal !== undefined) { claritySum += clarityVal; clarityCount++; }
    
    const timeVal = parseNumericValue((s as any)[timeKey]);
    if (timeVal !== undefined) { timeSum += timeVal; timeCount++; }
    
    const liked = (s as any)[likedKey];
    if (liked && liked.trim()) strengths.push(liked);
    
    const improve = (s as any)[improveKey];
    if (improve && improve.trim()) improvements.push(improve);
  });
  
  const avgExpectations = expCount > 0 ? expSum / expCount : 0;
  const avgClarity = clarityCount > 0 ? claritySum / clarityCount : 0;
  const avgTime = timeCount > 0 ? timeSum / timeCount : 0;
  const overallAvg = (avgExpectations + avgClarity + avgTime) / 3;
  
  return {
    name,
    avgExpectations,
    avgClarity,
    avgTime,
    overallAvg,
    totalResponses: Math.max(expCount, clarityCount, timeCount),
    strengths,
    improvements,
  };
}

export interface Day2SurveyAnalytics {
  totalResponses: number;
  completedResponses: number;
  partialResponses: number;
  completionRate: number;
  avgEffectiveTime: number;
  minEffectiveTime: number;
  maxEffectiveTime: number;
  // Scores
  avgScoreTotal: number;
  avgScoreIA: number;
  avgScoreLicense: number;
  avgScoreLegal: number;
  // Classification counts
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  // Satisfaction
  overallSatisfaction: string;
  overallSatisfactionPercent: number;
  satisfactionBreakdown: Record<string, number>;
  // Instructors
  instructors: {
    joao: Day2InstructorMetrics;
    larissa: Day2InstructorMetrics;
  };
  // BNT section averages
  bntSections: {
    iaAvivar: { avg: number; breakdown: Record<string, number> };
    license: { avg: number; breakdown: Record<string, number> };
    legal: { avg: number; breakdown: Record<string, number> };
  };
  // All questions
  allQuestions: Day2QuestionRating[];
  // Student responses
  responsesByStudent: Day2StudentResponse[];
  // Timing data
  timingData: { userName: string; seconds: number }[];
}

export function useDay2SurveyAnalytics(classId?: string | null) {
  return useQuery({
    queryKey: ['day2-survey-analytics', classId],
    queryFn: async (): Promise<Day2SurveyAnalytics | null> => {
      let query = supabase
        .from('day2_satisfaction_surveys')
        .select('*')
        .order('score_total', { ascending: false });
      
      if (classId) {
        query = query.eq('class_id', classId);
      }
      
      const { data: surveysData, error } = await query;
      if (error) throw error;
      if (!surveysData || surveysData.length === 0) return null;
      
      // Fetch user info
      const userIds = surveysData.map(s => s.user_id);
      const { data: usersData } = await supabase
        .from('neohub_users')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);
      
      const surveys: Day2SurveyWithUser[] = surveysData.map(survey => ({
        ...survey,
        neohub_users: usersData?.find(u => u.user_id === survey.user_id) || {
          full_name: 'Usuário',
          email: '',
          avatar_url: null,
        },
      }));
      
      // Calculate totals
      const completedSurveys = surveys.filter(s => s.is_completed);
      const partialSurveys = surveys.filter(s => !s.is_completed);
      
      // Timing data
      const timingData = surveys
        .filter(s => s.effective_time_seconds && s.effective_time_seconds > 0)
        .map(s => ({
          userName: s.neohub_users.full_name,
          seconds: s.effective_time_seconds!,
        }));
      
      const effectiveTimes = timingData.map(t => t.seconds);
      const avgEffectiveTime = effectiveTimes.length > 0 
        ? effectiveTimes.reduce((a, b) => a + b, 0) / effectiveTimes.length 
        : 0;
      
      // Calculate scores (normalize to 0-10 scale)
      // Raw scores: ia=0-18, license=0-18, legal=0-18, total=0-54
      const normalize18to10 = (score: number) => Math.min(10, (score / 18) * 10);
      const normalize54to10 = (score: number) => Math.min(10, (score / 54) * 10);
      
      const scoresData = surveys.map(s => calculateScores(s));
      const avgScoreTotal = scoresData.length > 0 
        ? normalize54to10(scoresData.reduce((sum, s) => sum + s.total, 0) / scoresData.length)
        : 0;
      const avgScoreIA = scoresData.length > 0 
        ? normalize18to10(scoresData.reduce((sum, s) => sum + s.ia, 0) / scoresData.length)
        : 0;
      const avgScoreLicense = scoresData.length > 0 
        ? normalize18to10(scoresData.reduce((sum, s) => sum + s.license, 0) / scoresData.length)
        : 0;
      const avgScoreLegal = scoresData.length > 0 
        ? normalize18to10(scoresData.reduce((sum, s) => sum + s.legal, 0) / scoresData.length)
        : 0;
      
      // Classification counts
      const hotLeads = scoresData.filter(s => s.classification === 'hot').length;
      const warmLeads = scoresData.filter(s => s.classification === 'warm').length;
      const coldLeads = scoresData.filter(s => s.classification === 'cold').length;
      
      // Satisfaction breakdown - normalize labels
      const SATISFACTION_LABEL_MAP: Record<string, string> = {
        'muito_satisfeito': 'Muito satisfeito',
        'Muito satisfeito': 'Muito satisfeito',
        'Muito Satisfeito': 'Muito satisfeito',
        'satisfeito': 'Satisfeito',
        'Satisfeito': 'Satisfeito',
        'neutro': 'Neutro',
        'Neutro': 'Neutro',
        'insatisfeito': 'Insatisfeito',
        'Insatisfeito': 'Insatisfeito',
        'muito_insatisfeito': 'Muito insatisfeito',
        'Muito insatisfeito': 'Muito insatisfeito',
        'Muito Insatisfeito': 'Muito insatisfeito',
      };
      
      const satisfactionBreakdown: Record<string, number> = {};
      surveys.forEach(s => {
        if (s.q1_satisfaction_level) {
          const normalizedLabel = SATISFACTION_LABEL_MAP[s.q1_satisfaction_level] || s.q1_satisfaction_level;
          satisfactionBreakdown[normalizedLabel] = (satisfactionBreakdown[normalizedLabel] || 0) + 1;
        }
      });
      
      // Overall satisfaction
      const satisfactionValues = surveys
        .map(s => SATISFACTION_MAP[s.q1_satisfaction_level || ''])
        .filter(v => v !== undefined) as number[];
      const avgSatisfaction = satisfactionValues.length > 0 
        ? satisfactionValues.reduce((a, b) => a + b, 0) / satisfactionValues.length 
        : 0;
      const overallSatisfactionPercent = (avgSatisfaction / 10) * 100;
      const overallSatisfaction = avgSatisfaction >= 8 ? 'Satisfeito' : 
        avgSatisfaction >= 6 ? 'Parcialmente satisfeito' : 'Insatisfeito';
      
      // Instructor metrics
      const joaoMetrics = calculateInstructorMetrics(surveys, 'joao');
      const larissaMetrics = calculateInstructorMetrics(surveys, 'larissa');
      
      // BNT sections breakdown
      const bntSections = {
        iaAvivar: {
          avg: avgScoreIA,
          breakdown: {} as Record<string, number>,
        },
        license: {
          avg: avgScoreLicense,
          breakdown: {} as Record<string, number>,
        },
        legal: {
          avg: avgScoreLegal,
          breakdown: {} as Record<string, number>,
        },
      };
      
      surveys.forEach(s => {
        // IA Avivar
        if (s.q12_avivar_current_process) {
          bntSections.iaAvivar.breakdown[s.q12_avivar_current_process] = 
            (bntSections.iaAvivar.breakdown[s.q12_avivar_current_process] || 0) + 1;
        }
        // License
        if (s.q15_license_path) {
          bntSections.license.breakdown[s.q15_license_path] = 
            (bntSections.license.breakdown[s.q15_license_path] || 0) + 1;
        }
        // Legal
        if (s.q18_legal_feeling) {
          bntSections.legal.breakdown[s.q18_legal_feeling] = 
            (bntSections.legal.breakdown[s.q18_legal_feeling] || 0) + 1;
        }
      });
      
      // All questions
      const allQuestions: Day2QuestionRating[] = [];
      Object.entries(QUESTION_LABELS).forEach(([key, info]) => {
        const responseBreakdown: Record<string, number> = {};
        let totalValue = 0;
        let totalCount = 0;
        
        surveys.forEach(s => {
          const value = (s as any)[key];
          if (value) {
            responseBreakdown[value] = (responseBreakdown[value] || 0) + 1;
            const numVal = parseNumericValue(value);
            if (numVal !== undefined) {
              totalValue += numVal;
              totalCount++;
            }
          }
        });
        
        allQuestions.push({
          questionKey: key,
          questionLabel: info.label,
          category: info.category,
          avgRating: totalCount > 0 ? totalValue / totalCount : 0,
          totalResponses: Object.values(responseBreakdown).reduce((a, b) => a + b, 0),
          responseBreakdown,
        });
      });
      
      // Student responses
      const responsesByStudent: Day2StudentResponse[] = surveys.map((s, idx) => {
        const scores = calculateScores(s);
        const responses: { questionKey: string; value: string | null; numericValue?: number }[] = [];
        
        Object.keys(QUESTION_LABELS).forEach(key => {
          const value = (s as any)[key];
          responses.push({
            questionKey: key,
            value,
            numericValue: parseNumericValue(value),
          });
        });
        
        return {
          id: `student-${idx}`,
          surveyId: s.id,
          userId: s.user_id,
          userName: s.neohub_users.full_name,
          email: s.neohub_users.email,
          avatarUrl: s.neohub_users.avatar_url,
          satisfaction: s.q1_satisfaction_level,
          isCompleted: s.is_completed,
          completedAt: s.completed_at,
          effectiveTimeSeconds: s.effective_time_seconds,
          scores,
          classification: scores.classification,
          responses,
        };
      });
      
      return {
        totalResponses: surveys.length,
        completedResponses: completedSurveys.length,
        partialResponses: partialSurveys.length,
        completionRate: surveys.length > 0 ? (completedSurveys.length / surveys.length) * 100 : 0,
        avgEffectiveTime,
        minEffectiveTime: effectiveTimes.length > 0 ? Math.min(...effectiveTimes) : 0,
        maxEffectiveTime: effectiveTimes.length > 0 ? Math.max(...effectiveTimes) : 0,
        avgScoreTotal,
        avgScoreIA,
        avgScoreLicense,
        avgScoreLegal,
        hotLeads,
        warmLeads,
        coldLeads,
        overallSatisfaction,
        overallSatisfactionPercent,
        satisfactionBreakdown,
        instructors: {
          joao: joaoMetrics,
          larissa: larissaMetrics,
        },
        bntSections,
        allQuestions,
        responsesByStudent,
        timingData,
      };
    },
  });
}
