/**
 * Etapa 2 Simplificada: Informações da Empresa (Tudo em Uma Tela)
 * Combina: Nome da empresa, endereço, profissional e nome do atendente
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, User, Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NichoType, SubnichoType } from '../../../types';
import { getCompanyFieldConfig, getProfessionalFieldConfig } from '../../../nichoConfig';

interface StepBusinessInfoProps {
  companyName: string;
  address: string;
  city: string;
  state: string;
  professionalName: string;
  crm: string;
  attendantName: string;
  nicho: NichoType | null;
  subnicho: SubnichoType | null;
  onChange: (field: string, value: string) => void;
}

const attendantSuggestions = ['Ana', 'Iza', 'Sofia', 'Luna', 'Mel', 'Clara'];

export function StepBusinessInfo({
  companyName,
  address,
  city,
  state,
  professionalName,
  crm,
  attendantName,
  nicho,
  subnicho,
  onChange,
}: StepBusinessInfoProps) {
  const companyConfig = getCompanyFieldConfig(nicho, subnicho);
  const professionalConfig = getProfessionalFieldConfig(nicho, subnicho);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Conte sobre seu negócio 📝
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Informações básicas para personalizar seu atendente
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Nome da Empresa */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-[hsl(var(--avivar-primary))]">
              <Building2 className="h-5 w-5" />
              <span className="font-medium">Dados da Empresa</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-[hsl(var(--avivar-foreground))]">
                {companyConfig.nameLabel} *
              </Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => onChange('companyName', e.target.value)}
                placeholder={companyConfig.namePlaceholder}
                className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-[hsl(var(--avivar-foreground))]">
                  Cidade *
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => onChange('city', e.target.value)}
                  placeholder="Ex: São Paulo"
                  className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-[hsl(var(--avivar-foreground))]">
                  Estado *
                </Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => onChange('state', e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="SP"
                  maxLength={2}
                  className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-[hsl(var(--avivar-foreground))]">
                Endereço Completo
                <span className="text-[hsl(var(--avivar-muted-foreground))] text-xs ml-1">(opcional)</span>
              </Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => onChange('address', e.target.value)}
                placeholder={companyConfig.addressPlaceholder}
                rows={2}
                className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Profissional Responsável */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-[hsl(var(--avivar-primary))]">
              <User className="h-5 w-5" />
              <span className="font-medium">Profissional Responsável</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="professionalName" className="text-[hsl(var(--avivar-foreground))]">
                  {professionalConfig.nameLabel} *
                </Label>
                <Input
                  id="professionalName"
                  value={professionalName}
                  onChange={(e) => onChange('professionalName', e.target.value)}
                  placeholder={professionalConfig.namePlaceholder}
                  className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                />
              </div>
              
              {professionalConfig.showRegistration && (
                <div className="space-y-2">
                  <Label htmlFor="crm" className="text-[hsl(var(--avivar-foreground))]">
                    {professionalConfig.registrationLabel}
                    <span className="text-[hsl(var(--avivar-muted-foreground))] text-xs ml-1">(opcional)</span>
                  </Label>
                  <Input
                    id="crm"
                    value={crm}
                    onChange={(e) => onChange('crm', e.target.value)}
                    placeholder={professionalConfig.registrationPlaceholder}
                    className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Nome do Atendente Virtual */}
        <Card className="bg-gradient-to-br from-[hsl(var(--avivar-primary)/0.1)] to-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-primary)/0.3)]">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-[hsl(var(--avivar-primary))]">
              <Bot className="h-5 w-5" />
              <span className="font-medium">Seu Atendente Virtual</span>
              <Sparkles className="h-4 w-4" />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="attendantName" className="text-[hsl(var(--avivar-foreground))]">
                Como sua IA deve se chamar? *
              </Label>
              <Input
                id="attendantName"
                value={attendantName}
                onChange={(e) => onChange('attendantName', e.target.value)}
                placeholder="Ex: Iza"
                className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] text-lg"
              />
              
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Sugestões:</span>
                {attendantSuggestions.map((name) => (
                  <Button
                    key={name}
                    variant="outline"
                    size="sm"
                    onClick={() => onChange('attendantName', name)}
                    className={cn(
                      "h-7 text-xs border-[hsl(var(--avivar-border))]",
                      attendantName === name && "bg-[hsl(var(--avivar-primary)/0.2)] border-[hsl(var(--avivar-primary))]"
                    )}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>

            {attendantName && (
              <div className="mt-4 p-3 bg-[hsl(var(--avivar-card))] rounded-lg border border-[hsl(var(--avivar-border))]">
                <p className="text-sm text-[hsl(var(--avivar-foreground))]">
                  <span className="text-[hsl(var(--avivar-muted-foreground))]">Preview:</span>{' '}
                  "Olá! Sou a <strong className="text-[hsl(var(--avivar-primary))]">{attendantName}</strong>, 
                  assistente virtual da <strong className="text-[hsl(var(--avivar-primary))]">{companyName || 'sua empresa'}</strong>. 
                  Como posso te ajudar? 😊"
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
