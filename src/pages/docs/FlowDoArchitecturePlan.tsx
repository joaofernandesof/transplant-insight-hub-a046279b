import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  Database, 
  FolderTree, 
  Shield, 
  Zap, 
  Calendar,
  LayoutDashboard,
  Kanban,
  ListTodo,
  GitBranch,
  Users,
  Settings,
  CheckCircle2,
  Clock,
  ArrowRight,
  Workflow,
  Table,
  Code,
  FileText,
  Layers,
  Target
} from 'lucide-react';
import jsPDF from 'jspdf';

// ============================================
// DATA DEFINITIONS - SINGLE SOURCE OF TRUTH
// ============================================

const PHASES = [
  {
    id: 'fase1',
    name: 'Fase 1: MVP Core',
    duration: 'Semana 1-2',
    objective: 'Ter o ciclo de vida de tarefas 100% funcional',
    color: 'bg-blue-500',
    sprints: [
      {
        name: 'Sprint 1.1: Infraestrutura',
        tasks: [
          'Criar todas as tabelas do banco de dados',
          'Implementar RLS policies',
          'Adicionar perfil RBAC para Flow.do',
          'Criar rota /flow no App.tsx',
          'Criar FlowPortal layout base'
        ]
      },
      {
        name: 'Sprint 1.2: Projetos',
        tasks: [
          'Implementar useFlowProjects hook',
          'Criar FlowProjects (lista de projetos)',
          'Criar ProjectForm (criar/editar)',
          'Criar ProjectCard component'
        ]
      },
      {
        name: 'Sprint 1.3: Tarefas - Lista',
        tasks: [
          'Implementar useFlowTasks hook',
          'Criar ListView component (tabela)',
          'Criar TaskDetailSheet (painel lateral)',
          'Implementar comentários e subtarefas'
        ]
      },
      {
        name: 'Sprint 1.4: Tarefas - Kanban',
        tasks: [
          'Implementar useFlowDragDrop hook',
          'Criar KanbanView com @dnd-kit',
          'Criar TaskCard (card arrastável)',
          'Implementar reordenação de status'
        ]
      }
    ]
  },
  {
    id: 'fase2',
    name: 'Fase 2: Views Avançadas',
    duration: 'Semana 3-4',
    objective: 'Múltiplas formas de visualizar dados',
    color: 'bg-green-500',
    sprints: [
      {
        name: 'Sprint 2.1: Calendário',
        tasks: [
          'Criar CalendarView com react-day-picker',
          'Implementar drag de tarefas para datas',
          'Modal de criação rápida por clique'
        ]
      },
      {
        name: 'Sprint 2.2: Timeline',
        tasks: [
          'Criar TimelineView (Gantt simplificado)',
          'Visualização de dependências',
          'Ajuste de datas por arrasto'
        ]
      },
      {
        name: 'Sprint 2.3: Minha Área',
        tasks: [
          'Criar FlowMyTasks (tarefas do usuário)',
          'Filtros por projeto/status/prioridade',
          'Notificações de tarefas vencendo'
        ]
      }
    ]
  },
  {
    id: 'fase3',
    name: 'Fase 3: Automações',
    duration: 'Semana 5-7',
    objective: 'Sistema de workflows visuais',
    color: 'bg-purple-500',
    sprints: [
      {
        name: 'Sprint 3.1: Receitas Simples',
        tasks: [
          'Criar UI "Quando X → Então Y"',
          'Implementar triggers básicos',
          'Edge Function para executar ações'
        ]
      },
      {
        name: 'Sprint 3.2: Workflow Builder',
        tasks: [
          'Integrar React Flow',
          'Criar nós customizados (Trigger, Action, Condition)',
          'Painel de configuração por nó'
        ]
      },
      {
        name: 'Sprint 3.3: Execução',
        tasks: [
          'Edge Function de execução de workflows',
          'Log de execuções',
          'Dashboard de automações'
        ]
      }
    ]
  },
  {
    id: 'fase4',
    name: 'Fase 4: Relatórios',
    duration: 'Semana 8',
    objective: 'Dashboards analíticos',
    color: 'bg-orange-500',
    sprints: [
      {
        name: 'Sprint 4.1: Analytics',
        tasks: [
          'Dashboard de produtividade',
          'Gráficos com Recharts',
          'Métricas de projeto',
          'Time tracking'
        ]
      }
    ]
  }
];

