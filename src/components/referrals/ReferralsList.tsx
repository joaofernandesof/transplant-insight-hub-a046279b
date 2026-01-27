import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Gift, 
  DollarSign,
  Phone,
  RefreshCw,
  Loader2,
} from "lucide-react";

export interface ReferralLead {
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

interface ReferralsListProps {
  referrals: ReferralLead[];
  getStatusBadge: (status: string) => React.ReactNode;
  formatDate: (date: string) => string;
  formatCurrency: (value: number) => string;
  isAdmin: boolean;
  onResendEmail: (referral: ReferralLead) => void;
  resendingEmail: string | null;
}

export function ReferralsList({ 
  referrals, 
  getStatusBadge, 
  formatDate, 
  formatCurrency,
  isAdmin,
  onResendEmail,
  resendingEmail
}: ReferralsListProps) {
  return (
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{referral.name}</p>
                    {getStatusBadge(referral.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{referral.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Indicado em {formatDate(referral.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {referral.commission_value > 0 && (
                    <Badge 
                      variant={referral.commission_paid ? "default" : "outline"}
                      className={referral.commission_paid ? "bg-primary" : ""}
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      {formatCurrency(referral.commission_value)}
                      {referral.commission_paid && " (Pago)"}
                    </Badge>
                  )}
                  {isAdmin && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResendEmail(referral)}
                        disabled={resendingEmail === referral.id}
                        className="gap-1"
                      >
                        {resendingEmail === referral.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        Reenviar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a 
                          href={`https://wa.me/55${referral.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          WhatsApp
                        </a>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
