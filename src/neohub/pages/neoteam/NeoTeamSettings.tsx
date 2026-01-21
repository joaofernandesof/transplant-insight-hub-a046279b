import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Settings, User, Bell, Shield, Clock,
  Camera, Save
} from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export default function NeoTeamSettings() {
  const { user } = useUnifiedAuth();

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configurações
        </h1>
        <p className="text-muted-foreground">Gerencie suas preferências e configurações</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil
          </CardTitle>
          <CardDescription>Suas informações pessoais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button 
                size="icon" 
                variant="outline" 
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-lg">{user?.fullName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Colaborador</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" defaultValue={user?.fullName || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" defaultValue={user?.phone || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Input id="role" defaultValue="Recepcionista" disabled />
            </div>
          </div>

          <Button className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Alterações
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>Configure como deseja receber alertas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Novos Agendamentos</p>
              <p className="text-sm text-muted-foreground">Receber alerta quando houver novo agendamento</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Chegada de Pacientes</p>
              <p className="text-sm text-muted-foreground">Alertar quando paciente chegar na recepção</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Cancelamentos</p>
              <p className="text-sm text-muted-foreground">Notificar sobre cancelamentos de consultas</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Tempo de Espera Longo</p>
              <p className="text-sm text-muted-foreground">Alertar quando paciente aguarda há mais de 20 min</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Work Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horário de Trabalho
          </CardTitle>
          <CardDescription>Configure seu expediente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Entrada</Label>
              <Input type="time" defaultValue="08:00" />
            </div>
            <div className="space-y-2">
              <Label>Saída</Label>
              <Input type="time" defaultValue="18:00" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificar fim do expediente</p>
              <p className="text-sm text-muted-foreground">Receber lembrete 15 min antes</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança
          </CardTitle>
          <CardDescription>Configurações de acesso e senha</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">Alterar Senha</Button>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Autenticação em Duas Etapas</p>
              <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
