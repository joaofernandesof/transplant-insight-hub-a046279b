import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GlobalInstructorData {
  name: string;
  day: 'day1' | 'day2';
  avgExpectations: number;
  avgClarity: number;
  avgTime: number;
  overallAvg: number;
  totalResponses: number;
}

export interface GlobalMonitorData {
  name: string;
  day: 'day1' | 'day3';
  overallAvg: number;
  avgTechnical: number;
  avgInterest: number;
  avgEngagement: number;
  avgPosture: number;
  avgCommunication: number;
  avgContribution: number;
  votes: number;
}

export interface GlobalSatisfactionData {
  day1: { avg: number; count: number };
  day2: { avg: number; count: number };
  day3: { avg: number; count: number };
  overall: number;
  totalResponses: number;
}

export interface GlobalLeadData {
  hot: number;
  warm: number;
  cold: number;
  total: number;
  avgScoreIA: number;
  avgScoreLicense: number;
  avgScoreLegal: number;
}

export interface GlobalContentMetrics {
  // Day 3 content metrics
  avgTechnical: number;
  avgPractical: number;
  avgManagement: number;
  avgLegal: number;
  avgClarity: number;
  avgConfidence: number;
  avgOrganization: number;
  avgSupport: number;
}

export interface GlobalAnalytics {
  satisfaction: GlobalSatisfactionData;
  instructors: GlobalInstructorData[];
  monitors: GlobalMonitorData[];
  leads: GlobalLeadData;
  highlights: string[];
  improvements: string[];
  completionRates: {
    day1: number;
    day2: number;
    day3: number;
  };
  totalStudents: number;
  contentMetrics: GlobalContentMetrics;
  globalAvg: number;
}

// Rating scale mapping (0-10) - MUST match exact database values
const RATING_SCALE: Record<string, number> = {
  // Satisfaction levels (multiple formats)
  'muito_satisfeito': 10, 'Muito satisfeito': 10, 'Muito Satisfeito': 10,
  'satisfeito': 7.5, 'Satisfeito': 7.5,
  'neutro': 5, 'Neutro': 5,
  'insatisfeito': 2.5, 'Insatisfeito': 2.5,
  'muito_insatisfeito': 0, 'Muito insatisfeito': 0, 'Muito Insatisfeito': 0,
  
  // Expectations - ACTUAL database values
  'Superou totalmente minhas expectativas': 10, 'superou': 10, 'Superou': 10,
  'Superou minhas expectativas': 8.5,
  'Atendeu minhas expectativas': 7.5, 'Atendeu totalmente': 10, 'atendeu_totalmente': 10,
  'Atendeu parcialmente': 5, 'atendeu_parcialmente': 5,
  'Não atendeu': 2.5, 'nao_atendeu': 2.5,
  
  // Clarity - ACTUAL database values
  'Extremamente claro e didático': 10, 'Concordo totalmente': 10, 'concordo_totalmente': 10,
  'Muito claro': 8.5, 'Concordo': 7.5, 'concordo': 7.5,
  'Claro o suficiente': 7,
  'Um pouco confuso': 3, 'Discordo': 3, 'discordo': 3,
  'Difícil de acompanhar': 1, 'Discordo totalmente': 1,
  'excelente': 10, 'Excelente': 10,
  
  // Time - ACTUAL database values
  'Ideal, passou rápido': 10,
  'Bom, equilibrado': 8.5,
  'Razoável': 5,
  'Um pouco arrastado': 3,
  'Muito longo': 1,
  'Mais do que suficiente': 10, 'mais_que_suficiente': 10,
  'Adequado': 7.5, 'adequado': 7.5,
  'Insuficiente': 3, 'insuficiente': 3,
  
  // Quality scales
  'Muito Bom': 8.5, 'muito_bom': 8.5,
  'Bom': 7, 'bom': 7,
  'Regular': 4, 'regular': 4,
  'Ruim': 2, 'ruim': 2,
  'excelentes': 10, 'bons': 7.5, 'adequados': 5, 'fracos': 2.5, 'muito_fracos': 0,
  
  // General scale
  'alta': 10, 'boa': 7.5, 'moderada': 5, 'baixa': 2.5, 'nenhuma': 0,
  'muita': 10, 'razoavel': 5, 'pouca': 2.5,
  'total': 10,
  
  // Relevance
  'essenciais': 10, 'muito_relevantes': 7.5, 'relevantes': 5, 'pouco_relevantes': 2.5, 'nada_relevantes': 0,
};

