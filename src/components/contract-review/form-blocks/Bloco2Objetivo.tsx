/**
 * Bloco 2: Objetivo do contrato
 */

import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Bloco2Props {
  form: UseFormReturn<any>;
  classificacoes: { value: string; label: string }[];
}

export function Bloco2Objetivo({ form, classificacoes }: Bloco2Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="objetivo_pratico">Qual o objetivo prático do contrato? *</Label>
        <Textarea
          {...form.register('objetivo_pratico')}
          placeholder="Descreva o que será contratado e para qual finalidade..."
          rows={3}
        />
        {form.formState.errors.objetivo_pratico && (
          <p className="text-sm text-destructive">
            {form.formState.errors.objetivo_pratico.message as string}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="beneficio_esperado">O que a empresa espera ganhar com esse contrato? *</Label>
        <Textarea
          {...form.register('beneficio_esperado')}
          placeholder="Descreva os benefícios esperados para o negócio..."
          rows={3}
        />
        {form.formState.errors.beneficio_esperado && (
          <p className="text-sm text-destructive">
            {form.formState.errors.beneficio_esperado.message as string}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Label>Classificação do Contrato *</Label>
        <RadioGroup
          value={form.watch('classificacao')}
          onValueChange={(v) => form.setValue('classificacao', v)}
          className="flex flex-col space-y-2"
        >
          {classificacoes.map((c) => (
            <div key={c.value} className="flex items-center space-x-2">
              <RadioGroupItem value={c.value} id={c.value} />
              <Label htmlFor={c.value} className="font-normal cursor-pointer">
                {c.label}
                {c.value === 'estrategico' && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (Maior tolerância a risco e negociação)
                  </span>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
