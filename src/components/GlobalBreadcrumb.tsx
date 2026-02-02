import { useLocation, Link, useParams } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Mapeamento completo de rotas para labels em português
const routeLabels: Record<string, string> = {
  // ====================================
  // NeoTeam (Portal do Colaborador)
  // ====================================
  '/neoteam': 'Início',
  '/neoteam/schedule': 'Agenda',
  '/neoteam/waiting-room': 'Sala de Espera',
  '/neoteam/waiting-room/reports': 'Relatórios',
  '/neoteam/doctor-view': 'Visão do Médico',
  '/neoteam/tasks': 'Tarefas',
  '/neoteam/patients': 'Pacientes',
  '/neoteam/medical-records': 'Prontuários',
  '/neoteam/documents': 'Documentos',
  '/neoteam/staff-roles': 'Cargos & Funções',
  '/neoteam/settings': 'Configurações',
  '/neoteam/postvenda': 'Pós-Venda',
  '/neoteam/postvenda/chamados': 'Chamados',
  '/neoteam/postvenda/sla': 'Configuração SLA',
  '/neoteam/postvenda/nps': 'Relatórios NPS',
  
  // ====================================
  // NeoCare (Portal do Paciente)
  // ====================================
  '/neocare': 'Início',
  '/neocare/appointments': 'Meus Agendamentos',
  '/neocare/appointments/new': 'Novo Agendamento',
  '/neocare/my-records': 'Meus Documentos',
  '/neocare/documents': 'Documentos',
  '/neocare/orientations': 'Orientações',
  '/neocare/settings': 'Configurações',
  '/neocare/news': 'Notícias',
  '/neocare/my-invoices': 'Minhas Faturas',
  
  // ====================================
  // Academy (Portal do Aluno - IBRAMEC)
  // ====================================
  '/academy': 'Início',
  '/academy/courses': 'Cursos',
  '/academy/materials': 'Materiais',
  '/academy/certificates': 'Certificados',
  '/academy/profile': 'Meu Perfil',
  
  // ====================================
  // NeoLicense (Portal do Licenciado)
  // ====================================
  '/neolicense': 'Início',
  '/neolicense/dashboard': 'Dashboard',
  '/neolicense/university': 'Universidade',
  '/neolicense/materials': 'Materiais',
  '/neolicense/partners': 'Parceiros',
  '/neolicense/surgery': 'Cirurgias',
  '/neolicense/achievements': 'Conquistas',
  '/neolicense/referral': 'Indique e Ganhe',
  '/neolicense/structure': 'Estrutura NEO',
  '/neolicense/profile': 'Meu Perfil',
  '/neolicense/hotleads': 'HotLeads',
  '/neolicense/career': 'Carreira',
  '/neolicense/community': 'Comunidade',
  
  // ====================================
  // Avivar (Portal Cliente Avivar)
  // ====================================
  '/avivar': 'Início',
  '/avivar/dashboard': 'Dashboard',
  '/avivar/hotleads': 'HotLeads',
  '/avivar/traffic': 'Tráfego',
  '/avivar/marketing': 'Marketing',
  '/avivar/tutorials': 'Tutoriais',
  '/avivar/profile': 'Meu Perfil',
  
  // ====================================
  // Admin (Portal Administrativo)
  // ====================================
  '/admin-dashboard': 'Dashboard',
  '/admin-home': 'Início',
  '/alunos': 'Alunos IBRAMEC',
  '/monitoring': 'Monitoramento',
  '/system-metrics': 'Métricas do Sistema',
  '/admin/sentinel': 'System Sentinel',
  '/admin/event-logs': 'Log de Eventos',
  '/weekly-reports': 'Relatórios Semanais',
  '/comparison': 'Comparar Clínicas',
  '/access-matrix': 'Matriz de Acessos',
  '/admin': 'Painel Admin',
  '/admin/sales-urgency': 'Promoção Cirurgia Center',
  
  // ====================================
  // Módulos Compartilhados
  // ====================================
  '/dashboard': 'Dashboard de Métricas',
  '/home': 'Início',
  '/university': 'Universidade',
  '/university/exams': 'Provas',
  '/university/exams/admin': 'Gerenciar Provas',
  '/materials': 'Materiais',
  '/marketing': 'Marketing',
  '/store': 'Loja',
  '/financial': 'Financeiro',
  '/mentorship': 'Mentoria',
  '/systems': 'Sistemas',
  '/career': 'Carreira',
  '/hotleads': 'HotLeads',
  '/community': 'Comunidade',
  '/profile': 'Meu Perfil',
  '/certificates': 'Certificados',
  '/achievements': 'Conquistas',
  '/partners': 'Parceiros',
  '/license-payments': 'Pagamentos',
  '/estrutura-neo': 'Estrutura NEO',
  '/indique-e-ganhe': 'Indique e Ganhe',
  '/surgery-schedule': 'Agenda de Cirurgias',
  '/sala-tecnica': 'Sala Técnica',
  '/consolidated-results': 'Resultados Consolidados',
  '/regularization': 'Regularização',
  
  // ====================================
  // Marketplace
  // ====================================
  '/marketplace': 'Início',
  '/marketplace/professionals': 'Profissionais',
  '/marketplace/units': 'Unidades',
  '/marketplace/leads': 'Leads',
  '/marketplace/schedule': 'Agenda',
  '/marketplace/reviews': 'Avaliações',
  '/marketplace/campaigns': 'Campanhas',
  '/marketplace/dashboard': 'Dashboard',
  '/marketplace/discovery': 'Descobrir',
  
  // ====================================
  // Rotas antigas - redirect
  // ====================================
  '/postvenda': 'Pós-Venda',
};

