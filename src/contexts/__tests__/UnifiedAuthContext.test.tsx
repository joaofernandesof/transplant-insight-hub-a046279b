import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import {
  UnifiedAuthProvider,
  useUnifiedAuth,
  isAdminProfile,
  canAccessPortal,
  canAccessRoute,
  getDefaultRouteForProfile,
  PROFILE_PORTAL_MAP,
  PROFILE_ROUTES,
  PROFILE_NAMES,
  ProfileKey,
  Portal,
} from '../UnifiedAuthContext';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
          single: vi.fn(),
          limit: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const wrapper = ({ children }: { children: ReactNode }) => (
  <UnifiedAuthProvider>{children}</UnifiedAuthProvider>
);

describe('UnifiedAuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Helper Functions', () => {
    describe('isAdminProfile', () => {
      it('should return true for administrador', () => {
        expect(isAdminProfile('administrador')).toBe(true);
      });

      it('should return true for super_administrador', () => {
        expect(isAdminProfile('super_administrador')).toBe(true);
      });

      it('should return false for other profiles', () => {
        expect(isAdminProfile('operador')).toBe(false);
        expect(isAdminProfile('gerente')).toBe(false);
        expect(isAdminProfile('visualizador')).toBe(false);
      });

      it('should return false for null', () => {
        expect(isAdminProfile(null)).toBe(false);
      });
    });

    describe('canAccessPortal', () => {
      it('should allow admin to access any portal', () => {
        const portals: Portal[] = ['neocare', 'neoteam', 'neoacademy', 'neolicense', 'avivar'];
        portals.forEach(portal => {
          expect(canAccessPortal('administrador', portal)).toBe(true);
        });
      });

      it('should allow super_administrador to access any portal', () => {
        const portals: Portal[] = ['neocare', 'neoteam', 'neoacademy', 'neolicense', 'avivar'];
        portals.forEach(portal => {
          expect(canAccessPortal('super_administrador', portal)).toBe(true);
        });
      });

      it('should return false for null profile', () => {
        expect(canAccessPortal(null, 'neoacademy')).toBe(false);
      });
    });

    describe('canAccessRoute', () => {
      it('should allow admin to access any route', () => {
        expect(canAccessRoute('administrador', '/admin-dashboard')).toBe(true);
        expect(canAccessRoute('administrador', '/academy')).toBe(true);
        expect(canAccessRoute('administrador', '/any-route')).toBe(true);
      });

      it('should return false for null profile', () => {
        expect(canAccessRoute(null, '/any-route')).toBe(false);
      });
    });

    describe('getDefaultRouteForProfile', () => {
      it('should return correct routes for each profile', () => {
        expect(getDefaultRouteForProfile('super_administrador')).toBe('/admin-dashboard');
        expect(getDefaultRouteForProfile('administrador')).toBe('/admin-dashboard');
        expect(getDefaultRouteForProfile('gerente')).toBe('/home');
        expect(getDefaultRouteForProfile('coordenador')).toBe('/home');
        expect(getDefaultRouteForProfile('supervisor')).toBe('/home');
        expect(getDefaultRouteForProfile('operador')).toBe('/home');
        expect(getDefaultRouteForProfile('visualizador')).toBe('/home');
        expect(getDefaultRouteForProfile('externo')).toBe('/home');
      });
    });
  });

  describe('Constants', () => {
    it('PROFILE_PORTAL_MAP should have all profiles', () => {
      const profiles: ProfileKey[] = ['super_administrador', 'administrador', 'gerente', 'coordenador', 'supervisor', 'operador', 'visualizador', 'externo'];
      profiles.forEach(profile => {
        expect(PROFILE_PORTAL_MAP[profile]).toBeDefined();
        expect(Array.isArray(PROFILE_PORTAL_MAP[profile])).toBe(true);
      });
    });

    it('PROFILE_ROUTES should have all profiles', () => {
      expect(Object.keys(PROFILE_ROUTES)).toHaveLength(8);
    });

    it('PROFILE_NAMES should have readable names', () => {
      expect(PROFILE_NAMES['administrador']).toBe('Administrador');
      expect(PROFILE_NAMES['operador']).toBe('Operador');
      expect(PROFILE_NAMES['super_administrador']).toBe('Super Administrador');
    });
  });

  describe('useUnifiedAuth hook', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useUnifiedAuth());
      }).toThrow('useUnifiedAuth must be used within UnifiedAuthProvider');
    });

    it('should return initial state when not authenticated', () => {
      const { result } = renderHook(() => useUnifiedAuth(), { wrapper });
      
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.activeProfile).toBeNull();
      expect(result.current.isAdmin).toBe(false);
    });

    it('should provide permission checking functions', () => {
      const { result } = renderHook(() => useUnifiedAuth(), { wrapper });

      expect(result.current.hasProfile('administrador')).toBe(false);
      expect(result.current.hasPermission('academy_ibramec:read')).toBe(false);
      expect(result.current.canAccessModule('academy_ibramec')).toBe(false);
      expect(result.current.hasModule('academy_ibramec')).toBe(false);
      expect(result.current.canAccess('neoacademy')).toBe(false);
    });
  });

  describe('Permission checks with mocked user', () => {
    it('hasProfile should return false without user', () => {
      const { result } = renderHook(() => useUnifiedAuth(), { wrapper });
      expect(result.current.hasProfile('operador')).toBe(false);
    });

    it('canAccessModule should return false without user', () => {
      const { result } = renderHook(() => useUnifiedAuth(), { wrapper });
      expect(result.current.canAccessModule('academy_ibramec', 'read')).toBe(false);
      expect(result.current.canAccessModule('academy_ibramec', 'write')).toBe(false);
      expect(result.current.canAccessModule('academy_ibramec', 'delete')).toBe(false);
    });
  });
});
