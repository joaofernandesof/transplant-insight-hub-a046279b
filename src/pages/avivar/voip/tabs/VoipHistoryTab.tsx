/**
 * VoipHistoryTab - Histórico de Ligações e Gravações
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Play,
  Pause,
  Download,
  FileText,
  Clock,
  User,
  Calendar,
  Filter,
  Smile,
  Meh,
  Frown,
  Tag,
  Volume2,
  ChevronDown,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data
const callHistory = [
  {
    id: '1',
    contact: 'Maria Santos',
    phone: '(11) 99999-1234',
    direction: 'inbound',
    status: 'answered',
    duration: '5:32',
    date: '2026-01-31',
    time: '14:30',
    agent: 'Ana Silva',
    sentiment: 'positive',
    hasRecording: true,
    hasTranscript: true,
    score: 92,
    keywords: ['agendamento', 'transplante', 'valor'],
  },
  {
    id: '2',
    contact: 'João Pereira',
    phone: '(11) 98888-5678',
    direction: 'outbound',
    status: 'answered',
    duration: '3:15',
    date: '2026-01-31',
    time: '13:45',
    agent: 'Carlos Santos',
    sentiment: 'neutral',
    hasRecording: true,
    hasTranscript: true,
    score: 78,
    keywords: ['dúvida', 'preço', 'procedimento'],
  },
  {
    id: '3',
    contact: 'Ana Oliveira',
    phone: '(21) 97777-9012',
    direction: 'inbound',
    status: 'missed',
    duration: '0:00',
    date: '2026-01-31',
    time: '12:20',
    agent: '-',
    sentiment: null,
    hasRecording: false,
    hasTranscript: false,
    score: null,
    keywords: [],
  },
  {
    id: '4',
    contact: 'Roberto Lima',
    phone: '(31) 96666-3456',
    direction: 'outbound',
    status: 'answered',
    duration: '8:47',
    date: '2026-01-31',
    time: '11:00',
    agent: 'Maria Oliveira',
    sentiment: 'positive',
    hasRecording: true,
    hasTranscript: true,
    score: 95,
    keywords: ['fechamento', 'contrato', 'agendamento', 'satisfação'],
  },
  {
    id: '5',
    contact: 'Fernanda Costa',
    phone: '(41) 95555-7890',
    direction: 'inbound',
    status: 'answered',
    duration: '2:10',
    date: '2026-01-30',
    time: '17:30',
    agent: 'João Pedro',
    sentiment: 'negative',
    hasRecording: true,
    hasTranscript: true,
    score: 45,
    keywords: ['reclamação', 'cancelamento', 'insatisfação'],
  },
];

const mockTranscript = [
  { speaker: 'Agente', time: '00:00', text: 'Olá, bom dia! Meu nome é Ana, da NeoFolic. Com quem eu falo?' },
  { speaker: 'Cliente', time: '00:05', text: 'Oi, bom dia! Aqui é a Maria Santos.' },
  { speaker: 'Agente', time: '00:09', text: 'Olá Maria! Tudo bem? Vi que você entrou em contato pelo nosso site interessada em transplante capilar. Posso ajudar com mais informações?' },
  { speaker: 'Cliente', time: '00:18', text: 'Sim! Quero saber mais sobre o procedimento e os valores.' },
  { speaker: 'Agente', time: '00:24', text: 'Claro! Temos várias opções de procedimento. Você já fez alguma avaliação presencial?' },
  { speaker: 'Cliente', time: '00:32', text: 'Ainda não. Como faço para agendar?' },
  { speaker: 'Agente', time: '00:36', text: 'Posso agendar para você agora mesmo. Temos horários disponíveis para esta semana. Qual o melhor dia para você?' },
];

export default function VoipHistoryTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCall, setSelectedCall] = useState<typeof callHistory[0] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const getDirectionIcon = (direction: string) => {
    return direction === 'inbound' ? (
      <PhoneIncoming className="h-4 w-4 text-blue-500" />
    ) : (
      <PhoneOutgoing className="h-4 w-4 text-green-500" />
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === 'answered') {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Atendida</Badge>;
    }
    return <Badge variant="destructive">Perdida</Badge>;
  };

  const getSentimentIcon = (sentiment: string | null) => {
    if (!sentiment) return null;
    if (sentiment === 'positive') return <Smile className="h-4 w-4 text-green-500" />;
    if (sentiment === 'neutral') return <Meh className="h-4 w-4 text-yellow-500" />;
    return <Frown className="h-4 w-4 text-red-500" />;
  };

  const filteredCalls = callHistory.filter(call => {
    const matchesSearch = call.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.phone.includes(searchTerm);
    const matchesDirection = filterDirection === 'all' || call.direction === filterDirection;
    const matchesStatus = filterStatus === 'all' || call.status === filterStatus;
    return matchesSearch && matchesDirection && matchesStatus;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista de Chamadas */}
      <Card className="lg:col-span-2 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle className="text-[hsl(var(--avivar-foreground))]">Histórico de Ligações</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                />
              </div>
              <Select value={filterDirection} onValueChange={setFilterDirection}>
                <SelectTrigger className="w-[130px] bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]">
                  <SelectValue placeholder="Direção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="inbound">Recebidas</SelectItem>
                  <SelectItem value="outbound">Realizadas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px] bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="answered">Atendidas</SelectItem>
                  <SelectItem value="missed">Perdidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {filteredCalls.map((call) => (
                <div
                  key={call.id}
                  onClick={() => setSelectedCall(call)}
                  className={`flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] border cursor-pointer transition-all ${
                    selectedCall?.id === call.id 
                      ? 'border-[hsl(var(--avivar-primary))] ring-1 ring-[hsl(var(--avivar-primary))]' 
                      : 'border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                      {getDirectionIcon(call.direction)}
                      {getSentimentIcon(call.sentiment)}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[hsl(var(--avivar-primary)/0.1)] text-[hsl(var(--avivar-primary))]">
                        {call.contact.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-[hsl(var(--avivar-foreground))]">{call.contact}</p>
                      <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">{call.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-[hsl(var(--avivar-foreground))]">{call.date} às {call.time}</p>
                      <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {call.duration}
                      </p>
                    </div>
                    {getStatusBadge(call.status)}
                    {call.hasRecording && (
                      <Button size="sm" variant="ghost" className="text-[hsl(var(--avivar-primary))]">
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detalhes da Chamada */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--avivar-foreground))]">Detalhes da Ligação</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedCall ? (
            <div className="space-y-6">
              {/* Info do Contato */}
              <div className="flex items-center gap-3 pb-4 border-b border-[hsl(var(--avivar-border))]">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-[hsl(var(--avivar-primary)/0.1)] text-[hsl(var(--avivar-primary))] text-lg">
                    {selectedCall.contact.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-[hsl(var(--avivar-foreground))]">{selectedCall.contact}</p>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">{selectedCall.phone}</p>
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-[hsl(var(--avivar-background))]">
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Duração</p>
                  <p className="font-semibold text-[hsl(var(--avivar-foreground))]">{selectedCall.duration}</p>
                </div>
                <div className="p-3 rounded-lg bg-[hsl(var(--avivar-background))]">
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Agente</p>
                  <p className="font-semibold text-[hsl(var(--avivar-foreground))]">{selectedCall.agent}</p>
                </div>
                {selectedCall.score && (
                  <>
                    <div className="p-3 rounded-lg bg-[hsl(var(--avivar-background))]">
                      <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Score</p>
                      <p className={`font-semibold ${
                        selectedCall.score >= 80 ? 'text-green-500' :
                        selectedCall.score >= 60 ? 'text-yellow-500' : 'text-red-500'
                      }`}>{selectedCall.score}/100</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[hsl(var(--avivar-background))]">
                      <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Sentimento</p>
                      <div className="flex items-center gap-1">
                        {getSentimentIcon(selectedCall.sentiment)}
                        <span className="font-semibold text-[hsl(var(--avivar-foreground))] capitalize">
                          {selectedCall.sentiment === 'positive' ? 'Positivo' : 
                           selectedCall.sentiment === 'neutral' ? 'Neutro' : 'Negativo'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Palavras-chave */}
              {selectedCall.keywords.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))] mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" /> Palavras-chave detectadas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCall.keywords.map((keyword) => (
                      <Badge 
                        key={keyword} 
                        variant="outline"
                        className="bg-[hsl(var(--avivar-primary)/0.1)] border-[hsl(var(--avivar-primary)/0.3)]"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Player de Áudio */}
              {selectedCall.hasRecording && (
                <div className="p-4 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                  <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))] mb-3 flex items-center gap-2">
                    <Volume2 className="h-4 w-4" /> Gravação
                  </p>
                  <div className="flex items-center gap-3">
                    <Button 
                      size="icon" 
                      className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <div className="flex-1">
                      <div className="h-2 bg-[hsl(var(--avivar-border))] rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-[hsl(var(--avivar-primary))] rounded-full" />
                      </div>
                      <div className="flex justify-between text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">
                        <span>1:45</span>
                        <span>{selectedCall.duration}</span>
                      </div>
                    </div>
                    <Button size="icon" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Transcrição */}
              {selectedCall.hasTranscript && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Transcrição Completa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Transcrição da Ligação</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      {mockTranscript.map((line, index) => (
                        <div key={index} className={`flex gap-3 ${line.speaker === 'Agente' ? '' : 'flex-row-reverse'}`}>
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className={
                              line.speaker === 'Agente' 
                                ? 'bg-[hsl(var(--avivar-primary)/0.1)] text-[hsl(var(--avivar-primary))]'
                                : 'bg-blue-500/10 text-blue-500'
                            }>
                              {line.speaker === 'Agente' ? 'A' : 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 p-3 rounded-lg ${
                            line.speaker === 'Agente' 
                              ? 'bg-[hsl(var(--avivar-primary)/0.1)]' 
                              : 'bg-muted'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium">{line.speaker}</span>
                              <span className="text-xs text-muted-foreground">{line.time}</span>
                            </div>
                            <p className="text-sm">{line.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Ações */}
              <div className="flex gap-2">
                <Button className="flex-1 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]">
                  <Phone className="h-4 w-4 mr-2" />
                  Ligar novamente
                </Button>
                <Button variant="outline" className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <Phone className="h-12 w-12 text-[hsl(var(--avivar-muted-foreground))] mb-4" />
              <p className="text-[hsl(var(--avivar-muted-foreground))]">
                Selecione uma ligação para ver os detalhes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
