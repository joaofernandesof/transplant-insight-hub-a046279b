-- =============================================
-- FLOW.DO - PORTAL DE GESTÃO OPERACIONAL
-- Fase 1: Schema completo
-- =============================================

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE flow_project_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
CREATE TYPE flow_task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
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
CREATE TYPE flow_run_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

-- =============================================
-- TABELA: flow_projects
-- =============================================

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

CREATE INDEX idx_flow_projects_tenant ON flow_projects(tenant_id);
CREATE INDEX idx_flow_projects_creator ON flow_projects(creator_id);

-- =============================================
-- TABELA: flow_project_members
-- =============================================

CREATE TABLE public.flow_project_members (
  project_id UUID NOT NULL REFERENCES public.flow_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.neohub_users(id) ON DELETE CASCADE,
  role flow_project_role NOT NULL DEFAULT 'editor',
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

-- =============================================
-- TABELA: flow_project_statuses
-- =============================================

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

CREATE INDEX idx_flow_statuses_project ON flow_project_statuses(project_id);

-- =============================================
-- TABELA: flow_tasks
-- =============================================

CREATE TABLE public.flow_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.flow_projects(id) ON DELETE CASCADE,
  status_id UUID REFERENCES public.flow_project_statuses(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES public.flow_tasks(id) ON DELETE CASCADE,
  
  creator_id UUID NOT NULL REFERENCES public.neohub_users(id),
  assignee_id UUID REFERENCES public.neohub_users(id),
  
  title TEXT NOT NULL,
  description TEXT,
  priority flow_task_priority DEFAULT 'medium',
  
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  
  position INTEGER NOT NULL DEFAULT 0,
  
  estimated_hours NUMERIC(6,2),
  actual_hours NUMERIC(6,2),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_flow_tasks_project ON flow_tasks(project_id);
CREATE INDEX idx_flow_tasks_status ON flow_tasks(status_id);
CREATE INDEX idx_flow_tasks_assignee ON flow_tasks(assignee_id);
CREATE INDEX idx_flow_tasks_parent ON flow_tasks(parent_task_id);
CREATE INDEX idx_flow_tasks_due_date ON flow_tasks(due_date);

-- =============================================
-- TABELA: flow_task_tags
-- =============================================

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

-- =============================================
-- TABELA: flow_task_comments
-- =============================================

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

-- =============================================
-- TABELA: flow_workflows (Automações)
-- =============================================

CREATE TABLE public.flow_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.flow_projects(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  trigger_type flow_workflow_trigger NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  
  flow_definition JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}',
  
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES public.neohub_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABELA: flow_workflow_runs
-- =============================================

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

-- =============================================
-- SECURITY DEFINER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.user_has_flow_tenant_access(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profile_assignments upa
    JOIN neohub_users nu ON nu.id = upa.user_id
    WHERE nu.user_id = _user_id
      AND upa.tenant_id = _tenant_id
      AND upa.is_active = true
  )
  OR public.is_neohub_admin(_user_id)
$$;

CREATE OR REPLACE FUNCTION public.user_is_flow_project_member(_user_id UUID, _project_id UUID)
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
  OR EXISTS (
    SELECT 1 FROM flow_projects fp
    WHERE fp.id = _project_id
      AND public.user_has_flow_tenant_access(_user_id, fp.tenant_id)
  )
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- flow_projects
ALTER TABLE flow_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projects in their tenant"
  ON flow_projects FOR SELECT
  USING (public.user_has_flow_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Users can create projects in their tenant"
  ON flow_projects FOR INSERT
  WITH CHECK (public.user_has_flow_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Users can update projects in their tenant"
  ON flow_projects FOR UPDATE
  USING (public.user_has_flow_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Users can delete projects in their tenant"
  ON flow_projects FOR DELETE
  USING (public.user_has_flow_tenant_access(auth.uid(), tenant_id));

-- flow_project_members
ALTER TABLE flow_project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project members"
  ON flow_project_members FOR SELECT
  USING (public.user_is_flow_project_member(auth.uid(), project_id));

CREATE POLICY "Users can manage project members"
  ON flow_project_members FOR ALL
  USING (public.user_is_flow_project_member(auth.uid(), project_id));

-- flow_project_statuses
ALTER TABLE flow_project_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view statuses in their projects"
  ON flow_project_statuses FOR SELECT
  USING (public.user_is_flow_project_member(auth.uid(), project_id));

CREATE POLICY "Users can manage statuses in their projects"
  ON flow_project_statuses FOR ALL
  USING (public.user_is_flow_project_member(auth.uid(), project_id));

-- flow_tasks
ALTER TABLE flow_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their projects"
  ON flow_tasks FOR SELECT
  USING (public.user_is_flow_project_member(auth.uid(), project_id));

CREATE POLICY "Users can create tasks in their projects"
  ON flow_tasks FOR INSERT
  WITH CHECK (public.user_is_flow_project_member(auth.uid(), project_id));

CREATE POLICY "Users can update tasks in their projects"
  ON flow_tasks FOR UPDATE
  USING (public.user_is_flow_project_member(auth.uid(), project_id));

CREATE POLICY "Users can delete tasks in their projects"
  ON flow_tasks FOR DELETE
  USING (public.user_is_flow_project_member(auth.uid(), project_id));

-- flow_task_tags
ALTER TABLE flow_task_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags in their tenant"
  ON flow_task_tags FOR SELECT
  USING (public.user_has_flow_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Users can manage tags in their tenant"
  ON flow_task_tags FOR ALL
  USING (public.user_has_flow_tenant_access(auth.uid(), tenant_id));

-- flow_task_tag_links
ALTER TABLE flow_task_tag_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tag links"
  ON flow_task_tag_links FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM flow_tasks t
    WHERE t.id = task_id
      AND public.user_is_flow_project_member(auth.uid(), t.project_id)
  ));

CREATE POLICY "Users can manage tag links"
  ON flow_task_tag_links FOR ALL
  USING (EXISTS (
    SELECT 1 FROM flow_tasks t
    WHERE t.id = task_id
      AND public.user_is_flow_project_member(auth.uid(), t.project_id)
  ));

-- flow_task_comments
ALTER TABLE flow_task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments in their tasks"
  ON flow_task_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM flow_tasks t
    WHERE t.id = task_id
      AND public.user_is_flow_project_member(auth.uid(), t.project_id)
  ));

CREATE POLICY "Users can create comments"
  ON flow_task_comments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM flow_tasks t
    WHERE t.id = task_id
      AND public.user_is_flow_project_member(auth.uid(), t.project_id)
  ));

