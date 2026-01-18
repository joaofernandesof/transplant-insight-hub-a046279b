import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface SalesFiltersState {
  month: string | undefined;
  serviceType: string | undefined;
  category: string | undefined;
  branch: string | undefined;
  seller: string | undefined;
  contractStatus: string | undefined;
  origin: string | undefined;
  minValue: number | undefined;
  maxValue: number | undefined;
}

interface SalesFiltersProps {
  filters: SalesFiltersState;
  onFiltersChange: (filters: SalesFiltersState) => void;
  availableMonths: string[];
  serviceTypes: string[];
  categories: string[];
  branches: string[];
  sellers: string[];
  contractStatuses: string[];
  origins: string[];
}

export function SalesFilters({
  filters,
  onFiltersChange,
  availableMonths,
  serviceTypes,
  categories,
  branches,
  sellers,
  contractStatuses,
  origins,
}: SalesFiltersProps) {
  const updateFilter = <K extends keyof SalesFiltersState>(key: K, value: SalesFiltersState[K]) => {
    onFiltersChange({ ...filters, [key]: value === "all" ? undefined : value });
  };

  const clearFilters = () => {
    onFiltersChange({
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
  };

  const activeFiltersCount = Object.values(filters).filter((v) => v !== undefined).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filtros</span>
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {activeFiltersCount} ativos
          </Badge>
        )}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2">
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Mês */}
        <Select
          value={filters.month || "all"}
          onValueChange={(value) => updateFilter("month", value)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Mês" />
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

        {/* Serviço */}
        <Select
          value={filters.serviceType || "all"}
          onValueChange={(value) => updateFilter("serviceType", value)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Serviço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os serviços</SelectItem>
            {serviceTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Categoria */}
        <Select
          value={filters.category || "all"}
          onValueChange={(value) => updateFilter("category", value)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.length > 30 ? cat.substring(0, 30) + "..." : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filial */}
        <Select
          value={filters.branch || "all"}
          onValueChange={(value) => updateFilter("branch", value)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Filial" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as filiais</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch} value={branch}>
                {branch}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Vendedor */}
        <Select
          value={filters.seller || "all"}
          onValueChange={(value) => updateFilter("seller", value)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os vendedores</SelectItem>
            {sellers.map((seller) => (
              <SelectItem key={seller} value={seller}>
                {seller}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Contrato */}
        <Select
          value={filters.contractStatus || "all"}
          onValueChange={(value) => updateFilter("contractStatus", value)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {contractStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Origem */}
        <Select
          value={filters.origin || "all"}
          onValueChange={(value) => updateFilter("origin", value)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            {origins.map((origin) => (
              <SelectItem key={origin} value={origin}>
                {origin}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Valor Mínimo */}
        <div className="relative">
          <Input
            type="number"
            placeholder="VGV mínimo"
            value={filters.minValue || ""}
            onChange={(e) => updateFilter("minValue", e.target.value ? Number(e.target.value) : undefined)}
            className="h-9 pl-8"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
        </div>

        {/* Valor Máximo */}
        <div className="relative">
          <Input
            type="number"
            placeholder="VGV máximo"
            value={filters.maxValue || ""}
            onChange={(e) => updateFilter("maxValue", e.target.value ? Number(e.target.value) : undefined)}
            className="h-9 pl-8"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
        </div>
      </div>
    </div>
  );
}
