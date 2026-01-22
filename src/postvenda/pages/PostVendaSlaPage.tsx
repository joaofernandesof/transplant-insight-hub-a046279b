import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { PRIORIDADE_LABELS, TIPO_DEMANDA_OPTIONS, ETAPA_LABELS } from '../lib/permissions';

type SlaConfig = {
  id: string;
  tipo_demanda: string;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  etapa: 'triagem' | 'atendimento' | 'resolucao' | 'validacao_paciente' | 'nps' | 'encerrado';
  tempo_limite_horas: number;
  alerta_previo_min: number;
  escalonamento_auto: boolean;
  created_at?: string;
  updated_at?: string;
};

type FormState = {
  id?: string;
  tipo_demanda: string;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  etapa: SlaConfig['etapa'];
  tempo_limite_horas: string;
  alerta_previo_min: string;
  escalonamento_auto: boolean;
};

const etapas: SlaConfig['etapa'][] = ['triagem', 'atendimento', 'resolucao', 'validacao_paciente', 'nps'];

function getDefaultForm(): FormState {
  return {
    tipo_demanda: TIPO_DEMANDA_OPTIONS[0]?.value || 'financeiro',
    prioridade: 'normal',
    etapa: 'triagem',
    tempo_limite_horas: '24',
    alerta_previo_min: '120',
    escalonamento_auto: false,
  };
}

