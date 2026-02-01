# Flow.do - Plano de Arquitetura Completo
## Portal de Gestão Operacional do Ecossistema NeoHub

---

## 1. VISÃO GERAL

### 1.1 O que é o Flow.do?
O **Flow.do** é o 11º portal do ecossistema NeoHub, focado em **gestão operacional** (Work OS). Ele permite que clínicas/tenants organizem seus projetos, tarefas, fluxos de trabalho e automações.

### 1.2 Posicionamento no Ecossistema
```
NeoHub Ecosystem
├── Admin Portal        → Gestão central do sistema
├── NeoTeam Portal      → RH e Operações de Clínicas
├── NeoCare Portal      → Gestão de Pacientes
├── Academy Portal      → Cursos e Treinamentos
├── NeoLicense Portal   → Gestão de Licenciados
├── Avivar Portal       → Marketing e CRM
├── IPROMED Portal      → Jurídico e Compliance
├── Vision Portal       → Análise Capilar IA
├── NeoPay Portal       → Gestão Financeira
├── NeoHair Portal      → Tratamentos Capilares
└── Flow.do Portal (NEW)→ Work OS e Automações
```

### 1.3 Princípios de Design
1. **Integração Nativa**: Usa `UnifiedAuthContext`, guards e RBAC existentes
2. **Multi-tenancy via Clínicas**: Workspaces = Clínicas (tenants) do NeoHub
3. **Consistência Visual**: Segue design system com tokens semânticos
4. **Performance First**: React Query com SWR pattern para cache

---

## 2. MODELO DE DADOS (DATABASE SCHEMA)

### 2.1 Relacionamento com Estrutura Existente

```
┌─────────────────────────────────────────────────────────────┐
│                    TABELAS EXISTENTES                        │
├─────────────────────────────────────────────────────────────┤
│ neohub_users          → Identidade central dos usuários     │
│ neohub_user_profiles  → Perfis RBAC (1:N por usuário)       │
│ tenants               → Clínicas/empresas (multi-tenancy)   │
│ neoteam_branches      → Filiais das clínicas                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    NOVAS TABELAS FLOW.DO                     │
├─────────────────────────────────────────────────────────────┤
│ flow_projects         → Projetos vinculados a tenant        │
│ flow_project_members  → Membros com roles por projeto       │
│ flow_project_statuses → Status customizáveis (Kanban)       │
│ flow_tasks            → Tarefas com hierarquia              │
│ flow_task_tags        → Tags por tenant                     │
│ flow_task_comments    → Comentários em tarefas              │
│ flow_workflows        → Definições de automação             │
│ flow_workflow_runs    → Execuções de workflows              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Schema Detalhado das Tabelas

#### Tabela: `flow_projects`
```sql
CREATE TABLE public.flow_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.neohub_users(id),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#6366f1',
  is_archived BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_flow_projects_tenant ON flow_projects(tenant_id);
CREATE INDEX idx_flow_projects_creator ON flow_projects(creator_id);
```

#### Tabela: `flow_project_members`
```sql
CREATE TYPE flow_project_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

CREATE TABLE public.flow_project_members (
  project_id UUID NOT NULL REFERENCES public.flow_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.neohub_users(id) ON DELETE CASCADE,
  role flow_project_role NOT NULL DEFAULT 'editor',
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);
```

#### Tabela: `flow_project_statuses`
```sql
CREATE TABLE public.flow_project_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.flow_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  icon TEXT DEFAULT 'circle',
  position INTEGER NOT NULL DEFAULT 0,
  is_done_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_flow_statuses_project ON flow_project_statuses(project_id);
