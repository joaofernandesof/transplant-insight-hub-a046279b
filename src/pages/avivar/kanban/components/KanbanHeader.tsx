/**
 * KanbanHeader - Fixed header with search, filters, and actions
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, ArrowLeft, Search, Filter, RefreshCw,
  MoreHorizontal, Upload, Download, Zap, Lock,
  Briefcase, HeartPulse, TrendingUp, Users, LayoutGrid as LayoutGridIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { ViewModeToggle, ViewMode } from './ViewModeToggle';
import type { KanbanColumnData } from '../AvivarKanbanPage';

interface KanbanHeaderProps {
  kanban: {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    color: string;
  };
  columns: KanbanColumnData[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onAddLead: () => void;
  onImport: () => void;
  onExport: () => void;
  onRefresh: () => Promise<void> | void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalLeads: number;
  filteredLeads: number;
  visibleColumns: string[];
  onToggleColumnVisibility: (columnId: string) => void;
  isRefreshing?: boolean;
}

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'heart-pulse': return HeartPulse;
    case 'trending-up': return TrendingUp;
    case 'users': return Users;
    case 'layout-grid': return LayoutGridIcon;
    default: return Briefcase;
  }
};

export function KanbanHeader({
  kanban,
  columns,
  viewMode,
  onViewModeChange,
  onAddLead,
  onImport,
  onExport,
  onRefresh,
  searchQuery,
  onSearchChange,
  totalLeads,
  filteredLeads,
  visibleColumns,
  onToggleColumnVisibility,
  isRefreshing = false,
}: KanbanHeaderProps) {
  const [isLocalRefreshing, setIsLocalRefreshing] = useState(false);
  const refreshing = isRefreshing || isLocalRefreshing;

  const handleRefresh = async () => {
    setIsLocalRefreshing(true);
    try {
      await onRefresh();
    } finally {
      // Small delay for visual feedback
      setTimeout(() => setIsLocalRefreshing(false), 500);
    }
  };
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin } = useAvivarAccount();
  const canAccessAutomations = isAdmin || isSuperAdmin;
  const Icon = getIconComponent(kanban.icon);
  const isFiltered = searchQuery.length > 0;

  return (
    <div className="sticky top-0 z-20 bg-[hsl(var(--avivar-background))] border-b border-[hsl(var(--avivar-border))]">
      {/* Main Header Row */}
      <div className="flex items-center justify-between p-3 md:p-4 gap-2">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/avivar/leads')}
            className="hover:bg-[hsl(var(--avivar-primary)/0.1)] shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br ${kanban.color} flex items-center justify-center shrink-0`}>
              <Icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold text-[hsl(var(--avivar-foreground))] truncate">
                {kanban.name}
              </h1>
              {kanban.description && (
                <p className="text-xs md:text-sm text-[hsl(var(--avivar-muted-foreground))] truncate hidden sm:block">
                  {kanban.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-3 shrink-0">
          <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          
          {/* Automations Button - hidden on small screens */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={canAccessAutomations ? () => navigate(`/avivar/automations/${kanban.id}`) : undefined}
                  className={cn(
                    "hidden md:flex",
                    canAccessAutomations
                      ? "border-orange-500/30 text-orange-500 hover:bg-orange-500/10 hover:text-orange-600"
                      : "border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] opacity-60 cursor-not-allowed"
                  )}
                  disabled={!canAccessAutomations}
                >
                  {canAccessAutomations ? (
                    <Zap className="h-4 w-4 mr-1" />
                  ) : (
                    <Lock className="h-4 w-4 mr-1" />
                  )}
                  <span className="hidden lg:inline">Automações</span>
                </Button>
              </TooltipTrigger>
              {!canAccessAutomations && (
                <TooltipContent>
                  <p>Funcionalidade em implementação. Disponível apenas para administradores.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          {/* Primary Action: Add Lead */}
          <Button
            onClick={onAddLead}
            size="sm"
            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
          >
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Adicionar Lead</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-[hsl(var(--avivar-primary)/0.1)] h-8 w-8"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Automations on mobile */}
              {canAccessAutomations && (
                <>
                  <DropdownMenuItem onClick={() => navigate(`/avivar/automations/${kanban.id}`)} className="cursor-pointer md:hidden">
                    <Zap className="h-4 w-4 mr-2 text-orange-500" />
                    Automações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="md:hidden" />
                </>
              )}
              {/* Column Visibility */}
              <div className="px-2 py-1.5 text-xs font-semibold text-[hsl(var(--avivar-muted-foreground))]">
                Colunas Visíveis
              </div>
              {columns.map(col => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={visibleColumns.includes(col.id)}
                  onCheckedChange={() => onToggleColumnVisibility(col.id)}
                >
                  {col.name}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onImport} className="cursor-pointer">
                <Download className="h-4 w-4 mr-2 text-red-500" />
                Importar Leads
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExport} className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2 text-green-500" />
                Exportar Leads
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search and Filters Row */}
      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 pb-3 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[150px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] focus:border-[hsl(var(--avivar-primary))]"
          />
        </div>

        {/* Filter Button */}
        <Button variant="outline" size="sm" className="border-[hsl(var(--avivar-border))] hidden sm:flex">
          <Filter className="h-4 w-4 mr-1" />
          Filtros
        </Button>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-[hsl(var(--avivar-border))] hover:bg-[hsl(var(--avivar-primary)/0.1)] hover:border-[hsl(var(--avivar-primary))] transition-all duration-200 gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
        </Button>

        {/* Lead Count */}
        <div className="text-xs md:text-sm text-[hsl(var(--avivar-muted-foreground))] shrink-0">
          {isFiltered ? (
            <span>
              <Badge variant="secondary" className="mr-1">{filteredLeads}</Badge>
              de {totalLeads}
            </span>
          ) : (
            <span><Badge variant="secondary">{totalLeads}</Badge> leads</span>
          )}
        </div>
      </div>
    </div>
  );
}
