/**
 * KanbanHeader - Fixed header with search, filters, and actions
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, ArrowLeft, Search, Filter, RefreshCw,
  MoreHorizontal, Upload, Download, ListChecks, Eye, EyeOff,
  Briefcase, HeartPulse, TrendingUp, Users, LayoutGrid as LayoutGridIcon,
} from 'lucide-react';
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
  onAddColumn: () => void;
  onAddLead: () => void;
  onImport: () => void;
  onExport: () => void;
  onChecklist: () => void;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalLeads: number;
  filteredLeads: number;
  visibleColumns: string[];
  onToggleColumnVisibility: (columnId: string) => void;
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
  onAddColumn,
  onAddLead,
  onImport,
  onExport,
  onChecklist,
  onRefresh,
  searchQuery,
  onSearchChange,
  totalLeads,
  filteredLeads,
  visibleColumns,
  onToggleColumnVisibility,
}: KanbanHeaderProps) {
  const navigate = useNavigate();
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
          
          {/* Primary Action: Add Lead */}
          <Button
            onClick={onAddLead}
            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Lead
          </Button>
          
          {viewMode === 'kanban' && (
            <Button
              variant="outline"
              onClick={onAddColumn}
              className="border-[hsl(var(--avivar-border))]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Coluna
            </Button>
          )}

          {/* Checklist Button - Visible */}
          <Button
            variant="outline"
            onClick={onChecklist}
            className="border-[hsl(var(--avivar-border))] gap-2"
          >
            <ListChecks className="h-4 w-4" />
            Checklist
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

        {/* Refresh Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          className="hover:bg-[hsl(var(--avivar-primary)/0.1)]"
        >
          <RefreshCw className="h-4 w-4" />
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
