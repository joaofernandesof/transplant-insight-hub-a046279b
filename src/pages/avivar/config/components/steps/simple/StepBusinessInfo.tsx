/**
 * Etapa 2 Simplificada: Informações da Empresa (Tudo em Uma Tela)
 * Combina: Nome da empresa, unidades/filiais, profissional e nome do atendente
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, User, Bot, Sparkles, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NichoType, SubnichoType, BusinessUnit } from '../../../types';
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
  businessUnits: BusinessUnit[];
  onChange: (field: string, value: string | BusinessUnit[]) => void;
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
  businessUnits = [],
  onChange,
}: StepBusinessInfoProps) {
  const companyConfig = getCompanyFieldConfig(nicho, subnicho);
  const professionalConfig = getProfessionalFieldConfig(nicho, subnicho);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  // Gerar ID único para nova unidade
  const generateUnitId = () => `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Verificar se o subnicho exige profissional responsável
  const requiresProfessional = professionalConfig.showRegistration;

  // Adicionar nova unidade
  const handleAddUnit = () => {
    const newUnit: BusinessUnit = {
      id: generateUnitId(),
      name: '',
      city: '',
      state: '',
      address: '',
      phone: '',
      professionalName: '',
      professionalRegistration: '',
    };
    onChange('businessUnits', [...businessUnits, newUnit]);
    setExpandedUnit(newUnit.id);
  };

  // Remover unidade
  const handleRemoveUnit = (unitId: string) => {
    onChange('businessUnits', businessUnits.filter(u => u.id !== unitId));
    if (expandedUnit === unitId) {
      setExpandedUnit(null);
    }
  };

  // Atualizar campo de uma unidade
  const handleUnitChange = (unitId: string, field: keyof BusinessUnit, value: string) => {
    const updatedUnits = businessUnits.map(unit => 
      unit.id === unitId ? { ...unit, [field]: value } : unit
    );
    onChange('businessUnits', updatedUnits);
  };

  // Toggle expansão
  const toggleExpand = (unitId: string) => {
    setExpandedUnit(expandedUnit === unitId ? null : unitId);
  };

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
                  Cidade (Matriz) *
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
                Endereço Completo (Matriz)
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

            {/* Profissional Responsável da Matriz */}
            {requiresProfessional && (
              <div className="pt-3 border-t border-[hsl(var(--avivar-border))]">
                <div className="flex items-center gap-2 mb-3 text-[hsl(var(--avivar-primary))]">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">Profissional Responsável (Matriz)</span>
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
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unidades/Filiais */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[hsl(var(--avivar-primary))]">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">Unidades / Filiais</span>
                <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">(opcional)</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddUnit}
                className="border-[hsl(var(--avivar-primary))] text-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Unidade
              </Button>
            </div>

            {businessUnits.length === 0 ? (
              <div className="text-center py-6 text-[hsl(var(--avivar-muted-foreground))]">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Possui mais de uma unidade? Adicione aqui!</p>
                <p className="text-xs mt-1">A IA poderá direcionar clientes para a unidade mais próxima.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {businessUnits.map((unit, index) => (
                  <div 
                    key={unit.id}
                    className="border border-[hsl(var(--avivar-border))] rounded-lg overflow-hidden"
                  >
                    {/* Header da Unidade */}
                    <div 
                      className="flex items-center justify-between p-3 bg-[hsl(var(--avivar-muted)/0.3)] cursor-pointer"
                      onClick={() => toggleExpand(unit.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[hsl(var(--avivar-primary))]">
                          #{index + 1}
                        </span>
                        <span className="font-medium text-[hsl(var(--avivar-foreground))]">
                          {unit.name || 'Nova Unidade'}
                        </span>
                        {unit.city && (
                          <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                            • {unit.city}/{unit.state}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveUnit(unit.id);
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {expandedUnit === unit.id ? (
                          <ChevronUp className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                        )}
                      </div>
                    </div>

                    {/* Conteúdo Expandido */}
                    {expandedUnit === unit.id && (
                      <div className="p-4 space-y-4 border-t border-[hsl(var(--avivar-border))]">
                        <div className="space-y-2">
                          <Label className="text-[hsl(var(--avivar-foreground))]">
                            Nome da Unidade *
                          </Label>
                          <Input
                            value={unit.name}
                            onChange={(e) => handleUnitChange(unit.id, 'name', e.target.value)}
                            placeholder="Ex: Unidade Centro, Filial Sul"
                            className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[hsl(var(--avivar-foreground))]">
                              Cidade *
                            </Label>
                            <Input
                              value={unit.city}
                              onChange={(e) => handleUnitChange(unit.id, 'city', e.target.value)}
                              placeholder="Ex: São Paulo"
                              className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[hsl(var(--avivar-foreground))]">
                              Estado *
                            </Label>
                            <Input
                              value={unit.state}
                              onChange={(e) => handleUnitChange(unit.id, 'state', e.target.value.toUpperCase().slice(0, 2))}
                              placeholder="SP"
                              maxLength={2}
                              className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[hsl(var(--avivar-foreground))]">
                            Endereço Completo
                          </Label>
                          <Textarea
                            value={unit.address}
                            onChange={(e) => handleUnitChange(unit.id, 'address', e.target.value)}
                            placeholder="Rua, número, complemento, CEP"
                            rows={2}
                            className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[hsl(var(--avivar-foreground))]">
                            Telefone
                            <span className="text-[hsl(var(--avivar-muted-foreground))] text-xs ml-1">(opcional)</span>
                          </Label>
                          <Input
                            value={unit.phone || ''}
                            onChange={(e) => handleUnitChange(unit.id, 'phone', e.target.value)}
                            placeholder="(11) 99999-9999"
                            className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                          />
                        </div>

                        {/* Profissional Responsável da Unidade */}
                        {requiresProfessional && (
                          <div className="pt-3 border-t border-[hsl(var(--avivar-border))]">
                            <div className="flex items-center gap-2 mb-3 text-[hsl(var(--avivar-primary))]">
                              <User className="h-4 w-4" />
                              <span className="text-sm font-medium">Profissional Responsável</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-[hsl(var(--avivar-foreground))]">
                                  {professionalConfig.nameLabel}
                                </Label>
                                <Input
                                  value={unit.professionalName || ''}
                                  onChange={(e) => handleUnitChange(unit.id, 'professionalName', e.target.value)}
                                  placeholder={professionalConfig.namePlaceholder}
                                  className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[hsl(var(--avivar-foreground))]">
                                  {professionalConfig.registrationLabel}
                                  <span className="text-[hsl(var(--avivar-muted-foreground))] text-xs ml-1">(opcional)</span>
                                </Label>
                                <Input
                                  value={unit.professionalRegistration || ''}
                                  onChange={(e) => handleUnitChange(unit.id, 'professionalRegistration', e.target.value)}
                                  placeholder={professionalConfig.registrationPlaceholder}
                                  className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-2">
                              {professionalConfig.registrationHint}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
