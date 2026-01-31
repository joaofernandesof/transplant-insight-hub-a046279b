/**
 * Stock Settings Tab - Configurações do módulo de estoque
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
  AlertTriangle,
  Package,
  Save
} from 'lucide-react';

export function StockSettingsTab() {
  return (
    <div className="space-y-6">
      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure alertas e notificações de estoque
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alerta de estoque baixo</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificação quando um item atingir o ponto de reposição
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alerta de estoque crítico</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificação urgente quando um item atingir quantidade mínima
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alerta de validade</Label>
              <p className="text-sm text-muted-foreground">
                Notificar sobre itens próximos da data de validade
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Parâmetros Padrão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Parâmetros Padrão
          </CardTitle>
          <CardDescription>
            Valores padrão para novos itens de estoque
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default-min">Quantidade Mínima Padrão</Label>
              <Input id="default-min" type="number" defaultValue={5} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-reorder">Ponto de Reposição Padrão</Label>
              <Input id="default-reorder" type="number" defaultValue={10} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiry-alert">Alerta de Validade (dias antes)</Label>
            <Input id="expiry-alert" type="number" defaultValue={30} className="max-w-[200px]" />
          </div>
        </CardContent>
      </Card>

      {/* Regras de Divergência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Regras de Divergência
          </CardTitle>
          <CardDescription>
            Configurações para controle de divergências de consumo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Exigir justificativa para divergências</Label>
              <p className="text-sm text-muted-foreground">
                Obrigar justificativa quando consumo diferir do esperado
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-divergence">Divergência Máxima Permitida (%)</Label>
            <Input id="max-divergence" type="number" defaultValue={20} className="max-w-[200px]" />
            <p className="text-xs text-muted-foreground">
              Acima deste percentual, requer aprovação de supervisor
            </p>
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
