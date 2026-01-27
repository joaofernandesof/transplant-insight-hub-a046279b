/**
 * IPROMED - Astrea-style Client Portal / Communication
 * Portal do Cliente com tradução IA de andamentos jurídicos
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  Send,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Users,
  FileText,
  Bell,
  Search,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  lastContact: string;
  pendingUpdates: number;
  activeCases: number;
}

interface Message {
  id: string;
  type: 'andamento' | 'ia_interpretation' | 'client' | 'lawyer';
  content: string;
  date: string;
  time?: string;
  sender?: string;
}

const mockClients: Client[] = [
  {
    id: '1',
    name: 'Dr. João Silva',
    email: 'joao.silva@clinica.com',
    phone: '(11) 99999-1234',
    lastContact: '2 dias atrás',
    pendingUpdates: 3,
    activeCases: 2,
  },
  {
    id: '2',
    name: 'Dra. Maria Santos',
    email: 'maria.santos@hospital.com',
    phone: '(11) 99999-5678',
    lastContact: 'Hoje',
    pendingUpdates: 0,
    activeCases: 1,
  },
  {
    id: '3',
    name: 'Dr. Carlos Oliveira',
    email: 'carlos@consultorio.com',
    phone: '(11) 99999-9012',
    lastContact: '1 semana',
    pendingUpdates: 5,
    activeCases: 3,
  },
];

const mockMessages: Message[] = [
  {
    id: '1',
    type: 'andamento',
    content: 'Andamento automático\nJuntada de Petição de petição',
    date: '12 set 2025',
  },
  {
    id: '2',
    type: 'ia_interpretation',
    content: 'Interpretação da Inteligência Artificial\nFoi anexada a petição inicial, que é o documento que dá início ao processo. O próximo passo é o juiz analisar a petição e decidir se o processo vai seguir adiante. Estamos acompanhando de perto e manteremos você informado sobre qualquer atualização ou movimentação.',
    date: '12 set 2025',
  },
  {
    id: '3',
    type: 'andamento',
    content: 'Andamento automático\nJuntada de Petição de petição inicial',
    date: '18 nov 2024',
  },
  {
    id: '4',
    type: 'ia_interpretation',
    content: 'Interpretação da Inteligência Artificial\nFoi anexada uma petição ao processo. Estamos monitorando e informaremos sobre os próximos passos.',
    date: '18 nov 2024',
  },
];

export default function AstreaClientPortal() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(mockClients[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const filteredClients = mockClients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendUpdate = () => {
    if (!newMessage.trim()) return;
    // Would send the update to client
    setNewMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Portal do Cliente</h1>
          <p className="text-sm text-muted-foreground">
            Comunicação simplificada com tradução automática de andamentos
          </p>
        </div>
        <Button className="gap-2 bg-[#0066CC]">
          <Sparkles className="h-4 w-4" />
          Gerar Atualização com IA
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Client List */}
        <div className="col-span-4">
          <Card className="border-0 shadow-lg h-[600px]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Clientes</CardTitle>
                <Badge variant="secondary" className="bg-[#0066CC]/10 text-[#0066CC]">
                  {mockClients.length} ativos
                </Badge>
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[480px]">
                {filteredClients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`flex items-center gap-3 p-4 cursor-pointer border-b transition-colors ${
                      selectedClient?.id === client.id 
                        ? 'bg-[#0066CC]/5 border-l-2 border-l-[#0066CC]' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#0066CC]/10 text-[#0066CC]">
                        {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{client.name}</div>
                      <div className="text-xs text-muted-foreground">{client.lastContact}</div>
                    </div>
                    {client.pendingUpdates > 0 && (
                      <Badge className="bg-rose-500 text-white text-xs">
                        {client.pendingUpdates}
                      </Badge>
                    )}
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat/Updates Area */}
        <div className="col-span-8">
          <Card className="border-0 shadow-lg h-[600px] flex flex-col">
            {selectedClient ? (
              <>
                {/* Client Header */}
                <CardHeader className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-[#0066CC]/10 text-[#0066CC] text-lg">
                          {selectedClient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{selectedClient.name}</div>
                        <div className="text-sm text-muted-foreground">{selectedClient.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <FileText className="h-3 w-3" />
                        {selectedClient.activeCases} processos
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {mockMessages.map(msg => (
                      <div key={msg.id} className="flex gap-3">
                        {msg.type === 'andamento' && (
                          <div className="flex-1 max-w-[80%]">
                            <div className="text-xs text-muted-foreground mb-1">{msg.date}</div>
                            <div className="bg-gray-100 rounded-lg p-3">
                              <div className="text-xs font-medium text-gray-600 mb-1">
                                Andamento automático
                              </div>
                              <div className="text-sm whitespace-pre-line">
                                {msg.content.split('\n')[1]}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {msg.type === 'ia_interpretation' && (
                          <div className="flex-1 max-w-[80%]">
                            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-purple-600" />
                                <span className="text-xs font-medium text-purple-700">
                                  Interpretação da Inteligência Artificial
                                </span>
                              </div>
                              <div className="text-sm text-gray-700">
                                {msg.content.split('\n').slice(1).join('\n')}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Client View Preview */}
                    <div className="flex justify-end">
                      <div className="max-w-[80%]">
                        <div className="text-xs text-muted-foreground mb-1 text-right">
                          12 set 2025 • Seu cliente
                        </div>
                        <div className="bg-[#0066CC]/10 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-[#0066CC]" />
                            <span className="text-xs font-medium text-[#0066CC]">
                              Interpretação da Inteligência Artificial
                            </span>
                          </div>
                          <div className="text-sm">
                            Foi anexada a petição inicial, que é o documento que dá início ao processo...
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite uma mensagem ou use IA para traduzir andamentos..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendUpdate()}
                    />
                    <Button 
                      variant="outline" 
                      className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                    >
                      <Sparkles className="h-4 w-4" />
                      Traduzir com IA
                    </Button>
                    <Button className="bg-[#0066CC]" onClick={handleSendUpdate}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Selecione um cliente para ver as comunicações
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
