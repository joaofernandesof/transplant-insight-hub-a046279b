// ====================================
// Menu Configuration - Fonte Única de Verdade
// ====================================
// Todos os menus do sistema devem derivar deste arquivo

import { LucideIcon } from 'lucide-react';
import {
  Home,
  LayoutDashboard,
  BarChart3,
  PieChart,
  Trophy,
  CalendarDays,
  Building2,
  GraduationCap,
  Award,
  FileCheck,
  BookOpen,
  Megaphone,
  ShoppingBag,
  Handshake,
  Briefcase,
  DollarSign,
  CreditCard,
  Flame,
  MessageCircle,
  Wrench,
  TrendingUp,
  Activity,
  Users,
  Gift,
  Store,
  Crown,
  Settings,
  GitCompare,
  Shield,
  Heart,
  Calendar,
  FileText,
  Video,
  HelpCircle,
  Clock,
  Folder,
  Megaphone as MegaphoneIcon,
  BarChart2,
  ClipboardList,
  Images,
  Stethoscope,
  HeadphonesIcon,
  ListTodo,
  Bot,
  UserCog,
  Scale,
  Gavel,
  Kanban,
  Sparkles,
  FileBarChart,
} from 'lucide-react';

// Tipos base
export type PermissionAction = 'read' | 'write' | 'delete';

export interface ModulePermission {
  moduleCode: string;
  action: PermissionAction;
}

export interface MenuItem {
  id: string;
  code: string; // Código único para permissões
  title: string;
  icon: LucideIcon;
  route: string;
  category?: string;
  requiredPermissions?: ModulePermission[];
  requiredProfiles?: string[];
  adminOnly?: boolean;
  isDivider?: boolean;
  children?: MenuItem[];
}

export interface MenuCategory {
  id: string;
  title: string;
  icon?: LucideIcon;
  collapsible?: boolean;
  defaultOpen?: boolean;
  items: MenuItem[];
}

// ====================================
// MÓDULOS DO SISTEMA PRINCIPAL (Admin/Licenciado)
// ====================================

export const MAIN_MENU_ITEMS: MenuItem[] = [
  // Início - apenas para não-admins
  { 
    id: 'home', 
    code: 'home', 
    title: 'Início', 
    icon: Home, 
    route: '/',
    // Admins não veem "Início" pois o Dashboard Admin é a home deles
    requiredProfiles: ['licenciado', 'aluno', 'paciente', 'colaborador', 'cliente_avivar'],
  },
  
  // Admin Dashboard - é a home do admin (renomeado para "Início")
  { 
    id: 'admin-dashboard', 
    code: 'admin_dashboard', 
    title: 'Início', 
    icon: Home, 
    route: '/admin-dashboard',
    adminOnly: true,
    requiredProfiles: ['administrador'],
  },
  
  // Marketplace
  { id: 'marketplace', code: 'marketplace', title: 'Marketplace', icon: Store, route: '/marketplace' },
];

export const ADMIN_MENU_ITEMS: MenuItem[] = [
  { id: 'licensees', code: 'licensees_panel', title: 'Gerenciar Alunos', icon: Users, route: '/alunos', adminOnly: true },
  { id: 'monitoring', code: 'user_monitoring', title: 'Monitoramento de Usuários', icon: Crown, route: '/monitoring', adminOnly: true },
  { id: 'event-logs', code: 'event_logs', title: 'Log de Eventos', icon: Activity, route: '/admin/event-logs', adminOnly: true },
  { id: 'system-metrics', code: 'system_metrics', title: 'Métricas do Sistema', icon: TrendingUp, route: '/system-metrics', adminOnly: true },
  { id: 'system-sentinel', code: 'system_sentinel', title: 'System Sentinel', icon: Activity, route: '/admin/sentinel', adminOnly: true },
  { id: 'code-assistant', code: 'code_assistant', title: 'Assistente de Código', icon: Bot, route: '/admin/code-assistant', adminOnly: true },
  { id: 'admin-panel', code: 'admin_panel', title: 'Configurações do Sistema', icon: Settings, route: '/admin', adminOnly: true },
  { id: 'access-matrix', code: 'access_matrix', title: 'Matriz de Acessos', icon: Shield, route: '/access-matrix', adminOnly: true },
  { id: 'comparison', code: 'clinic_comparison', title: 'Comparar Clínicas', icon: GitCompare, route: '/comparison', adminOnly: true },
  { id: 'weekly-reports', code: 'weekly_reports', title: 'Relatórios Semanais', icon: FileCheck, route: '/weekly-reports', adminOnly: true },
];

