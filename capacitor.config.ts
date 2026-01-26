import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d75807d51df7446daac336166617be60',
  appName: 'NeoHub',
  webDir: 'dist',
  server: {
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
    }
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'NeoHub'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
