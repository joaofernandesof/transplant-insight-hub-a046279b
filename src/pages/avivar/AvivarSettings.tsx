/**
 * AvivarSettings - Configurações Gerais do Portal Avivar
 * Foco em: Conta, Aparência, Notificações, Segurança
 * Configurações de IA → /avivar/config
 * Integrações → /avivar/integrations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Bell, 
  User,
  Shield,
  Palette,
  Save,
  Eye,
  EyeOff,
  Key,
  Smartphone,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Bot,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ApiTokensTab } from './settings/ApiTokensTab';
import { WebhooksTab } from './settings/WebhooksTab';

export default function AvivarSettings() {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  
  // Estado do formulário de conta
  const [accountForm, setAccountForm] = useState({
    displayName: '',
    email: '',
    phone: '',
  });
  
  // Estado de notificações
  const [notifications, setNotifications] = useState({
    newLead: true,
    newMessage: true,
    taskOverdue: true,
    appointmentReminder: true,
    dailySummary: false,
    weeklyReport: true,
  });
  
  // Estado de aparência
  const [appearance, setAppearance] = useState({
    compactMode: false,
    showAvatars: true,
    animationsEnabled: true,
  });
  
  // Estado de senha
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Carregar dados do usuário
  useEffect(() => {
    if (user) {
      setAccountForm({
        displayName: user.fullName || user.email?.split('@')[0] || '',
        email: user.email || '',
        phone: '',
      });
    }
  }, [user]);

  const handleSaveAccount = async () => {
    setSaving(true);
    try {
      // Atualizar perfil no Supabase
      const { error } = await supabase
        .from('neohub_users')
        .update({
          full_name: accountForm.displayName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;
      toast.success('Dados salvos com sucesso!');
    } catch (error) {
      console.error('Error saving account:', error);
      toast.error('Erro ao salvar dados');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;
      
      toast.success('Senha alterada com sucesso!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <Settings className="h-6 w-6 text-[hsl(var(--avivar-primary))]" />
            Configurações
          </h1>
          <p className="text-[hsl(var(--avivar-muted-foreground))]">
            Gerencie sua conta, aparência e preferências
          </p>
        </div>
      </div>

      {/* Quick Links - Outras áreas de configuração */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] cursor-pointer hover:border-[hsl(var(--avivar-primary)/0.5)] transition-colors"
          onClick={() => navigate('/avivar/config')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center">
              <Bot className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-[hsl(var(--avivar-foreground))]">Agentes de IA</h3>
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Configurar comportamento da IA</p>
            </div>
            <ExternalLink className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
          </CardContent>
        </Card>

        <Card 
          className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] cursor-pointer hover:border-[hsl(var(--avivar-primary)/0.5)] transition-colors"
          onClick={() => navigate('/avivar/integrations')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
              <Zap className="h-6 w-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-[hsl(var(--avivar-foreground))]">Integrações</h3>
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">WhatsApp, Instagram e mais</p>
            </div>
            <ExternalLink className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))] flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="account" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
            <User className="h-4 w-4 mr-2" />
            Conta
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
            <Palette className="h-4 w-4 mr-2" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
            <Shield className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
            <Key className="h-4 w-4 mr-2" />
            API & Webhooks
          </TabsTrigger>
        </TabsList>

        {/* Aba Conta */}
        <TabsContent value="account">
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--avivar-foreground))]">Informações da Conta</CardTitle>
              <CardDescription>Atualize seus dados pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[hsl(var(--avivar-foreground))]">Nome de exibição</Label>
                  <Input 
                    value={accountForm.displayName}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Seu nome" 
                    className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[hsl(var(--avivar-foreground))]">E-mail</Label>
                  <Input 
                    type="email"
                    value={accountForm.email}
                    disabled
                    className="bg-[hsl(var(--avivar-muted))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))]"
                  />
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    O e-mail não pode ser alterado
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[hsl(var(--avivar-foreground))]">Telefone</Label>
                <Input 
                  type="tel"
                  value={accountForm.phone}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999" 
                  className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                />
              </div>

              <Separator className="bg-[hsl(var(--avivar-border))]" />

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveAccount}
                  disabled={saving}
                  className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Aparência */}
        <TabsContent value="appearance">
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--avivar-foreground))]">Aparência</CardTitle>
              <CardDescription>Personalize a interface do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tema - segue tema do sistema */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
                <div>
                  <p className="font-medium text-[hsl(var(--avivar-foreground))]">Tema do Sistema</p>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                    O portal Avivar segue o tema definido nas preferências do sistema
                  </p>
                </div>
                <Badge className="bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))] border-[hsl(var(--avivar-primary)/0.3)]">
                  Automático
                </Badge>
              </div>

              {/* Modo Compacto */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
                <div>
                  <p className="font-medium text-[hsl(var(--avivar-foreground))]">Modo Compacto</p>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                    Reduz espaçamentos para exibir mais informações
                  </p>
                </div>
                <Switch
                  checked={appearance.compactMode}
                  onCheckedChange={(checked) => setAppearance(prev => ({ ...prev, compactMode: checked }))}
                />
              </div>

              {/* Mostrar Avatares */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
                <div>
                  <p className="font-medium text-[hsl(var(--avivar-foreground))]">Mostrar Avatares</p>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                    Exibe fotos de perfil nas listas e chats
                  </p>
                </div>
                <Switch
                  checked={appearance.showAvatars}
                  onCheckedChange={(checked) => setAppearance(prev => ({ ...prev, showAvatars: checked }))}
                />
              </div>

              {/* Animações */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
                <div>
                  <p className="font-medium text-[hsl(var(--avivar-foreground))]">Animações</p>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                    Ativa transições e efeitos visuais
                  </p>
                </div>
                <Switch
                  checked={appearance.animationsEnabled}
                  onCheckedChange={(checked) => setAppearance(prev => ({ ...prev, animationsEnabled: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Notificações */}
        <TabsContent value="notifications">
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--avivar-foreground))]">Notificações</CardTitle>
              <CardDescription>Configure como e quando receber alertas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notificações em Tempo Real */}
              <div>
                <h4 className="text-sm font-medium text-[hsl(var(--avivar-muted-foreground))] mb-3">
                  Em Tempo Real
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-[hsl(var(--avivar-foreground))]">Novo Lead</p>
                        <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Quando um novo lead entrar</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.newLead}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, newLead: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-[hsl(var(--avivar-foreground))]">Nova Mensagem</p>
                        <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Mensagens recebidas de leads</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.newMessage}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, newMessage: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      </div>
                      <div>
                        <p className="font-medium text-[hsl(var(--avivar-foreground))]">Tarefa Atrasada</p>
                        <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Alertar sobre tarefas vencidas</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.taskOverdue}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, taskOverdue: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-[hsl(var(--avivar-foreground))]">Lembrete de Agendamento</p>
                        <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Antes de consultas marcadas</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.appointmentReminder}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, appointmentReminder: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-[hsl(var(--avivar-border))]" />

              {/* Relatórios */}
              <div>
                <h4 className="text-sm font-medium text-[hsl(var(--avivar-muted-foreground))] mb-3">
                  Relatórios por E-mail
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
                    <div>
                      <p className="font-medium text-[hsl(var(--avivar-foreground))]">Resumo Diário</p>
                      <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Receber resumo das atividades do dia</p>
                    </div>
                    <Switch
                      checked={notifications.dailySummary}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, dailySummary: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
                    <div>
                      <p className="font-medium text-[hsl(var(--avivar-foreground))]">Relatório Semanal</p>
                      <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Métricas e desempenho da semana</p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReport}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyReport: checked }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Segurança */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* Alterar Senha */}
            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                  <Key className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                  Alterar Senha
                </CardTitle>
                <CardDescription>Mantenha sua conta segura com uma senha forte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[hsl(var(--avivar-foreground))]">Nova Senha</Label>
                  <div className="relative">
                    <Input 
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="••••••••" 
                      className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                      ) : (
                        <Eye className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[hsl(var(--avivar-foreground))]">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input 
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="••••••••" 
                      className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                      ) : (
                        <Eye className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleChangePassword}
                  disabled={changingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
                >
                  {changingPassword ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  Alterar Senha
                </Button>
              </CardContent>
            </Card>

            {/* Segurança da Conta */}
            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--avivar-foreground))]">Segurança da Conta</CardTitle>
                <CardDescription>Configurações adicionais de segurança</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 2FA - Em breve */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--avivar-primary)/0.2)] flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                    </div>
                    <div>
                      <p className="font-medium text-[hsl(var(--avivar-foreground))]">Autenticação de 2 Fatores</p>
                      <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                        Adicione uma camada extra de segurança
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[hsl(var(--avivar-muted-foreground))]">
                    Em breve
                  </Badge>
                </div>

                {/* Sessões Ativas */}
                <div className="p-4 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-[hsl(var(--avivar-foreground))]">Sessão Atual</p>
                        <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                          Este dispositivo
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Ativa
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba API & Webhooks */}
        <TabsContent value="api">
          <div className="space-y-6">
            <ApiTokensTab />
            <WebhooksTab />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
