import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Image, Plus, Trash2, Pencil, X, Upload, Loader2, Save, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  is_active: boolean;
  order_index: number;
}

const EMPTY_BANNER = { title: '', subtitle: '', image_url: '', link_url: '', link_label: 'Saiba Mais', is_active: true };

export function BannerManager() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(EMPTY_BANNER);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: banners, isLoading } = useQuery({
    queryKey: ['neoacademy-banners-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoacademy_banners')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return (data || []) as Banner[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isNew) {
        const maxOrder = Math.max(0, ...(banners || []).map(b => b.order_index));
        const { error } = await supabase.from('neoacademy_banners').insert({
          title: form.title || null,
          subtitle: form.subtitle || null,
          image_url: form.image_url || null,
          link_url: form.link_url || null,
          link_label: form.link_label || 'Saiba Mais',
          is_active: form.is_active,
          order_index: maxOrder + 1,
        });
        if (error) throw error;
      } else if (editing) {
        const { error } = await supabase.from('neoacademy_banners').update({
          title: form.title || null,
          subtitle: form.subtitle || null,
          image_url: form.image_url || null,
          link_url: form.link_url || null,
          link_label: form.link_label || 'Saiba Mais',
          is_active: form.is_active,
          updated_at: new Date().toISOString(),
        }).eq('id', editing.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-banners-admin'] });
      queryClient.invalidateQueries({ queryKey: ['neoacademy-banners'] });
      toast.success(isNew ? 'Banner criado!' : 'Banner atualizado!');
      closeForm();
    },
    onError: () => toast.error('Erro ao salvar banner'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('neoacademy_banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-banners-admin'] });
      queryClient.invalidateQueries({ queryKey: ['neoacademy-banners'] });
      toast.success('Banner removido');
    },
  });

  const closeForm = () => {
    setEditing(null);
    setIsNew(false);
    setForm(EMPTY_BANNER);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setIsNew(false);
    setForm({
      title: b.title || '',
      subtitle: b.subtitle || '',
      image_url: b.image_url || '',
      link_url: b.link_url || '',
      link_label: b.link_label || 'Saiba Mais',
      is_active: b.is_active,
    });
  };

  const openNew = () => {
    setEditing(null);
    setIsNew(true);
    setForm(EMPTY_BANNER);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `banners/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('materials').upload(path, file, { upsert: true });
    if (error) {
      toast.error('Erro no upload');
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from('materials').getPublicUrl(path);
    setForm(f => ({ ...f, image_url: pub.publicUrl }));
    setUploading(false);
  };

  const showForm = isNew || !!editing;

  return (
    <section className="p-5 rounded-xl bg-[#14141f] border border-white/5 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white">Banners do Carrossel</h2>
        </div>
        {!showForm && (
          <Button size="sm" variant="ghost" onClick={openNew} className="text-blue-400 hover:text-blue-300 gap-1">
            <Plus className="h-4 w-4" /> Novo
          </Button>
        )}
      </div>

      {/* List */}
      {!showForm && (
        <div className="space-y-2">
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-zinc-500 mx-auto" />}
          {banners?.map(b => (
            <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0f] border border-white/5">
              <GripVertical className="h-4 w-4 text-zinc-600 shrink-0" />
              <div className="h-12 w-20 rounded-md bg-zinc-800 overflow-hidden shrink-0">
                {b.image_url ? (
                  <img src={b.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="h-4 w-4 text-zinc-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{b.title || '(sem título)'}</p>
                <p className="text-xs text-zinc-500">{b.is_active ? 'Ativo' : 'Inativo'}</p>
              </div>
              <button onClick={() => openEdit(b)} className="p-1.5 rounded-md hover:bg-white/5 text-zinc-400 hover:text-white">
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => { if (confirm('Remover banner?')) deleteMutation.mutate(b.id); }}
                className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-400 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {!isLoading && (!banners || banners.length === 0) && (
            <p className="text-xs text-zinc-500 text-center py-4">Nenhum banner cadastrado</p>
          )}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="space-y-3 p-4 rounded-lg bg-[#0a0a0f] border border-white/10">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-white">{isNew ? 'Novo Banner' : 'Editar Banner'}</p>
            <button onClick={closeForm} className="text-zinc-400 hover:text-white"><X className="h-4 w-4" /></button>
          </div>

          <div>
            <Label className="text-xs text-zinc-400">Título</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-[#14141f] border-white/10 text-white mt-1" placeholder="Ex: MBA em Saúde Capilar" />
          </div>

          <div>
            <Label className="text-xs text-zinc-400">Subtítulo</Label>
            <Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} className="bg-[#14141f] border-white/10 text-white mt-1" placeholder="Descrição breve" />
          </div>

          <div>
            <Label className="text-xs text-zinc-400">Imagem</Label>
            <div className="flex gap-2 mt-1">
              <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className="bg-[#14141f] border-white/10 text-white flex-1" placeholder="URL da imagem" />
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="border-white/10 text-zinc-300 gap-1">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </Button>
            </div>
            {form.image_url && (
              <div className="mt-2 h-24 rounded-lg overflow-hidden bg-zinc-800">
                <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-zinc-400">Link (opcional)</Label>
              <Input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} className="bg-[#14141f] border-white/10 text-white mt-1" placeholder="/neoacademy/course/..." />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Texto do Botão</Label>
              <Input value={form.link_label} onChange={e => setForm(f => ({ ...f, link_label: e.target.value }))} className="bg-[#14141f] border-white/10 text-white mt-1" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <span className="text-xs text-zinc-400">Ativo</span>
            </div>
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-blue-500 hover:bg-blue-600 text-white gap-1">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
