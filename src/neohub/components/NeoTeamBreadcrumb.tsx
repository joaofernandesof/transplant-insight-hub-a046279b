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
  '/neocare': 'NeoCare',
  '/neocare/appointments': 'Agendamentos',
  '/neocare/new-appointment': 'Novo Agendamento',
  '/neocare/documents': 'Documentos',
  '/neocare/orientations': 'Orientações',
  '/neocare/settings': 'Configurações',
};

export function NeoTeamBreadcrumb() {
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
  
  // Don't show breadcrumb on root NeoTeam page
  if (breadcrumbs.length <= 1) {
    return null;
  }
  
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/neoteam" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Início</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex items-center">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {index === breadcrumbs.length - 1 ? (
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
