import React, { useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const PROCEDURES = [
  'CABELO',
  'BARBA',
  'SOBRANCELHA',
  'BODY HAIR BARBA',
  'BODY HAIR PEITO',
];

interface ProcedureCheckboxFieldProps {
  value: string; // "CABELO + BARBA" format
  onChange: (value: string) => void;
  label?: string;
}

/**
 * Parses "CABELO + BARBA" back into ['CABELO', 'BARBA']
 */
function parseProcedure(value: string): string[] {
  if (!value?.trim()) return [];
  return value.split(' + ').map(s => s.trim()).filter(Boolean);
}

export function ProcedureCheckboxField({ value, onChange, label = 'Procedimento *' }: ProcedureCheckboxFieldProps) {
  const selected = parseProcedure(value);

  const toggle = useCallback((p: string) => {
    const next = selected.includes(p)
      ? selected.filter(x => x !== p)
      : [...selected, p];
    onChange(next.join(' + '));
  }, [selected, onChange]);

  return (
    <div className="space-y-1.5">
      {label && <Label>{label}</Label>}
      <div className="border rounded-md p-3 space-y-2">
        {PROCEDURES.map((p) => (
          <label key={p} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5 -mx-2">
            <Checkbox
              checked={selected.includes(p)}
              onCheckedChange={() => toggle(p)}
            />
            <span className="text-sm">{p}</span>
          </label>
        ))}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Selecionado: {selected.join(' + ')}
        </p>
      )}
    </div>
  );
}
