import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  TrendingUp,
  DollarSign,
  Flame,
  Receipt,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import logoByNeofolic from "@/assets/logo-byneofolic.png";

interface Payment {
  id: string;
  type: 'license_fee' | 'monthly';
  description: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'overdue' | 'pending';
  paidAt?: string;
}

// Dados simulados
const mockPayments: Payment[] = [
  // Taxa de licença (parcelas)
  { id: '1', type: 'license_fee', description: 'Taxa de Licença - Parcela 1/12', amount: 10000, dueDate: '2025-01-15', status: 'paid', paidAt: '2025-01-14' },
  { id: '2', type: 'license_fee', description: 'Taxa de Licença - Parcela 2/12', amount: 10000, dueDate: '2025-02-15', status: 'paid', paidAt: '2025-02-15' },
  { id: '3', type: 'license_fee', description: 'Taxa de Licença - Parcela 3/12', amount: 10000, dueDate: '2025-03-15', status: 'paid', paidAt: '2025-03-14' },
  { id: '4', type: 'license_fee', description: 'Taxa de Licença - Parcela 4/12', amount: 10000, dueDate: '2025-04-15', status: 'paid', paidAt: '2025-04-15' },
  { id: '5', type: 'license_fee', description: 'Taxa de Licença - Parcela 5/12', amount: 10000, dueDate: '2025-05-15', status: 'paid', paidAt: '2025-05-15' },
  { id: '6', type: 'license_fee', description: 'Taxa de Licença - Parcela 6/12', amount: 10000, dueDate: '2025-06-15', status: 'paid', paidAt: '2025-06-14' },
  { id: '7', type: 'license_fee', description: 'Taxa de Licença - Parcela 7/12', amount: 10000, dueDate: '2025-07-15', status: 'paid', paidAt: '2025-07-15' },
  { id: '8', type: 'license_fee', description: 'Taxa de Licença - Parcela 8/12', amount: 10000, dueDate: '2025-08-15', status: 'paid', paidAt: '2025-08-14' },
  { id: '9', type: 'license_fee', description: 'Taxa de Licença - Parcela 9/12', amount: 10000, dueDate: '2025-09-15', status: 'paid', paidAt: '2025-09-15' },
  { id: '10', type: 'license_fee', description: 'Taxa de Licença - Parcela 10/12', amount: 10000, dueDate: '2025-10-15', status: 'paid', paidAt: '2025-10-14' },
  { id: '11', type: 'license_fee', description: 'Taxa de Licença - Parcela 11/12', amount: 10000, dueDate: '2025-11-15', status: 'overdue' },
  { id: '12', type: 'license_fee', description: 'Taxa de Licença - Parcela 12/12', amount: 10000, dueDate: '2025-12-15', status: 'pending' },
  // Mensalidades
  { id: '13', type: 'monthly', description: 'Mensalidade - Janeiro/2025', amount: 5000, dueDate: '2025-01-10', status: 'paid', paidAt: '2025-01-10' },
  { id: '14', type: 'monthly', description: 'Mensalidade - Fevereiro/2025', amount: 5000, dueDate: '2025-02-10', status: 'paid', paidAt: '2025-02-09' },
  { id: '15', type: 'monthly', description: 'Mensalidade - Março/2025', amount: 5000, dueDate: '2025-03-10', status: 'paid', paidAt: '2025-03-10' },
  { id: '16', type: 'monthly', description: 'Mensalidade - Abril/2025', amount: 5000, dueDate: '2025-04-10', status: 'paid', paidAt: '2025-04-09' },
  { id: '17', type: 'monthly', description: 'Mensalidade - Maio/2025', amount: 5000, dueDate: '2025-05-10', status: 'paid', paidAt: '2025-05-10' },
  { id: '18', type: 'monthly', description: 'Mensalidade - Junho/2025', amount: 5000, dueDate: '2025-06-10', status: 'paid', paidAt: '2025-06-08' },
  { id: '19', type: 'monthly', description: 'Mensalidade - Julho/2025', amount: 5000, dueDate: '2025-07-10', status: 'paid', paidAt: '2025-07-10' },
  { id: '20', type: 'monthly', description: 'Mensalidade - Agosto/2025', amount: 5000, dueDate: '2025-08-10', status: 'paid', paidAt: '2025-08-09' },
  { id: '21', type: 'monthly', description: 'Mensalidade - Setembro/2025', amount: 5000, dueDate: '2025-09-10', status: 'paid', paidAt: '2025-09-10' },
  { id: '22', type: 'monthly', description: 'Mensalidade - Outubro/2025', amount: 5000, dueDate: '2025-10-10', status: 'paid', paidAt: '2025-10-09' },
  { id: '23', type: 'monthly', description: 'Mensalidade - Novembro/2025', amount: 5000, dueDate: '2025-11-10', status: 'overdue' },
  { id: '24', type: 'monthly', description: 'Mensalidade - Dezembro/2025', amount: 5000, dueDate: '2025-12-10', status: 'pending' },
  { id: '25', type: 'monthly', description: 'Mensalidade - Janeiro/2026', amount: 5000, dueDate: '2026-01-10', status: 'pending' },
];

