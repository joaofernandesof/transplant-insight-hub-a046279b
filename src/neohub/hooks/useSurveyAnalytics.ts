import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SurveyResponse {
  id: string;
  user_id: string;
  class_id: string | null;
  created_at: string;
  completed_at: string | null;
  is_completed: boolean | null;
  // Satisfaction
  q1_satisfaction_level: string | null;
  q2_first_time_course: boolean | null;
  // Hygor evaluation
  q3_hygor_expectations: string | null;
  q4_hygor_clarity: string | null;
  q5_hygor_time: string | null;
  q6_hygor_liked_most: string | null;
  q7_hygor_improve: string | null;
  // Patrick evaluation
  q8_patrick_expectations: string | null;
  q9_patrick_clarity: string | null;
  q10_patrick_time: string | null;
  q11_patrick_liked_most: string | null;
  q12_patrick_improve: string | null;
  // Infrastructure
  q13_organization: string | null;
  q14_content_relevance: string | null;
  q15_teacher_competence: string | null;
  q16_material_quality: string | null;
  q17_punctuality: string | null;
  q18_infrastructure: string | null;
  q19_support_team: string | null;
  q20_coffee_break: string | null;
  // Open-ended
  q21_liked_most_today: string | null;
  q22_suggestions: string | null;
  // Profile
  q23_start_preference: string | null;
  q24_hunger_level: string | null;
  q25_urgency_level: string | null;
  q26_investment_level: string | null;
  q27_weekly_time: string | null;
  q28_current_reality: string | null;
  // Monitor evaluation
  q29_monitor_name: string | null;
  q30_monitor_technical: string | null;
  q31_monitor_interest: string | null;
  q32_monitor_engagement: string | null;
  q33_monitor_posture: string | null;
  q34_monitor_communication: string | null;
  q35_monitor_contribution: string | null;
  q36_monitor_strength: string | null;
  q37_monitor_improve: string | null;
  // Eder mentor evaluation
  q38_eder_technical: string | null;
  q39_eder_interest: string | null;
  q40_eder_engagement: string | null;
  q41_eder_posture: string | null;
  q42_eder_communication: string | null;
  q43_eder_contribution: string | null;
  q44_eder_strength: string | null;
  q45_eder_improve: string | null;
  // Patrick mentor evaluation
  q46_patrick_m_technical: string | null;
  q47_patrick_m_interest: string | null;
  q48_patrick_m_engagement: string | null;
  q49_patrick_m_posture: string | null;
  q50_patrick_m_communication: string | null;
  q51_patrick_m_contribution: string | null;
  q52_patrick_m_strength: string | null;
  q53_patrick_m_improve: string | null;
  // Eder mentor evaluation 2
  q54_eder_m_technical: string | null;
  q55_eder_m_interest: string | null;
  q56_eder_m_engagement: string | null;
  q57_eder_m_posture: string | null;
  q58_eder_m_communication: string | null;
  q59_eder_m_contribution: string | null;
  q60_eder_m_strength: string | null;
  q61_eder_m_improve: string | null;
  // User info (joined)
  user_profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Rating scale mapping (worst to best)
const ratingScaleMap: Record<string, number> = {
  // Qualidade (1-5)
  pessimo: 1,
  muito_ruim: 1,
  ruim: 2,
  regular: 3,
  bom: 4,
  excelente: 5,

  // Satisfação geral (1-5)
  muito_insatisfeito: 1,
  insatisfeito: 2,
  neutro: 3,
  satisfeito: 4,
  muito_satisfeito: 5,

  // Concordância (1-5)
  discordo_totalmente: 1,
  discordo: 2,
  concordo: 4,
  concordo_totalmente: 5,

  // Expectativas (normalizado para 1/3/5)
  nao_atendeu: 1,
  atendeu_parcialmente: 3,
  atendeu_totalmente: 5,

  // Tempo (normalizado para 1/3/5)
  insuficiente: 1,
  adequado: 3,
  mais_do_que_suficiente: 5,

  // Legado / outras escalas usadas em outros formulários
  muito_baixo: 1,
  baixo: 2,
  medio: 3,
  alto: 4,
  muito_alto: 5,
  nenhum: 1,
  pouco: 2,
  moderado: 3,
  bastante: 4,
  total: 5,
  parcialmente: 2,
  atendeu: 3,
  superou: 4,
  superou_muito: 5,
};

const normalizeRatingKey = (value: string): string => {
  // Remove acentos/diacríticos e normaliza para snake_case
  const noDiacritics = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return noDiacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_]/g, "")
    .replace(/\s+/g, "_");
};

const getRatingValue = (value: string | null): number | null => {
  if (!value) return null;
  const key = normalizeRatingKey(value);
  if (key === 'ainda_nao_sei_responder') return null;
  return ratingScaleMap[key] ?? null;
};

