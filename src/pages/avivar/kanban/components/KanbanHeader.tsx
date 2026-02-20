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
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/avivar/leads')}
            className="hover:bg-[hsl(var(--avivar-primary)/0.1)]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${kanban.color} flex items-center justify-center`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[hsl(var(--avivar-foreground))]">
                {kanban.name}
              </h1>
              {kanban.description && (
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  {kanban.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          
          {/* Automations Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={canAccessAutomations ? () => navigate(`/avivar/automations/${kanban.id}`) : undefined}
                  className={canAccessAutomations
                    ? "border-orange-500/30 text-orange-500 hover:bg-orange-500/10 hover:text-orange-600"
                    : "border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] opacity-60 cursor-not-allowed"
                  }
                  disabled={!canAccessAutomations}
                >
                  {canAccessAutomations ? (
                    <Zap className="h-4 w-4 mr-2" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Automações
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
            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Lead
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-[hsl(var(--avivar-primary)/0.1)]"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
      <div className="flex items-center gap-3 px-4 pb-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
          <Input
            placeholder="Buscar por nome, telefone, tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] focus:border-[hsl(var(--avivar-primary))]"
          />
        </div>

        {/* Filter Button */}
        <Button variant="outline" className="border-[hsl(var(--avivar-border))]">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>

        {/* Refresh Button - Minimalista */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-[hsl(var(--avivar-border))] hover:bg-[hsl(var(--avivar-primary)/0.1)] hover:border-[hsl(var(--avivar-primary))] transition-all duration-200 gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>

        {/* Lead Count */}
        <div className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
          {isFiltered ? (
            <span>
              <Badge variant="secondary" className="mr-1">{filteredLeads}</Badge>
              de {totalLeads} leads
            </span>
          ) : (
            <span>Total: <Badge variant="secondary">{totalLeads}</Badge> leads</span>
          )}
        </div>
      </div>
    </div>
  );
}
