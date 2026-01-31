import type { CapacitorConfig } from '@capacitor/cli';

// Determina se estamos em ambiente de produção
const isProduction = process.env.NODE_ENV === 'production';

const config: CapacitorConfig = {
  appId: 'app.lovable.d75807d51df7446daac336166617be60',
  appName: 'NeoHub',
  webDir: 'dist',
  
  // Em produção: apontar para URL publicada
  // Em desenvolvimento: apontar para preview do Lovable
  server: isProduction ? {
    // URL de produção - alterar quando publicar
    url: 'https://transplant-insight-hub.lovable.app',
    cleartext: false
  } : {
    // URL de desenvolvimento (hot-reload)
    url: 'https://d75807d5-1df7-446d-aac3-36166617be60.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0d9488',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    // Configuração de Deep Links
    App: {
      // Universal Links (iOS) e App Links (Android)
      // Configurar no Info.plist e AndroidManifest.xml
    },
    // Configuração de Biometria (Face ID / Touch ID)
    NativeBiometric: {
      // Permite fallback para senha do dispositivo
      useFallback: true,
    }
  },
  
  ios: {
    contentInset: 'automatic',
    scheme: 'NeoHub',
    // Configuração para App Store
    preferredContentMode: 'mobile'
  },
  
  android: {
    allowMixedContent: false, // Segurança: desabilitar em produção
    // Configuração para Play Store
    backgroundColor: '#0d9488'
  }
};

export default config;
