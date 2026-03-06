import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Settings, Palette, Bell, Globe, Shield, Zap, Loader2, Save, Image, Plus, Trash2, GripVertical, Pencil, X, Upload } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ConectaCapilarSettings {
  name: string;
  description: string;
  dark_theme: boolean;
  show_carousel: boolean;
  primary_color: string;
  community_enabled: boolean;
  gamification_enabled: boolean;
  certificates_enabled: boolean;
  lesson_comments_enabled: boolean;
  offline_download_enabled: boolean;
  notify_new_enrollment: boolean;
  notify_course_completed: boolean;
  notify_community_post: boolean;
  anti_piracy: boolean;
  device_limit: boolean;
}

const DEFAULT_SETTINGS: ConectaCapilarSettings = {
  name: 'Conecta Capilar',
  description: 'Plataforma premium de aprendizado',
  dark_theme: true,
  show_carousel: true,
  primary_color: '#3b82f6',
  community_enabled: true,
  gamification_enabled: true,
  certificates_enabled: false,
  lesson_comments_enabled: true,
  offline_download_enabled: false,
  notify_new_enrollment: true,
  notify_course_completed: true,
  notify_community_post: false,
  anti_piracy: true,
  device_limit: true,
};

export default function NeoAcademyAdminSettings() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<ConectaCapilarSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: savedSettings, isLoading } = useQuery({
    queryKey: ['neoacademy-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('key', 'neoacademy_settings')
        .maybeSingle();
      return data?.value as unknown as ConectaCapilarSettings | null;
    },
  });

  useEffect(() => {
    if (savedSettings) {
      setSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
    }
  }, [savedSettings]);

  const updateSetting = <K extends keyof ConectaCapilarSettings>(key: K, value: ConectaCapilarSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = useMutation({
    mutationFn: async () => {
      const { data: existing } = await supabase
        .from('admin_settings')
        .select('id')
        .eq('key', 'neoacademy_settings')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('admin_settings')
          .update({
            value: settings as any,
            updated_at: new Date().toISOString(),
            updated_by: user?.id || null,
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('admin_settings')
          .insert({
            key: 'neoacademy_settings',
            value: settings as any,
            description: 'Configurações do portal Conecta Capilar',
            updated_by: user?.id || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-settings'] });
      toast.success('Configurações salvas!');
      setHasChanges(false);
    },
    onError: () => toast.error('Erro ao salvar configurações'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-blue-400" />
            <h1 className="text-lg font-bold text-white">Configurações</h1>
          </div>
          {hasChanges && (
            <Button
              onClick={() => saveSettings.mutate()}
              disabled={saveSettings.isPending}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
            >
              {saveSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-6 space-y-6">
        {/* ===== BANNER MANAGEMENT ===== */}
        <BannerManager />
        <section className="p-5 rounded-xl bg-[#14141f] border border-white/5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Geral</h2>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-zinc-400">Nome da Área de Membros</Label>
              <Input
                value={settings.name}
                onChange={e => updateSetting('name', e.target.value)}
                className="bg-[#0a0a0f] border-white/10 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Descrição</Label>
              <Input
                value={settings.description}
                onChange={e => updateSetting('description', e.target.value)}
                className="bg-[#0a0a0f] border-white/10 text-white mt-1"
              />
            </div>
          </div>
        </section>

        <section className="p-5 rounded-xl bg-[#14141f] border border-white/5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Aparência</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Tema Escuro</p>
                <p className="text-xs text-zinc-600">Interface com fundo escuro (estilo streaming)</p>
              </div>
              <Switch checked={settings.dark_theme} onCheckedChange={v => updateSetting('dark_theme', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Carrossel na Home</p>
                <p className="text-xs text-zinc-600">Exibir banner hero com cursos destaques</p>
              </div>
              <Switch checked={settings.show_carousel} onCheckedChange={v => updateSetting('show_carousel', v)} />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Cor Primária</Label>
              <div className="flex gap-2 mt-2">
                {['#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                  <button
                    key={color}
                    onClick={() => updateSetting('primary_color', color)}
                    className={`h-8 w-8 rounded-lg border-2 transition ${
                      settings.primary_color === color ? 'border-white scale-110' : 'border-transparent hover:border-white/50'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="p-5 rounded-xl bg-[#14141f] border border-white/5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Funcionalidades</h2>
          </div>
          <div className="space-y-3">
            {([
              { key: 'community_enabled' as const, label: 'Comunidade', desc: 'Feed de posts entre alunos' },
              { key: 'gamification_enabled' as const, label: 'Gamificação', desc: 'Ranking, pontos e conquistas' },
              { key: 'certificates_enabled' as const, label: 'Certificados', desc: 'Emitir certificado ao concluir curso' },
              { key: 'lesson_comments_enabled' as const, label: 'Comentários nas Aulas', desc: 'Permitir comentários em cada aula' },
              { key: 'offline_download_enabled' as const, label: 'Download Offline', desc: 'Permitir baixar aulas no app' },
            ]).map(feat => (
              <div key={feat.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{feat.label}</p>
                  <p className="text-xs text-zinc-600">{feat.desc}</p>
                </div>
                <Switch
                  checked={settings[feat.key]}
                  onCheckedChange={v => updateSetting(feat.key, v)}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="p-5 rounded-xl bg-[#14141f] border border-white/5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Notificações</h2>
          </div>
          <div className="space-y-3">
            {([
              { key: 'notify_new_enrollment' as const, label: 'Nova Matrícula', desc: 'Notificar quando aluno se matricular' },
              { key: 'notify_course_completed' as const, label: 'Curso Concluído', desc: 'Notificar quando aluno completar curso' },
              { key: 'notify_community_post' as const, label: 'Post na Comunidade', desc: 'Notificar novos posts' },
            ]).map(notif => (
              <div key={notif.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{notif.label}</p>
                  <p className="text-xs text-zinc-600">{notif.desc}</p>
                </div>
                <Switch
                  checked={settings[notif.key]}
                  onCheckedChange={v => updateSetting(notif.key, v)}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="p-5 rounded-xl bg-[#14141f] border border-white/5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Segurança</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Anti-Pirataria</p>
                <p className="text-xs text-zinc-600">Marca d'água com email do aluno nos vídeos</p>
              </div>
              <Switch checked={settings.anti_piracy} onCheckedChange={v => updateSetting('anti_piracy', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Limite de Dispositivos</p>
                <p className="text-xs text-zinc-600">Máximo de 3 dispositivos simultâneos</p>
              </div>
              <Switch checked={settings.device_limit} onCheckedChange={v => updateSetting('device_limit', v)} />
            </div>
          </div>
        </section>

        <Button
          onClick={() => saveSettings.mutate()}
          disabled={saveSettings.isPending || !hasChanges}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white gap-2 disabled:opacity-50"
        >
          {saveSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
