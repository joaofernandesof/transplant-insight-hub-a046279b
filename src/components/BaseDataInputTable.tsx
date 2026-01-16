import React, { useMemo } from 'react';
import { WeekData, formatDate } from '@/data/metricsData';
import { cn } from '@/lib/utils';
import { 
  Database,
  DollarSign,
  Eye,
  Users,
  MousePointer,
  Heart,
  Video,
  Timer,
  Globe,
  LogOut,
  UserPlus,
  FileText,
  AlertCircle,
  MessageCircle,
  Phone,
  MessageSquare,
  Calendar,
  UserCheck,
  UserX,
  Award,
  Trophy,
  TrendingUp,
  PiggyBank,
  Lock,
  Unlock
} from 'lucide-react';

interface BaseDataField {
  key: string;
  icon: React.ElementType;
  etapa: string;
  responsavel: string;
  label: string;
  description: string;
  oQueMede: string;
  tipo: 'manual' | 'auto';
  formula: string;
  unidade: string;
  inputType: 'number' | 'currency' | 'decimal';
}

// Dados base organizados na ordem do funil (de cima para baixo)
const baseDataFields: BaseDataField[] = [
  // Planejamento/Tráfego - Investimento
  { key: 'gastoMidia', icon: DollarSign, etapa: 'Tráfego', responsavel: 'Marketing', label: 'Gasto em Mídia', description: 'Investimento total em anúncios', oQueMede: 'Verba investida no período', tipo: 'manual', formula: 'Soma do investimento', unidade: 'R$', inputType: 'currency' },
  
  // Tráfego - Volume
  { key: 'impressoes', icon: Eye, etapa: 'Tráfego', responsavel: 'Marketing', label: 'Impressões', description: 'Volume de entrega', oQueMede: 'Volume total exibido', tipo: 'manual', formula: 'Total de impressões', unidade: 'Nº', inputType: 'number' },
  { key: 'alcance', icon: Users, etapa: 'Tráfego', responsavel: 'Marketing', label: 'Alcance', description: 'Pessoas únicas', oQueMede: 'Tamanho da audiência atingida', tipo: 'manual', formula: 'Pessoas alcançadas', unidade: 'Nº', inputType: 'number' },
  { key: 'cliques', icon: MousePointer, etapa: 'Tráfego', responsavel: 'Marketing', label: 'Cliques', description: 'Cliques nos anúncios', oQueMede: 'Interesse demonstrado', tipo: 'manual', formula: 'Total de cliques', unidade: 'Nº', inputType: 'number' },
  { key: 'interacoes', icon: Heart, etapa: 'Tráfego', responsavel: 'Marketing', label: 'Interações', description: 'Engajamento total', oQueMede: 'Curtidas, comentários, salvamentos', tipo: 'manual', formula: 'Soma das interações', unidade: 'Nº', inputType: 'number' },
  { key: 'visualizacoes', icon: Video, etapa: 'Tráfego', responsavel: 'Marketing', label: 'Views de Vídeo', description: 'Visualizações de vídeo', oQueMede: 'Atenção ao vídeo', tipo: 'manual', formula: 'Total de views', unidade: 'Nº', inputType: 'number' },
  { key: 'visualizacoes3s', icon: Timer, etapa: 'Tráfego', responsavel: 'Marketing', label: 'Views 3s', description: 'Visualizações +3s', oQueMede: 'Retenção inicial', tipo: 'manual', formula: 'Views com +3 segundos', unidade: 'Nº', inputType: 'number' },
  
  // Landing Page
  { key: 'visitas', icon: Globe, etapa: 'Landing Page', responsavel: 'Marketing', label: 'Visitas à Landing', description: 'Visitantes na página', oQueMede: 'Tráfego na página', tipo: 'manual', formula: 'Total de visitas', unidade: 'Nº', inputType: 'number' },
  { key: 'tempoCarregamento', icon: Timer, etapa: 'Landing Page', responsavel: 'Marketing', label: 'Tempo Carregamento', description: 'Segundos para carregar', oQueMede: 'Experiência técnica', tipo: 'manual', formula: 'Tempo médio', unidade: 's', inputType: 'decimal' },
  { key: 'saidasRapidas', icon: LogOut, etapa: 'Landing Page', responsavel: 'Marketing', label: 'Saídas Rápidas', description: 'Rejeições', oQueMede: 'Desalinhamento anúncio-página', tipo: 'manual', formula: 'Visitantes que saíram', unidade: 'Nº', inputType: 'number' },
  
  // Conversão/Leads
  { key: 'leadsTotal', icon: UserPlus, etapa: 'Leads', responsavel: 'Marketing', label: 'Total de Leads', description: 'Leads captados', oQueMede: 'Volume de entrada no funil', tipo: 'manual', formula: 'Total de leads', unidade: 'Nº', inputType: 'number' },
  { key: 'leadsICP', icon: UserCheck, etapa: 'Leads', responsavel: 'Marketing', label: 'Leads ICP', description: 'Leads com perfil ideal', oQueMede: 'Qualidade dos leads', tipo: 'manual', formula: 'Leads qualificados', unidade: 'Nº', inputType: 'number' },
  { key: 'MQLs', icon: Award, etapa: 'Leads', responsavel: 'Marketing', label: 'MQLs', description: 'Marketing Qualified Leads', oQueMede: 'Maturidade inicial', tipo: 'manual', formula: 'Leads com interesse', unidade: 'Nº', inputType: 'number' },
  { key: 'SQLs', icon: Trophy, etapa: 'Leads', responsavel: 'Marketing', label: 'SQLs', description: 'Sales Qualified Leads', oQueMede: 'Prontos para venda', tipo: 'manual', formula: 'Leads prontos', unidade: 'Nº', inputType: 'number' },
  
  // Formulário
  { key: 'acessosForm', icon: FileText, etapa: 'Conversão', responsavel: 'Marketing', label: 'Acessos ao Form', description: 'Pessoas que acessaram', oQueMede: 'Interesse no formulário', tipo: 'manual', formula: 'Acessos ao form', unidade: 'Nº', inputType: 'number' },
  { key: 'enviosForm', icon: FileText, etapa: 'Conversão', responsavel: 'Marketing', label: 'Envios de Form', description: 'Formulários enviados', oQueMede: 'Conversão do form', tipo: 'manual', formula: 'Forms enviados', unidade: 'Nº', inputType: 'number' },
  { key: 'abandonosForm', icon: AlertCircle, etapa: 'Conversão', responsavel: 'Marketing', label: 'Abandonos de Form', description: 'Abandonos durante preenchimento', oQueMede: 'Fricção do formulário', tipo: 'manual', formula: 'Abandonos', unidade: 'Nº', inputType: 'number' },
  { key: 'cliquesWhats', icon: MessageCircle, etapa: 'Conversão', responsavel: 'Marketing', label: 'Cliques WhatsApp', description: 'Cliques no botão', oQueMede: 'Intenção de contato', tipo: 'manual', formula: 'Cliques no WhatsApp', unidade: 'Nº', inputType: 'number' },
  
  // Atendimento
  { key: 'leadsContatados', icon: Phone, etapa: 'Atendimento', responsavel: 'Comercial', label: 'Leads Contatados', description: 'Leads que receberam contato', oQueMede: 'Cobertura do atendimento', tipo: 'manual', formula: 'Leads contatados', unidade: 'Nº', inputType: 'number' },
  { key: 'leadsResponderam', icon: MessageSquare, etapa: 'Atendimento', responsavel: 'Comercial', label: 'Leads Responderam', description: 'Leads que responderam', oQueMede: 'Engajamento inicial', tipo: 'manual', formula: 'Respostas', unidade: 'Nº', inputType: 'number' },
  { key: 'totalFollowUps', icon: MessageSquare, etapa: 'Atendimento', responsavel: 'Comercial', label: 'Total Follow Ups', description: 'Follow ups realizados', oQueMede: 'Persistência', tipo: 'manual', formula: 'Follow ups', unidade: 'Nº', inputType: 'number' },
  { key: 'agendamentosFollowUp', icon: Calendar, etapa: 'Atendimento', responsavel: 'Comercial', label: 'Agend. via Follow', description: 'Vindos de follow up', oQueMede: 'Efetividade do follow', tipo: 'manual', formula: 'Agend. por follow', unidade: 'Nº', inputType: 'number' },
  
  // Consulta
  { key: 'consultasAgendadas', icon: Calendar, etapa: 'Agendamento', responsavel: 'Comercial', label: 'Consultas Agendadas', description: 'Total de consultas marcadas', oQueMede: 'Capacidade de agendar', tipo: 'manual', formula: 'Consultas marcadas', unidade: 'Nº', inputType: 'number' },
  { key: 'consultasRealizadas', icon: UserCheck, etapa: 'Consulta', responsavel: 'Comercial', label: 'Consultas Realizadas', description: 'Consultas que aconteceram', oQueMede: 'Comparecimento', tipo: 'manual', formula: 'Consultas realizadas', unidade: 'Nº', inputType: 'number' },
  { key: 'noShows', icon: UserX, etapa: 'Consulta', responsavel: 'Comercial', label: 'No Shows (Faltas)', description: 'Não compareceram', oQueMede: 'Perdas de agenda', tipo: 'manual', formula: 'Faltas', unidade: 'Nº', inputType: 'number' },
  
  // Vendas
  { key: 'propostas', icon: FileText, etapa: 'Vendas', responsavel: 'Comercial', label: 'Propostas', description: 'Propostas apresentadas', oQueMede: 'Oportunidades trabalhadas', tipo: 'manual', formula: 'Propostas feitas', unidade: 'Nº', inputType: 'number' },
  { key: 'vendas', icon: Trophy, etapa: 'Vendas', responsavel: 'Comercial', label: 'Vendas Realizadas', description: 'Fechamentos', oQueMede: 'Resultado final', tipo: 'manual', formula: 'Vendas', unidade: 'Nº', inputType: 'number' },
  
  // Financeiro
  { key: 'receita', icon: TrendingUp, etapa: 'Financeiro', responsavel: 'Financeiro', label: 'Receita Total', description: 'Faturamento', oQueMede: 'Valor gerado', tipo: 'manual', formula: 'Receita total', unidade: 'R$', inputType: 'currency' },
  { key: 'lucro', icon: PiggyBank, etapa: 'Financeiro', responsavel: 'Financeiro', label: 'Lucro Líquido', description: 'Lucro após custos', oQueMede: 'Resultado real', tipo: 'manual', formula: 'Lucro', unidade: 'R$', inputType: 'currency' },
  { key: 'custoFixo', icon: DollarSign, etapa: 'Financeiro', responsavel: 'Financeiro', label: 'Custos Fixos', description: 'Custos fixos do período', oQueMede: 'Despesas fixas', tipo: 'manual', formula: 'Custos fixos', unidade: 'R$', inputType: 'currency' },
  { key: 'custoVariavel', icon: DollarSign, etapa: 'Financeiro', responsavel: 'Financeiro', label: 'Custos Variáveis', description: 'Custos variáveis', oQueMede: 'Despesas variáveis', tipo: 'manual', formula: 'Custos variáveis', unidade: 'R$', inputType: 'currency' },
  { key: 'leadsPerdidos', icon: UserX, etapa: 'Gestão', responsavel: 'Gestão', label: 'Leads Perdidos', description: 'Não atendidos/perdidos', oQueMede: 'Ineficiência operacional', tipo: 'manual', formula: 'Leads perdidos', unidade: 'Nº', inputType: 'number' },
];

