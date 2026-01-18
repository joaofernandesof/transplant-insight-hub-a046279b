import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { ModuleLayout } from "@/components/ModuleLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useSales, useAvailableMonths } from "@/hooks/useSales";
import { SalesKPICards } from "@/components/sales/SalesKPICards";
import { SalesCharts } from "@/components/sales/SalesCharts";
import { SalesTable } from "@/components/sales/SalesTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BarChart3, Table, TrendingUp } from "lucide-react";

export default function ConsolidatedResults() {
  const { isAdmin } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const { sales, stats, isLoading } = useSales(selectedMonth);
  const { data: availableMonths = [] } = useAvailableMonths();

  const Layout = isAdmin ? AdminLayout : ModuleLayout;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Resultados Consolidados</h1>
            <p className="text-muted-foreground">
              Controle de vendas e indicadores de performance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={selectedMonth || "all"}
              onValueChange={(value) => setSelectedMonth(value === "all" ? undefined : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <SalesKPICards stats={stats} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <Table className="h-4 w-4" />
              <span className="hidden sm:inline">Tabela</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Análise</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <SalesCharts stats={stats} />
          </TabsContent>

          <TabsContent value="table" className="mt-6">
            <SalesTable sales={sales} />
          </TabsContent>

          <TabsContent value="analysis" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Top Services */}
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold mb-3">Top Serviços por Valor</h3>
                <div className="space-y-2">
                  {Object.entries(stats.byService)
                    .sort((a, b) => b[1].value - a[1].value)
                    .slice(0, 5)
                    .map(([service, data], index) => (
                      <div key={service} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <span className="truncate max-w-[150px]">{service}</span>
                        </span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(data.value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Top Sellers */}
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold mb-3">Top Vendedores</h3>
                <div className="space-y-2">
                  {Object.entries(stats.bySeller)
                    .filter(([name]) => name !== 'Sem vendedor')
                    .sort((a, b) => b[1].value - a[1].value)
                    .slice(0, 5)
                    .map(([seller, data], index) => (
                      <div key={seller} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-chart-2/10 text-chart-2 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <span>{seller}</span>
                        </span>
                        <div className="text-right">
                          <span className="font-medium block">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(data.value)}
                          </span>
                          <span className="text-xs text-muted-foreground">{data.count} vendas</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Category Summary */}
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold mb-3">Resumo por Categoria</h3>
                <div className="space-y-2">
                  {Object.entries(stats.byCategory)
                    .filter(([name]) => name !== 'Sem categoria' && name !== '-')
                    .sort((a, b) => b[1].value - a[1].value)
                    .slice(0, 5)
                    .map(([category, data]) => {
                      const catLabel = category.includes('CATEGORIA A') ? 'Cat A - Dr Hygor' :
                                       category.includes('CATEGORIA B') ? 'Cat B - Médico Equipe' :
                                       category.includes('CATEGORIA C') ? 'Cat C - Modelo VIP' :
                                       category.includes('CATEGORIA D') ? 'Cat D - Modelo Normal' :
                                       category.substring(0, 20);
                      return (
                        <div key={category} className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-[150px]">{catLabel}</span>
                          <div className="text-right">
                            <span className="font-medium block">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(data.value)}
                            </span>
                            <span className="text-xs text-muted-foreground">{data.count} vendas</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold mb-3">Resumo de Procedimentos</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Transplantes</span>
                    <span className="font-semibold text-lg">{stats.transplantsSold}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tratamentos</span>
                    <span className="font-semibold text-lg">{stats.treatmentsSold}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cursos/Formações</span>
                    <span className="font-semibold text-lg">{stats.coursesSold}</span>
                  </div>
                </div>
              </div>

              {/* Branch Stats */}
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold mb-3">Performance por Filial</h3>
                <div className="space-y-2">
                  {Object.entries(stats.byBranch)
                    .filter(([name]) => name !== 'Sem filial')
                    .sort((a, b) => b[1].value - a[1].value)
                    .map(([branch, data]) => (
                      <div key={branch} className="flex items-center justify-between text-sm">
                        <span>{branch}</span>
                        <div className="text-right">
                          <span className="font-medium block">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(data.value)}
                          </span>
                          <span className="text-xs text-muted-foreground">{data.count} vendas</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Contract Status Summary */}
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold mb-3">Status dos Contratos</h3>
                <div className="space-y-2">
                  {Object.entries(stats.byContractStatus)
                    .filter(([name]) => name !== 'Sem status')
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between text-sm">
                        <span className="truncate max-w-[180px]">{status}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
