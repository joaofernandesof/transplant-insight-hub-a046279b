/**
 * VariableAutocomplete - Textarea with inline variable autocomplete
 * Shows suggestions when user types "{{" and allows selecting variables
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Hash } from 'lucide-react';
import { CRM_VARIABLES } from '@/pages/avivar/AvivarVariables';
import { cn } from '@/lib/utils';

interface VariableAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  context?: string; // Filter variables by context (e.g. 'follow-up')
}

export function VariableAutocomplete({
  value,
  onChange,
  placeholder,
  className,
  context,
}: VariableAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filter, setFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const [triggerStart, setTriggerStart] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter variables
  const filteredVars = CRM_VARIABLES.filter(v => {
    if (context && !v.availableIn.includes(context)) return false;
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      v.key.toLowerCase().includes(q) ||
      v.label.toLowerCase().includes(q)
    );
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(newValue);
    setCursorPos(cursor);

    // Check if we should show suggestions
    const textBefore = newValue.slice(0, cursor);
    const lastDoubleBrace = textBefore.lastIndexOf('{{');

    if (lastDoubleBrace !== -1) {
      const afterBrace = textBefore.slice(lastDoubleBrace + 2);
      // Only show if no closing braces yet and no newline
      if (!afterBrace.includes('}}') && !afterBrace.includes('\n')) {
        setShowSuggestions(true);
        setFilter(afterBrace);
        setTriggerStart(lastDoubleBrace);
        setSelectedIndex(0);
        return;
      }
    }

    setShowSuggestions(false);
    setFilter('');
    setTriggerStart(-1);
  }, [onChange]);

  const insertVariable = useCallback((variable: string) => {
    if (triggerStart === -1) {
      // No trigger, just append
      onChange(value + variable);
    } else {
      // Replace from trigger start to cursor
      const before = value.slice(0, triggerStart);
      const after = value.slice(cursorPos);
      const newValue = before + variable + after;
      onChange(newValue);

      // Set cursor position after variable
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const pos = triggerStart + variable.length;
          textareaRef.current.selectionStart = pos;
          textareaRef.current.selectionEnd = pos;
          textareaRef.current.focus();
        }
      });
    }

    setShowSuggestions(false);
    setFilter('');
    setTriggerStart(-1);
  }, [value, onChange, triggerStart, cursorPos]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredVars.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % filteredVars.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + filteredVars.length) % filteredVars.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertVariable(filteredVars[selectedIndex].key);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [showSuggestions, filteredVars, selectedIndex, insertVariable]);

  // Scroll selected item into view
  useEffect(() => {
    if (showSuggestions && suggestionsRef.current) {
      const item = suggestionsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, showSuggestions]);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Delay to allow click on suggestion
          setTimeout(() => setShowSuggestions(false), 200);
        }}
        placeholder={placeholder}
        className={className}
      />

      {showSuggestions && filteredVars.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] shadow-xl overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-[hsl(var(--avivar-border))] flex items-center gap-2">
            <Hash className="h-3 w-3 text-[hsl(var(--avivar-primary))]" />
            <span className="text-[10px] font-medium text-[hsl(var(--avivar-muted-foreground))]">
              Variáveis · ↑↓ navegar · Enter selecionar
            </span>
          </div>
          <ScrollArea className="max-h-[200px]">
            {filteredVars.slice(0, 15).map((v, idx) => (
              <div
                key={v.key}
                data-index={idx}
                onClick={() => insertVariable(v.key)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors text-sm',
                  idx === selectedIndex
                    ? 'bg-[hsl(var(--avivar-primary)/0.1)]'
                    : 'hover:bg-[hsl(var(--avivar-primary)/0.04)]'
                )}
              >
                <code className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-[hsl(var(--avivar-background))] text-[hsl(var(--avivar-primary))] border border-[hsl(var(--avivar-border))] whitespace-nowrap">
                  {v.key}
                </code>
                <span className="text-xs text-[hsl(var(--avivar-muted-foreground))] truncate">
                  {v.label}
                </span>
              </div>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
