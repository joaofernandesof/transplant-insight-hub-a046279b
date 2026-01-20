import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  CheckCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Clock,
  FileCheck,
  Calendar,
} from "lucide-react";

interface SurgeryStats {
  totalSurgeries: number;
  confirmedSurgeries: number;
  pendingExams: number;
  totalValue: number;
  depositsPaid: number;
  remainingPaid: number;
  totalBalanceDue: number;
  upgradeTotal: number;
  upsellTotal: number;
}

interface SurgeryDashboardCardsProps {
  stats: SurgeryStats;
  surgeriesWithContractSigned?: number;
  surgeriesThisMonth?: number;
}

export function SurgeryDashboardCards({ 
  stats, 
  surgeriesWithContractSigned = 0,
  surgeriesThisMonth = 0,
}: SurgeryDashboardCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const confirmationRate = stats.totalSurgeries > 0 
    ? Math.round((stats.confirmedSurgeries / stats.totalSurgeries) * 100) 
    : 0;

  const contractRate = stats.totalSurgeries > 0
    ? Math.round((surgeriesWithContractSigned / stats.totalSurgeries) * 100)
    : 0;

  const paymentProgress = stats.totalValue > 0
    ? Math.round(((stats.depositsPaid + stats.remainingPaid) / stats.totalValue) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[hsl(var(--primary))] bg-gradient-to-br from-primary/5 to-transparent hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Agendadas</p>
                <p className="text-2xl font-bold mt-1">{stats.totalSurgeries}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {surgeriesThisMonth} este mês
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[hsl(142,71%,45%)] bg-gradient-to-br from-green-500/5 to-transparent hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Confirmadas</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{stats.confirmedSurgeries}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={confirmationRate} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">{confirmationRate}% taxa de confirmação</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-500/5 to-transparent hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Exames Pendentes</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">{stats.pendingExams}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-amber-600 mt-2 font-medium">
              {stats.pendingExams > 0 ? "⚠️ Ação necessária" : "✓ Tudo em dia"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-500/5 to-transparent hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Termos Assinados</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">{surgeriesWithContractSigned}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={contractRate} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">{contractRate}% assinados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground font-medium">VGV Total</span>
            </div>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.totalValue)}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-muted-foreground font-medium">Upgrades</span>
            </div>
            <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.upgradeTotal)}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground font-medium">Upsells</span>
            </div>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(stats.upsellTotal)}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground font-medium">Recebido</span>
            </div>
            <p className="text-lg font-bold text-green-600">{formatCurrency(stats.depositsPaid + stats.remainingPaid)}</p>
            <div className="mt-1">
              <Progress value={paymentProgress} className="h-1" />
            </div>
          </CardContent>
        </Card>

        <Card className={`hover:shadow-md transition-shadow ${stats.totalBalanceDue > 0 ? 'border-l-4 border-l-red-500' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-red-600" />
              <span className="text-xs text-muted-foreground font-medium">Saldo Devedor</span>
            </div>
            <p className={`text-lg font-bold ${stats.totalBalanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(stats.totalBalanceDue)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
