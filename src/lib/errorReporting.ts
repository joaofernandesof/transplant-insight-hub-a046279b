/**
 * Centralized Error Reporting System
 * Generates unique error codes and descriptive messages for debugging
 * Sends email alerts to ti@neofolic.com.br
 */

import { supabase } from '@/integrations/supabase/client';

interface ErrorDetails {
  code: string;
  message: string;
  context?: string;
  timestamp: string;
  originalError?: string;
}

interface UserContext {
  userId?: string;
  userEmail?: string;
  userName?: string;
}

// Cache for user context to avoid repeated queries
let cachedUserContext: UserContext | null = null;

// Get current user context for error reporting
async function getUserContext(): Promise<UserContext> {
  if (cachedUserContext) return cachedUserContext;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: neohubUser } = await supabase
        .from('neohub_users')
        .select('full_name, email')
        .eq('user_id', user.id)
        .maybeSingle();
      
      cachedUserContext = {
        userId: user.id,
        userEmail: neohubUser?.email || user.email,
        userName: neohubUser?.full_name || 'Usuário',
      };
      return cachedUserContext;
    }
  } catch (e) {
    console.warn('Failed to get user context for error report:', e);
  }
  
  return {};
}

// Clear cached user context (call on logout)
export function clearErrorReportingUserCache(): void {
  cachedUserContext = null;
}

