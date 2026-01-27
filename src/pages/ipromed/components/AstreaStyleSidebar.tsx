/**
 * IPROMED - Astrea-style Sidebar Navigation
 * Navegação lateral inspirada no Astrea
 */

import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutGrid,
  Calendar,
  Users,
  MessageCircle,
  FolderOpen,
  FileText,
  DollarSign,
  Sparkles,
  FileBox,
  BarChart3,
  Bell,
  HelpCircle,
  Settings,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  badgeColor?: string;
  isNew?: boolean;
}

const mainNavItems: NavItem[] = [
  { id: 'workspace', label: 'Área de trabalho', icon: LayoutGrid, href: '/ipromed/legal-hub' },
  { id: 'agenda', label: 'Agenda', icon: Calendar, href: '/ipromed/legal-hub?tab=agenda' },
  { id: 'contacts', label: 'Contatos', icon: Users, href: '/ipromed/clients' },
  { id: 'services', label: 'Atendimentos', icon: MessageCircle, href: '/ipromed/legal-hub?tab=portal' },
  { id: 'cases', label: 'Processos e casos', icon: FolderOpen, href: '/ipromed/legal-hub?tab=cases' },
  { id: 'publications', label: 'Publicações', icon: FileText, href: '/ipromed/legal-hub?tab=publications', badge: 99, badgeColor: 'bg-rose-500' },
  { id: 'financial', label: 'Financeiro', icon: DollarSign, href: '/ipromed/legal-hub?tab=financial' },
  { id: 'ai', label: 'Criação de peças', icon: Sparkles, href: '/ipromed/legal-hub?tab=ai', isNew: true },
  { id: 'documents', label: 'Documentos', icon: FileBox, href: '/ipromed/documents' },
  { id: 'indicators', label: 'Indicadores', icon: BarChart3, href: '/ipromed/legal-hub?tab=analytics' },
  { id: 'alerts', label: 'Alertas', icon: Bell, href: '/ipromed/legal-hub?tab=alerts', badge: 5, badgeColor: 'bg-rose-500' },
];

const bottomNavItems: NavItem[] = [
  { id: 'support', label: 'Suporte', icon: HelpCircle, href: '/ipromed/support' },
];

interface AstreaStyleSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function AstreaStyleSidebar({ isCollapsed = false, onToggle }: AstreaStyleSidebarProps) {
  const location = useLocation();

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <aside className={cn(
      "h-screen bg-white border-r flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0066CC] rounded-lg flex items-center justify-center">
            <Scale className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg text-[#0066CC]">IPROMED</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-2 space-y-1">
          {mainNavItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <NavLink
                key={item.id}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                  active
                    ? "bg-[#0066CC]/10 text-[#0066CC]"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  active ? "text-[#0066CC]" : "text-gray-500"
                )} />
                
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    
                    {item.isNew && (
                      <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5">
                        <Sparkles className="h-3 w-3 mr-0.5" />
                        IA
                      </Badge>
                    )}
                    
                    {item.badge && (
                      <Badge className={cn("text-white text-xs px-1.5 min-w-[20px] justify-center", item.badgeColor)}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom Navigation */}
      <div className="border-t py-4 px-2">
        {bottomNavItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon className="h-5 w-5 text-gray-500 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}
