import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ClipboardCheck, Save, Loader2, AlertTriangle, 
  CheckCircle2, User, FileText, DollarSign, Calendar,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type RiscoJuridico = 'baixo' | 'medio' | 'alto';
export type StatusProcedimento = 'nao_iniciado' | 'em_andamento' | 'finalizado' | 'cancelado';

export interface ChecklistJuridicoData {
  // Campos de Validação do Contato
  email_remetente?: string;
  nome_remetente?: string;
  contrato_localizado?: boolean;
  paciente_ativo?: boolean;
  remetente_titular?: boolean;
  email_resposta_enviado?: boolean;
  
  // Campos do Checklist Jurídico
  nome_completo?: string;
  email?: string;
  termo_sinal?: boolean;
  contrato?: boolean;
  procedimento?: string;
  valor_total?: number;
  valor_pago?: number;
  data_contratacao?: string;
  status_procedimento?: StatusProcedimento;
  motivo?: string;
  tratamento_iniciado?: boolean;
  risco_juridico?: RiscoJuridico;
  observacoes?: string;
}

interface DistratoChecklistJuridicoProps {
  data: ChecklistJuridicoData;
  onChange: (data: ChecklistJuridicoData) => void;
  onSave: () => Promise<void>;
  isReadOnly?: boolean;
  isSaving?: boolean;
}

export function DistratoChecklistJuridico({
  data,
  onChange,
  onSave,
  isReadOnly = false,
  isSaving = false
}: DistratoChecklistJuridicoProps) {
  // Calcular progresso do checklist
  const requiredFields = [
    'nome_completo', 'email', 'termo_sinal', 'contrato', 
    'procedimento', 'valor_total', 'valor_pago', 'data_contratacao',
    'status_procedimento', 'motivo', 'tratamento_iniciado', 'risco_juridico'
  ];
  
  const filledFields = requiredFields.filter(field => {
    const value = data[field as keyof ChecklistJuridicoData];
    if (typeof value === 'boolean') return value !== undefined;
    if (typeof value === 'number') return value !== undefined && value !== null;
    return value && String(value).trim() !== '';
  });
  
  const progress = Math.round((filledFields.length / requiredFields.length) * 100);
  const isComplete = progress === 100;

  const handleChange = (field: keyof ChecklistJuridicoData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const getRiscoColor = (risco?: RiscoJuridico) => {
    switch (risco) {
      case 'baixo': return 'bg-green-100 text-green-800 border-green-300';
      case 'medio': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'alto': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Checklist Jurídico</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isComplete ? 'default' : 'secondary'}
              className={cn(isComplete && 'bg-green-600')}
            >
              {isComplete ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completo
                </>
              ) : (
                `${progress}% preenchido`
              )}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Preencha todos os campos obrigatórios para avançar no fluxo
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Seção 1: Dados do Paciente */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            Dados do Paciente
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome_completo">Nome Completo *</Label>
              <Input
                id="nome_completo"
                value={data.nome_completo || ''}
                onChange={(e) => handleChange('nome_completo', e.target.value)}
                placeholder="Nome completo do paciente"
                disabled={isReadOnly}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={data.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@exemplo.com"
                disabled={isReadOnly}
              />
            </div>
          </div>
        </div>

        {/* Seção 2: Documentos */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            Documentos
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="termo_sinal"
                checked={data.termo_sinal ?? false}
                onCheckedChange={(checked) => handleChange('termo_sinal', checked)}
                disabled={isReadOnly}
              />
              <Label htmlFor="termo_sinal" className="text-sm">
                Termo de Sinal Assinado
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="contrato"
                checked={data.contrato ?? false}
                onCheckedChange={(checked) => handleChange('contrato', checked)}
                disabled={isReadOnly}
              />
              <Label htmlFor="contrato" className="text-sm">
                Contrato Assinado
              </Label>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="procedimento">Procedimento Contratado *</Label>
            <Input
              id="procedimento"
              value={data.procedimento || ''}
              onChange={(e) => handleChange('procedimento', e.target.value)}
              placeholder="Ex: Transplante Capilar FUE"
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* Seção 3: Valores */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4" />
            Valores
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_total">Valor Total do Contrato *</Label>
              <Input
                id="valor_total"
                type="number"
                value={data.valor_total ?? ''}
                onChange={(e) => handleChange('valor_total', parseFloat(e.target.value) || null)}
                placeholder="0,00"
                disabled={isReadOnly}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="valor_pago">Valor Pago até o Momento *</Label>
              <Input
                id="valor_pago"
                type="number"
                value={data.valor_pago ?? ''}
                onChange={(e) => handleChange('valor_pago', parseFloat(e.target.value) || null)}
                placeholder="0,00"
                disabled={isReadOnly}
              />
            </div>
          </div>
        </div>

        {/* Seção 4: Datas e Status */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            Datas e Status
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_contratacao">Data da Contratação *</Label>
              <Input
                id="data_contratacao"
                type="date"
                value={data.data_contratacao || ''}
                onChange={(e) => handleChange('data_contratacao', e.target.value)}
                disabled={isReadOnly}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status_procedimento">Status do Procedimento *</Label>
              <Select
                value={data.status_procedimento || ''}
                onValueChange={(v) => handleChange('status_procedimento', v)}
                disabled={isReadOnly}
              >
                <SelectTrigger id="status_procedimento">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao_iniciado">Não Iniciado</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tratamento_iniciado"
              checked={data.tratamento_iniciado ?? false}
              onCheckedChange={(checked) => handleChange('tratamento_iniciado', checked)}
              disabled={isReadOnly}
            />
            <Label htmlFor="tratamento_iniciado" className="text-sm">
              Tratamento Iniciado
            </Label>
          </div>
        </div>

        {/* Seção 5: Análise Jurídica */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            Análise Jurídica
          </h4>
          
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo Alegado do Distrato *</Label>
            <Textarea
              id="motivo"
              value={data.motivo || ''}
              onChange={(e) => handleChange('motivo', e.target.value)}
              placeholder="Descreva o motivo alegado pelo paciente..."
              rows={3}
              disabled={isReadOnly}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="risco_juridico">Risco Jurídico *</Label>
            <Select
              value={data.risco_juridico || ''}
              onValueChange={(v) => handleChange('risco_juridico', v)}
              disabled={isReadOnly}
            >
              <SelectTrigger id="risco_juridico">
                <SelectValue placeholder="Selecione o nível de risco..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixo">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Baixo
                  </span>
                </SelectItem>
                <SelectItem value="medio">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Médio
                  </span>
                </SelectItem>
                <SelectItem value="alto">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Alto
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {data.risco_juridico && (
              <Badge className={cn('mt-2', getRiscoColor(data.risco_juridico))}>
                Risco {data.risco_juridico.charAt(0).toUpperCase() + data.risco_juridico.slice(1)}
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={data.observacoes || ''}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* Botão Salvar */}
        {!isReadOnly && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Checklist
            </Button>
          </div>
        )}

        {/* Aviso de campos faltantes */}
        {!isComplete && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Checklist incompleto</p>
                <p className="text-xs mt-1">
                  Faltam {requiredFields.length - filledFields.length} campos obrigatórios para avançar no fluxo.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