// Dados simulados de ROI do HotLeads
const hotLeadsData = {
  leadsReceived: 47,
  leadsConverted: 12,
  totalRevenue: 384000, // R$ 384.000 em vendas
  averageTicket: 32000, // Ticket médio de R$ 32.000
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function LicensePayments() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Cálculos
  const licenseFeeTotal = 120000;
  const monthlyFeeTotal = 5000;
  
  const licenseFeePayments = mockPayments.filter(p => p.type === 'license_fee');
  const monthlyPayments = mockPayments.filter(p => p.type === 'monthly');
  
  const licenseFeePaid = licenseFeePayments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
  const monthlyPaid = monthlyPayments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
  
  const overduePayments = mockPayments.filter(p => p.status === 'overdue');
  const overdueTotal = overduePayments.reduce((acc, p) => acc + p.amount, 0);
  
  const totalPaid = licenseFeePaid + monthlyPaid;
  const totalInvested = totalPaid + overdueTotal; // Total que deveria ter sido pago até agora
  
  // ROI Calculation
  const roi = ((hotLeadsData.totalRevenue - totalInvested) / totalInvested) * 100;
  const conversionRate = (hotLeadsData.leadsConverted / hotLeadsData.leadsReceived) * 100;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="h-3 w-3 mr-1" />Pago</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><AlertCircle className="h-3 w-3 mr-1" />Vencido</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><Clock className="h-3 w-3 mr-1" />A Vencer</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={logoByNeofolic} alt="ByNeofolic" className="h-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                Financeiro da Licença
              </h1>
              <p className="text-sm text-muted-foreground">Acompanhe seus pagamentos e ROI</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* ROI Panel */}
        <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Retorno sobre Investimento (ROI) - HotLeads
            </CardTitle>
            <CardDescription>Comparativo entre receita gerada e investimento na licença</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-white rounded-xl border">
                <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{hotLeadsData.leadsReceived}</p>
                <p className="text-xs text-muted-foreground">Leads Recebidos</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border">
                <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{hotLeadsData.leadsConverted}</p>
                <p className="text-xs text-muted-foreground">Leads Convertidos</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border">
                <DollarSign className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(hotLeadsData.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Faturamento HotLeads</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border">
                <Receipt className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{formatCurrency(hotLeadsData.averageTicket)}</p>
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Investido na Licença</p>
                      <p className="text-xl font-bold text-slate-700">{formatCurrency(totalPaid)}</p>
                    </div>
                    <ArrowDownRight className="h-8 w-8 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Receita HotLeads</p>
                      <p className="text-xl font-bold text-emerald-600">{formatCurrency(hotLeadsData.totalRevenue)}</p>
                    </div>
                    <ArrowUpRight className="h-8 w-8 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className={`${roi > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">ROI</p>
                      <p className={`text-2xl font-bold ${roi > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {roi > 0 ? '+' : ''}{roi.toFixed(0)}%
                      </p>
                    </div>
                    <TrendingUp className={`h-8 w-8 ${roi > 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-4 p-4 bg-white rounded-xl border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Taxa de Conversão de Leads</span>
                <span className="text-sm font-bold text-primary">{conversionRate.toFixed(1)}%</span>
              </div>
              <Progress value={conversionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
                  <p className="text-sm text-emerald-600">Total Pago</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{formatCurrency(overdueTotal)}</p>
                  <p className="text-sm text-red-600">Total Vencido</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700">{formatCurrency(mockPayments.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0))}</p>
                  <p className="text-sm text-amber-600">A Vencer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* License Fee Progress */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Taxa de Licença</CardTitle>
                <CardDescription>Total: {formatCurrency(licenseFeeTotal)} em 12 parcelas</CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-1">
                {licenseFeePaid / licenseFeeTotal * 100}% pago
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={(licenseFeePaid / licenseFeeTotal) * 100} className="h-3 mb-2" />
            <p className="text-sm text-muted-foreground">
              {formatCurrency(licenseFeePaid)} de {formatCurrency(licenseFeeTotal)}
            </p>
          </CardContent>
        </Card>

        {/* Payments List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue & Pending */}
          {overduePayments.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="bg-red-50 rounded-t-lg">
                <CardTitle className="text-base flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  Pagamentos Vencidos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {overduePayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-sm">{payment.description}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Venceu em {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{formatCurrency(payment.amount)}</p>
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                Últimos Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {mockPayments.filter(p => p.status === 'paid').slice(-8).reverse().map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{payment.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Pago em {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{formatCurrency(payment.amount)}</p>
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próximos vencimentos */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              Próximos Vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {mockPayments.filter(p => p.status === 'pending').slice(0, 4).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <p className="font-medium text-sm">{payment.description}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Vence em {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-700">{formatCurrency(payment.amount)}</p>
                    {getStatusBadge(payment.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg text-center text-sm text-muted-foreground">
          <p>Em breve: integração automática com planilhas e sistemas de gestão financeira.</p>
          <p className="mt-1">Os dados exibidos são simulados para demonstração.</p>
        </div>
      </main>
    </div>
  );
}
