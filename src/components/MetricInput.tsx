import React from 'react';
import { MetricFormat } from '@/data/metricsData';
import { cn } from '@/lib/utils';

interface MetricInputProps {
  value: number | string | null;
  onChange: (value: number | string | null) => void;
  formato: MetricFormat;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function MetricInput({ 
  value, 
  onChange, 
  formato, 
  disabled = false,
  placeholder,
  className 
}: MetricInputProps) {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value;
    
    if (formato === 'status') {
      onChange(val);
      return;
    }
    
    if (val === '') {
      onChange(null);
      return;
    }
    
    const numVal = parseFloat(val.replace(',', '.'));
    if (!isNaN(numVal)) {
      onChange(numVal);
    }
  };
  
  const getInputType = () => {
    if (formato === 'status') return 'text';
    return 'number';
  };
  
  const getStep = () => {
    switch (formato) {
      case 'percent':
      case 'decimal':
        return '0.1';
      case 'currency':
        return '0.01';
      default:
        return '1';
    }
  };
  
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    switch (formato) {
      case 'percent':
        return '0.0%';
      case 'currency':
        return 'R$ 0,00';
      case 'decimal':
        return '0.00';
      case 'number':
        return '0';
      case 'minutes':
        return '0 min';
      case 'days':
        return '0 dias';
      case 'status':
        return 'Status';
      default:
        return '';
    }
  };
  
  const getSuffix = () => {
    switch (formato) {
      case 'percent':
        return '%';
      case 'minutes':
        return 'min';
      case 'days':
        return 'dias';
      default:
        return null;
    }
  };
  
  const getPrefix = () => {
    if (formato === 'currency') return 'R$';
    return null;
  };
  
  if (formato === 'status') {
    return (
      <select
        value={value as string || ''}
        onChange={handleChange}
        disabled={disabled}
        className={cn('input-metric', className)}
      >
        <option value="">Selecione...</option>
        <option value="Ruim">Ruim</option>
        <option value="Médio">Médio</option>
        <option value="Bom">Bom</option>
        <option value="Ótimo">Ótimo</option>
      </select>
    );
  }
  
  const prefix = getPrefix();
  const suffix = getSuffix();
  
  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-muted-foreground text-sm pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type={getInputType()}
        value={value ?? ''}
        onChange={handleChange}
        disabled={disabled}
        step={getStep()}
        placeholder={getPlaceholder()}
        className={cn(
          'input-metric',
          prefix && 'pl-10',
          suffix && 'pr-12',
          className
        )}
      />
      {suffix && (
        <span className="absolute right-3 text-muted-foreground text-sm pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
