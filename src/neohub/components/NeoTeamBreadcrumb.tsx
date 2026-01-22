import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbRoute {
  path: string;
  label: string;
}

// Hierarquia do Sistema:
// Módulo (NeoTeam, NeoCare, Academy, etc.) > Aba (Início, Pacientes, Agenda, etc.) > Sub-aba (se houver)
const routeLabels: Record<string, string> = {
  // NeoTeam routes (Portal do Colaborador)
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
  // NeoCare routes (Portal do Paciente)
  '/neocare': 'Início',
  '/neocare/appointments': 'Meus Agendamentos',
  '/neocare/appointments/new': 'Novo Agendamento',
  '/neocare/my-records': 'Meus Documentos',
  '/neocare/documents': 'Documentos',
  '/neocare/orientations': 'Orientações',
  '/neocare/settings': 'Configurações',
  '/neocare/news': 'Notícias',
};

// Mapeamento de módulos (portais)
const moduleLabels: Record<string, string> = {
  '/neoteam': 'NeoTeam',
  '/neocare': 'NeoCare',
  '/academy': 'IBRAMEC',
  '/neolicense': 'NeoLicense',
  '/avivar': 'Avivar',
};

interface NeoTeamBreadcrumbProps {
  showOnRoot?: boolean;
}

export function NeoTeamBreadcrumb({ showOnRoot = true }: NeoTeamBreadcrumbProps) {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Determinar qual módulo está sendo acessado
  const modulePrefix = Object.keys(moduleLabels).find(prefix => pathname.startsWith(prefix));
  if (!modulePrefix) return null;
  
  const moduleLabel = moduleLabels[modulePrefix];
  const isModuleRoot = pathname === modulePrefix;
  
  // Build breadcrumb items from path (excluindo o módulo base)
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbRoute[] = [];
  let currentPath = '';
  
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;
    // Pular o primeiro segmento (módulo) pois será tratado separadamente
    if (currentPath !== modulePrefix) {
      const label = routeLabels[currentPath];
      if (label) {
        breadcrumbs.push({ path: currentPath, label });
      }
    }
  }
  
  // Se estamos na raiz do módulo, mostrar: Módulo > Início
  // Se estamos em uma sub-aba, mostrar: Módulo > Aba > Sub-aba
  
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {/* Módulo (sempre como link para a home do módulo) */}
        <BreadcrumbItem>
          {isModuleRoot ? (
            <BreadcrumbPage className="font-medium">{moduleLabel}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link to={modulePrefix} className="text-muted-foreground hover:text-foreground font-medium">
                {moduleLabel}
              </Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        
        {/* Se estamos na raiz, mostrar "Início" como página atual */}
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
