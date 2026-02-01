/**
 * Flow.do - Types e Interfaces
 * Portal de Gestão Operacional
 */

// =============================================
// ENUMS (matching database)
// =============================================

export type FlowProjectRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type FlowTaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type FlowWorkflowTrigger = 
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_overdue'
  | 'status_changed'
  | 'assignee_changed'
  | 'comment_added'
  | 'manual';
export type FlowRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// =============================================
// INTERFACES
// =============================================

export interface FlowProject {
  id: string;
  tenant_id: string;
  creator_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  is_archived: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  creator?: FlowUser;
  members?: FlowProjectMember[];
  statuses?: FlowProjectStatus[];
  task_count?: number;
}

export interface FlowProjectMember {
  project_id: string;
  user_id: string;
  role: FlowProjectRole;
  joined_at: string;
  // Joined
  user?: FlowUser;
}

export interface FlowProjectStatus {
  id: string;
  project_id: string;
  name: string;
  color: string;
  icon: string;
  position: number;
  is_done_status: boolean;
  created_at: string;
  // Computed
  task_count?: number;
}

export interface FlowTask {
  id: string;
  project_id: string;
  status_id: string | null;
  parent_task_id: string | null;
  creator_id: string;
  assignee_id: string | null;
  title: string;
  description: string | null;
  priority: FlowTaskPriority;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  position: number;
  estimated_hours: number | null;
  actual_hours: number | null;
  created_at: string;
  updated_at: string;
  // Joined
  creator?: FlowUser;
  assignee?: FlowUser;
  status?: FlowProjectStatus;
  project?: FlowProject;
  subtasks?: FlowTask[];
  comments?: FlowTaskComment[];
  tags?: FlowTaskTag[];
}

export interface FlowTaskTag {
  id: string;
  tenant_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface FlowTaskComment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  mentions: string[];
  created_at: string;
  updated_at: string;
  // Joined
  author?: FlowUser;
}

export interface FlowWorkflow {
  id: string;
  tenant_id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  trigger_type: FlowWorkflowTrigger;
  trigger_conditions: Record<string, unknown>;
  flow_definition: {
    nodes: unknown[];
    edges: unknown[];
  };
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FlowWorkflowRun {
  id: string;
  workflow_id: string;
  triggered_by: string | null;
  trigger_data: Record<string, unknown>;
  status: FlowRunStatus;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  execution_log: unknown[];
  created_at: string;
}

// Helper type for user display
export interface FlowUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

// =============================================
// FORM TYPES
// =============================================

export interface CreateProjectForm {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface CreateTaskForm {
  title: string;
  description?: string;
  priority?: FlowTaskPriority;
  assignee_id?: string;
  status_id?: string;
  due_date?: string;
  parent_task_id?: string;
}

export interface UpdateTaskForm extends Partial<CreateTaskForm> {
  id: string;
}

// =============================================
// VIEW TYPES
// =============================================

export type FlowViewType = 'list' | 'kanban' | 'calendar' | 'timeline';

export interface FlowFilters {
  status_id?: string;
  assignee_id?: string;
  priority?: FlowTaskPriority;
  search?: string;
  show_completed?: boolean;
}

// =============================================
// KANBAN SPECIFIC
// =============================================

export interface KanbanColumn {
  status: FlowProjectStatus;
  tasks: FlowTask[];
}

export interface DragEndResult {
  taskId: string;
  newStatusId: string;
  newPosition: number;
}
