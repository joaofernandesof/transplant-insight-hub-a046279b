/**
 * Hook para autenticação biométrica (Face ID / Touch ID)
 * Utiliza capacitor-native-biometric para integração nativa
 */

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';

const CREDENTIALS_SERVER = 'app.neohub.biometric';

export interface BiometricState {
  isAvailable: boolean;
  biometryType: BiometryType | null;
  biometryName: string;
  hasCredentials: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useBiometricAuth() {
  const [state, setState] = useState<BiometricState>({
    isAvailable: false,
    biometryType: null,
    biometryName: '',
    hasCredentials: false,
    isLoading: true,
    error: null,
  });

  // Verifica disponibilidade da biometria
  const checkAvailability = useCallback(async () => {
    // Biometria só funciona em ambiente nativo
    if (!Capacitor.isNativePlatform()) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        isAvailable: false,
        biometryName: ''
      }));
      return;
    }

    try {
      const result = await NativeBiometric.isAvailable();
      
      let biometryName = 'Biometria';
      if (result.biometryType === BiometryType.FACE_ID) {
        biometryName = 'Face ID';
      } else if (result.biometryType === BiometryType.TOUCH_ID) {
        biometryName = 'Touch ID';
      } else if (result.biometryType === BiometryType.FINGERPRINT) {
        biometryName = 'Impressão Digital';
      } else if (result.biometryType === BiometryType.FACE_AUTHENTICATION) {
        biometryName = 'Reconhecimento Facial';
      } else if (result.biometryType === BiometryType.IRIS_AUTHENTICATION) {
        biometryName = 'Reconhecimento de Íris';
      }

      // Verifica se existem credenciais salvas
      let hasCredentials = false;
      try {
        const credentials = await NativeBiometric.getCredentials({
          server: CREDENTIALS_SERVER,
        });
        hasCredentials = !!(credentials?.username && credentials?.password);
      } catch {
        // Sem credenciais salvas
        hasCredentials = false;
      }

      setState({
        isAvailable: result.isAvailable,
        biometryType: result.biometryType,
        biometryName,
        hasCredentials,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('[Biometric] Error checking availability:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isAvailable: false,
        error: error?.message || 'Erro ao verificar biometria',
      }));
    }
  }, []);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Salva credenciais para login biométrico
  const saveCredentials = useCallback(async (email: string, password: string) => {
    if (!Capacitor.isNativePlatform()) return false;
    
    try {
      await NativeBiometric.setCredentials({
        username: email,
        password: password,
        server: CREDENTIALS_SERVER,
      });
      
      setState(prev => ({ ...prev, hasCredentials: true }));
      return true;
    } catch (error: any) {
      console.error('[Biometric] Error saving credentials:', error);
      return false;
    }
  }, []);

  // Remove credenciais salvas
  const deleteCredentials = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return false;
    
    try {
      await NativeBiometric.deleteCredentials({
        server: CREDENTIALS_SERVER,
      });
      
      setState(prev => ({ ...prev, hasCredentials: false }));
      return true;
    } catch (error: any) {
      console.error('[Biometric] Error deleting credentials:', error);
      return false;
    }
  }, []);

  // Realiza autenticação biométrica e retorna credenciais
  const authenticate = useCallback(async (): Promise<{ email: string; password: string } | null> => {
    if (!Capacitor.isNativePlatform() || !state.isAvailable) {
      return null;
    }

    try {
      // Primeiro verifica identidade biométrica
      await NativeBiometric.verifyIdentity({
        reason: 'Confirme sua identidade para fazer login',
        title: 'Login com ' + state.biometryName,
        subtitle: 'NeoHub',
        description: 'Use sua biometria para acessar sua conta de forma rápida e segura.',
        useFallback: true,
        fallbackTitle: 'Usar senha do dispositivo',
        maxAttempts: 3,
      });

      // Se a verificação passou, obtém as credenciais
      const credentials = await NativeBiometric.getCredentials({
        server: CREDENTIALS_SERVER,
      });

      if (credentials?.username && credentials?.password) {
        return {
          email: credentials.username,
          password: credentials.password,
        };
      }

      return null;
    } catch (error: any) {
      console.error('[Biometric] Authentication failed:', error);
      
      // Não é erro se o usuário cancelou
      if (error?.code === 'BIOMETRIC_CANCELED' || error?.message?.includes('cancel')) {
        return null;
      }
      
      setState(prev => ({
        ...prev,
        error: 'Falha na autenticação biométrica',
      }));
      return null;
    }
  }, [state.isAvailable, state.biometryName]);

  return {
    ...state,
    authenticate,
    saveCredentials,
    deleteCredentials,
    refresh: checkAvailability,
  };
}
