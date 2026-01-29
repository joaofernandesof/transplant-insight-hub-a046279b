/**
 * VisionHeader - Top header for Vision portal (mobile-friendly)
 */

import { useNavigate } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { VisionIcon } from "@/components/icons/VisionIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function VisionHeader() {
  const navigate = useNavigate();
  const { user, logout } = useUnifiedAuth();

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

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-slate-900/95 border-b border-purple-500/20 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl">
          <VisionIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg leading-tight">Vision</h1>
          <p className="text-[10px] text-purple-300 leading-tight">Análise Capilar IA</p>
        </div>
      </div>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 text-white hover:bg-slate-800/50 p-1.5">
            <Avatar className="h-8 w-8 border border-purple-500/30">
              <AvatarImage src={user?.avatarUrl || ''} />
              <AvatarFallback className="bg-purple-600 text-white text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-purple-500/20">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-white truncate">
              {user?.fullName || user?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <DropdownMenuSeparator className="bg-purple-500/20" />
          <DropdownMenuItem 
            onClick={handleLogout}
            className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