export const DATA_MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', code: 'dashboard', title: 'Dashboard de Métricas', icon: BarChart3, route: '/dashboard' },
  { id: 'consolidated', code: 'consolidated', title: 'Resultados Consolidados', icon: PieChart, route: '/consolidated-results' },
  { id: 'achievements', code: 'achievements', title: 'Conquistas', icon: Trophy, route: '/achievements' },
  { id: 'surgery-schedule', code: 'surgery_schedule', title: 'Agenda de Cirurgias', icon: CalendarDays, route: '/surgery-schedule' },
  { id: 'sala-tecnica', code: 'sala_tecnica', title: 'Agenda do Licenciado', icon: Building2, route: '/sala-tecnica' },
];

export const TRAINING_MENU_ITEMS: MenuItem[] = [
  { id: 'university', code: 'university', title: 'Academia ByNeofolic', icon: GraduationCap, route: '/university' },
  { id: 'certificates', code: 'certificates', title: 'Certificados', icon: Award, route: '/certificates' },
  { id: 'regularization', code: 'regularization', title: 'Regularização da Clínica', icon: FileCheck, route: '/regularization' },
];

export const RESOURCES_MENU_ITEMS: MenuItem[] = [
  { id: 'materials', code: 'materials', title: 'Central de Materiais', icon: BookOpen, route: '/materials' },
  { id: 'marketing', code: 'marketing', title: 'Central de Marketing', icon: Megaphone, route: '/marketing' },
  { id: 'store', code: 'store', title: 'Loja Neo-Spa', icon: ShoppingBag, route: '/store' },
  { id: 'partners', code: 'partners', title: 'Vitrine de Parceiros', icon: Handshake, route: '/partners' },
];

export const MANAGEMENT_MENU_ITEMS: MenuItem[] = [
  { id: 'estrutura-neo', code: 'estrutura_neo', title: 'Estrutura NEO', icon: Briefcase, route: '/estrutura-neo' },
  { id: 'financial', code: 'financial', title: 'Gestão Financeira', icon: DollarSign, route: '/financial' },
  { id: 'license-payments', code: 'license_payments', title: 'Financeiro Licença', icon: CreditCard, route: '/license-payments' },
  { id: 'hotleads', code: 'hotleads', title: 'HotLeads', icon: Flame, route: '/hotleads' },
];

export const SUPPORT_MENU_ITEMS: MenuItem[] = [
  { id: 'mentorship', code: 'mentorship', title: 'Mentoria & Suporte', icon: MessageCircle, route: '/mentorship' },
  { id: 'systems', code: 'systems', title: 'Sistemas & Ferramentas', icon: Wrench, route: '/systems' },
  { id: 'career', code: 'career', title: 'Plano de Carreira', icon: TrendingUp, route: '/career' },
  { id: 'community', code: 'community', title: 'Comunidade', icon: Users, route: '/community' },
  { id: 'referral', code: 'referral', title: 'Indique e Ganhe', icon: Gift, route: '/indique-e-ganhe' },
];

// Menu completo organizado por categorias
export const MAIN_MENU_CATEGORIES: MenuCategory[] = [
  { id: 'main', title: '', items: MAIN_MENU_ITEMS },
  { id: 'admin', title: 'Gestão', items: ADMIN_MENU_ITEMS },
  { id: 'data', title: 'Dados & Indicadores', items: DATA_MENU_ITEMS },
  { id: 'training', title: 'Formação', items: TRAINING_MENU_ITEMS },
  { id: 'resources', title: 'Recursos', items: RESOURCES_MENU_ITEMS },
  { id: 'management', title: 'Gestão', items: MANAGEMENT_MENU_ITEMS },
  { id: 'support', title: 'Suporte & Comunidade', items: SUPPORT_MENU_ITEMS },
];

