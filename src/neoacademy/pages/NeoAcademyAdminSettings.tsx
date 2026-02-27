import React from 'react';
import { Settings, Palette, Bell, Globe, Shield, Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function NeoAcademyAdminSettings() {
  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-violet-400" />
          <h1 className="text-lg font-bold text-white">Configurações</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pt-6 space-y-6">
        {/* General */}
        <section className="p-5 rounded-xl bg-[#14141f] border border-white/5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-bold text-white">Geral</h2>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-zinc-400">Nome da Área de Membros</Label>
              <Input defaultValue="NeoAcademy" className="bg-[#0a0a0f] border-white/10 text-white mt-1" />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Descrição</Label>
              <Input defaultValue="Plataforma premium de aprendizado" className="bg-[#0a0a0f] border-white/10 text-white mt-1" />
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="p-5 rounded-xl bg-[#14141f] border border-white/5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-bold text-white">Aparência</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Tema Escuro</p>
                <p className="text-xs text-zinc-600">Interface com fundo escuro (estilo streaming)</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Carrossel na Home</p>
                <p className="text-xs text-zinc-600">Exibir banner hero com cursos destaques</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Cor Primária</Label>
              <div className="flex gap-2 mt-2">
                {['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                  <button
                    key={color}
                    className="h-8 w-8 rounded-lg border-2 border-transparent hover:border-white/50 transition"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="p-5 rounded-xl bg-[#14141f] border border-white/5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-bold text-white">Funcionalidades</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Comunidade', desc: 'Feed de posts entre alunos', default: true },
              { label: 'Gamificação', desc: 'Ranking, pontos e conquistas', default: true },
              { label: 'Certificados', desc: 'Emitir certificado ao concluir curso', default: false },
              { label: 'Comentários nas Aulas', desc: 'Permitir comentários em cada aula', default: true },
              { label: 'Download Offline', desc: 'Permitir baixar aulas no app', default: false },
            ].map(feat => (
              <div key={feat.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{feat.label}</p>
                  <p className="text-xs text-zinc-600">{feat.desc}</p>
                </div>
                <Switch defaultChecked={feat.default} />
              </div>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className="p-5 rounded-xl bg-[#14141f] border border-white/5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-bold text-white">Notificações</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Nova Matrícula', desc: 'Notificar quando aluno se matricular', default: true },
              { label: 'Curso Concluído', desc: 'Notificar quando aluno completar curso', default: true },
              { label: 'Post na Comunidade', desc: 'Notificar novos posts', default: false },
            ].map(notif => (
              <div key={notif.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{notif.label}</p>
                  <p className="text-xs text-zinc-600">{notif.desc}</p>
                </div>
                <Switch defaultChecked={notif.default} />
              </div>
            ))}
          </div>
        </section>

        {/* Security */}
        <section className="p-5 rounded-xl bg-[#14141f] border border-white/5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-bold text-white">Segurança</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Anti-Pirataria</p>
                <p className="text-xs text-zinc-600">Marca d'água com email do aluno nos vídeos</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Limite de Dispositivos</p>
                <p className="text-xs text-zinc-600">Máximo de 3 dispositivos simultâneos</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </section>

        <Button className="w-full bg-violet-500 hover:bg-violet-600 text-white">
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
