import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Ticket,
  Clock,
  Star,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

const menuItems = [
  { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard, route: '/postvenda' },
  { id: 'chamados', title: 'Chamados', icon: Ticket, route: '/postvenda/chamados' },
  { id: 'sla', title: 'Configuração SLA', icon: Clock, route: '/postvenda/sla', adminOnly: true },
  { id: 'nps', title: 'Relatórios NPS', icon: Star, route: '/postvenda/nps' },
];

export function PostVendaSidebar() {
  const location = useLocation();
  const { isAdmin } = useUnifiedAuth();

  const filteredItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className="w-64 border-r bg-card/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Ticket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Pós-Venda</h2>
            <p className="text-xs text-muted-foreground">CAPYS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 p-3">
        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.route || 
                            (item.route !== '/postvenda' && location.pathname.startsWith(item.route));

            return (
              <NavLink
                key={item.id}
                to={item.route}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer - Back to main */}
      <div className="p-3 border-t">
        <NavLink to="/neoteam">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <ChevronLeft className="h-4 w-4" />
            Voltar ao NeoTeam
          </Button>
        </NavLink>
      </div>
    </aside>
  );
}
