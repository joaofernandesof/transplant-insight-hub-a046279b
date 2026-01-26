import { describe, it, expect } from 'vitest';
import {
  calculateMetrics,
  getMetricStatus,
  formatMetricValue,
  getStatusIcon,
  getStatusLabel,
} from '../metricCalculations';

describe('metricCalculations', () => {
  describe('calculateMetrics', () => {
    it('should calculate CTR correctly', () => {
      const input = { cliques: 100, impressoes: 10000 };
      const result = calculateMetrics(input);
      expect(result.CTR).toBe(1); // 100/10000 * 100 = 1%
    });

    it('should calculate CPC correctly', () => {
      const input = { gastoMidia: 500, cliques: 100 };
      const result = calculateMetrics(input);
      expect(result.CPC).toBe(5); // 500/100 = 5
    });

    it('should calculate CPM correctly', () => {
      const input = { gastoMidia: 100, impressoes: 50000 };
      const result = calculateMetrics(input);
      expect(result.CPM).toBe(2); // 100 / (50000/1000) = 2
    });

    it('should calculate Frequency correctly', () => {
      const input = { impressoes: 10000, alcance: 2500 };
      const result = calculateMetrics(input);
      expect(result.Freq).toBe(4); // 10000/2500 = 4
    });

    it('should calculate ROAS correctly', () => {
      const input = { receita: 10000, gastoMidia: 2000 };
      const result = calculateMetrics(input);
      expect(result.ROAS).toBe(5); // 10000/2000 = 5
    });

    it('should calculate ROI correctly', () => {
      const input = { lucro: 3000, gastoMidia: 2000 };
      const result = calculateMetrics(input);
      expect(result.ROI).toBe(1.5); // 3000/2000 = 1.5
    });

    it('should calculate Margin correctly', () => {
      const input = { lucro: 3000, receita: 10000 };
      const result = calculateMetrics(input);
      expect(result.Margin).toBe(30); // (3000/10000) * 100 = 30%
    });

    it('should calculate CAC correctly', () => {
      const input = { gastoMidia: 5000, custoFixo: 2000, custoVariavel: 1000, vendas: 10 };
      const result = calculateMetrics(input);
      expect(result.CAC).toBe(800); // (5000+2000+1000)/10 = 800
    });

    it('should handle zero divisions gracefully', () => {
      const input = { cliques: 0, impressoes: 0, gastoMidia: 0 };
      const result = calculateMetrics(input);
      expect(result.CTR).toBe(0);
      expect(result.CPC).toBe(0);
      expect(result.CPM).toBe(0);
    });

    it('should calculate Health score correctly', () => {
      // Good metrics scenario
      const goodInput = {
        gastoMidia: 1000,
        leadsTotal: 50, // CPL = 20 (< 50) ✓
        consultasAgendadas: 100,
        consultasRealizadas: 90, // Show = 90% (> 85%) ✓
        propostas: 50,
        vendas: 10, // Close = 20% (> 12%) ✓
        receita: 10000, // ROAS = 10 (> 2.5) ✓
      };
      const goodResult = calculateMetrics(goodInput);
      expect(goodResult.Health).toBe('Ótimo');
    });

    it('should calculate funnel drop correctly', () => {
      const input = { leadsTotal: 100, vendas: 10 };
      const result = calculateMetrics(input);
      expect(result.FunnelDrop).toBe(90); // ((100-10)/100)*100 = 90%
    });
  });

  describe('getMetricStatus', () => {
    it('should return null for null values', () => {
      expect(getMetricStatus('CTR', null)).toBeNull();
      expect(getMetricStatus('CTR', undefined)).toBeNull();
    });

    it('should return null for unknown metrics', () => {
      expect(getMetricStatus('UNKNOWN_METRIC', 50)).toBeNull();
    });

    it('should identify lower-is-better metrics correctly', () => {
      // CPC lower is better
      expect(getMetricStatus('CPC', 1)).toBe('great'); // Very low CPC
      expect(getMetricStatus('CPC', 100)).toBe('bad'); // Very high CPC
    });
  });

  describe('formatMetricValue', () => {
    it('should format percent values', () => {
      expect(formatMetricValue(10.5, 'percent')).toBe('10.5%');
      expect(formatMetricValue(10, 'percent')).toBe('10%');
    });

    it('should format currency values', () => {
      const result = formatMetricValue(1234.56, 'currency');
      expect(result).toContain('R$');
      expect(result).toContain('1.234');
    });

    it('should format decimal values', () => {
      expect(formatMetricValue(1.5, 'decimal')).toBe('1.5');
      expect(formatMetricValue(1.0, 'decimal')).toBe('1');
    });

    it('should format number values', () => {
      const result = formatMetricValue(1234567, 'number');
      expect(result).toBe('1.234.567');
    });

    it('should format minutes', () => {
      expect(formatMetricValue(30, 'minutes')).toBe('30 min');
    });

    it('should format days', () => {
      expect(formatMetricValue(7, 'days')).toBe('7 dias');
    });

    it('should format index values', () => {
      expect(formatMetricValue(2.5, 'index')).toBe('2.5x');
    });

    it('should return dash for null values', () => {
      expect(formatMetricValue(null, 'percent')).toBe('-');
    });

    it('should pass through string values for status format', () => {
      expect(formatMetricValue('Ótimo', 'status')).toBe('Ótimo');
    });
  });

  describe('getStatusIcon', () => {
    it('should return correct emoji for each status', () => {
      expect(getStatusIcon('great')).toBe('🟢');
      expect(getStatusIcon('good')).toBe('🔵');
      expect(getStatusIcon('medium')).toBe('🟡');
      expect(getStatusIcon('bad')).toBe('🔴');
      expect(getStatusIcon(null)).toBe('⚪');
    });
  });

  describe('getStatusLabel', () => {
    it('should return correct label for each status', () => {
      expect(getStatusLabel('great')).toBe('Ótimo');
      expect(getStatusLabel('good')).toBe('Bom');
      expect(getStatusLabel('medium')).toBe('Médio');
      expect(getStatusLabel('bad')).toBe('Ruim');
      expect(getStatusLabel(null)).toBe('-');
    });
  });
});
