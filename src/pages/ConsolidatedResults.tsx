import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { ModuleLayout } from "@/components/ModuleLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useSales, useAvailableMonths, Sale } from "@/hooks/useSales";
import { SalesKPICards } from "@/components/sales/SalesKPICards";
import { SalesCharts } from "@/components/sales/SalesCharts";
import { SalesTable } from "@/components/sales/SalesTable";
import { SaleFormDialog } from "@/components/sales/SaleFormDialog";
import { SalesImportDialog } from "@/components/sales/SalesImportDialog";
import { SalesFilters, SalesFiltersState } from "@/components/sales/SalesFilters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BarChart3, Table, TrendingUp, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export default function ConsolidatedResults() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filters, setFilters] = useState<SalesFiltersState>({
    month: undefined,
    serviceType: undefined,
    category: undefined,
    branch: undefined,
    seller: undefined,
    contractStatus: undefined,
    origin: undefined,
    minValue: undefined,
    maxValue: undefined,
  });
  
  const { sales: allSales, isLoading } = useSales();
  const { data: availableMonths = [] } = useAvailableMonths();

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const serviceTypes = [...new Set(allSales.map(s => s.service_type).filter(Boolean))];
    const categories = [...new Set(allSales.map(s => s.category).filter(Boolean))] as string[];
    const branches = [...new Set(allSales.map(s => s.branch).filter(Boolean))] as string[];
    const sellers = [...new Set(allSales.map(s => s.sold_by).filter(Boolean))] as string[];
    const contractStatuses = [...new Set(allSales.map(s => s.contract_status).filter(Boolean))] as string[];
    const origins = [...new Set(allSales.map(s => s.patient_origin).filter(Boolean))] as string[];
    
    return { serviceTypes, categories, branches, sellers, contractStatuses, origins };
  }, [allSales]);

  // Apply filters
  const filteredSales = useMemo(() => {
    return allSales.filter(sale => {
      if (filters.month && sale.month_year !== filters.month) return false;
      if (filters.serviceType && sale.service_type !== filters.serviceType) return false;
      if (filters.category && sale.category !== filters.category) return false;
      if (filters.branch && sale.branch !== filters.branch) return false;
      if (filters.seller && sale.sold_by !== filters.seller) return false;
      if (filters.contractStatus && sale.contract_status !== filters.contractStatus) return false;
      if (filters.origin && sale.patient_origin !== filters.origin) return false;
      if (filters.minValue && (sale.vgv_initial || 0) < filters.minValue) return false;
      if (filters.maxValue && (sale.vgv_initial || 0) > filters.maxValue) return false;
      return true;
    });
  }, [allSales, filters]);

  // Calculate stats from filtered sales
  const stats = useMemo(() => {
    const result = filteredSales.reduce((acc, sale) => {
      const vgv = Number(sale.vgv_initial) || 0;
      const deposit = Number(sale.deposit_paid) || 0;
      
      acc.totalVgv += vgv;
      acc.totalDeposits += deposit;
      acc.totalBalance += (vgv - deposit);
      acc.salesCount += 1;

      // By service type
      const service = sale.service_type || 'Outros';
      if (!acc.byService[service]) acc.byService[service] = { count: 0, value: 0 };
      acc.byService[service].count += 1;
      acc.byService[service].value += vgv;

      // Classify services
      const serviceLower = service.toLowerCase();
      if (serviceLower.includes('transplante') || serviceLower.includes('aluno')) {
        acc.transplantsSold += 1;
      } else if (serviceLower.includes('formação') || serviceLower.includes('360')) {
        acc.coursesSold += 1;
      } else {
        acc.treatmentsSold += 1;
      }

      // By category
      const category = sale.category || 'Sem categoria';
      if (!acc.byCategory[category]) acc.byCategory[category] = { count: 0, value: 0 };
      acc.byCategory[category].count += 1;
      acc.byCategory[category].value += vgv;

      // By branch
      const branch = sale.branch || 'Sem filial';
      if (!acc.byBranch[branch]) acc.byBranch[branch] = { count: 0, value: 0 };
      acc.byBranch[branch].count += 1;
      acc.byBranch[branch].value += vgv;

      // By seller
      const seller = sale.sold_by || 'Sem vendedor';
      if (!acc.bySeller[seller]) acc.bySeller[seller] = { count: 0, value: 0 };
      acc.bySeller[seller].count += 1;
      acc.bySeller[seller].value += vgv;

      // By month
      const month = sale.month_year || 'Sem data';
      if (!acc.byMonth[month]) acc.byMonth[month] = { count: 0, value: 0 };
      acc.byMonth[month].count += 1;
      acc.byMonth[month].value += vgv;

      // By contract status
      const status = sale.contract_status || 'Sem status';
      acc.byContractStatus[status] = (acc.byContractStatus[status] || 0) + 1;

      return acc;
    }, {
      totalVgv: 0,
      totalDeposits: 0,
      totalBalance: 0,
      salesCount: 0,
      avgTicket: 0,
      byService: {} as Record<string, { count: number; value: number }>,
      byCategory: {} as Record<string, { count: number; value: number }>,
      byBranch: {} as Record<string, { count: number; value: number }>,
      bySeller: {} as Record<string, { count: number; value: number }>,
      byMonth: {} as Record<string, { count: number; value: number }>,
      byContractStatus: {} as Record<string, number>,
      transplantsSold: 0,
      treatmentsSold: 0,
      coursesSold: 0,
    });

    result.avgTicket = result.salesCount > 0 ? result.totalVgv / result.salesCount : 0;
    return result;
  }, [filteredSales]);

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

          <div className="flex items-center gap-2">
            <SalesImportDialog
              trigger={
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </Button>
              }
            />
            <SaleFormDialog
              trigger={
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Venda
                </Button>
              }
            />
          </div>
        </div>

        {/* Filters */}
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <div className="rounded-lg border bg-card p-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <span className="text-sm font-medium">Filtros Avançados</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <SalesFilters
                filters={filters}
                onFiltersChange={setFilters}
                availableMonths={availableMonths}
                serviceTypes={filterOptions.serviceTypes}
                categories={filterOptions.categories}
                branches={filterOptions.branches}
                sellers={filterOptions.sellers}
                contractStatuses={filterOptions.contractStatuses}
                origins={filterOptions.origins}
              />
            </CollapsibleContent>
          </div>
        </Collapsible>

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
            <SalesTable sales={filteredSales} />
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
