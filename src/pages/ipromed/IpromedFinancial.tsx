/**
 * CPG Advocacia Médica - Módulo Financeiro Jurídico
 * Gestão financeira completa para escritório jurídico
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Receipt,
  Building2,
  BarChart3,
  Wallet,
  Link2,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Submodules
import AccountsPayable from "./components/financial/AccountsPayable";
import AccountsReceivable from "./components/financial/AccountsReceivable";
import CashFlow from "./components/financial/CashFlow";
import BankReconciliation from "./components/financial/BankReconciliation";
import BankIntegration from "./components/financial/BankIntegration";
import BillingModule from "./components/financial/BillingModule";
import InvoicesModule from "./components/financial/InvoicesModule";
import FinancialReports from "./components/financial/FinancialReports";
import AccountingIntegration from "./components/financial/AccountingIntegration";
import FinancialOverviewDashboard from "./components/financial/FinancialOverviewDashboard";
import FinancialAlertsPopover from "./components/financial/FinancialAlertsPopover";

const tabs = [
  { id: 'overview', label: 'Visão Geral', icon: PieChart },
  { id: 'payables', label: 'Contas a Pagar', icon: ArrowUpRight },
  { id: 'receivables', label: 'Contas a Receber', icon: ArrowDownLeft },
  { id: 'cashflow', label: 'Fluxo de Caixa', icon: TrendingUp },
  { id: 'reconciliation', label: 'Conciliação', icon: Link2 },
  { id: 'bank', label: 'Integração Bancária', icon: Building2 },
  { id: 'billing', label: 'Cobranças', icon: Receipt },
  { id: 'invoices', label: 'Notas Fiscais', icon: FileText },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'accounting', label: 'Contabilidade', icon: Wallet },
];

export default function IpromedFinancial() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-7 w-7 text-primary" />
            Financeiro
          </h1>
          <p className="text-muted-foreground text-sm">
            Gestão financeira completa do escritório jurídico
          </p>
        </div>
        
        {/* Financial Alerts Bell */}
        <FinancialAlertsPopover />
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

        {/* Overview Tab - New Dashboard */}
        <TabsContent value="overview" className="mt-6">
          <FinancialOverviewDashboard />
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

        <TabsContent value="invoices" className="mt-6">
          <InvoicesModule />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <FinancialReports />
        </TabsContent>

        <TabsContent value="accounting" className="mt-6">
          <AccountingIntegration />
        </TabsContent>
      </Tabs>
    </div>
  );
}
