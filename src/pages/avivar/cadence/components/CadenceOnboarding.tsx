/**
 * CadenceOnboarding - Experiência inicial de templates de cadências
 * Exibe templates pré-configurados para usuários sem cadências configuradas
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles,
  MessageSquare,
  Clock,
  Zap,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  LayoutTemplate,
  Target,
  Users,
  Calendar,
  Stethoscope,
  UserPlus,
  AlertCircle,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos de templates disponíveis
interface TemplateStep {
  delay: string;
  delayMinutes: number;
  channel: 'whatsapp' | 'sms' | 'email';
  message: string;
  description: string;
}

interface CadenceTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'comercial' | 'pos-venda' | 'agendamento' | 'reativacao';
  targetColumn: string;
  steps: TemplateStep[];
  popular?: boolean;
}

// Templates pré-configurados baseados nas colunas do Kanban
const CADENCE_TEMPLATES: CadenceTemplate[] = [
  {
    id: 'lead-entrada',
    name: 'Lead de Entrada - Primeiro Contato',
    description: 'Sequência para leads novos que acabaram de chegar. Foco em qualificação rápida.',
    icon: <UserPlus className="h-5 w-5" />,
    category: 'comercial',
    targetColumn: 'Lead de Entrada',
    popular: true,
    steps: [
      {
        delay: '5 minutos',
        delayMinutes: 5,
        channel: 'whatsapp',
        message: 'Olá {{primeiro_nome}}! 👋 Sou {{atendente}} da {{clinica}}. Vi que você demonstrou interesse em nossos procedimentos. Posso te ajudar com alguma informação?',
        description: 'Contato imediato para aumentar taxa de resposta'
      },
      {
        delay: '2 horas',
        delayMinutes: 120,
        channel: 'whatsapp',
        message: '{{primeiro_nome}}, passando para verificar se recebeu minha mensagem anterior! 😊 Estou à disposição para esclarecer qualquer dúvida sobre o {{procedimento}}.',
        description: 'Segundo contato caso não responda'
      },
      {
        delay: '1 dia',
        delayMinutes: 1440,
        channel: 'whatsapp',
        message: 'Oi {{primeiro_nome}}! Não consegui falar com você ontem. Sei que a rotina é corrida, mas não queria que você perdesse a oportunidade de conhecer nosso trabalho. Posso te ligar em um horário que seja melhor?',
        description: 'Terceira tentativa com oferta de ligação'
      },
      {
        delay: '3 dias',
        delayMinutes: 4320,
        channel: 'whatsapp',
        message: '{{primeiro_nome}}, última tentativa por aqui! 🙏 Se ainda tiver interesse, responde esse contato que seguimos conversando. Se não for o momento, sem problemas! Desejo tudo de bom.',
        description: 'Última tentativa antes de desqualificar'
      }
    ]
  },
  {
    id: 'triagem',
    name: 'Triagem - Qualificação de Lead',
    description: 'Para leads que responderam mas ainda não foram qualificados. Perguntas estratégicas.',
    icon: <Target className="h-5 w-5" />,
    category: 'comercial',
    targetColumn: 'Triagem',
    steps: [
      {
        delay: '30 minutos',
        delayMinutes: 30,
        channel: 'whatsapp',
        message: 'Que bom falar com você, {{primeiro_nome}}! 🎯 Para eu entender melhor como posso te ajudar: você está buscando informações para você ou para alguém?',
        description: 'Início da qualificação'
      },
      {
        delay: '4 horas',
        delayMinutes: 240,
        channel: 'whatsapp',
        message: '{{primeiro_nome}}, continuo por aqui! 😊 Para agilizar, me conta: qual é sua principal preocupação com relação ao {{procedimento}}?',
        description: 'Identificar dor principal'
      },
      {
        delay: '1 dia',
        delayMinutes: 1440,
        channel: 'whatsapp',
        message: 'Oi {{primeiro_nome}}! Vi que não conseguimos continuar nossa conversa. Quer que eu te envie um material explicativo sobre o procedimento? Assim você pode avaliar com calma! 📋',
        description: 'Oferecer material para manter engajamento'
      }
    ]
  },
  {
    id: 'tentando-agendar',
    name: 'Tentando Agendar - Conversão',
    description: 'Lead qualificado pronto para agendar. Foco em criar urgência.',
    icon: <Calendar className="h-5 w-5" />,
    category: 'agendamento',
    targetColumn: 'Tentando Agendar',
    popular: true,
    steps: [
      {
        delay: '1 hora',
        delayMinutes: 60,
        channel: 'whatsapp',
        message: '{{primeiro_nome}}, ótimas notícias! 🎉 Consegui verificar a agenda do Dr. {{profissional}} e temos dois horários disponíveis esta semana. Qual funciona melhor para você?',
        description: 'Técnica Ou/Ou para agendamento'
      },
      {
        delay: '6 horas',
        delayMinutes: 360,
        channel: 'whatsapp',
        message: 'Oi {{primeiro_nome}}! Os horários que te mandei ainda estão disponíveis, mas a agenda do doutor está enchendo rápido. Quer que eu reserve um para você? ⏰',
        description: 'Criar senso de urgência'
      },
      {
        delay: '1 dia',
        delayMinutes: 1440,
        channel: 'whatsapp',
        message: '{{primeiro_nome}}, sei que às vezes é difícil decidir! Que tal uma conversa rápida por telefone para tirar suas dúvidas? Posso te ligar agora ou você prefere em outro horário?',
        description: 'Oferecer ligação para destravar'
      },
      {
        delay: '3 dias',
        delayMinutes: 4320,
        channel: 'whatsapp',
        message: 'Oi {{primeiro_nome}}! Não quero ser inconveniente, mas vi que você tinha bastante interesse. Se o momento não for bom, me avisa que volto a falar daqui um tempo. O importante é você se sentir confortável! 💙',
        description: 'Última tentativa respeitosa'
      }
    ]
  },
  {
    id: 'agendado-confirmacao',
    name: 'Agendado - Confirmação de Consulta',
    description: 'Confirmar presença e reduzir no-shows de leads agendados.',
    icon: <CheckCircle2 className="h-5 w-5" />,
    category: 'agendamento',
    targetColumn: 'Agendado',
    steps: [
      {
        delay: '1 dia antes',
        delayMinutes: -1440,
        channel: 'whatsapp',
        message: '{{primeiro_nome}}, lembrete: sua consulta com Dr. {{profissional}} é amanhã às {{horario_consulta}}! 📍 Endereço: {{endereco_clinica}}. Confirma presença? Responda SIM ou NÃO.',
        description: 'Confirmação 24h antes'
      },
      {
        delay: '2 horas antes',
        delayMinutes: -120,
        channel: 'whatsapp',
        message: 'Olá {{primeiro_nome}}! 🕐 Daqui a pouco é sua consulta ({{horario_consulta}}). Estamos te esperando! Se precisar do endereço: {{endereco_clinica}}',
        description: 'Lembrete no dia'
      }
    ]
  },
  {
    id: 'pos-procedimento',
    name: 'Pós-Procedimento - Acompanhamento',
    description: 'Acompanhamento pós-venda para garantir satisfação e coletar indicações.',
    icon: <Heart className="h-5 w-5" />,
    category: 'pos-venda',
    targetColumn: 'Pós-Procedimento',
    steps: [
      {
        delay: '1 dia',
        delayMinutes: 1440,
        channel: 'whatsapp',
        message: 'Oi {{primeiro_nome}}! 💙 Aqui é a {{atendente}} da {{clinica}}. Passando para saber como você está se sentindo após o procedimento. Está tudo bem?',
        description: 'Primeiro contato pós-procedimento'
      },
      {
        delay: '7 dias',
        delayMinutes: 10080,
        channel: 'whatsapp',
        message: '{{primeiro_nome}}, já faz uma semana do seu procedimento! 🌟 Como está a recuperação? Alguma dúvida que eu possa ajudar?',
        description: 'Acompanhamento 1 semana'
      },
      {
        delay: '14 dias',
        delayMinutes: 20160,
        channel: 'whatsapp',
        message: 'Oi {{primeiro_nome}}! Passando para ver como você está! 😊 Se estiver satisfeito(a), adoraríamos que indicasse a {{clinica}} para amigos e familiares. Temos condições especiais para indicações! 🎁',
        description: 'Pedir indicações após 2 semanas'
      },
      {
        delay: '30 dias',
        delayMinutes: 43200,
        channel: 'whatsapp',
        message: '{{primeiro_nome}}, um mês já! 🎉 Esperamos que esteja amando o resultado. Poderia nos contar sua experiência? Seu feedback é muito importante para nós!',
        description: 'Coletar depoimento'
      }
    ]
  },
  {
    id: 'reativacao-leads-frios',
    name: 'Reativação de Leads Frios',
    description: 'Recuperar leads que esfriaram ou pararam de responder há mais de 30 dias.',
    icon: <AlertCircle className="h-5 w-5" />,
    category: 'reativacao',
    targetColumn: 'Lead Frio',
    steps: [
      {
        delay: 'Imediato',
        delayMinutes: 0,
        channel: 'whatsapp',
        message: 'Oi {{primeiro_nome}}! 👋 Lembra de mim? Sou {{atendente}} da {{clinica}}. Faz um tempo que conversamos sobre {{procedimento}}. Ainda tenho interesse em te ajudar! Mudou alguma coisa?',
        description: 'Primeiro contato de reativação'
      },
      {
        delay: '5 dias',
        delayMinutes: 7200,
        channel: 'whatsapp',
        message: '{{primeiro_nome}}, sei que a vida anda corrida! 😊 Estamos com condições especiais este mês. Quer saber mais?',
        description: 'Oferecer incentivo'
      },
      {
        delay: '15 dias',
        delayMinutes: 21600,
        channel: 'whatsapp',
        message: 'Oi {{primeiro_nome}}! Última tentativa por aqui. Se o {{procedimento}} não for mais do seu interesse, sem problemas! Mas se quiser retomar, estou à disposição. Abraços! 🤗',
        description: 'Última tentativa'
      }
    ]
  }
];

const CATEGORY_CONFIG = {
  comercial: { label: 'Comercial', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  'pos-venda': { label: 'Pós-Venda', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  agendamento: { label: 'Agendamento', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  reativacao: { label: 'Reativação', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
};

interface CadenceOnboardingProps {
  onSelectTemplate: (template: CadenceTemplate) => void;
  onCreateFromScratch: () => void;
}

export function CadenceOnboarding({ onSelectTemplate, onCreateFromScratch }: CadenceOnboardingProps) {
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTemplates = selectedCategory 
    ? CADENCE_TEMPLATES.filter(t => t.category === selectedCategory)
    : CADENCE_TEMPLATES;

  const toggleExpand = (templateId: string) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
  };

  return (
    <div className="space-y-6">
      {/* Header com boas-vindas */}
      <Card className="bg-gradient-to-br from-[hsl(var(--avivar-primary)/0.2)] to-[hsl(var(--avivar-accent)/0.1)] border-[hsl(var(--avivar-primary)/0.3)]">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--avivar-primary))] to-[hsl(var(--avivar-accent))] flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[hsl(var(--avivar-foreground))] mb-1">
                Configure suas Cadências de Follow-up
              </h2>
              <p className="text-[hsl(var(--avivar-muted-foreground))]">
                Escolha um template pronto ou crie do zero. As cadências enviam mensagens automaticamente para leads que não respondem, 
                aumentando suas taxas de conversão em até 3x!
              </p>
            </div>
          </div>
          
          {/* Stats rápidos */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 rounded-xl bg-[hsl(var(--avivar-background)/0.5)]">
              <p className="text-2xl font-bold text-[hsl(var(--avivar-primary))]">+67%</p>
              <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Taxa de resposta</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-[hsl(var(--avivar-background)/0.5)]">
              <p className="text-2xl font-bold text-[hsl(var(--avivar-primary))]">-80%</p>
              <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Leads perdidos</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-[hsl(var(--avivar-background)/0.5)]">
              <p className="text-2xl font-bold text-[hsl(var(--avivar-primary))]">3x</p>
              <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Mais agendamentos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros de categoria */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className={cn(
            selectedCategory === null 
              ? 'bg-[hsl(var(--avivar-primary))] text-white' 
              : 'border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]'
          )}
        >
          Todos
        </Button>
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
          <Button
            key={key}
            variant={selectedCategory === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
            className={cn(
              selectedCategory === key 
                ? 'bg-[hsl(var(--avivar-primary))] text-white' 
                : 'border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]'
            )}
          >
            {config.label}
          </Button>
        ))}
      </div>

      {/* Grid de templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id}
            className={cn(
              "bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] transition-all",
              expandedTemplate === template.id && "ring-2 ring-[hsl(var(--avivar-primary)/0.5)]"
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(var(--avivar-primary)/0.2)] flex items-center justify-center text-[hsl(var(--avivar-primary))]">
                    {template.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                      {template.name}
                      {template.popular && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                          ⭐ Popular
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={CATEGORY_CONFIG[template.category].color}>
                        {CATEGORY_CONFIG[template.category].label}
                      </Badge>
                      <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                        {template.steps.length} mensagens
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <CardDescription className="text-[hsl(var(--avivar-muted-foreground))] mt-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Preview das mensagens colapsável */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpand(template.id)}
                className="w-full justify-between text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.1)] mb-2"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Ver mensagens
                </span>
                {expandedTemplate === template.id ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {expandedTemplate === template.id && (
                <ScrollArea className="h-[280px] pr-4 mb-4">
                  <div className="space-y-3">
                    {template.steps.map((step, index) => (
                      <div 
                        key={index}
                        className="p-3 rounded-lg border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-[hsl(var(--avivar-primary)/0.2)] flex items-center justify-center text-xs font-medium text-[hsl(var(--avivar-primary))]">
                            {index + 1}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-[hsl(var(--avivar-muted-foreground))]" />
                            <span className="text-xs font-medium text-[hsl(var(--avivar-foreground))]">
                              {step.delay}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs capitalize border-[hsl(var(--avivar-border))]">
                            {step.channel}
                          </Badge>
                        </div>
                        <p className="text-sm text-[hsl(var(--avivar-secondary-foreground))] whitespace-pre-wrap">
                          {step.message}
                        </p>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-2 italic">
                          💡 {step.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Ações */}
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
                  onClick={() => onSelectTemplate(template)}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Usar Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Opção de criar do zero */}
      <Card className="bg-[hsl(var(--avivar-card)/0.5)] border-dashed border-[hsl(var(--avivar-primary)/0.3)] hover:border-[hsl(var(--avivar-primary)/0.5)] transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[hsl(var(--avivar-muted))] flex items-center justify-center">
                <LayoutTemplate className="h-6 w-6 text-[hsl(var(--avivar-muted-foreground))]" />
              </div>
              <div>
                <h3 className="font-semibold text-[hsl(var(--avivar-foreground))]">
                  Criar Cadência do Zero
                </h3>
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  Configure cada mensagem, intervalo e canal manualmente
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={onCreateFromScratch}
              className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
            >
              Criar do Zero
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export dos templates para uso em outros componentes
export { CADENCE_TEMPLATES, type CadenceTemplate, type TemplateStep };
