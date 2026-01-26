import { describe, it, expect } from 'vitest';

/**
 * Form Validation Tests
 * 
 * Tests for common form validation patterns used throughout the application.
 * These are pure functions that can be tested without mocking.
 */

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// CPF validation (Brazilian ID)
function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCPF)) return false; // All same digits
  
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleanCPF[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleanCPF[10])) return false;
  
  return true;
}

// Phone validation (Brazilian format)
function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

// CEP validation (Brazilian postal code)
function isValidCEP(cep: string): boolean {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8;
}

// Password strength validation
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Senha deve ter no mínimo 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  
  return { valid: errors.length === 0, errors };
}

// Required field validation
function isRequired(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}

// Max length validation
function isWithinMaxLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength;
}

// Numeric validation
function isNumeric(value: string): boolean {
  return /^\d+$/.test(value);
}

// Date validation (YYYY-MM-DD format)
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// URL validation
function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

describe('Form Validations', () => {
  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.br')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user @domain.com')).toBe(false);
    });
  });

  describe('isValidCPF', () => {
    it('should accept valid CPFs', () => {
      expect(isValidCPF('529.982.247-25')).toBe(true);
      expect(isValidCPF('52998224725')).toBe(true);
    });

    it('should reject invalid CPFs', () => {
      expect(isValidCPF('')).toBe(false);
      expect(isValidCPF('123.456.789-00')).toBe(false);
      expect(isValidCPF('111.111.111-11')).toBe(false); // All same digits
      expect(isValidCPF('12345678901')).toBe(false);
      expect(isValidCPF('1234567890')).toBe(false); // Too short
    });
  });

  describe('isValidPhone', () => {
    it('should accept valid Brazilian phone numbers', () => {
      expect(isValidPhone('11999998888')).toBe(true);
      expect(isValidPhone('(11) 99999-8888')).toBe(true);
      expect(isValidPhone('1199998888')).toBe(true); // landline
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone('123456789')).toBe(false); // Too short
      expect(isValidPhone('123456789012')).toBe(false); // Too long
    });
  });

  describe('isValidCEP', () => {
    it('should accept valid CEPs', () => {
      expect(isValidCEP('01310-100')).toBe(true);
      expect(isValidCEP('01310100')).toBe(true);
    });

    it('should reject invalid CEPs', () => {
      expect(isValidCEP('')).toBe(false);
      expect(isValidCEP('1234567')).toBe(false); // Too short
      expect(isValidCEP('123456789')).toBe(false); // Too long
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      const result = validatePassword('StrongP4ss');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should provide specific error messages', () => {
      const noUppercase = validatePassword('lowercase123');
      expect(noUppercase.errors).toContain('Senha deve conter pelo menos uma letra maiúscula');

      const noLowercase = validatePassword('UPPERCASE123');
      expect(noLowercase.errors).toContain('Senha deve conter pelo menos uma letra minúscula');

      const noNumber = validatePassword('NoNumbers');
      expect(noNumber.errors).toContain('Senha deve conter pelo menos um número');

      const tooShort = validatePassword('Ab1');
      expect(tooShort.errors).toContain('Senha deve ter no mínimo 8 caracteres');
    });
  });

  describe('isRequired', () => {
    it('should return true for non-empty values', () => {
      expect(isRequired('value')).toBe(true);
      expect(isRequired('  value  ')).toBe(true);
    });

    it('should return false for empty values', () => {
      expect(isRequired('')).toBe(false);
      expect(isRequired('   ')).toBe(false);
      expect(isRequired(null)).toBe(false);
      expect(isRequired(undefined)).toBe(false);
    });
  });

  describe('isWithinMaxLength', () => {
    it('should return true when within limit', () => {
      expect(isWithinMaxLength('hello', 10)).toBe(true);
      expect(isWithinMaxLength('hello', 5)).toBe(true);
    });

    it('should return false when exceeding limit', () => {
      expect(isWithinMaxLength('hello world', 5)).toBe(false);
    });
  });

  describe('isNumeric', () => {
    it('should return true for numeric strings', () => {
      expect(isNumeric('12345')).toBe(true);
      expect(isNumeric('0')).toBe(true);
    });

    it('should return false for non-numeric strings', () => {
      expect(isNumeric('')).toBe(false);
      expect(isNumeric('abc')).toBe(false);
      expect(isNumeric('12.34')).toBe(false);
      expect(isNumeric('12a34')).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(isValidDate('2024-01-15')).toBe(true);
      expect(isValidDate('2024-12-31')).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isValidDate('')).toBe(false);
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('2024-13-01')).toBe(false); // Invalid month
    });
  });

  describe('isValidURL', () => {
    it('should return true for valid URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://localhost:3000')).toBe(true);
      expect(isValidURL('https://example.com/path?query=1')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidURL('')).toBe(false);
      expect(isValidURL('not-a-url')).toBe(false);
      expect(isValidURL('example.com')).toBe(false); // Missing protocol
    });
  });
});
