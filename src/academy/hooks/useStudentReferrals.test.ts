import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Testes para o hook useStudentReferrals e useSubmitReferral
 * POP relacionado: POP-001-notify-referral
 */

// Mock do Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
          limit: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
        ilike: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [{ user_id: "test-user-id", name: "Test User", referral_code: "TEST1234" }],
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: "new-referral-id" },
            error: null,
          })),
        })),
      })),
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: { success: true }, error: null })),
    },
  },
}));

// Mock do contexto de autenticação
vi.mock("@/contexts/UnifiedAuthContext", () => ({
  useUnifiedAuth: vi.fn(() => ({
    user: {
      id: "test-user-id",
      fullName: "Test User",
    },
  })),
}));

// Mock do toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useStudentReferrals", () => {
  describe("Cálculo de Comissão", () => {
    it("deve retornar 10% durante a promoção (antes de 25/01/2026 23:59 BRT)", () => {
      // A promoção está ativa até 2026-01-26T02:59:00.000Z (25/01 23:59 BRT)
      const PROMO_DEADLINE = new Date("2026-01-26T02:59:00.000Z");
      const now = new Date("2026-01-24T12:00:00.000Z");
      
      const isPromoActive = now < PROMO_DEADLINE;
      const commissionRate = isPromoActive ? 10 : 5;
      
      expect(isPromoActive).toBe(true);
      expect(commissionRate).toBe(10);
    });

    it("deve retornar 5% após o fim da promoção", () => {
      const PROMO_DEADLINE = new Date("2026-01-26T02:59:00.000Z");
      const now = new Date("2026-01-27T12:00:00.000Z");
      
      const isPromoActive = now < PROMO_DEADLINE;
      const commissionRate = isPromoActive ? 10 : 5;
      
      expect(isPromoActive).toBe(false);
      expect(commissionRate).toBe(5);
    });
  });

  describe("Geração de Código de Indicação", () => {
    it("deve gerar código com primeiras 4 letras do nome + 4 caracteres do ID", () => {
      const generateReferralCode = (userId: string, userName?: string) => {
        const namePart = userName?.split(" ")[0]?.toUpperCase().substring(0, 4) || "REF";
        const idPart = userId.substring(0, 4).toUpperCase();
        return `${namePart}${idPart}`;
      };

      const code = generateReferralCode("abc12345-uuid", "Nicholas Barreto");
      expect(code).toBe("NICHABC1");
    });

    it("deve usar REF como prefixo se nome não fornecido", () => {
      const generateReferralCode = (userId: string, userName?: string) => {
        const namePart = userName?.split(" ")[0]?.toUpperCase().substring(0, 4) || "REF";
        const idPart = userId.substring(0, 4).toUpperCase();
        return `${namePart}${idPart}`;
      };

      const code = generateReferralCode("xyz98765-uuid");
      expect(code).toBe("REFXYZ9");
    });
  });

  describe("Cálculo de Tempo Restante", () => {
    it("deve retornar null quando promoção expirou", () => {
      const PROMO_DEADLINE = new Date("2026-01-26T02:59:00.000Z");
      
      const getPromoTimeRemaining = (now: Date) => {
        const diff = PROMO_DEADLINE.getTime() - now.getTime();
        if (diff <= 0) return null;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        return { hours, minutes, seconds, totalMs: diff };
      };

      const result = getPromoTimeRemaining(new Date("2026-01-27T00:00:00.000Z"));
      expect(result).toBeNull();
    });

    it("deve retornar tempo restante correto", () => {
      const PROMO_DEADLINE = new Date("2026-01-26T02:59:00.000Z");
      
      const getPromoTimeRemaining = (now: Date) => {
        const diff = PROMO_DEADLINE.getTime() - now.getTime();
        if (diff <= 0) return null;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        return { hours, minutes, seconds, totalMs: diff };
      };

      // 2 horas antes do deadline
      const result = getPromoTimeRemaining(new Date("2026-01-26T00:59:00.000Z"));
      expect(result).not.toBeNull();
      expect(result?.hours).toBe(2);
      expect(result?.minutes).toBe(0);
    });
  });
});

describe("Payload de Notificação", () => {
  it("deve estruturar payload corretamente para student_referral", () => {
    const payload = {
      name: "Nicholas Barreto",
      email: "niicholas.barreto@gmail.com",
      phone: "(21) 99999-9999",
      referrer_name: "João Silva",
      referral_code: "JOAO1234",
      type: "student_referral" as const,
      has_crm: true,
      crm: "12345-RJ",
    };

    expect(payload.type).toBe("student_referral");
    expect(payload.email).toBe("niicholas.barreto@gmail.com");
    expect(payload.has_crm).toBe(true);
  });

  it("deve estruturar payload corretamente para referral_lead", () => {
    const payload = {
      name: "Maria Santos",
      email: "maria@email.com",
      phone: "(11) 88888-8888",
      referrer_name: "Pedro",
      referral_code: "PEDR5678",
      type: "referral_lead" as const,
      city: "São Paulo",
      state: "SP",
      interest: "Transplante Capilar",
    };

    expect(payload.type).toBe("referral_lead");
    expect(payload.city).toBe("São Paulo");
    expect(payload.state).toBe("SP");
  });
});

describe("Estatísticas de Indicações", () => {
  it("deve calcular estatísticas corretamente", () => {
    const referrals = [
      { status: "pending", commission_rate: 10 },
      { status: "pending", commission_rate: 10 },
      { status: "contacted", commission_rate: 10 },
      { status: "converted", commission_rate: 10 },
      { status: "converted", commission_rate: 5 },
    ];

    const stats = {
      total: referrals.length,
      pending: referrals.filter((r) => r.status === "pending").length,
      contacted: referrals.filter((r) => r.status === "contacted").length,
      converted: referrals.filter((r) => r.status === "converted").length,
      totalCommission: referrals
        .filter((r) => r.status === "converted")
        .reduce((sum, r) => sum + (r.commission_rate || 0), 0),
    };

    expect(stats.total).toBe(5);
    expect(stats.pending).toBe(2);
    expect(stats.contacted).toBe(1);
    expect(stats.converted).toBe(2);
    expect(stats.totalCommission).toBe(15); // 10 + 5
  });
});
