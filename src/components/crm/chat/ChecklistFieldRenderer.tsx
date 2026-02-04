/**
 * Renderiza um campo de checklist baseado no tipo
 * Suporta: text, number, boolean, select, date, url, textarea, etc.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChecklistField {
  id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  value: string | boolean | null;
  options?: string[];
}

interface Props {
  field: ChecklistField;
  leadPhone?: string | null;
  columnId?: string | null;
  onUpdate?: () => void;
}

export function ChecklistFieldRenderer({ field, leadPhone, columnId, onUpdate }: Props) {
  const [localValue, setLocalValue] = useState<string>(
    typeof field.value === 'string' ? field.value : ''
  );
  const [boolValue, setBoolValue] = useState<boolean>(
    typeof field.value === 'boolean' ? field.value : false
  );
  const [multiSelectValues, setMultiSelectValues] = useState<string[]>(() => {
    if (typeof field.value === 'string' && field.value) {
      try {
        const parsed = JSON.parse(field.value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return field.value.split(',').map(v => v.trim()).filter(Boolean);
      }
    }
    return [];
  });
  const [multiSelectSearch, setMultiSelectSearch] = useState('');
  const [multiSelectOpen, setMultiSelectOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isEditingRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedValueRef = useRef<string>(localValue);
  const lastSavedBoolRef = useRef<boolean>(boolValue);
  const lastSavedMultiRef = useRef<string[]>(multiSelectValues);

  // Only sync from props when NOT actively editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (field.field_type === 'boolean') {
        const newBool = typeof field.value === 'boolean' ? field.value : false;
        setBoolValue(newBool);
        lastSavedBoolRef.current = newBool;
      } else if (field.field_type === 'multiselect') {
        if (typeof field.value === 'string' && field.value) {
          try {
            const parsed = JSON.parse(field.value);
            const newValues = Array.isArray(parsed) ? parsed : [];
            setMultiSelectValues(newValues);
            lastSavedMultiRef.current = newValues;
          } catch {
            const newValues = field.value.split(',').map(v => v.trim()).filter(Boolean);
            setMultiSelectValues(newValues);
            lastSavedMultiRef.current = newValues;
          }
        } else {
          setMultiSelectValues([]);
          lastSavedMultiRef.current = [];
        }
      } else {
        const newValue = typeof field.value === 'string' ? field.value : '';
        setLocalValue(newValue);
        lastSavedValueRef.current = newValue;
      }
    }
  }, [field.value, field.field_type]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const saveToDatabase = useCallback(async (value: string | boolean) => {
    if (!leadPhone || !columnId) return;

    const isBoolean = typeof value === 'boolean';
    if (isBoolean && value === lastSavedBoolRef.current) return;
    if (!isBoolean && value === lastSavedValueRef.current) return;

    setIsSaving(true);
    try {
      const { data: lead, error: fetchError } = await supabase
        .from('avivar_kanban_leads')
        .select('id, custom_fields')
        .eq('phone', leadPhone)
        .eq('column_id', columnId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!lead) return;

      const currentFields = (lead.custom_fields as Record<string, string | boolean | null>) || {};
      const updatedFields: Record<string, string | boolean | null> = {
        ...currentFields,
        [field.field_key]: isBoolean ? value : (value || null)
      };

      const { error: updateError } = await supabase
        .from('avivar_kanban_leads')
        .update({ custom_fields: updatedFields as unknown as Record<string, never> })
        .eq('id', lead.id);

      if (updateError) throw updateError;

      if (isBoolean) {
        lastSavedBoolRef.current = value;
      } else {
        lastSavedValueRef.current = value as string;
      }
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao salvar campo:', error);
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
      isEditingRef.current = false;
    }
  }, [leadPhone, columnId, field.field_key, onUpdate]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    isEditingRef.current = true;
    setLocalValue(value);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveToDatabase(value);
    }, 800);
  }, [saveToDatabase]);

  const handleBlur = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (localValue !== lastSavedValueRef.current) {
      saveToDatabase(localValue);
    } else {
      isEditingRef.current = false;
    }
  }, [localValue, saveToDatabase]);

  const handleToggle = useCallback(() => {
    const newValue = !boolValue;
    setBoolValue(newValue);
    saveToDatabase(newValue);
  }, [boolValue, saveToDatabase]);

  const handleSelectChange = useCallback((value: string) => {
    setLocalValue(value);
    saveToDatabase(value);
  }, [saveToDatabase]);

  const handleMultiSelectToggle = useCallback((option: string) => {
    const newValues = multiSelectValues.includes(option)
      ? multiSelectValues.filter(v => v !== option)
      : [...multiSelectValues, option];
    
    setMultiSelectValues(newValues);
    const jsonValue = JSON.stringify(newValues);
    saveToDatabase(jsonValue);
    lastSavedMultiRef.current = newValues;
  }, [multiSelectValues, saveToDatabase]);

  const handleSelectAll = useCallback(() => {
    const availableOptions = (field.options || []).filter(opt => opt.trim());
    const allSelected = availableOptions.every(opt => multiSelectValues.includes(opt));
    
    const newValues = allSelected ? [] : [...availableOptions];
    setMultiSelectValues(newValues);
    const jsonValue = JSON.stringify(newValues);
    saveToDatabase(jsonValue);
    lastSavedMultiRef.current = newValues;
  }, [field.options, multiSelectValues, saveToDatabase]);

  const filteredOptions = (field.options || []).filter(opt => 
    opt.trim() && opt.toLowerCase().includes(multiSelectSearch.toLowerCase())
  );

  // Renderização baseada no tipo
  switch (field.field_type) {
    case 'boolean':
      return (
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wide whitespace-nowrap">
            {field.field_label}
            {field.is_required && <span className="text-[hsl(var(--avivar-primary))] ml-0.5">*</span>}
          </Label>
          <button
            type="button"
            onClick={handleToggle}
            disabled={isSaving}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--avivar-primary))] ${
              boolValue 
                ? 'bg-[hsl(var(--avivar-primary))]' 
                : 'bg-[hsl(var(--avivar-muted))]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                boolValue ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      );

    case 'select':
      return (
        <div className="flex items-center gap-3">
          <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wide whitespace-nowrap shrink-0">
            {field.field_label}
            {field.is_required && <span className="text-[hsl(var(--avivar-primary))] ml-0.5">*</span>}
          </Label>
          <Select
            value={localValue || ''}
            onValueChange={handleSelectChange}
            disabled={isSaving}
          >
            <SelectTrigger className="h-7 text-sm bg-transparent border-0 border-b border-[hsl(var(--avivar-primary))] rounded-none px-0 focus:ring-0 text-[hsl(var(--avivar-foreground))] flex-1">
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).filter(opt => opt.trim()).map((option, idx) => (
                <SelectItem key={idx} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'multiselect':
      const availableOptions = (field.options || []).filter(opt => opt.trim());
      const allSelected = availableOptions.length > 0 && availableOptions.every(opt => multiSelectValues.includes(opt));
      
      return (
        <div className="flex items-center gap-3">
          <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wide whitespace-nowrap shrink-0">
            {field.field_label}
            {field.is_required && <span className="text-[hsl(var(--avivar-primary))] ml-0.5">*</span>}
          </Label>
          <Popover open={multiSelectOpen} onOpenChange={setMultiSelectOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={isSaving}
                className="h-7 text-sm bg-transparent border-0 border-b border-[hsl(var(--avivar-primary))] rounded-none px-0 text-[hsl(var(--avivar-foreground))] flex-1 flex items-center justify-between gap-2 text-left"
              >
                <span className="truncate text-[hsl(var(--avivar-muted-foreground)/0.7)]">
                  {multiSelectValues.length > 0 
                    ? `${multiSelectValues.length} selecionado(s)` 
                    : 'Selecionar...'}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0 bg-white border border-[hsl(var(--avivar-border))] shadow-lg" align="start">
              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[hsl(var(--avivar-border))]">
                <Search className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                <input
                  type="text"
                  value={multiSelectSearch}
                  onChange={(e) => setMultiSelectSearch(e.target.value)}
                  placeholder="Buscar"
                  className="flex-1 text-sm bg-transparent border-0 outline-none placeholder:text-[hsl(var(--avivar-muted-foreground)/0.5)]"
                />
              </div>
              
              {/* Select All */}
              <div 
                className="flex items-center gap-2 px-3 py-2 border-b border-[hsl(var(--avivar-border))] cursor-pointer hover:bg-[hsl(var(--avivar-muted)/0.3)]"
                onClick={handleSelectAll}
              >
                <Checkbox 
                  checked={allSelected}
                  className="border-[hsl(var(--avivar-border))]"
                />
                <span className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Selecionar tudo</span>
              </div>
              
              {/* Options */}
              <div className="max-h-40 overflow-y-auto">
                {filteredOptions.map((option, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[hsl(var(--avivar-muted)/0.3)]"
                    onClick={() => handleMultiSelectToggle(option)}
                  >
                    <Checkbox 
                      checked={multiSelectValues.includes(option)}
                      className="border-[hsl(var(--avivar-border))]"
                    />
                    <span className="text-sm">{option}</span>
                  </div>
                ))}
                {filteredOptions.length === 0 && (
                  <div className="px-3 py-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                    Nenhuma opção encontrada
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      );

    case 'text':
    default:
      return (
        <div className="flex items-center gap-3">
          <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wide whitespace-nowrap shrink-0">
            {field.field_label}
            {field.is_required && <span className="text-[hsl(var(--avivar-primary))] ml-0.5">*</span>}
          </Label>
          <Input
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="..."
            disabled={isSaving}
            className="h-6 text-sm bg-transparent border-0 border-b border-[hsl(var(--avivar-primary))] rounded-none px-0 focus-visible:ring-0 focus-visible:border-[hsl(var(--avivar-primary))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground)/0.5)] flex-1"
          />
        </div>
      );
  }
}
