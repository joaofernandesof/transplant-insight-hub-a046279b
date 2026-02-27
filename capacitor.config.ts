import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d75807d51df7446daac336166617be60',
  appName: 'NeoHub',
  webDir: 'dist',
  
  // Hot-reload via preview do Lovable (desenvolvimento)
  // Comente o bloco "server" abaixo para build de produção (APK/AAB)
  server: {
    url: 'https://d75807d5-1df7-446d-aac3-36166617be60.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    App: {},
    NativeBiometric: {
      useFallback: true,
    }
  },
  
  ios: {
    contentInset: 'automatic',
    scheme: 'NeoHub',
    preferredContentMode: 'mobile',
    allowsLinkPreview: true,
  },
  
  android: {
    allowMixedContent: false,
    backgroundColor: '#0f172a'
  }
};

export default config;