// ====================================
// MÓDULOS POR PORTAL (NeoHub)
// ====================================

export const NEOCARE_MENU_ITEMS: MenuItem[] = [
  { id: 'neocare_home', code: 'neocare_home', title: 'Início', icon: Home, route: '/neocare' },
  { id: 'neocare_appointments', code: 'neocare_appointments', title: 'Meus Agendamentos', icon: Calendar, route: '/neocare/appointments' },
  { id: 'neocare_history', code: 'neocare_history', title: 'Histórico Clínico', icon: FileText, route: '/neocare/my-records' },
  { id: 'neocare_payments', code: 'neocare_payments', title: 'Pagamentos', icon: CreditCard, route: '/neocare/my-invoices' },
  { id: 'neocare_teleconsultation', code: 'neocare_teleconsultation', title: 'Teleconsulta', icon: Video, route: '/neocare/teleconsultation' },
  { id: 'neocare_support', code: 'neocare_support', title: 'Suporte', icon: HelpCircle, route: '/neocare/support' },
  { id: 'neocare_reports', code: 'neocare_reports', title: 'Relatórios', icon: FileBarChart, route: '/neocare/reports' },
  { id: 'neocare_settings', code: 'neocare_settings', title: 'Configurações', icon: Settings, route: '/neocare/settings' },
];

export const NEOTEAM_MENU_ITEMS: MenuItem[] = [
  { id: 'neoteam_home', code: 'neoteam_home', title: 'Início', icon: Home, route: '/neoteam' },
  { id: 'neoteam_schedule', code: 'neoteam_schedule', title: 'Agenda', icon: Calendar, route: '/neoteam/schedule' },
  { id: 'neoteam_waiting_room', code: 'neoteam_waiting_room', title: 'Sala de Espera', icon: Clock, route: '/neoteam/waiting-room' },
  { id: 'neoteam_patients', code: 'neoteam_patients', title: 'Pacientes', icon: Users, route: '/neoteam/patients' },
  { id: 'neoteam_medical_records', code: 'neoteam_medical_records', title: 'Prontuários', icon: FileText, route: '/neoteam/medical-records' },
  { id: 'neoteam_documents', code: 'neoteam_documents', title: 'Documentos', icon: Folder, route: '/neoteam/documents' },
  { id: 'neoteam_tasks', code: 'neoteam_tasks', title: 'Tarefas', icon: ListTodo, route: '/neoteam/tasks' },
  { id: 'neoteam_doctor_view', code: 'neoteam_doctor_view', title: 'Visão do Médico', icon: Stethoscope, route: '/neoteam/doctor-view', requiredProfiles: ['medico', 'administrador'] },
  { id: 'neoteam_event_organization', code: 'neoteam_event_organization', title: 'Gestão de Eventos', icon: ClipboardList, route: '/neoteam/events', adminOnly: true },
  { id: 'neoteam_galleries', code: 'neoteam_galleries', title: 'Galerias de Fotos', icon: Images, route: '/neoteam/galleries', adminOnly: true },
  { id: 'neoteam_after_sales', code: 'neoteam_after_sales', title: 'Pós-Venda', icon: HeadphonesIcon, route: '/neoteam/postvenda' },
  { id: 'neoteam_staff', code: 'neoteam_staff', title: 'Equipe', icon: UserCog, route: '/neoteam/staff', adminOnly: true },
  { id: 'neoteam_reports', code: 'neoteam_reports', title: 'Relatórios', icon: FileBarChart, route: '/neoteam/reports' },
  { id: 'neoteam_settings', code: 'neoteam_settings', title: 'Configurações', icon: Settings, route: '/neoteam/settings' },
];

