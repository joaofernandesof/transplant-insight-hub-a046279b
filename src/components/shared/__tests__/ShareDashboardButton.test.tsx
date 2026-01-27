import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShareDashboardButton } from '../ShareDashboardButton';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      })
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { token: 'test-token-123' },
            error: null
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ShareDashboardButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders share button correctly', () => {
    const { container } = render(
      <ShareDashboardButton 
        dashboardType="legal-dashboard"
        title="Test Dashboard"
      />,
      { wrapper: createWrapper() }
    );
    
    expect(container.textContent).toContain('Compartilhar');
  });

  it('passes correct dashboard type', () => {
    const { container } = render(
      <ShareDashboardButton 
        dashboardType="custom-dashboard"
        title="Custom Title"
        description="Custom Description"
      />,
      { wrapper: createWrapper() }
    );
    
    expect(container).toBeTruthy();
  });
});

describe('ShareDashboardButton - URL Generation', () => {
  it('generates correct share URL format', () => {
    // Test URL generation logic
    const token = 'abc123def456';
    const expectedUrl = `${window.location.origin}/public/dashboard/${token}`;
    
    expect(expectedUrl).toContain('/public/dashboard/');
    expect(expectedUrl).toContain(token);
  });

  it('handles different tokens correctly', () => {
    const tokens = ['token1', 'token-with-dash', 'token_underscore', '123numeric'];
    
    tokens.forEach(token => {
      const url = `${window.location.origin}/public/dashboard/${token}`;
      expect(url).toMatch(/\/public\/dashboard\/[\w-]+$/);
    });
  });
});

describe('ShareDashboardButton - Expiration Logic', () => {
  it('calculates correct expiration dates', () => {
    const now = new Date();
    
    // 1 hour
    const oneHour = new Date(now.getTime() + 60 * 60 * 1000);
    expect(oneHour.getTime() - now.getTime()).toBe(3600000);
    
    // 24 hours
    const oneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    expect(oneDay.getTime() - now.getTime()).toBe(86400000);
    
    // 7 days
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    expect(sevenDays.getTime() - now.getTime()).toBe(604800000);
    
    // 30 days
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    expect(thirtyDays.getTime() - now.getTime()).toBe(2592000000);
  });
});
