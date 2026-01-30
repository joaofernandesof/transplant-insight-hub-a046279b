/**
 * Etapa 3: Informações do Profissional
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, CreditCard, Instagram } from 'lucide-react';

interface StepProfessionalProps {
  professionalName: string;
  crm: string;
  instagram: string;
  onChange: (field: string, value: string) => void;
}

export function StepProfessional({ professionalName, crm, instagram, onChange }: StepProfessionalProps) {
  const formatCRM = (value: string) => {
    // Remove tudo que não é número ou letra
    const cleaned = value.replace(/[^0-9a-zA-Z\s]/g, '').toUpperCase();
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
          Dados do Profissional
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Informações do médico responsável pela clínica
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Nome do Médico */}
        <div className="space-y-2">
          <Label htmlFor="professionalName" className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <User className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
            Nome do Médico *
          </Label>
          <Input
            id="professionalName"
            value={professionalName}
            onChange={(e) => onChange('professionalName', e.target.value)}
            placeholder="Ex: Dr. Mario"
            className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
          />
          <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
            Use o nome como gostaria que os pacientes se refiram
          </p>
        </div>

        {/* CRM */}
        <div className="space-y-2">
          <Label htmlFor="crm" className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
            CRM *
          </Label>
          <Input
            id="crm"
            value={crm}
            onChange={(e) => onChange('crm', formatCRM(e.target.value))}
            placeholder="Ex: 50036 RS"
            className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
          />
          <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
            Formato: Número + UF (ex: 12345 SP)
          </p>
        </div>

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
              placeholder="drmario"
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
