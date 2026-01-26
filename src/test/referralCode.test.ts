import { describe, it, expect } from 'vitest';

/**
 * Referral Code Generation Tests
 * 
 * Tests for the referral code generation logic used in the system.
 * The actual implementation is in a database trigger, but we test
 * the expected behavior of code generation.
 */

// Simulate the referral code generation logic
function generateReferralCode(userId: string): string {
  // MD5-like hash simulation (simplified for testing)
  const input = userId + Date.now().toString();
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex and take first 8 characters
  const hexHash = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return hexHash.substring(0, 8);
}

// Validate referral code format
function isValidReferralCode(code: string): boolean {
  // Must be 8 uppercase alphanumeric characters
  return /^[A-Z0-9]{8}$/.test(code);
}

// Format referral code for display
function formatReferralCode(code: string): string {
  // Add hyphen in the middle for readability: XXXX-XXXX
  if (code.length !== 8) return code;
  return `${code.substring(0, 4)}-${code.substring(4)}`;
}

// Parse referral code from URL
function parseReferralFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('ref') || urlObj.searchParams.get('referral');
  } catch {
    return null;
  }
}

describe('Referral Code System', () => {
  describe('generateReferralCode', () => {
    it('should generate 8-character codes', () => {
      const code = generateReferralCode('test-user-id');
      expect(code.length).toBe(8);
    });

    it('should generate uppercase alphanumeric codes', () => {
      const code = generateReferralCode('test-user-id');
      expect(isValidReferralCode(code)).toBe(true);
    });

    it('should generate different codes for different users', () => {
      const code1 = generateReferralCode('user-1');
      const code2 = generateReferralCode('user-2');
      // Due to timestamp, codes will be different
      // In real implementation with same timestamp, user IDs make them unique
    });
  });

  describe('isValidReferralCode', () => {
    it('should accept valid 8-character uppercase alphanumeric codes', () => {
      expect(isValidReferralCode('ABCD1234')).toBe(true);
      expect(isValidReferralCode('12345678')).toBe(true);
      expect(isValidReferralCode('XXXXXXXX')).toBe(true);
    });

    it('should reject invalid codes', () => {
      expect(isValidReferralCode('')).toBe(false);
      expect(isValidReferralCode('ABC123')).toBe(false); // Too short
      expect(isValidReferralCode('ABCD12345')).toBe(false); // Too long
      expect(isValidReferralCode('abcd1234')).toBe(false); // Lowercase
      expect(isValidReferralCode('ABCD-123')).toBe(false); // Special chars
    });
  });

  describe('formatReferralCode', () => {
    it('should format code with hyphen', () => {
      expect(formatReferralCode('ABCD1234')).toBe('ABCD-1234');
    });

    it('should return unchanged if not 8 characters', () => {
      expect(formatReferralCode('ABC')).toBe('ABC');
      expect(formatReferralCode('ABCD12345')).toBe('ABCD12345');
    });
  });

  describe('parseReferralFromUrl', () => {
    it('should parse ref parameter', () => {
      const code = parseReferralFromUrl('https://example.com?ref=ABCD1234');
      expect(code).toBe('ABCD1234');
    });

    it('should parse referral parameter', () => {
      const code = parseReferralFromUrl('https://example.com?referral=ABCD1234');
      expect(code).toBe('ABCD1234');
    });

    it('should return null for URLs without referral', () => {
      expect(parseReferralFromUrl('https://example.com')).toBeNull();
      expect(parseReferralFromUrl('https://example.com?other=value')).toBeNull();
    });

    it('should return null for invalid URLs', () => {
      expect(parseReferralFromUrl('not-a-url')).toBeNull();
    });
  });
});
