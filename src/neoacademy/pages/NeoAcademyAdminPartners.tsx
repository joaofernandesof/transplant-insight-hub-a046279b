import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Pencil, Trash2, Store, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface CouponForm {
  partner_name: string;
  partner_logo_url: string;
  description: string;
  coupon_code: string;
  discount_label: string;
  category: string;
  link_url: string;
  valid_until: string;
  order_index: number;
}

const emptyForm: CouponForm = {
  partner_name: '',
  partner_logo_url: '',
  description: '',
  coupon_code: '',
  discount_label: '',
  category: '',
  link_url: '',
  valid_until: '',
  order_index: 0,
};

export default function NeoAcademyAdminPartners() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-partner-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoacademy_partner_coupons')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form };
      if (!payload.valid_until) delete payload.valid_until;
      if (!payload.partner_logo_url) delete payload.partner_logo_url;
      if (!payload.link_url) delete payload.link_url;

      if (editingId) {
        const { error } = await supabase.from('neoacademy_partner_coupons').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('neoacademy_partner_coupons').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partner-coupons'] });
      toast.success(editingId ? 'Cupom atualizado!' : 'Cupom criado!');
      closeDialog();
    },
    onError: () => toast.error('Erro ao salvar cupom'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('neoacademy_partner_coupons').update({ is_active: active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-partner-coupons'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('neoacademy_partner_coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partner-coupons'] });
      toast.success('Cupom removido');
    },
  });

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      partner_name: c.partner_name || '',
      partner_logo_url: c.partner_logo_url || '',
      description: c.description || '',
      coupon_code: c.coupon_code || '',
      discount_label: c.discount_label || '',
      category: c.category || '',
      link_url: c.link_url || '',
      valid_until: c.valid_until ? c.valid_until.split('T')[0] : '',
      order_index: c.order_index || 0,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const updateField = (key: keyof CouponForm, value: any) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Store className="h-5 w-5 text-blue-400" />
          <h1 className="text-lg font-bold text-white">Gerenciar Parceiros</h1>
        </div>
        <Button onClick={openNew} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
          <Plus className="h-4 w-4" /> Novo Cupom
        </Button>
      </header>

      <div className="px-6 pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : !coupons?.length ? (
          <div className="text-center py-20 text-zinc-500">Nenhum cupom cadastrado</div>
        ) : (
          <div className="space-y-3">
            {coupons.map(c => (
              <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#14141f] border border-white/5">
                {c.partner_logo_url ? (
                  <img src={c.partner_logo_url} alt={c.partner_name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-blue-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{c.partner_name}</p>
                  <p className="text-xs text-zinc-500">{c.discount_label} • <code className="text-zinc-400">{c.coupon_code}</code></p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-500'}`}>
                  {c.is_active ? 'Ativo' : 'Inativo'}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => toggleMutation.mutate({ id: c.id, active: !c.is_active })} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400">
                    {c.is_active ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>
                  <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => { if (confirm('Remover cupom?')) deleteMutation.mutate(c.id); }} className="p-2 rounded-lg hover:bg-white/5 text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#14141f] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Cupom' : 'Novo Cupom'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Nome do Parceiro *</label>
              <Input value={form.partner_name} onChange={e => updateField('partner_name', e.target.value)} className="bg-[#0a0a0f] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">URL do Logo</label>
              <Input value={form.partner_logo_url} onChange={e => updateField('partner_logo_url', e.target.value)} placeholder="https://..." className="bg-[#0a0a0f] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Descrição</label>
              <Input value={form.description} onChange={e => updateField('description', e.target.value)} className="bg-[#0a0a0f] border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Código do Cupom *</label>
                <Input value={form.coupon_code} onChange={e => updateField('coupon_code', e.target.value.toUpperCase())} className="bg-[#0a0a0f] border-white/10 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Label do Desconto *</label>
                <Input value={form.discount_label} onChange={e => updateField('discount_label', e.target.value)} placeholder="15% OFF" className="bg-[#0a0a0f] border-white/10 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Categoria</label>
                <Input value={form.category} onChange={e => updateField('category', e.target.value)} placeholder="Equipamentos" className="bg-[#0a0a0f] border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Válido até</label>
                <Input type="date" value={form.valid_until} onChange={e => updateField('valid_until', e.target.value)} className="bg-[#0a0a0f] border-white/10 text-white" />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Link do Site</label>
              <Input value={form.link_url} onChange={e => updateField('link_url', e.target.value)} placeholder="https://..." className="bg-[#0a0a0f] border-white/10 text-white" />
            </div>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!form.partner_name || !form.coupon_code || !form.discount_label || saveMutation.isPending}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Salvar Alterações' : 'Criar Cupom'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
