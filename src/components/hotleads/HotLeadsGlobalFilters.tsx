import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Calendar, MapPin, ArrowUpDown, Building2, Users } from 'lucide-react';

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
  inline?: boolean;
  userFilter?: string;
  setUserFilter?: (value: string) => void;
  availableUsers?: { id: string; name: string }[];
  isAdmin?: boolean;
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
  inline = false,
  userFilter = 'all',
  setUserFilter,
  availableUsers = [],
  isAdmin = false,
}: HotLeadsGlobalFiltersProps) {
  // Filters always visible on mobile (no toggle)

  const isPeriodActive = periodFilter !== 'all';
  const isStateActive = stateFilter !== 'all';
  const isCityActive = cityFilter !== 'all';
  const isSortActive = sortBy !== 'recent';
  const isUserActive = userFilter !== 'all';
  const hasFilters = isPeriodActive || isStateActive || isCityActive || isSortActive || isUserActive;
  const activeFilterCount = [isPeriodActive, isStateActive, isCityActive, isSortActive, isUserActive].filter(Boolean).length;

  const activeStyle = 'border-primary bg-primary/10 ring-1 ring-primary/30';
  const inactiveStyle = '';

  const clearFilters = () => {
    setSearchTerm('');
    setStateFilter('all');
    setCityFilter('all');
    setPeriodFilter('all');
    setSortBy('recent');
    setUserFilter?.('all');
  };

  const userSelect = isAdmin && setUserFilter && availableUsers.length > 0 ? (
    <Select value={userFilter} onValueChange={setUserFilter}>
      <SelectTrigger className={`${inline ? 'w-[130px]' : 'w-full sm:w-[150px]'} h-9 text-xs transition-colors ${isUserActive ? activeStyle : inactiveStyle}`}>
        <Users className={`h-3.5 w-3.5 mr-1 shrink-0 ${isUserActive ? 'text-primary' : 'text-muted-foreground'}`} />
        <SelectValue placeholder="Usuário" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos usuários</SelectItem>
        {availableUsers.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(u => (
          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : null;

  if (inline) {
    return (
      <>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className={`w-[120px] h-9 text-xs transition-colors ${isPeriodActive ? activeStyle : inactiveStyle}`}>
            <Calendar className={`h-3.5 w-3.5 mr-1 shrink-0 ${isPeriodActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo período</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7d">Últimos 7d</SelectItem>
            <SelectItem value="30d">Últimos 30d</SelectItem>
            <SelectItem value="90d">Últimos 90d</SelectItem>
          </SelectContent>
        </Select>

        <Select value={stateFilter} onValueChange={(v) => { setStateFilter(v); setCityFilter('all'); }}>
          <SelectTrigger className={`w-[110px] h-9 text-xs transition-colors ${isStateActive ? activeStyle : inactiveStyle}`}>
            <MapPin className={`h-3.5 w-3.5 mr-1 shrink-0 ${isStateActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Estado</SelectItem>
            {availableStates.sort().map(state => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className={`w-[120px] h-9 text-xs transition-colors ${isCityActive ? activeStyle : inactiveStyle}`}>
            <Building2 className={`h-3.5 w-3.5 mr-1 shrink-0 ${isCityActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <SelectValue placeholder="Cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cidade</SelectItem>
            {availableCities.sort().map(city => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className={`w-[120px] h-9 text-xs transition-colors ${isSortActive ? activeStyle : inactiveStyle}`}>
            <ArrowUpDown className={`h-3.5 w-3.5 mr-1 shrink-0 ${isSortActive ? 'text-primary' : 'text-muted-foreground'}`} />
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

        {userSelect}

        {hasFilters && (
          <Button variant="destructive" size="sm" onClick={clearFilters} className="shrink-0 h-9 gap-1">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className={`w-full sm:w-[130px] h-9 text-xs transition-colors ${isPeriodActive ? activeStyle : inactiveStyle}`}>
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
            <SelectTrigger className={`w-full sm:w-[120px] h-9 text-xs transition-colors ${isStateActive ? activeStyle : inactiveStyle}`}>
              <MapPin className={`h-3.5 w-3.5 mr-1.5 shrink-0 ${isStateActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Estado</SelectItem>
              {availableStates.sort().map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className={`w-full sm:w-[140px] h-9 text-xs transition-colors ${isCityActive ? activeStyle : inactiveStyle}`}>
              <Building2 className={`h-3.5 w-3.5 mr-1.5 shrink-0 ${isCityActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cidade</SelectItem>
              {availableCities.sort().map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className={`w-full sm:w-[140px] h-9 text-xs transition-colors ${isSortActive ? activeStyle : inactiveStyle}`}>
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

          {userSelect}
        </div>

        {hasFilters && (
          <Button variant="destructive" size="sm" onClick={clearFilters} className="shrink-0 h-9 gap-1">
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Limpar</span>
          </Button>
        )}
      </div>
    </div>
  );
}
