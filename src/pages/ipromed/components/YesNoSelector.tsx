/**
 * YesNoSelector - Seletor visual de Sim/Não com ícones
 * Substitui checkboxes booleanos por uma interface mais clara
 */

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface YesNoSelectorProps {
  value: boolean | undefined;
  onChange: (value: boolean) => void;
  label: string;
  className?: string;
}

export function YesNoSelector({ value, onChange, label, className }: YesNoSelectorProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4 p-3 rounded-md border", className)}>
      <span className="text-sm font-normal">{label}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all border",
            value === true
              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
              : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:border-border"
          )}
        >
          <Check className="h-4 w-4" />
          Sim
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all border",
            value === false
              ? "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700"
              : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:border-border"
          )}
        >
          <X className="h-4 w-4" />
          Não
        </button>
      </div>
    </div>
  );
}
