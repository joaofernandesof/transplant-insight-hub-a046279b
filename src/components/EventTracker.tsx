// ====================================
// EventTracker - Automatic Page View & Action Tracking
// ====================================
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useEventLogger } from '@/hooks/useEventLogger';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';

// Module detection from path
function getModuleFromPath(path: string): string {
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/neoteam')) return 'neoteam';
  if (path.startsWith('/neocare')) return 'neocare';
  if (path.startsWith('/academy')) return 'academy';
  if (path.startsWith('/avivar')) return 'avivar';
  if (path.startsWith('/neolicense') || path === '/home') return 'neolicense';
  if (path.startsWith('/portal')) return 'portal';
  return 'general';
}

// Human-readable page names
function getPageName(path: string): string {
  const routes: Record<string, string> = {
    '/': 'Início',
    '/home': 'Início Licenciado',
    '/login': 'Login',
    '/admin-dashboard': 'Dashboard Admin',
    '/portal-selector': 'Seletor de Portal',
    '/consolidated-results': 'Resultados Consolidados',
    '/hotleads': 'HotLeads',
    '/university': 'Universidade',
    '/materials': 'Materiais',
    '/partners': 'Parceiros',
    '/achievements': 'Conquistas',
    '/profile': 'Perfil',
    '/monitoring': 'Monitoramento',
    '/admin/event-logs': 'Log de Eventos',
    '/surgery-schedule': 'Agenda de Cirurgias',
    '/neoteam': 'NeoTeam Home',
    '/neoteam/schedule': 'Agenda NeoTeam',
    '/neoteam/agenda-cirurgica': 'Agenda Cirúrgica',
    '/neoteam/vendidos-sem-data': 'Vendidos Sem Data',
    '/neoteam/waiting-room': 'Sala de Espera',
    '/neoteam/patients': 'Pacientes',
    '/neoteam/doctor-view': 'Visão do Médico',
    '/neocare': 'NeoCare Home',
    '/academy': 'Academy Home',
    '/academy/courses': 'Cursos',
    '/avivar': 'Avivar Home',
  };
  
  // Try exact match first
  if (routes[path]) return routes[path];
  
  // Try prefix match
  for (const [route, name] of Object.entries(routes)) {
    if (path.startsWith(route) && route !== '/') {
      return name;
    }
  }
  
  // Default to path
  return path;
}

// Send login notification to admin
async function sendLoginNotification(user: {
  authUserId: string;
  fullName: string;
  email: string;
  profiles: string[];
  isAdmin: boolean;
}) {
  try {
    await supabase.functions.invoke('notify-user-login', {
      body: {
        userId: user.authUserId,
        userName: user.fullName,
        userEmail: user.email,
        profiles: user.profiles,
        isAdmin: user.isAdmin,
        loginTime: new Date().toISOString(),
        userAgent: navigator.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to send login notification:', error);
  }
}

export function EventTracker() {
  const location = useLocation();
  const { logPageView, logLogin, logLogout } = useEventLogger();
  const { user, isLoading } = useUnifiedAuth();
  const lastPath = useRef<string | null>(null);
  const hasLoggedLogin = useRef(false);

  // Track page views
  useEffect(() => {
    // Don't track until auth is resolved
    if (isLoading) return;
    
    // Skip duplicate tracking for same path
    if (lastPath.current === location.pathname) return;
    
    // Skip auth pages from tracking
    const skipPaths = ['/login', '/reset-password'];
    if (skipPaths.includes(location.pathname)) {
      lastPath.current = location.pathname;
      return;
    }

    const module = getModuleFromPath(location.pathname);
    const pageName = getPageName(location.pathname);
    
    logPageView(location.pathname, module, {
      pageName,
      referrer: lastPath.current,
      search: location.search,
    });

    lastPath.current = location.pathname;
  }, [location.pathname, location.search, isLoading, logPageView]);

  // Track login when user becomes authenticated
  useEffect(() => {
    if (user && !hasLoggedLogin.current) {
      // Log the event locally
      logLogin({
        profiles: user.profiles,
        isAdmin: user.isAdmin,
      });
      
      // Send notification to admin
      sendLoginNotification(user);
      
      hasLoggedLogin.current = true;
    }
    
    // Reset login tracking when user logs out
    if (!user && hasLoggedLogin.current) {
      logLogout();
      hasLoggedLogin.current = false;
    }
  }, [user, logLogin, logLogout]);

  // This component doesn't render anything
  return null;
}
