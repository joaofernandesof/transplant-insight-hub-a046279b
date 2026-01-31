/**
 * VoipCallCenterTab - Central de Ligações com Discador e Controles
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Phone, 
  PhoneOff,
  PhoneForwarded,
  Mic,
  MicOff,
  Pause,
  Play,
  Users,
  Volume2,
  VolumeX,
  Hash,
  User,
  Clock,
  PhoneIncoming,
  PhoneOutgoing,
  Headphones,
  MessageSquare,
  ArrowRightLeft,
  UserPlus,
  Search,
  Zap,
  Timer,
  Target
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data
const recentContacts = [
  { id: '1', name: 'Maria Santos', phone: '(11) 99999-1234', lastCall: '10min atrás', status: 'lead' },
  { id: '2', name: 'João Silva', phone: '(11) 98888-5678', lastCall: '25min atrás', status: 'cliente' },
  { id: '3', name: 'Ana Oliveira', phone: '(21) 97777-9012', lastCall: '1h atrás', status: 'prospect' },
  { id: '4', name: 'Carlos Lima', phone: '(31) 96666-3456', lastCall: '2h atrás', status: 'lead' },
  { id: '5', name: 'Fernanda Costa', phone: '(41) 95555-7890', lastCall: '3h atrás', status: 'cliente' },
];

const queueCalls = [
  { id: '1', name: 'Pedro Alves', phone: '(11) 94444-1111', waitTime: '1:45', queue: 'Comercial' },
  { id: '2', name: 'Lucia Mendes', phone: '(21) 93333-2222', waitTime: '0:55', queue: 'Suporte' },
  { id: '3', name: 'Roberto Dias', phone: '(31) 92222-3333', waitTime: '0:30', queue: 'Agendamento' },
];

const campaignLeads = [
  { id: '1', name: 'Empresa ABC', phone: '(11) 3333-4444', attempts: 0, priority: 'alta' },
  { id: '2', name: 'Clínica XYZ', phone: '(11) 4444-5555', attempts: 1, priority: 'media' },
  { id: '3', name: 'Instituto DEF', phone: '(21) 5555-6666', attempts: 2, priority: 'baixa' },
  { id: '4', name: 'Centro GHI', phone: '(31) 6666-7777', attempts: 0, priority: 'alta' },
  { id: '5', name: 'Consultório JKL', phone: '(41) 7777-8888', attempts: 1, priority: 'media' },
];

const agents = [
  { id: '1', name: 'Ana Silva', extension: '101', status: 'available' },
  { id: '2', name: 'Carlos Santos', extension: '102', status: 'busy' },
  { id: '3', name: 'Maria Oliveira', extension: '103', status: 'available' },
];

export default function VoipCallCenterTab() {
  const [dialNumber, setDialNumber] = useState('');
  const [isOnCall, setIsOnCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callDuration, setCallDuration] = useState('00:00');
  const [dialerMode, setDialerMode] = useState<'manual' | 'power' | 'predictive'>('manual');
  const [searchContact, setSearchContact] = useState('');

  const handleDial = (digit: string) => {
    setDialNumber(prev => prev + digit);
  };

  const handleCall = () => {
    if (dialNumber) {
      setIsOnCall(true);
      // Simulate call timer
      let seconds = 0;
      const timer = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        setCallDuration(`${mins}:${secs}`);
      }, 1000);
    }
  };

  const handleHangUp = () => {
    setIsOnCall(false);
    setCallDuration('00:00');
    setDialNumber('');
    setIsMuted(false);
    setIsOnHold(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Painel Principal - Discador */}
      <Card className="lg:col-span-1 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <Phone className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            Discador
          </CardTitle>
          <CardDescription>
            <Select value={dialerMode} onValueChange={(v: any) => setDialerMode(v)}>
              <SelectTrigger className="w-full bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]">
                <SelectValue placeholder="Modo de discagem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">
                  <span className="flex items-center gap-2">
                    <Hash className="h-4 w-4" /> Manual
                  </span>
                </SelectItem>
                <SelectItem value="power">
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Power Dialer
                  </span>
                </SelectItem>
                <SelectItem value="predictive">
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4" /> Preditivo
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display de número */}
          <div className="relative">
            <Input
              value={dialNumber}
              onChange={(e) => setDialNumber(e.target.value)}
              placeholder="Digite o número..."
              className="text-center text-xl font-mono bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] h-14"
              disabled={isOnCall}
            />
            {isOnCall && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 rounded-md border border-green-500/30">
                <div className="text-center">
                  <p className="text-green-500 font-semibold">Em ligação</p>
                  <p className="text-2xl font-mono text-[hsl(var(--avivar-foreground))]">{callDuration}</p>
                </div>
              </div>
            )}
          </div>

          {/* Teclado numérico */}
          {!isOnCall && (
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                <Button
                  key={digit}
                  variant="outline"
                  className="h-14 text-xl font-semibold bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
                  onClick={() => handleDial(digit)}
                >
                  {digit}
                </Button>
              ))}
            </div>
          )}

          {/* Controles de chamada */}
          <div className="grid grid-cols-4 gap-2">
            {isOnCall ? (
              <>
                <Button
                  variant="outline"
                  className={`flex flex-col items-center gap-1 h-16 ${isMuted ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]'}`}
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  <span className="text-xs">Mudo</span>
                </Button>
                <Button
                  variant="outline"
                  className={`flex flex-col items-center gap-1 h-16 ${isOnHold ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : 'bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]'}`}
                  onClick={() => setIsOnHold(!isOnHold)}
                >
                  {isOnHold ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                  <span className="text-xs">Espera</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-1 h-16 bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                >
                  <ArrowRightLeft className="h-5 w-5" />
                  <span className="text-xs">Transferir</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-1 h-16 bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                >
                  <UserPlus className="h-5 w-5" />
                  <span className="text-xs">Conferência</span>
                </Button>
              </>
            ) : (
              <>
                <div className="col-span-4">
                  <Button
                    className="w-full h-14 bg-green-500 hover:bg-green-600 text-white"
                    onClick={handleCall}
                    disabled={!dialNumber}
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Ligar
                  </Button>
                </div>
              </>
            )}
          </div>

          {isOnCall && (
            <Button
              variant="destructive"
              className="w-full h-12"
              onClick={handleHangUp}
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              Encerrar Ligação
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Painel Central - Contatos e Filas */}
      <Card className="lg:col-span-2 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[hsl(var(--avivar-foreground))]">Gerenciamento de Chamadas</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
              <Input
                placeholder="Buscar contato..."
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                className="pl-9 bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="queue" className="space-y-4">
            <TabsList className="bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
              <TabsTrigger value="queue" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
                <PhoneIncoming className="h-4 w-4 mr-2" />
                Fila ({queueCalls.length})
              </TabsTrigger>
              <TabsTrigger value="campaign" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
                <PhoneOutgoing className="h-4 w-4 mr-2" />
                Campanha ({campaignLeads.length})
              </TabsTrigger>
              <TabsTrigger value="recent" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
                <Clock className="h-4 w-4 mr-2" />
                Recentes
              </TabsTrigger>
              <TabsTrigger value="agents" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
                <Headphones className="h-4 w-4 mr-2" />
                Agentes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="queue">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {queueCalls.map((call) => (
                    <div
                      key={call.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-[hsl(var(--avivar-primary)/0.1)] text-[hsl(var(--avivar-primary))]">
                            {call.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-[hsl(var(--avivar-foreground))]">{call.name}</p>
                          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">{call.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">{call.queue}</Badge>
                          <p className="text-sm text-yellow-500 flex items-center gap-1">
                            <Timer className="h-3 w-3" /> {call.waitTime}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => {
                            setDialNumber(call.phone);
                            handleCall();
                          }}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="campaign">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {campaignLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-[hsl(var(--avivar-primary)/0.1)] text-[hsl(var(--avivar-primary))]">
                            {lead.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-[hsl(var(--avivar-foreground))]">{lead.name}</p>
                          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">{lead.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge 
                            className={`mb-1 ${
                              lead.priority === 'alta' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              lead.priority === 'media' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                              'bg-gray-500/10 text-gray-500 border-gray-500/20'
                            }`}
                          >
                            {lead.priority}
                          </Badge>
                          <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                            {lead.attempts} tentativas
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => setDialNumber(lead.phone)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="recent">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {recentContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-[hsl(var(--avivar-primary)/0.1)] text-[hsl(var(--avivar-primary))]">
                            {contact.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-[hsl(var(--avivar-foreground))]">{contact.name}</p>
                          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">{contact.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1 capitalize">{contact.status}</Badge>
                          <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">{contact.lastCall}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                          onClick={() => setDialNumber(contact.phone)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="agents">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-[hsl(var(--avivar-primary)/0.1)] text-[hsl(var(--avivar-primary))]">
                              {agent.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[hsl(var(--avivar-card))] ${
                            agent.status === 'available' ? 'bg-green-500' : 'bg-yellow-500'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-[hsl(var(--avivar-foreground))]">{agent.name}</p>
                          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Ramal {agent.extension}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={agent.status === 'available' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}
                        >
                          {agent.status === 'available' ? 'Disponível' : 'Ocupado'}
                        </Badge>
                        <Button size="sm" variant="outline" disabled={agent.status !== 'available'}>
                          <PhoneForwarded className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