// Mapeamento de cores por etapa
const etapaColors: Record<string, string> = {
  'Planejamento': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Tráfego': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Landing Page': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'Conversão': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'Leads': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Atendimento': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Agendamento': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Consulta': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Vendas': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Financeiro': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Gestão': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
};

const responsavelColors: Record<string, string> = {
  'Marketing': 'bg-blue-500/20 text-blue-300',
  'Comercial': 'bg-amber-500/20 text-amber-300',
  'Financeiro': 'bg-emerald-500/20 text-emerald-300',
  'Gestão': 'bg-indigo-500/20 text-indigo-300'
};

interface BaseDataInputTableProps {
  weeks: WeekData[];
  currentWeekNumber: number;
  onValueChange: (weekNumber: number, key: string, value: number | null) => void;
  getWeekValues: (weekNumber: number) => Record<string, number | string | null>;
  isAdmin: boolean;
}

export function BaseDataInputTable({
  weeks,
  currentWeekNumber,
  onValueChange,
  getWeekValues,
  isAdmin
}: BaseDataInputTableProps) {
  // Pegar apenas as últimas 12 semanas disponíveis para visualização
  const visibleWeeks = useMemo(() => {
    return weeks.filter(w => w.weekNumber <= currentWeekNumber).slice(-12);
  }, [weeks, currentWeekNumber]);

  const handleInputChange = (weekNumber: number, key: string, value: string) => {
    if (value === '') {
      onValueChange(weekNumber, key, null);
      return;
    }
    const numVal = parseFloat(value.replace(',', '.'));
    if (!isNaN(numVal)) {
      onValueChange(weekNumber, key, numVal);
    }
  };

  const isWeekEditable = (weekNumber: number) => {
    if (isAdmin) return true;
    return weekNumber === currentWeekNumber;
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="bg-muted/50 px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Dados Base para Cálculo - Histórico Semanal
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Preencha os dados brutos. Os indicadores automáticos serão calculados com base nesses valores.
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/30 sticky top-0 z-10">
            <tr className="border-b border-border">
              <th className="text-left px-2 py-2 font-medium text-muted-foreground whitespace-nowrap sticky left-0 bg-muted/30 z-20 min-w-[30px]">
                <div className="flex items-center justify-center">
                  📊
                </div>
              </th>
              <th className="text-left px-2 py-2 font-medium text-muted-foreground whitespace-nowrap sticky left-[30px] bg-muted/30 z-20 min-w-[90px]">
                <div className="flex items-center gap-1">
                  🔻 Etapa
                </div>
              </th>
              <th className="text-left px-2 py-2 font-medium text-muted-foreground whitespace-nowrap sticky left-[120px] bg-muted/30 z-20 min-w-[80px]">
                <div className="flex items-center gap-1">
                  👤 Resp.
                </div>
              </th>
              <th className="text-left px-2 py-2 font-medium text-muted-foreground whitespace-nowrap min-w-[150px]">
                <div className="flex items-center gap-1">
                  📊 Campo
                </div>
              </th>
              <th className="text-left px-2 py-2 font-medium text-muted-foreground whitespace-nowrap min-w-[150px]">
                <div className="flex items-center gap-1">
                  🔍 O que mede
                </div>
              </th>
              <th className="text-center px-2 py-2 font-medium text-muted-foreground whitespace-nowrap min-w-[70px]">
                <div className="flex items-center justify-center gap-1">
                  ✍️ Tipo
                </div>
              </th>
              <th className="text-center px-2 py-2 font-medium text-muted-foreground whitespace-nowrap min-w-[50px]">
                <div className="flex items-center justify-center gap-1">
                  📐 Un.
                </div>
              </th>
              {/* Week columns */}
              {visibleWeeks.map((week) => (
                <th 
                  key={week.weekNumber} 
                  className={cn(
                    "text-center px-2 py-2 font-medium whitespace-nowrap min-w-[90px] border-l border-border",
                    week.weekNumber === currentWeekNumber && "bg-primary/10"
                  )}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-foreground text-xs font-bold">S{week.weekNumber}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {formatDate(week.startDate).split('/').slice(0, 2).join('/')}
                    </span>
                    {week.weekNumber === currentWeekNumber && (
                      <span className="text-[9px] bg-primary/20 text-primary px-1 rounded">Atual</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {baseDataFields.map((field, idx) => {
              const Icon = field.icon;
              
              return (
                <tr 
                  key={field.key}
                  className={cn(
                    'border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors',
                    idx % 2 === 0 && 'bg-muted/5'
                  )}
                >
                  {/* Ícone */}
                  <td className="px-2 py-2 sticky left-0 bg-card z-10 text-center">
                    <Icon className="w-4 h-4 text-muted-foreground mx-auto" />
                  </td>
                  
                  {/* Etapa */}
                  <td className="px-2 py-2 sticky left-[30px] bg-card z-10">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium border whitespace-nowrap",
                      etapaColors[field.etapa] || 'bg-muted text-muted-foreground'
                    )}>
                      {field.etapa}
                    </span>
                  </td>
                  
                  {/* Responsável */}
                  <td className="px-2 py-2 sticky left-[120px] bg-card z-10">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap",
                      responsavelColors[field.responsavel] || 'bg-muted text-muted-foreground'
                    )}>
                      {field.responsavel}
                    </span>
                  </td>
                  
                  {/* Campo */}
                  <td className="px-2 py-2">
                    <div className="max-w-[150px]">
                      <p className="font-medium text-foreground text-xs">{field.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{field.description}</p>
                    </div>
                  </td>
                  
                  {/* O que mede */}
                  <td className="px-2 py-2">
                    <p className="text-[10px] text-muted-foreground max-w-[150px] line-clamp-2">
                      {field.oQueMede}
                    </p>
                  </td>
                  
                  {/* Tipo */}
                  <td className="px-2 py-2 text-center">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300">
                      <Unlock className="w-2.5 h-2.5" />
                      Manual
                    </span>
                  </td>
                  
                  {/* Unidade */}
                  <td className="px-2 py-2 text-center">
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      {field.unidade}
                    </span>
                  </td>
                  
                  {/* Week Values */}
                  {visibleWeeks.map((week) => {
                    const weekValues = getWeekValues(week.weekNumber);
                    const value = weekValues[field.key] ?? null;
                    const editable = isWeekEditable(week.weekNumber);
                    
                    return (
                      <td 
                        key={`${field.key}-${week.weekNumber}`}
                        className={cn(
                          "px-1 py-1 text-center border-l border-border",
                          week.weekNumber === currentWeekNumber && "bg-primary/5"
                        )}
                      >
                        <div className="relative">
                          {field.inputType === 'currency' && (
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[9px]">
                              R$
                            </span>
                          )}
                          <input
                            type="number"
                            step={field.inputType === 'decimal' || field.inputType === 'currency' ? '0.01' : '1'}
                            value={value ?? ''}
                            onChange={(e) => handleInputChange(week.weekNumber, field.key, e.target.value)}
                            disabled={!editable}
                            className={cn(
                              "w-full px-1 py-1 text-[10px] text-center rounded border bg-background",
                              "focus:outline-none focus:ring-1 focus:ring-primary",
                              "disabled:opacity-50 disabled:cursor-not-allowed",
                              field.inputType === 'currency' && 'pl-5'
                            )}
                            placeholder="-"
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
