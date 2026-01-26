import { describe, it, expect } from 'vitest';

/**
 * Day 2 Score Calculation Tests
 * 
 * Tests for the scoring logic used in Day 2 satisfaction surveys.
 * The scoring is implemented in the database trigger `calculate_day2_scores`
 * but we test the expected behavior here.
 * 
 * Score Ranges:
 * - IA Avivar: 0-18 (Q12 + Q13 + Q14, each 0-6)
 * - License: 0-18 (Q15 + Q16 + Q17, each 0-6)
 * - Legal: 0-18 (Q18 + Q19 + Q20, each 0-6)
 * - Total: 0-54
 * 
 * Classification:
 * - HOT: score_total >= 40
 * - WARM: score_total >= 25 && < 40
 * - COLD: score_total < 25
 */

// Score values for each answer option
const SCORE_VALUES = {
  // Q12 - IA Avivar - Current Process
  q12: {
    'Tudo depende de pessoas e memória': 0,
    'Tenho organização básica, mas com falhas frequentes': 2,
    'Consigo organizar, mas sinto limites claros': 4,
    'Tenho estrutura e quero ganhar escala e previsibilidade': 6,
  },
  // Q13 - IA Avivar - Opportunity Loss
  q13: {
    'Funciona bem do jeito que está': 0,
    'Funciona, mas gera desgaste': 2,
    'Funciona com perda de oportunidades': 4,
    'É um gargalo claro no crescimento': 6,
  },
  // Q14 - IA Avivar - Timing
  q14: {
    'Não é prioridade agora': 0,
    'Quando tiver mais tempo': 2,
    'Nos próximos meses': 4,
    'O quanto antes': 6,
  },
  // Q15 - License - Budget viability (R$ 80k reference)
  q15: {
    'Não é viável para mim hoje': 0,
    'Seria viável apenas com muito planejamento': 2,
    'É viável se o modelo fizer sentido': 4,
    'É totalmente viável para mim': 6,
  },
  // Q16 - License - Pace/Exposure
  q16: {
    'Não me expõe': 0,
    'Me expõe pouco': 2,
    'Me expõe bastante': 4,
    'É um dos meus principais gargalos': 6,
  },
  // Q17 - License - Timing
  q17: {
    'Não penso nisso no momento': 0,
    'Talvez em um futuro distante': 2,
    'Nos próximos meses': 4,
    'Agora é o momento certo': 6,
  },
  // Q18 - Legal - Security feeling
  q18: {
    'Tranquilo e seguro': 0,
    'Um pouco inseguro': 2,
    'Inseguro em alguns pontos': 4,
    'Exposto a riscos que me preocupam': 6,
  },
  // Q19 - Legal - Influence on decisions
  q19: {
    'Não influenciam': 0,
    'Influenciam pouco': 2,
    'Influenciam bastante': 4,
    'Travaram ou quase travaram decisões importantes': 6,
  },
  // Q20 - Legal - Timing
  q20: {
    'Não vejo isso como prioridade': 0,
    'Quando o negócio estiver maior': 2,
    'Nos próximos meses': 4,
    'O quanto antes': 6,
  },
};

// Calculate IA Avivar score
function calculateIAScore(q12: string, q13: string, q14: string): number {
  return (SCORE_VALUES.q12[q12 as keyof typeof SCORE_VALUES.q12] || 0) +
         (SCORE_VALUES.q13[q13 as keyof typeof SCORE_VALUES.q13] || 0) +
         (SCORE_VALUES.q14[q14 as keyof typeof SCORE_VALUES.q14] || 0);
}

// Calculate License score
function calculateLicenseScore(q15: string, q16: string, q17: string): number {
  return (SCORE_VALUES.q15[q15 as keyof typeof SCORE_VALUES.q15] || 0) +
         (SCORE_VALUES.q16[q16 as keyof typeof SCORE_VALUES.q16] || 0) +
         (SCORE_VALUES.q17[q17 as keyof typeof SCORE_VALUES.q17] || 0);
}

// Calculate Legal score
function calculateLegalScore(q18: string, q19: string, q20: string): number {
  return (SCORE_VALUES.q18[q18 as keyof typeof SCORE_VALUES.q18] || 0) +
         (SCORE_VALUES.q19[q19 as keyof typeof SCORE_VALUES.q19] || 0) +
         (SCORE_VALUES.q20[q20 as keyof typeof SCORE_VALUES.q20] || 0);
}

// Calculate total score
function calculateTotalScore(iaScore: number, licenseScore: number, legalScore: number): number {
  return iaScore + licenseScore + legalScore;
}

// Classify lead based on total score
function classifyLead(totalScore: number): 'hot' | 'warm' | 'cold' {
  if (totalScore >= 40) return 'hot';
  if (totalScore >= 25) return 'warm';
  return 'cold';
}

// Normalize 0-18 score to 0-10
function normalize18to10(score: number): number {
  return Math.min(10, (score / 18) * 10);
}

// Normalize 0-54 score to 0-10
function normalize54to10(score: number): number {
  return Math.min(10, (score / 54) * 10);
}