const DATABASE_TABLES = [
  {
    name: 'flow_projects',
    description: 'Projetos vinculados a um tenant (clínica)',
    columns: [
      { name: 'id', type: 'UUID', pk: true },
      { name: 'tenant_id', type: 'UUID FK', required: true },
      { name: 'creator_id', type: 'UUID FK', required: true },
      { name: 'name', type: 'TEXT', required: true },
      { name: 'description', type: 'TEXT' },
      { name: 'icon', type: 'TEXT', default: 'folder' },
      { name: 'color', type: 'TEXT', default: '#6366f1' },
      { name: 'is_archived', type: 'BOOLEAN', default: 'false' },
      { name: 'settings', type: 'JSONB', default: '{}' }
    ]
  },
  {
    name: 'flow_project_members',
    description: 'Membros do projeto com roles específicas',
    columns: [
      { name: 'project_id', type: 'UUID FK', pk: true },
      { name: 'user_id', type: 'UUID FK', pk: true },
      { name: 'role', type: 'ENUM', values: ['owner', 'admin', 'editor', 'viewer'] }
    ]
  },
  {
    name: 'flow_project_statuses',
    description: 'Status customizáveis por projeto (colunas do Kanban)',
    columns: [
      { name: 'id', type: 'UUID', pk: true },
      { name: 'project_id', type: 'UUID FK', required: true },
      { name: 'name', type: 'TEXT', required: true },
      { name: 'color', type: 'TEXT' },
      { name: 'position', type: 'INTEGER' },
      { name: 'is_done_status', type: 'BOOLEAN' }
    ]
  },
  {
    name: 'flow_tasks',
    description: 'Tarefas com suporte a hierarquia (subtarefas)',
    columns: [
      { name: 'id', type: 'UUID', pk: true },
      { name: 'project_id', type: 'UUID FK', required: true },
      { name: 'status_id', type: 'UUID FK' },
      { name: 'parent_task_id', type: 'UUID FK (self)' },
      { name: 'creator_id', type: 'UUID FK', required: true },
      { name: 'assignee_id', type: 'UUID FK' },
      { name: 'title', type: 'TEXT', required: true },
      { name: 'description', type: 'TEXT' },
      { name: 'priority', type: 'ENUM', values: ['low', 'medium', 'high', 'urgent'] },
      { name: 'due_date', type: 'DATE' },
      { name: 'position', type: 'INTEGER' }
    ]
  },
  {
    name: 'flow_task_tags',
    description: 'Tags compartilhadas por tenant',
    columns: [
      { name: 'id', type: 'UUID', pk: true },
      { name: 'tenant_id', type: 'UUID FK', required: true },
      { name: 'name', type: 'TEXT', required: true },
      { name: 'color', type: 'TEXT' }
    ]
  },
  {
    name: 'flow_task_comments',
    description: 'Comentários em tarefas',
    columns: [
      { name: 'id', type: 'UUID', pk: true },
      { name: 'task_id', type: 'UUID FK', required: true },
      { name: 'author_id', type: 'UUID FK', required: true },
      { name: 'content', type: 'TEXT', required: true },
      { name: 'mentions', type: 'UUID[]' }
    ]
  },
  {
    name: 'flow_workflows',
    description: 'Definições de automação (trigger + flow)',
    columns: [
      { name: 'id', type: 'UUID', pk: true },
      { name: 'tenant_id', type: 'UUID FK', required: true },
      { name: 'project_id', type: 'UUID FK' },
      { name: 'name', type: 'TEXT', required: true },
      { name: 'trigger_type', type: 'ENUM', values: ['task_created', 'task_completed', 'status_changed', 'manual'] },
      { name: 'flow_definition', type: 'JSONB (React Flow)' },
      { name: 'is_active', type: 'BOOLEAN' }
    ]
  }
];

