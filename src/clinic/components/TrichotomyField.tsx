import React, { useState, useEffect } from 'react';
import { Scissors, Pencil, XCircle, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format, parse } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TrichotomyFieldProps {
  value: string | null;
  onSave: (value: string) => void;
}

export function TrichotomyField({ value, onSave }: TrichotomyFieldProps) {
  const [localValue, setLocalValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Reset local state when value changes externally
    if (!isEditing) {
      setLocalValue(value && !value.includes('/') ? value.substring(0, 16) : '');
    }
  }, [value, isEditing]);

  const handleSaveDatetime = () => {
    if (localValue) {
      onSave(localValue);
      setIsEditing(false);
    }
  };

  const handleNoMarking = () => {
    onSave('NÃO TEM MARCAÇÃO');
    setIsEditing(false);
  };

  const handleClear = () => {
    onSave('');
    setIsEditing(true);
    setLocalValue('');
  };

  const isNoMarking = value === 'NÃO TEM MARCAÇÃO';
  const hasValue = !!value && value !== 'NÃO TEM MARCAÇÃO';

  const formatDisplay = (val: string) => {
    try {
      // datetime-local format: YYYY-MM-DDThh:mm
      const date = new Date(val);
      if (isNaN(date.getTime())) return val;
      return format(date, 'dd-MM HH:mm');
    } catch {
      return val;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Scissors className="h-4 w-4" />
        <span>Tricotomia</span>
      </div>

      {isNoMarking && !isEditing ? (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-amber-600 border-amber-600/30 bg-amber-500/10">
            NÃO TEM MARCAÇÃO
          </Badge>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleClear}>
            <Pencil className="h-3 w-3 mr-1" /> Alterar
          </Button>
        </div>
      ) : hasValue && !isEditing ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{value}</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditing(true)}>
            <Pencil className="h-3 w-3 mr-1" /> Alterar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              type="datetime-local"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              className="h-8 text-sm flex-1"
            />
            <Button
              variant="default"
              size="sm"
              className="h-8 px-3"
              disabled={!localValue}
              onClick={handleSaveDatetime}
            >
              <Check className="h-3 w-3 mr-1" /> Salvar
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit h-7 text-xs text-amber-600 border-amber-600/30 hover:bg-amber-500/10"
            onClick={handleNoMarking}
          >
            <XCircle className="h-3 w-3 mr-1" /> Não tem marcação
          </Button>
        </div>
      )}
    </div>
  );
}
