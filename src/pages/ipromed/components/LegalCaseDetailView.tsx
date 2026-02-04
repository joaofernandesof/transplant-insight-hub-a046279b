/**
 * CPG Advocacia Médica - Legal Case Detail View
 * Visualização completa do processo inspirada no Astrea
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Star,
  MoreVertical,
  Plus,
  ExternalLink,
  FileText,
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle2,
  Briefcase,
  MessageCircle,
  Gavel,
  Building2,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LegalCase {
  id: string;
  case_number: string | null;
  title: string;
  description: string | null;
  client_id: string | null;
  status: 'active' | 'pending' | 'closed' | 'archived' | 'suspended';
  case_type: string | null;
  court: string | null;
  risk_level: 'low' | 'medium' | 'high' | 'critical' | null;
  estimated_value: number | null;
  next_deadline: string | null;
  responsible_lawyer_id: string | null;
  created_at: string | null;
  folder?: string | null;
  client_qualification?: string | null;
  other_parties?: { name: string; qualification: string }[] | null;
  instance?: string | null;
  judge_number?: string | null;
  court_branch?: string | null;
  forum?: string | null;
  action_type?: string | null;
  court_link?: string | null;
  case_object?: string | null;
  case_value?: number | null;
  distribution_date?: string | null;
  condemnation_value?: number | null;
  observations?: string | null;
  responsible_name?: string | null;
  access_type?: string | null;
  label?: string | null;
  ipromed_legal_clients?: { name: string } | null;
}

interface LegalCaseDetailViewProps {
  caseData: LegalCase;
  onClose: () => void;
}

const getStatusConfig = (status: LegalCase['status']) => {
  const config = {
    active: { label: 'Ativo 1º Grau', icon: '⚡', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    pending: { label: 'Pendente', icon: '⏳', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    closed: { label: 'Encerrado', icon: '✓', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
    archived: { label: 'Arquivado', icon: '📁', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
    suspended: { label: 'Suspenso', icon: '⏸', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  };
  return config[status] || config.active;
};

const formatCurrency = (value: number | null | undefined) => {
  if (!value) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getQualificationLabel = (qual: string | null | undefined) => {
  const labels: Record<string, string> = {
    autor: 'Autor',
    reu: 'Réu',
    terceiro: 'Terceiro Interessado',
    assistente: 'Assistente',
    testemunha: 'Testemunha',
    perito: 'Perito',
  };
  return labels[qual || ''] || qual || '';
};

export default function LegalCaseDetailView({ caseData, onClose }: LegalCaseDetailViewProps) {
  const [showAllParties, setShowAllParties] = useState(false);
  const [activeTab, setActiveTab] = useState('resumo');
  
  const statusConfig = getStatusConfig(caseData.status);
  
  // Parse other_parties if it's a string
  const otherParties = Array.isArray(caseData.other_parties) 
    ? caseData.other_parties 
    : [];

  // Mock data for activities - will be replaced with real data
  const nextActivities = [
    {
      type: 'TAREFA',
      description: 'Intimem-se as partes para manifestação acerca do laudo pericial de ID 173573659 no prazo de quinze dias, na forma do art. 477, § 1º, do CPC/15, sob pena de preclusão.',
      date: 'qua, 25 de fev 2026',
    },
  ];

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              {caseData.title}
            </h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Processo</span>
              <a href={caseData.court_link || '#'} className="text-primary hover:underline font-medium">
                {caseData.case_number || 'Sem número'}
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Cliente: {caseData.ipromed_legal_clients?.name || 'Não informado'}</span>
              <span>•</span>
              <span>Status: <Badge className={statusConfig.className}>{statusConfig.label} {statusConfig.icon}</Badge></span>
            </div>
            <div className="text-sm text-muted-foreground">
              Responsável: {caseData.responsible_name || 'Não atribuído'}
              <span className="mx-2">•</span>
              Criado por: {caseData.responsible_name || 'Sistema'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Star className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
          <Button size="icon" className="bg-primary">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 border-b">
          <TabsList className="bg-transparent h-auto p-0 gap-4">
            <TabsTrigger 
              value="resumo" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3"
            >
              Resumo
            </TabsTrigger>
            <TabsTrigger 
              value="atividades"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3"
            >
              Atividades
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">1</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="historico"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3"
            >
              Histórico
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="resumo" className="m-0 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main Content - Left Side */}
              <div className="lg:col-span-2 space-y-4">
                {/* Dados do Processo */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Dados do Processo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ação</span>
                        <span className="font-medium">{caseData.action_type || caseData.case_type || 'Não informado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Número</span>
                        <span className="font-mono">{caseData.case_number || 'Sem número'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Juízo</span>
                        <span>{caseData.court_branch ? `${caseData.court_branch} - ${caseData.forum || ''}` : caseData.court || 'Não informado'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Link no tribunal</span>
                        {caseData.court_link ? (
                          <a 
                            href={caseData.court_link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary hover:underline flex items-center gap-1 truncate max-w-[200px]"
                          >
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{caseData.court_link}</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor da causa</span>
                        <span className="font-medium">{formatCurrency(caseData.case_value || caseData.estimated_value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Val. condenação</span>
                        <span>{formatCurrency(caseData.condemnation_value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Criado em</span>
                        <span>
                          {caseData.distribution_date 
                            ? format(new Date(caseData.distribution_date), 'dd/MM/yyyy', { locale: ptBR })
                            : caseData.created_at
                              ? format(new Date(caseData.created_at), 'dd/MM/yyyy', { locale: ptBR })
                              : '-'
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Partes Envolvidas */}
                <Card>
                  <CardContent className="py-4 space-y-3">
                    {/* Cliente Principal */}
                    {caseData.ipromed_legal_clients?.name && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{getQualificationLabel(caseData.client_qualification) || 'Requerido'}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{caseData.ipromed_legal_clients.name}</span>
                          <Badge variant="outline" className="text-xs">CLIENTE PRINCIPAL</Badge>
                        </div>
                      </div>
                    )}

                    {/* Outras partes */}
                    {otherParties.slice(0, showAllParties ? undefined : 3).map((party, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{getQualificationLabel(party.qualification)}</span>
                        <span className="font-medium">{party.name}</span>
                      </div>
                    ))}

                    {otherParties.length > 3 && (
                      <Button 
                        variant="link" 
                        className="text-primary p-0 h-auto"
                        onClick={() => setShowAllParties(!showAllParties)}
                      >
                        {showAllParties ? (
                          <>VER MENOS <ChevronUp className="h-4 w-4 ml-1" /></>
                        ) : (
                          <>VER MAIS <ChevronDown className="h-4 w-4 ml-1" /></>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Últimos Históricos */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Últimos históricos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                      <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p>Nenhum histórico registrado</p>
                      <p className="text-sm">As publicações e andamentos aparecerão aqui.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - Right Side */}
              <div className="space-y-4">
                {/* Próximas Atividades */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Próximas atividades
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {nextActivities.length > 0 ? (
                      nextActivities.map((activity, idx) => (
                        <div key={idx} className="space-y-1">
                          <Badge variant="outline" className="text-xs text-primary border-primary">
                            {activity.type}
                          </Badge>
                          <p className="text-sm line-clamp-3">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.date}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma atividade programada</p>
                    )}
                  </CardContent>
                </Card>

                {/* Documentos */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Documentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Nenhum documento encontrado.</p>
                    <p className="text-xs text-muted-foreground mt-1">Adicione aqui documentos, recibos e comprovantes.</p>
                  </CardContent>
                </Card>

                {/* Atendimentos */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      Atendimentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Nenhum atendimento encontrado.</p>
                    <p className="text-xs text-muted-foreground mt-1">Adicione conversas e reuniões importantes com seu cliente.</p>
                  </CardContent>
                </Card>

                {/* Despesas */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Despesas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reembolsado</span>
                      <span>R$ 0,00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">A reembolsar</span>
                      <span>R$ 0,00</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm font-medium">
                      <span>Total lançado</span>
                      <span>R$ 0,00</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Timesheet */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Timesheet
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Faturado</span>
                      <span>0min</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">A faturar</span>
                      <span>0min</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm font-medium">
                      <span>Total lançado</span>
                      <span>0min</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="atividades" className="m-0 p-4">
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20 text-muted-foreground" />
                <p className="font-medium">Atividades do Processo</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tarefas, prazos e compromissos relacionados a este processo.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico" className="m-0 p-4">
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20 text-muted-foreground" />
                <p className="font-medium">Histórico de Andamentos</p>
                <p className="text-sm text-muted-foreground mt-1">
                  A integração com TJ/PJe para acompanhamento automático será ativada em breve.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
