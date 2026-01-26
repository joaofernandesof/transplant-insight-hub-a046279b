import { describe, it, expect } from 'vitest';

/**
 * Commission Calculation Tests
 * 
 * Tests for commission calculation logic used in the sales system.
 */

interface CommissionTier {
  minAmount: number;
  maxAmount: number;
  rate: number;
}

interface CommissionResult {
  totalSales: number;
  commissionAmount: number;
  tier: string;
  rate: number;
}

// Commission tiers
const COMMISSION_TIERS: CommissionTier[] = [
  { minAmount: 0, maxAmount: 10000, rate: 0.05 },      // 5% for 0-10k
  { minAmount: 10000, maxAmount: 25000, rate: 0.07 },  // 7% for 10k-25k
  { minAmount: 25000, maxAmount: 50000, rate: 0.10 },  // 10% for 25k-50k
  { minAmount: 50000, maxAmount: Infinity, rate: 0.12 } // 12% for 50k+
];

// Get tier name
function getTierName(rate: number): string {
  switch (rate) {
    case 0.05: return 'Bronze';
    case 0.07: return 'Silver';
    case 0.10: return 'Gold';
    case 0.12: return 'Diamond';
    default: return 'Unknown';
  }
}

// Calculate commission based on total sales
function calculateCommission(totalSales: number): CommissionResult {
  if (totalSales < 0) {
    return { totalSales: 0, commissionAmount: 0, tier: 'None', rate: 0 };
  }

  const tier = COMMISSION_TIERS.find(
    t => totalSales >= t.minAmount && totalSales < t.maxAmount
  ) || COMMISSION_TIERS[COMMISSION_TIERS.length - 1];

  const commissionAmount = totalSales * tier.rate;
  
  return {
    totalSales,
    commissionAmount: Math.round(commissionAmount * 100) / 100, // Round to 2 decimals
    tier: getTierName(tier.rate),
    rate: tier.rate
  };
}

// Calculate progressive commission (different rate for each tier)
function calculateProgressiveCommission(totalSales: number): number {
  if (totalSales <= 0) return 0;

  let commission = 0;
  let remaining = totalSales;

  for (const tier of COMMISSION_TIERS) {
    if (remaining <= 0) break;
    
    const tierRange = tier.maxAmount - tier.minAmount;
    const amountInTier = Math.min(remaining, tierRange);
    
    if (totalSales > tier.minAmount) {
      commission += amountInTier * tier.rate;
      remaining -= amountInTier;
    }
  }

  return Math.round(commission * 100) / 100;
}

// Calculate bonus for exceeding target
function calculateBonus(totalSales: number, target: number, bonusRate: number = 0.02): number {
  if (totalSales <= target) return 0;
  const excess = totalSales - target;
  return Math.round(excess * bonusRate * 100) / 100;
}

describe('Commission Calculations', () => {
  describe('calculateCommission', () => {
    it('should calculate Bronze tier (5%) for sales under 10k', () => {
      const result = calculateCommission(5000);
      expect(result.tier).toBe('Bronze');
      expect(result.rate).toBe(0.05);
      expect(result.commissionAmount).toBe(250);
    });

    it('should calculate Silver tier (7%) for sales 10k-25k', () => {
      const result = calculateCommission(15000);
      expect(result.tier).toBe('Silver');
      expect(result.rate).toBe(0.07);
      expect(result.commissionAmount).toBe(1050);
    });

    it('should calculate Gold tier (10%) for sales 25k-50k', () => {
      const result = calculateCommission(30000);
      expect(result.tier).toBe('Gold');
      expect(result.rate).toBe(0.10);
      expect(result.commissionAmount).toBe(3000);
    });

    it('should calculate Diamond tier (12%) for sales 50k+', () => {
      const result = calculateCommission(100000);
      expect(result.tier).toBe('Diamond');
      expect(result.rate).toBe(0.12);
      expect(result.commissionAmount).toBe(12000);
    });

    it('should handle zero sales', () => {
      const result = calculateCommission(0);
      expect(result.commissionAmount).toBe(0);
      expect(result.tier).toBe('Bronze');
    });

    it('should handle negative sales', () => {
      const result = calculateCommission(-1000);
      expect(result.commissionAmount).toBe(0);
      expect(result.tier).toBe('None');
    });

    it('should handle boundary values', () => {
      const result9999 = calculateCommission(9999);
      expect(result9999.tier).toBe('Bronze');

      const result10000 = calculateCommission(10000);
      expect(result10000.tier).toBe('Silver');

      const result24999 = calculateCommission(24999);
      expect(result24999.tier).toBe('Silver');

      const result25000 = calculateCommission(25000);
      expect(result25000.tier).toBe('Gold');
    });

    it('should round to 2 decimal places', () => {
      const result = calculateCommission(33.33);
      expect(result.commissionAmount).toBe(1.67); // 33.33 * 0.05 = 1.6665
    });
  });

  describe('calculateProgressiveCommission', () => {
    it('should apply progressive rates', () => {
      // For 15000:
      // First 10000 at 5% = 500
      // Next 5000 at 7% = 350
      // Total = 850
      const result = calculateProgressiveCommission(15000);
      expect(result).toBe(850);
    });

    it('should handle sales within first tier only', () => {
      const result = calculateProgressiveCommission(5000);
      expect(result).toBe(250); // 5000 * 0.05
    });

    it('should handle zero and negative values', () => {
      expect(calculateProgressiveCommission(0)).toBe(0);
      expect(calculateProgressiveCommission(-100)).toBe(0);
    });
  });

  describe('calculateBonus', () => {
    it('should calculate bonus for exceeding target', () => {
      const bonus = calculateBonus(120000, 100000);
      expect(bonus).toBe(400); // 20000 * 0.02
    });

    it('should return 0 when target not met', () => {
      expect(calculateBonus(80000, 100000)).toBe(0);
    });

    it('should return 0 when exactly at target', () => {
      expect(calculateBonus(100000, 100000)).toBe(0);
    });

    it('should use custom bonus rate', () => {
      const bonus = calculateBonus(110000, 100000, 0.05);
      expect(bonus).toBe(500); // 10000 * 0.05
    });
  });

  describe('getTierName', () => {
    it('should return correct tier names', () => {
      expect(getTierName(0.05)).toBe('Bronze');
      expect(getTierName(0.07)).toBe('Silver');
      expect(getTierName(0.10)).toBe('Gold');
      expect(getTierName(0.12)).toBe('Diamond');
      expect(getTierName(0.15)).toBe('Unknown');
    });
  });
});