describe('Day2 Score Calculations', () => {
  describe('IA Avivar Score (Q12-Q14)', () => {
    it('should calculate minimum score (0) for all lowest options', () => {
      const score = calculateIAScore(
        'Tudo depende de pessoas e memória',
        'Funciona bem do jeito que está',
        'Não é prioridade agora'
      );
      expect(score).toBe(0);
    });

    it('should calculate maximum score (18) for all highest options', () => {
      const score = calculateIAScore(
        'Tenho estrutura e quero ganhar escala e previsibilidade',
        'É um gargalo claro no crescimento',
        'O quanto antes'
      );
      expect(score).toBe(18);
    });

    it('should calculate mid-range score correctly', () => {
      const score = calculateIAScore(
        'Tenho organização básica, mas com falhas frequentes', // 2
        'Funciona com perda de oportunidades', // 4
        'Nos próximos meses' // 4
      );
      expect(score).toBe(10);
    });
  });

  describe('License Score (Q15-Q17)', () => {
    it('should calculate minimum score (0) for all lowest options', () => {
      const score = calculateLicenseScore(
        'Não é viável para mim hoje',
        'Não me expõe',
        'Não penso nisso no momento'
      );
      expect(score).toBe(0);
    });

    it('should calculate maximum score (18) for all highest options', () => {
      const score = calculateLicenseScore(
        'É totalmente viável para mim',
        'É um dos meus principais gargalos',
        'Agora é o momento certo'
      );
      expect(score).toBe(18);
    });
  });

  describe('Legal Score (Q18-Q20)', () => {
    it('should calculate minimum score (0) for safest options', () => {
      const score = calculateLegalScore(
        'Tranquilo e seguro',
        'Não influenciam',
        'Não vejo isso como prioridade'
      );
      expect(score).toBe(0);
    });

    it('should calculate maximum score (18) for highest risk options', () => {
      const score = calculateLegalScore(
        'Exposto a riscos que me preocupam',
        'Travaram ou quase travaram decisões importantes',
        'O quanto antes'
      );
      expect(score).toBe(18);
    });
  });

  describe('Total Score and Classification', () => {
    it('should classify as HOT when total >= 40', () => {
      expect(classifyLead(40)).toBe('hot');
      expect(classifyLead(45)).toBe('hot');
      expect(classifyLead(54)).toBe('hot');
    });

    it('should classify as WARM when total >= 25 and < 40', () => {
      expect(classifyLead(25)).toBe('warm');
      expect(classifyLead(30)).toBe('warm');
      expect(classifyLead(39)).toBe('warm');
    });

    it('should classify as COLD when total < 25', () => {
      expect(classifyLead(0)).toBe('cold');
      expect(classifyLead(12)).toBe('cold');
      expect(classifyLead(24)).toBe('cold');
    });

    it('should calculate correct total from all subscores', () => {
      const total = calculateTotalScore(18, 18, 18);
      expect(total).toBe(54);
    });
  });

  describe('Score Normalization', () => {
    it('should normalize 18-point scale to 10-point scale', () => {
      expect(normalize18to10(0)).toBe(0);
      expect(normalize18to10(9)).toBeCloseTo(5, 1);
      expect(normalize18to10(18)).toBe(10);
    });

    it('should normalize 54-point scale to 10-point scale', () => {
      expect(normalize54to10(0)).toBe(0);
      expect(normalize54to10(27)).toBeCloseTo(5, 1);
      expect(normalize54to10(54)).toBe(10);
    });

    it('should cap normalized scores at 10', () => {
      expect(normalize18to10(20)).toBe(10);
      expect(normalize54to10(60)).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown answer options as 0', () => {
      const score = calculateIAScore('unknown', 'unknown', 'unknown');
      expect(score).toBe(0);
    });

    it('should handle partial responses', () => {
      const iaScore = calculateIAScore(
        'Tenho estrutura e quero ganhar escala e previsibilidade', // 6
        '', // 0 (invalid)
        'O quanto antes' // 6
      );
      expect(iaScore).toBe(12);
    });
  });

  describe('Realistic Scenarios', () => {
    it('should correctly score a typical HOT lead', () => {
      const iaScore = calculateIAScore(
        'Tenho estrutura e quero ganhar escala e previsibilidade', // 6
        'É um gargalo claro no crescimento', // 6
        'O quanto antes' // 6
      );
      const licenseScore = calculateLicenseScore(
        'É totalmente viável para mim', // 6
        'É um dos meus principais gargalos', // 6
        'Agora é o momento certo' // 6
      );
      const legalScore = calculateLegalScore(
        'Inseguro em alguns pontos', // 4
        'Influenciam bastante', // 4
        'Nos próximos meses' // 4
      );
      
      const total = calculateTotalScore(iaScore, licenseScore, legalScore);
      expect(total).toBe(48); // 18 + 18 + 12
      expect(classifyLead(total)).toBe('hot');
    });

    it('should correctly score a typical COLD lead', () => {
      const iaScore = calculateIAScore(
        'Tudo depende de pessoas e memória', // 0
        'Funciona bem do jeito que está', // 0
        'Não é prioridade agora' // 0
      );
      const licenseScore = calculateLicenseScore(
        'Não é viável para mim hoje', // 0
        'Não me expõe', // 0
        'Não penso nisso no momento' // 0
      );
      const legalScore = calculateLegalScore(
        'Tranquilo e seguro', // 0
        'Não influenciam', // 0
        'Não vejo isso como prioridade' // 0
      );
      
      const total = calculateTotalScore(iaScore, licenseScore, legalScore);
      expect(total).toBe(0);
      expect(classifyLead(total)).toBe('cold');
    });
  });
});