// Rotas dinâmicas (com parâmetros)
interface DynamicRoute {
  pattern: RegExp;
  getLabel: () => string;
  parentPath: string;
  parentLabel: string;
}

const dynamicRoutes: DynamicRoute[] = [
  {
    pattern: /^\/neoteam\/patients\/[^/]+$/,
    getLabel: () => 'Detalhes do Paciente',
    parentPath: '/neoteam/patients',
    parentLabel: 'Pacientes'
  },
  {
    pattern: /^\/university\/exams\/[^/]+\/take$/,
    getLabel: () => 'Realizando Prova',
    parentPath: '/university/exams',
    parentLabel: 'Provas'
  },
  {
    pattern: /^\/university\/exams\/[^/]+\/results\/[^/]+$/,
    getLabel: () => 'Resultados',
    parentPath: '/university/exams',
    parentLabel: 'Provas'
  },
  {
    pattern: /^\/neoteam\/postvenda\/chamados\/[^/]+$/,
    getLabel: () => 'Detalhes do Chamado',
    parentPath: '/neoteam/postvenda/chamados',
    parentLabel: 'Chamados'
  },
];

// Mapeamento de módulos (portais)
const moduleLabels: Record<string, string> = {
  '/neoteam': 'NeoTeam',
  '/neocare': 'NeoCare',
  '/academy': 'IBRAMEC',
  '/neolicense': 'Licença',
  '/avivar': 'Avivar',
  '/marketplace': 'Marketplace',
  '/admin-dashboard': 'Admin',
  '/admin-home': 'Admin',
};

// Rotas sem portal específico (usam "Sistema" como prefix)
const legacyRoutes = [
  '/dashboard', '/home', '/university', '/materials', '/marketing',
  '/store', '/financial', '/mentorship', '/systems', '/career',
  '/hotleads', '/community', '/profile', '/certificates', '/achievements',
  '/partners', '/license-payments', '/estrutura-neo', '/indique-e-ganhe',
  '/surgery-schedule', '/sala-tecnica', '/consolidated-results', '/regularization',
  '/alunos', '/monitoring', '/system-metrics', '/admin/sentinel',
  '/weekly-reports', '/comparison', '/access-matrix', '/admin'
];

interface GlobalBreadcrumbProps {
  className?: string;
}

export function GlobalBreadcrumb({ className = '' }: GlobalBreadcrumbProps) {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Skip certain routes
  if (pathname === '/login' || pathname === '/reset-password' || pathname === '/select-profile') {
    return null;
  }
  
  // Determinar qual módulo está sendo acessado
  const modulePrefix = Object.keys(moduleLabels).find(prefix => pathname.startsWith(prefix));
  const isLegacyRoute = legacyRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  
  // Get module label
  let moduleLabel = modulePrefix ? moduleLabels[modulePrefix] : 'Sistema';
  const modulePath = modulePrefix || '/home';
  const isModuleRoot = pathname === modulePrefix;
  
  // Verificar se é uma rota dinâmica
  const dynamicRoute = dynamicRoutes.find(route => route.pattern.test(pathname));
  
  // Build breadcrumb items from path
  interface BreadcrumbRoute {
    path: string;
    label: string;
  }
  
  const breadcrumbs: BreadcrumbRoute[] = [];
  
  if (dynamicRoute) {
    // Rota dinâmica: adicionar parent e label dinâmico
    breadcrumbs.push({ path: dynamicRoute.parentPath, label: dynamicRoute.parentLabel });
    breadcrumbs.push({ path: pathname, label: dynamicRoute.getLabel() });
  } else if (isLegacyRoute && !modulePrefix) {
    // Rota legada sem portal
    const label = routeLabels[pathname];
    if (label) {
      breadcrumbs.push({ path: pathname, label });
    }
  } else {
    // Rota estática: construir a partir do path
    const pathSegments = pathname.split('/').filter(Boolean);
    let currentPath = '';
    
    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
      // Pular o primeiro segmento (módulo) pois será tratado separadamente
      if (modulePrefix && currentPath !== modulePrefix) {
        const label = routeLabels[currentPath];
        if (label) {
          breadcrumbs.push({ path: currentPath, label });
        }
      } else if (!modulePrefix) {
        const label = routeLabels[currentPath];
        if (label) {
          breadcrumbs.push({ path: currentPath, label });
        }
      }
    }
  }
  
  // Don't render if nothing to show
  if (!modulePrefix && breadcrumbs.length === 0) {
    return null;
  }
  
  return (
    <Breadcrumb className={`mb-4 ${className}`}>
      <BreadcrumbList>
        {/* Módulo (sempre como link para a home do módulo) */}
        <BreadcrumbItem>
          {isModuleRoot || (breadcrumbs.length === 0 && !modulePrefix) ? (
            <BreadcrumbPage className="font-medium">{moduleLabel}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link to={modulePath} className="text-muted-foreground hover:text-foreground font-medium">
                {moduleLabel}
              </Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        
        {/* Se estamos na raiz do módulo, mostrar "Início" */}
        {isModuleRoot && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Início</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
        
        {/* Restante do caminho */}
        {breadcrumbs.map((crumb, index, arr) => (
          <div key={crumb.path} className="flex items-center">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {index === arr.length - 1 ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.path} className="text-muted-foreground hover:text-foreground">
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
