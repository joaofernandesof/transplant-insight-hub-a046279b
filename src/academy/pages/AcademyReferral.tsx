import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Gift, 
  Copy, 
  Check, 
  Clock, 
  Users, 
  TrendingUp, 
  Sparkles,
  Share2,
  ExternalLink,
  Zap,
  DollarSign,
  UserPlus,
  Timer,
  ArrowRight,
  Send,
  Wallet
} from 'lucide-react';
import { useStudentReferrals } from '../hooks/useStudentReferrals';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AcademyReferral() {
  const {
    referrals,
    isLoading,
    stats,
    isPromoActive,
    currentCommissionRate,
    promoTimeRemaining,
    userReferralCode,
    promoDeadline,
    normalCommission,
    promoCommission,
  } = useStudentReferrals();

  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(promoTimeRemaining);

  // Update countdown every second
  useEffect(() => {
    if (!isPromoActive) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const diff = promoDeadline.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ hours, minutes, seconds, totalMs: diff });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPromoActive, promoDeadline]);

  const referralLink = `${window.location.origin}/indicacao-formacao360/${userReferralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const message = `🎓 Venha fazer parte da Formação 360 em Transplante Capilar do IBRAMEC!\n\nUse meu código de indicação: ${userReferralCode}\n\n${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Aguardando contato</Badge>;
      case 'contacted':
        return <Badge className="bg-blue-500">Em negociação</Badge>;
      case 'enrolled':
        return <Badge className="bg-amber-500">Matriculado</Badge>;
      case 'converted':
        return <Badge className="bg-green-500">Convertido</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Gift className="h-7 w-7 text-emerald-500" />
          Programa de Indicação
        </h1>
        <p className="text-muted-foreground mt-1">
          Indique médicos e ganhe comissão por cada matrícula realizada
        </p>
      </div>

      {/* Promo Banner - Always first when active */}
      {isPromoActive && countdown && (
        <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <CardContent className="p-6 relative">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Zap className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    PROMOÇÃO ESPECIAL
                  </h2>
                  <p className="text-white/90">
                    Comissão em <span className="font-bold text-2xl">{promoCommission}%</span> no PIX!
                    <span className="text-white/70 ml-2 line-through">({normalCommission}% normal)</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/20 rounded-xl px-4 py-3">
                <Timer className="h-5 w-5" />
                <div className="text-center">
                  <p className="text-xs text-white/80 uppercase tracking-wide">Acaba em</p>
                  <p className="text-2xl font-mono font-bold">
                    {String(countdown.hours).padStart(2, '0')}:
                    {String(countdown.minutes).padStart(2, '0')}:
                    {String(countdown.seconds).padStart(2, '0')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expired Promo - Minimized notice */}
      {!isPromoActive && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-muted-foreground text-sm">
          <Clock className="h-4 w-4" />
          <span>Promoção encerrada. Comissão atual: <strong className="text-foreground">{normalCommission}%</strong> por matrícula.</span>
        </div>
      )}

      {/* How It Works - Flipchart Style */}
      <Card className="bg-gradient-to-br from-background to-muted/30 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
            {/* Step 1 */}
            <div className="flex-1 flex flex-col items-center text-center p-4 relative">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-2">
                <Send className="h-5 w-5 text-emerald-500" />
              </div>
              <h4 className="font-semibold text-sm">Compartilhe seu link</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Envie seu link exclusivo para médicos interessados na Formação 360
              </p>
            </div>

            {/* Arrow 1 */}
            <div className="hidden md:flex items-center text-emerald-400">
              <ArrowRight className="h-6 w-6" />
            </div>
            <div className="md:hidden flex items-center text-emerald-400 rotate-90">
              <ArrowRight className="h-5 w-5" />
            </div>

            {/* Step 2 */}
            <div className="flex-1 flex flex-col items-center text-center p-4 relative">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-2">
                <UserPlus className="h-5 w-5 text-emerald-500" />
              </div>
              <h4 className="font-semibold text-sm">Médico se cadastra</h4>
              <p className="text-xs text-muted-foreground mt-1">
                O indicado preenche os dados e nossa equipe entra em contato
              </p>
            </div>

            {/* Arrow 2 */}
            <div className="hidden md:flex items-center text-emerald-400">
              <ArrowRight className="h-6 w-6" />
            </div>
            <div className="md:hidden flex items-center text-emerald-400 rotate-90">
              <ArrowRight className="h-5 w-5" />
            </div>

            {/* Step 3 */}
            <div className="flex-1 flex flex-col items-center text-center p-4 relative">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-2">
                <Wallet className="h-5 w-5 text-emerald-500" />
              </div>
              <h4 className="font-semibold text-sm">Receba sua comissão</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Após a matrícula, você recebe {currentCommissionRate}% via PIX
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Link Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-emerald-500" />
            Seu Link Exclusivo
          </CardTitle>
          <CardDescription>
            Compartilhe este link com médicos interessados na Formação 360
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Input 
                value={referralLink} 
                readOnly 
                className="pr-20 font-mono text-sm"
              />
              <Badge 
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500"
              >
                {userReferralCode}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyLink} variant="outline" className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
              <Button onClick={shareWhatsApp} className="gap-2 bg-green-600 hover:bg-green-700">
                <Share2 className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Quando um médico se cadastrar usando seu link e fechar matrícula, você ganha{' '}
            <span className="font-bold text-emerald-600">{currentCommissionRate}%</span> de comissão no PIX!
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
              <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Indicações</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Aguardando</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold">{stats.converted}</p>
            <p className="text-xs text-muted-foreground">Convertidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-bold">{stats.totalCommission}%</p>
            <p className="text-xs text-muted-foreground">Comissão Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            Suas Indicações
          </CardTitle>
          <CardDescription>
            Acompanhe o status de cada médico indicado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : referrals && referrals.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Telefone</TableHead>
                    <TableHead>CRM</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Data</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-medium">{referral.referred_name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{referral.referred_email}</TableCell>
                      <TableCell className="hidden md:table-cell">{referral.referred_phone}</TableCell>
                      <TableCell>
                        {referral.referred_has_crm ? (
                          <Badge variant="outline" className="text-green-600">
                            {referral.referred_crm || 'Sim'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Não possui</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(referral.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {format(new Date(referral.created_at), "dd/MM/yy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {referral.status === 'converted' ? (
                          <span className="text-green-600">{referral.commission_rate}%</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg mb-1">Nenhuma indicação ainda</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Compartilhe seu link exclusivo com médicos interessados e comece a ganhar comissões!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
