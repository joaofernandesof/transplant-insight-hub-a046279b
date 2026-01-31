/**
 * AvivarIntegrations - Página de Integrações do Avivar CRM
 * Permite usuários gerenciar suas instâncias de WhatsApp via UazAPI
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  Wifi, 
  WifiOff, 
  Settings, 
  RefreshCw, 
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';
import { useUazApiIntegration } from '@/hooks/useUazApiIntegration';
import { UazApiConnectionDialog } from '@/components/avivar/UazApiConnectionDialog';
import { cn } from '@/lib/utils';

export default function AvivarIntegrations() {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  
  const {
    instance,
    isLoading,
    isCreating,
    isConnecting,
    createInstance,
    connectInstance,
    disconnectInstance,
    checkStatus,
    deleteInstance
  } = useUazApiIntegration();

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30 gap-1.5"><CheckCircle2 className="h-3 w-3" />Conectado</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 gap-1.5"><Loader2 className="h-3 w-3 animate-spin" />Conectando</Badge>;
      case 'disconnected':
        return <Badge variant="outline" className="text-muted-foreground gap-1.5"><WifiOff className="h-3 w-3" />Desconectado</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground gap-1.5"><AlertCircle className="h-3 w-3" />Sem instância</Badge>;
    }
  };

  const handleCreateInstance = async () => {
    await createInstance();
  };

  const handleConnect = () => {
    setShowConnectionDialog(true);
  };

  const handleConnectionSuccess = () => {
    setShowConnectionDialog(false);
    checkStatus();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">Integrações</h1>
          <p className="text-muted-foreground">Gerencie suas conexões e integrações</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="whatsapp" className="space-y-6">
        <TabsList className="bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))]">
          <TabsTrigger 
            value="whatsapp" 
            className="gap-2 data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white"
          >
            <Phone className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="space-y-6">
          {/* Status Card */}
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    instance?.status === 'connected' 
                      ? "bg-green-500/20" 
                      : "bg-[hsl(var(--avivar-primary)/0.2)]"
                  )}>
                    <Phone className={cn(
                      "h-6 w-6",
                      instance?.status === 'connected' 
                        ? "text-green-600" 
                        : "text-[hsl(var(--avivar-primary))]"
                    )} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">WhatsApp Business</CardTitle>
                    <CardDescription>Conecte seu WhatsApp para atender clientes</CardDescription>
                  </div>
                </div>
                {getStatusBadge(instance?.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Instance Info */}
              {instance && (
                <div className="p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Nome da Instância</p>
                      <p className="font-medium">{instance.instance_name || 'Minha Instância'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Número</p>
                      <p className="font-medium">{instance.phone_number || 'Não conectado'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Perfil</p>
                      <p className="font-medium">{instance.profile_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Última Sincronização</p>
                      <p className="font-medium">
                        {instance.last_sync_at 
                          ? new Date(instance.last_sync_at).toLocaleString('pt-BR')
                          : '-'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {!instance ? (
                  <Button 
                    onClick={handleCreateInstance}
                    disabled={isCreating}
                    className="gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary))]/90"
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Criar Instância
                  </Button>
                ) : instance.status === 'disconnected' ? (
                  <>
                    <Button 
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary))]/90"
                    >
                      {isConnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <QrCode className="h-4 w-4" />
                      )}
                      Conectar WhatsApp
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => deleteInstance()}
                      disabled={isLoading}
                      className="gap-2 text-destructive hover:bg-destructive/10 border-destructive/30"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir Instância
                    </Button>
                  </>
                ) : instance.status === 'connected' ? (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => checkStatus()}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                      Atualizar Status
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => disconnectInstance()}
                      disabled={isLoading}
                      className="gap-2 text-destructive hover:bg-destructive/10 border-destructive/30"
                    >
                      <WifiOff className="h-4 w-4" />
                      Desconectar
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={() => checkStatus()}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    Verificar Conexão
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                Como Conectar seu WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                <li><strong>Criar Instância:</strong> Clique em "Criar Instância" para gerar sua conexão</li>
                <li><strong>Conectar:</strong> Escolha entre QR Code ou Código de Pareamento</li>
                <li><strong>QR Code:</strong> Abra o WhatsApp {'>'} Configurações {'>'} Aparelhos Conectados {'>'} Escanear QR</li>
                <li><strong>Código:</strong> Insira o número do WhatsApp para receber o código de pareamento</li>
                <li><strong>Pronto!</strong> Suas mensagens serão sincronizadas automaticamente</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connection Dialog */}
      <UazApiConnectionDialog
        open={showConnectionDialog}
        onOpenChange={setShowConnectionDialog}
        onSuccess={handleConnectionSuccess}
        instanceToken={instance?.instance_token}
      />
    </div>
  );
}
