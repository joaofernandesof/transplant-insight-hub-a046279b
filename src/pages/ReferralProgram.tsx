import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ModuleLayout } from '@/components/ModuleLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Copy, 
  Check, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle2,
  Share2,
  TrendingUp,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface ReferralLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  converted_value: number;
  commission_value: number;
  commission_paid: boolean;
  created_at: string;
}

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  convertedReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
}

export default function ReferralProgram() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>('');
  const [referrals, setReferrals] = useState<ReferralLead[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    pendingReferrals: 0,
    convertedReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralLink = referralCode 
    ? `${window.location.origin}/indicacao/${referralCode}` 
    : '';

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch referral code from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', user?.id)
        .single();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      }

      // Fetch referrals
      const { data: referralData } = await supabase
        .from('referral_leads')
        .select('*')
        .eq('referrer_user_id', user?.id)
        .order('created_at', { ascending: false });

      if (referralData) {
        setReferrals(referralData);
        
        // Calculate stats
        const converted = referralData.filter(r => r.status === 'converted');
        const pending = referralData.filter(r => r.status === 'pending');
        const paidCommissions = referralData.filter(r => r.commission_paid);
        const unpaidCommissions = converted.filter(r => !r.commission_paid);

        setStats({
          totalReferrals: referralData.length,
          pendingReferrals: pending.length,
          convertedReferrals: converted.length,
          totalEarnings: referralData.reduce((acc, r) => acc + (r.commission_value || 0), 0),
          pendingEarnings: unpaidCommissions.reduce((acc, r) => acc + (r.commission_value || 0), 0),
          paidEarnings: paidCommissions.reduce((acc, r) => acc + (r.commission_value || 0), 0)
        });
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
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cursos IBRAMEC',
          text: 'Conheça os cursos do IBRAMEC e transforme sua carreira!',
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'converted':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Convertido</Badge>;
      case 'contacted':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Contatado</Badge>;
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

  return (
    <ModuleLayout>
      <div className="p-4 pt-16 lg:pt-4 lg:p-6 overflow-x-hidden w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            Indique e Ganhe
          </h1>
          <p className="text-sm text-muted-foreground">
            Ganhe 5% de comissão sobre o valor pago por cada indicação convertida
          </p>
        </div>

        {/* Referral Link Card */}
        <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Seu Link de Indicação
            </CardTitle>
            <CardDescription>
              Compartilhe este link com seus amigos e ganhe comissões
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 p-3 bg-background rounded-lg border text-sm font-mono break-all">
                {referralLink || 'Gerando link...'}
              </div>
              <div className="flex gap-2">
                <Button onClick={copyToClipboard} variant="outline" className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </Button>
                <Button onClick={shareLink} className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </Button>
              </div>
            </div>

            <div className="p-4 bg-background/50 rounded-lg border border-dashed">
              <h4 className="font-semibold mb-2">Como funciona:</h4>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
                  Compartilhe seu link exclusivo com amigos interessados em cursos de transplante capilar
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</span>
                  Seu amigo se cadastra através do link e vira um lead
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">3</span>
                  Quando ele comprar um curso, você recebe <strong>5% do valor pago</strong>
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                  <p className="text-xs text-muted-foreground">Total de Indicações</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.convertedReferrals}</p>
                  <p className="text-xs text-muted-foreground">Convertidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.pendingEarnings)}</p>
                  <p className="text-xs text-muted-foreground">A Receber</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.paidEarnings)}</p>
                  <p className="text-xs text-muted-foreground">Já Recebido</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referrals List */}
        <Card>
          <CardHeader>
            <CardTitle>Suas Indicações</CardTitle>
            <CardDescription>Acompanhe o status de cada indicação</CardDescription>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhuma indicação ainda</p>
                <p className="text-sm">Compartilhe seu link e comece a ganhar!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {referrals.map((referral) => (
                  <div 
                    key={referral.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors gap-3"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{referral.name}</p>
                      <p className="text-sm text-muted-foreground">{referral.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Indicado em {formatDate(referral.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {getStatusBadge(referral.status)}
                      {referral.commission_value > 0 && (
                        <Badge 
                          variant={referral.commission_paid ? "default" : "outline"}
                          className={referral.commission_paid ? "bg-green-600" : ""}
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          {formatCurrency(referral.commission_value)}
                          {referral.commission_paid && " (Pago)"}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
