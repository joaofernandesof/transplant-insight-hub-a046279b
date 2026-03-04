import React, { useCallback, useState, useEffect, useRef } from 'react';
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
  const [localSelected, setLocalSelected] = useState(() => parseProcedure(value));
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync from parent only when value genuinely changes externally
  useEffect(() => {
    const parsed = parseProcedure(value);
    setLocalSelected(prev => {
      const prevStr = prev.join(' + ');
      const newStr = parsed.join(' + ');
      return prevStr === newStr ? prev : parsed;
    });
  }, [value]);

  const toggle = useCallback((p: string) => {
    setLocalSelected(prev => {
      const next = prev.includes(p)
        ? prev.filter(x => x !== p)
        : [...prev, p];

      // Debounce the onChange to avoid rapid DB saves
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChangeRef.current(next.join(' + '));
      }, 400);

      return next;
    });
  }, []);

  // Cleanup
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return (
    <div className="space-y-1.5">
      {label && <Label>{label}</Label>}
      <div className="border rounded-md p-3 space-y-2">
        {PROCEDURES.map((p) => (
          <label key={p} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5 -mx-2">
            <Checkbox
              checked={localSelected.includes(p)}
              onCheckedChange={() => toggle(p)}
            />
            <span className="text-sm">{p}</span>
          </label>
        ))}
      </div>
      {localSelected.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Selecionado: {localSelected.join(' + ')}
        </p>
      )}
    </div>
  );
}
