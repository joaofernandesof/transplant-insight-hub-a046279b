/**
 * FlowSidebar - Sidebar do portal Flow.do
 */

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Calendar, 
  Workflow, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap
} from "lucide-react";
import { PortalSwitcherButton } from "@/components/shared/PortalSwitcherButton";

interface FlowSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const menuItems = [
  { 
    label: "Dashboard", 
    icon: LayoutDashboard, 
    path: "/flow" 
  },
  { 
    label: "Projetos", 
    icon: FolderKanban, 
    path: "/flow/projects" 
  },
  { 
    label: "Minhas Tarefas", 
    icon: CheckSquare, 
    path: "/flow/my-tasks" 
  },
  { 
    label: "Calendário", 
    icon: Calendar, 
    path: "/flow/calendar" 
  },
  { 
    label: "Automações", 
    icon: Workflow, 
    path: "/flow/workflows" 
  },
  { 
    label: "Configurações", 
    icon: Settings, 
    path: "/flow/settings" 
  },
];

export function FlowSidebar({ collapsed, onToggleCollapse }: FlowSidebarProps) {
  const location = useLocation();

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-card border-r transition-all duration-300 z-40 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b">
        {!collapsed && (
          <Link to="/flow" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Flow.do</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/flow" className="mx-auto">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
          </Link>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleCollapse}
          className={cn(collapsed && "hidden")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Menu */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {/* Portal Switcher - Always first */}
          <PortalSwitcherButton isCollapsed={collapsed} variant="default" />
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== "/flow" && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-accent",
                  collapsed && "justify-center"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Collapse Toggle (when collapsed) */}
      {collapsed && (
        <div className="p-2 border-t">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleCollapse}
            className="w-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </aside>
  );
}
