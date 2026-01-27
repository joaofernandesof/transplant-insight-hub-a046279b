// ============================================
// useMobileEnvironment - Detecção de Ambiente Mobile
// ============================================
// Detecta se o app está rodando em ambiente Capacitor (mobile nativo)
// e fornece helpers para controle de recursos

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

export interface MobileEnvironment {
  /** Se está rodando em ambiente Capacitor (app nativo) */
  isNative: boolean;
  /** Plataforma atual ('ios', 'android', 'web') */
  platform: 'ios' | 'android' | 'web';
  /** Se está em modo de submissão para stores (produção mobile) */
  isStoreMode: boolean;
  /** Se deve bloquear módulos sensíveis */
  shouldBlockSensitiveModules: boolean;
}

/**
 * Hook para detectar ambiente mobile e controlar recursos
 */
export function useMobileEnvironment(): MobileEnvironment {
  const [environment, setEnvironment] = useState<MobileEnvironment>(() => ({
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform() as 'ios' | 'android' | 'web',
    isStoreMode: false,
    shouldBlockSensitiveModules: false,
  }));

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
    
    // Em ambiente nativo, sempre ativar modo store para primeira versão
    const isStoreMode = isNative;
    
    // Bloquear módulos sensíveis em ambiente nativo
    const shouldBlockSensitiveModules = isNative;

    setEnvironment({
      isNative,
      platform,
      isStoreMode,
      shouldBlockSensitiveModules,
    });
  }, []);

  return environment;
}

/**
 * Verifica se a plataforma atual é nativa (iOS ou Android)
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Retorna a plataforma atual
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}

/**
 * Lista de módulos bloqueados no ambiente mobile (primeira versão)
 */
export const BLOCKED_MOBILE_MODULES = [
  'neocare',
  'neocare_appointments',
  'neocare_documents',
  'neocare_history',
  'neocare_profile',
  'neoteam',
  'neoteam_schedule',
  'neoteam_patients',
  'neoteam_waiting_room',
  'neoteam_documents',
  'clinic',
  'prontuario',
  'anamnese',
  'document_upload',
  'marketplace',
  'postvenda',
] as const;

/**
 * Lista de rotas bloqueadas no ambiente mobile
 */
export const BLOCKED_MOBILE_ROUTES = [
  '/neocare',
  '/neoteam',
  '/clinic',
  '/prontuario',
  '/anamnese',
  '/marketplace',
  '/postvenda',
  '/portal',
] as const;

/**
 * Verifica se um módulo está bloqueado no mobile
 */
export function isModuleBlockedOnMobile(moduleCode: string): boolean {
  if (!isNativePlatform()) return false;
  return BLOCKED_MOBILE_MODULES.includes(moduleCode as any);
}

/**
 * Verifica se uma rota está bloqueada no mobile
 */
export function isRouteBlockedOnMobile(route: string): boolean {
  if (!isNativePlatform()) return false;
  return BLOCKED_MOBILE_ROUTES.some(blocked => route.startsWith(blocked));
}

export default useMobileEnvironment;
