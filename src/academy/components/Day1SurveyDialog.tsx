import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2, Frown, Meh, Smile, ThumbsUp, Heart, XCircle, MinusCircle, CheckCircle, ThumbsDown, Clock, Timer, Zap, Hourglass, Calendar } from 'lucide-react';
import { useDay1Survey, Day1SurveyFormData } from '../hooks/useDay1Survey';
import { cn } from '@/lib/utils';

// Import instructor photos
import drPatrickPhoto from '@/assets/instructors/dr-patrick.png';
import drHygorPhoto from '@/assets/instructors/dr-hygor.png';
import draGleydesPhoto from '@/assets/instructors/dra-gleyldes.png';
import drEderPhoto from '@/assets/instructors/dr-eder.png';

// Instructor data - now includes all monitors for individual evaluation
const INSTRUCTORS: Record<string, { name: string; role: string; photo: string }> = {
  'Aula Dr. Hygor Guerreiro': { name: 'Dr. Hygor Guerreiro', role: 'Professor', photo: drHygorPhoto },
  'Aula Dr. Patrick Penaforte': { name: 'Dr. Patrick Penaforte', role: 'Professor e Monitor', photo: drPatrickPhoto },
  'Avaliação Monitor - Dra Gleyldes': { name: 'Dra. Gleyldes', role: 'Monitora', photo: draGleydesPhoto },
  'Avaliação Monitor - Dr Eder': { name: 'Dr. Eder', role: 'Monitor', photo: drEderPhoto },
  'Avaliação Monitor - Dr Patrick': { name: 'Dr. Patrick Penaforte', role: 'Monitor', photo: drPatrickPhoto },
};

interface Day1SurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: string;
  onComplete?: () => void;
}

// Define all questions in order
type QuestionType = 'radio' | 'text' | 'boolean';

interface QuestionOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

interface Question {
  key: keyof Day1SurveyFormData;
  text: string;
  type: QuestionType;
  category: string;
  options?: QuestionOption[];
}

// Icon sets for different scales
const satisfactionIcons = [
  <Frown key="frown" className="h-5 w-5 text-destructive" />,
  <Meh key="meh" className="h-5 w-5 text-orange-500" />,
  <MinusCircle key="minus" className="h-5 w-5 text-muted-foreground" />,
  <Smile key="smile" className="h-5 w-5 text-emerald-500" />,
  <Heart key="heart" className="h-5 w-5 text-emerald-600" />,
];

const agreementIcons = [
  <XCircle key="x" className="h-5 w-5 text-destructive" />,
  <ThumbsDown key="down" className="h-5 w-5 text-orange-500" />,
  <MinusCircle key="minus" className="h-5 w-5 text-muted-foreground" />,
  <ThumbsUp key="up" className="h-5 w-5 text-emerald-500" />,
  <CheckCircle key="check" className="h-5 w-5 text-emerald-600" />,
];

const expectationIcons = [
  <XCircle key="x" className="h-5 w-5 text-destructive" />,
  <MinusCircle key="minus" className="h-5 w-5 text-amber-500" />,
  <CheckCircle key="check" className="h-5 w-5 text-emerald-600" />,
];

const timeIcons = [
  <Timer key="timer" className="h-5 w-5 text-destructive" />,
  <Clock key="clock" className="h-5 w-5 text-emerald-500" />,
  <Hourglass key="hourglass" className="h-5 w-5 text-blue-500" />,
];

const qualityIcons = [
  <Frown key="frown" className="h-5 w-5 text-destructive" />,
  <Meh key="meh" className="h-5 w-5 text-orange-500" />,
  <MinusCircle key="minus" className="h-5 w-5 text-muted-foreground" />,
  <Smile key="smile" className="h-5 w-5 text-emerald-500" />,
  <Heart key="heart" className="h-5 w-5 text-emerald-600" />,
];

// Monitor evaluation quality options
const monitorQualityOptions: QuestionOption[] = [
  { value: 'Muito ruim', label: 'Muito ruim', icon: qualityIcons[0] },
  { value: 'Ruim', label: 'Ruim', icon: qualityIcons[1] },
  { value: 'Regular', label: 'Regular', icon: qualityIcons[2] },
  { value: 'Bom', label: 'Bom', icon: qualityIcons[3] },
  { value: 'Excelente', label: 'Excelente', icon: qualityIcons[4] },
];

