import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Building2 } from 'lucide-react';
import UserNotificationsPopover from './UserNotificationsPopover';
import { ModuleSwitcher } from '@/components/shared/ModuleSwitcher';

// Helper to get initials from name
const getInitials = (name: string): string => {
  if (!name) return 'U';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  
  if (!user) return null;

  const initials = getInitials(user.name || '');
  const avatarUrl = user.avatarUrl;
  
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <h1 className="font-bold text-foreground text-lg">
                  Byneofolic
                </h1>
                <p className="text-xs text-muted-foreground">
                  Dashboard de Métricas
                </p>
              </div>
            </div>
            
            {isAdmin && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                Administrador
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Module Switcher */}
            <ModuleSwitcher variant="icon" />
            
            {/* Notifications */}
            <UserNotificationsPopover />
            
            {/* User Avatar with Initials */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="font-medium text-foreground text-sm">
                  {user.name}
                </p>
                {user.clinicName && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <Building2 className="w-3 h-3" />
                    {user.clinicName}
                  </p>
                )}
              </div>
              
              {/* Avatar Circle with Photo or Initials */}
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={user.name || 'Avatar'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-muted-foreground">
                    {initials}
                  </span>
                )}
              </div>
            </div>
            
            {/* Logout */}
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
