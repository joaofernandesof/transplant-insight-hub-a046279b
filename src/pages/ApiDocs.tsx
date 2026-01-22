import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Book, 
  Code, 
  Copy, 
  Check, 
  ChevronRight,
  Key,
  Globe,
  Shield,
  Zap,
  Users,
  FileText,
  Calendar,
  TrendingUp,
  MessageSquare,
  DollarSign,
  Scissors,
  BarChart3,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UnifiedSidebar } from "@/components/UnifiedSidebar";

const API_BASE_URL = "https://tubzywibnielhcjeswww.supabase.co/functions/v1";

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  title: string;
  description: string;
  auth: boolean;
  requestBody?: {
    type: string;
    properties: Record<string, { type: string; description: string; required?: boolean }>;
  };
  response?: {
    type: string;
    example: object;
  };
  headers?: Record<string, string>;
}

interface ApiSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  endpoints: Endpoint[];
}

const apiSections: ApiSection[] = [
  {
    id: "leads",
    title: "Leads",
    icon: <Users className="h-5 w-5" />,
    description: "Endpoints para gerenciamento e recebimento de leads",
    endpoints: [
      {
        method: "POST",
        path: "/receive-lead",
        title: "Receber Lead",
        description: "Recebe um novo lead de fontes externas (landing pages, formulários, etc.)",
        auth: false,
        requestBody: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nome completo do lead", required: true },
            phone: { type: "string", description: "Telefone do lead", required: true },
            email: { type: "string", description: "Email do lead" },
            city: { type: "string", description: "Cidade do lead" },
            state: { type: "string", description: "Estado do lead (UF)" },
            source: { type: "string", description: "Origem do lead (ex: landing_page, facebook)" },
            utm_source: { type: "string", description: "UTM Source para tracking" },
            utm_medium: { type: "string", description: "UTM Medium para tracking" },
            utm_campaign: { type: "string", description: "UTM Campaign para tracking" },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            message: "Lead recebido com sucesso",
            lead_id: "uuid-do-lead"
          }
        }
      },
      {
        method: "POST",
        path: "/notify-lead-arrival",
        title: "Notificar Chegada de Lead",
        description: "Envia notificação quando um novo lead chega no sistema",
        auth: true,
        requestBody: {
          type: "object",
          properties: {
            lead_id: { type: "string", description: "ID do lead", required: true },
            clinic_id: { type: "string", description: "ID da clínica a ser notificada" },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            notified: true
          }
        }
      }
    ]
  },
  {
    id: "auth",
    title: "Autenticação",
    icon: <Shield className="h-5 w-5" />,
    description: "Endpoints relacionados à autenticação e gerenciamento de usuários",
    endpoints: [
      {
        method: "POST",
        path: "/admin-reset-password",
        title: "Reset de Senha (Admin)",
        description: "Permite que administradores resetem a senha de um usuário",
        auth: true,
        headers: {
          "Authorization": "Bearer {admin_token}"
        },
        requestBody: {
          type: "object",
          properties: {
            user_id: { type: "string", description: "ID do usuário", required: true },
            new_password: { type: "string", description: "Nova senha do usuário", required: true },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            message: "Senha atualizada com sucesso"
          }
        }
      },
      {
        method: "POST",
        path: "/notify-login",
        title: "Notificar Login",
        description: "Registra e notifica quando um usuário faz login no sistema",
        auth: true,
        requestBody: {
          type: "object",
          properties: {
            user_id: { type: "string", description: "ID do usuário", required: true },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            logged: true
          }
        }
      }
    ]
  },
  {
    id: "automation",
    title: "Automações",
    icon: <Zap className="h-5 w-5" />,
    description: "Endpoints para automações e tarefas agendadas",
    endpoints: [
      {
        method: "POST",
        path: "/check-inactive-users",
        title: "Verificar Usuários Inativos",
        description: "Verifica e notifica sobre usuários que estão inativos há muito tempo",
        auth: true,
        headers: {
          "Authorization": "Bearer {service_token}"
        },
        requestBody: {
          type: "object",
          properties: {
            days_inactive: { type: "number", description: "Número de dias de inatividade" },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            inactive_users: 5,
            notified: true
          }
        }
      },
      {
        method: "POST",
        path: "/send-weekly-reports",
        title: "Enviar Relatórios Semanais",
        description: "Gera e envia relatórios semanais para licenciados",
        auth: true,
        headers: {
          "Authorization": "Bearer {service_token}"
        },
        response: {
          type: "object",
          example: {
            success: true,
            reports_sent: 15
          }
        }
      }
    ]
  },
  {
    id: "ai",
    title: "Inteligência Artificial",
    icon: <MessageSquare className="h-5 w-5" />,
    description: "Endpoints para funcionalidades de IA e chat",
    endpoints: [
      {
        method: "POST",
        path: "/jon-jobs-chat",
        title: "Chat com Jon Jobs",
        description: "Endpoint para interação com o assistente virtual Jon Jobs",
        auth: true,
        requestBody: {
          type: "object",
          properties: {
            message: { type: "string", description: "Mensagem do usuário", required: true },
            conversation_history: { type: "array", description: "Histórico da conversa" },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            response: "Resposta do assistente...",
            tokens_used: 150
          }
        }
      }
    ]
  },
  {
    id: "sales",
    title: "Vendas",
    icon: <DollarSign className="h-5 w-5" />,
    description: "Endpoints para gerenciamento de vendas e resultados consolidados",
    endpoints: [
      {
        method: "GET",
        path: "/sales",
        title: "Listar Vendas",
        description: "Retorna lista de vendas com filtros opcionais por período, categoria e status",
        auth: true,
        headers: {
          "Authorization": "Bearer {user_token}"
        },
        requestBody: {
          type: "object",
          properties: {
            month_year: { type: "string", description: "Mês/ano no formato MM/YYYY" },
            category: { type: "string", description: "Categoria da venda (ex: FUE, FUT)" },
            service_type: { type: "string", description: "Tipo de serviço" },
            contract_status: { type: "string", description: "Status do contrato" },
            limit: { type: "number", description: "Limite de registros (padrão: 100)" },
            offset: { type: "number", description: "Offset para paginação" },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            data: [
              {
                id: "uuid",
                patient_name: "João Silva",
                service_type: "Transplante Capilar",
                category: "FUE",
                vgv_initial: 25000,
                sale_date: "2026-01-15",
                contract_status: "assinado"
              }
            ],
            total: 45,
            page: 1
          }
        }
      },
      {
        method: "POST",
        path: "/sales",
        title: "Criar Venda",
        description: "Registra uma nova venda no sistema",
        auth: true,
        headers: {
          "Authorization": "Bearer {user_token}"
        },
        requestBody: {
          type: "object",
          properties: {
            patient_name: { type: "string", description: "Nome do paciente", required: true },
            patient_email: { type: "string", description: "Email do paciente" },
            patient_cpf: { type: "string", description: "CPF do paciente" },
            service_type: { type: "string", description: "Tipo de serviço", required: true },
            category: { type: "string", description: "Categoria (FUE, FUT, etc.)" },
            vgv_initial: { type: "number", description: "Valor Geral de Venda inicial", required: true },
            deposit_paid: { type: "number", description: "Valor de entrada pago" },
            sale_date: { type: "string", description: "Data da venda (YYYY-MM-DD)", required: true },
            sold_by: { type: "string", description: "Vendedor responsável" },
            branch: { type: "string", description: "Unidade/filial" },
            contract_status: { type: "string", description: "Status do contrato" },
            observations: { type: "string", description: "Observações gerais" },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            message: "Venda registrada com sucesso",
            sale_id: "uuid-da-venda"
          }
        }
      },
      {
        method: "PUT",
        path: "/sales/{id}",
        title: "Atualizar Venda",
        description: "Atualiza os dados de uma venda existente",
        auth: true,
        headers: {
          "Authorization": "Bearer {user_token}"
        },
        requestBody: {
          type: "object",
          properties: {
            patient_name: { type: "string", description: "Nome do paciente" },
            vgv_initial: { type: "number", description: "Valor Geral de Venda" },
            contract_status: { type: "string", description: "Status do contrato" },
            observations: { type: "string", description: "Observações" },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            message: "Venda atualizada com sucesso"
          }
        }
      },
      {
        method: "DELETE",
        path: "/sales/{id}",
        title: "Excluir Venda",
        description: "Remove uma venda do sistema",
        auth: true,
        headers: {
          "Authorization": "Bearer {user_token}"
        },
        response: {
          type: "object",
          example: {
            success: true,
            message: "Venda excluída com sucesso"
          }
        }
      },
      {
        method: "GET",
        path: "/sales/stats",
        title: "Estatísticas de Vendas",
        description: "Retorna métricas consolidadas de vendas (VGV total, ticket médio, conversões)",
        auth: true,
        headers: {
          "Authorization": "Bearer {user_token}"
        },
        requestBody: {
          type: "object",
          properties: {
            start_date: { type: "string", description: "Data inicial (YYYY-MM-DD)" },
            end_date: { type: "string", description: "Data final (YYYY-MM-DD)" },
            group_by: { type: "string", description: "Agrupar por: month, seller, category, branch" },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            stats: {
              total_vgv: 1250000,
              total_sales: 52,
              average_ticket: 24038.46,
              conversion_rate: 0.32,
              by_category: {
                "FUE": { count: 35, vgv: 875000 },
                "FUT": { count: 17, vgv: 375000 }
              }
            }
          }
        }
      }
    ]
  },
  {
    id: "surgeries",
    title: "Cirurgias",
    icon: <Scissors className="h-5 w-5" />,
    description: "Endpoints para gerenciamento da agenda de cirurgias",
    endpoints: [
      {
        method: "GET",
        path: "/surgeries",
        title: "Listar Cirurgias",
        description: "Retorna a agenda de cirurgias com filtros por período e status",
        auth: true,
        headers: {
          "Authorization": "Bearer {user_token}"
        },
        requestBody: {
          type: "object",
          properties: {
            start_date: { type: "string", description: "Data inicial (YYYY-MM-DD)" },
            end_date: { type: "string", description: "Data final (YYYY-MM-DD)" },
            confirmed: { type: "boolean", description: "Filtrar por confirmadas" },
            procedure_type: { type: "string", description: "Tipo de procedimento" },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            data: [
              {
                id: "uuid",
                patient_name: "Maria Oliveira",
                surgery_date: "2026-01-20",
                surgery_time: "08:00",
                procedure_type: "Transplante FUE",
                confirmed: true,
                initial_value: 28000,
                balance_due: 14000
              }
            ],
            total: 12
          }
        }
      },
      {
        method: "POST",
        path: "/surgeries",
        title: "Agendar Cirurgia",
        description: "Cria um novo agendamento de cirurgia",
        auth: true,
        headers: {
          "Authorization": "Bearer {user_token}"
        },
        requestBody: {
          type: "object",
          properties: {
            patient_name: { type: "string", description: "Nome do paciente", required: true },
            patient_phone: { type: "string", description: "Telefone do paciente" },
            surgery_date: { type: "string", description: "Data da cirurgia (YYYY-MM-DD)", required: true },
            surgery_time: { type: "string", description: "Horário (HH:MM)" },
            procedure_type: { type: "string", description: "Tipo de procedimento" },
            category: { type: "string", description: "Categoria (FUE, FUT, etc.)" },
            initial_value: { type: "number", description: "Valor inicial" },
            deposit_paid: { type: "number", description: "Entrada paga" },
            companion_name: { type: "string", description: "Nome do acompanhante" },
            companion_phone: { type: "string", description: "Telefone do acompanhante" },
            observations: { type: "string", description: "Observações" },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            message: "Cirurgia agendada com sucesso",
            surgery_id: "uuid-da-cirurgia"
          }
        }
      },
      {
        method: "PUT",
        path: "/surgeries/{id}",
        title: "Atualizar Cirurgia",
        description: "Atualiza os dados de uma cirurgia agendada",
        auth: true,
        headers: {
          "Authorization": "Bearer {user_token}"
        },
        requestBody: {
          type: "object",
          properties: {
            surgery_date: { type: "string", description: "Nova data da cirurgia" },
            surgery_time: { type: "string", description: "Novo horário" },
            confirmed: { type: "boolean", description: "Confirmação da cirurgia" },
            contract_signed: { type: "boolean", description: "Contrato assinado" },
            exams_sent: { type: "boolean", description: "Exames enviados" },
            checkin_sent: { type: "boolean", description: "Check-in enviado" },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            message: "Cirurgia atualizada com sucesso"
          }
        }
      },
      {
        method: "PATCH",
        path: "/surgeries/{id}/checklist",
        title: "Atualizar Checklist",
        description: "Atualiza itens do checklist de acompanhamento da cirurgia",
        auth: true,
        headers: {
          "Authorization": "Bearer {user_token}"
        },
        requestBody: {
          type: "object",
          properties: {
            d1_contact: { type: "boolean", description: "Contato D+1 realizado" },
            d1_gpi: { type: "boolean", description: "GPI D+1 realizado" },
            d2_contact: { type: "boolean", description: "Contato D+2 realizado" },
            d7_contact: { type: "boolean", description: "Contato D+7 realizado" },
            d0_discharge_form: { type: "boolean", description: "Formulário de alta D0" },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            message: "Checklist atualizado"
          }
        }
      },
      {
        method: "DELETE",
        path: "/surgeries/{id}",
        title: "Cancelar Cirurgia",
        description: "Remove uma cirurgia da agenda",
        auth: true,
        headers: {
          "Authorization": "Bearer {user_token}"
        },
        response: {
          type: "object",
          example: {
            success: true,
            message: "Cirurgia cancelada com sucesso"
          }
        }
      },
      {
        method: "GET",
        path: "/surgeries/stats",
        title: "Estatísticas de Cirurgias",
        description: "Retorna métricas consolidadas da agenda de cirurgias",
        auth: true,
        headers: {
          "Authorization": "Bearer {user_token}"
        },
        requestBody: {
          type: "object",
          properties: {
            start_date: { type: "string", description: "Data inicial" },
            end_date: { type: "string", description: "Data final" },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            stats: {
              total_scheduled: 45,
              confirmed: 38,
              pending: 7,
              total_value: 1260000,
              total_received: 890000,
              total_pending: 370000,
              confirmation_rate: 0.84
            }
          }
        }
      }
    ]
  },
  {
    id: "weekly-metrics",
    title: "Métricas Semanais",
    icon: <BarChart3 className="h-5 w-5" />,
    description: "Endpoints para gerenciamento de métricas e indicadores semanais",
    endpoints: [
      {
        method: "GET",
        path: "/weekly-metrics",
        title: "Listar Métricas Semanais",
        description: "Retorna as métricas semanais de uma clínica",
        auth: true,
        headers: {
          "Authorization": "Bearer {user_token}"
        },
        requestBody: {
          type: "object",
          properties: {
            clinic_id: { type: "string", description: "ID da clínica", required: true },
            year: { type: "number", description: "Ano (ex: 2026)" },
            week_start: { type: "number", description: "Semana inicial" },
            week_end: { type: "number", description: "Semana final" },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            data: [
              {
                id: "uuid",
                clinic_id: "uuid-clinica",
                week_number: 3,
                year: 2026,
                is_filled: true,
                values: {
                  leads_total: 45,
                  leads_qualified: 32,
                  appointments_scheduled: 18,
                  appointments_attended: 15,
                  sales_closed: 8,
                  revenue: 200000
                }
              }
            ]
          }
        }
      },
      {
        method: "POST",
        path: "/weekly-metrics",
        title: "Registrar Métricas",
        description: "Registra as métricas de uma semana específica",
        auth: true,
        headers: {
          "Authorization": "Bearer {user_token}"
        },
        requestBody: {
          type: "object",
          properties: {
            clinic_id: { type: "string", description: "ID da clínica", required: true },
            week_number: { type: "number", description: "Número da semana (1-52)", required: true },
            year: { type: "number", description: "Ano", required: true },
            values: { type: "object", description: "Objeto com os valores das métricas", required: true },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            message: "Métricas registradas com sucesso",
            metric_id: "uuid-da-metrica"
          }
        }
      },
      {
        method: "PUT",
        path: "/weekly-metrics/{id}",
        title: "Atualizar Métricas",
        description: "Atualiza os valores de uma métrica semanal existente",
        auth: true,
        headers: {
          "Authorization": "Bearer {user_token}"
        },
        requestBody: {
          type: "object",
          properties: {
            values: { type: "object", description: "Objeto com os valores atualizados", required: true },
            is_filled: { type: "boolean", description: "Marcar como preenchida" },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            message: "Métricas atualizadas com sucesso"
          }
        }
      },
      {
        method: "GET",
        path: "/weekly-metrics/comparison",
        title: "Comparativo de Métricas",
        description: "Retorna comparativo de métricas entre períodos ou clínicas",
        auth: true,
        headers: {
          "Authorization": "Bearer {user_token}"
        },
        requestBody: {
          type: "object",
          properties: {
            clinic_ids: { type: "array", description: "IDs das clínicas para comparar" },
            period_1_start: { type: "number", description: "Semana inicial período 1" },
            period_1_end: { type: "number", description: "Semana final período 1" },
            period_2_start: { type: "number", description: "Semana inicial período 2" },
            period_2_end: { type: "number", description: "Semana final período 2" },
            year: { type: "number", description: "Ano" },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            comparison: {
              period_1: {
                total_leads: 180,
                total_sales: 32,
                conversion_rate: 0.178
              },
              period_2: {
                total_leads: 210,
                total_sales: 45,
                conversion_rate: 0.214
              },
              growth: {
                leads: 0.167,
                sales: 0.406,
                conversion: 0.202
              }
            }
          }
        }
      },
      {
        method: "GET",
        path: "/weekly-metrics/export",
        title: "Exportar Métricas",
        description: "Exporta métricas em formato CSV ou Excel",
        auth: true,
        headers: {
          "Authorization": "Bearer {user_token}"
        },
        requestBody: {
          type: "object",
          properties: {
            clinic_id: { type: "string", description: "ID da clínica", required: true },
            format: { type: "string", description: "Formato: csv ou xlsx", required: true },
            year: { type: "number", description: "Ano" },
            weeks: { type: "array", description: "Lista de semanas para exportar" },
          }
        },
        response: {
          type: "object",
          example: {
            success: true,
            download_url: "https://storage.example.com/exports/metrics-2026-w1-w4.xlsx",
            expires_at: "2026-01-20T12:00:00Z"
          }
        }
      }
    ]
  }
];

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  POST: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  PUT: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  PATCH: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
};

