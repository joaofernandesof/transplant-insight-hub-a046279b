/**
 * AvivarVariables - Página de referência de todas as variáveis do CRM
 * Integrada com o builder de automações, follow-ups e templates
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { VariableAutocomplete } from '@/components/avivar/VariableAutocomplete';
import {
  ArrowLeft, Search, Copy, Check, Hash, User, Phone, Mail,
  Building2, Calendar, Tag, MessageSquare, Briefcase, Globe,
  Clock, MapPin, Bot, Zap, FileText, DollarSign, Link2,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ─── Variable Definition ─── */
interface CrmVariable {
  key: string;
  label: string;
  description: string;
  example: string;
  category: string;
  availableIn: string[];
}

const VARIABLE_CATEGORIES = [
  {
    id: 'lead',
    label: 'Lead / Contato',
    icon: User,
    color: 'from-blue-500 to-blue-600',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  {
    id: 'communication',
    label: 'Comunicação',
    icon: MessageSquare,
    color: 'from-emerald-500 to-emerald-600',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  {
    id: 'pipeline',
    label: 'Pipeline / Funil',
    icon: Briefcase,
    color: 'from-violet-500 to-violet-600',
    badgeClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  },
  {
    id: 'appointment',
    label: 'Agendamento',
    icon: Calendar,
    color: 'from-amber-500 to-amber-600',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  {
    id: 'company',
    label: 'Empresa / Conta',
    icon: Building2,
    color: 'from-rose-500 to-rose-600',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  {
    id: 'time',
    label: 'Data / Hora',
    icon: Clock,
    color: 'from-cyan-500 to-cyan-600',
    badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  },
  {
    id: 'utm',
    label: 'UTM / Tráfego',
    icon: Globe,
    color: 'from-orange-500 to-orange-600',
    badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  },
  {
    id: 'system',
    label: 'Sistema / Automação',
    icon: Zap,
    color: 'from-pink-500 to-pink-600',
    badgeClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
  },
];

export const CRM_VARIABLES: CrmVariable[] = [
  // Lead / Contato
  { key: '{{nome}}', label: 'Nome completo', description: 'Nome completo do lead/contato', example: 'Maria Silva', category: 'lead', availableIn: ['automações', 'follow-up', 'chatbot', 'templates'] },
  { key: '{{primeiro_nome}}', label: 'Primeiro nome', description: 'Primeiro nome do lead', example: 'Maria', category: 'lead', availableIn: ['automações', 'follow-up', 'chatbot', 'templates'] },
  { key: '{{telefone}}', label: 'Telefone', description: 'Número de telefone do lead', example: '(11) 99999-0000', category: 'lead', availableIn: ['automações', 'follow-up', 'templates'] },
  { key: '{{email}}', label: 'Email', description: 'Endereço de email do lead', example: 'maria@email.com', category: 'lead', availableIn: ['automações', 'follow-up', 'templates'] },
  { key: '{{lead_id}}', label: 'ID do Lead', description: 'Identificador único do lead no CRM', example: 'abc-123-def', category: 'lead', availableIn: ['automações', 'webhooks'] },
  { key: '{{lead_code}}', label: 'Código do Lead', description: 'Código legível do lead', example: 'LD-00042', category: 'lead', availableIn: ['automações', 'follow-up', 'templates'] },
  { key: '{{tags}}', label: 'Tags', description: 'Tags associadas ao lead (separadas por vírgula)', example: 'vip, botox', category: 'lead', availableIn: ['automações', 'templates'] },
  { key: '{{origem}}', label: 'Origem', description: 'Fonte de origem do lead', example: 'Instagram', category: 'lead', availableIn: ['automações', 'follow-up', 'templates'] },
  { key: '{{notas}}', label: 'Notas', description: 'Observações do lead', example: 'Prefere atendimento à tarde', category: 'lead', availableIn: ['automações', 'templates'] },
  { key: '{{responsavel}}', label: 'Responsável', description: 'Nome do responsável pelo lead', example: 'Dr. João', category: 'lead', availableIn: ['automações', 'follow-up', 'templates'] },

  // Comunicação
  { key: '{{mensagem}}', label: 'Última mensagem', description: 'Conteúdo da última mensagem recebida', example: 'Olá, gostaria de agendar...', category: 'communication', availableIn: ['automações', 'chatbot'] },
  { key: '{{canal}}', label: 'Canal', description: 'Canal de comunicação (WhatsApp, Instagram, etc)', example: 'WhatsApp', category: 'communication', availableIn: ['automações', 'chatbot'] },
  { key: '{{conversation_id}}', label: 'ID da Conversa', description: 'Identificador da conversa ativa', example: 'conv-xyz-789', category: 'communication', availableIn: ['automações', 'webhooks'] },
  { key: '{{ultima_interacao}}', label: 'Última interação', description: 'Data/hora da última interação', example: '02/03/2026 14:30', category: 'communication', availableIn: ['automações', 'follow-up'] },

  // Pipeline / Funil
  { key: '{{funil}}', label: 'Nome do funil', description: 'Nome do pipeline/funil onde o lead está', example: 'Funil de Vendas', category: 'pipeline', availableIn: ['automações', 'follow-up', 'templates'] },
  { key: '{{etapa}}', label: 'Etapa atual', description: 'Nome da coluna/etapa atual do lead', example: 'Qualificação', category: 'pipeline', availableIn: ['automações', 'follow-up', 'templates'] },
  { key: '{{etapa_anterior}}', label: 'Etapa anterior', description: 'Nome da etapa de onde o lead veio', example: 'Novo Lead', category: 'pipeline', availableIn: ['automações'] },
  { key: '{{funil_id}}', label: 'ID do Funil', description: 'Identificador do pipeline', example: 'kan-abc-123', category: 'pipeline', availableIn: ['automações', 'webhooks'] },
  { key: '{{etapa_id}}', label: 'ID da Etapa', description: 'Identificador da coluna/etapa', example: 'col-def-456', category: 'pipeline', availableIn: ['automações', 'webhooks'] },

  // Agendamento
  { key: '{{procedimento}}', label: 'Procedimento', description: 'Tipo de serviço/procedimento de interesse', example: 'Transplante Capilar', category: 'appointment', availableIn: ['automações', 'follow-up', 'chatbot', 'templates'] },
  { key: '{{data_consulta}}', label: 'Data da consulta', description: 'Data do próximo agendamento', example: '15/03/2026', category: 'appointment', availableIn: ['automações', 'chatbot', 'templates'] },
  { key: '{{horario_consulta}}', label: 'Horário da consulta', description: 'Horário do agendamento', example: '14:00', category: 'appointment', availableIn: ['automações', 'chatbot', 'templates'] },
  { key: '{{local_consulta}}', label: 'Local da consulta', description: 'Endereço/unidade do agendamento', example: 'Unidade São Paulo', category: 'appointment', availableIn: ['automações', 'chatbot', 'templates'] },
  { key: '{{profissional_consulta}}', label: 'Profissional', description: 'Nome do profissional agendado', example: 'Dra. Ana Costa', category: 'appointment', availableIn: ['automações', 'chatbot', 'templates'] },
  { key: '{{status_consulta}}', label: 'Status da consulta', description: 'Status do agendamento (confirmado, pendente, cancelado)', example: 'confirmado', category: 'appointment', availableIn: ['automações'] },

  // Empresa / Conta
  { key: '{{empresa}}', label: 'Nome da empresa', description: 'Nome da empresa/clínica da conta', example: 'Neo Folic', category: 'company', availableIn: ['automações', 'follow-up', 'chatbot', 'templates'] },
  { key: '{{profissional}}', label: 'Nome do profissional', description: 'Nome do profissional/atendente', example: 'Dra. Ana', category: 'company', availableIn: ['automações', 'follow-up', 'chatbot', 'templates'] },
  { key: '{{unidade}}', label: 'Unidade', description: 'Nome da unidade/filial', example: 'Fortaleza', category: 'company', availableIn: ['automações', 'chatbot', 'templates'] },
  { key: '{{endereco}}', label: 'Endereço', description: 'Endereço da empresa/agenda', example: 'Av. Paulista, 1000', category: 'company', availableIn: ['chatbot', 'templates'] },

  // Data / Hora
  { key: '{{data_contato}}', label: 'Data do contato', description: 'Data do último contato com o lead', example: '15/01', category: 'time', availableIn: ['automações', 'follow-up', 'templates'] },
  { key: '{{horario}}', label: 'Horário atual', description: 'Horário comercial atual', example: '14:30', category: 'time', availableIn: ['automações', 'follow-up', 'templates'] },
  { key: '{{dia_semana}}', label: 'Dia da semana', description: 'Dia da semana por extenso', example: 'segunda-feira', category: 'time', availableIn: ['automações', 'follow-up', 'templates'] },
  { key: '{{data_hoje}}', label: 'Data de hoje', description: 'Data atual formatada', example: '02/03/2026', category: 'time', availableIn: ['automações', 'follow-up', 'templates'] },
  { key: '{{data_criacao}}', label: 'Data de criação', description: 'Data em que o lead foi criado', example: '28/02/2026', category: 'time', availableIn: ['automações', 'templates'] },
  { key: '{{dias_sem_contato}}', label: 'Dias sem contato', description: 'Número de dias desde a última interação', example: '3', category: 'time', availableIn: ['automações', 'follow-up'] },

  // UTM / Tráfego
  { key: '{{utm_source}}', label: 'UTM Source', description: 'Parâmetro utm_source da origem do lead', example: 'google', category: 'utm', availableIn: ['automações', 'templates'] },
  { key: '{{utm_medium}}', label: 'UTM Medium', description: 'Parâmetro utm_medium da origem', example: 'cpc', category: 'utm', availableIn: ['automações', 'templates'] },
  { key: '{{utm_campaign}}', label: 'UTM Campaign', description: 'Parâmetro utm_campaign da origem', example: 'blackfriday_2026', category: 'utm', availableIn: ['automações', 'templates'] },
  { key: '{{utm_content}}', label: 'UTM Content', description: 'Parâmetro utm_content da origem', example: 'banner_topo', category: 'utm', availableIn: ['automações', 'templates'] },
  { key: '{{utm_term}}', label: 'UTM Term', description: 'Parâmetro utm_term da origem', example: 'transplante capilar', category: 'utm', availableIn: ['automações', 'templates'] },

  // Sistema / Automação
  { key: '{{automacao_nome}}', label: 'Nome da automação', description: 'Nome da regra de automação que disparou', example: 'Boas-vindas Novo Lead', category: 'system', availableIn: ['automações', 'webhooks'] },
  { key: '{{trigger_event}}', label: 'Evento disparador', description: 'Tipo de evento que acionou a automação', example: 'lead.created', category: 'system', availableIn: ['automações', 'webhooks'] },
  { key: '{{execution_id}}', label: 'ID da execução', description: 'ID único da execução da automação', example: 'exec-789', category: 'system', availableIn: ['automações', 'webhooks'] },
  { key: '{{link_agendamento}}', label: 'Link de agendamento', description: 'URL do link de agendamento público', example: 'https://app.com/agendar/xyz', category: 'system', availableIn: ['automações', 'follow-up', 'chatbot'] },
  { key: '{{link_formulario}}', label: 'Link do formulário', description: 'URL do formulário de captação', example: 'https://app.com/form/abc', category: 'system', availableIn: ['automações', 'follow-up'] },
];

/* ─── Exported helper for automation builder ─── */
export function getVariablesForContext(context: string): CrmVariable[] {
  return CRM_VARIABLES.filter(v => v.availableIn.includes(context));
}

export function getVariablesByCategory(context?: string): Record<string, CrmVariable[]> {
  const vars = context ? getVariablesForContext(context) : CRM_VARIABLES;
  const grouped: Record<string, CrmVariable[]> = {};
  vars.forEach(v => {
    if (!grouped[v.category]) grouped[v.category] = [];
    grouped[v.category].push(v);
  });
  return grouped;
}

/* ─── Inline compose component ─── */
function VariableAutocompleteInline({ copyVariable, copiedKey }: { copyVariable: (key: string) => void; copiedKey: string | null }) {
  const [composeText, setComposeText] = useState('');
  return (
    <div className="space-y-2">
      <VariableAutocomplete
        value={composeText}
        onChange={setComposeText}
        placeholder='Olá {{primeiro_nome}}, tudo bem? Digite {{ para inserir variáveis...'
        className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))] min-h-[80px] text-sm"
      />
      {composeText && (
        <div className="flex justify-end">
          <button
            onClick={() => { navigator.clipboard.writeText(composeText); copyVariable(composeText); }}
            className="text-[11px] px-3 py-1 rounded-full bg-[hsl(var(--avivar-primary))] text-white hover:opacity-90 transition-opacity"
          >
            Copiar texto completo
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════ */
/*  MAIN PAGE                      */
/* ═══════════════════════════════ */
export default function AvivarVariables() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(VARIABLE_CATEGORIES.map(c => c.id)));
  const [filterContext, setFilterContext] = useState<string>('all');

  const filtered = useMemo(() => {
    let vars = filterContext === 'all' ? CRM_VARIABLES : getVariablesForContext(filterContext);
    if (search.trim()) {
      const q = search.toLowerCase();
      vars = vars.filter(v =>
        v.key.toLowerCase().includes(q) ||
        v.label.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q)
      );
    }
    return vars;
  }, [search, filterContext]);

  const groupedFiltered = useMemo(() => {
    const grouped: Record<string, CrmVariable[]> = {};
    filtered.forEach(v => {
      if (!grouped[v.category]) grouped[v.category] = [];
      grouped[v.category].push(v);
    });
    return grouped;
  }, [filtered]);

  const copyVariable = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success(`${key} copiado!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleCategory = (id: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const contexts = [
    { value: 'all', label: 'Todos' },
    { value: 'automações', label: 'Automações' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'chatbot', label: 'Chatbot' },
    { value: 'templates', label: 'Templates' },
    { value: 'webhooks', label: 'Webhooks' },
  ];

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--avivar-background))]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[hsl(var(--avivar-background))] border-b border-[hsl(var(--avivar-border))]">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/avivar')}
              className="h-9 w-9 rounded-xl hover:bg-[hsl(var(--avivar-primary)/0.08)]">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Hash className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-[hsl(var(--avivar-foreground))] leading-tight">
                  Variáveis do CRM
                </h1>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                  {filtered.length} variáveis disponíveis · Clique para copiar
                </p>
              </div>
            </div>
          </div>
          <Button onClick={() => navigate('/avivar/automacoes')} size="sm" variant="outline"
            className="gap-1.5 rounded-xl h-9 px-4">
            <Zap className="h-3.5 w-3.5" /> Automações
          </Button>
        </div>

        {/* Search + Filters */}
        <div className="px-5 pb-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
            <Input placeholder="Buscar variáveis..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {contexts.map(ctx => (
              <button key={ctx.value} onClick={() => setFilterContext(ctx.value)}
                className={cn(
                  'text-[11px] px-3 py-1 rounded-full border transition-all font-medium',
                  filterContext === ctx.value
                    ? 'bg-[hsl(var(--avivar-primary))] text-white border-[hsl(var(--avivar-primary))]'
                    : 'bg-[hsl(var(--avivar-card))] text-[hsl(var(--avivar-muted-foreground))] border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.4)]'
                )}>
                {ctx.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-4">
          {/* Compose / Test Area */}
          <div className="rounded-2xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[hsl(var(--avivar-foreground))]">Testar Variáveis</h3>
                <p className="text-[10px] text-[hsl(var(--avivar-muted-foreground))]">
                  Digite <code className="px-1 py-0.5 rounded bg-[hsl(var(--avivar-background))] text-[hsl(var(--avivar-primary))] border border-[hsl(var(--avivar-border))]">{'{{'}</code> para inserir variáveis ou clique abaixo
                </p>
              </div>
            </div>
            <VariableAutocompleteInline
              copyVariable={copyVariable}
              copiedKey={copiedKey}
            />
          </div>

          {VARIABLE_CATEGORIES.filter(cat => groupedFiltered[cat.id]?.length).map(cat => {
            const vars = groupedFiltered[cat.id];
            const isExpanded = expandedCats.has(cat.id);
            const CatIcon = cat.icon;

            return (
              <div key={cat.id} className="rounded-2xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[hsl(var(--avivar-primary)/0.03)] transition-colors"
                >
                  <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-md', cat.color)}>
                    <CatIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-semibold text-[hsl(var(--avivar-foreground))]">{cat.label}</span>
                    <span className="ml-2 text-[10px] text-[hsl(var(--avivar-muted-foreground))]">
                      {vars.length} variáve{vars.length > 1 ? 'is' : 'l'}
                    </span>
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" /> : <ChevronRight className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />}
                </button>

                {/* Variables */}
                {isExpanded && (
                  <div className="border-t border-[hsl(var(--avivar-border))]">
                    {vars.map((v, idx) => (
                      <div
                        key={v.key}
                        onClick={() => copyVariable(v.key)}
                        className={cn(
                          'group flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all hover:bg-[hsl(var(--avivar-primary)/0.04)]',
                          idx < vars.length - 1 && 'border-b border-[hsl(var(--avivar-border)/0.5)]'
                        )}
                      >
                        {/* Variable key */}
                        <code className="text-xs font-mono font-semibold px-2 py-0.5 rounded-lg bg-[hsl(var(--avivar-background))] text-[hsl(var(--avivar-primary))] border border-[hsl(var(--avivar-border))] whitespace-nowrap min-w-[160px]">
                          {v.key}
                        </code>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[hsl(var(--avivar-foreground))]">{v.label}</span>
                            <span className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] truncate hidden sm:inline">
                              — {v.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] italic">
                              ex: {v.example}
                            </span>
                          </div>
                        </div>

                        {/* Available contexts */}
                        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
                          {v.availableIn.slice(0, 3).map(ctx => (
                            <Badge key={ctx} variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                              {ctx}
                            </Badge>
                          ))}
                          {v.availableIn.length > 3 && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">+{v.availableIn.length - 3}</Badge>
                          )}
                        </div>

                        {/* Copy button */}
                        <div className="flex-shrink-0">
                          {copiedKey === v.key ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-[hsl(var(--avivar-muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Hash className="h-10 w-10 mx-auto text-[hsl(var(--avivar-muted-foreground))] opacity-30 mb-3" />
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Nenhuma variável encontrada</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
