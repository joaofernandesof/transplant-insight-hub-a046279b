/**
 * Renderiza um campo de checklist baseado no tipo
 * Suporta: text, number, boolean, select, date, url, textarea, etc.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, Search, Calendar as CalendarIcon, FileText, Upload, X, ExternalLink, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  leadId?: string | null;
  leadPhone?: string | null;
  columnId?: string | null;
  onUpdate?: () => void;
}

export function ChecklistFieldRenderer({ field, leadId, leadPhone, columnId, onUpdate }: Props) {
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
  const [textareaOpen, setTextareaOpen] = useState(false);
  const [textareaValue, setTextareaValue] = useState(localValue);
  
  // Datetime field states
  const [datetimeOpen, setDatetimeOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    if (field.field_type === 'datetime' && field.value) {
      const parsed = new Date(field.value as string);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
  });
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    if (field.field_type === 'datetime' && field.value) {
      const parsed = new Date(field.value as string);
      if (!isNaN(parsed.getTime())) {
        return format(parsed, 'HH:mm');
      }
    }
    return '';
  });
  const [editableValue, setEditableValue] = useState<string>(() => {
    if (field.field_type === 'datetime' && field.value) {
      const parsed = new Date(field.value as string);
      if (!isNaN(parsed.getTime())) {
        return format(parsed, 'dd.MM.yyyy HH:mm');
      }
    }
    return '';
  });
  
  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

    case 'date':
      const dateValue = localValue ? new Date(localValue) : undefined;
      const handleDateSelect = (date: Date | undefined) => {
        if (date) {
          const isoDate = date.toISOString().split('T')[0];
          setLocalValue(isoDate);
          saveToDatabase(isoDate);
        }
      };
      
      return (
        <div className="flex items-center gap-3">
          <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wide whitespace-nowrap shrink-0">
            {field.field_label}
            {field.is_required && <span className="text-[hsl(var(--avivar-primary))] ml-0.5">*</span>}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={isSaving}
                className="h-6 flex items-center gap-2 text-sm bg-transparent border-0 border-b border-[hsl(var(--avivar-primary))] px-0 text-[hsl(var(--avivar-foreground))] focus:outline-none"
              >
                <span className="text-[hsl(var(--avivar-muted-foreground)/0.7)]">
                  {dateValue ? format(dateValue, 'dd/MM/yyyy') : '...'}
                </span>
                <CalendarIcon className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-auto p-0 bg-background border border-border shadow-lg" 
              align="start"
            >
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={handleDateSelect}
                initialFocus
                locale={ptBR}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
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
            <PopoverContent className="w-56 p-0 bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))] shadow-lg" align="start">
              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[hsl(var(--avivar-border))]">
                <Search className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                <input
                  type="text"
                  value={multiSelectSearch}
                  onChange={(e) => setMultiSelectSearch(e.target.value)}
                  placeholder="Buscar"
                  className="flex-1 text-sm bg-transparent border-0 outline-none text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground)/0.5)]"
                />
              </div>
              
              {/* Select All */}
              <div 
                className="flex items-center gap-2 px-3 py-2 border-b border-[hsl(var(--avivar-border))] cursor-pointer hover:bg-[hsl(var(--avivar-muted)/0.3)]"
                onClick={handleSelectAll}
              >
                <Checkbox 
                  checked={allSelected}
                  className="border-[hsl(var(--avivar-muted-foreground))] data-[state=checked]:bg-[hsl(var(--avivar-primary))] data-[state=checked]:border-[hsl(var(--avivar-primary))]"
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
                      className="border-[hsl(var(--avivar-muted-foreground))] data-[state=checked]:bg-[hsl(var(--avivar-primary))] data-[state=checked]:border-[hsl(var(--avivar-primary))]"
                    />
                    <span className="text-sm text-[hsl(var(--avivar-foreground))]">{option}</span>
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

    case 'textarea':
      const textPreview = localValue ? (localValue.length > 30 ? localValue.substring(0, 30) + '...' : localValue) : '';
      
      const handleTextareaSave = () => {
        setLocalValue(textareaValue);
        saveToDatabase(textareaValue);
        setTextareaOpen(false);
      };

      const handleTextareaOpen = (open: boolean) => {
        if (open) {
          setTextareaValue(localValue);
        }
        setTextareaOpen(open);
      };
      
      return (
        <div className="flex items-center gap-3">
          <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wide whitespace-nowrap shrink-0">
            {field.field_label}
            {field.is_required && <span className="text-[hsl(var(--avivar-primary))] ml-0.5">*</span>}
          </Label>
          <Dialog open={textareaOpen} onOpenChange={handleTextareaOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="h-6 flex-1 flex items-center gap-2 text-sm bg-transparent border-0 border-b border-[hsl(var(--avivar-primary))] px-0 text-left focus:outline-none hover:opacity-80 transition-opacity"
              >
                <span className={`truncate ${localValue ? 'text-[hsl(var(--avivar-foreground))]' : 'text-[hsl(var(--avivar-muted-foreground)/0.5)]'}`}>
                  {textPreview || '...'}
                </span>
                <FileText className="h-3 w-3 shrink-0 text-[hsl(var(--avivar-muted-foreground))]" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <DialogHeader>
                <DialogTitle className="text-[hsl(var(--avivar-foreground))]">{field.field_label}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={textareaValue}
                  onChange={(e) => setTextareaValue(e.target.value)}
                  placeholder="Digite o texto..."
                  className="min-h-[200px] bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground)/0.5)] resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setTextareaOpen(false)}
                    className="px-3 py-1.5 text-sm text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleTextareaSave}
                    disabled={isSaving}
                    className="px-3 py-1.5 text-sm bg-[hsl(var(--avivar-primary))] text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );

    case 'datetime':
      // Generate time slots from 00:00 to 23:30 (30 min intervals)
      const timeSlots = Array.from({ length: 48 }, (_, i) => {
        const hours = Math.floor(i / 2);
        const minutes = (i % 2) * 30;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      });

      const handleDatetimeSelect = (date: Date | undefined) => {
        setSelectedDate(date);
        if (date && selectedTime) {
          const [hours, minutes] = selectedTime.split(':').map(Number);
          const combined = new Date(date);
          combined.setHours(hours, minutes, 0, 0);
          const isoValue = combined.toISOString();
          setLocalValue(isoValue);
          setEditableValue(format(combined, 'dd.MM.yyyy HH:mm'));
          saveToDatabase(isoValue);
          setDatetimeOpen(false);
        }
      };

      const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
        if (selectedDate) {
          const [hours, minutes] = time.split(':').map(Number);
          const combined = new Date(selectedDate);
          combined.setHours(hours, minutes, 0, 0);
          const isoValue = combined.toISOString();
          setLocalValue(isoValue);
          setEditableValue(format(combined, 'dd.MM.yyyy HH:mm'));
          saveToDatabase(isoValue);
          setDatetimeOpen(false);
        }
      };

      const handleEditableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditableValue(e.target.value);
      };

      const handleEditableBlur = () => {
        // Parse editable value: dd.MM.yyyy HH:mm
        const match = editableValue.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);
        if (match) {
          const [, day, month, year, hours, minutes] = match;
          const parsed = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hours),
            parseInt(minutes)
          );
          if (!isNaN(parsed.getTime())) {
            const isoValue = parsed.toISOString();
            setLocalValue(isoValue);
            setSelectedDate(parsed);
            setSelectedTime(format(parsed, 'HH:mm'));
            saveToDatabase(isoValue);
            return;
          }
        }
        // If invalid, reset to last valid value
        if (localValue) {
          const parsed = new Date(localValue);
          if (!isNaN(parsed.getTime())) {
            setEditableValue(format(parsed, 'dd.MM.yyyy HH:mm'));
          }
        }
      };

      const hasValue = localValue && editableValue;

      return (
        <div className="flex items-center gap-3">
          <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wide whitespace-nowrap shrink-0">
            {field.field_label}
            {field.is_required && <span className="text-[hsl(var(--avivar-primary))] ml-0.5">*</span>}
          </Label>
          
          {hasValue ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editableValue}
                onChange={handleEditableChange}
                onBlur={handleEditableBlur}
                placeholder="dd.MM.yyyy HH:mm"
                disabled={isSaving}
                className="h-6 text-sm bg-transparent border-0 border-b border-[hsl(var(--avivar-primary))] rounded-none px-0 focus-visible:ring-0 text-[hsl(var(--avivar-foreground))] w-32"
              />
              <Popover open={datetimeOpen} onOpenChange={setDatetimeOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={isSaving}
                    className="p-1 hover:opacity-70 transition-opacity"
                  >
                    <CalendarIcon className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 bg-background border border-border shadow-lg flex" 
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDatetimeSelect}
                    initialFocus
                    locale={ptBR}
                    className="p-3 pointer-events-auto"
                  />
                  <div className="border-l border-border w-20 max-h-[300px] overflow-y-auto">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleTimeSelect(time)}
                        className={`w-full px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors ${
                          selectedTime === time ? 'bg-primary text-primary-foreground' : ''
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <Popover open={datetimeOpen} onOpenChange={setDatetimeOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={isSaving}
                  className="h-6 flex items-center gap-2 text-sm bg-transparent border-0 border-b border-[hsl(var(--avivar-primary))] px-0 focus:outline-none hover:opacity-80 transition-opacity"
                >
                  <span className="text-[hsl(var(--avivar-muted-foreground)/0.5)]">...</span>
                  <CalendarIcon className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-0 bg-background border border-border shadow-lg flex" 
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDatetimeSelect}
                  initialFocus
                  locale={ptBR}
                  className="p-3 pointer-events-auto"
                />
                <div className="border-l border-border w-20 max-h-[300px] overflow-y-auto">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleTimeSelect(time)}
                      className={`w-full px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors ${
                        selectedTime === time ? 'bg-primary text-primary-foreground' : ''
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      );

    case 'file':
      const handleFileClick = () => {
        fileInputRef.current?.click();
      };

      const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error('Arquivo muito grande. Máximo 10MB.');
          return;
        }

        setIsUploading(true);
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${leadId}/${field.field_key}_${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('avivar-media')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('avivar-media')
            .getPublicUrl(fileName);

          const fileUrl = urlData.publicUrl;
          setLocalValue(fileUrl);
          saveToDatabase(fileUrl);
          toast.success('Arquivo enviado com sucesso!');
        } catch (error) {
          console.error('Error uploading file:', error);
          toast.error('Erro ao enviar arquivo');
        } finally {
          setIsUploading(false);
          // Reset input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      const handleRemoveFile = async () => {
        if (localValue) {
          try {
            // Extract file path from URL
            const url = new URL(localValue);
            const pathParts = url.pathname.split('/avivar-media/');
            if (pathParts.length > 1) {
              await supabase.storage
                .from('avivar-media')
                .remove([decodeURIComponent(pathParts[1])]);
            }
          } catch (error) {
            console.error('Error removing file:', error);
          }
        }
        setLocalValue('');
        saveToDatabase('');
      };

      const getFileName = (url: string) => {
        try {
          const decoded = decodeURIComponent(url);
          const parts = decoded.split('/');
          const fullName = parts[parts.length - 1];
          // Remove timestamp prefix
          const nameMatch = fullName.match(/_\d+\.(.+)$/);
          if (nameMatch) {
            return `arquivo.${nameMatch[1]}`;
          }
          return fullName.length > 20 ? fullName.substring(0, 17) + '...' : fullName;
        } catch {
          return 'arquivo';
        }
      };

      return (
        <div className="flex items-center gap-3">
          <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wide whitespace-nowrap shrink-0">
            {field.field_label}
            {field.is_required && <span className="text-[hsl(var(--avivar-primary))] ml-0.5">*</span>}
          </Label>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept="*/*"
          />
          
          {localValue ? (
            <div className="flex items-center gap-2 flex-1">
              <a
                href={localValue}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[hsl(var(--avivar-primary))] hover:underline flex items-center gap-1 truncate"
              >
                {getFileName(localValue)}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={isSaving}
                className="p-0.5 hover:bg-[hsl(var(--avivar-muted)/0.3)] rounded transition-colors"
              >
                <X className="h-3 w-3 text-[hsl(var(--avivar-muted-foreground))]" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleFileClick}
              disabled={isUploading || isSaving}
              className="h-6 flex items-center gap-1 text-sm text-[hsl(var(--avivar-primary))] hover:underline focus:outline-none disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Upload className="h-3 w-3" />
                  <span>Fazer upload</span>
                </>
              )}
            </button>
          )}
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
