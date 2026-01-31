/**
 * Settings Tab - Module Configuration
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  Camera,
  Package,
  AlertTriangle,
  Shield,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

export function SettingsTab() {
  const handleSave = () => {
    toast.success('Configurações salvas com sucesso');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Photo Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Exigências de Foto
          </CardTitle>
          <CardDescription>
            Configure quando fotos de rótulo são obrigatórias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Exigir foto para todos os itens</Label>
              <p className="text-sm text-muted-foreground">
                Quando ativado, foto do rótulo é obrigatória para finalizar
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Exigir foto para itens críticos</Label>
              <p className="text-sm text-muted-foreground">
                Foto obrigatória apenas para itens marcados como críticos
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Stock Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Controle de Estoque
          </CardTitle>
          <CardDescription>
            Regras de lote, validade e bloqueios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Exigir lote para itens críticos</Label>
              <p className="text-sm text-muted-foreground">
                Número do lote obrigatório para rastreabilidade
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Bloquear itens vencidos</Label>
              <p className="text-sm text-muted-foreground">
                Impede o uso de itens com validade expirada
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Alertar validade próxima (dias)</Label>
              <p className="text-sm text-muted-foreground">
                Dias antes do vencimento para alertar
              </p>
            </div>
            <Input type="number" defaultValue={30} className="w-24" />
          </div>
        </CardContent>
      </Card>

      {/* Divergence Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Regras de Divergência
          </CardTitle>
          <CardDescription>
            Configure limites e aprovações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Limite de divergência aceitável (%)</Label>
              <p className="text-sm text-muted-foreground">
                Divergências acima exigem aprovação
              </p>
            </div>
            <Input type="number" defaultValue={20} className="w-24" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Exigir dupla aprovação para críticos</Label>
              <p className="text-sm text-muted-foreground">
                Itens críticos precisam de Enfermeiro Líder
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Exigir foto adicional em divergência</Label>
              <p className="text-sm text-muted-foreground">
                Foto extra obrigatória quando há divergência
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segregação de Funções
          </CardTitle>
          <CardDescription>
            Regras de segurança e auditoria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Editor de kit não aprova própria divergência</Label>
              <p className="text-sm text-muted-foreground">
                Previne conflito de interesse
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Log imutável obrigatório</Label>
              <p className="text-sm text-muted-foreground">
                Todas as ações são registradas em auditoria
              </p>
            </div>
            <Switch defaultChecked disabled />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
