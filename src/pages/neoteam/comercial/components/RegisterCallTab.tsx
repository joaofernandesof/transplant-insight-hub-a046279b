import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onSubmit: (params: any) => Promise<any>;
  onCreated: () => void;
  accountId: string | null;
}

const CLOSERS = ['Isaac', 'Juan', 'Hygor', 'João'];

export function RegisterCallTab({ onSubmit, onCreated, accountId }: Props) {
  const [saving, setSaving] = useState(false);
  const [closerSelection, setCloserSelection] = useState('');
  const [closerCustom, setCloserCustom] = useState('');
  const [form, setForm] = useState({
    closer_name: '',
    lead_nome: '',
    produto: '',
    data_call: new Date().toISOString().slice(0, 16),
    status_call: 'followup' as 'fechou' | 'followup' | 'perdido',
    fonte_call: 'telefone',
    transcricao: '',
    resumo_manual: '',
  });

  const effectiveCloserName = closerSelection === '__other__' ? closerCustom : closerSelection;

  const handleSubmit = async () => {
    if (!form.lead_nome.trim()) {
      toast.error('Informe o nome do lead');
      return;
    }
    if (!form.transcricao.trim() && !form.resumo_manual.trim()) {
      toast.error('Informe a transcrição ou resumo da call');
      return;
    }

    setSaving(true);
    const result = await onSubmit({
      ...form,
      data_call: new Date(form.data_call).toISOString(),
    });
    setSaving(false);

    if (result) {
      setForm({
        closer_name: '',
        lead_nome: '',
        produto: '',
        data_call: new Date().toISOString().slice(0, 16),
        status_call: 'followup',
        fonte_call: 'telefone',
        transcricao: '',
        resumo_manual: '',
      });
      onCreated();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Nova Call</CardTitle>
        <CardDescription>Preencha os dados da ligação comercial</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Closer</Label>
            <Input
              value={form.closer_name}
              onChange={e => setForm(f => ({ ...f, closer_name: e.target.value }))}
              placeholder="Nome do closer"
            />
          </div>
          <div className="space-y-2">
            <Label>Lead *</Label>
            <Input
              value={form.lead_nome}
              onChange={e => setForm(f => ({ ...f, lead_nome: e.target.value }))}
              placeholder="Nome do lead"
            />
          </div>
          <div className="space-y-2">
            <Label>Produto</Label>
            <Input
              value={form.produto}
              onChange={e => setForm(f => ({ ...f, produto: e.target.value }))}
              placeholder="Ex: Harmonização Facial"
            />
          </div>
          <div className="space-y-2">
            <Label>Data da Call</Label>
            <Input
              type="datetime-local"
              value={form.data_call}
              onChange={e => setForm(f => ({ ...f, data_call: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Status da Call</Label>
            <Select value={form.status_call} onValueChange={v => setForm(f => ({ ...f, status_call: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fechou">✅ Fechou</SelectItem>
                <SelectItem value="followup">📋 Follow-up</SelectItem>
                <SelectItem value="perdido">❌ Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fonte da Call</Label>
            <Select value={form.fonte_call} onValueChange={v => setForm(f => ({ ...f, fonte_call: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="telefone">📞 Telefone</SelectItem>
                <SelectItem value="whatsapp">📱 WhatsApp</SelectItem>
                <SelectItem value="zoom">💻 Zoom</SelectItem>
                <SelectItem value="meet">🎥 Meet</SelectItem>
                <SelectItem value="presencial">🏢 Presencial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Transcrição da Call</Label>
          <Textarea
            value={form.transcricao}
            onChange={e => setForm(f => ({ ...f, transcricao: e.target.value }))}
            placeholder="Cole aqui a transcrição completa da call..."
            className="min-h-[200px] text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label>Resumo Manual (alternativo)</Label>
          <Textarea
            value={form.resumo_manual}
            onChange={e => setForm(f => ({ ...f, resumo_manual: e.target.value }))}
            placeholder="Ou escreva um resumo dos pontos principais..."
            className="min-h-[100px] text-sm"
          />
        </div>

        <Button onClick={handleSubmit} disabled={saving} className="w-full gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Registrar Call
        </Button>
      </CardContent>
    </Card>
  );
}