// Generate a unique error ID: PREFIX-TIMESTAMP-RANDOM
function generateErrorId(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Error code prefixes by category
export const ERROR_PREFIXES = {
  SURVEY: 'SVY',      // Survey-related errors
  AUTH: 'AUTH',       // Authentication errors
  DB: 'DB',           // Database errors
  NETWORK: 'NET',     // Network/API errors
  UPLOAD: 'UPL',      // File upload errors
  GALLERY: 'GAL',     // Gallery errors
  GENERAL: 'ERR',     // General errors
} as const;

// Send error alert via edge function
async function sendErrorAlert(details: ErrorDetails, userContext: UserContext): Promise<void> {
  try {
    await supabase.functions.invoke('notify-error-alert', {
      body: {
        errorCode: details.code,
        errorMessage: details.message,
        context: details.context,
        originalError: details.originalError,
        timestamp: details.timestamp,
        userId: userContext.userId,
        userEmail: userContext.userEmail,
        userName: userContext.userName,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
      },
    });
  } catch (e) {
    // Don't block on email failure - just log
    console.warn('Failed to send error alert email:', e);
  }
}

// Create structured error details
export function createErrorDetails(
  prefix: keyof typeof ERROR_PREFIXES,
  message: string,
  context?: string,
  originalError?: unknown
): ErrorDetails {
  const errorCode = generateErrorId(ERROR_PREFIXES[prefix]);
  
  let originalErrorMessage: string | undefined;
  if (originalError) {
    if (originalError instanceof Error) {
      originalErrorMessage = originalError.message;
    } else if (typeof originalError === 'string') {
      originalErrorMessage = originalError;
    } else {
      try {
        originalErrorMessage = JSON.stringify(originalError);
      } catch {
        originalErrorMessage = 'Unable to serialize error';
      }
    }
  }
  
  const details: ErrorDetails = {
    code: errorCode,
    message,
    context,
    timestamp: new Date().toISOString(),
    originalError: originalErrorMessage,
  };
  
  // Log to console for debugging
  console.error(`[${errorCode}] ${message}`, {
    context,
    originalError: originalErrorMessage,
    timestamp: details.timestamp,
  });
  
  return details;
}

// Format error for display in toast
export function formatErrorForToast(details: ErrorDetails): string {
  return `${details.message}\n\nCódigo: ${details.code}`;
}

// Format error for detailed display (e.g., in a dialog)
export function formatErrorForDisplay(details: ErrorDetails): {
  title: string;
  description: string;
  code: string;
  technical: string;
} {
  return {
    title: 'Erro',
    description: details.message,
    code: details.code,
    technical: details.originalError || 'Sem detalhes adicionais',
  };
}

// Helper to report and show error in one call
import { toast } from 'sonner';

// Send error report email
async function sendErrorReport(details: ErrorDetails, userContext: UserContext): Promise<boolean> {
  try {
    const response = await supabase.functions.invoke('notify-error-alert', {
      body: {
        errorCode: details.code,
        errorMessage: details.message,
        context: details.context,
        originalError: details.originalError,
        timestamp: details.timestamp,
        userId: userContext.userId,
        userEmail: userContext.userEmail,
        userName: userContext.userName,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        reportedByUser: true, // Flag to indicate user clicked the report button
      },
    });
    return !response.error;
  } catch (e) {
    console.warn('Failed to send error report:', e);
    return false;
  }
}

export function reportError(
  prefix: keyof typeof ERROR_PREFIXES,
  message: string,
  context?: string,
  originalError?: unknown
): ErrorDetails {
  const details = createErrorDetails(prefix, message, context, originalError);
  
  // Show toast with error code and report button
  toast.error(details.message, {
    description: `Código: ${details.code}`,
    duration: 10000, // Keep visible longer so user can report
    action: {
      label: '📧 Reportar Erro',
      onClick: async () => {
        // Show loading toast
        const loadingToast = toast.loading('Enviando relatório de erro...');
        
        try {
          const userContext = await getUserContext();
          const success = await sendErrorReport(details, userContext);
          
          toast.dismiss(loadingToast);
          
          if (success) {
            toast.success('Erro reportado com sucesso!', {
              description: 'Nossa equipe foi notificada e analisará o problema.',
              duration: 5000,
            });
          } else {
            toast.error('Não foi possível enviar o relatório', {
              description: 'Tente novamente ou copie as informações manualmente.',
            });
          }
        } catch (e) {
          toast.dismiss(loadingToast);
          toast.error('Falha ao enviar relatório');
        }
      },
    },
  });
  
  return details;
}

// Specific error reporters for common scenarios
export const SurveyErrors = {
  initFailed: (error?: unknown) => 
    reportError('SURVEY', 'Erro ao iniciar pesquisa', 'survey_init', error),
  
  saveFailed: (questionKey?: string, error?: unknown) => 
    reportError('SURVEY', 'Erro ao salvar resposta', `save_${questionKey || 'unknown'}`, error),
  
  submitFailed: (error?: unknown) => 
    reportError('SURVEY', 'Erro ao enviar pesquisa', 'survey_submit', error),
  
  loadFailed: (error?: unknown) => 
    reportError('SURVEY', 'Erro ao carregar pesquisa', 'survey_load', error),
  
  noSurveyId: () => 
    reportError('SURVEY', 'ID da pesquisa não encontrado', 'missing_survey_id'),
};

export const GalleryErrors = {
  loadFailed: (galleryId?: string, error?: unknown) => 
    reportError('GALLERY', 'Erro ao carregar galeria', `gallery_${galleryId || 'unknown'}`, error),
  
  uploadFailed: (filename?: string, error?: unknown) => 
    reportError('UPLOAD', 'Erro ao fazer upload', `upload_${filename || 'unknown'}`, error),
};

export const AuthErrors = {
  sessionExpired: () => 
    reportError('AUTH', 'Sessão expirada. Faça login novamente.', 'session_expired'),
  
  unauthorized: (action?: string) => 
    reportError('AUTH', 'Ação não autorizada', `unauthorized_${action || 'unknown'}`),
};

export const DatabaseErrors = {
  queryFailed: (table?: string, error?: unknown) => 
    reportError('DB', 'Erro ao buscar dados', `query_${table || 'unknown'}`, error),
  
  insertFailed: (table?: string, error?: unknown) => 
    reportError('DB', 'Erro ao salvar dados', `insert_${table || 'unknown'}`, error),
  
  updateFailed: (table?: string, error?: unknown) => 
    reportError('DB', 'Erro ao atualizar dados', `update_${table || 'unknown'}`, error),
};
