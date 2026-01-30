/**
 * AvivarIntegrations - Página de Integrações Omnichannel
 * Permite integrar canais de comunicação (Instagram, WhatsApp, Facebook, TikTok)
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plug, 
  MessageCircle, 
  Instagram, 
  Facebook, 
  Phone, 
  Video,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Settings,
  Zap,
  Shield,
  RefreshCw,
  Globe,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Channel configuration type
interface ChannelConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
  status: 'connected' | 'disconnected' | 'pending';
  features: string[];
  setupSteps: string[];
}

// Available channels
const CHANNELS: ChannelConfig[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    icon: Phone,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    description: 'Integre seu WhatsApp Business para receber e responder mensagens diretamente no CRM.',
    status: 'disconnected',
    features: [
      'Mensagens automáticas',
      'Templates aprovados',
      'Histórico de conversas',
      'Etiquetas automáticas'
    ],
    setupSteps: [
      'Acesse a Meta Business Suite',
      'Crie ou conecte seu WhatsApp Business',
      'Autorize o acesso ao Avivar',
      'Configure suas mensagens automáticas'
    ]
  },
  {
    id: 'instagram',
    name: 'Instagram Direct',
    icon: Instagram,
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30',
    description: 'Conecte o Instagram para gerenciar DMs e comentários em um só lugar.',
    status: 'disconnected',
    features: [
      'Direct Messages',
      'Respostas a Stories',
      'Comentários em posts',
      'Menções automáticas'
    ],
    setupSteps: [
      'Conecte sua conta do Instagram Business',
      'Vincule ao Facebook Business',
      'Autorize permissões de mensagens',
      'Ative notificações em tempo real'
    ]
  },
  {
    id: 'facebook',
    name: 'Facebook Messenger',
    icon: Facebook,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'Receba mensagens do Messenger da sua página do Facebook.',
    status: 'disconnected',
    features: [
      'Chatbot integrado',
      'Respostas rápidas',
      'Catálogo de produtos',
      'Agendamento automático'
    ],
    setupSteps: [
      'Acesse sua página do Facebook',
      'Conecte ao Meta Business Suite',
      'Autorize acesso às mensagens',
      'Configure respostas automáticas'
    ]
  },
  {
    id: 'tiktok',
    name: 'TikTok Business',
    icon: Video,
    color: 'text-slate-900 dark:text-white',
    bgColor: 'bg-slate-100 dark:bg-slate-800/50',
    description: 'Integre o TikTok para capturar leads dos comentários e mensagens.',
    status: 'disconnected',
    features: [
      'Mensagens diretas',
      'Comentários em vídeos',
      'Lead capture automático',
      'Análise de engajamento'
    ],
    setupSteps: [
      'Crie conta TikTok Business',
      'Acesse o TikTok for Business',
      'Conecte via API',
      'Configure webhooks'
    ]
  }
];

// Channel Card Component
function ChannelCard({ channel, onConnect, onDisconnect, onConfigure }: {
  channel: ChannelConfig;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onConfigure: (id: string) => void;
}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const Icon = channel.icon;
  
  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 2000));
    onConnect(channel.id);
    setIsConnecting(false);
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all hover:shadow-lg",
      channel.status === 'connected' && "ring-2 ring-green-500/50"
    )}>
      {/* Status Badge */}
      <div className="absolute top-3 right-3">
        <Badge 
          variant={channel.status === 'connected' ? 'default' : 'secondary'}
          className={cn(
            "gap-1",
            channel.status === 'connected' && "bg-green-600 text-white",
            channel.status === 'pending' && "bg-yellow-500 text-white"
          )}
        >
          {channel.status === 'connected' && <CheckCircle2 className="h-3 w-3" />}
          {channel.status === 'disconnected' && <XCircle className="h-3 w-3" />}
          {channel.status === 'pending' && <AlertCircle className="h-3 w-3" />}
          {channel.status === 'connected' ? 'Conectado' : 
           channel.status === 'pending' ? 'Pendente' : 'Desconectado'}
        </Badge>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-3 rounded-xl", channel.bgColor)}>
            <Icon className={cn("h-6 w-6", channel.color)} />
          </div>
          <div>
            <CardTitle className="text-lg">{channel.name}</CardTitle>
            <CardDescription className="text-xs">
              {channel.status === 'connected' ? 'Recebendo mensagens' : 'Clique para conectar'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{channel.description}</p>

        {/* Features */}
        <div className="flex flex-wrap gap-1.5">
          {channel.features.slice(0, 3).map((feature, idx) => (
            <Badge key={idx} variant="outline" className="text-xs font-normal">
              {feature}
            </Badge>
          ))}
          {channel.features.length > 3 && (
            <Badge variant="outline" className="text-xs font-normal">
              +{channel.features.length - 3}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          {channel.status === 'connected' ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 gap-1.5"
                onClick={() => onConfigure(channel.id)}
              >
                <Settings className="h-4 w-4" />
                Configurar
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDisconnect(channel.id)}
              >
                Desconectar
              </Button>
            </>
          ) : (
            <Button 
              size="sm" 
              className="flex-1 gap-1.5 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary))]/90"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Plug className="h-4 w-4" />
                  Conectar
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AvivarIntegrations() {
  const [channels, setChannels] = useState(CHANNELS);
  const [configDialog, setConfigDialog] = useState<string | null>(null);

  const connectedCount = channels.filter(c => c.status === 'connected').length;

  const handleConnect = (id: string) => {
    setChannels(prev => prev.map(c => 
      c.id === id ? { ...c, status: 'connected' as const } : c
    ));
    toast.success(`${channels.find(c => c.id === id)?.name} conectado com sucesso!`, {
      description: 'As mensagens agora aparecerão na aba Chats.'
    });
  };

  const handleDisconnect = (id: string) => {
    setChannels(prev => prev.map(c => 
      c.id === id ? { ...c, status: 'disconnected' as const } : c
    ));
    toast.info(`${channels.find(c => c.id === id)?.name} desconectado.`);
  };

  const handleConfigure = (id: string) => {
    setConfigDialog(id);
  };

  const selectedChannel = channels.find(c => c.id === configDialog);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <Globe className="h-6 w-6 text-[hsl(var(--avivar-primary))]" />
            Integrações Omnichannel
          </h1>
          <p className="text-[hsl(var(--avivar-muted-foreground))]">
            Conecte seus canais de comunicação e centralize todas as conversas em um só lugar
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
            <Zap className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
            {connectedCount} de {channels.length} conectados
          </Badge>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="bg-[hsl(var(--avivar-primary))]/10 border-[hsl(var(--avivar-primary))]/30">
        <Shield className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
        <AlertTitle>Central de Atendimento Unificada</AlertTitle>
        <AlertDescription>
          Ao conectar seus canais, todas as mensagens serão centralizadas na aba <strong>Chats</strong>. 
          Você poderá identificar a origem de cada lead pelo ícone do canal (WhatsApp, Instagram, etc).
        </AlertDescription>
      </Alert>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {channels.map(channel => (
          <ChannelCard 
            key={channel.id} 
            channel={channel}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onConfigure={handleConfigure}
          />
        ))}
      </div>

      {/* Connected Channels Summary */}
      {connectedCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
              Canais Ativos
            </CardTitle>
            <CardDescription>
              Mensagens destes canais aparecerão automaticamente na aba Chats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {channels.filter(c => c.status === 'connected').map(channel => {
                const Icon = channel.icon;
                return (
                  <div 
                    key={channel.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg",
                      channel.bgColor
                    )}
                  >
                    <Icon className={cn("h-4 w-4", channel.color)} />
                    <span className="text-sm font-medium">{channel.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Sincronizado
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Dialog */}
      <Dialog open={!!configDialog} onOpenChange={() => setConfigDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedChannel && (
                <>
                  <selectedChannel.icon className={cn("h-5 w-5", selectedChannel.color)} />
                  Configurar {selectedChannel.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Ajuste as configurações do canal de comunicação
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificações em tempo real</Label>
                <p className="text-xs text-muted-foreground">Receba alertas de novas mensagens</p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Resposta automática</Label>
                <p className="text-xs text-muted-foreground">Enviar mensagem de boas-vindas</p>
              </div>
              <Switch />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Sincronizar histórico</Label>
                <p className="text-xs text-muted-foreground">Importar conversas anteriores</p>
              </div>
              <Switch />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input 
                readOnly 
                value="https://api.avivar.com/webhooks/..."
                className="text-xs font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Configure este webhook no painel do {selectedChannel?.name}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfigDialog(null)}>
              Fechar
            </Button>
            <Button 
              className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary))]/90"
              onClick={() => {
                toast.success('Configurações salvas!');
                setConfigDialog(null);
              }}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Section */}
      <Card className="bg-muted/30">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h3 className="font-semibold mb-1">Precisa de ajuda para integrar?</h3>
              <p className="text-sm text-muted-foreground">
                Nossa equipe pode ajudar você a configurar suas integrações
              </p>
            </div>
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Ver documentação
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
