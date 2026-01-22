import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Building, Tag, BarChart3, ChevronDown, X, Filter, Calendar, 
  MapPin, User, Activity 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
  color?: string;
}

interface FilterDropdownProps {
  icon: React.ReactNode;
  label: string;
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  getOptionColor?: (value: string) => string;
}

// Single filter dropdown component
function FilterDropdown({
  icon,
  label,
  options,
  selectedValues,
  onSelectionChange,
  getOptionColor,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter(v => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  const selectAll = () => {
    onSelectionChange(options.map(o => o.value));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-2 border-dashed",
            selectedValues.length > 0 && "border-primary bg-primary/5"
          )}
        >
          {icon}
          <span>{label}</span>
          {selectedValues.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs font-normal">
              {selectedValues.length}
            </Badge>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 bg-popover" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{label}</p>
            <div className="flex gap-1">
              {selectedValues.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs text-muted-foreground"
                  onClick={clearSelection}
                >
                  Limpar
                </Button>
              )}
              {selectedValues.length < options.length && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={selectAll}
                >
                  Todos
                </Button>
              )}
            </div>
          </div>
        </div>
        <ScrollArea className="h-[280px]">
          <div className="p-2 space-y-1">
            {options.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma opção disponível
              </p>
            ) : (
              options.map(option => {
                const isSelected = selectedValues.includes(option.value);
                const colorClass = getOptionColor?.(option.value) || '';
                
                return (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center gap-3 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                      isSelected 
                        ? "bg-primary/10" 
                        : "hover:bg-muted"
                    )}
                    onClick={() => toggleValue(option.value)}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="pointer-events-none"
                    />
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      {colorClass ? (
                        <Badge className={cn("text-xs shrink-0", colorClass)}>
                          {option.label}
                        </Badge>
                      ) : (
                        <span className="text-sm truncate">{option.label}</span>
                      )}
                    </div>
                    {option.count !== undefined && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({option.count})
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// Main export - all patient filters
interface PatientFiltersProps {
  branches: string[];
  categories: string[];
  grades: string[];
  statuses?: string[];
  selectedBranches: string[];
  selectedCategories: string[];
  selectedGrades: string[];
  selectedStatuses?: string[];
  onBranchChange: (values: string[]) => void;
  onCategoryChange: (values: string[]) => void;
  onGradeChange: (values: string[]) => void;
  onStatusChange?: (values: string[]) => void;
  stats?: {
    byBranch?: Record<string, number>;
    byCategory?: Record<string, number>;
    byGrade?: Record<string, number>;
    byStatus?: Record<string, number>;
  };
  getCategoryColor?: (value: string) => string;
  getBranchColor?: (value: string) => string;
  getGradeColor?: (value: string) => string;
}

export function PatientFiltersDropdown({
  branches,
  categories,
  grades,
  statuses = [],
  selectedBranches,
  selectedCategories,
  selectedGrades,
  selectedStatuses = [],
  onBranchChange,
  onCategoryChange,
  onGradeChange,
  onStatusChange,
  stats,
  getCategoryColor,
  getBranchColor,
  getGradeColor,
}: PatientFiltersProps) {
  const totalFilters = selectedBranches.length + selectedCategories.length + selectedGrades.length + selectedStatuses.length;

  const clearAllFilters = () => {
    onBranchChange([]);
    onCategoryChange([]);
    onGradeChange([]);
    onStatusChange?.([]);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Filtros:</span>
      </div>

      <FilterDropdown
        icon={<Building className="h-4 w-4" />}
        label="Filial"
        options={branches.map(b => ({
          value: b,
          label: b,
          count: stats?.byBranch?.[b],
        }))}
        selectedValues={selectedBranches}
        onSelectionChange={onBranchChange}
        getOptionColor={getBranchColor}
      />

      <FilterDropdown
        icon={<Tag className="h-4 w-4" />}
        label="Categoria"
        options={categories.map(c => ({
          value: c,
          label: c,
          count: stats?.byCategory?.[c],
        }))}
        selectedValues={selectedCategories}
        onSelectionChange={onCategoryChange}
        getOptionColor={getCategoryColor}
      />

      <FilterDropdown
        icon={<BarChart3 className="h-4 w-4" />}
        label="Grau"
        options={grades.map(g => ({
          value: g,
          label: `Grau ${g}`,
          count: stats?.byGrade?.[g],
        }))}
        selectedValues={selectedGrades}
        onSelectionChange={onGradeChange}
        getOptionColor={getGradeColor}
      />

      {statuses.length > 0 && onStatusChange && (
        <FilterDropdown
          icon={<Activity className="h-4 w-4" />}
          label="Status"
          options={statuses.map(s => ({
            value: s,
            label: s,
            count: stats?.byStatus?.[s],
          }))}
          selectedValues={selectedStatuses}
          onSelectionChange={onStatusChange}
        />
      )}

      {/* Active filters summary */}
      {totalFilters > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-1.5 text-destructive hover:text-destructive"
          onClick={clearAllFilters}
        >
          <X className="h-3.5 w-3.5" />
          Limpar ({totalFilters})
        </Button>
      )}
    </div>
  );
}

export { FilterDropdown };
