/**
 * Push Jurídico - Alertas
 * Lista de alertas e publicações identificadas
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bell,
  Search,
  Filter,
  Eye,
  FileText,
  AlertCircle,
  Clock,
  Users,
  Building2,
  ExternalLink,
  Star,
  StarOff,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Scale,
  Gavel,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Publication {
  id: string;
  type: 'intimation' | 'sentence' | 'dispatch' | 'publication' | 'decision';
  title: string;
  court: string;
  courtType: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  client: string;
  processNumber: string;
  parties: string[];
  content: string;
  sourceUrl: string;
  read: boolean;
  starred: boolean;
  matchedTerm: string;
}

const mockPublications: Publication[] = [
  {
    id: '1',
    type: 'intimation',
    title: 'Intimação para Audiência de Conciliação',
    court: 'TJSP - 3ª Vara Cível de São Paulo',
    courtType: 'Estadual',
    date: '2026-01-29T10:30:00',
    priority: 'high',
    client: 'Dr. João Silva',
    processNumber: '0001234-56.2024.8.26.0100',
    parties: ['João da Silva', 'Maria Oliveira Santos'],
    content: 'Intimem-se as partes para audiência de conciliação a ser realizada no dia 15/02/2026, às 14h00, na sala 305, 3º andar do Fórum Central. A ausência injustificada da parte autora importará em extinção do processo sem resolução do mérito.',
    sourceUrl: 'https://dje.tjsp.jus.br/exemplo',
    read: false,
    starred: false,
    matchedTerm: 'JOÃO DA SILVA',
  },
  {
    id: '2',
    type: 'sentence',
    title: 'Sentença - Procedente em Parte',
    court: 'TRT-2 - 15ª Vara do Trabalho de São Paulo',
    courtType: 'Trabalhista',
    date: '2026-01-29T09:15:00',
    priority: 'high',
    client: 'Hospital XYZ',
    processNumber: '0009876-54.2023.5.02.0001',
    parties: ['Hospital XYZ Ltda', 'Funcionário Reclamante'],
    content: 'Vistos. JULGO PROCEDENTE EM PARTE a reclamação trabalhista para condenar a reclamada ao pagamento de horas extras e reflexos. Condeno a reclamada ao pagamento de R$ 45.000,00, acrescidos de correção monetária e juros. Custas pela reclamada.',
    sourceUrl: 'https://pje.trt2.jus.br/exemplo',
    read: false,
    starred: true,
    matchedTerm: 'HOSPITAL XYZ',
  },
  {
    id: '3',
    type: 'dispatch',
    title: 'Despacho - Vista ao Autor',
    court: 'TRF-3 - 1ª Vara Federal de São Paulo',
    courtType: 'Federal',
    date: '2026-01-28T16:45:00',
    priority: 'medium',
    client: 'Clínica ABC',
    processNumber: '0005555-11.2025.4.03.6100',
    parties: ['Clínica ABC ME', 'União Federal'],
    content: 'Vista ao autor para manifestação sobre a contestação apresentada, no prazo de 15 (quinze) dias. Após, voltem conclusos para saneamento do feito.',
    sourceUrl: 'https://pje.trf3.jus.br/exemplo',
    read: true,
    starred: false,
    matchedTerm: 'CLÍNICA ABC',
  },
  {
    id: '4',
    type: 'publication',
    title: 'Publicação no DJE/SP - Edição 5892',
    court: 'Diário da Justiça Eletrônico - SP',
    courtType: 'Diário Oficial',
    date: '2026-01-28T08:00:00',
    priority: 'low',
    client: 'Dra. Maria Santos',
    processNumber: '0002222-33.2024.8.26.0001',
    parties: ['Maria Santos', 'Parte Contrária'],
    content: 'Fl. 125: Recebidos os autos do cartório. Fl. 127: Juntada de petição intermediária. Conclusos ao MM. Juiz.',
    sourceUrl: 'https://dje.tjsp.jus.br/exemplo2',
    read: true,
    starred: false,
    matchedTerm: 'MARIA SANTOS',
  },
  {
    id: '5',
    type: 'decision',
    title: 'Decisão Interlocutória - Tutela Deferida',
    court: 'TJSP - 5ª Vara da Fazenda Pública',
    courtType: 'Estadual',
    date: '2026-01-27T14:20:00',
    priority: 'high',
    client: 'Dr. Carlos Médico',
    processNumber: '0003333-44.2025.8.26.0053',
    parties: ['Carlos Médico', 'Estado de São Paulo'],
    content: 'DEFIRO a tutela de urgência requerida para determinar que o Estado de São Paulo se abstenha de realizar qualquer ato administrativo contra o autor até julgamento final desta ação. Cite-se o réu.',
    sourceUrl: 'https://esaj.tjsp.jus.br/exemplo',
    read: false,
    starred: true,
    matchedTerm: '123.456.789-00',
  },
];

const typeConfig = {
  intimation: { label: 'Intimação', color: 'bg-rose-100 text-rose-700', icon: AlertCircle },
  sentence: { label: 'Sentença', color: 'bg-amber-100 text-amber-700', icon: Gavel },
  dispatch: { label: 'Despacho', color: 'bg-blue-100 text-blue-700', icon: FileText },
  publication: { label: 'Publicação', color: 'bg-emerald-100 text-emerald-700', icon: Eye },
  decision: { label: 'Decisão', color: 'bg-purple-100 text-purple-700', icon: Scale },
};

const priorityConfig = {
  high: { label: 'Urgente', color: 'bg-rose-500 text-white' },
  medium: { label: 'Normal', color: 'bg-amber-500 text-white' },
  low: { label: 'Baixa', color: 'bg-slate-400 text-white' },
};

export default function PushAlerts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const filteredPublications = mockPublications.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.processNumber.includes(searchTerm);
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'unread' && !p.read) ||
      (statusFilter === 'read' && p.read) ||
      (statusFilter === 'starred' && p.starred);
    return matchesSearch && matchesType && matchesStatus;
  });

  const unreadCount = mockPublications.filter(p => !p.read).length;

  const toggleSelect = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-rose-600" />
            Alertas de Publicações
            {unreadCount > 0 && (
              <Badge className="bg-rose-500">{unreadCount} não lidos</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            Publicações identificadas pelo monitoramento automático
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Marcar todos como lidos
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, processo ou título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="intimation">Intimações</SelectItem>
                <SelectItem value="sentence">Sentenças</SelectItem>
                <SelectItem value="dispatch">Despachos</SelectItem>
                <SelectItem value="decision">Decisões</SelectItem>
                <SelectItem value="publication">Publicações</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="unread">Não lidos</SelectItem>
                <SelectItem value="read">Lidos</SelectItem>
                <SelectItem value="starred">Favoritos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Publications List */}
      <div className="space-y-3">
        {filteredPublications.map(pub => {
          const type = typeConfig[pub.type];
          const priority = priorityConfig[pub.priority];
          const TypeIcon = type.icon;

          return (
            <Card 
              key={pub.id}
              className={`cursor-pointer hover:shadow-md transition-all ${
                !pub.read ? 'border-l-4 border-l-rose-500 bg-rose-50/30' : ''
              }`}
              onClick={() => setSelectedPublication(pub)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Checkbox 
                    checked={selectedItems.includes(pub.id)}
                    onCheckedChange={() => toggleSelect(pub.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${type.color}`}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{pub.title}</span>
                      {!pub.read && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                      )}
                      {pub.starred && (
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Building2 className="h-3 w-3" />
                      <span>{pub.court}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {pub.client}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-mono">
                        {pub.processNumber}
                      </Badge>
                      <Badge className={`text-xs ${priority.color}`}>
                        {priority.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(pub.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Publication Detail Dialog */}
      <Dialog open={!!selectedPublication} onOpenChange={() => setSelectedPublication(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedPublication && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge className={typeConfig[selectedPublication.type].color}>
                    {typeConfig[selectedPublication.type].label}
                  </Badge>
                  <Badge className={priorityConfig[selectedPublication.priority].color}>
                    {priorityConfig[selectedPublication.priority].label}
                  </Badge>
                </div>
                <DialogTitle className="text-lg mt-2">
                  {selectedPublication.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Tribunal</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {selectedPublication.court}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Data da Publicação</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(selectedPublication.date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Número do Processo</p>
                    <p className="text-sm font-mono font-medium">{selectedPublication.processNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Cliente Vinculado</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {selectedPublication.client}
                    </p>
                  </div>
                </div>

                {/* Parties */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Partes Envolvidas</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPublication.parties.map((party, idx) => (
                      <Badge key={idx} variant="outline">{party}</Badge>
                    ))}
                  </div>
                </div>

                {/* Matched Term */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700 font-medium mb-1">Termo Identificado</p>
                  <p className="text-sm font-mono">{selectedPublication.matchedTerm}</p>
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Conteúdo da Publicação</p>
                  <div className="p-4 bg-muted rounded-lg text-sm leading-relaxed">
                    {selectedPublication.content}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Ver Publicação Original
                  </Button>
                  <Button variant="outline" className="gap-2">
                    {selectedPublication.starred ? (
                      <>
                        <StarOff className="h-4 w-4" />
                        Remover Favorito
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4" />
                        Adicionar Favorito
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Marcar como Lido
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card className="fixed bottom-6 left-1/2 -translate-x-1/2 border-primary/20 bg-background shadow-lg z-50">
          <CardContent className="p-4 flex items-center gap-4">
            <span className="text-sm font-medium">{selectedItems.length} selecionado(s)</span>
            <Button size="sm" variant="outline">Marcar como lido</Button>
            <Button size="sm" variant="outline">Favoritar</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedItems([])}>Limpar</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
