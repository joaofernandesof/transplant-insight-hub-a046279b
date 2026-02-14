import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ModuleLayout } from '@/components/ModuleLayout';
import { AdminReferralTabs } from '@/components/referrals/AdminReferralTabs';
import { ReferralsList, type ReferralLead } from '@/components/referrals/ReferralsList';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Copy, 
  Check, 
  Users, 
  DollarSign, 
  Share2,
  Loader2,
  ChevronRight,
  Banknote,
  UserPlus,
  HandCoins,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface StudentReferral {
  id: string;
  referrer_user_id: string;
  referral_code: string;
  referred_name: string;
  referred_email: string;
  referred_phone: string;
  referred_has_crm: boolean;
  referred_crm: string | null;
  status: string;
  commission_rate: number;
  commission_paid: boolean;
  created_at: string;
  referrer_name?: string;
}

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  convertedReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  linkClicks: number;
  clicksLast7Days: number;
}

export default function ReferralProgram() {
  const { user } = useAuth();
  const { isAdmin } = useUnifiedAuth();
  const [referralCode, setReferralCode] = useState<string>('');
  const [referrals, setReferrals] = useState<ReferralLead[]>([]);
  const [allStudentReferrals, setAllStudentReferrals] = useState<StudentReferral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    pendingReferrals: 0,
    convertedReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    linkClicks: 0,
    clicksLast7Days: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showReferrals, setShowReferrals] = useState(false);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);

  const referralLink = referralCode 
    ? `${window.location.origin}/indicacao/${referralCode}` 
    : '';

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, isAdmin]);

  const fetchData = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', user?.id)
        .single();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      }

      const { data: referralData } = await supabase
        .from('referral_leads')
        .select('*')
        .eq('referrer_user_id', user?.id)
        .order('created_at', { ascending: false });

      if (referralData) {
        setReferrals(referralData);
        
        const converted = referralData.filter(r => r.status === 'converted');
        const pending = referralData.filter(r => r.status === 'pending');
        const paidCommissions = referralData.filter(r => r.commission_paid);
        const unpaidCommissions = converted.filter(r => !r.commission_paid);

        let clickStats = { total: 0, last7Days: 0 };
        if (profile?.referral_code) {
          const { data: clicks } = await supabase
            .from('referral_link_clicks')
            .select('clicked_at')
            .eq('referrer_user_id', user?.id);
          
          if (clicks) {
            clickStats.total = clicks.length;
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            clickStats.last7Days = clicks.filter(
              c => new Date(c.clicked_at) >= sevenDaysAgo
            ).length;
          }
        }

        setStats({
          totalReferrals: referralData.length,
          pendingReferrals: pending.length,
          convertedReferrals: converted.length,
          totalEarnings: referralData.reduce((acc, r) => acc + (r.commission_value || 0), 0),
          pendingEarnings: unpaidCommissions.reduce((acc, r) => acc + (r.commission_value || 0), 0),
          paidEarnings: paidCommissions.reduce((acc, r) => acc + (r.commission_value || 0), 0),
          linkClicks: clickStats.total,
          clicksLast7Days: clickStats.last7Days
        });
      }

      if (isAdmin) {
        const { data: studentReferrals, error: studentError } = await supabase
          .from('student_referrals')
          .select('*')
          .order('created_at', { ascending: false });

        if (studentError) {
          console.error('Error fetching student referrals:', studentError);
        } else if (studentReferrals) {
          const referrerIds = [...new Set(studentReferrals.map(r => r.referrer_user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, name')
            .in('user_id', referrerIds);

          const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

          const enrichedReferrals = studentReferrals.map(r => ({
            ...r,
            referrer_name: profileMap.get(r.referrer_user_id) || 'Desconhecido'
          }));

          setAllStudentReferrals(enrichedReferrals);
        }
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast.error('Erro ao carregar dados de indicações');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Neo Folic - Indicação',
          text: 'Conheça os cursos e transforme sua carreira!',
          url: referralLink
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const resendNotificationEmail = async (referral: StudentReferral) => {
    setResendingEmail(referral.id);
    try {
      const { data, error } = await supabase.functions.invoke('notify-referral', {
        body: {
          name: referral.referred_name,
          email: referral.referred_email,
          phone: referral.referred_phone,
          referrer_name: referral.referrer_name || 'Desconhecido',
          referral_code: referral.referral_code,
          type: 'student_referral',
          has_crm: referral.referred_has_crm,
          crm: referral.referred_crm,
        }
      });

      if (error) throw error;
      
      if (data?.skipped) {
        toast.info(`E-mail pulado: ${data.reason}`);
      } else {
        toast.success('E-mail de notificação reenviado!');
      }
    } catch (error) {
      console.error('Error resending notification:', error);
      toast.error('Erro ao reenviar e-mail');
    } finally {
      setResendingEmail(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'converted':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Convertido</Badge>;
      case 'contacted':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Contatado</Badge>;
      case 'enrolled':
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">Matriculado</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Cancelado</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pendente</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <ModuleLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ModuleLayout>
    );
  }

  // Admin view
  if (isAdmin) {
    return (
      <ModuleLayout>
        <div className="p-4 pt-16 lg:pt-4 lg:p-6 overflow-x-hidden w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              Indique e Ganhe - Admin
            </h1>
          </div>
          <AdminReferralTabs
            referrals={referrals}
            allStudentReferrals={allStudentReferrals}
            getStatusBadge={getStatusBadge}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            resendingEmail={resendingEmail}
            setResendingEmail={setResendingEmail}
            resendNotificationEmail={resendNotificationEmail}
          />
        </div>
      </ModuleLayout>
    );
  }

  // User view - Méliuz-inspired
  return (
    <ModuleLayout>
      <div className="p-4 pt-16 lg:pt-4 lg:p-6 overflow-x-hidden w-full max-w-2xl mx-auto">
        
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
            Ganhe 5% no PIX por cada indicação
          </h1>
          <p className="text-muted-foreground mt-2 text-sm lg:text-base">
            Indique amigos para nossos cursos e receba dinheiro no PIX quando a venda for concluída
          </p>
        </div>

        {/* Earning Examples */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
              <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">
                Indique um transplante de R$ 20.000
              </p>
              <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                Ganhe R$ 1.000 no PIX
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
              <HandCoins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">
                Indique um curso de R$ 40.000
              </p>
              <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                Ganhe R$ 2.000 no PIX
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Minhas indicações</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{stats.totalReferrals}</p>
                <p className="text-xs text-muted-foreground">Total de cadastros</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.pendingEarnings)}</p>
                <p className="text-xs text-muted-foreground">Saldo pendente</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* View Referrals Button */}
        {stats.totalReferrals > 0 && (
          <Button 
            variant="outline" 
            className="w-full mb-8 h-12 text-sm font-medium"
            onClick={() => setShowReferrals(!showReferrals)}
          >
            {showReferrals ? 'Ocultar indicações' : 'Ver minhas indicações'}
            <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${showReferrals ? 'rotate-90' : ''}`} />
          </Button>
        )}

        {/* Referrals List (collapsible) */}
        {showReferrals && (
          <div className="mb-8">
            <ReferralsList 
              referrals={referrals} 
              getStatusBadge={getStatusBadge}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
              isAdmin={false}
              onResendEmail={() => {}}
              resendingEmail={null}
            />
          </div>
        )}

        {/* How it works */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-3">Como funciona</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Share2 className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground pt-1.5">
                Compartilhe seu link com as pessoas que você conhece
              </p>
            </div>
            
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground pt-1.5">
                Os indicados se cadastram pelo seu link e recebem atendimento da equipe
              </p>
            </div>
            
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground pt-1.5">
                Quando a venda for concluída, você recebe <strong className="text-foreground">5% do valor via PIX</strong>
              </p>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300 pt-1.5">
                Sem limite de indicações! Quanto mais indicar, mais você ganha
              </p>
            </div>
          </div>
        </div>

        {/* Referral Link + Share CTA */}
        <div className="space-y-3 pb-6">
          {referralLink && (
            <div className="p-3 rounded-xl bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-1.5">Seu link exclusivo</p>
              <div className="flex items-center gap-2">
                <p className="text-xs font-mono text-foreground flex-1 break-all leading-relaxed">
                  {referralLink}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={copyToClipboard}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          <Button 
            onClick={shareLink} 
            className="w-full h-12 text-base font-semibold bg-foreground text-background hover:bg-foreground/90"
          >
            Indicar amigos
          </Button>
        </div>
      </div>
    </ModuleLayout>
  );
}