const QUESTIONS: Question[] = [
  // 1. Satisfação Geral
  {
    key: 'q1_satisfaction_level',
    text: '1. No geral, qual é o seu nível de satisfação com o curso, até agora?',
    type: 'radio',
    category: 'Satisfação Geral',
    options: [
      { value: 'Muito insatisfeito', label: 'Muito insatisfeito', icon: satisfactionIcons[0] },
      { value: 'Insatisfeito', label: 'Insatisfeito', icon: satisfactionIcons[1] },
      { value: 'Neutro', label: 'Neutro', icon: satisfactionIcons[2] },
      { value: 'Satisfeito', label: 'Satisfeito', icon: satisfactionIcons[3] },
      { value: 'Muito satisfeito', label: 'Muito satisfeito', icon: satisfactionIcons[4] },
    ],
  },
  {
    key: 'q2_first_time_course',
    text: '2. Esta é a primeira vez que você participa de um curso de Transplante Capilar?',
    type: 'boolean',
    category: 'Satisfação Geral',
    options: [
      { value: 'true', label: 'Sim', icon: <CheckCircle key="yes" className="h-5 w-5 text-emerald-500" /> },
      { value: 'false', label: 'Não', icon: <XCircle key="no" className="h-5 w-5 text-muted-foreground" /> },
    ],
  },
  // 2. Aula Dr. Hygor
  {
    key: 'q3_hygor_expectations',
    text: '3. O tema abordado atendeu às suas expectativas?',
    type: 'radio',
    category: 'Aula Dr. Hygor Guerreiro',
    options: [
      { value: 'Não atendeu', label: 'Não atendeu', icon: expectationIcons[0] },
      { value: 'Atendeu parcialmente', label: 'Atendeu parcialmente', icon: expectationIcons[1] },
      { value: 'Atendeu totalmente', label: 'Atendeu totalmente', icon: expectationIcons[2] },
    ],
  },
  {
    key: 'q4_hygor_clarity',
    text: '4. O professor conseguiu explicar os conceitos de forma clara e compreensível?',
    type: 'radio',
    category: 'Aula Dr. Hygor Guerreiro',
    options: [
      { value: 'Discordo totalmente', label: 'Discordo totalmente', icon: agreementIcons[0] },
      { value: 'Discordo', label: 'Discordo', icon: agreementIcons[1] },
      { value: 'Neutro', label: 'Neutro', icon: agreementIcons[2] },
      { value: 'Concordo', label: 'Concordo', icon: agreementIcons[3] },
      { value: 'Concordo totalmente', label: 'Concordo totalmente', icon: agreementIcons[4] },
    ],
  },
  {
    key: 'q5_hygor_time',
    text: '5. Você sentiu que o tempo da aula foi suficiente para abordar o tema?',
    type: 'radio',
    category: 'Aula Dr. Hygor Guerreiro',
    options: [
      { value: 'Insuficiente', label: 'Insuficiente', icon: timeIcons[0] },
      { value: 'Adequado', label: 'Adequado', icon: timeIcons[1] },
      { value: 'Mais do que suficiente', label: 'Mais do que suficiente', icon: timeIcons[2] },
    ],
  },
  {
    key: 'q6_hygor_liked_most',
    text: '6. O que você mais gostou na aula do Dr. Hygor Guerreiro?',
    type: 'text',
    category: 'Aula Dr. Hygor Guerreiro',
  },
  {
    key: 'q7_hygor_improve',
    text: '7. O que poderia melhorar na aula do Dr. Hygor Guerreiro?',
    type: 'text',
    category: 'Aula Dr. Hygor Guerreiro',
  },
  // 3. Aula Dr. Patrick
  {
    key: 'q8_patrick_expectations',
    text: '8. O tema abordado atendeu às suas expectativas?',
    type: 'radio',
    category: 'Aula Dr. Patrick Penaforte',
    options: [
      { value: 'Não atendeu', label: 'Não atendeu', icon: expectationIcons[0] },
      { value: 'Atendeu parcialmente', label: 'Atendeu parcialmente', icon: expectationIcons[1] },
      { value: 'Atendeu totalmente', label: 'Atendeu totalmente', icon: expectationIcons[2] },
    ],
  },
  {
    key: 'q9_patrick_clarity',
    text: '9. O professor conseguiu explicar os conceitos de forma clara e compreensível?',
    type: 'radio',
    category: 'Aula Dr. Patrick Penaforte',
    options: [
      { value: 'Discordo totalmente', label: 'Discordo totalmente', icon: agreementIcons[0] },
      { value: 'Discordo', label: 'Discordo', icon: agreementIcons[1] },
      { value: 'Neutro', label: 'Neutro', icon: agreementIcons[2] },
      { value: 'Concordo', label: 'Concordo', icon: agreementIcons[3] },
      { value: 'Concordo totalmente', label: 'Concordo totalmente', icon: agreementIcons[4] },
    ],
  },
  {
    key: 'q10_patrick_time',
    text: '10. Você sentiu que o tempo da aula foi suficiente para abordar o tema?',
    type: 'radio',
    category: 'Aula Dr. Patrick Penaforte',
    options: [
      { value: 'Insuficiente', label: 'Insuficiente', icon: timeIcons[0] },
      { value: 'Adequado', label: 'Adequado', icon: timeIcons[1] },
      { value: 'Mais do que suficiente', label: 'Mais do que suficiente', icon: timeIcons[2] },
    ],
  },
  {
    key: 'q11_patrick_liked_most',
    text: '11. O que você mais gostou na aula do Dr. Patrick Penaforte?',
    type: 'text',
    category: 'Aula Dr. Patrick Penaforte',
  },
  {
    key: 'q12_patrick_improve',
    text: '12. O que poderia melhorar na aula do Dr. Patrick Penaforte?',
    type: 'text',
    category: 'Aula Dr. Patrick Penaforte',
  },
  // 4. Avaliação Geral do Evento
  {
    key: 'q13_organization',
    text: '13. Organização geral do evento',
    type: 'radio',
    category: 'Avaliação Geral do Evento',
    options: [
      { value: 'Muito ruim', label: 'Muito ruim', icon: qualityIcons[0] },
      { value: 'Ruim', label: 'Ruim', icon: qualityIcons[1] },
      { value: 'Regular', label: 'Regular', icon: qualityIcons[2] },
      { value: 'Bom', label: 'Bom', icon: qualityIcons[3] },
      { value: 'Excelente', label: 'Excelente', icon: qualityIcons[4] },
    ],
  },
  {
    key: 'q14_content_relevance',
    text: '14. Clareza e relevância dos conteúdos apresentados',
    type: 'radio',
    category: 'Avaliação Geral do Evento',
    options: [
      { value: 'Muito ruim', label: 'Muito ruim', icon: qualityIcons[0] },
      { value: 'Ruim', label: 'Ruim', icon: qualityIcons[1] },
      { value: 'Regular', label: 'Regular', icon: qualityIcons[2] },
      { value: 'Bom', label: 'Bom', icon: qualityIcons[3] },
      { value: 'Excelente', label: 'Excelente', icon: qualityIcons[4] },
    ],
  },
  {
    key: 'q15_teacher_competence',
    text: '15. Competência e didática dos professores',
    type: 'radio',
    category: 'Avaliação Geral do Evento',
    options: [
      { value: 'Muito ruim', label: 'Muito ruim', icon: qualityIcons[0] },
      { value: 'Ruim', label: 'Ruim', icon: qualityIcons[1] },
      { value: 'Regular', label: 'Regular', icon: qualityIcons[2] },
      { value: 'Bom', label: 'Bom', icon: qualityIcons[3] },
      { value: 'Excelente', label: 'Excelente', icon: qualityIcons[4] },
    ],
  },
  {
    key: 'q16_material_quality',
    text: '16. Qualidade dos materiais de apoio',
    type: 'radio',
    category: 'Avaliação Geral do Evento',
    options: [
      { value: 'Muito ruim', label: 'Muito ruim', icon: qualityIcons[0] },
      { value: 'Ruim', label: 'Ruim', icon: qualityIcons[1] },
      { value: 'Regular', label: 'Regular', icon: qualityIcons[2] },
      { value: 'Bom', label: 'Bom', icon: qualityIcons[3] },
      { value: 'Excelente', label: 'Excelente', icon: qualityIcons[4] },
    ],
  },
  {
    key: 'q17_punctuality',
    text: '17. Pontualidade no início e término das atividades',
    type: 'radio',
    category: 'Avaliação Geral do Evento',
    options: [
      { value: 'Muito ruim', label: 'Muito ruim', icon: qualityIcons[0] },
      { value: 'Ruim', label: 'Ruim', icon: qualityIcons[1] },
      { value: 'Regular', label: 'Regular', icon: qualityIcons[2] },
      { value: 'Bom', label: 'Bom', icon: qualityIcons[3] },
      { value: 'Excelente', label: 'Excelente', icon: qualityIcons[4] },
    ],
  },
  {
    key: 'q18_infrastructure',
    text: '18. Infraestrutura do local',
    type: 'radio',
    category: 'Avaliação Geral do Evento',
    options: [
      { value: 'Muito ruim', label: 'Muito ruim', icon: qualityIcons[0] },
      { value: 'Ruim', label: 'Ruim', icon: qualityIcons[1] },
      { value: 'Regular', label: 'Regular', icon: qualityIcons[2] },
      { value: 'Bom', label: 'Bom', icon: qualityIcons[3] },
      { value: 'Excelente', label: 'Excelente', icon: qualityIcons[4] },
    ],
  },
  {
    key: 'q19_support_team',
    text: '19. Atendimento e suporte da equipe organizadora',
    type: 'radio',
    category: 'Avaliação Geral do Evento',
    options: [
      { value: 'Muito ruim', label: 'Muito ruim', icon: qualityIcons[0] },
      { value: 'Ruim', label: 'Ruim', icon: qualityIcons[1] },
      { value: 'Regular', label: 'Regular', icon: qualityIcons[2] },
      { value: 'Bom', label: 'Bom', icon: qualityIcons[3] },
      { value: 'Excelente', label: 'Excelente', icon: qualityIcons[4] },
    ],
  },
  {
    key: 'q20_coffee_break',
    text: '20. Qualidade do Coffee Break',
    type: 'radio',
    category: 'Avaliação Geral do Evento',
    options: [
      { value: 'Muito ruim', label: 'Muito ruim', icon: qualityIcons[0] },
      { value: 'Ruim', label: 'Ruim', icon: qualityIcons[1] },
      { value: 'Regular', label: 'Regular', icon: qualityIcons[2] },
      { value: 'Bom', label: 'Bom', icon: qualityIcons[3] },
      { value: 'Excelente', label: 'Excelente', icon: qualityIcons[4] },
    ],
  },
  // 5. Feedback Aberto
  {
    key: 'q21_liked_most_today',
    text: '21. O que você mais gostou no curso hoje?',
    type: 'text',
    category: 'Feedback Aberto',
  },
  {
    key: 'q22_suggestions',
    text: '22. Se pudesse mudar ou acrescentar algo para os próximos dias, o que seria?',
    type: 'text',
    category: 'Feedback Aberto',
  },
  // 6. Diagnóstico de Início (Removed q23, q24, q26)
  {
    key: 'q25_urgency_level',
    text: '23. Qual sua urgência para iniciar na área?',
    type: 'radio',
    category: 'Diagnóstico de Início de Curso',
    options: [
      { value: 'Sem urgência', label: 'Sem urgência', icon: <Clock key="none" className="h-5 w-5 text-muted-foreground" /> },
      { value: 'Média urgência', label: 'Média urgência', icon: <Timer key="mid" className="h-5 w-5 text-amber-500" /> },
      { value: 'Alta urgência', label: 'Alta urgência', icon: <Zap key="high" className="h-5 w-5 text-destructive" /> },
    ],
  },
  {
    key: 'q27_weekly_time',
    text: '24. Quanto tempo disponível você tem para se dedicar semanalmente?',
    type: 'radio',
    category: 'Diagnóstico de Início de Curso',
    options: [
      { value: 'Até 5 horas', label: 'Até 5 horas', icon: <Hourglass key="low" className="h-5 w-5 text-muted-foreground" /> },
      { value: 'De 5 a 10 horas', label: 'De 5 a 10 horas', icon: <Clock key="mid" className="h-5 w-5 text-amber-500" /> },
      { value: 'Mais de 10 horas', label: 'Mais de 10 horas', icon: <Calendar key="high" className="h-5 w-5 text-emerald-500" /> },
    ],
  },
  {
    key: 'q28_current_reality',
    text: '25. Qual alternativa melhor representa sua realidade hoje?',
    type: 'radio',
    category: 'Diagnóstico de Início de Curso',
    options: [
      { value: 'Baixo tempo e baixo investimento', label: 'Baixo tempo e baixo investimento', icon: <MinusCircle key="ll" className="h-5 w-5 text-muted-foreground" /> },
      { value: 'Baixo tempo e alto investimento', label: 'Baixo tempo e alto investimento', icon: <Zap key="lh" className="h-5 w-5 text-amber-500" /> },
      { value: 'Alto tempo e baixo investimento', label: 'Alto tempo e baixo investimento', icon: <Clock key="hl" className="h-5 w-5 text-blue-500" /> },
      { value: 'Alto tempo e alto investimento', label: 'Alto tempo e alto investimento', icon: <CheckCircle key="hh" className="h-5 w-5 text-emerald-500" /> },
    ],
  },
  
  // ======= Avaliação Individual dos Monitores =======
  
  // Monitor 1: Dra Gleyldes
  {
    key: 'q30_monitor_technical',
    text: '26. Avalie o domínio técnico da monitora',
    type: 'radio',
    category: 'Avaliação Monitor - Dra Gleyldes',
    options: monitorQualityOptions,
  },
  {
    key: 'q31_monitor_interest',
    text: '27. Interesse da monitora em ensinar e orientar',
    type: 'radio',
    category: 'Avaliação Monitor - Dra Gleyldes',
    options: monitorQualityOptions,
  },
  {
    key: 'q32_monitor_engagement',
    text: '28. Engajamento da monitora com a turma',
    type: 'radio',
    category: 'Avaliação Monitor - Dra Gleyldes',
    options: monitorQualityOptions,
  },
  {
    key: 'q33_monitor_posture',
    text: '29. Postura profissional da monitora',
    type: 'radio',
    category: 'Avaliação Monitor - Dra Gleyldes',
    options: monitorQualityOptions,
  },
  {
    key: 'q34_monitor_communication',
    text: '30. Comunicação da monitora com os alunos',
    type: 'radio',
    category: 'Avaliação Monitor - Dra Gleyldes',
    options: monitorQualityOptions,
  },
  {
    key: 'q35_monitor_contribution',
    text: '31. Contribuição da monitora para sua experiência no curso',
    type: 'radio',
    category: 'Avaliação Monitor - Dra Gleyldes',
    options: monitorQualityOptions,
  },
  {
    key: 'q36_monitor_strength',
    text: '32. Qual foi o principal ponto forte da Dra. Gleyldes?',
    type: 'text',
    category: 'Avaliação Monitor - Dra Gleyldes',
  },
  {
    key: 'q37_monitor_improve',
    text: '33. O que a Dra. Gleyldes pode melhorar para as próximas turmas?',
    type: 'text',
    category: 'Avaliação Monitor - Dra Gleyldes',
  },
  
  // Monitor 2: Dr Eder
  {
    key: 'q38_eder_technical' as keyof Day1SurveyFormData,
    text: '34. Avalie o domínio técnico do monitor',
    type: 'radio',
    category: 'Avaliação Monitor - Dr Eder',
    options: monitorQualityOptions,
  },
  {
    key: 'q39_eder_interest' as keyof Day1SurveyFormData,
    text: '35. Interesse do monitor em ensinar e orientar',
    type: 'radio',
    category: 'Avaliação Monitor - Dr Eder',
    options: monitorQualityOptions,
  },
  {
    key: 'q40_eder_engagement' as keyof Day1SurveyFormData,
    text: '36. Engajamento do monitor com a turma',
    type: 'radio',
    category: 'Avaliação Monitor - Dr Eder',
    options: monitorQualityOptions,
  },
  {
    key: 'q41_eder_posture' as keyof Day1SurveyFormData,
    text: '37. Postura profissional do monitor',
    type: 'radio',
    category: 'Avaliação Monitor - Dr Eder',
    options: monitorQualityOptions,
  },
  {
    key: 'q42_eder_communication' as keyof Day1SurveyFormData,
    text: '38. Comunicação do monitor com os alunos',
    type: 'radio',
    category: 'Avaliação Monitor - Dr Eder',
    options: monitorQualityOptions,
  },
  {
    key: 'q43_eder_contribution' as keyof Day1SurveyFormData,
    text: '39. Contribuição do monitor para sua experiência no curso',
    type: 'radio',
    category: 'Avaliação Monitor - Dr Eder',
    options: monitorQualityOptions,
  },
  {
    key: 'q44_eder_strength' as keyof Day1SurveyFormData,
    text: '40. Qual foi o principal ponto forte do Dr. Eder?',
    type: 'text',
    category: 'Avaliação Monitor - Dr Eder',
  },
  {
    key: 'q45_eder_improve' as keyof Day1SurveyFormData,
    text: '41. O que o Dr. Eder pode melhorar para as próximas turmas?',
    type: 'text',
    category: 'Avaliação Monitor - Dr Eder',
  },
  
  // Monitor 3: Dr Patrick (como monitor)
  {
    key: 'q46_patrick_m_technical' as keyof Day1SurveyFormData,
    text: '42. Avalie o domínio técnico do monitor',
    type: 'radio',
    category: 'Avaliação Monitor - Dr Patrick',
    options: monitorQualityOptions,
  },
  {
    key: 'q47_patrick_m_interest' as keyof Day1SurveyFormData,
    text: '43. Interesse do monitor em ensinar e orientar',
    type: 'radio',
    category: 'Avaliação Monitor - Dr Patrick',
    options: monitorQualityOptions,
  },
  {
    key: 'q48_patrick_m_engagement' as keyof Day1SurveyFormData,
    text: '44. Engajamento do monitor com a turma',
    type: 'radio',
    category: 'Avaliação Monitor - Dr Patrick',
    options: monitorQualityOptions,
  },
  {
    key: 'q49_patrick_m_posture' as keyof Day1SurveyFormData,
    text: '45. Postura profissional do monitor',
    type: 'radio',
    category: 'Avaliação Monitor - Dr Patrick',
    options: monitorQualityOptions,
  },
  {
    key: 'q50_patrick_m_communication' as keyof Day1SurveyFormData,
    text: '46. Comunicação do monitor com os alunos',
    type: 'radio',
    category: 'Avaliação Monitor - Dr Patrick',
    options: monitorQualityOptions,
  },
  {
    key: 'q51_patrick_m_contribution' as keyof Day1SurveyFormData,
    text: '47. Contribuição do monitor para sua experiência no curso',
    type: 'radio',
    category: 'Avaliação Monitor - Dr Patrick',
    options: monitorQualityOptions,
  },
  {
    key: 'q52_patrick_m_strength' as keyof Day1SurveyFormData,
    text: '48. Qual foi o principal ponto forte do Dr. Patrick como monitor?',
    type: 'text',
    category: 'Avaliação Monitor - Dr Patrick',
  },
  {
    key: 'q53_patrick_m_improve' as keyof Day1SurveyFormData,
    text: '49. O que o Dr. Patrick pode melhorar como monitor para as próximas turmas?',
    type: 'text',
    category: 'Avaliação Monitor - Dr Patrick',
  },
];

