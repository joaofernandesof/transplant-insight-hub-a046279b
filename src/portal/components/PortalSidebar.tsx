import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Calendar, FileText, DollarSign, Package, MessageSquare, 
  Users, Settings, LogOut, Menu, X, Stethoscope, ClipboardList,
  BarChart3, Bell, Video, ChevronDown, ChevronRight, Heart,
  Receipt, Wallet, TrendingUp, ShoppingCart, Truck, Megaphone,
  Star, Shield, UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { usePortalAuth, PortalRole } from '../contexts/PortalAuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  path?: string;
  roles: PortalRole[];
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { id: 'home', title: 'Início', icon: Home, path: '/portal', roles: ['patient', 'doctor', 'admin', 'financial', 'reception', 'inventory'] },
  
  // Agendamento
  {
    id: 'scheduling',
    title: 'Agendamento',
    icon: Calendar,
    roles: ['patient', 'doctor', 'admin', 'reception'],
    children: [
      { id: 'my-appointments', title: 'Meus Agendamentos', icon: Calendar, path: '/portal/appointments', roles: ['patient'] },
      { id: 'new-appointment', title: 'Novo Agendamento', icon: Calendar, path: '/portal/appointments/new', roles: ['patient'] },
      { id: 'agenda', title: 'Agenda', icon: Calendar, path: '/portal/schedule', roles: ['doctor', 'admin', 'reception'] },
      { id: 'waiting-room', title: 'Sala de Espera', icon: Users, path: '/portal/waiting-room', roles: ['admin', 'reception'] },
      { id: 'rooms', title: 'Salas', icon: Home, path: '/portal/rooms', roles: ['admin', 'reception'] },
    ],
  },

  // Prontuário
  {
    id: 'medical',
    title: 'Prontuário',
    icon: FileText,
    roles: ['patient', 'doctor', 'admin'],
    children: [
      { id: 'my-records', title: 'Meus Documentos', icon: FileText, path: '/portal/my-records', roles: ['patient'] },
      { id: 'patients', title: 'Pacientes', icon: Users, path: '/portal/patients', roles: ['doctor', 'admin', 'reception'] },
      { id: 'records', title: 'Prontuários', icon: ClipboardList, path: '/portal/medical-records', roles: ['doctor', 'admin'] },
      { id: 'templates', title: 'Modelos', icon: FileText, path: '/portal/templates', roles: ['doctor', 'admin'] },
    ],
  },

  // Teleconsulta
  { id: 'teleconsultation', title: 'Teleconsulta', icon: Video, path: '/portal/teleconsultation', roles: ['patient', 'doctor', 'admin'] },

  // Financeiro
  {
    id: 'financial',
    title: 'Financeiro',
    icon: DollarSign,
    roles: ['patient', 'admin', 'financial', 'reception'],
    children: [
      { id: 'my-invoices', title: 'Minhas Faturas', icon: Receipt, path: '/portal/my-invoices', roles: ['patient'] },
      { id: 'invoices', title: 'Faturas', icon: Receipt, path: '/portal/invoices', roles: ['admin', 'financial', 'reception'] },
      { id: 'payments', title: 'Pagamentos', icon: DollarSign, path: '/portal/payments', roles: ['admin', 'financial'] },
      { id: 'cash-flow', title: 'Fluxo de Caixa', icon: TrendingUp, path: '/portal/cash-flow', roles: ['admin', 'financial'] },
      { id: 'accounts', title: 'Contas', icon: Wallet, path: '/portal/accounts', roles: ['admin', 'financial'] },
    ],
  },

  // Estoque
  {
    id: 'inventory',
    title: 'Estoque',
    icon: Package,
    roles: ['admin', 'inventory'],
    children: [
      { id: 'items', title: 'Itens', icon: ShoppingCart, path: '/portal/inventory/items', roles: ['admin', 'inventory'] },
      { id: 'movements', title: 'Movimentações', icon: TrendingUp, path: '/portal/inventory/movements', roles: ['admin', 'inventory'] },
      { id: 'suppliers', title: 'Fornecedores', icon: Truck, path: '/portal/inventory/suppliers', roles: ['admin', 'inventory'] },
    ],
  },

  // Comunicação
  {
    id: 'communication',
    title: 'Comunicação',
    icon: MessageSquare,
    roles: ['admin', 'reception'],
    children: [
      { id: 'whatsapp', title: 'WhatsApp', icon: MessageSquare, path: '/portal/whatsapp', roles: ['admin', 'reception'] },
      { id: 'campaigns', title: 'Campanhas', icon: Megaphone, path: '/portal/campaigns', roles: ['admin'] },
      { id: 'automations', title: 'Automações', icon: Settings, path: '/portal/automations', roles: ['admin'] },
    ],
  },

  // Pesquisas e NPS
  {
    id: 'surveys',
    title: 'Pesquisas',
    icon: Star,
    roles: ['admin', 'doctor'],
    children: [
      { id: 'nps', title: 'NPS', icon: Star, path: '/portal/nps', roles: ['admin', 'doctor'] },
      { id: 'survey-list', title: 'Pesquisas', icon: ClipboardList, path: '/portal/surveys', roles: ['admin'] },
    ],
  },

  // Relatórios
  { id: 'reports', title: 'Relatórios', icon: BarChart3, path: '/portal/reports', roles: ['admin', 'doctor', 'financial'] },

  // Administração
  {
    id: 'admin',
    title: 'Administração',
    icon: Settings,
    roles: ['admin'],
    children: [
      { id: 'users', title: 'Usuários', icon: Users, path: '/portal/admin/users', roles: ['admin'] },
      { id: 'doctors', title: 'Médicos', icon: Stethoscope, path: '/portal/admin/doctors', roles: ['admin'] },
      { id: 'audit', title: 'Auditoria', icon: Shield, path: '/portal/admin/audit', roles: ['admin'] },
      { id: 'lgpd', title: 'LGPD', icon: UserCheck, path: '/portal/admin/lgpd', roles: ['admin'] },
      { id: 'settings', title: 'Configurações', icon: Settings, path: '/portal/admin/settings', roles: ['admin'] },
    ],
  },
];

