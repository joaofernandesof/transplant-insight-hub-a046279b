import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Filter, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

interface SurgeryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateFilter: "all" | "today" | "upcoming" | "past" | "week" | "month";
  onDateFilterChange: (value: "all" | "today" | "upcoming" | "past" | "week" | "month") => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

const categories = [
  { value: "all", label: "Todas Categorias" },
  { value: "CATEGORIA A", label: "Cat A - Indicação" },
  { value: "CATEGORIA B", label: "Cat B - Médico da Equipe" },
  { value: "CATEGORIA C", label: "Cat C - Modelo VIP" },
  { value: "CATEGORIA D", label: "Cat D - Modelo Normal" },
  { value: "RETOQUE", label: "Retoque" },
];

const statusOptions = [
  { value: "all", label: "Todos Status" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "pending_confirmation", label: "Aguardando Confirmação" },
  { value: "pending_exams", label: "Exames Pendentes" },
  { value: "pending_contract", label: "Contrato Pendente" },
  { value: "pending_payment", label: "Saldo Pendente" },
];

export function SurgeryFilters({
  searchTerm,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  dateRange,
  onDateRangeChange,
}: SurgeryFiltersProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const activeFiltersCount = [
    categoryFilter !== "all" ? 1 : 0,
    statusFilter !== "all" ? 1 : 0,
    dateRange?.from ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    onSearchChange("");
    onDateFilterChange("all");
    onCategoryFilterChange("all");
    onStatusFilterChange("all");
    onDateRangeChange?.(undefined);
  };

  return (
    <div className="space-y-4">
      {/* Main search row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente, telefone ou acompanhante..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Quick date filters */}
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            {[
              { value: "all", label: "Todas" },
              { value: "today", label: "Hoje" },
              { value: "week", label: "7 dias" },
              { value: "month", label: "30 dias" },
            ].map((option) => (
              <Button
                key={option.value}
                variant={dateFilter === option.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onDateFilterChange(option.value as any)}
                className={cn(
                  "text-xs h-8",
                  dateFilter === option.value && "bg-background shadow-sm"
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Advanced filters popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Filtros Avançados</h4>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-8 text-xs">
                      <X className="h-3 w-3 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Categoria
                    </label>
                    <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Status
                    </label>
                    <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Período Específico
                    </label>
                    <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                              </>
                            ) : (
                              format(dateRange.from, "dd/MM/yyyy")
                            )
                          ) : (
                            <span className="text-muted-foreground">Selecionar período</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={(range) => {
                            onDateRangeChange?.(range);
                            if (range?.to) setShowDatePicker(false);
                          }}
                          locale={ptBR}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active filters tags */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {categoryFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {categories.find(c => c.value === categoryFilter)?.label}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => onCategoryFilterChange("all")}
              />
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {statusOptions.find(s => s.value === statusFilter)?.label}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => onStatusFilterChange("all")}
              />
            </Badge>
          )}
          {dateRange?.from && (
            <Badge variant="secondary" className="gap-1">
              {format(dateRange.from, "dd/MM")} - {dateRange.to ? format(dateRange.to, "dd/MM") : "..."}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => onDateRangeChange?.(undefined)}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
