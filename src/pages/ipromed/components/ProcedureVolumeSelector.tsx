/**
 * ProcedureVolumeSelector - Seletor de procedimentos de maior volume
 * Permite ordenar por volume apenas os procedimentos já selecionados
 */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, GripVertical, X, ArrowUp, ArrowDown } from "lucide-react";

interface ProcedureVolumeSelectorProps {
  availableProcedures: string[]; // Procedimentos disponíveis (vindos do campo "Procedimentos realizados")
  value: string[]; // Procedimentos selecionados e ordenados por volume
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function ProcedureVolumeSelector({
  availableProcedures,
  value = [],
  onChange,
  placeholder = "Selecionar procedimentos...",
}: ProcedureVolumeSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (procedure: string) => {
    if (value.includes(procedure)) {
      onChange(value.filter((p) => p !== procedure));
    } else {
      onChange([...value, procedure]);
    }
  };

  const handleRemove = (procedure: string) => {
    onChange(value.filter((p) => p !== procedure));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newValue = [...value];
    [newValue[index - 1], newValue[index]] = [newValue[index], newValue[index - 1]];
    onChange(newValue);
  };

  const moveDown = (index: number) => {
    if (index === value.length - 1) return;
    const newValue = [...value];
    [newValue[index], newValue[index + 1]] = [newValue[index + 1], newValue[index]];
    onChange(newValue);
  };

  // Filtrar apenas procedimentos que ainda não foram selecionados
  const unselectedProcedures = availableProcedures.filter(
    (p) => !value.includes(p)
  );

  if (availableProcedures.length === 0) {
    return (
      <div className="border rounded-md p-4 bg-muted/30 text-center">
        <p className="text-sm text-muted-foreground">
          Primeiro, selecione os procedimentos realizados na seção anterior.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Lista ordenada dos procedimentos selecionados */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((procedure, index) => (
            <div
              key={procedure}
              className="flex items-center gap-2 p-2 border rounded-md bg-background"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {index + 1}
              </span>
              <span className="flex-1 text-sm truncate">{procedure}</span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveDown(index)}
                  disabled={index === value.length - 1}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleRemove(procedure)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Popover para adicionar mais procedimentos */}
      {unselectedProcedures.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              <span className="text-muted-foreground">
                {value.length === 0 
                  ? placeholder 
                  : `Adicionar mais (${unselectedProcedures.length} disponíveis)`
                }
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar procedimento..." />
              <CommandList>
                <CommandEmpty>Nenhum procedimento encontrado.</CommandEmpty>
                <CommandGroup>
                  {unselectedProcedures.map((procedure) => (
                    <CommandItem
                      key={procedure}
                      value={procedure}
                      onSelect={() => {
                        handleSelect(procedure);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.includes(procedure) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{procedure}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {value.length === availableProcedures.length && availableProcedures.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Todos os procedimentos foram adicionados. Use as setas para reordenar.
        </p>
      )}
    </div>
  );
}
