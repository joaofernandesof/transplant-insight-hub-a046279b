import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useClinicAuth } from '../contexts/ClinicAuthContext';
import { useBranches } from '../hooks/useBranches';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LayoutDashboard,
  Plus,
  UserPlus,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path: string;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  { title: 'Visão Operacional', icon: LayoutDashboard, path: '/clinic' },
  { title: 'Agenda', icon: Calendar, path: '/clinic/agenda' },
  { title: 'Vendidos Sem Data', icon: Clock, path: '/clinic/sem-data' },
  { title: 'Nova Venda', icon: Plus, path: '/clinic/nova-venda', roles: ['admin', 'gestao', 'comercial'] },
  { title: 'Cadastrar Paciente', icon: UserPlus, path: '/clinic/paciente' },
  { title: 'Pacientes', icon: Users, path: '/clinic/pacientes' },
  { title: 'Vendas', icon: TrendingUp, path: '/clinic/vendas' },
  { title: 'Configurações', icon: Settings, path: '/clinic/configuracoes', roles: ['admin'] },
];

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrador', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  gestao: { label: 'Gestão', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  comercial: { label: 'Comercial', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  operacao: { label: 'Operação', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  recepcao: { label: 'Recepção', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

interface ClinicSidebarProps {
  children: React.ReactNode;
}

export function ClinicSidebar({ children }: ClinicSidebarProps) {
  const { user, currentBranch, switchBranch, logout, isAdmin, isGestao } = useClinicAuth();
  const { branches } = useBranches();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  const handleLogout = async () => {
    await logout();
    navigate('/clinic/login');
  };

  const roleInfo = user ? roleLabels[user.role] : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-card border-r transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={cn(
            "flex items-center gap-3 p-4 border-b",
            isCollapsed && "justify-center"
          )}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-lg">Neo Cirurgias</h1>
                <p className="text-xs text-muted-foreground">Sistema Clínico</p>
              </div>
            )}
          </div>

          {/* Branch selector (for admin/gestao) */}
          {(isAdmin || isGestao) && !isCollapsed && branches.length > 0 && (
            <div className="p-3 border-b">
              <Select value={currentBranch} onValueChange={switchBranch}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a filial" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* User info */}
          <div className={cn(
            "p-4 border-b",
            isCollapsed && "flex justify-center"
          )}>
            <div className={cn("flex items-center gap-3", isCollapsed && "flex-col")}>
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.name?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  {roleInfo && (
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", roleInfo.color)}>
                      {roleInfo.label}
                    </span>
                  )}
                  {!isAdmin && !isGestao && (
                    <p className="text-xs text-muted-foreground mt-1">{currentBranch}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Menu */}
          <ScrollArea className="flex-1">
            <nav className="p-2">
              {filteredMenuItems.map(item => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="text-sm">{item.title}</span>}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-muted-foreground hover:text-foreground",
                isCollapsed && "justify-center"
              )}
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              {!isCollapsed && <span>Sair</span>}
            </Button>
          </div>

          {/* Collapse button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm hidden lg:flex"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          isCollapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
