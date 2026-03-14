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
// Módulo (NeoTeam, NeoCare, Academy, etc.) > Setor > Módulo > Sub-aba
const routeLabels: Record<string, string> = {
  // NeoTeam - Início
  '/neoteam': 'Início',
  // Setor Técnico
  '/neoteam/tecnico': 'Técnico',
  '/neoteam/tecnico/agenda': 'Agenda',
  '/neoteam/tecnico/agenda-cirurgica': 'Agenda Cirúrgica',
  '/neoteam/tecnico/sala-de-espera': 'Sala de Espera',
  '/neoteam/tecnico/sala-de-espera/reports': 'Relatórios de Tempo de Espera',
  '/neoteam/tecnico/pacientes': 'Pacientes',
  '/neoteam/tecnico/prontuarios': 'Prontuários',
  '/neoteam/tecnico/anamnese': 'Anamnese',
  '/neoteam/tecnico/visao-medico': 'Visão do Médico',
  '/neoteam/tecnico/procedimentos': 'Procedimentos',
  // Setor de Sucesso do Paciente
  '/neoteam/sucesso-paciente': 'Sucesso do Paciente',
  '/neoteam/sucesso-paciente/postvenda': 'Pós-Venda',
  '/neoteam/sucesso-paciente/postvenda/chamados': 'Chamados',
  '/neoteam/sucesso-paciente/postvenda/sla': 'SLA',
  '/neoteam/sucesso-paciente/postvenda/nps': 'NPS',
  '/neoteam/sucesso-paciente/retencao': 'Retenção & Churn',
  // Setor Operacional
  '/neoteam/operacional': 'Operacional',
  '/neoteam/operacional/tarefas': 'Tarefas',
  '/neoteam/operacional/limpeza': 'Limpeza',
  '/neoteam/operacional/inventario': 'Inventário',
  '/neoteam/operacional/diario': 'Diário de Bordo',
  // Setor de Processos
  '/neoteam/processos': 'Processos',
  '/neoteam/processos/fluxos': 'Fluxos de Processo',
  '/neoteam/processos/pops': 'POPs',
  '/neoteam/processos/documentos': 'Documentos',
  // Setor Financeiro
  '/neoteam/financeiro': 'Financeiro',
  '/neoteam/financeiro/dashboard': 'Dashboard Financeiro',
  '/neoteam/financeiro/contas-a-pagar': 'Contas a Pagar',
  '/neoteam/financeiro/revisao-contratos': 'Revisão de Contratos',
  '/neoteam/financeiro/importar-contratos': 'Importar Contratos',
  // Setor Jurídico
  '/neoteam/juridico': 'Jurídico',
  '/neoteam/juridico/dashboard': 'Dashboard Jurídico',
  '/neoteam/juridico/contratos': 'Gestão de Contratos',
  // Setor Comercial
  '/neoteam/comercial': 'Comercial',
  '/neoteam/comercial/call-intelligence': 'Call Intelligence',
  '/neoteam/comercial/kommo': 'Kommo Intelligence',
  // Setor de Marketing
  '/neoteam/marketing': 'Marketing',
  '/neoteam/marketing/campanhas': 'Campanhas',
  '/neoteam/marketing/eventos': 'Gestão de Eventos',
  '/neoteam/marketing/galerias': 'Galerias de Fotos',
  // Setor de TI
  '/neoteam/ti': 'TI',
  '/neoteam/ti/chamados': 'Chamados',
  '/neoteam/ti/controle-de-bots': 'Controle de Bots',
  '/neoteam/ti/modelos-mensagens': 'Modelos de Mensagens',
  '/neoteam/ti/relatorios': 'Relatórios',
  // Setor de RH
  '/neoteam/rh': 'RH',
  '/neoteam/rh/equipe': 'Equipe',
  '/neoteam/rh/cargos': 'Cargos & Funções',
  // Setor de Compras
  '/neoteam/compras': 'Compras',
  '/neoteam/compras/dashboard': 'Dashboard Compras',
  // Setor de Manutenção
  '/neoteam/manutencao': 'Manutenção',
  '/neoteam/manutencao/patrimonio': 'Controle Patrimonial',
  '/neoteam/manutencao/ordens': 'Ordens de Manutenção',
  // Setor de Sucesso do Aluno
  '/neoteam/sucesso-aluno': 'Sucesso do Aluno',
  '/neoteam/sucesso-aluno/chamados': 'Chamados',
  // Administração
  '/neoteam/admin': 'Administração',
  '/neoteam/admin/portal-links': 'Portal de Links',
  '/neoteam/admin/configuracoes': 'Configurações',
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
    pattern: /^\/neoteam\/tecnico\/pacientes\/[^/]+$/,
    getLabel: () => 'Detalhes do Paciente',
    parentPath: '/neoteam/tecnico/pacientes',
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
    breadcrumbs.push({ path: dynamicRoute.parentPath, label: dynamicRoute.parentLabel });
    breadcrumbs.push({ path: pathname, label: dynamicRoute.getLabel() });
  } else {
    // Build breadcrumbs incrementally from path segments
    const pathSegments = pathname.split('/').filter(Boolean);
    let currentPath = '';
    
    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
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
        
        {isModuleRoot && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Início</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
        
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