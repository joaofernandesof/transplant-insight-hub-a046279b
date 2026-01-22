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
import { UnifiedSidebar } from '@/components/UnifiedSidebar';

const menuItems = [
  { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard, route: '/postvenda' },
  { id: 'chamados', title: 'Chamados', icon: Ticket, route: '/postvenda/chamados' },
  { id: 'sla', title: 'Configuração SLA', icon: Clock, route: '/postvenda/sla', adminOnly: true },
  { id: 'nps', title: 'Relatórios NPS', icon: Star, route: '/postvenda/nps' },
];

interface PostVendaSidebarProps {
  children: React.ReactNode;
}

export function PostVendaSidebar({ children }: PostVendaSidebarProps) {
  return (
    <UnifiedSidebar>
      {children}
    </UnifiedSidebar>
  );
}