```

#### Tabela: `flow_tasks`
```sql
CREATE TYPE flow_task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE public.flow_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.flow_projects(id) ON DELETE CASCADE,
  status_id UUID REFERENCES public.flow_project_statuses(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES public.flow_tasks(id) ON DELETE CASCADE,
  
  -- Ownership
  creator_id UUID NOT NULL REFERENCES public.neohub_users(id),
  assignee_id UUID REFERENCES public.neohub_users(id),
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  priority flow_task_priority DEFAULT 'medium',
  
  -- Dates
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Ordering
  position INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  estimated_hours NUMERIC(6,2),
  actual_hours NUMERIC(6,2),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_flow_tasks_project ON flow_tasks(project_id);
CREATE INDEX idx_flow_tasks_status ON flow_tasks(status_id);
CREATE INDEX idx_flow_tasks_assignee ON flow_tasks(assignee_id);
CREATE INDEX idx_flow_tasks_parent ON flow_tasks(parent_task_id);
CREATE INDEX idx_flow_tasks_due_date ON flow_tasks(due_date);
```

#### Tabela: `flow_task_tags`
```sql
CREATE TABLE public.flow_task_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE public.flow_task_tag_links (
  task_id UUID NOT NULL REFERENCES public.flow_tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.flow_task_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);
```

#### Tabela: `flow_task_comments`
```sql
CREATE TABLE public.flow_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.flow_tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.neohub_users(id),
  content TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_flow_comments_task ON flow_task_comments(task_id);
```

#### Tabela: `flow_workflows` (Automações)
```sql
CREATE TYPE flow_workflow_trigger AS ENUM (
  'task_created',
  'task_updated',
  'task_completed',
  'task_overdue',
  'status_changed',
  'assignee_changed',
  'comment_added',
  'manual'
);

CREATE TABLE public.flow_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.flow_projects(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  trigger_type flow_workflow_trigger NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  
  -- Estrutura do fluxo (React Flow nodes/edges)
  flow_definition JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}',
  
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES public.neohub_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Tabela: `flow_workflow_runs`
```sql
CREATE TYPE flow_run_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

CREATE TABLE public.flow_workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.flow_workflows(id) ON DELETE CASCADE,
  triggered_by UUID REFERENCES public.neohub_users(id),
  trigger_data JSONB DEFAULT '{}',
  
  status flow_run_status DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  execution_log JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.3 Políticas RLS

```sql
-- =============================================
-- SECURITY DEFINER FUNCTIONS
-- =============================================

-- Verifica se usuário tem acesso ao tenant
CREATE OR REPLACE FUNCTION public.user_has_tenant_access(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profile_assignments upa
    WHERE upa.user_id = (SELECT id FROM neohub_users WHERE user_id = _user_id)
      AND upa.tenant_id = _tenant_id
      AND upa.is_active = true
  )
  OR public.is_neohub_admin(_user_id)
$$;

-- Verifica se usuário é membro do projeto
CREATE OR REPLACE FUNCTION public.user_is_project_member(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM flow_project_members fpm
    JOIN neohub_users nu ON nu.id = fpm.user_id
    WHERE nu.user_id = _user_id
      AND fpm.project_id = _project_id
  )
  OR public.is_neohub_admin(_user_id)
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- flow_projects
ALTER TABLE flow_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projects in their tenant"
  ON flow_projects FOR SELECT
  USING (public.user_has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Users can create projects in their tenant"
  ON flow_projects FOR INSERT
  WITH CHECK (public.user_has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Project members can update projects"
  ON flow_projects FOR UPDATE
  USING (public.user_is_project_member(auth.uid(), id));

-- flow_tasks
ALTER TABLE flow_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their projects"
  ON flow_tasks FOR SELECT
  USING (public.user_is_project_member(auth.uid(), project_id));

CREATE POLICY "Project members can create tasks"
  ON flow_tasks FOR INSERT
  WITH CHECK (public.user_is_project_member(auth.uid(), project_id));

CREATE POLICY "Project members can update tasks"
  ON flow_tasks FOR UPDATE
  USING (public.user_is_project_member(auth.uid(), project_id));

CREATE POLICY "Project members can delete tasks"
  ON flow_tasks FOR DELETE
  USING (public.user_is_project_member(auth.uid(), project_id));
```

---

## 3. ESTRUTURA FRONTEND

### 3.1 Estrutura de Diretórios

```
src/
├── pages/
│   └── flow/                           # Portal Flow.do
│       ├── FlowPortal.tsx              # Layout principal do portal
│       ├── FlowDashboard.tsx           # Dashboard inicial
│       ├── FlowProjects.tsx            # Lista de projetos
│       ├── FlowProjectDetail.tsx       # Página do projeto
│       ├── FlowMyTasks.tsx             # Minhas tarefas
│       ├── FlowCalendar.tsx            # Visualização calendário
│       ├── FlowWorkflows.tsx           # Gerenciador de automações
│       └── FlowSettings.tsx            # Configurações
│
├── components/
│   └── flow/                           # Componentes do Flow.do
│       ├── layout/
│       │   ├── FlowSidebar.tsx         # Sidebar do portal
│       │   └── FlowHeader.tsx          # Header com navegação
│       │
│       ├── projects/
│       │   ├── ProjectCard.tsx         # Card de projeto
│       │   ├── ProjectForm.tsx         # Formulário criar/editar
│       │   └── ProjectMembersDialog.tsx
│       │
│       ├── tasks/
│       │   ├── TaskCard.tsx            # Card de tarefa
│       │   ├── TaskDetailSheet.tsx     # Painel lateral detalhes
│       │   ├── TaskForm.tsx            # Formulário de tarefa
│       │   ├── TaskComments.tsx        # Seção de comentários
│       │   └── TaskSubtasks.tsx        # Lista de subtarefas
│       │
│       ├── views/
│       │   ├── ListView.tsx            # Visualização em tabela
│       │   ├── KanbanView.tsx          # Visualização Kanban
│       │   ├── CalendarView.tsx        # Visualização calendário
│       │   └── TimelineView.tsx        # Visualização timeline
│       │
│       └── workflows/
│           ├── WorkflowBuilder.tsx     # Editor visual (React Flow)
│           ├── WorkflowNode.tsx        # Nó customizado
│           └── WorkflowTriggerConfig.tsx
│
├── hooks/
│   └── flow/                           # Hooks do Flow.do
│       ├── useFlowProjects.ts          # CRUD projetos
│       ├── useFlowTasks.ts             # CRUD tarefas
│       ├── useFlowStatuses.ts          # CRUD status
│       ├── useFlowComments.ts          # CRUD comentários
│       ├── useFlowWorkflows.ts         # CRUD automações
│       └── useFlowDragDrop.ts          # Lógica Kanban DnD
│
└── types/
    └── flow.ts                         # Types do Flow.do
```

### 3.2 Rotas

```tsx
// Em App.tsx
<Route path="/flow" element={<PortalGuard portal="flow"><FlowPortal /></PortalGuard>}>
  <Route index element={<FlowDashboard />} />
  <Route path="projects" element={<FlowProjects />} />
  <Route path="projects/:projectId" element={<FlowProjectDetail />} />
  <Route path="my-tasks" element={<FlowMyTasks />} />
  <Route path="calendar" element={<FlowCalendar />} />
  <Route path="workflows" element={<FlowWorkflows />} />
  <Route path="workflows/:workflowId" element={<WorkflowBuilder />} />
  <Route path="settings" element={<FlowSettings />} />
</Route>
```

### 3.3 Perfil RBAC

Adicionar à tabela `neohub_module_permissions`:

| profile       | module_code    | module_name              | portal | can_read | can_write | can_delete |
|---------------|----------------|--------------------------|--------|----------|-----------|------------|
| administrador | flow_dashboard | Flow.do - Dashboard      | flow   | ✓        | ✓         | ✓          |
| administrador | flow_projects  | Flow.do - Projetos       | flow   | ✓        | ✓         | ✓          |
| administrador | flow_workflows | Flow.do - Automações     | flow   | ✓        | ✓         | ✓          |
| colaborador   | flow_dashboard | Flow.do - Dashboard      | flow   | ✓        | ✓         | ✗          |
| colaborador   | flow_projects  | Flow.do - Projetos       | flow   | ✓        | ✓         | ✗          |

---

## 4. ROADMAP DE IMPLEMENTAÇÃO

### FASE 1: MVP Core (Semana 1-2)
**Objetivo:** Ter o ciclo de vida de tarefas 100% funcional

#### Sprint 1.1: Infraestrutura
- [ ] Criar todas as tabelas do banco de dados
- [ ] Implementar RLS policies
- [ ] Adicionar perfil RBAC para Flow.do
- [ ] Criar rota /flow no App.tsx
- [ ] Criar FlowPortal layout base

#### Sprint 1.2: Projetos
- [ ] Implementar useFlowProjects hook
- [ ] Criar FlowProjects (lista de projetos)
- [ ] Criar ProjectForm (criar/editar)
- [ ] Criar ProjectCard component

#### Sprint 1.3: Tarefas - Lista
- [ ] Implementar useFlowTasks hook
- [ ] Criar ListView component (tabela)
- [ ] Criar TaskDetailSheet (painel lateral)
- [ ] Implementar comentários e subtarefas

#### Sprint 1.4: Tarefas - Kanban
- [ ] Implementar useFlowDragDrop hook
- [ ] Criar KanbanView com @dnd-kit
- [ ] Criar TaskCard (card arrastável)
- [ ] Implementar reordenação de status

### FASE 2: Views Avançadas (Semana 3-4)
**Objetivo:** Múltiplas formas de visualizar dados

#### Sprint 2.1: Calendário
- [ ] Criar CalendarView com react-day-picker
- [ ] Implementar drag de tarefas para datas
- [ ] Modal de criação rápida por clique

#### Sprint 2.2: Timeline
- [ ] Criar TimelineView (Gantt simplificado)
- [ ] Visualização de dependências
- [ ] Ajuste de datas por arrasto

#### Sprint 2.3: Minha Área
- [ ] Criar FlowMyTasks (tarefas do usuário)
- [ ] Filtros por projeto/status/prioridade
- [ ] Notificações de tarefas vencendo

### FASE 3: Automações (Semana 5-7)
**Objetivo:** Sistema de workflows visuais

#### Sprint 3.1: Receitas Simples
- [ ] Criar UI "Quando X → Então Y"
- [ ] Implementar triggers básicos
- [ ] Edge Function para executar ações

#### Sprint 3.2: Workflow Builder
- [ ] Integrar React Flow
- [ ] Criar nós customizados (Trigger, Action, Condition)
- [ ] Painel de configuração por nó

#### Sprint 3.3: Execução
- [ ] Edge Function de execução de workflows
- [ ] Log de execuções
- [ ] Dashboard de automações

### FASE 4: Relatórios (Semana 8)
**Objetivo:** Dashboards analíticos

- [ ] Dashboard de produtividade
- [ ] Gráficos com Recharts
- [ ] Métricas de projeto
- [ ] Time tracking

---

## 5. COMPONENTES VISUAIS

### 5.1 Layout do Portal

```
┌──────────────────────────────────────────────────────────────────┐
│  PortalBanner: Flow.do - Work OS                                 │
├──────────┬───────────────────────────────────────────────────────┤
│          │  Tabs: Lista | Quadro | Calendário | Timeline         │
│ SIDEBAR  ├───────────────────────────────────────────────────────┤
│          │                                                       │
│ 📊 Dash  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │
│ 📁 Proj  │  │ To Do  │ │ Doing  │ │ Review │ │  Done  │         │
│ ✅ Tasks │  ├────────┤ ├────────┤ ├────────┤ ├────────┤         │
│ 📅 Cal   │  │ Task 1 │ │ Task 3 │ │ Task 5 │ │ Task 7 │         │
│ ⚡ Auto  │  │ Task 2 │ │ Task 4 │ │        │ │ Task 8 │         │
│          │  │        │ │        │ │        │ │        │         │
├──────────┤  └────────┘ └────────┘ └────────┘ └────────┘         │
│ Projetos │                                                       │
│ ├─ Proj1 │                                                       │
│ ├─ Proj2 │                                                       │
│ └─ Proj3 │                                                       │
└──────────┴───────────────────────────────────────────────────────┘
```

### 5.2 TaskDetailSheet

```
┌────────────────────────────────────────────────┐
│  [×]  Título da Tarefa (editável)              │
├────────────────────────────────────────────────┤
│                                                │
│  Responsável: [Avatar + Nome ▼]                │
│  Status:      [🔵 Em Progresso ▼]              │
│  Prioridade:  [🔶 Alta ▼]                      │
│  Vencimento:  [📅 15/02/2026]                  │
│                                                │
├────────────────────────────────────────────────┤
│  Descrição                                     │
│  ┌──────────────────────────────────────────┐  │
│  │ Editor Rich Text                         │  │
│  │ - Suporta markdown                       │  │
│  │ - Checklists inline                      │  │
│  └──────────────────────────────────────────┘  │
│                                                │
├────────────────────────────────────────────────┤
│  Subtarefas (2/5)                              │
│  ☑ Subtarefa concluída                         │
│  ☑ Outra concluída                             │
│  ☐ Subtarefa pendente                          │
│  ☐ Mais uma pendente                           │
│  ☐ Última pendente                             │
│  [+ Adicionar subtarefa]                       │
│                                                │
├────────────────────────────────────────────────┤
│  Comentários                                   │
│  ┌──────────────────────────────────────────┐  │
│  │ 👤 João - há 2h                          │  │
│  │ Preciso de mais informações sobre...     │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ Digite um comentário...                  │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

---

## 6. INTEGRAÇÕES COM OUTROS PORTAIS

### 6.1 Com NeoTeam
- Tarefas podem ser atribuídas a colaboradores do NeoTeam
- Relatórios de produtividade por filial

### 6.2 Com NeoCare
- Criar tarefas automaticamente quando paciente é cadastrado
- Workflow: "Quando cirurgia é agendada → Criar checklist pré-op"

### 6.3 Com Avivar
- Workflow: "Quando lead converte → Criar tarefa de onboarding"
- Integração com cadências de follow-up

### 6.4 Com Academy
- Tarefas de conclusão de cursos
- Lembretes de certificações vencendo

---

## 7. EDGE FUNCTIONS

### 7.1 Lista de Funções

| Função                    | Trigger          | Descrição                           |
|---------------------------|------------------|-------------------------------------|
| flow-execute-workflow     | Webhook/Cron     | Executa workflow definido           |
| flow-send-notification    | Workflow Action  | Envia email/push sobre tarefas      |
| flow-task-overdue-check   | Cron (diário)    | Verifica tarefas vencidas           |
| flow-recurring-tasks      | Cron             | Cria tarefas recorrentes            |

---

## 8. CHECKLIST DE IMPLEMENTAÇÃO

### Antes de Começar
- [ ] Ler NeoHub Architecture Guide completo
- [ ] Entender UnifiedAuthContext e guards
- [ ] Verificar tokens semânticos em index.css
- [ ] Revisar padrões React Query existentes

### Durante Implementação
- [ ] Usar `user.authUserId` para RLS (não `user.id`)
- [ ] Aplicar guards em todas as rotas
- [ ] Usar React Query para todo estado do servidor
- [ ] Componentes em arquivos pequenos e focados
- [ ] Nunca editar arquivos auto-gerados

### Antes de Entregar
- [ ] Testar RLS com diferentes perfis
- [ ] Verificar responsividade mobile
- [ ] Validar dark mode
- [ ] Documentar no Architecture Guide

---

## 9. DEPENDÊNCIAS ADICIONAIS

```bash
# Já instaladas no projeto
@dnd-kit/core        # Drag and drop (Kanban)
@dnd-kit/sortable    # Ordenação
react-day-picker     # Calendário
recharts             # Gráficos

# A instalar
npm install @xyflow/react    # Antigo react-flow (Workflow Builder)
```

---

**Documento atualizado em:** 01/02/2026
**Autor:** NeoHub Architecture Team
**Versão:** 1.0.0
