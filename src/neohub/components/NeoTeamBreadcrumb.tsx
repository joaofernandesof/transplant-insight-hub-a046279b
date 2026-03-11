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
  // NeoTeam - Início
  '/neoteam': 'Início',
  // Setor Técnico
  '/neoteam/schedule': 'Agenda',
  '/neoteam/agenda-cirurgica': 'Agenda Cirúrgica',
  '/neoteam/waiting-room': 'Sala de Espera',
  '/neoteam/waiting-room/reports': 'Relatórios de Tempo de Espera',
  '/neoteam/patients': 'Pacientes',
  '/neoteam/medical-records': 'Prontuários',
  '/neoteam/anamnesis': 'Anamnese',
  '/neoteam/doctor-view': 'Visão do Médico',
  '/neoteam/procedures': 'Procedimentos',
  // Setor de Sucesso do Paciente
  '/neoteam/postvenda': 'Pós-Venda',
  '/neoteam/postvenda/chamados': 'Chamados',
  '/neoteam/postvenda/sla': 'SLA',
  '/neoteam/postvenda/nps': 'NPS',
  // Setor Operacional
  '/neoteam/tasks': 'Tarefas',
  '/neoteam/limpeza': 'Limpeza',
  '/neoteam/inventory': 'Inventário',
  '/neoteam/diario': 'Diário de Bordo',
  // Setor de Processos
  '/neoteam/processos': 'Fluxos de Processo',
  '/neoteam/pops': 'POPs',
  '/neoteam/documents': 'Documentos',
  // Setor Financeiro
  '/neoteam/contract-review': 'Revisão de Contratos',
  '/neoteam/contracts-import': 'Importar Contratos',
  // Setor Jurídico
  '/neoteam/legal-dashboard': 'Dashboard Jurídico',
  // Setor de Marketing
  '/neoteam/events': 'Gestão de Eventos',
  '/neoteam/galleries': 'Galerias de Fotos',
  // Setor de RH
  '/neoteam/staff-roles': 'Cargos & Funções',
  // Setor Comercial
  '/neoteam/analise-calls': 'Análise de Calls',
  // Administração
  '/neoteam/settings': 'Configurações',
  '/neoteam/reports': 'Relatórios',
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
  }
];

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
  
  // Verificar se é uma rota dinâmica
  const dynamicRoute = dynamicRoutes.find(route => route.pattern.test(pathname));
  
  // Build breadcrumb items from path
  const breadcrumbs: BreadcrumbRoute[] = [];
  
  if (dynamicRoute) {
    // Rota dinâmica: adicionar parent e label dinâmico
    breadcrumbs.push({ path: dynamicRoute.parentPath, label: dynamicRoute.parentLabel });
    breadcrumbs.push({ path: pathname, label: dynamicRoute.getLabel() });
  } else {
    // Rota estática: construir a partir do path
    const pathSegments = pathname.split('/').filter(Boolean);
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
  }
  
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
