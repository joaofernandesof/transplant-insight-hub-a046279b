import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTabFromUrl } from "@/hooks/useTabFromUrl";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  GraduationCap,
  Shield,
  Mail,
  Phone,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ReferralsList, type ReferralLead } from "./ReferralsList";

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

interface AdminReferralTabsProps {
  referrals: ReferralLead[];
  allStudentReferrals: StudentReferral[];
  getStatusBadge: (status: string) => React.ReactNode;
  formatDate: (date: string) => string;
  formatCurrency: (value: number) => string;
  resendingEmail: string | null;
  setResendingEmail: (id: string | null) => void;
  resendNotificationEmail: (referral: StudentReferral) => Promise<void>;
}

export function AdminReferralTabs({
  referrals,
  allStudentReferrals,
  getStatusBadge,
  formatDate,
  formatCurrency,
  resendingEmail,
  setResendingEmail,
  resendNotificationEmail,
}: AdminReferralTabsProps) {
  const { activeTab, setActiveTab } = useTabFromUrl({
    defaultTab: "my-referrals",
    validTabs: ["my-referrals", "student-referrals"],
  });

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="my-referrals" className="gap-2">
          <Users className="h-4 w-4" />
          Minhas Indicações
        </TabsTrigger>
        <TabsTrigger value="student-referrals" className="gap-2">
          <GraduationCap className="h-4 w-4" />
          Indicações de Alunos
          {allStudentReferrals.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
              {allStudentReferrals.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="my-referrals">
        <ReferralsList 
          referrals={referrals} 
          getStatusBadge={getStatusBadge}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
          isAdmin={true}
          onResendEmail={async (referral) => {
            setResendingEmail(referral.id);
            try {
              const { data, error } = await supabase.functions.invoke('notify-referral', {
                body: {
                  name: referral.name,
                  email: referral.email,
                  phone: referral.phone,
                  type: 'referral_lead',
                }
              });
              if (error) throw error;
              if (data?.skipped) {
                toast.info(`E-mail pulado: ${data.reason}`);
              } else {
                toast.success('E-mail de notificação reenviado com sucesso!');
              }
            } catch (error) {
              console.error('Error resending notification:', error);
              toast.error('Erro ao reenviar e-mail de notificação');
            } finally {
              setResendingEmail(null);
            }
          }}
          resendingEmail={resendingEmail}
        />
      </TabsContent>

      <TabsContent value="student-referrals">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              Todas as Indicações de Alunos (Admin)
            </CardTitle>
            <CardDescription>
              Visualize e gerencie todas as indicações feitas pelos alunos da Formação 360
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allStudentReferrals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhuma indicação de aluno ainda</p>
                <p className="text-sm">As indicações aparecerão aqui quando os alunos indicarem novos interessados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allStudentReferrals.map((referral) => (
                  <div 
                    key={referral.id} 
                    className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{referral.referred_name}</p>
                        {getStatusBadge(referral.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {referral.referred_email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {referral.referred_phone}
                        </span>
                      </div>
                      {referral.referred_has_crm && referral.referred_crm && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">CRM:</span>{' '}
                          <span className="font-medium text-primary">{referral.referred_crm}</span>
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Indicado por <span className="font-medium">{referral.referrer_name}</span> em {formatDate(referral.created_at)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Código: <span className="font-mono bg-muted px-1 rounded">{referral.referral_code}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resendNotificationEmail(referral)}
                        disabled={resendingEmail === referral.id}
                        className="gap-2"
                      >
                        {resendingEmail === referral.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Reenviar E-mail
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a 
                          href={`https://wa.me/55${referral.referred_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gap-2"
                        >
                          <Phone className="h-4 w-4" />
                          WhatsApp
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
