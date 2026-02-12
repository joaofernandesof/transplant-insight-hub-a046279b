import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Calendar, MapPin, ArrowUpDown, Building2, SlidersHorizontal } from 'lucide-react';

interface HotLeadsGlobalFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  stateFilter: string;
  setStateFilter: (value: string) => void;
  cityFilter: string;
  setCityFilter: (value: string) => void;
  periodFilter: string;
  setPeriodFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  availableStates: string[];
  availableCities: string[];
}

export function HotLeadsGlobalFilters({
  searchTerm,
  setSearchTerm,
  stateFilter,
  setStateFilter,
  cityFilter,
  setCityFilter,
  periodFilter,
  setPeriodFilter,
  sortBy,
  setSortBy,
  availableStates,
  availableCities,
}: HotLeadsGlobalFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const hasFilters = searchTerm || stateFilter !== 'all' || cityFilter !== 'all' || periodFilter !== 'all' || sortBy !== 'recent';
  const activeFilterCount = [stateFilter !== 'all', cityFilter !== 'all', periodFilter !== 'all', sortBy !== 'recent'].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm('');
    setStateFilter('all');
    setCityFilter('all');
    setPeriodFilter('all');
    setSortBy('recent');
  };

  return (
    <div className="space-y-2">
      {/* Search + toggle row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nome, cidade, telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          size="sm"
          className="lg:hidden shrink-0 h-9"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full text-[10px] h-4 w-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0 h-9">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter selects - always visible on desktop, toggle on mobile */}
      <div className={`flex-wrap items-center gap-2 ${showFilters ? 'flex' : 'hidden lg:flex'}`}>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs">
            <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo período</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>

        <Select value={stateFilter} onValueChange={(v) => { setStateFilter(v); setCityFilter('all'); }}>
          <SelectTrigger className="w-[calc(50%-4px)] sm:w-[130px] h-9 text-xs">
            <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos estados</SelectItem>
            {availableStates.sort().map(state => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-[calc(50%-4px)] sm:w-[150px] h-9 text-xs">
            <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas cidades</SelectItem>
            {availableCities.sort().map(city => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais recentes</SelectItem>
            <SelectItem value="oldest">Mais antigos</SelectItem>
            <SelectItem value="name_asc">Nome A-Z</SelectItem>
            <SelectItem value="name_desc">Nome Z-A</SelectItem>
            <SelectItem value="city_asc">Cidade A-Z</SelectItem>
            <SelectItem value="state_asc">Estado A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
