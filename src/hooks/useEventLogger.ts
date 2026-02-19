import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export type EventType = 'page_view' | 'action' | 'login' | 'logout' | 'error' | 'api_call';
export type EventCategory = 'navigation' | 'authentication' | 'data' | 'admin' | 'system';

interface LogEventParams {
  eventType: EventType;
  eventCategory: EventCategory;
  eventName: string;
  module?: string;
  pagePath?: string;
  metadata?: Record<string, any>;
}

// Generate a session ID that persists for the browser session
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('event_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('event_session_id', sessionId);
  }
  return sessionId;
};

export function useEventLogger() {
  const { user } = useUnifiedAuth();

  const logEvent = useCallback(async (params: LogEventParams) => {
    try {
      // Don't attempt to log if user is not authenticated (RLS will reject)
      if (!user?.authUserId) return;
      
      const { eventType, eventCategory, eventName, module, pagePath, metadata } = params;
      
      await supabase.from('system_event_logs').insert({
        user_id: user.authUserId,
        user_name: user.fullName || null,
        user_email: user.email || null,
        event_type: eventType,
        event_category: eventCategory,
        event_name: eventName,
        module: module || null,
        page_path: pagePath || window.location.pathname,
        metadata: metadata || {},
        user_agent: navigator.userAgent,
        session_id: getSessionId(),
      });
    } catch (error) {
      // Silently fail - logging shouldn't break the app
      console.error('Failed to log event:', error);
    }
  }, [user]);

  const logPageView = useCallback((pagePath: string, module?: string, metadata?: Record<string, any>) => {
    return logEvent({
      eventType: 'page_view',
      eventCategory: 'navigation',
      eventName: `Viewed ${pagePath}`,
      module,
      pagePath,
      metadata,
    });
  }, [logEvent]);

  const logAction = useCallback((actionName: string, module?: string, metadata?: Record<string, any>) => {
    return logEvent({
      eventType: 'action',
      eventCategory: 'data',
      eventName: actionName,
      module,
      metadata,
    });
  }, [logEvent]);

  const logLogin = useCallback((metadata?: Record<string, any>) => {
    return logEvent({
      eventType: 'login',
      eventCategory: 'authentication',
      eventName: 'User logged in',
      metadata,
    });
  }, [logEvent]);

  const logLogout = useCallback((metadata?: Record<string, any>) => {
    return logEvent({
      eventType: 'logout',
      eventCategory: 'authentication',
      eventName: 'User logged out',
      metadata,
    });
  }, [logEvent]);

  const logError = useCallback((errorMessage: string, module?: string, metadata?: Record<string, any>) => {
    return logEvent({
      eventType: 'error',
      eventCategory: 'system',
      eventName: errorMessage,
      module,
      metadata,
    });
  }, [logEvent]);

  return {
    logEvent,
    logPageView,
    logAction,
    logLogin,
    logLogout,
    logError,
  };
}

// Standalone function for use outside of React components
export async function logSystemEvent(params: LogEventParams & { userId?: string; userName?: string; userEmail?: string }) {
  try {
    // Don't attempt to log without a user ID (RLS will reject)
    if (!params.userId) return;
    
    const { eventType, eventCategory, eventName, module, pagePath, metadata, userId, userName, userEmail } = params;
    
    await supabase.from('system_event_logs').insert({
      user_id: userId,
      user_name: userName || null,
      user_email: userEmail || null,
      event_type: eventType,
      event_category: eventCategory,
      event_name: eventName,
      module: module || null,
      page_path: pagePath || (typeof window !== 'undefined' ? window.location.pathname : null),
      metadata: metadata || {},
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      session_id: typeof sessionStorage !== 'undefined' ? getSessionId() : null,
    });
  } catch (error) {
    console.error('Failed to log system event:', error);
  }
}