CREATE POLICY "Users can update own comments"
  ON flow_task_comments FOR UPDATE
  USING (author_id = (SELECT id FROM neohub_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own comments"
  ON flow_task_comments FOR DELETE
  USING (author_id = (SELECT id FROM neohub_users WHERE user_id = auth.uid()));

-- flow_workflows
ALTER TABLE flow_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workflows in their tenant"
  ON flow_workflows FOR SELECT
  USING (public.user_has_flow_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Users can manage workflows in their tenant"
  ON flow_workflows FOR ALL
  USING (public.user_has_flow_tenant_access(auth.uid(), tenant_id));

-- flow_workflow_runs
ALTER TABLE flow_workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view runs of their workflows"
  ON flow_workflow_runs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM flow_workflows w
    WHERE w.id = workflow_id
      AND public.user_has_flow_tenant_access(auth.uid(), w.tenant_id)
  ));

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_flow_projects_updated_at
  BEFORE UPDATE ON flow_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flow_tasks_updated_at
  BEFORE UPDATE ON flow_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flow_workflows_updated_at
  BEFORE UPDATE ON flow_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flow_comments_updated_at
  BEFORE UPDATE ON flow_task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTION: Criar status padrão ao criar projeto
-- =============================================

CREATE OR REPLACE FUNCTION public.create_default_flow_statuses()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO flow_project_statuses (project_id, name, color, icon, position, is_done_status) VALUES
    (NEW.id, 'Backlog', '#6b7280', 'inbox', 0, FALSE),
    (NEW.id, 'A Fazer', '#3b82f6', 'circle', 1, FALSE),
    (NEW.id, 'Em Progresso', '#f59e0b', 'loader', 2, FALSE),
    (NEW.id, 'Concluído', '#10b981', 'check-circle', 3, TRUE);
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_default_statuses_on_project
  AFTER INSERT ON flow_projects
  FOR EACH ROW
  EXECUTE FUNCTION create_default_flow_statuses();

-- =============================================
-- FUNCTION: Adicionar criador como owner do projeto
-- =============================================

CREATE OR REPLACE FUNCTION public.add_project_creator_as_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO flow_project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.creator_id, 'owner')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER add_creator_as_owner_on_project
  AFTER INSERT ON flow_projects
  FOR EACH ROW
  EXECUTE FUNCTION add_project_creator_as_owner();