const calculateAverage = (values: (number | null)[]): number => {
  const validValues = values.filter((v): v is number => v !== null);
  if (validValues.length === 0) return 0;
  return validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
};

const calculateNPS = (satisfactionLevels: (string | null)[]): { score: number; promoters: number; passives: number; detractors: number } => {
  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  
  satisfactionLevels.forEach(level => {
    if (!level) return;
    const rating = getRatingValue(level);
    if (rating === null) return;
    
    if (rating >= 4) promoters++;
    else if (rating === 3) passives++;
    else detractors++;
  });
  
  const total = promoters + passives + detractors;
  if (total === 0) return { score: 0, promoters: 0, passives: 0, detractors: 0 };
  
  const score = Math.round(((promoters - detractors) / total) * 100);
  return { score, promoters, passives, detractors };
};

export interface InstructorMetrics {
  name: string;
  avgExpectations: number;
  avgClarity: number;
  avgTime: number;
  overallAvg: number;
  strengths: string[];
  improvements: string[];
}

export interface MonitorMetrics {
  name: string;
  avgTechnical: number;
  avgInterest: number;
  avgEngagement: number;
  avgPosture: number;
  avgCommunication: number;
  avgContribution: number;
  overallAvg: number;
  strengths: string[];
  improvements: string[];
}

export interface InfrastructureMetrics {
  organization: number;
  contentRelevance: number;
  teacherCompetence: number;
  materialQuality: number;
  punctuality: number;
  infrastructure: number;
  supportTeam: number;
  coffeeBreak: number;
}

export interface StudentProfileMetrics {
  hungerLevel: Record<string, number>;
  urgencyLevel: Record<string, number>;
  investmentLevel: Record<string, number>;
  weeklyTime: Record<string, number>;
  currentReality: Record<string, number>;
  firstTimers: number;
  returning: number;
}

export interface QuestionRating {
  questionKey: string;
  questionLabel: string;
  category: string;
  avgRating: number;
  responseCount: number;
  distribution: Record<string, number>;
}

export interface StudentDetailedResponse {
  userId: string;
  userName: string;
  createdAt: string | null;
  completedAt: string | null;
  totalTimeSeconds: number | null;
  avgTimePerQuestion: number | null;
  isCompleted: boolean;
  satisfaction: string | null;
  isFirstTime: boolean;
  isHotLead: boolean;
  answeredQuestions: number;
  totalQuestions: number;
  progressPercent: number;
  credibilityScore: number; // 0-100, higher = more likely genuine
  credibilityLevel: 'high' | 'medium' | 'low' | 'suspicious';
  responses: {
    questionKey: string;
    questionLabel: string;
    category: string;
    value: string | null;
    numericValue: number | null;
  }[];
}

export interface TimingAnalytics {
  avgTotalTime: number;
  minTotalTime: number;
  maxTotalTime: number;
  avgTimePerQuestion: number;
  suspiciousCount: number;
  genuineCount: number;
  studentsByCredibility: {
    userId: string;
    userName: string;
    totalTimeSeconds: number;
    avgTimePerQuestion: number;
    credibilityScore: number;
    credibilityLevel: 'high' | 'medium' | 'low' | 'suspicious';
  }[];
}

export interface SurveyAnalytics {
  totalResponses: number;
  completedResponses: number;
  completionRate: number;
  overallSatisfaction: number; // Média simples de satisfação (1-5)
  overallSatisfactionPercent: number; // Satisfação em percentual (0-100)
  instructors: {
    hygor: InstructorMetrics;
    patrick: InstructorMetrics;
  };
  monitors: {
    eder: MonitorMetrics;
    patrickM: MonitorMetrics;
    ederM: MonitorMetrics;
  };
  monitorsByName: Record<string, MonitorMetrics>;
  infrastructure: InfrastructureMetrics;
  studentProfile: StudentProfileMetrics;
  hotLeads: { userId: string; name: string; hungerLevel: string; urgencyLevel: string }[];
  openFeedback: {
    likedMost: { text: string; author: string }[];
    suggestions: { text: string; author: string }[];
  };
  responsesByStudent: StudentDetailedResponse[];
  questionRankings: QuestionRating[];
  allQuestions: QuestionRating[];
  timingAnalytics: TimingAnalytics;
}

