import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { toast } from "sonner";

export interface StudentReferral {
  id: string;
  referrer_user_id: string;
  referral_code: string;
  referred_name: string;
  referred_email: string;
  referred_phone: string;
  referred_has_crm: boolean;
  referred_crm: string | null;
  status: 'pending' | 'contacted' | 'enrolled' | 'converted' | 'cancelled';
  commission_rate: number;
  commission_paid: boolean;
  notes: string | null;
  created_at: string;
  converted_at: string | null;
  updated_at: string;
}

// Promotion deadline: 25/01/2026 at 23:59 BRT (UTC-3)
const PROMO_DEADLINE = new Date('2026-01-26T02:59:00.000Z');
const NORMAL_COMMISSION = 5;
const PROMO_COMMISSION = 10;

export function useStudentReferrals() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  // Check if promotion is active
  const isPromoActive = () => {
    return new Date() < PROMO_DEADLINE;
  };

  // Get current commission rate
  const getCurrentCommissionRate = () => {
    return isPromoActive() ? PROMO_COMMISSION : NORMAL_COMMISSION;
  };

  // Time remaining for promotion
  const getPromoTimeRemaining = () => {
    const now = new Date();
    const diff = PROMO_DEADLINE.getTime() - now.getTime();
    
    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, totalMs: diff };
  };

  // Generate referral code from user data
  const generateReferralCode = (userId: string, userName?: string) => {
    const namePart = userName?.split(' ')[0]?.toUpperCase().substring(0, 4) || 'REF';
    const idPart = userId.substring(0, 4).toUpperCase();
    return `${namePart}${idPart}`;
  };

  // Get user's referral code
  const getUserReferralCode = () => {
    if (!user) return null;
    return generateReferralCode(user.id, user.fullName);
  };

  // Fetch user's referrals
  const { data: referrals, isLoading } = useQuery({
    queryKey: ['student-referrals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('student_referrals')
        .select('*')
        .eq('referrer_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StudentReferral[];
    },
    enabled: !!user,
  });

  // Stats
  const stats = {
    total: referrals?.length || 0,
    pending: referrals?.filter(r => r.status === 'pending').length || 0,
    contacted: referrals?.filter(r => r.status === 'contacted').length || 0,
    converted: referrals?.filter(r => r.status === 'converted').length || 0,
    totalCommission: referrals
      ?.filter(r => r.status === 'converted')
      .reduce((sum, r) => sum + (r.commission_rate || 0), 0) || 0,
  };

  return {
    referrals,
    isLoading,
    stats,
    isPromoActive: isPromoActive(),
    currentCommissionRate: getCurrentCommissionRate(),
    promoTimeRemaining: getPromoTimeRemaining(),
    userReferralCode: getUserReferralCode(),
    promoDeadline: PROMO_DEADLINE,
    normalCommission: NORMAL_COMMISSION,
    promoCommission: PROMO_COMMISSION,
  };
}

// Hook for landing page (public)
export function useSubmitReferral() {
  const submitReferral = useMutation({
    mutationFn: async (data: {
      referralCode: string;
      name: string;
      email: string;
      phone: string;
      hasCrm: boolean;
      crm?: string;
    }) => {
      // Find the referrer by code
      const { data: existingReferrals, error: findError } = await supabase
        .from('student_referrals')
        .select('referrer_user_id')
        .eq('referral_code', data.referralCode)
        .limit(1);

      // Get referrer user id from profile
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, referral_code')
        .ilike('referral_code', `%${data.referralCode.substring(0, 4)}%`)
        .limit(1);
      
      // Determine commission rate based on promotion
      const now = new Date();
      const isPromoActive = now < new Date('2026-01-26T02:59:00.000Z');
      const commissionRate = isPromoActive ? 10 : 5;

      // For now, we'll store the referral with the code
      // The referrer_user_id will need to be matched later
      const { data: result, error } = await supabase
        .from('student_referrals')
        .insert({
          referrer_user_id: profiles?.[0]?.user_id || '00000000-0000-0000-0000-000000000000',
          referral_code: data.referralCode.toUpperCase(),
          referred_name: data.name,
          referred_email: data.email,
          referred_phone: data.phone,
          referred_has_crm: data.hasCrm,
          referred_crm: data.crm || null,
          commission_rate: commissionRate,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Indicação enviada com sucesso! Entraremos em contato em breve.');
    },
    onError: (error) => {
      console.error('Error submitting referral:', error);
      toast.error('Erro ao enviar indicação. Tente novamente.');
    },
  });

  return submitReferral;
}