const getNumericValue = (value: string | null): number | null => {
  if (!value) return null;
  return RATING_SCALE[value] ?? RATING_SCALE[value.toLowerCase()] ?? null;
};

const calculateAvg = (values: (number | null)[]): number => {
  const valid = values.filter((v): v is number => v !== null && !isNaN(v));
  if (valid.length === 0) return 0;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
};

export function useGlobalSurveyAnalytics(classId?: string | null) {
  return useQuery({
    queryKey: ['global-survey-analytics', classId],
    queryFn: async (): Promise<GlobalAnalytics> => {
      const classFilter = classId ? { class_id: classId } : {};
      
      // Fetch all surveys in parallel
      const [day1Result, day2Result, day3Result, enrollmentsResult] = await Promise.all([
        supabase
          .from('day1_satisfaction_surveys')
          .select('*')
          .match(classFilter)
          .eq('is_completed', true),
        supabase
          .from('day2_satisfaction_surveys')
          .select('*')
          .match(classFilter)
          .eq('is_completed', true),
        supabase
          .from('day3_satisfaction_surveys')
          .select('*')
          .match(classFilter)
          .eq('is_completed', true),
        classId 
          ? supabase.from('class_enrollments').select('id').eq('class_id', classId)
          : supabase.from('class_enrollments').select('id').limit(1000),
      ]);
      
      const day1Data = day1Result.data || [];
      const day2Data = day2Result.data || [];
      const day3Data = day3Result.data || [];
      const totalStudents = enrollmentsResult.data?.length || 0;
      
      // === SATISFACTION ===
      const day1SatValues = day1Data.map(r => getNumericValue(r.q1_satisfaction_level)).filter((v): v is number => v !== null);
      const day2SatValues = day2Data.map(r => getNumericValue(r.q1_satisfaction_level)).filter((v): v is number => v !== null);
      const day3SatValues = day3Data.map(r => getNumericValue(r.q1_satisfaction_level)).filter((v): v is number => v !== null);
      
      const satisfaction: GlobalSatisfactionData = {
        day1: { avg: calculateAvg(day1SatValues), count: day1Data.length },
        day2: { avg: calculateAvg(day2SatValues), count: day2Data.length },
        day3: { avg: calculateAvg(day3SatValues), count: day3Data.length },
        overall: calculateAvg([...day1SatValues, ...day2SatValues, ...day3SatValues]),
        totalResponses: day1Data.length + day2Data.length + day3Data.length,
      };
      
      // === COMPLETION RATES ===
      const completionRates = {
        day1: totalStudents > 0 ? (day1Data.length / totalStudents) * 100 : 0,
        day2: totalStudents > 0 ? (day2Data.length / totalStudents) * 100 : 0,
        day3: totalStudents > 0 ? (day3Data.length / totalStudents) * 100 : 0,
      };
      
      // === INSTRUCTORS (Day 1: Hygor & Patrick, Day 2: João & Larissa) ===
      const instructors: GlobalInstructorData[] = [];
      
      // Day 1 - Dr. Hygor
      const hygorExpectations = day1Data.map(r => getNumericValue(r.q3_hygor_expectations));
      const hygorClarity = day1Data.map(r => getNumericValue(r.q4_hygor_clarity));
      const hygorTime = day1Data.map(r => getNumericValue(r.q5_hygor_time));
      const hygorAvgExp = calculateAvg(hygorExpectations);
      const hygorAvgClarity = calculateAvg(hygorClarity);
      const hygorAvgTime = calculateAvg(hygorTime);
      if (day1Data.length > 0) {
        instructors.push({
          name: 'Dr. Hygor',
          day: 'day1',
          avgExpectations: hygorAvgExp,
          avgClarity: hygorAvgClarity,
          avgTime: hygorAvgTime,
          overallAvg: calculateAvg([hygorAvgExp, hygorAvgClarity, hygorAvgTime]),
          totalResponses: day1Data.length,
        });
      }
      
      // Day 1 - Dr. Patrick
      const patrickExpectations = day1Data.map(r => getNumericValue(r.q8_patrick_expectations));
      const patrickClarity = day1Data.map(r => getNumericValue(r.q9_patrick_clarity));
      const patrickTime = day1Data.map(r => getNumericValue(r.q10_patrick_time));
      const patrickAvgExp = calculateAvg(patrickExpectations);
      const patrickAvgClarity = calculateAvg(patrickClarity);
      const patrickAvgTime = calculateAvg(patrickTime);
      if (day1Data.length > 0) {
        instructors.push({
          name: 'Dr. Patrick',
          day: 'day1',
          avgExpectations: patrickAvgExp,
          avgClarity: patrickAvgClarity,
          avgTime: patrickAvgTime,
          overallAvg: calculateAvg([patrickAvgExp, patrickAvgClarity, patrickAvgTime]),
          totalResponses: day1Data.length,
        });
      }
      
      // Day 2 - Dr. João
      const joaoExpectations = day2Data.map(r => getNumericValue(r.q2_joao_expectations));
      const joaoClarity = day2Data.map(r => getNumericValue(r.q3_joao_clarity));
      const joaoTime = day2Data.map(r => getNumericValue(r.q4_joao_time));
      const joaoAvgExp = calculateAvg(joaoExpectations);
      const joaoAvgClarity = calculateAvg(joaoClarity);
      const joaoAvgTime = calculateAvg(joaoTime);
      if (day2Data.length > 0) {
        instructors.push({
          name: 'Dr. João',
          day: 'day2',
          avgExpectations: joaoAvgExp,
          avgClarity: joaoAvgClarity,
          avgTime: joaoAvgTime,
          overallAvg: calculateAvg([joaoAvgExp, joaoAvgClarity, joaoAvgTime]),
          totalResponses: day2Data.length,
        });
      }
      
      // Day 2 - Dra. Larissa
      const larissaExpectations = day2Data.map(r => getNumericValue(r.q7_larissa_expectations));
      const larissaClarity = day2Data.map(r => getNumericValue(r.q8_larissa_clarity));
      const larissaTime = day2Data.map(r => getNumericValue(r.q9_larissa_time));
      const larissaAvgExp = calculateAvg(larissaExpectations);
      const larissaAvgClarity = calculateAvg(larissaClarity);
      const larissaAvgTime = calculateAvg(larissaTime);
      if (day2Data.length > 0) {
        instructors.push({
          name: 'Dra. Larissa',
          day: 'day2',
          avgExpectations: larissaAvgExp,
          avgClarity: larissaAvgClarity,
          avgTime: larissaAvgTime,
          overallAvg: calculateAvg([larissaAvgExp, larissaAvgClarity, larissaAvgTime]),
          totalResponses: day2Data.length,
        });
      }
      
      // Sort instructors by overall avg
      instructors.sort((a, b) => b.overallAvg - a.overallAvg);
      
      // === MONITORS (from Day 3 votes) ===
      // First normalize all monitor names to a canonical key
      const normalizeMonitorName = (name: string | null): string | null => {
        if (!name) return null;
        const lower = name.toLowerCase().trim();
        // Map all variations to canonical keys
        if (lower.includes('elenilton')) return 'elenilton';
        if (lower.includes('patrick')) return 'patrick';
        if (lower.includes('eder') || lower.includes('éder')) return 'eder';
        if (lower.includes('gleyldes')) return 'gleyldes';
        return lower; // fallback
      };
      
      const MONITOR_DISPLAY_NAMES: Record<string, string> = {
        'elenilton': 'Dr. Elenilton',
        'patrick': 'Dr. Patrick',
        'eder': 'Dr. Eder',
        'gleyldes': 'Dra. Gleyldes',
      };
      
      const monitorVotes: Record<string, { technical: number; caring: number }> = {};
      
      day3Data.forEach(r => {
        const techKey = normalizeMonitorName(r.q14_best_technical_monitor);
        const caringKey = normalizeMonitorName(r.q15_best_caring_monitor);
        
        if (techKey) {
          if (!monitorVotes[techKey]) monitorVotes[techKey] = { technical: 0, caring: 0 };
          monitorVotes[techKey].technical++;
        }
        if (caringKey) {
          if (!monitorVotes[caringKey]) monitorVotes[caringKey] = { technical: 0, caring: 0 };
          monitorVotes[caringKey].caring++;
        }
      });
      
      const monitors: GlobalMonitorData[] = Object.entries(monitorVotes).map(([key, votes]) => ({
        name: MONITOR_DISPLAY_NAMES[key] || key,
        day: 'day3' as const,
        overallAvg: 0, // Not used for votes
        avgTechnical: votes.technical, // This is a VOTE COUNT, not a rating
        avgInterest: 0,
        avgEngagement: 0,
        avgPosture: 0,
        avgCommunication: 0,
        avgContribution: votes.caring, // This is a VOTE COUNT, not a rating
        votes: votes.technical + votes.caring,
      }));
      
      monitors.sort((a, b) => b.votes - a.votes);
      
      // === LEADS (from Day 2) ===
      const leads: GlobalLeadData = {
        hot: day2Data.filter(r => r.lead_classification === 'hot').length,
        warm: day2Data.filter(r => r.lead_classification === 'warm').length,
        cold: day2Data.filter(r => r.lead_classification === 'cold').length,
        total: day2Data.length,
        avgScoreIA: calculateAvg(day2Data.map(r => r.score_ia_avivar)),
        avgScoreLicense: calculateAvg(day2Data.map(r => r.score_license)),
        avgScoreLegal: calculateAvg(day2Data.map(r => r.score_legal)),
      };
      
      // === FEEDBACK (combine from all days) ===
      const highlights: string[] = [];
      const improvements: string[] = [];
      
      // Day 1 feedback
      day1Data.forEach(r => {
        if (r.q6_hygor_liked_most) highlights.push(r.q6_hygor_liked_most);
        if (r.q11_patrick_liked_most) highlights.push(r.q11_patrick_liked_most);
        if (r.q21_liked_most_today) highlights.push(r.q21_liked_most_today);
        if (r.q7_hygor_improve) improvements.push(r.q7_hygor_improve);
        if (r.q12_patrick_improve) improvements.push(r.q12_patrick_improve);
        if (r.q22_suggestions) improvements.push(r.q22_suggestions);
      });
      
      // Day 2 feedback
      day2Data.forEach(r => {
        if (r.q5_joao_liked_most) highlights.push(r.q5_joao_liked_most);
        if (r.q10_larissa_liked_most) highlights.push(r.q10_larissa_liked_most);
        if (r.q6_joao_improve) improvements.push(r.q6_joao_improve);
        if (r.q11_larissa_improve) improvements.push(r.q11_larissa_improve);
      });
      
      // Day 3 feedback
      day3Data.forEach(r => {
        if (r.q13_highlights) highlights.push(r.q13_highlights);
        if (r.q12_improvements) improvements.push(r.q12_improvements);
      });
      
      // === CONTENT METRICS (from Day 3) ===
      const contentMetrics: GlobalContentMetrics = {
        avgTechnical: calculateAvg(day3Data.map(r => getNumericValue(r.q3_technical_foundations))),
        avgPractical: calculateAvg(day3Data.map(r => getNumericValue(r.q4_practical_load))),
        avgManagement: calculateAvg(day3Data.map(r => getNumericValue(r.q8_management_classes))),
        avgLegal: calculateAvg(day3Data.map(r => getNumericValue(r.q9_legal_security))),
        avgClarity: calculateAvg(day3Data.map(r => getNumericValue(r.q6_execution_clarity))),
        avgConfidence: calculateAvg(day3Data.map(r => getNumericValue(r.q7_confidence_level))),
        avgOrganization: calculateAvg(day3Data.map(r => getNumericValue(r.q10_organization))),
        avgSupport: calculateAvg(day3Data.map(r => getNumericValue(r.q11_support_quality))),
      };
      
      // Global average across all dimensions
      const allMetrics = [
        satisfaction.overall,
        contentMetrics.avgTechnical,
        contentMetrics.avgPractical,
        contentMetrics.avgClarity,
        contentMetrics.avgConfidence,
        contentMetrics.avgOrganization,
        contentMetrics.avgSupport,
      ].filter(v => v > 0);
      
      const globalAvg = allMetrics.length > 0 
        ? allMetrics.reduce((sum, v) => sum + v, 0) / allMetrics.length 
        : 0;
      
      return {
        satisfaction,
        instructors,
        monitors,
        leads,
        highlights: highlights.filter(h => h && h.trim().length > 3),
        improvements: improvements.filter(i => i && i.trim().length > 3),
        completionRates,
        totalStudents,
        contentMetrics,
        globalAvg,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: true,
  });
}
