import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Building2 } from 'lucide-react';

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  
  if (!user) return null;
  
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 py-3">
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
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-right">
              <div>
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
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            
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
