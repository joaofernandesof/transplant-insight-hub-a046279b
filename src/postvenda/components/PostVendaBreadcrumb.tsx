import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  '/postvenda': 'Início',
  '/postvenda/chamados': 'Chamados',
  '/postvenda/sla': 'Configuração SLA',
  '/postvenda/nps': 'Relatórios NPS',
};

export function PostVendaBreadcrumb() {
  const location = useLocation();
  const pathname = location.pathname;

  // Build breadcrumb segments
  const segments: { path: string; label: string }[] = [
    { path: '/postvenda', label: 'Pós-Venda' },
  ];

  // Add current page if not home
  if (pathname !== '/postvenda') {
    const label = routeLabels[pathname];
    if (label) {
      segments.push({ path: pathname, label });
    } else if (pathname.includes('/postvenda/chamados/')) {
      segments.push({ path: '/postvenda/chamados', label: 'Chamados' });
      segments.push({ path: pathname, label: 'Detalhes' });
    }
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
      {segments.map((segment, index) => (
        <span key={segment.path} className="flex items-center gap-1.5">
          {index > 0 && <ChevronRight className="h-3.5 w-3.5" />}
          {index === segments.length - 1 ? (
            <span className="font-medium text-foreground">{segment.label}</span>
          ) : (
            <Link 
              to={segment.path} 
              className="hover:text-foreground transition-colors"
            >
              {segment.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
