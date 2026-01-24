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
  referrer_name?: string;
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

  // Query to get user's referral code from neohub_users
  // CRITICAL: Use authUserId (auth.users UUID) instead of id (neohub_users UUID)
  const authUserId = user?.authUserId || user?.userId;
  
  console.log('[useStudentReferrals] user:', { 
    id: user?.id, 
    authUserId: user?.authUserId, 
    userId: user?.userId,
    resolvedAuthUserId: authUserId 
  });
  
  const { data: userReferralData } = useQuery({
    queryKey: ['user-referral-code', authUserId],
    queryFn: async () => {
      if (!authUserId) {
        console.log('[useStudentReferrals] No authUserId, returning null');
        return null;
      }
      
      console.log('[useStudentReferrals] Fetching referral code for authUserId:', authUserId);
      
      // Try neohub_users first using auth user_id
      const { data: neohubUser, error: neohubError } = await supabase
        .from('neohub_users')
        .select('referral_code, full_name')
        .eq('user_id', authUserId)
        .maybeSingle();
      
      console.log('[useStudentReferrals] neohub_users result:', { neohubUser, neohubError });
      
      if (neohubUser?.referral_code) {
        return { code: neohubUser.referral_code, name: neohubUser.full_name };
      }
      
      // Fallback to profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('referral_code, name')
        .eq('user_id', authUserId)
        .maybeSingle();
      
      if (profile?.referral_code) {
        return { code: profile.referral_code, name: profile.name };
      }
      
      return null;
    },
    enabled: !!authUserId,
  });

  // Fetch user's referrals
  // Use authUserId to match referrer_user_id (which stores auth.users UUID)
  const { data: referrals, isLoading } = useQuery({
    queryKey: ['student-referrals', authUserId],
    queryFn: async () => {
      if (!authUserId) return [];
      
      const { data, error } = await supabase
        .from('student_referrals')
        .select('*')
        .eq('referrer_user_id', authUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StudentReferral[];
    },
    enabled: !!authUserId,
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
    userReferralCode: userReferralData?.code || null,
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
      const upperCode = data.referralCode.toUpperCase();
      
      // First try to find referrer in neohub_users by exact code match
      let referrerUserId: string | null = null;
      let referrerName: string = 'Desconhecido';
      
      const { data: neohubUser } = await supabase
        .from('neohub_users')
        .select('user_id, full_name')
        .eq('referral_code', upperCode)
        .maybeSingle();
      
      if (neohubUser) {
        referrerUserId = neohubUser.user_id;
        referrerName = neohubUser.full_name;
      } else {
        // Fallback to profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, name')
          .eq('referral_code', upperCode)
          .maybeSingle();
        
        if (profile) {
          referrerUserId = profile.user_id;
          referrerName = profile.name || 'Desconhecido';
        }
      }
      
      // If no referrer found, throw error
      if (!referrerUserId) {
        throw new Error('Código de indicação inválido');
      }
      
      // Determine commission rate based on promotion
      const now = new Date();
      const isPromoActive = now < new Date('2026-01-26T02:59:00.000Z');
      const commissionRate = isPromoActive ? 10 : 5;

      // Insert the referral
      // IMPORTANT: Don't use .select().single() - anonymous users can INSERT but cannot SELECT
      const { error } = await supabase
        .from('student_referrals')
        .insert({
          referrer_user_id: referrerUserId,
          referral_code: upperCode,
          referred_name: data.name,
          referred_email: data.email,
          referred_phone: data.phone,
          referred_has_crm: data.hasCrm,
          referred_crm: data.crm || null,
          commission_rate: commissionRate,
          status: 'pending',
        });

      if (error) throw error;

      // Notify admin about new referral (fire and forget)
      try {
        await supabase.functions.invoke('notify-referral', {
          body: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            referrer_name: referrerName,
            referral_code: upperCode,
            type: 'student_referral',
            has_crm: data.hasCrm,
            crm: data.crm,
          }
        });
      } catch (notifyError) {
        console.error('Error notifying admin:', notifyError);
        // Don't throw - notification is not critical
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success('Indicação enviada com sucesso! Entraremos em contato em breve.');
    },
    onError: (error: any) => {
      console.error('Error submitting referral:', error);
      if (error.message === 'Código de indicação inválido') {
        toast.error('Código de indicação inválido. Verifique o link.');
      } else {
        toast.error('Erro ao enviar indicação. Tente novamente.');
      }
    },
  });

  return submitReferral;
}

// Hook to validate referral code (for landing page)
export function useValidateReferralCode(code: string | undefined) {
  return useQuery({
    queryKey: ['validate-referral-code', code],
    queryFn: async () => {
      if (!code) return null;
      
      const upperCode = code.toUpperCase();
      
      // Try neohub_users first
      const { data: neohubUser } = await supabase
        .from('neohub_users')
        .select('user_id, full_name, referral_code')
        .eq('referral_code', upperCode)
        .maybeSingle();
      
      if (neohubUser) {
        return {
          isValid: true,
          referrerUserId: neohubUser.user_id,
          referrerName: neohubUser.full_name,
          referralCode: neohubUser.referral_code,
        };
      }
      
      // Fallback to profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, name, referral_code')
        .eq('referral_code', upperCode)
        .maybeSingle();
      
      if (profile) {
        return {
          isValid: true,
          referrerUserId: profile.user_id,
          referrerName: profile.name || 'Desconhecido',
          referralCode: profile.referral_code,
        };
      }
      
      return { isValid: false, referrerUserId: null, referrerName: null, referralCode: null };
    },
    enabled: !!code,
  });
}
