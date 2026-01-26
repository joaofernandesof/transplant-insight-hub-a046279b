import { describe, it, expect } from 'vitest';
import {
  parsePermissions,
  hasModulePermission,
  getAccessibleModules,
  getAccessibleAcademyModules,
  canAccessAnyAcademy,
  ACADEMY_MODULES,
} from '../permissions';

describe('permissions', () => {
  describe('parsePermissions', () => {
    it('should parse valid permission strings', () => {
      const permissions = ['academy_ibramec:read', 'neoteam_schedule:write'];
      const result = parsePermissions(permissions);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ moduleCode: 'academy_ibramec', action: 'read' });
      expect(result[1]).toEqual({ moduleCode: 'neoteam_schedule', action: 'write' });
    });

    it('should filter out invalid permission strings', () => {
      const permissions = ['invalid', 'academy_ibramec:read', '', 'also_invalid'];
      const result = parsePermissions(permissions);
      
      expect(result).toHaveLength(1);
      expect(result[0].moduleCode).toBe('academy_ibramec');
    });

    it('should return empty array for empty input', () => {
      expect(parsePermissions([])).toEqual([]);
    });

    it('should handle permissions with multiple colons', () => {
      const permissions = ['module:read:extra'];
      const result = parsePermissions(permissions);
      
      expect(result).toHaveLength(1);
      expect(result[0].moduleCode).toBe('module');
    });
  });

  describe('hasModulePermission', () => {
    const permissions = ['academy_ibramec:read', 'academy_ibramec:write', 'neoteam_schedule:read'];

    it('should return true when permission exists', () => {
      expect(hasModulePermission(permissions, 'academy_ibramec', 'read')).toBe(true);
      expect(hasModulePermission(permissions, 'academy_ibramec', 'write')).toBe(true);
    });

    it('should return false when permission does not exist', () => {
      expect(hasModulePermission(permissions, 'academy_ibramec', 'delete')).toBe(false);
      expect(hasModulePermission(permissions, 'nonexistent', 'read')).toBe(false);
    });

    it('should default to read action', () => {
      expect(hasModulePermission(permissions, 'neoteam_schedule')).toBe(true);
      expect(hasModulePermission(permissions, 'academy_avivar')).toBe(false);
    });
  });

  describe('getAccessibleModules', () => {
    it('should return modules with read permission', () => {
      const permissions = ['academy_ibramec:read', 'neoteam_schedule:read', 'academy_avivar:write'];
      const result = getAccessibleModules(permissions);
      
      expect(result).toContain('academy_ibramec');
      expect(result).toContain('neoteam_schedule');
      expect(result).not.toContain('academy_avivar');
    });

    it('should return empty array when no read permissions', () => {
      const permissions = ['academy_ibramec:write', 'academy_avivar:delete'];
      expect(getAccessibleModules(permissions)).toEqual([]);
    });
  });

  describe('getAccessibleAcademyModules', () => {
    it('should return only academy modules with read permission', () => {
      const permissions = [
        'academy_ibramec:read',
        'academy_avivar:read',
        'neoteam_schedule:read',
        'academy_byneofolic:write'
      ];
      const result = getAccessibleAcademyModules(permissions);
      
      expect(result).toContain('academy_ibramec');
      expect(result).toContain('academy_avivar');
      expect(result).not.toContain('neoteam_schedule');
      expect(result).not.toContain('academy_byneofolic');
    });

    it('should return empty array when no academy permissions', () => {
      const permissions = ['neoteam_schedule:read', 'neocare_profile:read'];
      expect(getAccessibleAcademyModules(permissions)).toEqual([]);
    });
  });

  describe('canAccessAnyAcademy', () => {
    it('should return true when user has any academy read permission', () => {
      const permissions = ['academy_ibramec:read'];
      expect(canAccessAnyAcademy(permissions)).toBe(true);
    });

    it('should return false when no academy read permissions', () => {
      const permissions = ['neoteam_schedule:read', 'academy_ibramec:write'];
      expect(canAccessAnyAcademy(permissions)).toBe(false);
    });

    it('should return false for empty permissions', () => {
      expect(canAccessAnyAcademy([])).toBe(false);
    });
  });

  describe('ACADEMY_MODULES constants', () => {
    it('should have all expected academy modules', () => {
      expect(ACADEMY_MODULES.IBRAMEC).toBe('academy_ibramec');
      expect(ACADEMY_MODULES.BYNEOFOLIC).toBe('academy_byneofolic');
      expect(ACADEMY_MODULES.AVIVAR).toBe('academy_avivar');
      expect(ACADEMY_MODULES.OPERACAO_NEOFOLIC).toBe('academy_operacao_neofolic');
    });
  });
});
