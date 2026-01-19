import { useState } from "react";
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
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoWhite from "@/assets/logo-byneofolic-white.png";
import logo from "@/assets/logo-byneofolic.png";

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Neofolic" className="h-8 dark:hidden" />
            <img src={logoWhite} alt="Neofolic" className="h-8 hidden dark:block" />
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
  );
};

export default ApiDocs;
