import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

interface BreadcrumbRoute {
  path: string;
  label: string;
}

const routeLabels: Record<string, string> = {
  // Portal root
  '/neohub': 'NeoHub',
  // NeoTeam routes
  '/neoteam': 'NeoTeam',
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
  // NeoCare routes
  '/neocare': 'NeoCare',
  '/neocare/appointments': 'Meus Agendamentos',
  '/neocare/appointments/new': 'Novo Agendamento',
  '/neocare/my-records': 'Meus Documentos',
  '/neocare/documents': 'Documentos',
  '/neocare/orientations': 'Orientações',
  '/neocare/settings': 'Configurações',
  '/neocare/news': 'Notícias',
};

interface NeoTeamBreadcrumbProps {
  showOnRoot?: boolean;
}

export function NeoTeamBreadcrumb({ showOnRoot = false }: NeoTeamBreadcrumbProps) {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Build breadcrumb items from path
  const breadcrumbs: BreadcrumbRoute[] = [];
  let currentPath = '';
  
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;
    const label = routeLabels[currentPath];
    if (label) {
      breadcrumbs.push({ path: currentPath, label });
    }
  }
  
  // Don't show breadcrumb on root pages unless explicitly requested
  if (breadcrumbs.length <= 1 && !showOnRoot) {
    return null;
  }
  
  // Determine portal path based on current route
  const isNeoCare = location.pathname.startsWith('/neocare');
  const isNeoTeam = location.pathname.startsWith('/neoteam');
  const portalLabel = isNeoCare ? 'NeoCare' : isNeoTeam ? 'NeoTeam' : 'NeoHub';
  const portalPath = isNeoCare ? '/neocare' : isNeoTeam ? '/neoteam' : '/neohub';
  
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {/* NeoHub - Portal root */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/neohub" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">NeoHub</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {/* Portal (NeoTeam/NeoCare) */}
        {portalPath !== '/neohub' && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {breadcrumbs.length <= 1 ? (
                <BreadcrumbPage>{portalLabel}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={portalPath} className="text-muted-foreground hover:text-foreground">
                    {portalLabel}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </>
        )}
        
        {/* Rest of the path */}
        {breadcrumbs.filter(b => b.path !== portalPath).map((crumb, index, arr) => (
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
