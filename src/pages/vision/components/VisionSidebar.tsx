/**
 * VisionSidebar - Sidebar navigation for Vision portal
 */

import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  ScanFace, 
  History, 
  CreditCard, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { VisionIcon } from "@/components/icons/VisionIcon";
import { useState } from "react";

interface VisionSidebarProps {
  onOpenPlans?: () => void;
  onStartAnalysis?: () => void;
}

const menuItems = [
  { id: 'home', label: 'Início', icon: Home, path: '/vision' },
  { id: 'analysis', label: 'Nova Análise', icon: ScanFace, action: 'start-analysis' },
  { id: 'history', label: 'Histórico', icon: History, path: '/vision/history' },
  { id: 'plans', label: 'Planos', icon: CreditCard, action: 'open-plans' },
];

export function VisionSidebar({ onOpenPlans, onStartAnalysis }: VisionSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUnifiedAuth();
  const [collapsed, setCollapsed] = useState(false);

  const userInitials = user?.fullName
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const handleItemClick = (item: typeof menuItems[0]) => {
    if (item.action === 'open-plans') {
      onOpenPlans?.();
    } else if (item.action === 'start-analysis') {
      onStartAnalysis?.();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const isActive = (item: typeof menuItems[0]) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    return false;
  };

  return (
    <aside 
      className={cn(
        "flex flex-col h-screen bg-slate-900/80 border-r border-purple-500/20 backdrop-blur-sm transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-purple-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl shrink-0">
            <VisionIcon className="h-6 w-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-white text-lg">Vision</h1>
              <p className="text-xs text-purple-300">Análise Capilar IA</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                active 
                  ? "bg-purple-500/20 text-purple-300" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                collapsed && "justify-center"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-2 pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full text-slate-400 hover:text-white hover:bg-slate-800/50"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-xs">Recolher</span>
            </>
          )}
        </Button>
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-purple-500/20">
        <div className={cn(
          "flex items-center gap-3",
          collapsed && "flex-col"
        )}>
          <Avatar className="h-9 w-9 border border-purple-500/30 shrink-0">
            <AvatarImage src={user?.avatarUrl || ''} />
            <AvatarFallback className="bg-purple-600 text-white text-xs">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.fullName || user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="shrink-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
