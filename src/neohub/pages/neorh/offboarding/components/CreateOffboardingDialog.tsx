import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_CHECKLIST_ITEMS } from './defaultChecklist';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function CreateOffboardingDialog({ open, onOpenChange, onCreated }: Props) {
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [selectedColab, setSelectedColab] = useState('');
  const [form, setForm] = useState({
    colaborador_nome: '',
    cargo: '',
    setor: '',
    tipo_desligamento: 'demissao',
    data_desligamento: '',
    responsavel_nome: '',
    observacoes: '',
  });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      supabase.from('rh_colaboradores').select('id, nome, cargo_id, area_id').eq('status', 'ativo').order('nome').then(({ data }) => {
        setColaboradores(data || []);
      });
    }
  }, [open]);

  const handleColabSelect = async (colabId: string) => {
    setSelectedColab(colabId);
    const colab = colaboradores.find(c => c.id === colabId);
    if (!colab) return;
    
    let cargoNome = '';
    let areaNome = '';
    
    if (colab.cargo_id) {
      const { data } = await supabase.from('rh_cargos').select('nome').eq('id', colab.cargo_id).single();
      cargoNome = data?.nome || '';
    }
    if (colab.area_id) {
      const { data } = await supabase.from('rh_areas').select('nome').eq('id', colab.area_id).single();
      areaNome = data?.nome || '';
    }

    setForm(f => ({ ...f, colaborador_nome: colab.nome, cargo: cargoNome, setor: areaNome }));
  };

  const handleSave = async () => {
    if (!form.colaborador_nome || !form.data_desligamento) {
      toast.error('Preencha o colaborador e a data de desligamento');
      return;
    }
    setSaving(true);

    const { data: process, error } = await supabase.from('rh_offboarding_processes').insert({
      colaborador_id: selectedColab || null,
      colaborador_nome: form.colaborador_nome,
      cargo: form.cargo || null,
      setor: form.setor || null,
      tipo_desligamento: form.tipo_desligamento,
      data_desligamento: form.data_desligamento,
      responsavel_nome: form.responsavel_nome || null,
      observacoes: form.observacoes || null,
      status: 'aberto',
    }).select('id').single();

    if (error || !process) {
      toast.error('Erro ao criar processo');
      setSaving(false);
      return;
    }

    // Insert default checklist items
    const checklistItems = DEFAULT_CHECKLIST_ITEMS.map((item, i) => ({
      process_id: process.id,
      categoria: item.categoria,
      tarefa: item.tarefa,
      setor_responsavel: item.setor_responsavel,
      status: 'pendente',
      order_index: i,
    }));

    await supabase.from('rh_offboarding_checklist_items').insert(checklistItems);

    // Log history
    await supabase.from('rh_offboarding_history').insert({
      process_id: process.id,
      action: 'Processo criado',
      details: `Offboarding de ${form.colaborador_nome} criado. Tipo: ${form.tipo_desligamento}`,
      user_name: form.responsavel_nome || 'Sistema',
    });

    toast.success('Processo de offboarding criado');
    setSaving(false);
    onOpenChange(false);
    onCreated();
    navigate(`/neoteam/rh/offboarding/${process.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Processo de Offboarding</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Colaborador</Label>
            {colaboradores.length > 0 ? (
              <Select value={selectedColab} onValueChange={handleColabSelect}>
                <SelectTrigger><SelectValue placeholder="Selecione o colaborador" /></SelectTrigger>
                <SelectContent>
                  {colaboradores.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={form.colaborador_nome} onChange={e => setForm({ ...form, colaborador_nome: e.target.value })} placeholder="Nome do colaborador" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Cargo</Label><Input value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} /></div>
            <div><Label>Setor</Label><Input value={form.setor} onChange={e => setForm({ ...form, setor: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Desligamento</Label>
              <Select value={form.tipo_desligamento} onValueChange={v => setForm({ ...form, tipo_desligamento: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="demissao">Demissão</SelectItem>
                  <SelectItem value="pedido_demissao">Pedido de Demissão</SelectItem>
                  <SelectItem value="fim_contrato">Fim de Contrato</SelectItem>
                  <SelectItem value="acordo_mutuo">Acordo Mútuo</SelectItem>
                  <SelectItem value="justa_causa">Justa Causa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Data do Desligamento</Label><Input type="date" value={form.data_desligamento} onChange={e => setForm({ ...form, data_desligamento: e.target.value })} /></div>
          </div>
          <div><Label>Responsável pelo Processo</Label><Input value={form.responsavel_nome} onChange={e => setForm({ ...form, responsavel_nome: e.target.value })} placeholder="Nome do responsável" /></div>
          <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={3} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Criando...' : 'Criar Processo'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