const roleLabels: Record<PortalRole, { label: string; color: string }> = {
  patient: { label: 'Paciente', color: 'bg-blue-500' },
  doctor: { label: 'Médico', color: 'bg-green-500' },
  admin: { label: 'Administrador', color: 'bg-purple-500' },
  financial: { label: 'Financeiro', color: 'bg-yellow-500' },
  reception: { label: 'Recepção', color: 'bg-pink-500' },
  inventory: { label: 'Estoque', color: 'bg-orange-500' },
};

export function PortalSidebar({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const { user, logout, hasRole } = usePortalAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.some(role => hasRole(role))
  );

  const handleLogout = async () => {
    await logout();
    navigate('/portal/login');
  };

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const filteredChildren = item.children?.filter(child => 
      child.roles.some(role => hasRole(role))
    );
    const isOpen = openMenus.includes(item.id);
    const Icon = item.icon;

    if (hasChildren && filteredChildren && filteredChildren.length > 0) {
      return (
        <Collapsible key={item.id} open={isOpen} onOpenChange={() => toggleMenu(item.id)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 px-3 py-2 h-auto",
                level > 0 && "pl-8"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.title}</span>
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 ml-4">
            {filteredChildren.map(child => renderMenuItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Button
        key={item.id}
        variant={isActive(item.path || '') ? 'secondary' : 'ghost'}
        className={cn(
          "w-full justify-start gap-3 px-3 py-2 h-auto",
          level > 0 && "pl-8",
          isActive(item.path || '') && "bg-primary/10 text-primary"
        )}
        onClick={() => {
          if (item.path) {
            navigate(item.path);
            setIsMobileOpen(false);
          }
        }}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!isCollapsed && <span>{item.title}</span>}
      </Button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Heart className="h-6 w-6 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg">Portal Neo Folic</h1>
              <p className="text-xs text-muted-foreground">Clínica Capilar</p>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      {user && !isCollapsed && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>{user.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.full_name}</p>
              <div className={cn("text-xs px-2 py-0.5 rounded-full text-white inline-block", roleLabels[user.primaryRole].color)}>
                {roleLabels[user.primaryRole].label}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-1">
          {filteredMenuItems.map(item => renderMenuItem(item))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={() => navigate('/portal/notifications')}
        >
          <Bell className="h-5 w-5" />
          {!isCollapsed && <span>Notificações</span>}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Sair</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen bg-card border-r transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {sidebarContent}
        
        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 hidden lg:flex h-6 w-6 rounded-full border bg-background"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        isCollapsed ? "lg:ml-0" : "lg:ml-0"
      )}>
        {children}
      </main>
    </div>
  );
}