export default function PostVendaSlaPage() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<SlaConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(getDefaultForm());

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('postvenda_sla_config')
        .select('*')
        .order('tipo_demanda', { ascending: true })
        .order('prioridade', { ascending: true })
        .order('etapa', { ascending: true })
        .limit(1000);
      if (error) throw error;
      setConfigs((data as unknown as SlaConfig[]) || []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro', description: 'Não foi possível carregar as configurações de SLA.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, SlaConfig[]>();
    for (const c of configs) {
      const key = `${c.tipo_demanda}__${c.prioridade}`;
      map.set(key, [...(map.get(key) || []), c]);
    }
    return map;
  }, [configs]);

  const getTipoLabel = (value: string) => TIPO_DEMANDA_OPTIONS.find((o) => o.value === value)?.label || value;

  const openCreate = () => {
    setForm(getDefaultForm());
    setDialogOpen(true);
  };

  const openEdit = (cfg: SlaConfig) => {
    setForm({
      id: cfg.id,
      tipo_demanda: cfg.tipo_demanda,
      prioridade: cfg.prioridade,
      etapa: cfg.etapa,
      tempo_limite_horas: String(cfg.tempo_limite_horas ?? ''),
      alerta_previo_min: String(cfg.alerta_previo_min ?? ''),
      escalonamento_auto: !!cfg.escalonamento_auto,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    const tempo = Number(form.tempo_limite_horas);
    const alerta = Number(form.alerta_previo_min);
    if (!form.tipo_demanda || !form.prioridade || !form.etapa || !Number.isFinite(tempo) || !Number.isFinite(alerta)) {
      toast({ title: 'Atenção', description: 'Preencha todos os campos corretamente.' });
      return;
    }

    setIsSaving(true);
    try {
      if (form.id) {
        const { error } = await supabase
          .from('postvenda_sla_config')
          .update({
            tipo_demanda: form.tipo_demanda,
            prioridade: form.prioridade,
            etapa: form.etapa,
            tempo_limite_horas: tempo,
            alerta_previo_min: alerta,
            escalonamento_auto: form.escalonamento_auto,
          })
          .eq('id', form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('postvenda_sla_config').insert({
          tipo_demanda: form.tipo_demanda,
          prioridade: form.prioridade,
          etapa: form.etapa,
          tempo_limite_horas: tempo,
          alerta_previo_min: alerta,
          escalonamento_auto: form.escalonamento_auto,
        });
        if (error) throw error;
      }
      toast({ title: 'Sucesso', description: 'Configuração de SLA salva.' });
      setDialogOpen(false);
      await fetchConfigs();
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro', description: 'Não foi possível salvar a configuração.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('postvenda_sla_config').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Removido', description: 'Configuração removida.' });
      await fetchConfigs();
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro', description: 'Não foi possível remover a configuração.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <GlobalBreadcrumb />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Configuração SLA</h1>
          <p className="text-muted-foreground">Defina prazos por tipo de demanda, prioridade e etapa</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Regra
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {configs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhuma configuração cadastrada.
              </CardContent>
            </Card>
          ) : (
            Array.from(grouped.entries()).map(([key, rules]) => {
              const [tipo, prioridade] = key.split('__');
              return (
                <Card key={key}>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{getTipoLabel(tipo)}</CardTitle>
                      <div className="mt-1">
                        <Badge variant="secondary">Prioridade: {PRIORIDADE_LABELS[prioridade as keyof typeof PRIORIDADE_LABELS]}</Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openCreate()}>
                      Duplicar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-5 gap-3">
                      {etapas.map((et) => {
                        const rule = rules.find((r) => r.etapa === et);
                        return (
                          <div key={et} className="p-3 rounded-lg border bg-muted/20">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium">{ETAPA_LABELS[et]}</p>
                              {rule ? (
                                <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                                  Editar
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setForm({
                                      ...getDefaultForm(),
                                      tipo_demanda: tipo,
                                      prioridade: prioridade as FormState['prioridade'],
                                      etapa: et,
                                    });
                                    setDialogOpen(true);
                                  }}
                                >
                                  Criar
                                </Button>
                              )}
                            </div>
                            {rule ? (
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-muted-foreground">Prazo</p>
                                <p className="text-lg font-bold">{rule.tempo_limite_horas}h</p>
                                <p className="text-xs text-muted-foreground">Alerta prévio: {rule.alerta_previo_min} min</p>
                                {rule.escalonamento_auto && (
                                  <Badge variant="outline" className="mt-2">Escalonamento auto</Badge>
                                )}
                              </div>
                            ) : (
                              <p className="mt-3 text-sm text-muted-foreground">Sem regra</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar SLA' : 'Nova Regra de SLA'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label>Tipo de demanda</Label>
                <Select value={form.tipo_demanda} onValueChange={(v) => setForm((p) => ({ ...p, tipo_demanda: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_DEMANDA_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prioridade</Label>
                <Select value={form.prioridade} onValueChange={(v) => setForm((p) => ({ ...p, prioridade: v as FormState['prioridade'] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORIDADE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Etapa</Label>
                <Select value={form.etapa} onValueChange={(v) => setForm((p) => ({ ...p, etapa: v as FormState['etapa'] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {etapas.map((et) => (
                      <SelectItem key={et} value={et}>
                        {ETAPA_LABELS[et]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Tempo limite (horas)</Label>
                <Input
                  inputMode="numeric"
                  value={form.tempo_limite_horas}
                  onChange={(e) => setForm((p) => ({ ...p, tempo_limite_horas: e.target.value }))}
                  placeholder="Ex: 24"
                />
              </div>
              <div>
                <Label>Alerta prévio (minutos)</Label>
                <Input
                  inputMode="numeric"
                  value={form.alerta_previo_min}
                  onChange={(e) => setForm((p) => ({ ...p, alerta_previo_min: e.target.value }))}
                  placeholder="Ex: 120"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Escalonamento automático</p>
                <p className="text-xs text-muted-foreground">Quando ativado, o sistema pode sugerir/escalar após estourar o SLA</p>
              </div>
              <Switch checked={form.escalonamento_auto} onCheckedChange={(v) => setForm((p) => ({ ...p, escalonamento_auto: v }))} />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            {form.id ? (
              <Button variant="destructive" onClick={() => remove(form.id!)} disabled={isSaving} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Remover
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={save} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
