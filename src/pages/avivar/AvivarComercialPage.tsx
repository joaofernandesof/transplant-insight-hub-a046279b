/**
 * Avivar Commercial Kanban Page
 * Lead → Triagem → Agendamento → Follow Up → Paciente
 */

import { useState } from 'react';
import { JourneyKanban } from './journey';
import { JourneyListView } from './journey/components/JourneyListView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BPMNFlow } from './journey/components/BPMNFlow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Briefcase, 
  GitBranch, 
  LayoutGrid, 
  List, 
  Search, 
  Filter, 
  X 
} from 'lucide-react';
import { COMMERCIAL_STAGES } from './journey/types';
import { cn } from '@/lib/utils';

export default function AvivarComercialPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const clearFilters = () => {
    setSearchTerm('');
    setStageFilter('all');
  };

  const hasActiveFilters = searchTerm || stageFilter !== 'all';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-[hsl(var(--avivar-foreground))]">
            <Briefcase className="h-6 w-6 text-[hsl(var(--avivar-primary))]" />
            Kanban Comercial
          </h1>
          <p className="text-[hsl(var(--avivar-muted-foreground))]">
            Gerencie leads desde a entrada até a conversão em pacientes
          </p>
        </div>

        {/* View Toggle & Filters */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "border-[hsl(var(--avivar-border))]",
              showFilters && "bg-[hsl(var(--avivar-primary)/0.1)] border-[hsl(var(--avivar-primary))]"
            )}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 w-2 h-2 bg-[hsl(var(--avivar-primary))] rounded-full" />
            )}
          </Button>

          <div className="flex border border-[hsl(var(--avivar-border))] rounded-lg p-1 bg-[hsl(var(--avivar-secondary))]">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className={cn(
                "h-8 px-3",
                viewMode === 'kanban' && "bg-[hsl(var(--avivar-primary))] text-white hover:bg-[hsl(var(--avivar-primary))]"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn(
                "h-8 px-3",
                viewMode === 'list' && "bg-[hsl(var(--avivar-primary))] text-white hover:bg-[hsl(var(--avivar-primary))]"
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-[hsl(var(--avivar-secondary))] border border-[hsl(var(--avivar-border))] rounded-xl animate-in slide-in-from-top-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
            />
          </div>

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[180px] bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]">
              <SelectValue placeholder="Filtrar por etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as etapas</SelectItem>
              {COMMERCIAL_STAGES.map(stage => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList className="bg-[hsl(var(--avivar-secondary))] border border-[hsl(var(--avivar-border))]">
          <TabsTrigger 
            value="kanban"
            className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white"
          >
            Kanban
          </TabsTrigger>
          <TabsTrigger 
            value="bpmn" 
            className="flex items-center gap-1 data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white"
          >
            <GitBranch className="h-4 w-4" />
            Fluxo BPMN
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          {viewMode === 'kanban' ? (
            <JourneyKanban 
              journeyType="comercial" 
              searchTerm={searchTerm}
              stageFilter={stageFilter}
            />
          ) : (
            <JourneyListView 
              journeyType="comercial"
              searchTerm={searchTerm}
              stageFilter={stageFilter}
            />
          )}
        </TabsContent>

        <TabsContent value="bpmn">
          <BPMNFlow />
        </TabsContent>
      </Tabs>
    </div>
  );
}