// Menu NeoTeam organizado por categorias colapsáveis
export const NEOTEAM_MENU_CATEGORIES: MenuCategory[] = [
  {
    id: 'neoteam_main',
    title: '',
    items: [
      { id: 'neoteam_home', code: 'neoteam_home', title: 'Início', icon: Home, route: '/neoteam' },
    ],
  },
  {
    id: 'neoteam_clinical',
    title: 'Clínico',
    icon: Stethoscope,
    collapsible: true,
    defaultOpen: true,
    items: [
      { id: 'neoteam_schedule', code: 'neoteam_schedule', title: 'Agenda', icon: Calendar, route: '/neoteam/schedule' },
      { id: 'neoteam_waiting_room', code: 'neoteam_waiting_room', title: 'Sala de Espera', icon: Clock, route: '/neoteam/waiting-room' },
      { id: 'neoteam_patients', code: 'neoteam_patients', title: 'Pacientes', icon: Users, route: '/neoteam/patients' },
      { id: 'neoteam_medical_records', code: 'neoteam_medical_records', title: 'Prontuários', icon: FileText, route: '/neoteam/medical-records' },
      { id: 'neoteam_doctor_view', code: 'neoteam_doctor_view', title: 'Visão do Médico', icon: Stethoscope, route: '/neoteam/doctor-view', requiredProfiles: ['medico', 'administrador'] },
    ],
  },
  {
    id: 'neoteam_operations',
    title: 'Operações',
    icon: ClipboardList,
    collapsible: true,
    defaultOpen: true,
    items: [
      { id: 'neoteam_tasks', code: 'neoteam_tasks', title: 'Tarefas', icon: ListTodo, route: '/neoteam/tasks' },
      { id: 'neoteam_documents', code: 'neoteam_documents', title: 'Documentos', icon: Folder, route: '/neoteam/documents' },
      { id: 'neoteam_after_sales', code: 'neoteam_after_sales', title: 'Pós-Venda', icon: HeadphonesIcon, route: '/neoteam/postvenda' },
      { id: 'neoteam_cleaning', code: 'neoteam_cleaning', title: 'Limpeza', icon: Sparkles, route: '/neoteam/limpeza' },
    ],
  },
  {
    id: 'neoteam_education',
    title: 'Educação',
    icon: GraduationCap,
    collapsible: true,
    defaultOpen: true,
    items: [
      { id: 'neoteam_event_organization', code: 'neoteam_event_organization', title: 'Gestão de Eventos', icon: ClipboardList, route: '/neoteam/events', adminOnly: true },
      { id: 'neoteam_galleries', code: 'neoteam_galleries', title: 'Galerias de Fotos', icon: Images, route: '/neoteam/galleries', adminOnly: true },
      { id: 'neoteam_legal_dashboard', code: 'neoteam_legal_dashboard', title: 'Dashboard Jurídico', icon: Scale, route: '/neoteam/legal-dashboard', adminOnly: true },
    ],
  },
  {
    id: 'neoteam_admin',
    title: 'Administração',
    icon: Settings,
    collapsible: true,
    defaultOpen: false,
    items: [
      { id: 'neoteam_staff', code: 'neoteam_staff', title: 'Equipe', icon: UserCog, route: '/neoteam/staff', adminOnly: true },
      { id: 'neoteam_reports_cat', code: 'neoteam_reports', title: 'Relatórios', icon: FileBarChart, route: '/neoteam/reports' },
      { id: 'neoteam_settings_cat', code: 'neoteam_settings', title: 'Configurações', icon: Settings, route: '/neoteam/settings' },
    ],
  },
];

export const ACADEMY_MENU_ITEMS: MenuItem[] = [
  { id: 'academy_home', code: 'academy_home', title: 'Início', icon: Home, route: '/academy' },
  { id: 'academy_courses', code: 'academy_courses', title: 'Cursos', icon: BookOpen, route: '/academy/courses' },
  { id: 'academy_schedule', code: 'academy_schedule', title: 'Agenda do Aluno', icon: CalendarDays, route: '/academy/schedule' },
  // TEMPORARIAMENTE OCULTO: { id: 'academy_materials', code: 'academy_materials', title: 'Materiais', icon: FileText, route: '/academy/materials' },
  { id: 'academy_certificates', code: 'academy_certificates', title: 'Certificados', icon: Award, route: '/academy/certificates' },
  { id: 'academy_community', code: 'academy_community', title: 'Comunidade', icon: Users, route: '/academy/community' },
  { id: 'academy_career', code: 'academy_career', title: 'Carreira', icon: TrendingUp, route: '/academy/career' },
  { id: 'academy_referral', code: 'academy_referral', title: 'Indique e Ganhe', icon: Gift, route: '/academy/referral' },
  { id: 'academy_reports', code: 'academy_reports', title: 'Relatórios', icon: FileBarChart, route: '/academy/reports' },
  { id: 'academy_settings', code: 'academy_settings', title: 'Configurações', icon: Settings, route: '/academy/profile' },
];

