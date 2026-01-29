// ====================================
// useSessionTimeout - Controle de expiração de sessão
// ====================================
// Monitora inatividade do usuário e faz logout automático
// após 30 minutos sem atividade

import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos
const WARNING_BEFORE_MS = 2 * 60 * 1000; // Aviso 2 minutos antes

export function useSessionTimeout() {
  const { user, logout } = useUnifiedAuth();
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasWarnedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const handleSessionExpired = useCallback(async () => {
    clearTimers();
    toast.error('Sua sessão expirou por inatividade', {
      description: 'Por favor, faça login novamente.',
      duration: 5000,
    });
    await logout();
    navigate('/login', { replace: true });
  }, [clearTimers, logout, navigate]);

  const showWarning = useCallback(() => {
    if (!hasWarnedRef.current) {
      hasWarnedRef.current = true;
      toast.warning('Sua sessão expirará em breve', {
        description: 'Mova o mouse ou tecle algo para continuar logado.',
        duration: 60000, // 1 minuto
      });
    }
  }, []);

  const resetTimer = useCallback(() => {
    if (!user) return;
    
    hasWarnedRef.current = false;
    clearTimers();

    // Timer para aviso
    warningRef.current = setTimeout(() => {
      showWarning();
    }, SESSION_TIMEOUT_MS - WARNING_BEFORE_MS);

    // Timer para expiração
    timeoutRef.current = setTimeout(() => {
      handleSessionExpired();
    }, SESSION_TIMEOUT_MS);
  }, [user, clearTimers, showWarning, handleSessionExpired]);

  useEffect(() => {
    if (!user) {
      clearTimers();
      return;
    }

    // Eventos que resetam o timer
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    
    const handleActivity = () => {
      resetTimer();
    };

    // Registrar eventos
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Iniciar timer
    resetTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [user, resetTimer, clearTimers]);

  return { resetTimer };
}

export default useSessionTimeout;