const FOLDER_STRUCTURE = `src/
├── pages/
│   └── flow/                         # Portal Flow.do
│       ├── FlowPortal.tsx            # Layout principal
│       ├── FlowDashboard.tsx         # Dashboard inicial
│       ├── FlowProjects.tsx          # Lista de projetos
│       ├── FlowProjectDetail.tsx     # Página do projeto
│       ├── FlowMyTasks.tsx           # Minhas tarefas
│       ├── FlowCalendar.tsx          # Visualização calendário
│       ├── FlowWorkflows.tsx         # Gerenciador automações
│       └── FlowSettings.tsx          # Configurações
│
├── components/
│   └── flow/                         # Componentes Flow.do
│       ├── layout/
│       │   ├── FlowSidebar.tsx
│       │   └── FlowHeader.tsx
│       ├── projects/
│       │   ├── ProjectCard.tsx
│       │   └── ProjectForm.tsx
│       ├── tasks/
│       │   ├── TaskCard.tsx
│       │   ├── TaskDetailSheet.tsx
│       │   └── TaskComments.tsx
│       ├── views/
│       │   ├── ListView.tsx
│       │   ├── KanbanView.tsx
│       │   └── CalendarView.tsx
│       └── workflows/
│           ├── WorkflowBuilder.tsx
│           └── WorkflowNode.tsx
│
├── hooks/
│   └── flow/
│       ├── useFlowProjects.ts
│       ├── useFlowTasks.ts
│       ├── useFlowStatuses.ts
│       └── useFlowWorkflows.ts
│
└── types/
    └── flow.ts`;

const INTEGRATIONS = [
  { portal: 'NeoTeam', icon: Users, color: 'text-blue-500', integrations: ['Atribuir tarefas a colaboradores', 'Relatórios por filial'] },
  { portal: 'NeoCare', icon: Users, color: 'text-green-500', integrations: ['Criar tarefa quando paciente cadastrado', 'Checklist pré-op automático'] },
  { portal: 'Avivar', icon: Zap, color: 'text-purple-500', integrations: ['Tarefa de onboarding em conversão', 'Integrar cadências de follow-up'] },
  { portal: 'Academy', icon: FileText, color: 'text-orange-500', integrations: ['Tarefas de conclusão de cursos', 'Lembretes de certificações'] }
];

// ============================================
// COMPONENT
// ============================================

