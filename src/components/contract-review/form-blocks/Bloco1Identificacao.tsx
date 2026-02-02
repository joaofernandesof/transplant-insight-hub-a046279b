/**
 * Bloco 1: Identificação básica do contrato
 */

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface Bloco1Props {
  form: UseFormReturn<any>;
  areas: string[];
  tipos: { value: string; label: string }[];
}

export function Bloco1Identificacao({ form, areas, tipos }: Bloco1Props) {
  const tipoContrato = form.watch('tipo_contrato');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="area_empresa">Área / Empresa do Grupo *</Label>
          <Select
            value={form.watch('area_empresa')}
            onValueChange={(v) => form.setValue('area_empresa', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {areas.map((area) => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.area_empresa && (
            <p className="text-sm text-destructive">
              {form.formState.errors.area_empresa.message as string}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo_contrato">Tipo de Contrato *</Label>
          <Select
            value={form.watch('tipo_contrato')}
            onValueChange={(v) => form.setValue('tipo_contrato', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {tipos.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {tipoContrato === 'outro' && (
        <div className="space-y-2">
          <Label htmlFor="tipo_contrato_outro">Especifique o tipo *</Label>
          <Input
            {...form.register('tipo_contrato_outro')}
            placeholder="Descreva o tipo de contrato"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="nome_outra_parte">Nome da Outra Parte *</Label>
        <Input
          {...form.register('nome_outra_parte')}
          placeholder="Nome da empresa ou pessoa contratada/contratante"
        />
        {form.formState.errors.nome_outra_parte && (
          <p className="text-sm text-destructive">
            {form.formState.errors.nome_outra_parte.message as string}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data_assinatura_prevista">Data Prevista de Assinatura *</Label>
          <Input
            type="date"
            {...form.register('data_assinatura_prevista')}
          />
          {form.formState.errors.data_assinatura_prevista && (
            <p className="text-sm text-destructive">
              {form.formState.errors.data_assinatura_prevista.message as string}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_inicio_vigencia">Data de Início da Vigência *</Label>
          <Input
            type="date"
            {...form.register('data_inicio_vigencia')}
          />
          {form.formState.errors.data_inicio_vigencia && (
            <p className="text-sm text-destructive">
              {form.formState.errors.data_inicio_vigencia.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prazo_total_contrato">Prazo Total do Contrato *</Label>
        <Input
          {...form.register('prazo_total_contrato')}
          placeholder="Ex: 12 meses, 2 anos, indeterminado"
        />
        {form.formState.errors.prazo_total_contrato && (
          <p className="text-sm text-destructive">
            {form.formState.errors.prazo_total_contrato.message as string}
          </p>
        )}
      </div>
    </div>
  );
}