const TOTAL_QUESTIONS = QUESTIONS.length;

export function Day1SurveyDialog({ open, onOpenChange, classId, onComplete }: Day1SurveyDialogProps) {
  const { surveyResponse, hasCompleted, isLoading, startSurvey, saveProgress, submitSurvey, isSaving, isSubmitting } = useDay1Survey(classId);
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Day1SurveyFormData>>({});
  
  useEffect(() => {
    if (open && !surveyId && !hasCompleted) {
      startSurvey(classId || null).then((survey) => {
        setSurveyId(survey.id);
        setFormData(survey as unknown as Partial<Day1SurveyFormData>);
        // Find first unanswered question
        const surveyRecord = survey as unknown as Record<string, unknown>;
        const firstUnanswered = QUESTIONS.findIndex(q => {
          const val = surveyRecord[q.key];
          return val === null || val === undefined || val === '';
        });
        setCurrentQuestion(firstUnanswered >= 0 ? firstUnanswered : 0);
      });
    }
  }, [open, surveyId, hasCompleted, classId, startSurvey]);
  
  useEffect(() => {
    if (!open) {
      setSurveyId(null);
      setCurrentQuestion(0);
      setFormData({});
    }
  }, [open]);
  
  const currentQ = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / TOTAL_QUESTIONS) * 100;
  
  const handleSelectOption = async (value: string) => {
    const key = currentQ.key;
    let finalValue: string | boolean = value;
    
    // Handle boolean conversion
    if (currentQ.type === 'boolean') {
      finalValue = value === 'true';
    }
    
    const newFormData = { ...formData, [key]: finalValue };
    setFormData(newFormData);
    
    // Auto-advance after selection (with small delay for visual feedback)
    setTimeout(async () => {
      if (currentQuestion < TOTAL_QUESTIONS - 1) {
        if (surveyId) {
          await saveProgress({ surveyId, data: newFormData, currentSection: currentQuestion + 1 });
        }
        setCurrentQuestion(prev => prev + 1);
      } else {
        // Last question - submit
        if (surveyId) {
          await submitSurvey({ surveyId, data: newFormData });
          onComplete?.();
          onOpenChange(false);
        }
      }
    }, 300);
  };
  
  const handleTextNext = async () => {
    if (surveyId) {
      await saveProgress({ surveyId, data: formData, currentSection: currentQuestion + 1 });
    }
    if (currentQuestion < TOTAL_QUESTIONS - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Last question - submit
      if (surveyId) {
        await submitSurvey({ surveyId, data: formData });
        onComplete?.();
        onOpenChange(false);
      }
    }
  };
  
  const handleBack = () => {
    setCurrentQuestion(prev => Math.max(prev - 1, 0));
  };
  
  const getValue = (key: keyof Day1SurveyFormData): string => {
    const val = formData[key];
    if (val === true) return 'true';
    if (val === false) return 'false';
    return (val as string) || '';
  };
  
  if (hasCompleted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Pesquisa já respondida
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Você já respondeu à pesquisa de satisfação do Dia 1. Obrigado pelo feedback!
          </p>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📋 Pesquisa de Satisfação - Dia 1</DialogTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Pergunta {currentQuestion + 1} de {TOTAL_QUESTIONS}</span>
              <span>{Math.round(progress)}% concluído</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : currentQ && (
          <div className="space-y-6 py-4">
            {/* Show instructor info for relevant categories */}
            {currentQ.category && INSTRUCTORS[currentQ.category] && (
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                {INSTRUCTORS[currentQ.category].photo && (
                  <img 
                    src={INSTRUCTORS[currentQ.category].photo} 
                    alt={INSTRUCTORS[currentQ.category].name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20"
                  />
                )}
                <div>
                  <p className="text-lg font-bold text-foreground">{INSTRUCTORS[currentQ.category].name}</p>
                  <p className="text-sm text-muted-foreground">{INSTRUCTORS[currentQ.category].role}</p>
                </div>
              </div>
            )}
            
            <p className="text-lg font-medium">{currentQ.text}</p>
            
            {/* Radio/Boolean options with icons */}
            {(currentQ.type === 'radio' || currentQ.type === 'boolean') && currentQ.options && (
              <div className="space-y-2">
                {currentQ.options.map((option) => {
                  const isSelected = getValue(currentQ.key) === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSelectOption(option.value)}
                      disabled={isSaving || isSubmitting}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                        isSelected 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <span className="flex-shrink-0">{option.icon}</span>
                      <span className="flex-1">{option.label}</span>
                      {isSelected && <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* Text input */}
            {currentQ.type === 'text' && (
              <div className="space-y-4">
                <Textarea 
                  value={(formData[currentQ.key] as string) || ''} 
                  onChange={(e) => setFormData(prev => ({ ...prev, [currentQ.key]: e.target.value }))}
                  placeholder="Sua resposta..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            )}
          </div>
        )}
        
        {/* Navigation buttons - side by side */}
        <div className="flex gap-3 pt-4 border-t">
          {currentQuestion > 0 && (
            <Button 
              variant="outline" 
              onClick={handleBack} 
              disabled={isSaving || isSubmitting}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
          )}
          
          {currentQ?.type === 'text' && (
            <Button 
              onClick={handleTextNext} 
              disabled={isSaving || isSubmitting}
              className={cn(
                "flex-1 bg-emerald-600 text-white hover:bg-emerald-700",
                currentQuestion === 0 && "w-full"
              )}
            >
              {isSaving || isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {currentQuestion === TOTAL_QUESTIONS - 1 ? 'Finalizar Pesquisa' : 'Próximo'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
