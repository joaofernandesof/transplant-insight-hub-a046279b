import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d75807d51df7446daac336166617be60',
  appName: 'NeoHub',
  webDir: 'dist',
  
  // Hot-reload via preview do Lovable
  server: {
    url: 'https://d75807d5-1df7-446d-aac3-36166617be60.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'alert']
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false
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
    allowsLinkPreview: false,
  },
  
  android: {
    allowMixedContent: false,
    backgroundColor: '#0f172a',
    appendUserAgent: 'NeoHubApp',
    webContentsDebuggingEnabled: false
  }
};

export default config;
