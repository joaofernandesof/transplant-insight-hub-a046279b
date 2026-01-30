/**
 * Etapa 4: Informações da Clínica
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin } from 'lucide-react';
import { BRAZILIAN_STATES } from '../../types';

interface StepClinicProps {
  companyName: string;
  address: string;
  city: string;
  state: string;
  onChange: (field: string, value: string) => void;
}

export function StepClinic({ companyName, address, city, state, onChange }: StepClinicProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Dados da Clínica
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Informações sobre o local de atendimento
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Nome da Clínica */}
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
            Nome da Clínica *
          </Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => onChange('companyName', e.target.value)}
            placeholder="Ex: Clínica Desiree Hickmann"
            className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
          />
        </div>

        {/* Endereço */}
        <div className="space-y-2">
          <Label htmlFor="address" className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
            Endereço Completo *
          </Label>
          <Textarea
            id="address"
            value={address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="Ex: Av. Getúlio Vargas, 4841 - Conjunto 705&#10;Canoas/RS - CEP 92020-333"
            rows={3}
            className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))] resize-none"
          />
          <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
            Inclua: Rua, Número, Complemento, CEP
          </p>
        </div>

        {/* Cidade e Estado */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="city" className="text-[hsl(var(--avivar-foreground))]">
              Cidade *
            </Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => onChange('city', e.target.value)}
              placeholder="Ex: Canoas"
              className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state" className="text-[hsl(var(--avivar-foreground))]">
              Estado *
            </Label>
            <Select value={state} onValueChange={(value) => onChange('state', value)}>
              <SelectTrigger className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]">
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
                {BRAZILIAN_STATES.map((uf) => (
                  <SelectItem 
                    key={uf} 
                    value={uf}
                    className="text-[hsl(var(--avivar-foreground))] focus:bg-[hsl(var(--avivar-muted))]"
                  >
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
