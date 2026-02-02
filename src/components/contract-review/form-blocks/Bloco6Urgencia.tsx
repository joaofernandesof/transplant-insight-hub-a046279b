/**
 * Bloco 6: Urgência e impacto
 */

import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Clock, AlertTriangle } from "lucide-react";

interface Bloco6Props {
  form: UseFormReturn<any>;
}

export function Bloco6Urgencia({ form }: Bloco6Props) {
  const possuiDependencia = form.watch('possui_dependencia_externa');

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-md bg-muted/30 space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <Label>Informações para cálculo do SLA</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          O prazo de análise será calculado automaticamente com base nas informações abaixo
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prazo_maximo_retorno">Prazo máximo para retorno do Jurídico *</Label>
        <Input
          type="date"
          {...form.register('prazo_maximo_retorno')}
        />
        {form.formState.errors.prazo_maximo_retorno && (
          <p className="text-sm text-destructive">
            {form.formState.errors.prazo_maximo_retorno.message as string}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="impacto_atraso">O que acontece se o contrato atrasar? *</Label>
        <Textarea
          {...form.register('impacto_atraso')}
          placeholder="Descreva as consequências de um atraso na assinatura do contrato..."
          rows={3}
        />
        {form.formState.errors.impacto_atraso && (
          <p className="text-sm text-destructive">
            {form.formState.errors.impacto_atraso.message as string}
          </p>
        )}
      </div>

      <div className="p-4 border rounded-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <Label htmlFor="possui_dependencia_externa">
              Existe data fixa, evento ou dependência externa?
            </Label>
          </div>
          <Switch
            checked={possuiDependencia}
            onCheckedChange={(v) => form.setValue('possui_dependencia_externa', v)}
          />
        </div>
        
        <p className="text-xs text-muted-foreground">
          Ex: Evento marcado, início de projeto, prazo legal, etc.
        </p>

        {possuiDependencia && (
          <div className="space-y-2">
            <Label htmlFor="descricao_dependencia_externa">Descreva a dependência *</Label>
            <Textarea
              {...form.register('descricao_dependencia_externa')}
              placeholder="Ex: Temos um evento marcado para dia 15/03 e o contrato precisa estar assinado antes..."
              rows={2}
            />
          </div>
        )}
      </div>

      <div className="p-4 border rounded-md bg-primary/5">
        <h4 className="font-medium text-sm mb-2">📊 Como o SLA é calculado:</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• <strong>Estratégico + Data fixa:</strong> 24 horas</li>
          <li>• <strong>Estratégico + Dependência externa:</strong> 48 horas</li>
          <li>• <strong>Operacional padrão:</strong> 72 horas</li>
        </ul>
      </div>
    </div>
  );
}
