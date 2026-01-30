/**
 * VisionBottomNav - Bottom navigation for Vision portal (mobile-friendly)
 */

import { useNavigate, useLocation } from "react-router-dom";
import { Home, ScanFace, History, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisionBottomNavProps {
  onOpenPlans?: () => void;
  onStartAnalysis?: () => void;
}

const menuItems = [
  { id: 'home', label: 'Início', icon: Home, path: '/vision' },
  { id: 'analysis', label: 'Análise', icon: ScanFace, action: 'start-analysis' },
  { id: 'history', label: 'Histórico', icon: History, path: '/vision/history' },
  { id: 'plans', label: 'Planos', icon: CreditCard, action: 'open-plans' },
];

export function VisionBottomNav({ onOpenPlans, onStartAnalysis }: VisionBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 border-t border-purple-500/20 backdrop-blur-sm safe-area-bottom">
      <div className="grid grid-cols-4 items-center py-2 px-2 max-w-md mx-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all",
                active 
                  ? "bg-purple-500/20 text-purple-400" 
                  : "text-slate-400 hover:text-white active:scale-95",
                item.action === 'start-analysis' && "relative"
              )}
            >
              {item.action === 'start-analysis' ? (
                <div className="absolute -top-4 p-3 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-full shadow-lg shadow-purple-500/30">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              ) : (
                <Icon className={cn("h-5 w-5", active && "text-purple-400")} />
              )}
              <span className={cn(
                "text-[10px] font-medium",
                item.action === 'start-analysis' && "mt-4"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
