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

  const isPeriodActive = periodFilter !== 'all';
  const isStateActive = stateFilter !== 'all';
  const isCityActive = cityFilter !== 'all';
  const isSortActive = sortBy !== 'recent';
  const hasFilters = searchTerm || isPeriodActive || isStateActive || isCityActive || isSortActive;
  const activeFilterCount = [isPeriodActive, isStateActive, isCityActive, isSortActive].filter(Boolean).length;

  const activeStyle = 'border-primary bg-primary/10 ring-1 ring-primary/30';
  const inactiveStyle = '';

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
            className={`pl-10 h-9 ${searchTerm ? activeStyle : ''}`}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
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
          <Button variant="destructive" size="sm" onClick={clearFilters} className="shrink-0 h-9 gap-1">
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Limpar filtros</span>
            <span className="sm:hidden">Limpar</span>
          </Button>
        )}
      </div>

      {/* Filter selects */}
      <div className={`flex-wrap items-center gap-2 ${showFilters ? 'flex' : 'hidden lg:flex'}`}>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className={`w-full sm:w-[150px] h-9 text-xs transition-colors ${isPeriodActive ? activeStyle : inactiveStyle}`}>
            <Calendar className={`h-3.5 w-3.5 mr-1.5 shrink-0 ${isPeriodActive ? 'text-primary' : 'text-muted-foreground'}`} />
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
          <SelectTrigger className={`w-[calc(50%-4px)] sm:w-[130px] h-9 text-xs transition-colors ${isStateActive ? activeStyle : inactiveStyle}`}>
            <MapPin className={`h-3.5 w-3.5 mr-1.5 shrink-0 ${isStateActive ? 'text-primary' : 'text-muted-foreground'}`} />
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
          <SelectTrigger className={`w-[calc(50%-4px)] sm:w-[150px] h-9 text-xs transition-colors ${isCityActive ? activeStyle : inactiveStyle}`}>
            <Building2 className={`h-3.5 w-3.5 mr-1.5 shrink-0 ${isCityActive ? 'text-primary' : 'text-muted-foreground'}`} />
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
          <SelectTrigger className={`w-full sm:w-[150px] h-9 text-xs transition-colors ${isSortActive ? activeStyle : inactiveStyle}`}>
            <ArrowUpDown className={`h-3.5 w-3.5 mr-1.5 shrink-0 ${isSortActive ? 'text-primary' : 'text-muted-foreground'}`} />
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
