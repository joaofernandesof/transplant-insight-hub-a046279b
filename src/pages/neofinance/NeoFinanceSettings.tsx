/**
 * NeoFinance Settings - Configurações do portal
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Bell,
  Shield,
  Download,
  Save,
} from 'lucide-react';

export default function NeoFinanceSettings() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configurações
        </h1>
        <p className="text-muted-foreground">Configurações do portal financeiro</p>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>Configure alertas financeiros</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alerta de inadimplência</Label>
              <p className="text-sm text-muted-foreground">
                Notificar quando uma conta ficar em atraso
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Resumo diário</Label>
              <p className="text-sm text-muted-foreground">
                Receber resumo das transações do dia
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alerta de chargebacks</Label>
              <p className="text-sm text-muted-foreground">
                Notificar imediatamente sobre disputas
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Relatório semanal</Label>
              <p className="text-sm text-muted-foreground">
                Enviar relatório consolidado toda segunda-feira
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportação de Dados
          </CardTitle>
          <CardDescription>Configure formatos e destinos de exportação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Formato padrão</Label>
              <Input defaultValue="Excel (.xlsx)" disabled />
            </div>
            <div className="space-y-2">
              <Label>E-mail para relatórios</Label>
              <Input placeholder="financeiro@empresa.com" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissões
          </CardTitle>
          <CardDescription>Níveis de acesso ao portal financeiro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>O acesso ao NeoFinance é restrito a usuários com perfil <strong>Administrador</strong>.</p>
            <p className="mt-2">Para alterar permissões, acesse o painel de administração.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