export const NEOLICENSE_MENU_ITEMS: MenuItem[] = [
  { id: 'neolicense_home', code: 'neolicense_home', title: 'Início', icon: Home, route: '/neolicense' },
  { id: 'neolicense_dashboard', code: 'neolicense_dashboard', title: 'Dashboard', icon: BarChart3, route: '/neolicense/dashboard' },
  { id: 'neolicense_hotleads', code: 'neolicense_hotleads', title: 'HotLeads', icon: Flame, route: '/neolicense/hotleads' },
  { id: 'neolicense_surgery', code: 'neolicense_surgery', title: 'Cirurgias', icon: Calendar, route: '/neolicense/surgery' },
  { id: 'neolicense_university', code: 'neolicense_university', title: 'Universidade', icon: GraduationCap, route: '/neolicense/university' },
  { id: 'neolicense_materials', code: 'neolicense_materials', title: 'Materiais', icon: FileText, route: '/neolicense/materials' },
  { id: 'neolicense_partners', code: 'neolicense_partners', title: 'Parceiros', icon: Handshake, route: '/neolicense/partners' },
  { id: 'neolicense_achievements', code: 'neolicense_achievements', title: 'Conquistas', icon: Trophy, route: '/neolicense/achievements' },
  { id: 'neolicense_referral', code: 'neolicense_referral', title: 'Indicações', icon: Users, route: '/neolicense/referral' },
  { id: 'neolicense_structure', code: 'neolicense_structure', title: 'Regularização', icon: Building2, route: '/neolicense/structure' },
  { id: 'neolicense_reports', code: 'neolicense_reports', title: 'Relatórios', icon: FileBarChart, route: '/neolicense/reports' },
  { id: 'neolicense_profile', code: 'neolicense_profile', title: 'Perfil', icon: Settings, route: '/neolicense/profile' },
];

export const AVIVAR_MENU_ITEMS: MenuItem[] = [
  { id: 'avivar_home', code: 'avivar_home', title: 'Dashboard', icon: BarChart3, route: '/avivar' },
  { id: 'avivar_pipeline', code: 'avivar_pipeline', title: 'Pipeline', icon: Kanban, route: '/avivar/pipeline' },
  { id: 'avivar_inbox', code: 'avivar_inbox', title: 'Caixa de Entrada', icon: MessageCircle, route: '/avivar/inbox' },
  { id: 'avivar_tasks', code: 'avivar_tasks', title: 'Tarefas', icon: ListTodo, route: '/avivar/tasks' },
  { id: 'avivar_leads', code: 'avivar_leads', title: 'Leads', icon: Users, route: '/avivar/leads' },
  { id: 'avivar_analytics', code: 'avivar_analytics', title: 'Analytics', icon: BarChart2, route: '/avivar/analytics' },
  { id: 'avivar_hotleads', code: 'avivar_hotleads', title: 'HotLeads', icon: Flame, route: '/avivar/hotleads' },
  { id: 'avivar_traffic', code: 'avivar_traffic', title: 'Tráfego', icon: TrendingUp, route: '/avivar/traffic' },
  { id: 'avivar_marketing', code: 'avivar_marketing', title: 'Marketing', icon: Megaphone, route: '/avivar/marketing' },
  { id: 'avivar_tutorials', code: 'avivar_tutorials', title: 'Tutoriais', icon: Users, route: '/avivar/tutorials' },
  { id: 'avivar_reports', code: 'avivar_reports', title: 'Relatórios', icon: FileBarChart, route: '/avivar/reports' },
  { id: 'avivar_settings', code: 'avivar_settings', title: 'Configurações', icon: Settings, route: '/avivar/settings' },
];