export function useSurveyAnalytics(classId: string | null) {
  return useQuery({
    queryKey: ['survey-analytics', classId],
    queryFn: async (): Promise<SurveyAnalytics | null> => {
      if (!classId) return null;

      // First fetch COMPLETED surveys only (exclude admin test data)
      const { data: surveys, error } = await supabase
        .from('day1_satisfaction_surveys')
        .select('*')
        .eq('class_id', classId)
        .eq('is_completed', true);

      if (error) throw error;
      if (!surveys || surveys.length === 0) return null;
      
      // Get user emails to filter out admin test responses
      const userIds = surveys.map(s => s.user_id);
      const { data: usersForFilter } = await supabase
        .from('neohub_users')
        .select('user_id, email')
        .in('user_id', userIds);
      
      // Filter out admin test accounts from analytics
      const adminEmails = ['adm@neofolic.com.br', 'orlandifranca@yahoo.com.br'];
      const adminUserIds = new Set(
        usersForFilter?.filter(u => adminEmails.includes(u.email || '')).map(u => u.user_id) || []
      );
      
      const filteredSurveys = surveys.filter(s => !adminUserIds.has(s.user_id));
      if (filteredSurveys.length === 0) return null;

      // Fetch user info from neohub_users (primary source) for filtered surveys
      const filteredUserIds = filteredSurveys.map(s => s.user_id);
      const { data: users } = await supabase
        .from('neohub_users')
        .select('user_id, full_name, avatar_url')
        .in('user_id', filteredUserIds);

      const profilesMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      users?.forEach((u) => {
        profilesMap.set(u.user_id, { full_name: u.full_name, avatar_url: u.avatar_url });
      });

      // Map surveys to include user profile data (already filtered + completed)
      const responses: SurveyResponse[] = filteredSurveys.map(s => ({
        ...s,
        user_profiles: profilesMap.get(s.user_id) || undefined,
      })) as SurveyResponse[];
      
      // All responses are already completed (filtered above)
      const completed = responses;

      // Overall satisfaction - média simples (não NPS)
      const overallSatisfaction = calculateAverage(
        completed.map(r => getRatingValue(r.q1_satisfaction_level))
      );
      // Converte para percentual (1-5 → 0-100%)
      const overallSatisfactionPercent = overallSatisfaction > 0 ? ((overallSatisfaction - 1) / 4) * 100 : 0;

      // Instructor metrics - Hygor
      const hygorMetrics: InstructorMetrics = {
        name: 'Dr. Hygor',
        avgExpectations: calculateAverage(completed.map(r => getRatingValue(r.q3_hygor_expectations))),
        avgClarity: calculateAverage(completed.map(r => getRatingValue(r.q4_hygor_clarity))),
        avgTime: calculateAverage(completed.map(r => getRatingValue(r.q5_hygor_time))),
        overallAvg: 0,
        strengths: completed.map(r => r.q6_hygor_liked_most).filter((v): v is string => !!v),
        improvements: completed.map(r => r.q7_hygor_improve).filter((v): v is string => !!v),
      };
      hygorMetrics.overallAvg = (hygorMetrics.avgExpectations + hygorMetrics.avgClarity + hygorMetrics.avgTime) / 3;

      // Instructor metrics - Patrick
      const patrickMetrics: InstructorMetrics = {
        name: 'Dr. Patrick',
        avgExpectations: calculateAverage(completed.map(r => getRatingValue(r.q8_patrick_expectations))),
        avgClarity: calculateAverage(completed.map(r => getRatingValue(r.q9_patrick_clarity))),
        avgTime: calculateAverage(completed.map(r => getRatingValue(r.q10_patrick_time))),
        overallAvg: 0,
        strengths: completed.map(r => r.q11_patrick_liked_most).filter((v): v is string => !!v),
        improvements: completed.map(r => r.q12_patrick_improve).filter((v): v is string => !!v),
      };
      patrickMetrics.overallAvg = (patrickMetrics.avgExpectations + patrickMetrics.avgClarity + patrickMetrics.avgTime) / 3;

      // Monitor metrics - Eder (q38-q45)
      const ederMetrics: MonitorMetrics = {
        name: 'Dr. Eder',
        avgTechnical: calculateAverage(completed.map(r => getRatingValue(r.q38_eder_technical))),
        avgInterest: calculateAverage(completed.map(r => getRatingValue(r.q39_eder_interest))),
        avgEngagement: calculateAverage(completed.map(r => getRatingValue(r.q40_eder_engagement))),
        avgPosture: calculateAverage(completed.map(r => getRatingValue(r.q41_eder_posture))),
        avgCommunication: calculateAverage(completed.map(r => getRatingValue(r.q42_eder_communication))),
        avgContribution: calculateAverage(completed.map(r => getRatingValue(r.q43_eder_contribution))),
        overallAvg: 0,
        strengths: completed.map(r => r.q44_eder_strength).filter((v): v is string => !!v),
        improvements: completed.map(r => r.q45_eder_improve).filter((v): v is string => !!v),
      };
      ederMetrics.overallAvg = (ederMetrics.avgTechnical + ederMetrics.avgInterest + ederMetrics.avgEngagement + 
                                ederMetrics.avgPosture + ederMetrics.avgCommunication + ederMetrics.avgContribution) / 6;

      // Monitor metrics - Patrick M (q46-q53)
      const patrickMMetrics: MonitorMetrics = {
        name: 'Dr. Patrick (Monitor)',
        avgTechnical: calculateAverage(completed.map(r => getRatingValue(r.q46_patrick_m_technical))),
        avgInterest: calculateAverage(completed.map(r => getRatingValue(r.q47_patrick_m_interest))),
        avgEngagement: calculateAverage(completed.map(r => getRatingValue(r.q48_patrick_m_engagement))),
        avgPosture: calculateAverage(completed.map(r => getRatingValue(r.q49_patrick_m_posture))),
        avgCommunication: calculateAverage(completed.map(r => getRatingValue(r.q50_patrick_m_communication))),
        avgContribution: calculateAverage(completed.map(r => getRatingValue(r.q51_patrick_m_contribution))),
        overallAvg: 0,
        strengths: completed.map(r => r.q52_patrick_m_strength).filter((v): v is string => !!v),
        improvements: completed.map(r => r.q53_patrick_m_improve).filter((v): v is string => !!v),
      };
      patrickMMetrics.overallAvg = (patrickMMetrics.avgTechnical + patrickMMetrics.avgInterest + patrickMMetrics.avgEngagement + 
                                    patrickMMetrics.avgPosture + patrickMMetrics.avgCommunication + patrickMMetrics.avgContribution) / 6;

      // Monitor metrics - Eder M (q54-q61)
      const ederMMetrics: MonitorMetrics = {
        name: 'Dr. Eder (Monitor 2)',
        avgTechnical: calculateAverage(completed.map(r => getRatingValue(r.q54_eder_m_technical))),
        avgInterest: calculateAverage(completed.map(r => getRatingValue(r.q55_eder_m_interest))),
        avgEngagement: calculateAverage(completed.map(r => getRatingValue(r.q56_eder_m_engagement))),
        avgPosture: calculateAverage(completed.map(r => getRatingValue(r.q57_eder_m_posture))),
        avgCommunication: calculateAverage(completed.map(r => getRatingValue(r.q58_eder_m_communication))),
        avgContribution: calculateAverage(completed.map(r => getRatingValue(r.q59_eder_m_contribution))),
        overallAvg: 0,
        strengths: completed.map(r => r.q60_eder_m_strength).filter((v): v is string => !!v),
        improvements: completed.map(r => r.q61_eder_m_improve).filter((v): v is string => !!v),
      };
      ederMMetrics.overallAvg = (ederMMetrics.avgTechnical + ederMMetrics.avgInterest + ederMMetrics.avgEngagement + 
                                  ederMMetrics.avgPosture + ederMMetrics.avgCommunication + ederMMetrics.avgContribution) / 6;

      // Custom monitor evaluation (q29-q37)
      const monitorsByName: Record<string, MonitorMetrics> = {};
      completed.forEach(r => {
        const name = r.q29_monitor_name;
        if (!name) return;
        
        if (!monitorsByName[name]) {
          monitorsByName[name] = {
            name,
            avgTechnical: 0,
            avgInterest: 0,
            avgEngagement: 0,
            avgPosture: 0,
            avgCommunication: 0,
            avgContribution: 0,
            overallAvg: 0,
            strengths: [],
            improvements: [],
          };
        }
        
        // Add values (will calculate average later)
        if (r.q36_monitor_strength) monitorsByName[name].strengths.push(r.q36_monitor_strength);
        if (r.q37_monitor_improve) monitorsByName[name].improvements.push(r.q37_monitor_improve);
      });

      // Infrastructure metrics
      const infrastructure: InfrastructureMetrics = {
        organization: calculateAverage(completed.map(r => getRatingValue(r.q13_organization))),
        contentRelevance: calculateAverage(completed.map(r => getRatingValue(r.q14_content_relevance))),
        teacherCompetence: calculateAverage(completed.map(r => getRatingValue(r.q15_teacher_competence))),
        materialQuality: calculateAverage(completed.map(r => getRatingValue(r.q16_material_quality))),
        punctuality: calculateAverage(completed.map(r => getRatingValue(r.q17_punctuality))),
        infrastructure: calculateAverage(completed.map(r => getRatingValue(r.q18_infrastructure))),
        supportTeam: calculateAverage(completed.map(r => getRatingValue(r.q19_support_team))),
        coffeeBreak: calculateAverage(completed.map(r => getRatingValue(r.q20_coffee_break))),
      };

      // Student profile distribution
      const countDistribution = (values: (string | null)[]): Record<string, number> => {
        const dist: Record<string, number> = {};
        values.forEach(v => {
          if (!v) return;
          dist[v] = (dist[v] || 0) + 1;
        });
        return dist;
      };

      const studentProfile: StudentProfileMetrics = {
        hungerLevel: countDistribution(completed.map(r => r.q24_hunger_level)),
        urgencyLevel: countDistribution(completed.map(r => r.q25_urgency_level)),
        investmentLevel: countDistribution(completed.map(r => r.q26_investment_level)),
        weeklyTime: countDistribution(completed.map(r => r.q27_weekly_time)),
        currentReality: countDistribution(completed.map(r => r.q28_current_reality)),
        firstTimers: completed.filter(r => r.q2_first_time_course === true).length,
        returning: completed.filter(r => r.q2_first_time_course === false).length,
      };

      // Hot leads detection - based on HIGH urgency (Alta urgência)
      const isHighUrgency = (urgency: string | null): boolean => {
        if (!urgency) return false;
        const normalized = urgency.toLowerCase().trim();
        return normalized.includes('alta') || normalized === 'muito_alto' || normalized === 'alto';
      };

      const hotLeads = completed
        .filter(r => isHighUrgency(r.q25_urgency_level))
        .map(r => ({
          userId: r.user_id,
          name: r.user_profiles?.full_name || 'Aluno',
          hungerLevel: r.q24_hunger_level || '',
          urgencyLevel: r.q25_urgency_level || '',
        }));

      // Open feedback with author names
      const openFeedback = {
        likedMost: completed
          .filter(r => r.q21_liked_most_today && r.q21_liked_most_today.length > 3)
          .map(r => ({
            text: r.q21_liked_most_today!,
            author: r.user_profiles?.full_name || 'Anônimo'
          })),
        suggestions: completed
          .filter(r => r.q22_suggestions && r.q22_suggestions.length > 3)
          .map(r => ({
            text: r.q22_suggestions!,
            author: r.user_profiles?.full_name || 'Anônimo'
          })),
      };

      // Count answered questions for each response
      const countAnsweredQuestions = (r: SurveyResponse): { answered: number; total: number } => {
        const total = 61; // Total questions in survey
        let answered = 0;
        
        // Count non-null answers (excluding id, user_id, class_id, created_at, completed_at, is_completed, current_section)
        if (r.q1_satisfaction_level) answered++;
        if (r.q2_first_time_course !== null) answered++;
        if (r.q3_hygor_expectations) answered++;
        if (r.q4_hygor_clarity) answered++;
        if (r.q5_hygor_time) answered++;
        if (r.q6_hygor_liked_most) answered++;
        if (r.q7_hygor_improve) answered++;
        if (r.q8_patrick_expectations) answered++;
        if (r.q9_patrick_clarity) answered++;
        if (r.q10_patrick_time) answered++;
        if (r.q11_patrick_liked_most) answered++;
        if (r.q12_patrick_improve) answered++;
        if (r.q13_organization) answered++;
        if (r.q14_content_relevance) answered++;
        if (r.q15_teacher_competence) answered++;
        if (r.q16_material_quality) answered++;
        if (r.q17_punctuality) answered++;
        if (r.q18_infrastructure) answered++;
        if (r.q19_support_team) answered++;
        if (r.q20_coffee_break) answered++;
        if (r.q21_liked_most_today) answered++;
        if (r.q22_suggestions) answered++;
        if (r.q23_start_preference) answered++;
        if (r.q24_hunger_level) answered++;
        if (r.q25_urgency_level) answered++;
        if (r.q26_investment_level) answered++;
        if (r.q27_weekly_time) answered++;
        if (r.q28_current_reality) answered++;
        if (r.q29_monitor_name) answered++;
        if (r.q30_monitor_technical) answered++;
        if (r.q31_monitor_interest) answered++;
        if (r.q32_monitor_engagement) answered++;
        if (r.q33_monitor_posture) answered++;
        if (r.q34_monitor_communication) answered++;
        if (r.q35_monitor_contribution) answered++;
        if (r.q36_monitor_strength) answered++;
        if (r.q37_monitor_improve) answered++;
        if (r.q38_eder_technical) answered++;
        if (r.q39_eder_interest) answered++;
        if (r.q40_eder_engagement) answered++;
        if (r.q41_eder_posture) answered++;
        if (r.q42_eder_communication) answered++;
        if (r.q43_eder_contribution) answered++;
        if (r.q44_eder_strength) answered++;
        if (r.q45_eder_improve) answered++;
        if (r.q46_patrick_m_technical) answered++;
        if (r.q47_patrick_m_interest) answered++;
        if (r.q48_patrick_m_engagement) answered++;
        if (r.q49_patrick_m_posture) answered++;
        if (r.q50_patrick_m_communication) answered++;
        if (r.q51_patrick_m_contribution) answered++;
        if (r.q52_patrick_m_strength) answered++;
        if (r.q53_patrick_m_improve) answered++;
        if (r.q54_eder_m_technical) answered++;
        if (r.q55_eder_m_interest) answered++;
        if (r.q56_eder_m_engagement) answered++;
        if (r.q57_eder_m_posture) answered++;
        if (r.q58_eder_m_communication) answered++;
        if (r.q59_eder_m_contribution) answered++;
        if (r.q60_eder_m_strength) answered++;
        if (r.q61_eder_m_improve) answered++;
        
        return { answered, total };
      };

      // Question definitions for all ratable questions
      const questionDefinitions: { key: keyof SurveyResponse; label: string; category: string }[] = [
        { key: 'q1_satisfaction_level', label: 'Nível de satisfação geral', category: 'Satisfação' },
        { key: 'q3_hygor_expectations', label: 'Dr. Hygor - Expectativas', category: 'Dr. Hygor' },
        { key: 'q4_hygor_clarity', label: 'Dr. Hygor - Clareza', category: 'Dr. Hygor' },
        { key: 'q5_hygor_time', label: 'Dr. Hygor - Tempo', category: 'Dr. Hygor' },
        { key: 'q8_patrick_expectations', label: 'Dr. Patrick - Expectativas', category: 'Dr. Patrick' },
        { key: 'q9_patrick_clarity', label: 'Dr. Patrick - Clareza', category: 'Dr. Patrick' },
        { key: 'q10_patrick_time', label: 'Dr. Patrick - Tempo', category: 'Dr. Patrick' },
        { key: 'q13_organization', label: 'Organização geral', category: 'Infraestrutura' },
        { key: 'q14_content_relevance', label: 'Relevância do conteúdo', category: 'Infraestrutura' },
        { key: 'q15_teacher_competence', label: 'Competência dos professores', category: 'Infraestrutura' },
        { key: 'q16_material_quality', label: 'Qualidade do material', category: 'Infraestrutura' },
        { key: 'q17_punctuality', label: 'Pontualidade', category: 'Infraestrutura' },
        { key: 'q18_infrastructure', label: 'Infraestrutura física', category: 'Infraestrutura' },
        { key: 'q19_support_team', label: 'Equipe de apoio', category: 'Infraestrutura' },
        { key: 'q20_coffee_break', label: 'Coffee Break', category: 'Infraestrutura' },
        { key: 'q30_monitor_technical', label: 'Monitor - Conhecimento técnico', category: 'Monitor' },
        { key: 'q31_monitor_interest', label: 'Monitor - Interesse', category: 'Monitor' },
        { key: 'q32_monitor_engagement', label: 'Monitor - Engajamento', category: 'Monitor' },
        { key: 'q33_monitor_posture', label: 'Monitor - Postura', category: 'Monitor' },
        { key: 'q34_monitor_communication', label: 'Monitor - Comunicação', category: 'Monitor' },
        { key: 'q35_monitor_contribution', label: 'Monitor - Contribuição', category: 'Monitor' },
        { key: 'q38_eder_technical', label: 'Dr. Eder - Conhecimento técnico', category: 'Dr. Eder' },
        { key: 'q39_eder_interest', label: 'Dr. Eder - Interesse', category: 'Dr. Eder' },
        { key: 'q40_eder_engagement', label: 'Dr. Eder - Engajamento', category: 'Dr. Eder' },
        { key: 'q41_eder_posture', label: 'Dr. Eder - Postura', category: 'Dr. Eder' },
        { key: 'q42_eder_communication', label: 'Dr. Eder - Comunicação', category: 'Dr. Eder' },
        { key: 'q43_eder_contribution', label: 'Dr. Eder - Contribuição', category: 'Dr. Eder' },
      ];

      // Calculate all question ratings
      const allQuestions: QuestionRating[] = questionDefinitions.map(qDef => {
        const values = completed.map(r => r[qDef.key] as string | null);
        const numericValues = values.map(v => getRatingValue(v));
        const distribution: Record<string, number> = {};
        values.forEach(v => {
          if (v) distribution[v] = (distribution[v] || 0) + 1;
        });
        return {
          questionKey: qDef.key,
          questionLabel: qDef.label,
          category: qDef.category,
          avgRating: calculateAverage(numericValues),
          responseCount: numericValues.filter(v => v !== null).length,
          distribution,
        };
      });

      // Ranking sorted by avg rating (best to worst)
      const questionRankings = [...allQuestions]
        .filter(q => q.responseCount > 0)
        .sort((a, b) => b.avgRating - a.avgRating);

      // All question keys for individual responses
      const allQuestionKeys: { key: keyof SurveyResponse; label: string; category: string }[] = [
        { key: 'q1_satisfaction_level', label: 'Nível de satisfação', category: 'Satisfação' },
        { key: 'q2_first_time_course', label: 'Primeira vez no curso?', category: 'Perfil' },
        { key: 'q3_hygor_expectations', label: 'Dr. Hygor - Expectativas', category: 'Dr. Hygor' },
        { key: 'q4_hygor_clarity', label: 'Dr. Hygor - Clareza', category: 'Dr. Hygor' },
        { key: 'q5_hygor_time', label: 'Dr. Hygor - Tempo', category: 'Dr. Hygor' },
        { key: 'q6_hygor_liked_most', label: 'Dr. Hygor - Melhor ponto', category: 'Dr. Hygor' },
        { key: 'q7_hygor_improve', label: 'Dr. Hygor - Melhoria', category: 'Dr. Hygor' },
        { key: 'q8_patrick_expectations', label: 'Dr. Patrick - Expectativas', category: 'Dr. Patrick' },
        { key: 'q9_patrick_clarity', label: 'Dr. Patrick - Clareza', category: 'Dr. Patrick' },
        { key: 'q10_patrick_time', label: 'Dr. Patrick - Tempo', category: 'Dr. Patrick' },
        { key: 'q11_patrick_liked_most', label: 'Dr. Patrick - Melhor ponto', category: 'Dr. Patrick' },
        { key: 'q12_patrick_improve', label: 'Dr. Patrick - Melhoria', category: 'Dr. Patrick' },
        { key: 'q13_organization', label: 'Organização', category: 'Infraestrutura' },
        { key: 'q14_content_relevance', label: 'Relevância do conteúdo', category: 'Infraestrutura' },
        { key: 'q15_teacher_competence', label: 'Competência professores', category: 'Infraestrutura' },
        { key: 'q16_material_quality', label: 'Qualidade material', category: 'Infraestrutura' },
        { key: 'q17_punctuality', label: 'Pontualidade', category: 'Infraestrutura' },
        { key: 'q18_infrastructure', label: 'Infraestrutura', category: 'Infraestrutura' },
        { key: 'q19_support_team', label: 'Equipe de apoio', category: 'Infraestrutura' },
        { key: 'q20_coffee_break', label: 'Coffee Break', category: 'Infraestrutura' },
        { key: 'q21_liked_most_today', label: 'O que mais gostou', category: 'Feedback' },
        { key: 'q22_suggestions', label: 'Sugestões', category: 'Feedback' },
        { key: 'q23_start_preference', label: 'Preferência de horário', category: 'Perfil' },
        { key: 'q24_hunger_level', label: 'Nível de fome/desejo', category: 'Perfil' },
        { key: 'q25_urgency_level', label: 'Nível de urgência', category: 'Perfil' },
        { key: 'q26_investment_level', label: 'Nível de investimento', category: 'Perfil' },
        { key: 'q27_weekly_time', label: 'Tempo semanal disponível', category: 'Perfil' },
        { key: 'q28_current_reality', label: 'Realidade atual', category: 'Perfil' },
        { key: 'q29_monitor_name', label: 'Nome do monitor', category: 'Monitor' },
        { key: 'q30_monitor_technical', label: 'Monitor - Técnico', category: 'Monitor' },
        { key: 'q31_monitor_interest', label: 'Monitor - Interesse', category: 'Monitor' },
        { key: 'q32_monitor_engagement', label: 'Monitor - Engajamento', category: 'Monitor' },
        { key: 'q33_monitor_posture', label: 'Monitor - Postura', category: 'Monitor' },
        { key: 'q34_monitor_communication', label: 'Monitor - Comunicação', category: 'Monitor' },
        { key: 'q35_monitor_contribution', label: 'Monitor - Contribuição', category: 'Monitor' },
        { key: 'q36_monitor_strength', label: 'Monitor - Ponto forte', category: 'Monitor' },
        { key: 'q37_monitor_improve', label: 'Monitor - Melhoria', category: 'Monitor' },
      ];

      // Helper to calculate credibility based on timing
      const calculateCredibility = (totalTimeSeconds: number | null, answeredQuestions: number): { score: number; level: 'high' | 'medium' | 'low' | 'suspicious' } => {
        if (totalTimeSeconds === null || answeredQuestions === 0) {
          return { score: 50, level: 'medium' };
        }
        
        const avgTimePerQuestion = totalTimeSeconds / answeredQuestions;
        
        // Thresholds: 
        // < 3 seconds per question = suspicious (just clicking)
        // 3-6 seconds = low credibility
        // 6-12 seconds = medium credibility
        // > 12 seconds = high credibility (actually reading)
        
        if (avgTimePerQuestion < 3) {
          return { score: Math.max(0, Math.round(avgTimePerQuestion * 10)), level: 'suspicious' };
        } else if (avgTimePerQuestion < 6) {
          return { score: Math.round(30 + (avgTimePerQuestion - 3) * 10), level: 'low' };
        } else if (avgTimePerQuestion < 12) {
          return { score: Math.round(60 + (avgTimePerQuestion - 6) * 5), level: 'medium' };
        } else {
          return { score: Math.min(100, Math.round(90 + Math.min(avgTimePerQuestion - 12, 2) * 5)), level: 'high' };
        }
      };

      // Responses by student with full detail
      const responsesByStudent: StudentDetailedResponse[] = responses.map(r => {
        const progress = countAnsweredQuestions(r);
        const studentResponses = allQuestionKeys.map(qDef => {
          const value = r[qDef.key];
          const strValue = typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : (value as string | null);
          return {
            questionKey: qDef.key,
            questionLabel: qDef.label,
            category: qDef.category,
            value: strValue,
            numericValue: typeof value === 'string' ? getRatingValue(value) : null,
          };
        });

        // Calculate timing
        const createdAt = r.created_at;
        const completedAt = r.completed_at;
        let totalTimeSeconds: number | null = null;
        let avgTimePerQuestion: number | null = null;
        
        if (createdAt && completedAt) {
          const startDate = new Date(createdAt);
          const endDate = new Date(completedAt);
          totalTimeSeconds = Math.round((endDate.getTime() - startDate.getTime()) / 1000);
          if (progress.answered > 0) {
            avgTimePerQuestion = Math.round(totalTimeSeconds / progress.answered);
          }
        }
        
        const credibility = calculateCredibility(totalTimeSeconds, progress.answered);

        return {
          userId: r.user_id,
          userName: r.user_profiles?.full_name || 'Aluno',
          createdAt,
          completedAt: r.completed_at,
          totalTimeSeconds,
          avgTimePerQuestion,
          isCompleted: r.is_completed || false,
          satisfaction: r.q1_satisfaction_level,
          isFirstTime: r.q2_first_time_course || false,
          isHotLead: isHighUrgency(r.q25_urgency_level),
          answeredQuestions: progress.answered,
          totalQuestions: progress.total,
          progressPercent: Math.round((progress.answered / progress.total) * 100),
          credibilityScore: credibility.score,
          credibilityLevel: credibility.level,
          responses: studentResponses,
        };
      });

      // Calculate timing analytics
      const completedWithTiming = responsesByStudent.filter(s => s.totalTimeSeconds !== null && s.totalTimeSeconds > 0);
      const timingAnalytics: TimingAnalytics = {
        avgTotalTime: completedWithTiming.length > 0 
          ? Math.round(completedWithTiming.reduce((sum, s) => sum + (s.totalTimeSeconds || 0), 0) / completedWithTiming.length)
          : 0,
        minTotalTime: completedWithTiming.length > 0 
          ? Math.min(...completedWithTiming.map(s => s.totalTimeSeconds || 0))
          : 0,
        maxTotalTime: completedWithTiming.length > 0 
          ? Math.max(...completedWithTiming.map(s => s.totalTimeSeconds || 0))
          : 0,
        avgTimePerQuestion: completedWithTiming.length > 0
          ? Math.round(completedWithTiming.reduce((sum, s) => sum + (s.avgTimePerQuestion || 0), 0) / completedWithTiming.length)
          : 0,
        suspiciousCount: responsesByStudent.filter(s => s.credibilityLevel === 'suspicious' || s.credibilityLevel === 'low').length,
        genuineCount: responsesByStudent.filter(s => s.credibilityLevel === 'high' || s.credibilityLevel === 'medium').length,
        studentsByCredibility: responsesByStudent
          .filter(s => s.totalTimeSeconds !== null)
          .map(s => ({
            userId: s.userId,
            userName: s.userName,
            totalTimeSeconds: s.totalTimeSeconds || 0,
            avgTimePerQuestion: s.avgTimePerQuestion || 0,
            credibilityScore: s.credibilityScore,
            credibilityLevel: s.credibilityLevel,
          }))
          .sort((a, b) => b.credibilityScore - a.credibilityScore),
      };

      return {
        totalResponses: responses.length,
        completedResponses: completed.length,
        completionRate: responses.length > 0 ? Math.round((completed.length / responses.length) * 100) : 0,
        overallSatisfaction,
        overallSatisfactionPercent,
        instructors: {
          hygor: hygorMetrics,
          patrick: patrickMetrics,
        },
        monitors: {
          eder: ederMetrics,
          patrickM: patrickMMetrics,
          ederM: ederMMetrics,
        },
        monitorsByName,
        infrastructure,
        studentProfile,
        hotLeads,
        openFeedback,
        responsesByStudent,
        questionRankings,
        allQuestions,
        timingAnalytics,
      };
    },
    enabled: !!classId,
  });
}
