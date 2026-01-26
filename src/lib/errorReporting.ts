/**
 * Centralized Error Reporting System
 * Generates unique error codes and descriptive messages for debugging
 */

interface ErrorDetails {
  code: string;
  message: string;
  context?: string;
  timestamp: string;
  originalError?: string;
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

export function reportError(
  prefix: keyof typeof ERROR_PREFIXES,
  message: string,
  context?: string,
  originalError?: unknown
): ErrorDetails {
  const details = createErrorDetails(prefix, message, context, originalError);
  
  // Show toast with error code
  toast.error(details.message, {
    description: `Código: ${details.code}`,
    duration: 8000, // Keep visible longer so user can screenshot
    action: {
      label: 'Copiar',
      onClick: () => {
        navigator.clipboard.writeText(
          `Erro: ${details.message}\nCódigo: ${details.code}\nHorário: ${details.timestamp}\nDetalhes: ${details.originalError || 'N/A'}`
        );
        toast.success('Informações copiadas!');
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
