/**
 * Bloco 3: Contexto da negociação
 */

import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle } from "lucide-react";

interface Bloco3Props {
  form: UseFormReturn<any>;
}

export function Bloco3Negociacao({ form }: Bloco3Props) {
  const houveNegociacao = form.watch('houve_negociacao');

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="origem_negociacao">Como a negociação surgiu? *</Label>
        <Textarea
          {...form.register('origem_negociacao')}
          placeholder="Descreva como iniciou o contato com a outra parte..."
          rows={3}
        />
        {form.formState.errors.origem_negociacao && (
          <p className="text-sm text-destructive">
            {form.formState.errors.origem_negociacao.message as string}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between p-4 border rounded-md">
        <div>
          <Label htmlFor="houve_negociacao">Houve negociação de valores, prazos ou cláusulas?</Label>
          <p className="text-xs text-muted-foreground">
            Marque se houve qualquer tipo de negociação antes do contrato final
          </p>
        </div>
        <Switch
          checked={houveNegociacao}
          onCheckedChange={(v) => form.setValue('houve_negociacao', v)}
        />
      </div>

      {houveNegociacao && (
        <>
          <div className="space-y-2">
            <Label htmlFor="pedido_inicial">O que foi pedido inicialmente pela outra parte?</Label>
            <Textarea
              {...form.register('pedido_inicial')}
              placeholder="Descreva a proposta inicial da outra parte..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ajustes_realizados">O que foi ajustado ou concedido?</Label>
            <Textarea
              {...form.register('ajustes_realizados')}
              placeholder="Descreva as concessões feitas de ambos os lados..."
              rows={2}
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          <Label htmlFor="acordos_informais" className="text-amber-600">
            O que ficou acordado verbalmente ou por mensagens?
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          ⚠️ Se algo foi combinado fora do contrato, informe aqui. Isso é crítico para a análise jurídica.
        </p>
        <Textarea
          {...form.register('acordos_informais')}
          placeholder="Descreva acordos verbais, promessas ou combinados por WhatsApp/email que não estão no contrato..."
          rows={3}
          className="border-amber-200 focus:border-amber-400"
        />
      </div>
    </div>
  );
}