// HotLeads dedicated portal menu
export const HOTLEADS_MENU_ITEMS: MenuItem[] = [
  { id: 'hotleads_home', code: 'hotleads_home', title: 'HotLeads', icon: Flame, route: '/neolicense/hotleads' },
];

// Mapeamento de portal para menu flat (compatibilidade)
export const PORTAL_MENUS: Record<string, MenuItem[]> = {
  neocare: NEOCARE_MENU_ITEMS,
  neoteam: NEOTEAM_MENU_ITEMS,
  academy: ACADEMY_MENU_ITEMS,
  neolicense: NEOLICENSE_MENU_ITEMS,
  avivar: AVIVAR_MENU_ITEMS,
  hotleads: HOTLEADS_MENU_ITEMS,
};

// Mapeamento de portal para menu em categorias
export const PORTAL_MENU_CATEGORIES: Record<string, MenuCategory[]> = {
  neoteam: NEOTEAM_MENU_CATEGORIES,
};

// ====================================
// FUNÇÕES UTILITÁRIAS
// ====================================

/**
 * Filtra itens de menu baseado nas permissões do usuário
 */
export function filterMenuByPermissions(
  items: MenuItem[],
  hasPermission: (moduleCode: string, action?: PermissionAction) => boolean,
  isAdmin: boolean = false
): MenuItem[] {
  return items.filter(item => {
    // Admin vê tudo
    if (isAdmin) return true;
    
    // Se é adminOnly e não é admin, esconder
    if (item.adminOnly && !isAdmin) return false;
    
    // Se tem permissões requeridas, verificar
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      return item.requiredPermissions.every(perm => 
        hasPermission(perm.moduleCode, perm.action)
      );
    }
    
    // Se não tem restrições, mostrar
    return true;
  });
}

/**
 * Retorna todos os códigos de módulos do sistema
 */
export function getAllModuleCodes(): string[] {
  const allItems = [
    ...MAIN_MENU_ITEMS,
    ...ADMIN_MENU_ITEMS,
    ...DATA_MENU_ITEMS,
    ...TRAINING_MENU_ITEMS,
    ...RESOURCES_MENU_ITEMS,
    ...MANAGEMENT_MENU_ITEMS,
    ...SUPPORT_MENU_ITEMS,
    ...NEOCARE_MENU_ITEMS,
    ...NEOTEAM_MENU_ITEMS,
    ...ACADEMY_MENU_ITEMS,
    ...NEOLICENSE_MENU_ITEMS,
    ...AVIVAR_MENU_ITEMS,
  ];
  
  return [...new Set(allItems.map(item => item.code))];
}

/**
 * Busca um item de menu pelo código
 */
export function findMenuItemByCode(code: string): MenuItem | undefined {
  const allItems = [
    ...MAIN_MENU_ITEMS,
    ...ADMIN_MENU_ITEMS,
    ...DATA_MENU_ITEMS,
    ...TRAINING_MENU_ITEMS,
    ...RESOURCES_MENU_ITEMS,
    ...MANAGEMENT_MENU_ITEMS,
    ...SUPPORT_MENU_ITEMS,
    ...NEOCARE_MENU_ITEMS,
    ...NEOTEAM_MENU_ITEMS,
    ...ACADEMY_MENU_ITEMS,
    ...NEOLICENSE_MENU_ITEMS,
    ...AVIVAR_MENU_ITEMS,
  ];
  
  return allItems.find(item => item.code === code);
}

/**
 * Busca um item de menu pela rota
 */
export function findMenuItemByRoute(route: string): MenuItem | undefined {
  const allItems = [
    ...MAIN_MENU_ITEMS,
    ...ADMIN_MENU_ITEMS,
    ...DATA_MENU_ITEMS,
    ...TRAINING_MENU_ITEMS,
    ...RESOURCES_MENU_ITEMS,
    ...MANAGEMENT_MENU_ITEMS,
    ...SUPPORT_MENU_ITEMS,
    ...NEOCARE_MENU_ITEMS,
    ...NEOTEAM_MENU_ITEMS,
    ...ACADEMY_MENU_ITEMS,
    ...NEOLICENSE_MENU_ITEMS,
    ...AVIVAR_MENU_ITEMS,
  ];
  
  return allItems.find(item => item.route === route);
}
