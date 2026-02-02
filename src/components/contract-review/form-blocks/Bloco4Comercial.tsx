/**
 * Bloco 4: Condições comerciais
 */

import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle } from "lucide-react";

interface Bloco4Props {
  form: UseFormReturn<any>;
}

export function Bloco4Comercial({ form }: Bloco4Props) {
  const existeAcordoFora = form.watch('existe_acordo_fora_contrato');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valor_total">Valor Total do Contrato (R$)</Label>
          <Input
            type="number"
            step="0.01"
            {...form.register('valor_total', { valueAsNumber: true })}
            placeholder="0,00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
          <Input
            {...form.register('forma_pagamento')}
            placeholder="Ex: À vista, parcelado, mensal..."
          />
          {form.formState.errors.forma_pagamento && (
            <p className="text-sm text-destructive">
              {form.formState.errors.forma_pagamento.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="datas_pagamento">Datas de Pagamento</Label>
        <Input
          {...form.register('datas_pagamento')}
          placeholder="Ex: Todo dia 10, na assinatura, em 3 parcelas..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="multas_previstas">Multas Previstas</Label>
          <Textarea
            {...form.register('multas_previstas')}
            placeholder="Descreva multas por atraso ou descumprimento..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="penalidades_cancelamento">Penalidades por Cancelamento</Label>
          <Textarea
            {...form.register('penalidades_cancelamento')}
            placeholder="Descreva as penalidades em caso de rescisão..."
            rows={2}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="condicoes_credito">Condições de Crédito, Reembolso ou Remarcação</Label>
        <Textarea
          {...form.register('condicoes_credito')}
          placeholder="Descreva políticas de reembolso, créditos ou remarcações..."
          rows={2}
        />
      </div>

      <div className="p-4 border rounded-md border-orange-200 bg-orange-50 dark:bg-orange-900/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <Label htmlFor="existe_acordo_fora_contrato" className="text-orange-700 dark:text-orange-400">
              Existe algo combinado que não está no contrato?
            </Label>
          </div>
          <Switch
            checked={existeAcordoFora}
            onCheckedChange={(v) => form.setValue('existe_acordo_fora_contrato', v)}
          />
        </div>

        {existeAcordoFora && (
          <div className="space-y-2">
            <Label htmlFor="descricao_acordo_fora_contrato">Descreva o acordo *</Label>
            <Textarea
              {...form.register('descricao_acordo_fora_contrato')}
              placeholder="Descreva detalhadamente o que foi combinado fora do contrato..."
              rows={3}
            />
          </div>
        )}
      </div>
    </div>
  );
}