const CodeBlock = ({ code, language = "json" }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-muted/50 border rounded-lg p-4 overflow-x-auto text-sm">
        <code className="text-foreground/80">{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
};

const EndpointCard = ({ endpoint }: { endpoint: Endpoint }) => {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className={cn("font-mono font-bold", methodColors[endpoint.method])}>
            {endpoint.method}
          </Badge>
          <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
            {endpoint.path}
          </code>
          {endpoint.auth && (
            <Badge variant="secondary" className="gap-1">
              <Key className="h-3 w-3" />
              Auth Required
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg mt-2">{endpoint.title}</CardTitle>
        <CardDescription>{endpoint.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {endpoint.headers && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Headers
            </h4>
            <CodeBlock 
              code={JSON.stringify(endpoint.headers, null, 2)} 
            />
          </div>
        )}
        
        {endpoint.requestBody && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Request Body
            </h4>
            <div className="space-y-2">
              {Object.entries(endpoint.requestBody.properties).map(([key, prop]) => (
                <div key={key} className="flex items-start gap-2 text-sm bg-muted/30 p-2 rounded">
                  <code className="text-primary font-mono">{key}</code>
                  <Badge variant="outline" className="text-xs">{prop.type}</Badge>
                  {prop.required && <Badge variant="destructive" className="text-xs">required</Badge>}
                  <span className="text-muted-foreground">{prop.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {endpoint.response && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Code className="h-4 w-4" />
              Response Example
            </h4>
            <CodeBlock 
              code={JSON.stringify(endpoint.response.example, null, 2)} 
            />
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium mb-2">cURL Example</h4>
          <CodeBlock 
            code={`curl -X ${endpoint.method} "${API_BASE_URL}${endpoint.path}" \\
  -H "Content-Type: application/json"${endpoint.auth ? ` \\
  -H "Authorization: Bearer YOUR_TOKEN"` : ""}${endpoint.requestBody ? ` \\
  -d '${JSON.stringify(
    Object.fromEntries(
      Object.entries(endpoint.requestBody.properties)
        .filter(([_, v]) => v.required)
        .map(([k, v]) => [k, v.type === "string" ? "value" : v.type === "number" ? 0 : null])
    ), null, 2
  ).replace(/\n/g, "\n  ")}'` : ""}`}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const ApiDocs = () => {
  const [activeSection, setActiveSection] = useState("leads");
  const navigate = useNavigate();

  return (
    <UnifiedSidebar>
    <div className="min-h-screen bg-background pt-16 lg:pt-0">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/admin-dashboard')}
              className="h-9 w-9"
            >
              <Home className="h-5 w-5" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              <span className="font-semibold">API Docs</span>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Globe className="h-3 w-3" />
            v1.0
          </Badge>
        </div>
      </header>

      <div className="container px-4 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">
                Endpoints
              </h3>
              <nav className="space-y-1">
                {apiSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                      activeSection === section.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {section.icon}
                    <span className="font-medium">{section.title}</span>
                    <ChevronRight className={cn(
                      "h-4 w-4 ml-auto transition-transform",
                      activeSection === section.id && "rotate-90"
                    )} />
                  </button>
                ))}
              </nav>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Base URL
                </h3>
                <CodeBlock code={API_BASE_URL} />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main>
            {/* Introduction */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4">Documentação da API Neofolic</h1>
              <p className="text-muted-foreground text-lg mb-6">
                Bem-vindo à documentação da API do sistema Neofolic. Aqui você encontrará 
                todos os endpoints disponíveis para integração com sistemas externos.
              </p>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <Key className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-base">Autenticação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Use Bearer Token no header Authorization para endpoints protegidos.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-emerald-500/5 border-emerald-500/20">
                  <CardHeader className="pb-2">
                    <Globe className="h-8 w-8 text-emerald-500 mb-2" />
                    <CardTitle className="text-base">REST API</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      API RESTful com respostas em JSON e suporte a CORS.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-amber-500/5 border-amber-500/20">
                  <CardHeader className="pb-2">
                    <Zap className="h-8 w-8 text-amber-500 mb-2" />
                    <CardTitle className="text-base">Rate Limiting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Limite de 100 requisições por minuto por IP.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="lg:hidden mb-6">
              <Tabs value={activeSection} onValueChange={setActiveSection}>
                <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
                  {apiSections.map((section) => (
                    <TabsTrigger 
                      key={section.id} 
                      value={section.id}
                      className="flex-1 min-w-[100px]"
                    >
                      {section.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* API Sections */}
            {apiSections.map((section) => (
              <div
                key={section.id}
                className={cn(
                  "space-y-6",
                  activeSection !== section.id && "hidden"
                )}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {section.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{section.title}</h2>
                    <p className="text-muted-foreground">{section.description}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {section.endpoints.map((endpoint, idx) => (
                    <EndpointCard key={idx} endpoint={endpoint} />
                  ))}
                </div>
              </div>
            ))}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-6 mt-12">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Neofolic. Documentação da API v1.0</p>
        </div>
      </footer>
    </div>
    </UnifiedSidebar>
  );
};

export default ApiDocs;
