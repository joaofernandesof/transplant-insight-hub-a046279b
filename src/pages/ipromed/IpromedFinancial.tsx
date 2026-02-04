/**
 * CPG Advocacia Médica - Módulo Financeiro Jurídico
 * Gestão financeira completa para escritório jurídico
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Receipt,
  Building2,
  BarChart3,
  Bell,
  Wallet,
  Link2,
  Calculator,
  PieChart,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Submodules
import AccountsPayable from "./components/financial/AccountsPayable";
import AccountsReceivable from "./components/financial/AccountsReceivable";
import CashFlow from "./components/financial/CashFlow";
import BankReconciliation from "./components/financial/BankReconciliation";
import BankIntegration from "./components/financial/BankIntegration";
import BillingModule from "./components/financial/BillingModule";
import CostCenters from "./components/financial/CostCenters";
import InvoicesModule from "./components/financial/InvoicesModule";
import FinancialReports from "./components/financial/FinancialReports";
import AccountingIntegration from "./components/financial/AccountingIntegration";
import FinancialAlerts from "./components/financial/FinancialAlerts";

const tabs = [
  { id: 'overview', label: 'Visão Geral', icon: PieChart },
  { id: 'payables', label: 'Contas a Pagar', icon: ArrowUpRight },
  { id: 'receivables', label: 'Contas a Receber', icon: ArrowDownLeft },
  { id: 'cashflow', label: 'Fluxo de Caixa', icon: TrendingUp },
  { id: 'reconciliation', label: 'Conciliação', icon: Link2 },
  { id: 'bank', label: 'Integração Bancária', icon: Building2 },
  { id: 'billing', label: 'Cobranças', icon: Receipt },
  { id: 'centers', label: 'Centros de Resultado', icon: Calculator },
  { id: 'invoices', label: 'Notas Fiscais', icon: FileText },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'accounting', label: 'Contabilidade', icon: Wallet },
  { id: 'alerts', label: 'Alertas', icon: Bell },
];

// Mock data for overview stats
const overviewStats = {
  receivedMonth: 85000,
  pendingReceive: 42500,
  overdueReceive: 8750,
  payablesMonth: 35000,
  pendingPay: 12000,
  cashBalance: 156000,
  projectedBalance: 198500,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function IpromedFinancial() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-7 w-7 text-emerald-600" />
            Financeiro
          </h1>
          <p className="text-muted-foreground text-sm">
            Gestão financeira completa do escritório jurídico
          </p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          <Wallet className="h-3 w-3 mr-1" />
          Saldo: {formatCurrency(overviewStats.cashBalance)}
        </Badge>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-muted/50 p-2 rounded-lg">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm",
                  "data-[state=active]:bg-white data-[state=active]:shadow-sm"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-700">Recebido no Mês</p>
                    <p className="text-2xl font-bold text-emerald-800">
                      {formatCurrency(overviewStats.receivedMonth)}
                    </p>
                  </div>
                  <ArrowDownLeft className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700">A Receber</p>
                    <p className="text-2xl font-bold text-amber-800">
                      {formatCurrency(overviewStats.pendingReceive)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-rose-700">Atrasados</p>
                    <p className="text-2xl font-bold text-rose-800">
                      {formatCurrency(overviewStats.overdueReceive)}
                    </p>
                  </div>
                  <Bell className="h-8 w-8 text-rose-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Saldo Previsto</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {formatCurrency(overviewStats.projectedBalance)}
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-emerald-500"
              onClick={() => setActiveTab('receivables')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
                  Contas a Receber
                </CardTitle>
                <CardDescription>
                  Honorários, consultas, pareceres e mensalidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Pendentes</span>
                  <span className="font-semibold">{formatCurrency(overviewStats.pendingReceive)}</span>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-rose-500"
              onClick={() => setActiveTab('payables')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-rose-600" />
                  Contas a Pagar
                </CardTitle>
                <CardDescription>
                  Pró-labore, custas, peritos e correspondentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Pendentes</span>
                  <span className="font-semibold">{formatCurrency(overviewStats.pendingPay)}</span>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
              onClick={() => setActiveTab('cashflow')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Fluxo de Caixa
                </CardTitle>
                <CardDescription>
                  Projeções e visão diária do saldo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Saldo Atual</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(overviewStats.cashBalance)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'billing', label: 'Cobranças', icon: Receipt, desc: 'PIX, boletos e régua de cobrança' },
              { id: 'reconciliation', label: 'Conciliação', icon: Link2, desc: 'Conciliar lançamentos bancários' },
              { id: 'invoices', label: 'Notas Fiscais', icon: FileText, desc: 'Emissão de NFS-e' },
              { id: 'reports', label: 'Relatórios', icon: BarChart3, desc: 'DRE, aging e indicadores' },
            ].map(item => (
              <Card 
                key={item.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setActiveTab(item.id)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <item.icon className="h-8 w-8 text-primary mb-2" />
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sub-module Tabs */}
        <TabsContent value="payables" className="mt-6">
          <AccountsPayable />
        </TabsContent>

        <TabsContent value="receivables" className="mt-6">
          <AccountsReceivable />
        </TabsContent>

        <TabsContent value="cashflow" className="mt-6">
          <CashFlow />
        </TabsContent>

        <TabsContent value="reconciliation" className="mt-6">
          <BankReconciliation />
        </TabsContent>

        <TabsContent value="bank" className="mt-6">
          <BankIntegration />
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <BillingModule />
        </TabsContent>

        <TabsContent value="centers" className="mt-6">
          <CostCenters />
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <InvoicesModule />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <FinancialReports />
        </TabsContent>

        <TabsContent value="accounting" className="mt-6">
          <AccountingIntegration />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <FinancialAlerts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
