/**
 * Etapa 3: Informações do Profissional
 * Campos dinâmicos baseados no nicho selecionado
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, CreditCard, Instagram } from 'lucide-react';
import { NichoType, SubnichoType } from '../../types';
import { getProfessionalFieldConfig, getNichoTerminology } from '../../nichoConfig';

interface StepProfessionalProps {
  professionalName: string;
  crm: string;
  instagram: string;
  onChange: (field: string, value: string) => void;
  nicho?: NichoType | null;
  subnicho?: SubnichoType | null;
}

export function StepProfessional({ 
  professionalName, 
  crm, 
  instagram, 
  onChange,
  nicho = null,
  subnicho = null
}: StepProfessionalProps) {
  const fieldConfig = getProfessionalFieldConfig(nicho, subnicho);
  const terminology = getNichoTerminology(nicho);

  const formatRegistration = (value: string) => {
    // Remove caracteres especiais exceto letras, números, hifens e barras
    const cleaned = value.replace(/[^0-9a-zA-Z\s\-\/]/g, '').toUpperCase();
    return cleaned;
  };

  const formatInstagram = (value: string) => {
    // Remove @ se existir e caracteres especiais
    return value.replace(/[@\s]/g, '').toLowerCase();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Dados do {terminology.profissional.charAt(0).toUpperCase() + terminology.profissional.slice(1)}
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Informações do {terminology.profissional} responsável
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Nome do Profissional */}
        <div className="space-y-2">
          <Label htmlFor="professionalName" className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <User className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
            {fieldConfig.nameLabel} *
          </Label>
          <Input
            id="professionalName"
            value={professionalName}
            onChange={(e) => onChange('professionalName', e.target.value)}
            placeholder={fieldConfig.namePlaceholder}
            className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
          />
          <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
            {fieldConfig.nameHint}
          </p>
        </div>

        {/* Registro Profissional - Condicional */}
        {fieldConfig.showRegistration && (
          <div className="space-y-2">
            <Label htmlFor="crm" className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
              {fieldConfig.registrationLabel} *
            </Label>
            <Input
              id="crm"
              value={crm}
              onChange={(e) => onChange('crm', formatRegistration(e.target.value))}
              placeholder={fieldConfig.registrationPlaceholder}
              className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
            />
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
              {fieldConfig.registrationHint}
            </p>
          </div>
        )}

        {/* Instagram */}
        <div className="space-y-2">
          <Label htmlFor="instagram" className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <Instagram className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
            Instagram (opcional)
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--avivar-muted-foreground))]">
              @
            </span>
            <Input
              id="instagram"
              value={instagram}
              onChange={(e) => onChange('instagram', formatInstagram(e.target.value))}
              placeholder="seu_perfil"
              className="pl-8 bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
            />
          </div>
          <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
            O @ é adicionado automaticamente
          </p>
        </div>
      </div>
    </div>
  );
}