export default function FlowDoArchitecturePlan() {
  const [activeTab, setActiveTab] = useState('overview');
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());

  const toggleTask = (taskId: string) => {
    const newChecked = new Set(checkedTasks);
    if (newChecked.has(taskId)) {
      newChecked.delete(taskId);
    } else {
      newChecked.add(taskId);
    }
    setCheckedTasks(newChecked);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let yPos = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width - margin * 2;
    const lineHeight = 7;

    const addText = (text: string, fontSize = 12, isBold = false, color = '#000000') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(color);
      const lines = doc.splitTextToSize(text, pageWidth);
      lines.forEach((line: string) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, margin, yPos);
        yPos += lineHeight;
      });
    };

    const addSection = (title: string) => {
      yPos += 5;
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      addText(title, 14, true, '#6366f1');
      yPos += 3;
    };

    // Title
    addText('FLOW.DO - PLANO DE ARQUITETURA COMPLETO', 18, true, '#6366f1');
    addText('Portal de Gestão Operacional do Ecossistema NeoHub', 12, false, '#666666');
    yPos += 10;

    // Section 1: Overview
    addSection('1. VISÃO GERAL');
    addText('Flow.do é o 11º portal do ecossistema NeoHub, focado em gestão operacional (Work OS).');
    addText('• Integração: Usa UnifiedAuthContext, guards e RBAC existentes');
    addText('• Multi-tenancy: Workspaces = Clínicas (tenants) do NeoHub');
    addText('• Stack: React + TypeScript + Supabase + TailwindCSS + shadcn/ui');
    yPos += 5;

    // Section 2: Database
    addSection('2. MODELO DE DADOS');
    DATABASE_TABLES.forEach(table => {
      addText(`• ${table.name}: ${table.description}`, 11, true);
      table.columns.slice(0, 5).forEach(col => {
        addText(`   - ${col.name}: ${col.type}${col.required ? ' (NOT NULL)' : ''}`, 10);
      });
      if (table.columns.length > 5) {
        addText(`   ... e mais ${table.columns.length - 5} colunas`, 10, false, '#666666');
      }
    });
    yPos += 5;

    // Section 3: RLS
    addSection('3. POLÍTICAS RLS');
    addText('• flow_projects: Usuário vê projetos do seu tenant');
    addText('• flow_tasks: Usuário vê tarefas dos projetos que é membro');
    addText('• Usa SECURITY DEFINER functions para evitar recursão');
    addText('• Admin bypass via is_neohub_admin()');
    yPos += 5;

    // Section 4: Folder Structure
    addSection('4. ESTRUTURA DE DIRETÓRIOS');
    FOLDER_STRUCTURE.split('\n').forEach(line => {
      addText(line, 9);
    });
    yPos += 5;

    // Section 5: Roadmap
    addSection('5. ROADMAP DE IMPLEMENTAÇÃO');
    PHASES.forEach(phase => {
      addText(`${phase.name} (${phase.duration})`, 12, true);
      addText(`Objetivo: ${phase.objective}`, 10, false, '#666666');
      phase.sprints.forEach(sprint => {
        addText(`  ${sprint.name}`, 11, true);
        sprint.tasks.forEach(task => {
          addText(`    • ${task}`, 10);
        });
      });
      yPos += 3;
    });

    // Section 6: Routes
    addSection('6. ROTAS');
    addText('/flow                    → FlowDashboard');
    addText('/flow/projects           → FlowProjects');
    addText('/flow/projects/:id       → FlowProjectDetail');
    addText('/flow/my-tasks           → FlowMyTasks');
    addText('/flow/calendar           → FlowCalendar');
    addText('/flow/workflows          → FlowWorkflows');
    addText('/flow/workflows/:id      → WorkflowBuilder');
    yPos += 5;

    // Section 7: Integrations
    addSection('7. INTEGRAÇÕES COM OUTROS PORTAIS');
    INTEGRATIONS.forEach(int => {
      addText(`${int.portal}:`, 11, true);
      int.integrations.forEach(i => {
        addText(`  • ${i}`, 10);
      });
    });
    yPos += 5;

    // Section 8: Edge Functions
    addSection('8. EDGE FUNCTIONS');
    addText('• flow-execute-workflow: Executa workflow definido');
    addText('• flow-send-notification: Envia email/push sobre tarefas');
    addText('• flow-task-overdue-check: Verifica tarefas vencidas (Cron)');
    addText('• flow-recurring-tasks: Cria tarefas recorrentes');
    yPos += 5;

    // Section 9: Checklist
    addSection('9. CHECKLIST DE IMPLEMENTAÇÃO');
    addText('ANTES DE COMEÇAR:', 11, true);
    addText('• Ler NeoHub Architecture Guide completo');
    addText('• Entender UnifiedAuthContext e guards');
    addText('• Verificar tokens semânticos em index.css');
    yPos += 3;
    addText('DURANTE IMPLEMENTAÇÃO:', 11, true);
    addText('• Usar user.authUserId para RLS (não user.id)');
    addText('• Aplicar guards em todas as rotas');
    addText('• Usar React Query para todo estado do servidor');
    yPos += 3;
    addText('NUNCA EDITAR:', 11, true, '#dc2626');
    addText('• src/integrations/supabase/client.ts');
    addText('• src/integrations/supabase/types.ts');
    addText('• supabase/config.toml');
    addText('• .env');

    // Save
    doc.save('flow-do-architecture-plan.pdf');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Workflow className="h-8 w-8" />
                Flow.do - Plano de Arquitetura
              </h1>
              <p className="text-indigo-100 mt-2">
                11º Portal do Ecossistema NeoHub | Work OS & Automações
              </p>
            </div>
            <Button onClick={generatePDF} variant="secondary" className="gap-2">
              <Download className="h-4 w-4" />
              Baixar PDF Completo
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <Target className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="database" className="gap-2">
              <Database className="h-4 w-4" />
              Banco de Dados
            </TabsTrigger>
            <TabsTrigger value="structure" className="gap-2">
              <FolderTree className="h-4 w-4" />
              Estrutura
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="gap-2">
              <Calendar className="h-4 w-4" />
              Roadmap
            </TabsTrigger>
            <TabsTrigger value="ui" className="gap-2">
              <Layers className="h-4 w-4" />
              UI/UX
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <GitBranch className="h-4 w-4" />
              Integrações
            </TabsTrigger>
          </TabsList>

          {/* Tab: Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-indigo-500" />
                    O que é o Flow.do?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    O Flow.do é o <strong>11º portal</strong> do ecossistema NeoHub, focado em 
                    <strong> gestão operacional</strong> (Work OS). Permite que clínicas organizem 
                    projetos, tarefas, fluxos de trabalho e automações.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Integração nativa com UnifiedAuthContext</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Multi-tenancy via Clínicas existentes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Guards e RBAC do ecossistema</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Design system com tokens semânticos</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-blue-500" />
                    Stack Tecnológica
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'React + TypeScript', desc: 'Frontend' },
                      { name: 'Supabase', desc: 'Backend & DB' },
                      { name: 'TailwindCSS', desc: 'Estilização' },
                      { name: 'shadcn/ui', desc: 'Componentes' },
                      { name: 'React Query', desc: 'Estado servidor' },
                      { name: 'React Router', desc: 'Roteamento' },
                      { name: '@dnd-kit', desc: 'Drag & Drop' },
                      { name: 'React Flow', desc: 'Workflows' }
                    ].map(tech => (
                      <div key={tech.name} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <Badge variant="secondary">{tech.desc}</Badge>
                        <span className="text-sm">{tech.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-purple-500" />
                    Módulos Principais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { icon: Kanban, name: 'Quadro Kanban', desc: 'Visualização drag & drop' },
                      { icon: ListTodo, name: 'Lista de Tarefas', desc: 'Tabela com filtros' },
                      { icon: Calendar, name: 'Calendário', desc: 'Tarefas por data' },
                      { icon: GitBranch, name: 'Timeline', desc: 'Gantt simplificado' },
                      { icon: Zap, name: 'Automações', desc: 'Quando → Então' },
                      { icon: Workflow, name: 'Workflows', desc: 'Editor visual BPMN' },
                      { icon: Users, name: 'Colaboração', desc: 'Comentários e menções' },
                      { icon: Settings, name: 'Configurações', desc: 'Status e tags' }
                    ].map(mod => (
                      <div key={mod.name} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <mod.icon className="h-5 w-5 text-indigo-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{mod.name}</p>
                          <p className="text-xs text-muted-foreground">{mod.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Database */}
          <TabsContent value="database">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-500" />
                    Schema do Banco de Dados
                  </CardTitle>
                  <CardDescription>
                    Novas tabelas que serão criadas (prefixo: flow_)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {DATABASE_TABLES.map(table => (
                      <Card key={table.name} className="border-l-4 border-l-indigo-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-mono">{table.name}</CardTitle>
                          <CardDescription className="text-xs">{table.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            {table.columns.map(col => (
                              <div key={col.name} className="flex items-center gap-2 text-xs">
                                {col.pk && <Badge variant="default" className="text-[10px] h-4">PK</Badge>}
                                {col.required && !col.pk && <Badge variant="destructive" className="text-[10px] h-4">REQ</Badge>}
                                <code className="text-muted-foreground">{col.name}</code>
                                <span className="text-muted-foreground/60">→</span>
                                <span>{col.type}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-500" />
                    Políticas RLS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Security Definer Functions</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• user_has_tenant_access(_user_id, _tenant_id)</li>
                        <li>• user_is_project_member(_user_id, _project_id)</li>
                        <li>• Evita recursão infinita em policies</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Regras de Acesso</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Projetos: visíveis por tenant</li>
                        <li>• Tarefas: visíveis por membership</li>
                        <li>• Admin bypass via is_neohub_admin()</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Structure */}
          <TabsContent value="structure">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderTree className="h-5 w-5 text-amber-500" />
                    Estrutura de Diretórios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <pre className="text-xs font-mono bg-muted p-4 rounded-lg whitespace-pre">
                      {FOLDER_STRUCTURE}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Table className="h-5 w-5 text-blue-500" />
                    Rotas do Portal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { path: '/flow', component: 'FlowDashboard', desc: 'Dashboard principal' },
                      { path: '/flow/projects', component: 'FlowProjects', desc: 'Lista de projetos' },
                      { path: '/flow/projects/:id', component: 'FlowProjectDetail', desc: 'Detalhes do projeto' },
                      { path: '/flow/my-tasks', component: 'FlowMyTasks', desc: 'Tarefas do usuário' },
                      { path: '/flow/calendar', component: 'FlowCalendar', desc: 'Visualização calendário' },
                      { path: '/flow/workflows', component: 'FlowWorkflows', desc: 'Lista de automações' },
                      { path: '/flow/workflows/:id', component: 'WorkflowBuilder', desc: 'Editor visual' },
                      { path: '/flow/settings', component: 'FlowSettings', desc: 'Configurações' }
                    ].map(route => (
                      <div key={route.path} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <code className="text-indigo-600">{route.path}</code>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-xs">{route.component}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Roadmap */}
          <TabsContent value="roadmap">
            <div className="space-y-6">
              {PHASES.map(phase => (
                <Card key={phase.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${phase.color}`} />
                        <CardTitle>{phase.name}</CardTitle>
                        <Badge variant="outline">{phase.duration}</Badge>
                      </div>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardDescription>{phase.objective}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {phase.sprints.map(sprint => (
                        <div key={sprint.name} className="p-4 border rounded-lg">
                          <h4 className="font-medium text-sm mb-3">{sprint.name}</h4>
                          <div className="space-y-2">
                            {sprint.tasks.map((task, idx) => {
                              const taskId = `${phase.id}-${sprint.name}-${idx}`;
                              return (
                                <div key={idx} className="flex items-start gap-2">
                                  <Checkbox 
                                    id={taskId}
                                    checked={checkedTasks.has(taskId)}
                                    onCheckedChange={() => toggleTask(taskId)}
                                  />
                                  <label 
                                    htmlFor={taskId} 
                                    className={`text-sm cursor-pointer ${checkedTasks.has(taskId) ? 'line-through text-muted-foreground' : ''}`}
                                  >
                                    {task}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab: UI/UX */}
          <TabsContent value="ui">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Layout do Portal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-indigo-600 text-white p-2 text-xs font-medium">
                      PortalBanner: Flow.do - Work OS
                    </div>
                    <div className="flex">
                      <div className="w-48 bg-muted p-3 border-r min-h-[300px]">
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 p-2 bg-indigo-100 text-indigo-700 rounded">
                            <LayoutDashboard className="h-3 w-3" />
                            Dashboard
                          </div>
                          <div className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                            <Kanban className="h-3 w-3" />
                            Projetos
                          </div>
                          <div className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                            <ListTodo className="h-3 w-3" />
                            Minhas Tarefas
                          </div>
                          <div className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                            <Calendar className="h-3 w-3" />
                            Calendário
                          </div>
                          <div className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                            <Zap className="h-3 w-3" />
                            Automações
                          </div>
                          <div className="border-t my-2" />
                          <p className="text-muted-foreground px-2">Projetos</p>
                          <div className="px-2 space-y-1">
                            <div className="text-xs">📁 Projeto 1</div>
                            <div className="text-xs">📁 Projeto 2</div>
                            <div className="text-xs">📁 Projeto 3</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex gap-2 mb-4 text-xs">
                          <Badge>Lista</Badge>
                          <Badge variant="outline">Quadro</Badge>
                          <Badge variant="outline">Calendário</Badge>
                        </div>
                        <div className="flex gap-3">
                          {['To Do', 'Doing', 'Done'].map(col => (
                            <div key={col} className="flex-1 bg-muted/50 p-2 rounded min-h-[150px]">
                              <p className="text-xs font-medium mb-2">{col}</p>
                              <div className="space-y-1">
                                <div className="bg-white border p-2 rounded text-xs shadow-sm">Task 1</div>
                                <div className="bg-white border p-2 rounded text-xs shadow-sm">Task 2</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>TaskDetailSheet</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Título da Tarefa</h3>
                      <span className="text-muted-foreground text-xs">×</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Responsável:</span>
                        <Badge variant="secondary">João</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className="bg-blue-500">Em Progresso</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Prioridade:</span>
                        <Badge variant="destructive">Alta</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Vencimento:</span>
                        <span>15/02/2026</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                      <div className="bg-muted p-2 rounded text-xs min-h-[60px]">
                        Editor Rich Text com suporte a markdown...
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Subtarefas (2/3)</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <Checkbox checked disabled />
                          <span className="line-through">Subtarefa 1</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox checked disabled />
                          <span className="line-through">Subtarefa 2</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox disabled />
                          <span>Subtarefa 3</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Integrations */}
          <TabsContent value="integrations">
            <div className="grid grid-cols-2 gap-6">
              {INTEGRATIONS.map(int => (
                <Card key={int.portal}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <int.icon className={`h-5 w-5 ${int.color}`} />
                      Integração com {int.portal}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {int.integrations.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}

              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Edge Functions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { name: 'flow-execute-workflow', trigger: 'Webhook/Cron', desc: 'Executa workflow definido' },
                      { name: 'flow-send-notification', trigger: 'Workflow Action', desc: 'Envia email/push' },
                      { name: 'flow-task-overdue-check', trigger: 'Cron (diário)', desc: 'Verifica vencidas' },
                      { name: 'flow-recurring-tasks', trigger: 'Cron', desc: 'Cria recorrentes' }
                    ].map(fn => (
                      <div key={fn.name} className="p-3 border rounded-lg">
                        <code className="text-xs text-indigo-600">{fn.name}</code>
                        <Badge variant="outline" className="ml-2 text-[10px]">{fn.trigger}</Badge>
                        <p className="text-xs text-muted-foreground mt-2">{fn.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
