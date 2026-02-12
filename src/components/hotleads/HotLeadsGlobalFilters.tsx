import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Calendar, MapPin, ArrowUpDown, Building2 } from 'lucide-react';

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
  const hasFilters = searchTerm || stateFilter !== 'all' || cityFilter !== 'all' || periodFilter !== 'all' || sortBy !== 'recent';

  const clearFilters = () => {
    setSearchTerm('');
    setStateFilter('all');
    setCityFilter('all');
    setPeriodFilter('all');
    setSortBy('recent');
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, cidade ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Period Filter */}
      <Select value={periodFilter} onValueChange={setPeriodFilter}>
        <SelectTrigger className="w-[160px]">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
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

      {/* State Filter */}
      <Select value={stateFilter} onValueChange={(v) => { setStateFilter(v); setCityFilter('all'); }}>
        <SelectTrigger className="w-[140px]">
          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos estados</SelectItem>
          {availableStates.sort().map(state => (
            <SelectItem key={state} value={state}>{state}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* City Filter */}
      <Select value={cityFilter} onValueChange={setCityFilter}>
        <SelectTrigger className="w-[170px]">
          <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Cidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas cidades</SelectItem>
          {availableCities.sort().map(city => (
            <SelectItem key={city} value={city}>{city}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-[160px]">
          <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
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

      {/* Clear Filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
